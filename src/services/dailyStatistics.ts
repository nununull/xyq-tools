import { supabase } from './supabase'

export interface DailyStatistic {
  accountId: string
  statDate: string
  accountName: string
  accumulatedMs: number
  highValueCount: number
  completed: boolean
  completedAt: string | null
}

export interface DailyStatisticFilters {
  startDate: string
  endDate: string
  accountId: string | null
}

export interface StatisticAccountOption {
  id: string
  name: string
}

/** 按日期区间和账号读取统计，结果固定按日期倒序排列。 */
export async function loadDailyStatistics(
  userId: string,
  filters: DailyStatisticFilters,
): Promise<DailyStatistic[]> {
  let query = supabase
    .from('sect_mission_daily_stats')
    .select('account_id, stat_date, account_name, accumulated_ms, high_value_count, completed, completed_at')
    .eq('user_id', userId)
    .gte('stat_date', filters.startDate)
    .lte('stat_date', filters.endDate)
    .order('stat_date', { ascending: false })
    .order('account_name', { ascending: true })

  if (filters.accountId !== null) query = query.eq('account_id', filters.accountId)
  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    accountId: row.account_id,
    statDate: row.stat_date,
    accountName: row.account_name,
    accumulatedMs: Number(row.accumulated_ms),
    highValueCount: row.high_value_count,
    completed: row.completed,
    completedAt: row.completed_at,
  }))
}

/** 读取用户历史统计里的账号快照，并按名称合并重复账号。 */
export async function loadStatisticAccountOptions(userId: string): Promise<StatisticAccountOption[]> {
  const { data, error } = await supabase
    .from('sect_mission_daily_stats')
    .select('account_id, account_name')
    .eq('user_id', userId)
    .order('account_name', { ascending: true })
  if (error) throw error

  const options = new Map<string, string>()
  for (const row of data ?? []) options.set(row.account_id, row.account_name)
  return [...options].map(([id, name]) => ({ id, name }))
}
