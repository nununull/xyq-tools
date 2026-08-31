<script setup lang="ts">
import { computed, ref } from 'vue'
import { BookOpenCheck, CircleAlert } from 'lucide-vue-next'
import ArtifactFilters from '@/components/artifacts/ArtifactFilters.vue'
import ArtifactTaskCard from '@/components/artifacts/ArtifactTaskCard.vue'
import { ARTIFACT_GUIDE_VERIFIED_AT, ARTIFACT_TASKS } from '@/data/artifactTasks'
import type { ArtifactSeries, ArtifactVerdict } from '@/types/artifactGuide'

type SeriesFilter = 'all' | ArtifactSeries
type VerdictFilter = 'all' | ArtifactVerdict

const query = ref('')
const series = ref<SeriesFilter>('all')
const verdict = ref<VerdictFilter>('all')

/** 统一压缩搜索文本，兼容用户输入空格和大小写差异。 */
function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('zh-CN')
}

/** 搜索、系列和取舍条件全部从神器静态数据源派生。 */
const filteredTasks = computed(() => {
  const normalizedQuery = normalizeSearchText(query.value)

  return ARTIFACT_TASKS.filter((task) => {
    const matchesSeries = series.value === 'all' || task.series === series.value
    const matchesVerdict = verdict.value === 'all' || task.verdict === verdict.value
    const searchableText = [
      task.name,
      task.verdictNote,
      task.communitySummary,
      ...task.materials.flatMap((material) => [material.name, material.detail]),
    ].join(' ').toLocaleLowerCase('zh-CN')

    return matchesSeries && matchesVerdict && searchableText.includes(normalizedQuery)
  })
})

/** 系列数量固定取自完整神器数据，不随其他筛选抖动。 */
const seriesCounts = computed<Readonly<Record<SeriesFilter, number>>>(() => ({
  all: ARTIFACT_TASKS.length,
  start: ARTIFACT_TASKS.filter((task) => task.series === 'start').length,
  turn: ARTIFACT_TASKS.filter((task) => task.series === 'turn').length,
}))

/** 取舍数量固定取自完整神器数据，方便快速理解样本分布。 */
const verdictCounts = computed<Readonly<Record<VerdictFilter, number>>>(() => ({
  all: ARTIFACT_TASKS.length,
  recommended: ARTIFACT_TASKS.filter((task) => task.verdict === 'recommended').length,
  conditional: ARTIFACT_TASKS.filter((task) => task.verdict === 'conditional').length,
  skip: ARTIFACT_TASKS.filter((task) => task.verdict === 'skip').length,
}))

/** 一键恢复全部筛选，避免空结果时逐项撤销。 */
function resetFilters(): void {
  query.value = ''
  series.value = 'all'
  verdict.value = 'all'
}
</script>

<template>
  <div class="artifact-helper-view">
    <header class="artifact-helper-view__hero">
      <div class="artifact-helper-view__hero-copy">
        <p class="artifact-helper-view__eyebrow">
          电脑版 · 神器任务速查
        </p>
        <h1>这把神器，<span>接不接？</span></h1>
        <p class="artifact-helper-view__intro">
          先看要交什么，再看五开玩家怎么骂。结论只帮你省时间，最终还得结合本区物价和队伍强度。
        </p>
      </div>

      <aside
        class="artifact-helper-view__rules"
        aria-label="结论说明"
      >
        <p>判签规矩</p>
        <dl>
          <div>
            <dt class="artifact-helper-view__rule--recommended">
              接
            </dt>
            <dd>材料和难度都能接受</dd>
          </div>
          <div>
            <dt class="artifact-helper-view__rule--conditional">
              慎
            </dt>
            <dd>先看物价、星级或队伍</dd>
          </div>
          <div>
            <dt class="artifact-helper-view__rule--skip">
              弃
            </dt>
            <dd>普遍费钱、费时或难打</dd>
          </div>
        </dl>
      </aside>
    </header>

    <section
      class="artifact-helper-view__workspace"
      aria-label="神器查询结果"
    >
      <ArtifactFilters
        v-model:query="query"
        v-model:series="series"
        v-model:verdict="verdict"
        :series-counts="seriesCounts"
        :verdict-counts="verdictCounts"
      />

      <div class="artifact-helper-view__result-heading">
        <div>
          <BookOpenCheck
            :size="17"
            aria-hidden="true"
          />
          <p
            role="status"
            aria-live="polite"
          >
            找到 <strong>{{ filteredTasks.length }}</strong> 个神器
          </p>
        </div>
        <small>资料核对：{{ ARTIFACT_GUIDE_VERIFIED_AT }}</small>
      </div>

      <div
        v-if="filteredTasks.length > 0"
        class="artifact-helper-view__list"
      >
        <ArtifactTaskCard
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
        />
      </div>

      <section
        v-else
        class="artifact-helper-view__empty"
        aria-labelledby="artifact-empty-title"
      >
        <CircleAlert
          :size="24"
          aria-hidden="true"
        />
        <h2 id="artifact-empty-title">
          没找到这个神器
        </h2>
        <p>换个关键词，或者直接清空筛选。</p>
        <button
          type="button"
          @click="resetFilters"
        >
          清空筛选
        </button>
      </section>
    </section>

    <footer class="artifact-helper-view__disclaimer">
      <strong>别把“网友口碑”当系统公告。</strong>
      <span>任务机制、奖励和市场价格会变；每张卡都保留了原始攻略链接，价格高的时候自己再算一遍。</span>
    </footer>
  </div>
