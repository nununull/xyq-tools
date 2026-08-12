import type {
  Account,
  AccountStatus,
  PersistedState,
  Shop,
  ShopCategory,
} from '@/types/domain'
import { getLocalDateKey } from './localDate'

export const PERSISTENCE_KEY = 'xyq-tools:sect-mission:v1'
export const PERSISTENCE_VERSION = 1

const CORRUPT_KEY_PREFIX = 'xyq-tools:sect-mission:corrupt:'
const ACCOUNT_STATUSES: readonly AccountStatus[] = [
  'idle',
  'running',
  'paused',
  'waiting',
  'ready',
  'completed',
]
const SHOP_CATEGORIES: readonly ShopCategory[] = ['medicine', 'furniture', 'summon', 'cooking']

export interface LoadResult {
  state: PersistedState
  warning: string | null
  recovery: PendingCorruptBackup | null
}

export type SaveResult = { ok: true } | { ok: false; message: string }

export interface PendingCorruptBackup {
  readonly raw: string
  readonly backupKey: string
}

/** 创建属于当前本地自然日的空白持久化状态。 */
export function createDefaultPersistedState(now: Date = new Date()): PersistedState {
  return {
    version: PERSISTENCE_VERSION,
    activeDate: getLocalDateKey(now),
    accounts: [],
    shops: [],
  }
}

/** 加载并校验版本化状态，损坏数据会先备份再回退为空白状态。 */
export function loadPersistedState(): LoadResult {
  let raw: string | null

  try {
    raw = localStorage.getItem(PERSISTENCE_KEY)
  } catch (error: unknown) {
    return {
      state: createDefaultPersistedState(),
      warning: `读取本地数据失败：${getErrorMessage(error)}`,
      recovery: null,
    }
  }

  if (raw === null) {
    return { state: createDefaultPersistedState(), warning: null, recovery: null }
  }

  try {
    const parsed = parsePersistedState(JSON.parse(raw))
    return { state: parsed, warning: null, recovery: null }
  } catch (error: unknown) {
    const recovery = createPendingCorruptBackup(raw)
    const backupResult = backupCorruptState(recovery)
    return {
      state: createDefaultPersistedState(),
      warning: backupResult.ok
        ? `本地数据已损坏，已备份到 ${recovery.backupKey} 并恢复为空白状态：${getErrorMessage(error)}`
        : `本地数据已损坏，备份成功前将禁止覆盖原数据：${getErrorMessage(error)}；${backupResult.message}`,
      recovery: backupResult.ok ? null : recovery,
    }
  }
}

/** 迁移并严格解析任意来源的持久化状态，非法数据直接抛错。 */
export function parsePersistedState(value: unknown): PersistedState {
  const migrated = migratePersistedState(value)
  if (!isPersistedState(migrated)) throw new Error('数据结构或版本不受支持')
  return migrated
}

/** 按领域结构复制持久化状态，避免浏览器直接克隆 Vue 响应式代理。 */
export function clonePersistedState(state: PersistedState): PersistedState {
  return {
    version: state.version,
    activeDate: state.activeDate,
    accounts: state.accounts.map((account) => ({ ...account })),
    shops: state.shops.map((shop) => ({ ...shop, items: [...shop.items] })),
  }
}

/** 为旧版账号补齐新增字段，再交给严格校验流程处理。 */
function migratePersistedState(value: unknown): unknown {
  if (!isRecord(value) || value.version !== PERSISTENCE_VERSION || !Array.isArray(value.accounts)) {
    return value
  }

  return {
    ...value,
    accounts: value.accounts.map((account) => {
      if (!isRecord(account)) return account
      return {
        ...account,
        ...('highValueCount' in account ? {} : { highValueCount: 0 }),
        ...('completedAt' in account ? {} : { completedAt: null }),
      }
    }),
  }
}

/** 清除游客业务主键，不触碰损坏备份、认证 Session 或用户同步缓存。 */
export function clearGuestPersistedState(): SaveResult {
  try {
    localStorage.removeItem(PERSISTENCE_KEY)
    return { ok: true }
  } catch (error: unknown) {
    return { ok: false, message: `清除游客数据失败：${getErrorMessage(error)}` }
  }
}

