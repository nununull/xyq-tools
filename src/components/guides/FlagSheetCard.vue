<script setup lang="ts">
import { Expand } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import type { FlagSheet } from '@/types/flagGuide'

const props = defineProps<{ sheet: FlagSheet }>()
defineEmits<{ preview: [sheet: FlagSheet] }>()

const imageFailed = ref(false)

/** 是否展示坐标表由当前卡片的数据派生，只有点位图时不生成空表或猜测坐标。 */
const hasCoordinates = computed(() => props.sheet.plans.length > 0)
</script>

<template>
  <article class="flag-sheet">
    <header class="flag-sheet__header">
      <h3>{{ sheet.title }}</h3>
      <span>{{ hasCoordinates ? '按表中坐标定旗' : '原图点位参考' }}</span>
    </header>

    <p
      v-if="sheet.notice"
      class="flag-sheet__notice"
    >
      {{ sheet.notice }}
    </p>

    <div
      class="flag-sheet__body"
      :class="{ 'flag-sheet__body--image-only': !hasCoordinates }"
    >
      <figure class="flag-sheet__figure">
        <button
          v-if="!imageFailed"
          class="flag-sheet__image-button"
          type="button"
          :aria-label="`放大查看${sheet.title}定旗示例图`"
          @click="$emit('preview', sheet)"
        >
          <img
            :src="sheet.image"
            :alt="sheet.imageDescription"
            width="942"
            loading="lazy"
            decoding="async"
            @error="imageFailed = true"
          >
          <span class="flag-sheet__expand">
            <Expand
              :size="15"
              aria-hidden="true"
            />
            放大看图
          </span>
        </button>
        <p
          v-else
          class="flag-sheet__image-error"
          role="status"
        >
          {{ hasCoordinates ? '示例图未能加载，可先查看坐标表，也可打开页尾的原攻略看图。' : '示例图未能加载，请打开页尾的原攻略查看点位图。' }}
        </p>
        <figcaption>
          {{ sheet.imageDescription }}{{ hasCoordinates ? '红点用于认位置，具体定点看坐标表。' : '红点只表示位置参考，原文未提供逐点坐标。' }}
        </figcaption>
      </figure>

      <div
        v-if="hasCoordinates"
        class="flag-sheet__plans"
      >
        <section
          v-for="plan in sheet.plans"
          :key="plan.title"
          class="flag-sheet__plan"
        >
          <h4>{{ plan.title }} <small>{{ plan.points.length }} 个点</small></h4>
          <table>
            <caption class="flag-sheet__table-caption">
              {{ sheet.title }}{{ plan.title }}实际插旗坐标
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  点位
                </th>
                <th scope="col">
                  插旗坐标
                </th>
                <th scope="col">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(point, index) in plan.points"
                :key="index"
              >
                <th scope="row">
                  <span class="flag-sheet__point-index">{{ index + 1 }}</span>
                  {{ point.name }}
                </th>
                <td class="flag-sheet__coordinates">
                  {{ point.coordinates[0] }}, {{ point.coordinates[1] }}
                </td>
                <td>
                  <span
                    v-if="point.directClick"
                    class="flag-sheet__direct"
                  >原文连点</span>
                  <span v-else>{{ point.note ?? '常规定点' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </article>
</template>

<style scoped>
.flag-sheet {
  min-width: 0;
  padding: 1.25rem;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.flag-sheet__header,
.flag-sheet__plan h4 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.flag-sheet__header {
  margin-bottom: 1rem;
}

.flag-sheet__header h3,
.flag-sheet__plan h4 {
  margin: 0;
  font-size: 1rem;
}

.flag-sheet__header > span,
.flag-sheet__plan h4 small,
figcaption {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 400;
}

.flag-sheet__body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  align-items: start;
  gap: 1.5rem;
}

.flag-sheet__body--image-only {
  grid-template-columns: minmax(0, 1fr);
}

.flag-sheet__figure {
  min-width: 0;
  margin: 0;
}

.flag-sheet__image-button {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--text);
  border: 0;
}

.flag-sheet__image-button img {
  display: block;
  width: 100%;
  height: auto;
}

.flag-sheet__expand {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  color: var(--surface-raised);
  font-size: 0.75rem;
  background: rgb(34 52 46 / 90%);
  border-radius: 0.375rem;
}

figcaption {
  margin-top: 0.625rem;
  line-height: 1.7;
}

.flag-sheet__plans {
  display: grid;
  gap: 1.25rem;
  min-width: 0;
}

.flag-sheet__plan h4 {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: left;
}

th,
td {
  padding: 0.625rem 0.375rem;
  border-bottom: 1px solid var(--border);
}

thead th,
td:last-child {
  color: var(--text-muted);
  font-size: 0.75rem;
}

tbody th {
  font-weight: 500;
}

.flag-sheet__point-index {
  margin-right: 0.25rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.flag-sheet__coordinates {
  color: var(--mint-800);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.flag-sheet__direct {
  color: var(--mint-700);
  white-space: nowrap;
}

.flag-sheet__notice,
.flag-sheet__image-error {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  color: var(--warning);
  font-size: 0.8125rem;
  line-height: 1.7;
  background: var(--guide-accent-soft);
  border-left: 3px solid var(--guide-accent);
}

.flag-sheet__table-caption {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

@media (max-width: 68rem) {
  .flag-sheet__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 40rem) {
  .flag-sheet {
    padding: 1rem;
  }

  .flag-sheet__header {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  th,
  td {
    padding-inline: 0.25rem;
  }
}
</style>
