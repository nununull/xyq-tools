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
  confirmLabel?: string
}

interface DangerousConfirmOptions extends ConfirmOptionsBase {
  tone: 'danger'
  /** 危险操作必须传入具体中文动作，例如“删除账号”或“清空今日记录”。 */
  confirmLabel: string
}

export type ConfirmOptions = StandardConfirmOptions | DangerousConfirmOptions

export interface ToastMessage {
  id: string
  message: string
  tone: ToastTone
}

const TOAST_DURATION_MS = 5_000
const MAX_TOAST_COUNT = 3
const DESTRUCTIVE_ACTION_PATTERN = /删除|清空|重置|移除|放弃|注销|解除|覆盖|丢弃|终止|停用|撤销/u

/** 管理全局确认请求和短暂操作反馈，确保交互结果可预测地收束。 */
export const useUiStore = defineStore('ui', () => {
  const confirmation = ref<ConfirmOptions | null>(null)
  const toasts = ref<ToastMessage[]>([])
  const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()
  let resolveConfirmation: ((confirmed: boolean) => void) | undefined

  /** 展示确认弹窗；新请求会先取消旧请求，避免调用方永久等待。 */
  function confirm(options: ConfirmOptions): Promise<boolean> {
    if (!isValidConfirmOptions(options)) {
      return Promise.reject(new Error('危险确认按钮必须包含明确动作，例如“删除账号”或“清空记录”。'))
    }
    settleConfirmation(false)

    return new Promise<boolean>((resolve) => {
      confirmation.value = options
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

  /** 判断危险按钮文案是否明确包含会改变或损失数据的动作。 */
  function hasDestructiveAction(label: string): boolean {
    const action = label.replace(/[\s\p{P}\p{S}]/gu, '')
    return DESTRUCTIVE_ACTION_PATTERN.test(action)
  }

  /** 在变更当前请求前完整校验新请求，避免无效危险操作打断已有确认。 */
  function isValidConfirmOptions(options: ConfirmOptions): boolean {
    return options.tone !== 'danger' || hasDestructiveAction(options.confirmLabel)
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
