<template>
  <main class="sect-mission-view">
    <header class="sect-mission-view__header">
      <p class="sect-mission-view__eyebrow">
        每日工具
      </p>
      <h1>师门助手</h1>
      <p class="sect-mission-view__description">
        在这里记录和安排今天的师门事务，后续功能将围绕这一件事逐步展开。
      </p>
    </header>

    <section
      class="sect-mission-view__workspace"
      aria-labelledby="workspace-title"
    >
      <div>
        <p class="sect-mission-view__workspace-label">
          当日安排
        </p>
        <h2 id="workspace-title">
          师门任务工作区
        </h2>
      </div>
      <p>
        任务记录与辅助能力将在这里呈现。
      </p>
    </section>
  </main>
</template>

<style scoped>
.sect-mission-view {
  width: min(100%, 58rem);
  margin: 0 auto;
  padding: clamp(2rem, 7vw, 5rem) 1.5rem;
}

.sect-mission-view__header {
  max-width: 42rem;
  margin-bottom: clamp(2.5rem, 7vw, 4.5rem);
}

.sect-mission-view__eyebrow,
.sect-mission-view__workspace-label {
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
  margin-bottom: 1rem;
  color: var(--text);
  font-size: clamp(2.25rem, 7vw, 4.5rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
}

.sect-mission-view__description {
  max-width: 35rem;
  margin-bottom: 0;
  color: var(--text-muted);
  line-height: 1.75;
}

.sect-mission-view__workspace {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  min-height: 12rem;
  padding: clamp(1.5rem, 5vw, 2.5rem);
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.sect-mission-view__workspace h2 {
  margin-bottom: 0;
  color: var(--text);
  font-size: 1.375rem;
  letter-spacing: -0.025em;
}

.sect-mission-view__workspace > p {
  max-width: 14rem;
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 0.9375rem;
  line-height: 1.65;
}

@media (max-width: 40rem) {
  .sect-mission-view__workspace {
    display: grid;
    align-items: start;
    gap: 1.5rem;
  }
}
</style>
