<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { AdventureEnding } from '@/types/adventureGuide'

defineProps<{
  ending: AdventureEnding
  position: number
}>()
</script>

<template>
  <article
    class="route-card"
    :aria-labelledby="`ending-${ending.id}`"
  >
    <header class="route-card__header">
      <span class="route-card__index">结局 {{ position }}</span>
      <h2 :id="`ending-${ending.id}`">
        {{ ending.title }}
      </h2>
    </header>

    <div class="route-card__variants">
      <section
        v-for="path in ending.paths"
        :key="path.id"
        class="route-card__variant"
      >
        <h3 v-if="path.label">
          {{ path.label }}
        </h3>
        <ol class="route-card__steps">
          <li
            v-for="(step, stepIndex) in path.steps"
            :key="`${path.id}-${stepIndex}`"
          >
            <span>{{ step }}</span>
            <ChevronRight
              v-if="stepIndex < path.steps.length - 1"
              class="route-card__connector route-card__connector--desktop"
              :size="17"
              aria-hidden="true"
            />
            <ChevronDown
              v-if="stepIndex < path.steps.length - 1"
              class="route-card__connector route-card__connector--mobile"
              :size="17"
              aria-hidden="true"
            />
          </li>
        </ol>
      </section>
    </div>
  </article>
</template>

<style scoped>
.route-card {
  min-width: 0;
  padding: clamp(1.125rem, 3vw, 1.5rem);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.route-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.375rem 0.875rem;
  min-width: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.route-card__index {
  color: var(--guide-accent, #b67832);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.route-card__header h2 {
  min-width: 0;
  margin: 0;
  color: var(--text);
  font-family: "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: clamp(1.375rem, 3vw, 1.75rem);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.route-card__variants {
  min-width: 0;
}

.route-card__variant {
  min-width: 0;
  padding-top: 1rem;
}

.route-card__variant + .route-card__variant {
  margin-top: 1rem;
  border-top: 1px solid var(--border);
}

.route-card__variant h3 {
  margin: 0 0 0.75rem;
  padding-left: 0.625rem;
  color: var(--mint-700);
  font-size: 0.875rem;
  line-height: 1.5;
  border-left: 0.1875rem solid var(--guide-accent, #b67832);
}

.route-card__steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem 0.375rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.route-card__steps li {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 100%;
  min-width: 0;
}

.route-card__steps li > span {
  min-width: 0;
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  color: var(--text);
  font-size: 0.9375rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
}

.route-card__connector {
  flex: 0 0 auto;
  color: var(--guide-accent, #b67832);
}

.route-card__connector--mobile {
  display: none;
}

@media (max-width: 40rem) {
  .route-card__header {
    display: grid;
    gap: 0.25rem;
  }

  .route-card__steps {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .route-card__steps li {
    display: grid;
    width: 100%;
    justify-items: start;
    gap: 0.375rem;
  }

  .route-card__steps li > span {
    width: 100%;
  }

  .route-card__connector--desktop {
    display: none;
  }

  .route-card__connector--mobile {
    display: block;
    margin: 0.25rem 0 0.25rem 0.75rem;
  }
}
</style>
