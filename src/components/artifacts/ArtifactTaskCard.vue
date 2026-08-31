<script setup lang="ts">
import { ChevronDown, ExternalLink, PackageOpen, ShieldAlert } from 'lucide-vue-next'
import { computed } from 'vue'
import type { ArtifactTask } from '@/types/artifactGuide'

const props = defineProps<{
  task: ArtifactTask
}>()

const VERDICT_META = {
  recommended: { seal: '接', label: '建议接' },
  conditional: { seal: '慎', label: '看条件' },
  skip: { seal: '弃', label: '建议跳过' },
} as const

const COST_META = {
  none: '无固定材料',
  low: '材料轻',
  medium: '材料中等',
  high: '材料重',
} as const

/** 当前任务的结论文案和印章字由结论枚举唯一派生。 */
const verdictMeta = computed(() => VERDICT_META[props.task.verdict])

/** 当前任务的材料负担标签由成本枚举唯一派生。 */
const materialCostLabel = computed(() => COST_META[props.task.materialCost])
</script>

<template>
  <article
    class="artifact-card"
    :class="`artifact-card--${task.verdict}`"
  >
    <div class="artifact-card__seal-column">
      <div
        class="artifact-card__seal"
        aria-hidden="true"
      >
        {{ verdictMeta.seal }}
      </div>
      <strong>{{ verdictMeta.label }}</strong>
    </div>

    <div class="artifact-card__body">
      <header class="artifact-card__header">
        <div>
          <div class="artifact-card__tags">
            <span>{{ task.series === 'start' ? '神器·起' : '神器·转' }}</span>
            <span>{{ materialCostLabel }}</span>
            <span>星级 {{ task.suggestedStars }}</span>
          </div>
          <h2>{{ task.name }}</h2>
        </div>
        <p class="artifact-card__verdict-note">
          {{ task.verdictNote }}
        </p>
      </header>

      <section
        class="artifact-card__materials"
        :aria-label="`${task.name}所需材料`"
      >
        <div class="artifact-card__section-title">
          <PackageOpen
            :size="17"
            aria-hidden="true"
          />
          <h3>要交什么</h3>
        </div>
        <ul>
          <li
            v-for="material in task.materials"
            :key="`${material.name}-${material.detail}`"
          >
            <strong>{{ material.name }}</strong>
            <span>{{ material.detail }}</span>
          </li>
        </ul>
      </section>

      <details class="artifact-card__details">
        <summary>
          <span>看网友怎么说与注意事项</span>
          <ChevronDown
            :size="18"
            aria-hidden="true"
          />
        </summary>

        <div class="artifact-card__details-body">
          <div class="artifact-card__community">
            <div class="artifact-card__section-title">
              <ShieldAlert
                :size="17"
                aria-hidden="true"
              />
              <h3>网友口碑</h3>
            </div>
            <p>{{ task.communitySummary }}</p>
          </div>

          <div class="artifact-card__cautions">
            <h3>开刷前记住</h3>
            <ul>
              <li
                v-for="caution in task.cautions"
                :key="caution"
              >
                {{ caution }}
              </li>
            </ul>
          </div>

          <footer class="artifact-card__sources">
            <span>资料来源</span>
            <a
              v-for="item in task.sources"
              :key="item.url"
              :href="item.url"
              target="_blank"
              rel="noreferrer noopener"
            >
              {{ item.label }} · {{ item.publishedAt }}
              <ExternalLink
                :size="13"
                aria-hidden="true"
              />
            </a>
          </footer>
        </div>
      </details>
    </div>
  </article>
</template>

<style scoped>
.artifact-card {
  display: grid;
  grid-template-columns: 5.75rem minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  background: rgb(255 255 255 / 76%);
  border: 1px solid var(--border);
  border-left: 0.25rem solid var(--verdict-color);
  border-radius: 0.875rem;
  box-shadow: 0 0.5rem 1.5rem rgb(37 54 48 / 4%);
}

.artifact-card--recommended {
  --verdict-color: var(--artifact-green);
  --verdict-soft: var(--artifact-green-soft);
}

.artifact-card--conditional {
  --verdict-color: var(--artifact-amber);
  --verdict-soft: var(--artifact-amber-soft);
}

.artifact-card--skip {
  --verdict-color: var(--artifact-red);
  --verdict-soft: var(--artifact-red-soft);
}

.artifact-card__seal-column {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-items: center;
  justify-content: flex-start;
  padding: 1.375rem 0.75rem;
  color: var(--verdict-color);
  background: var(--verdict-soft);
  border-right: 1px solid color-mix(in srgb, var(--verdict-color) 22%, transparent);
}

