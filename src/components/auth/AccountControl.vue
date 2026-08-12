<script setup lang="ts">
import { Cloud, LogIn, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePersistenceStore } from '@/stores/usePersistenceStore'
import { useUiStore } from '@/stores/useUiStore'

defineEmits<{ login: [] }>()
const authStore = useAuthStore(); const persistenceStore = usePersistenceStore(); const uiStore = useUiStore()

/** 安全退出；补传失败时明确询问是否强制隔离退出。 */
async function signOut(): Promise<void> {
  const result = await persistenceStore.requestSignOut(false)
  if (result.ok || !result.requiresForce) return
  const confirmed = await uiStore.confirm({ title: '仍有修改未同步，强制退出？', description: '未同步修改会保留在该账号的本地缓存，游客看不到这些内容。', tone: 'danger', confirmLabel: '强制注销账号' })
  if (confirmed) await persistenceStore.requestSignOut(true)
}
</script>

<template>
  <section
    class="account-control"
    :aria-label="authStore.user ? `账户 ${authStore.email}，${persistenceStore.syncMessage}` : '本地模式账户入口'"
  >
    <Cloud
      :size="17"
      aria-hidden="true"
    />
    <div><strong>{{ authStore.user ? authStore.email : '本地模式' }}</strong><small>{{ persistenceStore.syncMessage }}</small></div>
    <button
      v-if="!authStore.user"
      type="button"
      aria-label="使用邮箱登录"
      @click="$emit('login')"
    >
      <LogIn
        :size="17"
        aria-hidden="true"
      />
    </button>
    <button
      v-else
      type="button"
      aria-label="退出登录"
      @click="signOut"
    >
      <LogOut
        :size="17"
        aria-hidden="true"
      />
    </button>
  </section>
</template>

<style scoped>
.account-control { display: flex; align-items: center; gap: .6rem; min-width: 0; }
.account-control div { display: grid; min-width: 0; flex: 1; }
.account-control strong,.account-control small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.account-control small { color: var(--text-muted); }
.account-control button { display: grid; place-items: center; padding: .5rem; }
</style>
