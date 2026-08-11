<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/useUiStore'
import BaseModal from './BaseModal.vue'

const uiStore = useUiStore()
const confirmation = computed(() => uiStore.confirmation)
const isDangerous = computed(() => confirmation.value?.tone === 'danger')
const confirmLabel = computed(() => confirmation.value?.confirmText ?? '确定')
const cancelLabel = computed(() => confirmation.value?.cancelText ?? '取消')

/** 拒绝当前请求，关闭、取消和替换请求均返回 false。 */
function cancelConfirmation(): void {
  uiStore.settleConfirmation(false)
}

/** 接受当前请求；危险操作的中文动作文本由调用方显式提供。 */
function acceptConfirmation(): void {
  uiStore.settleConfirmation(true)
}
</script>

<template>
  <BaseModal
    :open="confirmation !== null"
    :title="confirmation?.title ?? ''"
    :description="confirmation?.description"
    @close="cancelConfirmation"
  >
    <footer class="confirm-dialog__actions">
      <button
        class="confirm-dialog__cancel"
        type="button"
        @click="cancelConfirmation"
      >
        {{ cancelLabel }}
      </button>
      <button
        class="confirm-dialog__confirm"
        :class="{ 'confirm-dialog__confirm--danger': isDangerous }"
        type="button"
        @click="acceptConfirmation"
      >
        {{ confirmLabel }}
      </button>
    </footer>
  </BaseModal>
</template>

<style scoped>
.confirm-dialog__actions {
  display: flex;
  justify-content: end;
  gap: 0.75rem;
}

.confirm-dialog__cancel {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.confirm-dialog__cancel:hover {
  background: var(--surface-soft);
  border-color: var(--border);
}

.confirm-dialog__confirm--danger {
  background: var(--danger);
  border-color: var(--danger);
}

.confirm-dialog__confirm--danger:hover {
  background: color-mix(in srgb, var(--danger) 82%, var(--text));
  border-color: color-mix(in srgb, var(--danger) 82%, var(--text));
}
</style>
