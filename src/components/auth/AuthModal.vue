<script setup lang="ts">
/* global clearInterval, setInterval */
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAuthStore } from '@/stores/useAuthStore'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const authStore = useAuthStore()
const step = ref<'email' | 'token'>('email')
const email = ref('')
const token = ref('')
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

/** 启动六十秒重发倒计时。 */
function startCooldown(): void {
  cooldown.value = 60
  if (timer !== null) clearInterval(timer)
  timer = setInterval(() => { cooldown.value -= 1; if (cooldown.value <= 0 && timer !== null) { clearInterval(timer); timer = null } }, 1000)
}

/** 发送邮箱验证码并切换到验证码步骤。 */
async function sendCode(): Promise<void> { if (await authStore.sendOtp(email.value)) { step.value = 'token'; startCooldown() } }

/** 验证成功后关闭弹窗。 */
async function verifyCode(): Promise<void> { if (await authStore.verifyOtp(email.value, token.value)) emit('close') }

/** 关闭时清理验证码和公开错误。 */
function close(): void { token.value = ''; authStore.errorMessage = null; emit('close') }

watch(() => props.open, (open) => { if (!open) token.value = '' })
</script>

<template>
  <BaseModal
    :open="open"
    title="邮箱登录"
    description="验证码有效期一小时，请别反复轰炸邮箱。"
    @close="close"
  >
    <form
      class="auth-form"
      @submit.prevent="step === 'email' ? sendCode() : verifyCode()"
    >
      <label>邮箱<input
        v-model="email"
        type="email"
        autocomplete="email"
        :disabled="authStore.busy || step === 'token'"
        required
      ></label>
      <label v-if="step === 'token'">六位验证码<input
        v-model="token"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        pattern="[0-9]{6}"
        :disabled="authStore.busy"
        required
      ></label>
      <p
        v-if="authStore.errorMessage"
        role="alert"
      >
        {{ authStore.errorMessage }}
      </p>
      <div class="auth-form__actions">
        <button
          v-if="step === 'token'"
          type="button"
          :disabled="authStore.busy"
          @click="step = 'email'"
        >
          修改邮箱
        </button>
        <button
          v-if="step === 'token'"
          type="button"
          :disabled="authStore.busy || cooldown > 0"
          @click="sendCode"
        >
          {{ cooldown > 0 ? `${cooldown} 秒后重发` : '重发验证码' }}
        </button>
        <button
          type="submit"
          :disabled="authStore.busy"
        >
          {{ authStore.busy ? '处理中…' : step === 'email' ? '发送验证码' : '登录' }}
        </button>
        <button
          type="button"
          :disabled="authStore.busy"
          @click="close"
        >
          取消
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.auth-form { display: grid; gap: 1rem; }
.auth-form label { display: grid; gap: .4rem; font-weight: 700; }
.auth-form input { min-height: 2.75rem; padding: .65rem .75rem; border: 1px solid var(--border); border-radius: .5rem; }
.auth-form p { margin: 0; color: var(--danger); }
.auth-form__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; }
</style>
