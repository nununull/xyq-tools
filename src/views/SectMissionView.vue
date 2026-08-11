<script lang="ts">
import type { SaveResult } from '@/services/persistence'

type FailedSaveResult = Extract<SaveResult, { ok: false }>

const consumedSaveFailures = new WeakSet<FailedSaveResult>()

/** 仅让新的保存失败结果对象通过一次，避免视图重挂载重复反馈旧失败。 */
export function consumeNewSaveFailure(result: SaveResult | null): result is FailedSaveResult {
  if (result === null || result.ok || consumedSaveFailures.has(result)) return false
  consumedSaveFailures.add(result)
  return true
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AccountBoard from '@/components/accounts/AccountBoard.vue'
import AccountFormModal from '@/components/accounts/AccountFormModal.vue'
import { useClock } from '@/composables/useClock'
import {
  useNotifier,
  type NotificationPermissionResult,
} from '@/composables/useNotifier'
import { useToolStore } from '@/stores/useToolStore'
import { useUiStore } from '@/stores/useUiStore'
import type { Account, AccountDraft } from '@/types/domain'

const toolStore = useToolStore()
const uiStore = useUiStore()
const { notifyReady, requestPermission, restoreTitle } = useNotifier()
const accountFormOpen = ref(false)
const editingAccountId = ref<string | null>(null)

const editingAccount = computed<Account | undefined>(() =>
  toolStore.accounts.find(({ id }) => id === editingAccountId.value),
)
const waitingAccounts = computed(() =>
  toolStore.accounts
    .filter(({ status }) => status === 'waiting')
    .sort((left, right) => left.order - right.order),
)
const readyAccounts = computed(() =>
  toolStore.accounts
    .filter(({ status }) => status === 'ready')
    .sort((left, right) => left.order - right.order),
)

/** 每次时钟更新先处理跨日，再只通知本轮刚刚到期的账号。 */
function handleTick(current: number): void {
  toolStore.ensureCurrentDate(current)
  const expiredIds = toolStore.expireWaits(current)
  for (const id of expiredIds) {
    const account = toolStore.accounts.find((candidate) => candidate.id === id)
    if (account !== undefined) notifyReady(account.name)
  }
}

const { now } = useClock(handleTick)

/** 将毫秒格式化为不按自然日回绕的“时:分:秒”。 */
function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

/** 计算等待账号在当前页面时钟下的剩余时长。 */
function getWaitingRemaining(account: Account): number {
  return account.waitingUntil === null ? 0 : Math.max(0, account.waitingUntil - now.value)
}

/** 返回可展示的未知异常文本。 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 没有剩余就绪账号时恢复普通页面标题。 */
function restoreTitleWhenHandled(): void {
  if (!toolStore.accounts.some(({ status }) => status === 'ready')) restoreTitle()
}

/** 打开空白的新增账号表单。 */
function openAddAccountForm(): void {
  editingAccountId.value = null
  accountFormOpen.value = true
}

/** 打开指定账号的编辑表单。 */
function openEditAccountForm(id: string): void {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account === undefined) {
    uiStore.toast('账号不存在，无法编辑。', 'warning')
    return
  }
  editingAccountId.value = id
  accountFormOpen.value = true
}

/** 关闭账号表单并清除编辑目标。 */
function closeAccountForm(): void {
  accountFormOpen.value = false
  editingAccountId.value = null
}

/** 新增或更新账号，并用统一反馈报告结果。 */
function saveAccount(draft: AccountDraft): void {
  if (editingAccountId.value === null) {
    const account = toolStore.addAccount(draft)
    closeAccountForm()
    uiStore.toast(`已新增账号 ${account.name}。`, 'success')
    return
  }

  const accountId = editingAccountId.value
  if (!toolStore.updateAccount(accountId, draft)) {
    uiStore.toast('账号不存在，修改未保存。', 'danger')
    return
  }
  closeAccountForm()
  uiStore.toast(`已保存账号 ${draft.name}。`, 'success')
}

/** 启动账号的有效计时，不会停止其他正在运行的账号。 */
function startAccount(id: string): void {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account !== undefined && toolStore.startAccount(id, Date.now())) {
    uiStore.toast(`${account.name} 已开始计时。`, 'success')
    restoreTitleWhenHandled()
    return
  }
  uiStore.toast('当前账号状态不能开始计时。', 'warning')
}

/** 暂停指定账号并结算本次运行区间。 */
function pauseAccount(id: string): void {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account !== undefined && toolStore.pauseAccount(id, Date.now())) {
    uiStore.toast(`${account.name} 已暂停。`, 'info')
    return
  }
  uiStore.toast('当前账号状态不能暂停。', 'warning')
}

/** 将运行账号送入独立的五分钟高价值等待。 */
function waitAccount(id: string): void {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account !== undefined && toolStore.waitAccount(id, Date.now())) {
    uiStore.toast(`${account.name} 已进入五分钟高价值等待。`, 'success')
    return
  }
  uiStore.toast('只有计时中的账号可以进入高价值等待。', 'warning')
}

