import { defineStore } from 'pinia'
import { ref, watch, type WatchStopHandle } from 'vue'
import { loadCloudState, saveCloudState } from '@/services/cloudPersistence'
import { clearGuestPersistedState, createDefaultPersistedState, loadPersistedState, savePersistedState } from '@/services/persistence'
import { clearSyncCache, loadSyncCache, saveSyncCache } from '@/services/syncCache'
import { useAuthStore } from './useAuthStore'
import { useToolStore } from './useToolStore'

export type SyncStatus = 'initializing' | 'local' | 'syncing' | 'synced' | 'pending' | 'error'
export interface SignOutResult { ok: boolean; requiresForce?: boolean; message?: string }

/** 协调游客本地存储、云端快照和用户隔离待同步缓存。 */
export const usePersistenceStore = defineStore('persistence', () => {
  const initialized = ref(false)
  const mode = ref<'guest' | 'cloud'>('guest')
  const syncStatus = ref<SyncStatus>('initializing')
  const syncMessage = ref('正在初始化数据')
  const authStore = useAuthStore()
  const toolStore = useToolStore()
  let stopWatch: WatchStopHandle | null = null
  let stopIdentityWatch: WatchStopHandle | null = null
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let flushPromise: Promise<void> | null = null
  let isHydrating = false

  /** 确定认证身份和唯一数据源后才开放业务编辑。 */
  async function initialize(): Promise<void> {
    try {
      await authStore.initialize()
      const userId = authStore.user?.id
      if (userId === undefined) loadGuest()
      else await loadCloud(userId)
      registerListeners()
      initialized.value = true
    } catch (error: unknown) {
      syncStatus.value = 'error'; syncMessage.value = `数据初始化失败：${getErrorMessage(error)}`
    }
  }

  /** 加载游客本地状态并进入本地模式。 */
  function loadGuest(): void {
    const loaded = loadPersistedState()
    hydrate(loaded.state, loaded.warning)
    mode.value = 'guest'; syncStatus.value = 'local'; syncMessage.value = '本地模式'
  }

  /** 加载云端状态；无快照时安全迁移游客数据。 */
  async function loadCloud(userId: string): Promise<void> {
    mode.value = 'cloud'
    const cloud = await loadCloudState(userId)
    const cache = loadSyncCache(userId)
    if (cloud.found) {
      hydrate(cloud.state)
      const cleared = clearGuestPersistedState()
      if (!cleared.ok) throw new Error(cleared.message)
      syncStatus.value = cache === null ? 'synced' : 'pending'
      syncMessage.value = cache === null ? '云端已同步' : '等待同步'
      if (cache !== null) { hydrate(cache.state); void flush() }
      return
    }
    const guest = loadPersistedState()
    hydrate(guest.state, guest.warning)
    if (cache === null) saveSyncCache(userId, guest.state)
    await flush()
    if (loadSyncCache(userId) === null) {
      const cleared = clearGuestPersistedState()
      if (!cleared.ok) throw new Error(cleared.message)
    }
  }

  /** 替换领域状态时阻止深度监听产生反向写入。 */
  function hydrate(state: ReturnType<typeof toolStore.snapshot>, warning: string | null = null): void {
    isHydrating = true; toolStore.hydrate(state, warning); isHydrating = false
  }

  /** 根据当前身份保存游客数据或排队云同步。 */
  function queueSave(): void {
    if (!initialized.value || isHydrating) return
    const userId = authStore.user?.id
    if (userId === undefined || mode.value === 'guest') {
      toolStore.lastSaveResult = savePersistedState(toolStore.snapshot(), null)
      return
    }
    saveSyncCache(userId, toolStore.snapshot())
    syncStatus.value = 'pending'; syncMessage.value = '等待同步'
    if (saveTimer !== null) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void flush(), 300)
  }

  /** 串行提交最新缓存，按修订号清理并继续追赶新修改。 */
  function flush(): Promise<void> {
    if (flushPromise !== null) return flushPromise
    flushPromise = flushLatest().finally(() => { flushPromise = null })
    return flushPromise
  }

  /** 执行实际同步循环，失败时保留缓存等待下次事件重试。 */
  async function flushLatest(): Promise<void> {
    const userId = authStore.user?.id
    if (userId === undefined) return
    try {
      let entry = loadSyncCache(userId)
      while (entry !== null) {
        syncStatus.value = 'syncing'; syncMessage.value = '正在同步'
        await saveCloudState(userId, entry.state)
        clearSyncCache(userId, entry.revision)
        entry = loadSyncCache(userId)
      }
      syncStatus.value = 'synced'; syncMessage.value = '云端已同步'
    } catch (error: unknown) {
      syncStatus.value = 'error'; syncMessage.value = `同步失败：${getErrorMessage(error)}`
    }
  }

  /** 先尝试补传；需要强制退出时保留用户缓存并创建空白游客空间。 */
  async function requestSignOut(force = false): Promise<SignOutResult> {
    const userId = authStore.user?.id
    if (userId !== undefined && loadSyncCache(userId) !== null && !force) {
      await flush()
      if (loadSyncCache(userId) !== null) return { ok: false, requiresForce: true, message: '仍有修改未同步' }
    }
    await authStore.signOut()
    const blank = createDefaultPersistedState(); hydrate(blank); savePersistedState(blank, null)
    mode.value = 'guest'; syncStatus.value = 'local'; syncMessage.value = '本地模式'
    return { ok: true }
  }

  /** 注册领域保存和有限浏览器重试事件。 */
  function registerListeners(): void {
    stopWatch = watch(() => [toolStore.activeDate, toolStore.accounts, toolStore.shops], queueSave, { deep: true })
    stopIdentityWatch = watch(() => authStore.user?.id ?? null, switchIdentity)
    window.addEventListener('online', retryVisible); window.addEventListener('focus', retryVisible)
    document.addEventListener('visibilitychange', retryVisible)
  }

  /** 认证身份变化后重新选择数据源，登录用户绝不沿用游客内存状态。 */
  async function switchIdentity(userId: string | null): Promise<void> {
    if (userId === null) return
    initialized.value = false; syncStatus.value = 'initializing'; syncMessage.value = '正在初始化云端数据'
    try { await loadCloud(userId); initialized.value = true }
    catch (error: unknown) { syncStatus.value = 'error'; syncMessage.value = `数据初始化失败：${getErrorMessage(error)}` }
  }

  /** 页面可见且身份一致时尝试补传。 */
  function retryVisible(): void {
    const userId = authStore.user?.id
    if (document.visibilityState === 'visible' && userId !== undefined && loadSyncCache(userId) !== null) void flush()
  }

  /** 清理监听、计时器和认证资源。 */
  function dispose(): void {
    stopWatch?.(); stopWatch = null
    stopIdentityWatch?.(); stopIdentityWatch = null
    if (saveTimer !== null) clearTimeout(saveTimer)
    window.removeEventListener('online', retryVisible); window.removeEventListener('focus', retryVisible)
    document.removeEventListener('visibilitychange', retryVisible); authStore.dispose()
  }

  /** 把未知异常转换成界面可读文本。 */
  function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error) }

  return { initialized, mode, syncStatus, syncMessage, initialize, queueSave, flush, requestSignOut, dispose }
})
