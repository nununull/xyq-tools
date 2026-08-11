<script setup lang="ts">
/* global HTMLDialogElement, HTMLElement, MouseEvent, crypto, document */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
  }>(),
  {
    description: undefined,
  },
)

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const titleId = `modal-title-${crypto.randomUUID()}`
const descriptionId = `modal-description-${crypto.randomUUID()}`
let triggerElement: HTMLElement | null = null
let closesFromProp = false

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

/** 由外部状态关闭原生对话框，不向父级重复发出关闭请求。 */
function hideDialog(): void {
  const element = dialog.value
  if (element === null || !element.open) return

  closesFromProp = true
  element.close()
  closesFromProp = false
}

/** 原生对话框关闭后恢复之前的触发元素焦点。 */
function restoreTriggerFocus(): void {
  if (triggerElement?.isConnected) {
    triggerElement.focus({ preventScroll: true })
  }
  triggerElement = null
}

/** 处理原生关闭事件；仅用户触发的关闭才通知父组件更新状态。 */
function handleClose(): void {
  restoreTriggerFocus()
  if (!closesFromProp) emit('close')
}

/** 点击遮罩时请求父组件关闭，内容区域点击不受影响。 */
function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) emit('close')
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
    :aria-labelledby="titleId"
    :aria-describedby="description === undefined ? undefined : descriptionId"
    @close="handleClose"
    @click="handleBackdropClick"
  >
    <section class="base-modal__content">
      <header class="base-modal__header">
        <h2 :id="titleId">
          {{ title }}
        </h2>
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
