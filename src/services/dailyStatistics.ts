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

/** 读取当前登录用户的师门每日统计，结果按日期和账号名称排序。 */
export async function loadDailyStatistics(userId: string): Promise<DailyStatistic[]> {
  const { data, error } = await supabase
    .from('sect_mission_daily_stats')
    .select('account_id, stat_date, account_name, accumulated_ms, high_value_count, completed, completed_at')
    .eq('user_id', userId)
    .order('stat_date', { ascending: false })
    .order('account_name', { ascending: true })
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
