import type { AuthChangeEvent, Session, Subscription } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/services/supabase'

/** 管理 Supabase 邮箱验证码与浏览器 Session 生命周期。 */
export const useAuthStore = defineStore('auth', () => {
  const initialized = ref(false)
  const session = ref<Session | null>(null)
  const user = computed(() => session.value?.user ?? null)
  const email = computed(() => user.value?.email ?? '')
  const busy = ref(false)
  const errorMessage = ref<string | null>(null)
  let subscription: Subscription | null = null
  let initialization: Promise<void> | null = null

  /** 幂等初始化认证监听，并等待初始 Session 收敛。 */
  function initialize(): Promise<void> {
    if (initialization !== null) return initialization
    initialization = new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = (nextSession: Session | null): void => {
        session.value = nextSession
        initialized.value = true
        if (!settled) { settled = true; resolve() }
      }
      const result = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession: Session | null) => {
        session.value = nextSession
        if (event === 'INITIAL_SESSION') finish(nextSession)
      })
      subscription = result.data.subscription
      void supabase.auth.getSession().then(({ data, error }) => error ? reject(error) : finish(data.session)).catch(reject)
    })
    return initialization
  }

  /** 向规范化邮箱发送六位验证码，首次验证允许自动创建用户。 */
  async function sendOtp(rawEmail: string): Promise<boolean> {
    const normalizedEmail = rawEmail.trim().toLowerCase()
    if (normalizedEmail.length === 0) { errorMessage.value = '请输入邮箱地址'; return false }
    busy.value = true; errorMessage.value = null
    const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: true } })
    busy.value = false
    if (error) { handleAuthError(error); return false }
    return true
  }

  /** 校验并提交六位邮箱验证码。 */
  async function verifyOtp(rawEmail: string, token: string): Promise<boolean> {
    if (!/^\d{6}$/.test(token)) { errorMessage.value = '验证码必须是六位数字'; return false }
    const normalizedEmail = rawEmail.trim().toLowerCase()
    busy.value = true; errorMessage.value = null
    const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'email' })
    busy.value = false
    if (error) { handleAuthError(error); return false }
    session.value = data.session
    return true
  }

  /** 只退出认证 Session，领域状态隔离由持久化协调器完成。 */
  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    session.value = null
  }

  /** 将认证异常转换为稳定中文提示。 */
  function handleAuthError(error: { status?: number }): void {
    console.error('Supabase 认证失败', error)
    errorMessage.value = error.status === 429 ? '请求过于频繁，请稍后再试' : '认证失败，请检查邮箱或验证码后重试'
  }

  /** 取消认证监听，释放 Store 外部资源。 */
  function dispose(): void { subscription?.unsubscribe(); subscription = null }

  return { initialized, session, user, email, busy, errorMessage, initialize, sendOtp, verifyOtp, signOut, dispose }
})
