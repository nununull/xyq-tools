<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import type { Account, AccountDraft } from '@/types/domain'

const props = withDefaults(
  defineProps<{
    open: boolean
    account?: Account
  }>(),
  {
    account: undefined,
  },
)

const emit = defineEmits<{
  save: [draft: AccountDraft]
  close: []
}>()

const name = ref('')
const note = ref('')
const nameError = ref('')

/** 按当前编辑目标重置表单，避免关闭后残留上一次输入和校验错误。 */
function resetForm(): void {
  name.value = props.account?.name ?? ''
  note.value = props.account?.note ?? ''
  nameError.value = ''
}

/** 校验并提交去除首尾空白的账号资料。 */
function submitForm(): void {
  const trimmedName = name.value.trim()
  if (trimmedName.length === 0) {
    nameError.value = '账号名称不能为空。'
    return
  }

  emit('save', {
    name: trimmedName,
    note: note.value.trim(),
  })
}

/** 关闭表单但不提交当前输入。 */
function closeForm(): void {
  emit('close')
}

watch(
  () => [props.open, props.account?.id] as const,
  ([open]) => {
    if (open) resetForm()
  },
  { immediate: true },
)

watch(name, (value) => {
  if (value.trim().length > 0) nameError.value = ''
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="account === undefined ? '新增账号' : '编辑账号'"
    description="账号之间可以同时计时，名称用于区分提醒和今日进度。"
    @close="closeForm"
  >
    <form
      class="account-form"
      @submit.prevent="submitForm"
    >
      <label class="account-form__field">
        <span>账号名称</span>
        <input
          v-model="name"
          name="account-name"
          type="text"
          autocomplete="off"
          maxlength="40"
          :aria-invalid="nameError.length > 0"
          :aria-describedby="nameError.length > 0 ? 'account-name-error' : undefined"
        >
      </label>
      <p
        v-if="nameError.length > 0"
        id="account-name-error"
        class="account-form__error"
        role="alert"
      >
        {{ nameError }}
      </p>

      <label class="account-form__field">
        <span>备注（可选）</span>
        <textarea
          v-model="note"
          name="account-note"
          rows="3"
          maxlength="160"
          placeholder="例如：优先做双倍奖励"
        />
      </label>

      <footer class="account-form__actions">
        <button
          class="account-form__secondary"
          type="button"
          aria-label="取消账号资料编辑"
          @click="closeForm"
        >
          取消
        </button>
        <button
          type="submit"
          :aria-label="account === undefined ? '保存新增账号' : `保存账号 ${account.name} 的修改`"
        >
          {{ account === undefined ? '新增账号' : '保存修改' }}
        </button>
      </footer>
    </form>
  </BaseModal>
</template>

<style scoped>
.account-form {
  display: grid;
  gap: 1rem;
}

.account-form__field {
  display: grid;
  gap: 0.5rem;
  color: var(--text);
  font-size: 0.9375rem;
  font-weight: 700;
}

.account-form__field input,
.account-form__field textarea {
  width: 100%;
  padding: 0.75rem 0.875rem;
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 82%, white);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-weight: 400;
  line-height: 1.5;
}

.account-form__field textarea {
  resize: vertical;
}

.account-form__field input[aria-invalid='true'] {
  border-color: var(--danger);
}

.account-form__error {
  margin: -0.5rem 0 0;
  color: var(--danger);
  font-size: 0.875rem;
}

.account-form__actions {
  display: flex;
  justify-content: end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.account-form__secondary {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.account-form__secondary:hover {
  background: var(--surface-soft);
  border-color: var(--border);
}
</style>