/** 完成可操作账号，运行状态会由 store 先结算耗时。 */
function completeAccount(id: string): void {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account !== undefined && toolStore.completeAccount(id, Date.now())) {
    uiStore.toast(`${account.name} 已完成。`, 'success')
    restoreTitleWhenHandled()
    return
  }
  uiStore.toast('当前账号状态不能完成。', 'warning')
}

/** 撤销账号完成状态并保留已结算耗时。 */
function reopenAccount(id: string): void {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account !== undefined && toolStore.reopenAccount(id)) {
    uiStore.toast(`${account.name} 已撤销完成。`, 'info')
    return
  }
  uiStore.toast('当前账号无法撤销完成。', 'warning')
}

/** 通过危险确认删除账号，并捕获确认流程可能抛出的异常。 */
async function requestRemoveAccount(id: string): Promise<void> {
  const account = toolStore.accounts.find((candidate) => candidate.id === id)
  if (account === undefined) {
    uiStore.toast('账号不存在，无法删除。', 'warning')
    return
  }

  try {
    const confirmed = await uiStore.confirm({
      title: `删除账号 ${account.name}？`,
      description: '该账号今天的计时和等待记录会一起删除，此操作无法撤销。',
      tone: 'danger',
      confirmLabel: '删除账号',
    })
    if (!confirmed) return

    if (toolStore.removeAccount(id)) {
      uiStore.toast(`已删除账号 ${account.name}。`, 'success')
      restoreTitleWhenHandled()
      return
    }
    uiStore.toast('账号已不存在，删除未执行。', 'warning')
  } catch (error: unknown) {
    uiStore.toast(`删除确认失败：${getErrorMessage(error)}`, 'danger')
  }
}

/** 通过危险确认重置今日进度，并捕获确认流程可能抛出的异常。 */
async function requestDailyReset(): Promise<void> {
  try {
    const confirmed = await uiStore.confirm({
      title: '重置今日进度？',
      description: '所有账号的计时、等待和完成状态会被清空，账号资料与排序保留。',
      tone: 'danger',
      confirmLabel: '重置今日进度',
    })
    if (!confirmed) return

    if (toolStore.resetDailyProgress(Date.now())) {
      restoreTitle()
      uiStore.toast('今日进度已重置。', 'success')
      return
    }
    uiStore.toast('当前时间无效，今日进度未重置。', 'danger')
  } catch (error: unknown) {
    uiStore.toast(`重置确认失败：${getErrorMessage(error)}`, 'danger')
  }
}

/** 仅响应用户明确点击来请求系统通知权限。 */
async function enableSystemNotifications(): Promise<void> {
  const result: NotificationPermissionResult = await requestPermission()
  if (result === 'granted') {
    uiStore.toast('系统通知已开启。', 'success')
    return
  }
  uiStore.toast('系统通知未开启，仍会使用声音、标题和页面提醒。', 'info')
}

/** 将启动恢复警告转为可见 Toast，并标记为已经消费。 */
function showBootWarning(): void {
  if (toolStore.loadWarning === null) return
  uiStore.toast(toolStore.loadWarning, 'warning')
  toolStore.loadWarning = null
}

/** 将最近一次持久化失败转为危险 Toast。 */
function showSaveFailure(result: SaveResult | null): void {
  if (consumeNewSaveFailure(result)) uiStore.toast(result.message, 'danger')
}

showBootWarning()
watch(() => toolStore.lastSaveResult, showSaveFailure, { immediate: true })
</script>

