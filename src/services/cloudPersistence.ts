import { parsePersistedState } from './persistence'
import { supabase } from './supabase'
import type { PersistedState } from '@/types/domain'

export type CloudLoadResult = { found: false } | { found: true; state: PersistedState; updatedAt: string }

/** 读取指定用户的云端快照，并拒绝任何非法结构。 */
export async function loadCloudState(userId: string): Promise<CloudLoadResult> {
  const { data, error } = await supabase.from('user_tool_states').select('state, updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data === null) return { found: false }
  return { found: true, state: parsePersistedState(data.state), updatedAt: data.updated_at }
}

/** 依次保存完整快照和当天账号统计，任一失败都保留待同步状态。 */
export async function saveCloudState(userId: string, state: PersistedState): Promise<void> {
  const snapshot = await supabase.from('user_tool_states').upsert({ user_id: userId, state })
  if (snapshot.error) throw snapshot.error
  if (state.accounts.length === 0) return
  const rows = state.accounts.map((account) => ({
    user_id: userId,
    account_id: account.id,
    stat_date: state.activeDate,
    account_name: account.name,
    accumulated_ms: Math.floor(account.accumulatedMs),
    high_value_count: account.highValueCount,
    completed: account.status === 'completed',
    completed_at: account.completedAt === null ? null : new Date(account.completedAt).toISOString(),
  }))
  const statistics = await supabase.from('sect_mission_daily_stats').upsert(rows)
  if (statistics.error) throw statistics.error
}
