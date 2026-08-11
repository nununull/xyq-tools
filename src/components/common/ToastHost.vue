<script setup lang="ts">
import { useUiStore } from '@/stores/useUiStore'

const uiStore = useUiStore()

/** 关闭指定提示，手动关闭与自动关闭共用同一清理路径。 */
function dismissToast(id: string): void {
  uiStore.removeToast(id)
}
</script>

<template>
  <section
    class="toast-host"
    aria-live="polite"
    aria-label="操作反馈"
  >
    <TransitionGroup name="toast">
      <article
        v-for="notification in uiStore.toasts"
        :key="notification.id"
        class="toast-host__item"
        :class="`toast-host__item--${notification.tone}`"
        :role="notification.tone === 'danger' ? 'alert' : undefined"
      >
        <p>{{ notification.message }}</p>
        <button
          class="toast-host__dismiss"
          type="button"
          :aria-label="`关闭提示：${notification.message}`"
          @click="dismissToast(notification.id)"
        >
          关闭
        </button>
      </article>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.toast-host {
  position: fixed;
  z-index: 10;
  top: 1.25rem;
  right: 1.25rem;
  display: grid;
  gap: 0.75rem;
  width: min(calc(100% - 2rem), 24rem);
  pointer-events: none;
}

.toast-host__item {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  color: var(--text);
  pointer-events: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 0.375rem solid var(--mint-700);
  border-radius: 0.625rem;
  box-shadow: 0 0.75rem 1.75rem rgb(37 54 48 / 15%);
}

.toast-host__item--success {
  border-left-color: var(--mint-500);
}

.toast-host__item--warning {
  border-left-color: #b9823a;
}

.toast-host__item--danger {
  border-left-color: var(--danger);
}

.toast-host__item p {
  margin: 0;
  line-height: 1.5;
}

.toast-host__dismiss {
  flex: 0 0 auto;
  padding: 0.25rem 0.5rem;
  color: var(--text-muted);
  background: transparent;
  border-color: transparent;
}

.toast-host__dismiss:hover {
  color: var(--text);
  background: var(--surface-soft);
  border-color: var(--border);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
