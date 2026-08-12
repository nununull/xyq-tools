import { parsePersistedState } from './persistence'
import type { PersistedState } from '@/types/domain'

export interface SyncCacheEntry { revision: number; queuedAt: number; state: PersistedState }

/** 生成指定用户的隔离缓存键。 */
function getSyncCacheKey(userId: string): string { return `xyq-tools:sync:${userId}:v1` }

/** 加载指定用户的待同步缓存，损坏时保留原文并抛错。 */
export function loadSyncCache(userId: string): SyncCacheEntry | null {
  const raw = localStorage.getItem(getSyncCacheKey(userId))
  if (raw === null) return null
  const value: unknown = JSON.parse(raw)
  if (typeof value !== 'object' || value === null || !('revision' in value) || !('queuedAt' in value) || !('state' in value)) throw new Error('待同步缓存结构无效')
  const entry = value as Record<string, unknown>
  if (!Number.isInteger(entry.revision) || typeof entry.revision !== 'number' || entry.revision < 1 || typeof entry.queuedAt !== 'number' || !Number.isFinite(entry.queuedAt)) throw new Error('待同步缓存版本无效')
  return { revision: entry.revision, queuedAt: entry.queuedAt, state: parsePersistedState(entry.state) }
}

/** 保存指定用户的新修订快照，并返回本次缓存条目。 */
export function saveSyncCache(userId: string, state: PersistedState): SyncCacheEntry {
  const previous = loadSyncCache(userId)
  const entry = { revision: (previous?.revision ?? 0) + 1, queuedAt: Date.now(), state: parsePersistedState(structuredClone(state)) }
  localStorage.setItem(getSyncCacheKey(userId), JSON.stringify(entry))
  return entry
}

/** 仅在修订号仍匹配时清除缓存，避免旧请求吞掉新修改。 */
export function clearSyncCache(userId: string, revision: number): boolean {
  const current = loadSyncCache(userId)
  if (current === null || current.revision !== revision) return false
  localStorage.removeItem(getSyncCacheKey(userId))
  return true
}
