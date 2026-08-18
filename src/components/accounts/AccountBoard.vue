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
const RECOMMENDATION_INTERVAL_MS = 5_000
const recommendationNow = computed(
  () => Math.floor(props.now / RECOMMENDATION_INTERVAL_MS) * RECOMMENDATION_INTERVAL_MS,
)
const recommendedAccount = computed(() => toolStore.getRecommendedAccount(recommendationNow.value))

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
        <div class="account-board__title-line">
          <p class="account-board__eyebrow">
            今日账号
          </p>
          <span>{{ toolStore.accounts.length }} 个</span>
          <span>{{ runningCount }} 计时</span>
          <span>{{ waitingCount }} 等待</span>
        </div>
        <h2 id="account-board-title">
          账号操作台
        </h2>
      </div>
      <button
        type="button"
        aria-label="新增师门账号"
        @click="addAccount"
      >
        新增账号
      </button>
    </header>

    <div
      class="account-board__recommendation"
      role="status"
    >
      <span>★ 当前推荐</span>
      <strong>{{ recommendedAccount?.name ?? '暂无可推荐账号' }}</strong>
      <small>实时比较可操作账号 · 每 5 秒刷新</small>
    </div>

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
  gap: 0.75rem;
}

.account-board__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.account-board__eyebrow,
.account-board h2,
.account-board__empty p {
  margin-top: 0;
}

.account-board__eyebrow {
  margin-bottom: 0;
  color: var(--mint-700);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.account-board h2 {
  margin: 0.125rem 0 0;
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.account-board__title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.account-board__title-line > span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.account-board__recommendation {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  color: #684515;
  background: #fff4d9;
  border: 1px solid #d9b878;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
}

.account-board__recommendation span {
  font-weight: 800;
}

.account-board__recommendation strong {
  font-size: 1rem;
}

.account-board__recommendation small {
  margin-left: auto;
  color: #81591f;
}

.account-board__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 0.625rem;
  align-items: start;
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

  .account-board__recommendation {
    align-items: start;
    flex-wrap: wrap;
  }

  .account-board__recommendation small {
    width: 100%;
    margin-left: 0;
  }
}
</style>
