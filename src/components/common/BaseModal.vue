<script setup lang="ts">
/* global Event, HTMLDialogElement, HTMLElement, crypto, document */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: 'default' | 'wide'
  }>(),
  {
    description: undefined,
    size: 'default',
  },
)

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const titleId = `modal-title-${crypto.randomUUID()}`
const descriptionId = `modal-description-${crypto.randomUUID()}`
let triggerElement: HTMLElement | null = null

/** 将焦点放在弹窗内第一个可交互元素，保证键盘用户立即能操作。 */
function focusFirstInteractiveElement(): void {
  const firstInteractiveElement = dialog.value?.querySelector<HTMLElement>(
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )
  firstInteractiveElement?.focus({ preventScroll: true })
}

/** 打开原生对话框并记录触发元素，以便关闭后恢复焦点。 */
async function showDialog(): Promise<void> {
  await nextTick()
  const element = dialog.value
  if (!props.open || element === null) return

  const activeElement = document.activeElement
  triggerElement = activeElement instanceof HTMLElement ? activeElement : null
  if (!element.open) element.showModal()
  focusFirstInteractiveElement()
}

/** 由外部状态关闭原生对话框；关闭事件只负责焦点收尾，不再反向通知父级。 */
function hideDialog(): void {
  const element = dialog.value
  if (element === null || !element.open) return

  element.close()
}

/** 原生对话框关闭后恢复之前的触发元素焦点。 */
function restoreTriggerFocus(): void {
  if (triggerElement?.isConnected) {
    triggerElement.focus({ preventScroll: true })
  }
  triggerElement = null
}

/** 原生关闭事件仅恢复焦点；新弹窗已开启时保留新一轮交互上下文。 */
function handleClose(): void {
  if (props.open) return
  restoreTriggerFocus()
}

/** 请求父组件关闭弹窗，受控状态变更会负责调用原生 close。 */
function requestClose(): void {
  emit('close')
}

/** 拦截 Escape 的默认关闭流程，避免原生 close 事件参与状态控制。 */
function handleCancel(event: Event): void {
  event.preventDefault()
  requestClose()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void showDialog()
      return
    }
    hideDialog()
  },
  { immediate: true },
)

onBeforeUnmount(hideDialog)
</script>

<template>
  <dialog
    ref="dialog"
    class="base-modal"
    :class="{ 'base-modal--wide': size === 'wide' }"
    :aria-labelledby="titleId"
    :aria-describedby="description === undefined ? undefined : descriptionId"
    @cancel="handleCancel"
    @close="handleClose"
  >
    <section class="base-modal__content">
      <header class="base-modal__header">
        <div>
          <h2 :id="titleId">
            {{ title }}
          </h2>
          <button
            class="base-modal__close"
            type="button"
            aria-label="关闭弹窗"
            @click="requestClose"
          >
            ×
          </button>
        </div>
        <p
          v-if="description !== undefined"
          :id="descriptionId"
        >
          {{ description }}
        </p>
      </header>
      <slot />
    </section>
  </dialog>
</template>

<style scoped>
.base-modal {
  width: min(calc(100% - 2rem), 30rem);
  margin: auto;
  padding: 0;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.875rem;
  box-shadow: 0 1.5rem 4rem rgb(37 54 48 / 24%);
}

.base-modal::backdrop {
  background: rgb(37 54 48 / 42%);
}

.base-modal__content {
  padding: 1.5rem;
}

.base-modal__header h2,
.base-modal__header p {
  margin-top: 0;
}

.base-modal--wide {
  width: min(calc(100% - 2rem), 64rem);
}

.base-modal__header > div {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.base-modal__close {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: var(--text-muted);
  background: transparent;
  border-color: transparent;
  font-size: 1.25rem;
  line-height: 1;
}

.base-modal__close:hover {
  color: var(--text);
  background: var(--surface-soft);
  border-color: var(--border);
}

.base-modal__header h2 {
  margin-bottom: 0.625rem;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.base-modal__header p {
  margin-bottom: 1.5rem;
  color: var(--text-muted);
  line-height: 1.65;
}
</style>
