<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import AccountCard from '@/components/accounts/AccountCard.vue'
import { useToolStore } from '@/stores/useToolStore'
import type { Account } from '@/types/domain'

const props = defineProps<{
  now: number
}>()

const emit = defineEmits<{
  add: []
  start: [id: string]
  pause: [id: string]
  wait: [id: string]
  complete: [id: string]
  reopen: [id: string]
  edit: [id: string]
  remove: [id: string]
}>()

const toolStore = useToolStore()
const sortableAccounts = ref<Account[]>([])
let dragging = false

const runningCount = computed(
  () => toolStore.accounts.filter(({ status }) => status === 'running').length,
)
const waitingCount = computed(
  () => toolStore.accounts.filter(({ status }) => status === 'waiting').length,
)
const recommendedAccount = computed(() => toolStore.getRecommendedAccount(props.now))

/** 从领域状态创建仅供视图排序的浅拷贝，禁止拖拽过程直接改写 store 数组。 */
function syncSortableAccounts(): void {
  sortableAccounts.value = [...toolStore.accounts].sort((left, right) => left.order - right.order)
}

/** 标记拖拽开始，防止外部状态同步覆盖 Sortable 正在维护的临时顺序。 */
function startDragging(): void {
  dragging = true
}

/** 将拖拽完成后的 ID 顺序一次性交给领域方法落库。 */
function commitAccountOrder(): void {
  toolStore.reorderAccounts(sortableAccounts.value.map(({ id }) => id))
}

/** 提交拖拽结果并恢复领域顺序，结束本轮拖动。 */
function finishDragging(): void {
  commitAccountOrder()
  dragging = false
  syncSortableAccounts()
}

/** 用键盘移动单个账号，并复用领域重排方法持久化完整顺序。 */
function moveAccount(id: string, direction: 'up' | 'down'): void {
  const currentIndex = sortableAccounts.value.findIndex((account) => account.id === id)
  const targetIndex = currentIndex + (direction === 'up' ? -1 : 1)
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortableAccounts.value.length) return

  const reorderedAccounts = [...sortableAccounts.value]
  const [account] = reorderedAccounts.splice(currentIndex, 1)
  if (account === undefined) return
  reorderedAccounts.splice(targetIndex, 0, account)
  sortableAccounts.value = reorderedAccounts
  commitAccountOrder()
  syncSortableAccounts()
}

/** 请求打开新增账号表单。 */
function addAccount(): void {
  emit('add')
}

watch(
  () => toolStore.accounts.map(({ id, order }) => `${id}:${order}`).join('|'),
  () => {
    if (!dragging) syncSortableAccounts()
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="account-board"
    aria-labelledby="account-board-title"
  >
    <header class="account-board__header">
      <div>
        <p class="account-board__eyebrow">
          今日账号
        </p>
        <h2 id="account-board-title">
          并行任务工作台
        </h2>
        <p class="account-board__summary">
          推荐只负责提示优先级，不会自动开始计时。
        </p>
      </div>
      <button
        type="button"
        aria-label="新增师门账号"
        @click="addAccount"
      >
        新增账号
      </button>
    </header>

    <dl class="account-board__stats">
      <div>
        <dt>账号总数</dt>
        <dd>{{ toolStore.accounts.length }}</dd>
      </div>
      <div>
        <dt>计时中</dt>
        <dd>{{ runningCount }}</dd>
      </div>
      <div>
        <dt>等待中</dt>
        <dd>{{ waitingCount }}</dd>
      </div>
      <div class="account-board__recommended-stat">
        <dt>推荐账号</dt>
        <dd>{{ recommendedAccount?.name ?? '暂无' }}</dd>
      </div>
    </dl>

    <div
      v-if="sortableAccounts.length === 0"
      class="account-board__empty"
    >
      <strong>还没有账号</strong>
      <p>先新增一个账号，再开始记录今天的有效耗时。</p>
      <button
        type="button"
        aria-label="新增第一个师门账号"
        @click="addAccount"
      >
        新增第一个账号
      </button>
    </div>

    <VueDraggable
      v-else
      v-model="sortableAccounts"
      class="account-board__list"
      handle=".account-card__drag-handle"
      ghost-class="account-board__ghost"
      :animation="160"
      aria-label="账号排序列表"
      @start="startDragging"
      @end="finishDragging"
    >
      <AccountCard
        v-for="(account, index) in sortableAccounts"
        :key="account.id"
        :account="account"
        :now="now"
        :recommended="recommendedAccount?.id === account.id"
        :can-move-up="index > 0"
        :can-move-down="index < sortableAccounts.length - 1"
        @start="emit('start', $event)"
        @pause="emit('pause', $event)"
        @wait="emit('wait', $event)"
        @complete="emit('complete', $event)"
        @reopen="emit('reopen', $event)"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @move="moveAccount"
      />
    </VueDraggable>
  </section>
</template>

<style scoped>
.account-board {
  display: grid;
  gap: 1.25rem;
}

.account-board__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
}

.account-board__eyebrow,
.account-board__summary,
.account-board h2,
.account-board__empty p {
  margin-top: 0;
}

.account-board__eyebrow {
  margin-bottom: 0.5rem;
  color: var(--mint-700);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.account-board h2 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  letter-spacing: -0.03em;
}

.account-board__summary {
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.6;
}

.account-board__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  overflow: hidden;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.account-board__stats > div {
  min-width: 0;
  padding: 1rem;
  border-right: 1px solid var(--border);
}

.account-board__stats > div:last-child {
  border-right: 0;
}

.account-board__stats dt {
  margin-bottom: 0.375rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.account-board__stats dd {
  margin: 0;
  overflow: hidden;
  font-size: 1.125rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-board__recommended-stat dd {
  color: var(--mint-700);
}

.account-board__list {
  display: grid;
  gap: 0.875rem;
}

.account-board__ghost {
  opacity: 0.35;
}

.account-board__empty {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
  padding: 2rem;
  background: var(--surface-soft);
  border: 1px dashed var(--border);
  border-radius: 0.75rem;
}

.account-board__empty p {
  margin-bottom: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

@media (max-width: 40rem) {
  .account-board__header {
    display: grid;
    align-items: start;
  }

  .account-board__header button {
    justify-self: start;
  }

  .account-board__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .account-board__stats > div:nth-child(2) {
    border-right: 0;
  }

  .account-board__stats > div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--border);
  }
}
</style>
