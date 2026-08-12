import { createClient } from '@supabase/supabase-js'

/** 读取必需的公开环境变量，缺失时阻止应用带着半套配置启动。 */
function requirePublicEnvironment(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string' || value.length === 0) throw new Error(`缺少环境变量 ${name}`)
  return value
}

export const supabase = createClient(
  requirePublicEnvironment('VITE_SUPABASE_URL'),
  requirePublicEnvironment('VITE_SUPABASE_PUBLISHABLE_KEY'),
)
