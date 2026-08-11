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

/** 管理全局确认请求和短暂操作反馈，确保交互结果可预测地收束。 */
export const useUiStore = defineStore('ui', () => {
  const confirmation = ref<ConfirmOptions | null>(null)
  const toasts = ref<ToastMessage[]>([])
  const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()
  let resolveConfirmation: ((confirmed: boolean) => void) | undefined

  /** 展示确认弹窗；新请求会先取消旧请求，避免调用方永久等待。 */
  function confirm(options: ConfirmOptions): Promise<boolean> {
    settleConfirmation(false)
    if (options.tone === 'danger' && !hasSpecificChineseAction(options.confirmText)) {
      return Promise.reject(new Error('危险确认必须提供具体中文动作文案。'))
    }

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

  /** 判断危险操作文案是否避开“确定”等泛化表达，便于用户识别真实后果。 */
  function hasSpecificChineseAction(label: string): boolean {
    const action = label.trim()
    return action.length >= 2 && action !== '确定' && action !== '确认' && /\p{Script=Han}/u.test(action)
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
