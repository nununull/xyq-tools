import { onMounted, onScopeDispose } from 'vue'

export type NotificationPermissionResult = NotificationPermission | 'unsupported'

const REMINDER_TITLE = '⏰ 账号可切回｜梦幻工具箱'
const NOTE_DURATION_SECONDS = 0.16

/** 提供不依赖系统通知权限的到期提醒，并在能力不可用时安静降级。 */
export function useNotifier(): {
  requestPermission: () => Promise<NotificationPermissionResult>
  notifyReady: (accountName: string) => void
  restoreTitle: () => void
} {
  const originalTitle = document.title
  let audioContext: AudioContext | null = null

  /** 获取可复用的音频上下文；浏览器不支持或构造失败时返回空值。 */
  function getAudioContext(): AudioContext | null {
    if (!('AudioContext' in window)) return null
    try {
      audioContext ??= new AudioContext()
      return audioContext
    } catch {
      return null
    }
  }

  /** 在明确用户手势内解锁音频，并请求系统通知权限。 */
  async function requestPermission(): Promise<NotificationPermissionResult> {
    const context = getAudioContext()
    if (context?.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        // 音频失败不阻止标题和页面提醒继续工作。
      }
    }

    if (!('Notification' in window)) return 'unsupported'
    try {
      return await Notification.requestPermission()
    } catch {
      return Notification.permission
    }
  }

  /** 使用 Web Audio 合成两段短提示音，不加载外部音频资源。 */
  async function playChime(): Promise<void> {
    const context = getAudioContext()
    if (context === null) return

    try {
      if (context.state === 'suspended') await context.resume()
      const startedAt = context.currentTime + 0.02
      for (const [index, frequency] of [659.25, 783.99].entries()) {
        const noteStartedAt = startedAt + index * 0.2
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, noteStartedAt)
        gain.gain.setValueAtTime(0.0001, noteStartedAt)
        gain.gain.exponentialRampToValueAtTime(0.045, noteStartedAt + 0.018)
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          noteStartedAt + NOTE_DURATION_SECONDS,
        )
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(noteStartedAt)
        oscillator.stop(noteStartedAt + NOTE_DURATION_SECONDS)
      }
    } catch {
      // 音频受自动播放策略限制时安静退化，标题提醒仍然有效。
    }
  }

  /** 将页面标题恢复为进入师门页时的标题。 */
  function restoreTitle(): void {
    if (document.title === REMINDER_TITLE) document.title = originalTitle
  }

  /** 发出一次到期提醒；系统通知只在权限已经获准时创建。 */
  function notifyReady(accountName: string): void {
    document.title = REMINDER_TITLE
    void playChime()

    if (!('Notification' in window) || Notification.permission !== 'granted') return
    try {
      const notification = new Notification('账号可切回', {
        body: `${accountName} 的高价值等待已结束。`,
        tag: `sect-mission-ready-${accountName}`,
      })
      notification.onclick = () => {
        window.focus()
        restoreTitle()
        notification.close()
      }
    } catch {
      // 系统通知异常时保留声音、标题和页面内提醒。
    }
  }

  /** 释放页面级监听和音频资源。 */
  function disposeNotifier(): void {
    window.removeEventListener('focus', restoreTitle)
    if (audioContext !== null) void audioContext.close().catch(() => undefined)
    audioContext = null
    restoreTitle()
  }

  onMounted(() => window.addEventListener('focus', restoreTitle))
  onScopeDispose(disposeNotifier)

  return {
    requestPermission,
    notifyReady,
    restoreTitle,
  }
}
