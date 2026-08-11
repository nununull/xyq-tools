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
}

export type SaveResult = { ok: true } | { ok: false; message: string }

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
    }
  }

  if (raw === null) {
    return { state: createDefaultPersistedState(), warning: null }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isPersistedState(parsed)) {
      throw new Error('数据结构或版本不受支持')
    }
    return { state: parsed, warning: null }
  } catch (error: unknown) {
    return {
      state: createDefaultPersistedState(),
      warning: backupCorruptState(raw, error),
    }
  }
}

/** 保存完整状态并以结果对象暴露浏览器存储错误。 */
export function savePersistedState(state: PersistedState): SaveResult {
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

  const startedAtIsValid = value.startedAt === null || isNonNegativeFiniteNumber(value.startedAt)
  const waitingUntilIsValid = value.waitingUntil === null || isNonNegativeFiniteNumber(value.waitingUntil)
  if (!startedAtIsValid || !waitingUntilIsValid) return false

  if (value.status === 'running') return value.startedAt !== null && value.waitingUntil === null
  if (value.status === 'waiting') return value.startedAt === null && value.waitingUntil !== null
  return value.startedAt === null && value.waitingUntil === null
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

/** 备份损坏原文，并返回包含备份结果的中文警告。 */
function backupCorruptState(raw: string, cause: unknown): string {
  const reason = getErrorMessage(cause)
  const backupKey = `${CORRUPT_KEY_PREFIX}${Date.now()}`

  try {
    localStorage.setItem(backupKey, raw)
    return `本地数据已损坏，已备份到 ${backupKey} 并恢复为空白状态：${reason}`
  } catch (error: unknown) {
    return `本地数据已损坏，但备份失败并已恢复为空白状态：${reason}；备份错误：${getErrorMessage(error)}`
  }
}

/** 把未知异常转换为适合界面提示的简短文本。 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
