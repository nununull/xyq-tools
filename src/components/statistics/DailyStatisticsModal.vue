<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import {
  loadDailyStatistics,
  loadStatisticAccountOptions,
  type DailyStatistic,
  type StatisticAccountOption,
} from '@/services/dailyStatistics'
import { getLocalDateKey } from '@/services/localDate'

const PAGE_SIZE = 20
const props = defineProps<{ open: boolean; userId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const today = getLocalDateKey(new Date())
const rows = ref<DailyStatistic[]>([])
const accountOptions = ref<StatisticAccountOption[]>([])
const startDate = ref(today)
const endDate = ref(today)
const accountId = ref('')
const page = ref(1)
const loading = ref(false)
const errorMessage = ref('')

const totalDays = computed(() => new Set(rows.value.map(({ statDate }) => statDate)).size)
const totalDuration = computed(() => rows.value.reduce((sum, row) => sum + row.accumulatedMs, 0))
const totalHighValue = computed(() => rows.value.reduce((sum, row) => sum + row.highValueCount, 0))
const totalCompleted = computed(() => rows.value.filter(({ completed }) => completed).length)
const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)))
const pagedRows = computed(() => rows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

/** 将毫秒时长格式化为便于汇总阅读的小时与分钟。 */
function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60_000)
  return `${Math.floor(totalMinutes / 60)}小时${totalMinutes % 60}分`
}

/** 校验日期区间并按当前筛选条件重新查询全部匹配统计。 */
async function queryStatistics(): Promise<void> {
  errorMessage.value = ''
  if (props.userId === null) return
  if (startDate.value > endDate.value) {
    errorMessage.value = '开始日期不能晚于结束日期。'
    return
  }

  loading.value = true
  try {
    rows.value = await loadDailyStatistics(props.userId, {
      startDate: startDate.value,
      endDate: endDate.value,
      accountId: accountId.value || null,
    })
    page.value = 1
  } catch (error: unknown) {
    rows.value = []
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

/** 弹窗打开时恢复当天筛选并加载账号选项和统计。 */
async function initializeStatistics(): Promise<void> {
  startDate.value = today
  endDate.value = today
  accountId.value = ''
  accountOptions.value = []
  if (props.userId === null) return
  try {
    accountOptions.value = await loadStatisticAccountOptions(props.userId)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
  await queryStatistics()
}

/** 切换统计明细页，不允许越过有效分页边界。 */
function changePage(nextPage: number): void {
  page.value = Math.min(pageCount.value, Math.max(1, nextPage))
}

watch(() => props.open, (open) => { if (open) void initializeStatistics() })
</script>

<template>
  <BaseModal
    :open="open"
    size="wide"
    title="每日数据明细与汇总"
    description="汇总只计算当前查询条件匹配的数据。"
    @close="emit('close')"
  >
    <form
      class="daily-stats__filters"
      @submit.prevent="queryStatistics"
    >
      <label><span>开始日期</span><input
        v-model="startDate"
        type="date"
        :max="endDate"
      ></label>
      <label><span>结束日期</span><input
        v-model="endDate"
        type="date"
        :min="startDate"
      ></label>
      <label><span>账号</span><select v-model="accountId"><option value="">全部账号</option><option
        v-for="account in accountOptions"
        :key="account.id"
        :value="account.id"
      >{{ account.name }}</option></select></label>
      <button
        type="submit"
        :disabled="loading"
      >
        查询
      </button>
    </form>

    <div
      v-if="loading"
      class="daily-stats__state"
      role="status"
    >
      正在读取统计数据…
    </div>
    <div
      v-else-if="errorMessage"
      class="daily-stats__state daily-stats__state--error"
      role="alert"
    >
      {{ errorMessage }}
    </div>
    <template v-else>
      <dl class="daily-stats__summary">
        <div><dt>统计天数</dt><dd>{{ totalDays }}</dd></div>
        <div><dt>总耗时</dt><dd>{{ formatDuration(totalDuration) }}</dd></div>
        <div><dt>高价值</dt><dd>{{ totalHighValue }} 次</dd></div>
        <div><dt>完成记录</dt><dd>{{ totalCompleted }} 条</dd></div>
      </dl>
      <div
        v-if="rows.length === 0"
        class="daily-stats__state"
      >
        当前条件没有统计数据。
      </div>
      <template v-else>
        <div class="daily-stats__table-wrap">
          <table>
            <thead><tr><th>日期</th><th>账号</th><th>耗时</th><th>高价值</th><th>完成</th></tr></thead>
            <tbody>
              <tr
                v-for="row in pagedRows"
                :key="`${row.statDate}:${row.accountId}`"
              >
                <td>{{ row.statDate }}</td><td>{{ row.accountName }}</td><td>{{ formatDuration(row.accumulatedMs) }}</td><td>{{ row.highValueCount }} 次</td><td>{{ row.completed ? '是' : '否' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav
          class="daily-stats__pagination"
          aria-label="统计明细分页"
        >
          <button
            type="button"
            :disabled="page === 1"
            @click="changePage(page - 1)"
          >
            上一页
          </button>
          <span>第 {{ page }} / {{ pageCount }} 页，共 {{ rows.length }} 条</span>
          <button
            type="button"
            :disabled="page === pageCount"
            @click="changePage(page + 1)"
          >
            下一页
          </button>
        </nav>
      </template>
    </template>
    <footer class="daily-stats__footer">
      <button
        type="button"
        @click="emit('close')"
      >
        关闭
      </button>
    </footer>
  </BaseModal>
</template>

<style scoped>
.daily-stats__filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: end; gap: .625rem; margin-bottom: 1rem; }
.daily-stats__filters label { display: grid; gap: .3rem; color: var(--text-muted); font-size: .75rem; font-weight: 700; }
.daily-stats__filters input, .daily-stats__filters select { min-width: 0; padding: .55rem; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: .5rem; }
.daily-stats__summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; margin: 0 0 1rem; }
.daily-stats__summary div { padding: .65rem; background: var(--surface-soft); border: 1px solid var(--border); border-radius: .6rem; }
.daily-stats__summary dt { color: var(--text-muted); font-size: .75rem; }
.daily-stats__summary dd { margin: .2rem 0 0; font-weight: 800; font-variant-numeric: tabular-nums; }
.daily-stats__table-wrap { max-height: 24rem; overflow: auto; border: 1px solid var(--border); border-radius: .6rem; }
table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
th, td { padding: .6rem; text-align: left; white-space: nowrap; border-bottom: 1px solid var(--border); }
th { position: sticky; top: 0; background: var(--surface-soft); }
.daily-stats__state { padding: 1.25rem; color: var(--text-muted); text-align: center; }
.daily-stats__state--error { color: var(--danger); }
.daily-stats__pagination, .daily-stats__footer { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; margin-top: .75rem; }
.daily-stats__pagination span { color: var(--text-muted); font-size: .8125rem; font-variant-numeric: tabular-nums; }
@media (max-width: 42rem) { .daily-stats__filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } .daily-stats__summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 28rem) { .daily-stats__filters { grid-template-columns: 1fr; } .daily-stats__pagination { justify-content: space-between; flex-wrap: wrap; } }
</style>