/** 保存完整状态；存在待备份原文时，必须先完成备份才允许覆盖主键。 */
export function savePersistedState(
  state: PersistedState,
  recovery: PendingCorruptBackup | null,
): SaveResult {
  if (!isPersistedState(state)) {
    return { ok: false, message: '保存已拒绝：待保存数据结构无效' }
  }

  if (recovery !== null) {
    const backupResult = backupCorruptState(recovery)
    if (!backupResult.ok) {
      return { ok: false, message: `保存已阻止，损坏原文尚未备份：${backupResult.message}` }
    }
  }

  try {
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
    return { ok: true }
  } catch (error: unknown) {
    return { ok: false, message: `保存本地数据失败：${getErrorMessage(error)}` }
  }
}

/** 判断未知值是否为当前版本的完整持久化状态。 */
function isPersistedState(value: unknown): value is PersistedState {
  if (!isRecord(value)) return false
  if (value.version !== PERSISTENCE_VERSION || !isLocalDateKey(value.activeDate)) return false
  if (!Array.isArray(value.accounts) || !value.accounts.every(isAccount)) return false
  if (!Array.isArray(value.shops) || !value.shops.every(isShop)) return false
  return hasUniqueIds(value.accounts) && hasUniqueIds(value.shops)
}

/** 判断未知值是否为满足计时状态约束的账号。 */
function isAccount(value: unknown): value is Account {
  if (!isRecord(value)) return false
  if (!isNonEmptyString(value.id) || typeof value.name !== 'string' || typeof value.note !== 'string') {
    return false
  }
  if (!isOrder(value.order) || !isAccountStatus(value.status)) return false
  if (!isNonNegativeFiniteNumber(value.accumulatedMs)) return false
  if (!isOrder(value.highValueCount)) return false

  const startedAtIsValid = value.startedAt === null || isNonNegativeFiniteNumber(value.startedAt)
  const waitingUntilIsValid = value.waitingUntil === null || isNonNegativeFiniteNumber(value.waitingUntil)
  const completedAtIsValid = value.completedAt === null || isNonNegativeFiniteNumber(value.completedAt)
  if (!startedAtIsValid || !waitingUntilIsValid || !completedAtIsValid) return false

  if (value.status === 'running') return value.startedAt !== null && value.waitingUntil === null
  if (value.status === 'waiting') return value.startedAt === null && value.waitingUntil !== null
  if (value.startedAt !== null || value.waitingUntil !== null) return false
  return value.status === 'completed' || value.completedAt === null
}

/** 判断未知值是否为字段完整的商会店铺。 */
function isShop(value: unknown): value is Shop {
  if (!isRecord(value)) return false
  if (!isNonEmptyString(value.id) || !isShopCategory(value.category)) return false
  if (typeof value.number !== 'string' || typeof value.name !== 'string') return false
  if (!Array.isArray(value.items) || !value.items.every((item) => typeof item === 'string')) return false
  return typeof value.note === 'string' && isOrder(value.order)
}

/** 判断未知值是否为账号状态枚举成员。 */
function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === 'string' && ACCOUNT_STATUSES.includes(value as AccountStatus)
}

/** 判断未知值是否为店铺分类枚举成员。 */
function isShopCategory(value: unknown): value is ShopCategory {
  return typeof value === 'string' && SHOP_CATEGORIES.includes(value as ShopCategory)
}

/** 判断未知值是否为可安全参与计时的非负有限数。 */
function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

/** 判断未知值是否为非负整数排序值。 */
function isOrder(value: unknown): value is number {
  return Number.isInteger(value) && isNonNegativeFiniteNumber(value)
}

/** 判断未知值是否为非空字符串。 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/** 判断未知值是否为本地日期键。 */
function isLocalDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parts = value.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  return getLocalDateKey(new Date(year, month - 1, day)) === value
}

/** 判断未知值是否为普通键值对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 检查实体数组内的 ID 是否互不重复。 */
function hasUniqueIds(values: readonly { id: string }[]): boolean {
  return new Set(values.map(({ id }) => id)).size === values.length
}

/** 创建可跨多次保存重试的损坏原文备份任务。 */
function createPendingCorruptBackup(raw: string): PendingCorruptBackup {
  return { raw, backupKey: `${CORRUPT_KEY_PREFIX}${Date.now()}` }
}

/** 尝试备份损坏原文，并以保存结果暴露失败原因。 */
function backupCorruptState(recovery: PendingCorruptBackup): SaveResult {
  try {
    localStorage.setItem(recovery.backupKey, recovery.raw)
    return { ok: true }
  } catch (error: unknown) {
    return { ok: false, message: `备份损坏数据失败：${getErrorMessage(error)}` }
  }
}

/** 把未知异常转换为适合界面提示的简短文本。 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
