import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getLocalDateKey } from '@/services/localDate'
import {
  loadPersistedState,
  PERSISTENCE_VERSION,
  savePersistedState,
  type SaveResult,
} from '@/services/persistence'
import type {
  Account,
  AccountDraft,
  PersistedState,
  Shop,
  ShopCategory,
  ShopDraft,
} from '@/types/domain'

const WAIT_DURATION_MS = 5 * 60 * 1000

/** 提供师门账号、商会店铺和持久化生命周期的领域状态。 */
export const useToolStore = defineStore('tool', () => {
  const loaded = loadPersistedState()
  const activeDate = ref(loaded.state.activeDate)
  const accounts = ref<Account[]>(loaded.state.accounts)
  const shops = ref<Shop[]>(loaded.state.shops)
  const loadWarning = ref<string | null>(loaded.warning)
  const lastSaveResult = ref<SaveResult | null>(null)
  let pendingCorruptBackup = loaded.recovery

  /** 新增账号并返回包含系统字段的领域对象。 */
  function addAccount(draft: AccountDraft): Account {
    normalizeAccountOrders()
    const account: Account = {
      id: crypto.randomUUID(),
      name: draft.name,
      note: draft.note,
      order: accounts.value.length,
      status: 'idle',
      accumulatedMs: 0,
      startedAt: null,
      waitingUntil: null,
    }
    accounts.value.push(account)
    return account
  }

  /** 仅更新账号可编辑资料，不允许覆盖系统计时字段。 */
  function updateAccount(id: string, draft: AccountDraft): boolean {
    const account = findAccount(id)
    if (account === undefined) return false
    account.name = draft.name
    account.note = draft.note
    return true
  }

  /** 删除账号并重新压实剩余账号顺序。 */
  function removeAccount(id: string): boolean {
    const originalLength = accounts.value.length
    accounts.value = accounts.value.filter((account) => account.id !== id)
    normalizeAccountOrders()
    return accounts.value.length !== originalLength
  }

  /** 按传入 ID 顺序重排账号，缺失项保留原相对顺序并重新编号。 */
  function reorderAccounts(ids: readonly string[]): void {
    accounts.value = reorderByIds(accounts.value, ids)
    accounts.value.forEach((account, order) => {
      account.order = order
    })
  }

  /** 启动未开始、暂停或已到期账号的有效计时。 */
  function startAccount(id: string, now: number): boolean {
    if (!isValidNow(now)) return false
    const account = findAccount(id)
    if (account === undefined || !['idle', 'paused', 'ready'].includes(account.status)) return false
    account.status = 'running'
    account.startedAt = now
    account.waitingUntil = null
    return true
  }

  /** 暂停运行账号并结算本次有效计时区间。 */
  function pauseAccount(id: string, now: number): boolean {
    if (!isValidNow(now)) return false
    const account = findAccount(id)
    if (account === undefined || account.status !== 'running') return false
    if (!settleRunningAccount(account, now)) return false
    account.status = 'paused'
    return true
  }

  /** 结算运行账号并进入固定五分钟的高价值等待。 */
  function waitAccount(id: string, now: number): boolean {
    const waitingUntil = now + WAIT_DURATION_MS
    if (!isValidNow(now) || !isValidNow(waitingUntil)) return false
    const account = findAccount(id)
    if (account === undefined || account.status !== 'running') return false
    if (!settleRunningAccount(account, now)) return false
    account.status = 'waiting'
    account.waitingUntil = waitingUntil
    return true
  }

  /** 完成可操作账号，运行账号会先结算当前计时区间。 */
  function completeAccount(id: string, now: number): boolean {
    if (!isValidNow(now)) return false
    const account = findAccount(id)
    if (account === undefined || !['running', 'paused', 'ready'].includes(account.status)) return false
    if (!settleRunningAccount(account, now)) return false
    account.status = 'completed'
    account.startedAt = null
    account.waitingUntil = null
    return true
  }

  /** 撤销完成并回到暂停状态，保留已结算有效耗时。 */
  function reopenAccount(id: string): boolean {
    const account = findAccount(id)
    if (account === undefined || account.status !== 'completed') return false
    account.status = 'paused'
    return true
  }

  /** 将本轮刚到期的等待账号切为就绪，并返回这些账号 ID。 */
  function expireWaits(now: number): string[] {
    if (!isValidNow(now)) return []
    const expiredIds: string[] = []
    for (const account of accounts.value) {
      if (
        account.status === 'waiting' &&
        account.waitingUntil !== null &&
        account.waitingUntil <= now
      ) {
        account.status = 'ready'
        account.waitingUntil = null
        expiredIds.push(account.id)
      }
    }
    return expiredIds
  }

  /** 确保状态属于当前本地自然日，跨日时执行每日重置。 */
  function ensureCurrentDate(now: number): boolean {
    if (!isValidNow(now)) return false
    const dateKey = getLocalDateKey(new Date(now))
    if (activeDate.value === dateKey) return false
    return resetDailyProgress(now)
  }

  /** 清空所有账号的当日进度，并记录目标时刻所属的本地自然日。 */
  function resetDailyProgress(now: number): boolean {
    if (!isValidNow(now)) return false
    activeDate.value = getLocalDateKey(new Date(now))
    for (const account of accounts.value) {
      account.status = 'idle'
      account.accumulatedMs = 0
      account.startedAt = null
      account.waitingUntil = null
    }
    return true
  }

  /** 结算全部运行账号到当前时刻，并从当前时刻继续运行。 */
  function checkpointRunning(now: number): void {
    if (!isValidNow(now)) return
    const checkpoints: { account: Account; accumulatedMs: number }[] = []
    for (const account of accounts.value) {
      if (account.status !== 'running') continue
      const accumulatedMs = getSettledAccumulatedMs(account, now)
      if (accumulatedMs === null) return
      checkpoints.push({ account, accumulatedMs })
    }

    for (const { account, accumulatedMs } of checkpoints) {
      account.accumulatedMs = accumulatedMs
      account.startedAt = now
    }
    if (checkpoints.length > 0) persistState()
  }

  /** 按实时有效耗时和账号顺序返回当前推荐账号，不修改状态。 */
  function getRecommendedAccount(now: number): Account | null {
    if (!isValidNow(now)) return null
    const candidates = accounts.value.filter(
      ({ status }) => status !== 'completed' && status !== 'waiting',
    )
    candidates.sort((left, right) => {
      const elapsedDifference = getEffectiveElapsedMs(left, now) - getEffectiveElapsedMs(right, now)
      return elapsedDifference || left.order - right.order
    })
    return candidates[0] ?? null
  }

  /** 新增店铺并在所属分类末尾分配连续顺序。 */
  function addShop(draft: ShopDraft): Shop {
    normalizeShopOrders(draft.category)
    const shop: Shop = {
      id: crypto.randomUUID(),
      category: draft.category,
      number: draft.number,
      name: draft.name,
      items: [...draft.items],
      note: draft.note,
      order: getShopsByCategory(draft.category).length,
    }
    shops.value.push(shop)
    return shop
  }

  /** 更新店铺资料，跨分类时同时重新压实新旧分类顺序。 */
  function updateShop(id: string, draft: ShopDraft): boolean {
    const shop = shops.value.find((candidate) => candidate.id === id)
    if (shop === undefined) return false
    const previousCategory = shop.category
    const nextOrder =
      draft.category === previousCategory ? shop.order : getShopsByCategory(draft.category).length
    shop.category = draft.category
    shop.number = draft.number
    shop.name = draft.name
    shop.items = [...draft.items]
    shop.note = draft.note
    shop.order = nextOrder
    normalizeShopOrders(previousCategory)
    if (draft.category !== previousCategory) normalizeShopOrders(draft.category)
    return true
  }

  /** 删除店铺并重新压实所属分类顺序。 */
  function removeShop(id: string): boolean {
    const shop = shops.value.find((candidate) => candidate.id === id)
    if (shop === undefined) return false
    shops.value = shops.value.filter((candidate) => candidate.id !== id)
    normalizeShopOrders(shop.category)
    return true
  }

  /** 在指定分类内按 ID 重排店铺，并重新编号该分类顺序。 */
  function reorderShops(category: ShopCategory, ids: readonly string[]): void {
    const reordered = reorderByIds(getShopsByCategory(category), ids)
    reordered.forEach((shop, order) => {
      shop.order = order
    })
  }

  /** 按 ID 查找账号。 */
  function findAccount(id: string): Account | undefined {
    return accounts.value.find((account) => account.id === id)
  }

  /** 结算账号本次运行区间；非法时间或数值溢出时拒绝修改。 */
  function settleRunningAccount(account: Account, now: number): boolean {
    const accumulatedMs = getSettledAccumulatedMs(account, now)
    if (accumulatedMs === null) return false
    if (account.status !== 'running' || account.startedAt === null) return true
    account.accumulatedMs = accumulatedMs
    account.startedAt = null
    return true
  }

  /** 计算结算后的累计耗时，并拒绝非法时间或溢出结果。 */
  function getSettledAccumulatedMs(account: Account, now: number): number | null {
    if (!isValidNow(now) || !isNonNegativeFiniteNumber(account.accumulatedMs)) return null
    if (account.status !== 'running' || account.startedAt === null) return account.accumulatedMs
    if (!isValidNow(account.startedAt)) return null
    const accumulatedMs = account.accumulatedMs + Math.max(0, now - account.startedAt)
    return isNonNegativeFiniteNumber(accumulatedMs) ? accumulatedMs : null
  }

  /** 计算账号在指定时刻的实时有效耗时。 */
  function getEffectiveElapsedMs(account: Account, now: number): number {
    return getSettledAccumulatedMs(account, now) ?? Number.MAX_VALUE
  }

  /** 判断未知数值是否为可安全持久化的非负有限数。 */
  function isNonNegativeFiniteNumber(value: number): boolean {
    return Number.isFinite(value) && value >= 0
  }

  /** 判断当前时间是否为浏览器日期可表达的非负有限时间戳。 */
  function isValidNow(now: number): boolean {
    return isNonNegativeFiniteNumber(now) && !Number.isNaN(new Date(now).getTime())
  }

  /** 依据当前 order 排序并把账号顺序规范为从零开始的连续整数。 */
  function normalizeAccountOrders(): void {
    accounts.value.sort((left, right) => left.order - right.order)
    accounts.value.forEach((account, order) => {
      account.order = order
    })
  }

  /** 依据当前 order 排序并把指定分类顺序规范为连续整数。 */
  function normalizeShopOrders(category: ShopCategory): void {
    getShopsByCategory(category)
      .sort((left, right) => left.order - right.order)
      .forEach((shop, order) => {
        shop.order = order
      })
  }

  /** 返回指定分类的店铺引用集合。 */
  function getShopsByCategory(category: ShopCategory): Shop[] {
    return shops.value.filter((shop) => shop.category === category)
  }

  /** 按外部 ID 序列重排实体，重复、未知和缺失 ID 均安全收敛。 */
  function reorderByIds<T extends { id: string; order: number }>(
    values: readonly T[],
    ids: readonly string[],
  ): T[] {
    const byId = new Map(values.map((value) => [value.id, value]))
    const seen = new Set<string>()
    const reordered: T[] = []

    for (const id of ids) {
      const value = byId.get(id)
      if (value !== undefined && !seen.has(id)) {
        reordered.push(value)
        seen.add(id)
      }
    }
    for (const value of [...values].sort((left, right) => left.order - right.order)) {
      if (!seen.has(value.id)) reordered.push(value)
    }
    return reordered
  }

  /** 组装唯一允许写入本地存储的领域状态。 */
  function toPersistedState(): PersistedState {
    return {
      version: PERSISTENCE_VERSION,
      activeDate: activeDate.value,
      accounts: accounts.value,
      shops: shops.value,
    }
  }

  /** 持久化当前领域状态，并公开最近一次保存结果。 */
  function persistState(): SaveResult {
    const result = savePersistedState(toPersistedState(), pendingCorruptBackup)
    if (result.ok) pendingCorruptBackup = null
    lastSaveResult.value = result
    return result
  }

  normalizeAccountOrders()
  for (const category of ['medicine', 'furniture', 'summon', 'cooking'] as const) {
    normalizeShopOrders(category)
  }
  ensureCurrentDate(Date.now())
  persistState()

  watch([activeDate, accounts, shops], persistState, { deep: true })

  return {
    activeDate,
    accounts,
    shops,
    loadWarning,
    lastSaveResult,
    addAccount,
    updateAccount,
    removeAccount,
    reorderAccounts,
    startAccount,
    pauseAccount,
    waitAccount,
    completeAccount,
    reopenAccount,
    expireWaits,
    ensureCurrentDate,
    resetDailyProgress,
    checkpointRunning,
    getRecommendedAccount,
    addShop,
    updateShop,
    removeShop,
    reorderShops,
  }
})
