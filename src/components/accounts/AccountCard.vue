<script setup lang="ts">
import { computed } from 'vue'
import type { Account, AccountStatus } from '@/types/domain'

const props = defineProps<{
  account: Account
  now: number
  recommended: boolean
}>()

const emit = defineEmits<{
  start: [id: string]
  pause: [id: string]
  wait: [id: string]
  complete: [id: string]
  reopen: [id: string]
  edit: [id: string]
  remove: [id: string]
}>()

const STATUS_LABELS: Record<AccountStatus, string> = {
  idle: '未开始',
  running: '计时中',
  paused: '已暂停',
  waiting: '高价值等待',
  ready: '可以切回',
  completed: '已完成',
}

const effectiveElapsedMs = computed(() => {
  if (props.account.status !== 'running' || props.account.startedAt === null) {
    return props.account.accumulatedMs
  }
  return props.account.accumulatedMs + Math.max(0, props.now - props.account.startedAt)
})

const waitingRemainingMs = computed(() =>
  props.account.status === 'waiting' && props.account.waitingUntil !== null
    ? Math.max(0, props.account.waitingUntil - props.now)
    : 0,
)

/** 将毫秒格式化为不回绕的“时:分:秒”，超长任务仍保留完整小时数。 */
function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

/** 请求启动未开始、暂停或已经到期的账号。 */
function startAccount(): void {
  emit('start', props.account.id)
}

/** 请求暂停当前正在计时的账号。 */
function pauseAccount(): void {
  emit('pause', props.account.id)
}

/** 请求将当前账号送入固定高价值等待。 */
function waitAccount(): void {
  emit('wait', props.account.id)
}

/** 请求完成当前允许完成的账号。 */
function completeAccount(): void {
  emit('complete', props.account.id)
}

/** 请求撤销当前账号的完成状态。 */
function reopenAccount(): void {
  emit('reopen', props.account.id)
}

/** 请求编辑当前账号资料。 */
function editAccount(): void {
  emit('edit', props.account.id)
}

/** 请求删除当前账号。 */
function removeAccount(): void {
  emit('remove', props.account.id)
}
</script>