<template>
  <main class="sect-mission-view">
    <header class="sect-mission-view__header">
      <div>
        <p class="sect-mission-view__eyebrow">
          每日工具
        </p>
        <h1>师门助手</h1>
        <p class="sect-mission-view__description">
          多账号独立计时、五分钟高价值等待和今日完成进度，都在一个页面里处理。
        </p>
      </div>
      <div class="sect-mission-view__header-actions">
        <button
          class="sect-mission-view__secondary"
          type="button"
          aria-label="启用账号到期系统通知"
          @click="enableSystemNotifications"
        >
          启用系统通知
        </button>
        <button
          class="sect-mission-view__danger"
          type="button"
          aria-label="重置所有账号的今日进度"
          @click="requestDailyReset"
        >
          重置今日进度
        </button>
      </div>
    </header>

    <section
      class="sect-mission-view__attention"
      aria-labelledby="attention-title"
    >
      <header>
        <div>
          <p class="sect-mission-view__section-label">
            到期中心
          </p>
          <h2 id="attention-title">
            高价值提醒
          </h2>
        </div>
        <span>{{ waitingAccounts.length }} 等待 · {{ readyAccounts.length }} 可切回</span>
      </header>

      <p
        v-if="waitingAccounts.length === 0 && readyAccounts.length === 0"
        class="sect-mission-view__attention-empty"
      >
        当前没有等待中或可切回的账号。
      </p>

      <div
        v-else
        class="sect-mission-view__attention-groups"
      >
        <section
          v-if="readyAccounts.length > 0"
          aria-labelledby="ready-accounts-title"
        >
          <h3 id="ready-accounts-title">
            可以切回
          </h3>
          <ul>
            <li
              v-for="account in readyAccounts"
              :key="account.id"
              class="sect-mission-view__ready-item"
            >
              <strong>{{ account.name }}</strong>
              <div>
                <button
                  type="button"
                  :aria-label="`继续账号 ${account.name} 的计时`"
                  @click="startAccount(account.id)"
                >
                  继续
                </button>
                <button
                  class="sect-mission-view__secondary"
                  type="button"
                  :aria-label="`完成账号 ${account.name}`"
                  @click="completeAccount(account.id)"
                >
                  完成
                </button>
              </div>
            </li>
          </ul>
        </section>

        <section
          v-if="waitingAccounts.length > 0"
          aria-labelledby="waiting-accounts-title"
        >
          <h3 id="waiting-accounts-title">
            等待中
          </h3>
          <ul>
            <li
              v-for="account in waitingAccounts"
              :key="account.id"
            >
              <strong>{{ account.name }}</strong>
              <span>{{ formatDuration(getWaitingRemaining(account)) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </section>

    <AccountBoard
      :now="now"
      @add="openAddAccountForm"
      @start="startAccount"
      @pause="pauseAccount"
      @wait="waitAccount"
      @complete="completeAccount"
      @reopen="reopenAccount"
      @edit="openEditAccountForm"
      @remove="requestRemoveAccount"
    />

    <AccountFormModal
      :open="accountFormOpen"
      :account="editingAccount"
      @save="saveAccount"
      @close="closeAccountForm"
    />
  </main>
</template>

<style scoped>
.sect-mission-view {
  display: grid;
  gap: clamp(2rem, 6vw, 3.5rem);
  width: min(100%, 64rem);
  margin: 0 auto;
  padding: clamp(2rem, 7vw, 5rem) 1.5rem;
}

.sect-mission-view__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}

.sect-mission-view__header > div:first-child {
  max-width: 42rem;
}

.sect-mission-view__eyebrow,
.sect-mission-view__section-label,
.sect-mission-view h1,
.sect-mission-view h2,
.sect-mission-view h3,
.sect-mission-view p {
  margin-top: 0;
}

.sect-mission-view__eyebrow,
.sect-mission-view__section-label {
  margin-bottom: 0.75rem;
  color: var(--mint-700);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.sect-mission-view h1 {
  margin-bottom: 1rem;
  color: var(--text);
  font-size: clamp(2.25rem, 7vw, 4.5rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
}

.sect-mission-view__description {
  max-width: 37rem;
  margin-bottom: 0;
  color: var(--text-muted);
  line-height: 1.75;
}

.sect-mission-view__header-actions {
  display: grid;
  flex: 0 0 auto;
  gap: 0.625rem;
}

.sect-mission-view__secondary,
.sect-mission-view__danger {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.sect-mission-view__secondary:hover {
  background: var(--surface-soft);
  border-color: var(--border);
}

.sect-mission-view__danger {
  color: var(--danger);
}

.sect-mission-view__danger:hover {
  color: var(--surface);
  background: var(--danger);
  border-color: var(--danger);
}

.sect-mission-view__attention {
  padding: 1.25rem;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.sect-mission-view__attention > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.sect-mission-view__attention h2 {
  margin-bottom: 0;
  font-size: 1.375rem;
  letter-spacing: -0.025em;
}

.sect-mission-view__attention > header > span {
  color: var(--text-muted);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.sect-mission-view__attention-empty {
  margin: 1rem 0 0;
  color: var(--text-muted);
}

.sect-mission-view__attention-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
}

.sect-mission-view__attention-groups section {
  min-width: 0;
  padding: 1rem;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  border: 1px solid var(--border);
  border-radius: 0.625rem;
}

.sect-mission-view__attention-groups h3 {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.sect-mission-view__attention-groups ul {
  display: grid;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sect-mission-view__attention-groups li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
}

.sect-mission-view__attention-groups li + li {
  padding-top: 0.625rem;
  border-top: 1px solid var(--border);
}

.sect-mission-view__attention-groups strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.sect-mission-view__attention-groups li > span {
  flex: 0 0 auto;
  color: #8b5c20;
  font-variant-numeric: tabular-nums;
}

.sect-mission-view__ready-item > div {
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
}

.sect-mission-view__ready-item button {
  padding: 0.4rem 0.625rem;
  font-size: 0.8125rem;
}

@media (max-width: 48rem) {
  .sect-mission-view__header {
    display: grid;
    align-items: start;
  }

  .sect-mission-view__header-actions {
    display: flex;
    flex-wrap: wrap;
  }

  .sect-mission-view__attention-groups {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 30rem) {
  .sect-mission-view__attention > header,
  .sect-mission-view__attention-groups li {
    display: grid;
    align-items: start;
  }

  .sect-mission-view__attention > header > span {
    justify-self: start;
  }
}
</style>
