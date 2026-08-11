<template>
  <main class="home-view">
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
          class="tool-card tool-card--available"
          :to="{ name: 'sect-mission' }"
        >
          <span class="tool-card__index">01</span>
          <span class="tool-card__content">
            <strong>师门助手</strong>
            <span>整理当日师门任务，留出更清爽的游戏时间。</span>
          </span>
          <span
            class="tool-card__action"
            aria-hidden="true"
          >进入 →</span>
        </RouterLink>

        <article class="tool-card tool-card--upcoming">
          <span class="tool-card__index">02</span>
          <span class="tool-card__content">
            <strong>更多工具</strong>
            <span>日常与店铺相关的工具正在整理中。</span>
          </span>
          <span class="tool-card__status">即将推出</span>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  width: min(100%, 58rem);
  margin: 0 auto;
  padding: clamp(2rem, 7vw, 5rem) 1.5rem;
}

.home-view__welcome {
  max-width: 40rem;
  padding-bottom: clamp(3rem, 8vw, 5rem);
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
  max-width: 32rem;
  margin-bottom: 1rem;
  color: var(--text);
  font-size: clamp(2.25rem, 7vw, 4.5rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
}

.home-view__intro {
  max-width: 30rem;
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.75;
}

.home-view__section-heading {
  margin-bottom: 1.25rem;
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
  min-height: 11.5rem;
  padding: 1.5rem;
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
  background: var(--surface-soft);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.tool-card--available:hover {
  border-color: var(--mint-500);
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

.tool-card--upcoming {
  background: color-mix(in srgb, var(--surface-soft) 58%, var(--surface));
}

.tool-card--upcoming .tool-card__content,
.tool-card--upcoming .tool-card__index {
  opacity: 0.68;
}

.tool-card__status {
  align-self: end;
  grid-column: 2;
  width: fit-content;
  padding: 0.25rem 0.5rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
}

@media (max-width: 40rem) {
  .home-view__tool-list {
    grid-template-columns: 1fr;
  }
}
</style>