</template>

<style scoped>
.artifact-helper-view {
  --artifact-red: #9b3f35;
  --artifact-red-soft: #f8e8e4;
  --artifact-amber: #a96520;
  --artifact-amber-soft: #fbf0de;
  --artifact-green: #356f5f;
  --artifact-green-soft: #e5f1eb;

  width: min(100%, 72rem);
  min-width: 0;
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 2.5rem);
}

.artifact-helper-view__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.42fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: end;
  margin-bottom: clamp(1.75rem, 4vw, 2.75rem);
  padding-bottom: clamp(1.75rem, 4vw, 2.5rem);
  border-bottom: 1px solid var(--border);
}

.artifact-helper-view__hero::after {
  position: absolute;
  bottom: -0.125rem;
  left: 0;
  width: 5rem;
  height: 0.25rem;
  background: var(--artifact-red);
  content: "";
}

.artifact-helper-view__hero-copy {
  min-width: 0;
}

.artifact-helper-view__eyebrow {
  margin: 0 0 0.625rem;
  color: var(--artifact-red);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.artifact-helper-view__hero h1 {
  margin: 0;
  color: var(--text);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: clamp(2.25rem, 5.5vw, 4.25rem);
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.artifact-helper-view__hero h1 span {
  color: var(--artifact-red);
}

.artifact-helper-view__intro {
  max-width: 42rem;
  margin: 1rem 0 0;
  color: var(--text-muted);
  font-size: 0.9375rem;
  line-height: 1.75;
}

.artifact-helper-view__rules {
  padding: 1rem 1.125rem;
  background: var(--surface-soft);
  border-top: 0.1875rem solid var(--text);
}

.artifact-helper-view__rules > p {
  margin: 0 0 0.625rem;
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.artifact-helper-view__rules dl {
  display: grid;
  gap: 0.5rem;
  margin: 0;
}

.artifact-helper-view__rules dl > div {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr);
  gap: 0.625rem;
  align-items: center;
}

.artifact-helper-view__rules dt {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  color: var(--surface-raised);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: 0.8125rem;
  font-weight: 900;
}

.artifact-helper-view__rule--recommended {
  background: var(--artifact-green);
}

.artifact-helper-view__rule--conditional {
  background: var(--artifact-amber);
}

.artifact-helper-view__rule--skip {
  background: var(--artifact-red);
}

.artifact-helper-view__rules dd {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}

.artifact-helper-view__workspace {
  min-width: 0;
}

.artifact-helper-view__result-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.5rem 0 0.875rem;
}

.artifact-helper-view__result-heading > div {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--text-muted);
}

.artifact-helper-view__result-heading p {
  margin: 0;
  font-size: 0.8125rem;
}

.artifact-helper-view__result-heading strong {
  color: var(--text);
}

.artifact-helper-view__result-heading small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.artifact-helper-view__list {
  display: grid;
  gap: 0.875rem;
}

.artifact-helper-view__empty {
  display: grid;
  min-height: 16rem;
  padding: 2.5rem 1.5rem;
  place-items: center;
  align-content: center;
  color: var(--text-muted);
  text-align: center;
  background: var(--surface-soft);
  border: 1px dashed var(--border-strong);
  border-radius: 0.875rem;
}

.artifact-helper-view__empty h2 {
  margin: 0.75rem 0 0;
  color: var(--text);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: 1.25rem;
}

.artifact-helper-view__empty p {
  margin: 0.375rem 0 1rem;
  font-size: 0.875rem;
}

.artifact-helper-view__disclaimer {
  display: flex;
  gap: 0.375rem 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.65;
  border-top: 1px dashed var(--border);
}

.artifact-helper-view__disclaimer strong {
  flex: 0 0 auto;
  color: var(--text);
}

@media (max-width: 48rem) {
  .artifact-helper-view__hero {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .artifact-helper-view__rules {
    max-width: 32rem;
  }
}

@media (max-width: 40rem) {
  .artifact-helper-view {
    padding-inline: 1rem;
  }

  .artifact-helper-view__result-heading {
    align-items: flex-start;
  }

  .artifact-helper-view__result-heading small {
    text-align: right;
  }

  .artifact-helper-view__disclaimer {
    display: grid;
  }
}
</style>
