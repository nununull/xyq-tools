<script setup lang="ts">
import { computed, ref } from 'vue'
import GuideSelector from '@/components/guides/GuideSelector.vue'
import RouteCard from '@/components/guides/RouteCard.vue'
import { ADVENTURE_GUIDES } from '@/data/adventureGuides'

const activeGuideId = ref(ADVENTURE_GUIDES[0]?.id ?? '')

/** 当前攻略始终从唯一静态数据源派生，非法标识回退为空态。 */
const activeGuide = computed(() =>
  ADVENTURE_GUIDES.find(({ id }) => id === activeGuideId.value) ?? null,
)
</script>

<template>
  <div class="adventure-guides-view">
    <header class="adventure-guides-view__header">
      <p class="adventure-guides-view__eyebrow">
        路线速查
      </p>
      <h1>奇遇攻略</h1>
      <p>少翻长文，照着路线直接选。</p>
    </header>

    <GuideSelector
      v-model="activeGuideId"
      :guides="ADVENTURE_GUIDES"
    />

    <section
      v-if="activeGuide !== null"
      :id="`guide-panel-${activeGuide.id}`"
      class="adventure-guides-view__panel"
      role="tabpanel"
      :aria-labelledby="`guide-tab-${activeGuide.id}`"
    >
      <header class="adventure-guides-view__panel-header">
        <div>
          <p>当前攻略</p>
          <h2>{{ activeGuide.title }}</h2>
        </div>
        <small>最后核对：{{ activeGuide.verifiedAt }}</small>
      </header>

      <div
        v-if="activeGuide.endings.length > 0"
        class="adventure-guides-view__routes"
      >
        <RouteCard
          v-for="(ending, index) in activeGuide.endings"
          :key="ending.id"
          :ending="ending"
          :position="index + 1"
        />
      </div>
      <p
        v-else
        class="adventure-guides-view__empty"
        role="status"
      >
        攻略正在核对，暂不提供路线。
      </p>
    </section>
  </div>
</template>

<style scoped>
.adventure-guides-view {
  --guide-accent: #b67832;
  --guide-accent-soft: #fbf4eb;

  width: min(100%, 68rem);
  min-width: 0;
  margin: 0 auto;
  padding: clamp(2rem, 7vw, 5.5rem) clamp(1.25rem, 4vw, 2.5rem);
}

.adventure-guides-view__header {
  max-width: 38rem;
  min-width: 0;
  margin-bottom: clamp(1.75rem, 4vw, 2.5rem);
}

.adventure-guides-view__eyebrow {
  margin: 0 0 0.625rem;
  color: var(--guide-accent);
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.adventure-guides-view__header h1 {
  margin: 0 0 0.75rem;
  color: var(--text);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.12;
  letter-spacing: -0.04em;
}

.adventure-guides-view__header > p:last-child {
  margin: 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.adventure-guides-view__panel {
  min-width: 0;
  margin-top: clamp(1.75rem, 4vw, 2.5rem);
}

.adventure-guides-view__panel-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem 2rem;
  min-width: 0;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--border);
}

.adventure-guides-view__panel-header > div {
  min-width: 0;
}

.adventure-guides-view__panel-header p {
  margin: 0 0 0.25rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.adventure-guides-view__panel-header h2 {
  margin: 0;
  color: var(--text);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.adventure-guides-view__panel-header small {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

.adventure-guides-view__routes {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.adventure-guides-view__empty {
  margin: 0;
  padding: 2rem 1.25rem;
  color: var(--text-muted);
  text-align: center;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

@media (max-width: 40rem) {
  .adventure-guides-view {
    padding-inline: 1rem;
  }

  .adventure-guides-view__panel-header {
    display: grid;
    align-items: start;
    gap: 0.5rem;
  }

  .adventure-guides-view__panel-header small {
    white-space: normal;
  }
}
</style>