.artifact-card__seal-column > strong {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.artifact-card__seal {
  display: grid;
  width: 3.375rem;
  height: 3.375rem;
  place-items: center;
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: 1.625rem;
  font-weight: 900;
  border: 0.1875rem double currentColor;
  transform: rotate(-2deg);
}

.artifact-card__body {
  min-width: 0;
  padding: 1.25rem 1.375rem 0;
}

.artifact-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem 2rem;
}

.artifact-card__header > div {
  min-width: 0;
}

.artifact-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.artifact-card__tags span {
  padding: 0.1875rem 0.4375rem;
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1.35;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
}

.artifact-card__header h2 {
  margin: 0;
  color: var(--text);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: clamp(1.375rem, 2.5vw, 1.75rem);
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.artifact-card__verdict-note {
  max-width: 16rem;
  margin: 0;
  color: var(--verdict-color);
  font-size: 0.875rem;
  font-weight: 800;
  line-height: 1.55;
  text-align: right;
}

.artifact-card__materials {
  margin-top: 1.125rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.artifact-card__section-title {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--text-muted);
}

.artifact-card__section-title h3 {
  margin: 0;
  color: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.artifact-card__materials ul,
.artifact-card__cautions ul {
  margin: 0.625rem 0 0;
  padding: 0;
  list-style: none;
}

.artifact-card__materials li {
  display: grid;
  grid-template-columns: minmax(8rem, 0.32fr) minmax(0, 1fr);
  gap: 0.625rem 1rem;
  padding-block: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.55;
}

.artifact-card__materials strong {
  color: var(--text);
}

.artifact-card__materials span {
  color: var(--text-muted);
}

.artifact-card__details {
  margin-top: 1rem;
  border-top: 1px solid var(--border);
}

.artifact-card__details summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3rem;
  padding: 0.625rem 0;
  color: var(--mint-700);
  font-size: 0.8125rem;
  font-weight: 800;
  cursor: pointer;
  list-style: none;
}

.artifact-card__details summary::-webkit-details-marker {
  display: none;
}

.artifact-card__details summary svg {
  flex: 0 0 auto;
  transition: transform 160ms ease;
}

.artifact-card__details[open] summary svg {
  transform: rotate(180deg);
}

.artifact-card__details-body {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(12rem, 0.65fr);
  gap: 1rem 1.5rem;
  padding: 0.25rem 0 1.25rem;
}

.artifact-card__community p {
  margin: 0.625rem 0 0;
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.7;
}

.artifact-card__cautions {
  padding: 0.875rem 1rem;
  background: var(--surface-soft);
  border-radius: 0.5rem;
}

.artifact-card__cautions h3 {
  margin: 0;
  color: var(--text);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.artifact-card__cautions li {
  position: relative;
  padding-left: 0.875rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
  line-height: 1.65;
}

.artifact-card__cautions li::before {
  position: absolute;
  top: 0.7em;
  left: 0;
  width: 0.3rem;
  height: 0.3rem;
  background: var(--verdict-color);
  border-radius: 50%;
  content: "";
}

.artifact-card__sources {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  gap: 0.375rem 0.875rem;
  align-items: center;
  padding-top: 0.875rem;
  border-top: 1px dashed var(--border);
}

.artifact-card__sources > span {
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.artifact-card__sources a {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  color: var(--mint-700);
  font-size: 0.75rem;
  font-weight: 700;
}

@media (max-width: 40rem) {
  .artifact-card {
    grid-template-columns: 4.5rem minmax(0, 1fr);
  }

  .artifact-card__seal-column {
    padding-inline: 0.5rem;
  }

  .artifact-card__seal {
    width: 2.875rem;
    height: 2.875rem;
    font-size: 1.375rem;
  }

  .artifact-card__body {
    padding: 1rem 1rem 0;
  }

  .artifact-card__header {
    display: grid;
    gap: 0.625rem;
  }

  .artifact-card__verdict-note {
    max-width: none;
    text-align: left;
  }

  .artifact-card__materials li,
  .artifact-card__details-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 27rem) {
  .artifact-card {
    grid-template-columns: 1fr;
    border-top: 0.25rem solid var(--verdict-color);
    border-left-width: 1px;
  }

  .artifact-card__seal-column {
    flex-direction: row;
    gap: 0.75rem;
    justify-content: flex-start;
    padding: 0.75rem 1rem;
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--verdict-color) 22%, transparent);
  }

  .artifact-card__seal {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .artifact-card__seal {
    transform: none;
  }
}
</style>
