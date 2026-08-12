<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { loadDailyStatistics, type DailyStatistic } from '@/services/dailyStatistics'

const props = defineProps<{ open: boolean; userId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const rows = ref<DailyStatistic[]>([])
const loading = ref(false)
const errorMessage = ref('')

const totalDays = computed(() => new Set(rows.value.map(({ statDate }) => statDate)).size)
const totalDuration = computed(() => rows.value.reduce((sum, row) => sum + row.accumulatedMs, 0))
const totalHighValue = computed(() => rows.value.reduce((sum, row) => sum + row.highValueCount, 0))
const totalCompleted = computed(() => rows.value.filter(({ completed }) => completed).length)

/** 将毫秒时长格式化为便于汇总阅读的小时与分钟。 */
function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60_000)
  return `${Math.floor(totalMinutes / 60)}小时${totalMinutes % 60}分`
}

/** 拉取当前用户统计；后发请求之外不保留旧用户数据。 */
async function refreshStatistics(): Promise<void> {
  rows.value = []
  errorMessage.value = ''
  if (props.userId === null) return
  loading.value = true
  try {
    rows.value = await loadDailyStatistics(props.userId)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (open) => { if (open) void refreshStatistics() })
</script>

<template>
  <BaseModal
    :open="open"
    title="每日数据明细与汇总"
    description="数据来自云端每日统计记录。"
    @close="emit('close')"
  >
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
      读取失败：{{ errorMessage }}
      <button
        type="button"
        @click="refreshStatistics"
      >
        重试
      </button>
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
        还没有每日统计数据。
      </div>
      <div
        v-else
        class="daily-stats__table-wrap"
      >
        <table>
          <thead><tr><th>日期</th><th>账号</th><th>耗时</th><th>高价值</th><th>完成</th></tr></thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="`${row.statDate}:${row.accountId}`"
            >
              <td>{{ row.statDate }}</td><td>{{ row.accountName }}</td><td>{{ formatDuration(row.accumulatedMs) }}</td>
              <td>{{ row.highValueCount }} 次</td><td>{{ row.completed ? '是' : '否' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
.daily-stats__state button { margin-left: .5rem; }
.daily-stats__footer { display: flex; justify-content: flex-end; margin-top: 1rem; }
@media (max-width: 36rem) { .daily-stats__summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
