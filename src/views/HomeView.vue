<script setup lang="ts">
import { TOOL_CATALOG } from '@/config/toolCatalog'
</script>

<template>
  <div class="home-view">
    <section
      class="home-view__welcome"
      aria-labelledby="home-title"
    >
      <p class="home-view__eyebrow">
        梦幻西游工具箱
      </p>
      <h1 id="home-title">
        把每日琐事，理得明明白白
      </h1>
      <p class="home-view__intro">
        从师门任务开始，逐步建立属于你的日常工具台。
      </p>
    </section>

    <section
      class="home-view__tools"
      aria-labelledby="tools-title"
    >
      <div class="home-view__section-heading">
        <p class="home-view__eyebrow">
          工具入口
        </p>
        <h2 id="tools-title">
          今天，从一件事开始
        </h2>
      </div>

      <div class="home-view__tool-list">
        <RouterLink
          v-for="item in TOOL_CATALOG"
          :key="item.routeName"
          class="tool-card tool-card--available"
          :to="{ name: item.routeName }"
        >
          <span class="tool-card__index">{{ item.index }}</span>
          <span class="tool-card__content">
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </span>
          <span
            class="tool-card__action"
            aria-hidden="true"
          >打开工具</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  width: min(100%, 62rem);
  margin: 0 auto;
  padding: clamp(2rem, 7vw, 5.5rem) clamp(1.25rem, 4vw, 2.5rem);
}

.home-view__welcome {
  position: relative;
  max-width: 43rem;
  padding-bottom: clamp(3rem, 8vw, 5.5rem);
}

.home-view__welcome::after {
  position: absolute;
  bottom: clamp(1.5rem, 4vw, 2.75rem);
  left: 0;
  width: 4rem;
  height: 0.1875rem;
  background: var(--mint-500);
  border-radius: 999px;
  content: "";
}

.home-view__eyebrow {
  margin: 0 0 0.75rem;
  color: var(--mint-700);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  max-width: 35rem;
  margin-bottom: 1rem;
  color: var(--text);
  font-size: clamp(2.25rem, 6.5vw, 4.25rem);
  line-height: 1.1;
  letter-spacing: -0.05em;
}

.home-view__intro {
  max-width: 30rem;
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.75;
}

.home-view__section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.home-view__section-heading h2 {
  margin-bottom: 0;
  color: var(--text);
  font-size: 1.375rem;
  letter-spacing: -0.025em;
}

.home-view__tool-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.tool-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  min-height: 12rem;
  padding: 1.5rem;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.tool-card__index {
  color: var(--mint-700);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.tool-card__content {
  display: grid;
  align-content: start;
  gap: 0.5rem;
}

.tool-card__content strong {
  color: var(--text);
  font-size: 1.25rem;
}

.tool-card__content span {
  color: var(--text-muted);
  font-size: 0.9375rem;
  line-height: 1.65;
}

.tool-card--available {
  position: relative;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 68%), transparent 52%),
    var(--surface-soft);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.tool-card--available:hover {
  border-color: var(--mint-700);
  box-shadow: 0 0.75rem 1.75rem rgb(37 54 48 / 9%);
  transform: translateY(-0.125rem);
}

.tool-card__action {
  align-self: end;
  grid-column: 2;
  color: var(--mint-700);
  font-size: 0.875rem;
  font-weight: 700;
}

@media (max-width: 40rem) {
  .home-view {
    padding-inline: 1rem;
  }

  .home-view__welcome {
    max-width: 31rem;
  }

  .home-view__tool-list {
    grid-template-columns: 1fr;
  }

  .tool-card {
    min-height: 10.5rem;
    padding: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tool-card--available:hover {
    transform: none;
  }
}
</style>