<template>
  <article
    class="account-card"
    :class="{
      'account-card--recommended': recommended,
      'account-card--completed': account.status === 'completed',
    }"
    :aria-label="`账号 ${account.name}`"
  >
    <header class="account-card__header">
      <span
        class="account-card__drag-handle"
        :aria-label="`拖动账号 ${account.name} 调整顺序`"
        role="img"
      >
        ⠿
      </span>
      <div class="account-card__identity">
        <div class="account-card__name-line">
          <h3>{{ account.name }}</h3>
          <span
            v-if="recommended"
            class="account-card__recommendation"
          >
            今日推荐
          </span>
        </div>
        <p v-if="account.note.length > 0">
          {{ account.note }}
        </p>
      </div>
      <span
        class="account-card__status"
        :class="`account-card__status--${account.status}`"
      >
        {{ STATUS_LABELS[account.status] }}
      </span>
    </header>

    <div class="account-card__timing">
      <div>
        <span>有效耗时</span>
        <strong :aria-label="`${account.name} 有效耗时 ${formatDuration(effectiveElapsedMs)}`">
          {{ formatDuration(effectiveElapsedMs) }}
        </strong>
      </div>
      <div
        v-if="account.status === 'waiting'"
        class="account-card__waiting"
      >
        <span>剩余等待</span>
        <strong>{{ formatDuration(waitingRemainingMs) }}</strong>
      </div>
    </div>

    <footer class="account-card__footer">
      <div class="account-card__primary-actions">
        <button
          v-if="account.status === 'idle'"
          type="button"
          :aria-label="`开始账号 ${account.name} 的计时`"
          @click="startAccount"
        >
          开始
        </button>
        <button
          v-if="account.status === 'paused' || account.status === 'ready'"
          type="button"
          :aria-label="`继续账号 ${account.name} 的计时`"
          @click="startAccount"
        >
          继续
        </button>
        <button
          v-if="account.status === 'running'"
          class="account-card__secondary"
          type="button"
          :aria-label="`暂停账号 ${account.name} 的计时`"
          @click="pauseAccount"
        >
          暂停
        </button>
        <button
          v-if="account.status === 'running'"
          class="account-card__accent"
          type="button"
          :aria-label="`账号 ${account.name} 进入高价值等待`"
          @click="waitAccount"
        >
          高价值
        </button>
        <button
          v-if="['running', 'paused', 'ready'].includes(account.status)"
          class="account-card__secondary"
          type="button"
          :aria-label="`完成账号 ${account.name}`"
          @click="completeAccount"
        >
          完成
        </button>
        <button
          v-if="account.status === 'completed'"
          class="account-card__secondary"
          type="button"
          :aria-label="`撤销账号 ${account.name} 的完成状态`"
          @click="reopenAccount"
        >
          撤销完成
        </button>
      </div>

      <div class="account-card__admin-actions">
        <button
          class="account-card__text-action"
          type="button"
          :aria-label="`编辑账号 ${account.name}`"
          @click="editAccount"
        >
          编辑
        </button>
        <button
          class="account-card__text-action account-card__text-action--danger"
          type="button"
          :aria-label="`删除账号 ${account.name}`"
          @click="removeAccount"
        >
          删除
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.account-card {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  transition: border-color 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.account-card--recommended {
  border-color: var(--mint-700);
  box-shadow: 0 0 0 0.1875rem color-mix(in srgb, var(--mint-500) 18%, transparent);
}

.account-card--completed {
  opacity: 0.72;
}

.account-card__header {
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.account-card__drag-handle {
  flex: 0 0 auto;
  padding: 0.125rem;
  color: var(--text-muted);
  cursor: grab;
  font-size: 1.25rem;
  line-height: 1;
  touch-action: none;
  user-select: none;
}

.account-card__drag-handle:active {
  cursor: grabbing;
}

.account-card__identity {
  min-width: 0;
  flex: 1;
}

.account-card__name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.account-card h3,
.account-card p {
  margin: 0;
}

.account-card h3 {
  overflow-wrap: anywhere;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
}

.account-card__identity p {
  margin-top: 0.375rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.account-card__recommendation,
.account-card__status {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.account-card__recommendation {
  color: var(--mint-700);
  background: color-mix(in srgb, var(--mint-500) 18%, transparent);
}

.account-card__status {
  color: var(--text-muted);
  background: var(--surface-soft);
}

.account-card__status--running,
.account-card__status--ready {
  color: var(--mint-700);
}

.account-card__status--waiting {
  color: #8b5c20;
  background: #f5e8cf;
}

.account-card__status--completed {
  color: var(--surface);
  background: var(--text-muted);
}

.account-card__timing {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.account-card__timing > div {
  display: grid;
  gap: 0.25rem;
}

.account-card__timing span {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.account-card__timing strong {
  font-size: 1.375rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.account-card__waiting strong {
  color: #8b5c20;
}

.account-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.account-card__primary-actions,
.account-card__admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.account-card__footer button {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.account-card__secondary,
.account-card__text-action {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.account-card__secondary:hover,
.account-card__text-action:hover {
  background: var(--surface-soft);
  border-color: var(--border);
}

.account-card__accent {
  color: #684515;
  background: #f5e8cf;
  border-color: #d9b878;
}

.account-card__accent:hover {
  background: #ecd5a7;
  border-color: #cba65e;
}

.account-card__text-action {
  border-color: transparent;
}

.account-card__text-action--danger {
  color: var(--danger);
}

@media (max-width: 40rem) {
  .account-card__header,
  .account-card__footer {
    align-items: stretch;
  }

  .account-card__footer {
    display: grid;
  }

  .account-card__status {
    align-self: start;
  }
}
</style>
