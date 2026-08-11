import { defineStore } from 'pinia'
import { onScopeDispose, ref } from 'vue'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

interface ConfirmOptionsBase {
  title: string
  description?: string
  cancelText?: string
}

interface StandardConfirmOptions extends ConfirmOptionsBase {
  tone?: 'default'
  confirmText?: string
}

interface DangerousConfirmOptions extends ConfirmOptionsBase {
  tone: 'danger'
  /** 危险操作必须传入具体中文动作，例如“删除账号”或“清空今日记录”。 */
  confirmText: string
}

export type ConfirmOptions = StandardConfirmOptions | DangerousConfirmOptions

export interface ToastMessage {
  id: string
  message: string
  tone: ToastTone
}

const TOAST_DURATION_MS = 5_000
const MAX_TOAST_COUNT = 3
const DEFAULT_DANGEROUS_CONFIRM_TEXT = '执行危险操作'
const GENERIC_CONFIRMATION_PATTERN = /^(确定|确认)(?:操作|一下|即可|好了|好)?[吗吧呀啊呢哦喔哟呦啦的哈]*$/u

/** 管理全局确认请求和短暂操作反馈，确保交互结果可预测地收束。 */
export const useUiStore = defineStore('ui', () => {
  const confirmation = ref<ConfirmOptions | null>(null)
  const toasts = ref<ToastMessage[]>([])
  const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()
  let resolveConfirmation: ((confirmed: boolean) => void) | undefined

  /** 展示确认弹窗；新请求会先取消旧请求，避免调用方永久等待。 */
  function confirm(options: ConfirmOptions): Promise<boolean> {
    settleConfirmation(false)

    return new Promise<boolean>((resolve) => {
      confirmation.value = normalizeConfirmOptions(options)
      resolveConfirmation = resolve
    })
  }

  /** 结清当前确认请求，重复调用不会重复兑现 Promise。 */
  function settleConfirmation(confirmed: boolean): void {
    const resolve = resolveConfirmation
    resolveConfirmation = undefined
    confirmation.value = null
    resolve?.(confirmed)
  }

  /** 显示一条最多保留五秒的操作反馈。 */
  function toast(message: string, tone: ToastTone = 'info'): void {
    const notification: ToastMessage = {
      id: crypto.randomUUID(),
      message,
      tone,
    }

    while (toasts.value.length >= MAX_TOAST_COUNT) {
      const oldest = toasts.value[0]
      if (oldest === undefined) break
      removeToast(oldest.id)
    }

    toasts.value.push(notification)
    toastTimers.set(
      notification.id,
      setTimeout(() => {
        removeToast(notification.id)
      }, TOAST_DURATION_MS),
    )
  }

  /** 移除指定提示并清理其自动关闭计时器。 */
  function removeToast(id: string): void {
    const timer = toastTimers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      toastTimers.delete(id)
    }
    toasts.value = toasts.value.filter((notification) => notification.id !== id)
  }

  /** 释放所有悬挂交互，供 Pinia 销毁或热更新时调用。 */
  function disposeUiState(): void {
    for (const timer of toastTimers.values()) {
      clearTimeout(timer)
    }
    toastTimers.clear()
    toasts.value = []
    settleConfirmation(false)
  }

  /** 为危险确认降级泛化文案，避免按钮以“确定”等词掩盖真实风险。 */
  function normalizeConfirmOptions(options: ConfirmOptions): ConfirmOptions {
    if (options.tone !== 'danger' || hasSpecificChineseAction(options.confirmText)) return options
    return {
      ...options,
      confirmText: DEFAULT_DANGEROUS_CONFIRM_TEXT,
    }
  }

  /** 判断危险操作文案是否包含具体中文动作，而不是确认语气或泛化操作词。 */
  function hasSpecificChineseAction(label: string): boolean {
    const action = label.replace(/[\s\p{P}]/gu, '')
    return (
      action.length >= 2 &&
      /\p{Script=Han}/u.test(action) &&
      !GENERIC_CONFIRMATION_PATTERN.test(action)
    )
  }

  onScopeDispose(disposeUiState)

  return {
    confirmation,
    toasts,
    confirm,
    settleConfirmation,
    toast,
    removeToast,
  }
})
