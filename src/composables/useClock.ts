import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'
import { useToolStore } from '@/stores/useToolStore'

/** 提供每秒更新的页面时钟，并在页面生命周期边界结算运行账号。 */
export function useClock(onTick?: (now: number) => void): { now: Readonly<Ref<number>> } {
  const now = ref(Date.now())
  const toolStore = useToolStore()
  let intervalId: number | null = null

  /** 刷新当前时间并通知页面处理依赖时钟的业务。 */
  function tick(): void {
    const current = Date.now()
    now.value = current
    onTick?.(current)
  }

  /** 在页面边界立即结算运行区间，防止刷新或后台切换丢失耗时。 */
  function checkpoint(): void {
    toolStore.checkpointRunning(Date.now())
  }

  /** 页面可见性变化时先刷新业务时钟，再建立运行计时检查点。 */
  function handleVisibilityChange(): void {
    tick()
    checkpoint()
  }

  onMounted(() => {
    intervalId = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', checkpoint)
  })

  onBeforeUnmount(() => {
    if (intervalId !== null) window.clearInterval(intervalId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', checkpoint)
  })

  return { now: readonly(now) }
}
