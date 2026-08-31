<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { useTemplateRef } from 'vue'
import type { ArtifactSeries, ArtifactVerdict } from '@/types/artifactGuide'

type SeriesFilter = 'all' | ArtifactSeries
type VerdictFilter = 'all' | ArtifactVerdict

defineProps<{
  query: string
  series: SeriesFilter
  verdict: VerdictFilter
  seriesCounts: Readonly<Record<SeriesFilter, number>>
  verdictCounts: Readonly<Record<VerdictFilter, number>>
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:series': [value: SeriesFilter]
  'update:verdict': [value: VerdictFilter]
}>()

const searchInput = useTemplateRef<{ value: string }>('searchInput')

const SERIES_OPTIONS: readonly { value: SeriesFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'start', label: '神器·起' },
  { value: 'turn', label: '神器·转' },
]

const VERDICT_OPTIONS: readonly { value: VerdictFilter; label: string }[] = [
  { value: 'all', label: '全结论' },
  { value: 'recommended', label: '接' },
  { value: 'conditional', label: '慎' },
  { value: 'skip', label: '弃' },
]

/** 读取当前搜索框内容并同步给父组件。 */
function handleQueryInput(): void {
  emit('update:query', searchInput.value?.value ?? '')
}

/** 清空名称和材料搜索词。 */
function clearQuery(): void {
  emit('update:query', '')
}
</script>

<template>
  <section
    class="artifact-filters"
    aria-label="神器筛选"
  >
    <div class="artifact-filters__search">
      <Search
        :size="18"
        aria-hidden="true"
      />
      <label
        class="artifact-filters__search-label"
        for="artifact-search"
      >搜索神器或材料</label>
      <input
        id="artifact-search"
        ref="searchInput"
        :value="query"
        type="search"
        placeholder="比如：明火珠、三级药、家具"
        autocomplete="off"
        @input="handleQueryInput"
      >
      <button
        v-if="query.length > 0"
        class="artifact-filters__clear"
        type="button"
        aria-label="清空搜索"
        title="清空搜索"
        @click="clearQuery"
      >
        <X
          :size="17"
          aria-hidden="true"
        />
      </button>
    </div>

    <div class="artifact-filters__groups">
      <div
        class="artifact-filters__group"
        role="group"
        aria-label="神器系列"
      >
        <button
          v-for="option in SERIES_OPTIONS"
          :key="option.value"
          class="artifact-filters__option"
          :class="{ 'artifact-filters__option--active': series === option.value }"
          type="button"
          :aria-pressed="series === option.value"
          @click="$emit('update:series', option.value)"
        >
          {{ option.label }}
          <span>{{ seriesCounts[option.value] }}</span>
        </button>
      </div>

      <div
        class="artifact-filters__group artifact-filters__group--verdict"
        role="group"
        aria-label="取舍结论"
      >
        <button
          v-for="option in VERDICT_OPTIONS"
          :key="option.value"
          class="artifact-filters__option"
          :class="[
            { 'artifact-filters__option--active': verdict === option.value },
            `artifact-filters__option--${option.value}`,
          ]"
          type="button"
          :aria-pressed="verdict === option.value"
          @click="$emit('update:verdict', option.value)"
        >
          {{ option.label }}
          <span>{{ verdictCounts[option.value] }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.artifact-filters {
  display: grid;
  gap: 0.875rem;
  padding: 1rem;
  background: rgb(255 255 255 / 72%);
  border: 1px solid var(--border);
  border-radius: 0.875rem;
  box-shadow: 0 0.625rem 1.5rem rgb(37 54 48 / 5%);
}

.artifact-filters__search {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  color: var(--text-muted);
}

.artifact-filters__search > svg {
  position: absolute;
  left: 0.875rem;
  pointer-events: none;
}

.artifact-filters__search-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.artifact-filters__search input {
  appearance: none;
  width: 100%;
  min-width: 0;
  padding: 0.75rem 2.75rem 0.75rem 2.75rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 0.625rem;
  outline: none;
}

.artifact-filters__search input::-webkit-search-cancel-button {
  display: none;
  appearance: none;
}

.artifact-filters__search input:focus {
  border-color: var(--mint-700);
  box-shadow: 0 0 0 3px rgb(63 117 101 / 14%);
}

.artifact-filters__search input::placeholder {
  color: #87948e;
}

.artifact-filters__clear {
  position: absolute;
  right: 0.375rem;
  display: grid;
  width: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  padding: 0;
  place-items: center;
  color: var(--text-muted);
  background: transparent;
  border-color: transparent;
}

.artifact-filters__clear:hover {
  color: var(--text);
  background: var(--surface-soft);
  border-color: var(--border);
}

.artifact-filters__groups {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
}

.artifact-filters__group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.artifact-filters__group--verdict {
  justify-content: flex-end;
}

.artifact-filters__option {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  min-height: 2.25rem;
  padding: 0.4375rem 0.6875rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
  background: transparent;
  border-color: transparent;
  border-radius: 0.5rem;
}

.artifact-filters__option:hover {
  color: var(--text);
  background: var(--surface-soft);
  border-color: var(--border);
}

.artifact-filters__option span {
  min-width: 1.35rem;
  padding: 0.0625rem 0.3rem;
  color: var(--text-muted);
  font-size: 0.6875rem;
  line-height: 1.35;
  text-align: center;
  background: var(--surface-soft);
  border-radius: 999px;
}

.artifact-filters__option--active {
  color: var(--surface-raised);
  background: var(--text);
  border-color: var(--text);
}

.artifact-filters__option--active:hover {
  color: var(--surface-raised);
  background: var(--text);
  border-color: var(--text);
}

.artifact-filters__option--active span {
  color: var(--text);
  background: rgb(255 255 255 / 74%);
}

.artifact-filters__option--recommended.artifact-filters__option--active {
  background: var(--artifact-green);
  border-color: var(--artifact-green);
}

.artifact-filters__option--conditional.artifact-filters__option--active {
  background: var(--artifact-amber);
  border-color: var(--artifact-amber);
}

.artifact-filters__option--skip.artifact-filters__option--active {
  background: var(--artifact-red);
  border-color: var(--artifact-red);
}

@media (max-width: 56rem) {
  .artifact-filters__groups {
    display: grid;
  }

  .artifact-filters__group--verdict {
    justify-content: flex-start;
  }
}

@media (max-width: 27rem) {
  .artifact-filters {
    padding: 0.75rem;
  }

  .artifact-filters__option {
    padding-inline: 0.5625rem;
  }
}
</style>
