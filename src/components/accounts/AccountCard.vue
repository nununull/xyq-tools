<script setup lang="ts">
/* global KeyboardEvent */
import { computed, type Component } from 'vue'
import { BellRing, Circle, CircleCheck, GripVertical, Hourglass, Pause, Star, Timer } from 'lucide-vue-next'
import type { Account, AccountStatus } from '@/types/domain'

const props = defineProps<{
  account: Account
  now: number
  recommended: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  start: [id: string]
  pause: [id: string]
  wait: [id: string]
  complete: [id: string]
  reopen: [id: string]
  edit: [id: string]
  remove: [id: string]
  move: [id: string, direction: 'up' | 'down']
}>()

const STATUS_PRESENTATION: Record<AccountStatus, { label: string; icon: Component }> = {
  idle: { label: '未开始', icon: Circle },
  running: { label: '计时中', icon: Timer },
  paused: { label: '已暂停', icon: Pause },
  waiting: { label: '高价值等待', icon: Hourglass },
  ready: { label: '可以切回', icon: BellRing },
  completed: { label: '已完成', icon: CircleCheck },
}

const statusPresentation = computed(() => STATUS_PRESENTATION[props.account.status])

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

/** 用上下方向键请求移动账号，边界方向保持原顺序。 */
function handleSortKey(event: KeyboardEvent): void {
  const direction = event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down' : null
  if (direction === null) return

  event.preventDefault()
  if (direction === 'up' && !props.canMoveUp) return
  if (direction === 'down' && !props.canMoveDown) return
  emit('move', props.account.id, direction)
}
</script>

<template>
  <article
    class="account-card"
    :class="`account-card--${account.status}`"
    :aria-label="`账号 ${account.name}`"
  >
    <header class="account-card__header">
      <button
        class="account-card__drag-handle"
        type="button"
        :aria-label="`调整账号 ${account.name} 顺序，按上、下方向键移动`"
        :title="`拖动排序；按上、下方向键移动账号 ${account.name}`"
        aria-keyshortcuts="ArrowUp ArrowDown"
        :aria-disabled="!canMoveUp && !canMoveDown"
        @keydown="handleSortKey"
      >
        <GripVertical
          :size="18"
          aria-hidden="true"
        />
      </button>
      <div class="account-card__identity">
        <div class="account-card__name-line">
          <h3>{{ account.name }}</h3>
          <span
            v-if="recommended"
            class="account-card__recommendation"
          >
            <Star
              :size="12"
              aria-hidden="true"
            />
            推荐
          </span>
        </div>
        <p v-if="account.note.length > 0">
          {{ account.note }}
        </p>
      </div>
      <span
        class="account-card__status"
        role="status"
      >
        <component
          :is="statusPresentation.icon"
          :size="14"
          aria-hidden="true"
        />
        {{ statusPresentation.label }}
      </span>
    </header>

    <div class="account-card__timing">
      <div>
        <span>有效耗时</span>
        <strong :aria-label="`${account.name} 有效耗时 ${formatDuration(effectiveElapsedMs)}`">
          {{ formatDuration(effectiveElapsedMs) }}
        </strong>
      </div>
      <div class="account-card__high-value-count">
        <strong>今日高价值{{ account.highValueCount ?? 0 }}次</strong>
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
          class="account-card__resume"
          type="button"
          :aria-label="`继续账号 ${account.name} 的计时`"
          @click="startAccount"
        >
          继续计时
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
  position: relative;
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.account-card--running {
  background: #f3f9f5;
  border-color: #a4cdbb;
}

/* 流光仅绘制在边框内，不遮挡内容，也不拦截拖拽和按钮点击。 */
.account-card--running::before {
  position: absolute;
  inset: -1px;
  padding: 1px;
  pointer-events: none;
  content: '';
  background: conic-gradient(
    from var(--account-card-flow-angle),
    transparent 0deg 230deg,
    rgb(112 173 153 / 25%) 270deg,
    #438f76 315deg,
    transparent 360deg
  );
  border-radius: inherit;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: account-card-flow 4s linear infinite;
}

.account-card--paused {
  background: #f5f7fa;
  border-color: #c7d0de;
}

.account-card--waiting {
  background: #fdfaf3;
  border-color: #dfd1b4;
}

.account-card--ready {
  background: #fff6df;
  border-color: #bb8528;
  box-shadow: 0 0 0 1px rgb(187 133 40 / 20%), 0 0.25rem 0.875rem rgb(187 133 40 / 10%);
  animation: account-card-ready 1.4s ease-in-out 3;
}

.account-card--completed {
  background: #f0f5f1;
  border-color: #cddbd0;
}

.account-card--completed h3,
.account-card--completed .account-card__timing strong {
  color: var(--text-muted);
}

.account-card__header {
  display: flex;
  align-items: start;
  gap: 0.5rem;
}

.account-card__drag-handle {
  flex: 0 0 auto;
  padding: 0.125rem;
  color: var(--text-muted);
  cursor: grab;
  font-size: 1rem;
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
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.account-card__identity p {
  display: -webkit-box;
  margin-top: 0.25rem;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.account-card__recommendation,
.account-card__status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.4375rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.account-card__recommendation {
  color: #684515;
  background: #f6dfaa;
}

.account-card__status {
  color: var(--text-muted);
  background: var(--surface-soft);
}

.account-card--running .account-card__status {
  color: var(--mint-800);
  background: #dceee3;
}

.account-card--paused .account-card__status {
  color: #4f607a;
  background: #e6ecf4;
}

.account-card--waiting .account-card__status {
  color: #8b5c20;
  background: #f5e8cf;
}

.account-card--ready .account-card__status {
  color: #704811;
  background: #f4d88f;
}

.account-card--completed .account-card__status {
  color: #48634f;
  background: #e1eee4;
}

.account-card__timing {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
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
  font-size: 1.125rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.account-card__waiting strong {
  color: #8b5c20;
  font-size: 1.25rem;
}

.account-card--running .account-card__timing > div:first-child strong {
  color: var(--mint-800);
}

.account-card__high-value-count strong {
  color: #81591f;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.account-card__footer {
  display: grid;
  gap: 0.375rem;
}

.account-card__primary-actions,
.account-card__admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.account-card__admin-actions {
  justify-content: end;
}

.account-card__footer button {
  min-height: 2rem;
  padding: 0.3125rem 0.625rem;
  font-size: 0.8125rem;
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

.account-card--ready .account-card__resume {
  color: #fff;
  background: #875b13;
  border-color: #875b13;
}

.account-card--ready .account-card__resume:hover {
  background: #704811;
  border-color: #704811;
}

.account-card--completed .account-card__secondary {
  color: var(--text-muted);
}

.account-card__text-action {
  border-color: transparent;
}

.account-card__text-action--danger {
  color: var(--danger);
}

@keyframes account-card-flow {
  to {
    --account-card-flow-angle: 360deg;
  }
}

@keyframes account-card-ready {
  50% {
    box-shadow: 0 0 0 0.25rem rgb(187 133 40 / 16%), 0 0.25rem 1.25rem rgb(187 133 40 / 20%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-card,
  .account-card--running::before {
    animation: none;
    transition: none;
  }

  .account-card--running::before {
    background: none;
  }
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
