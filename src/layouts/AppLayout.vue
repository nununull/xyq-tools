<script setup lang="ts">
import { ClipboardClock, Home, Sparkles } from 'lucide-vue-next'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'

interface NavigationItem {
  name: 'home' | 'sect-mission'
  label: string
  icon: Component
}

const route = useRoute()

const navigationItems: NavigationItem[] = [
  { name: 'home', label: '首页', icon: Home },
  { name: 'sect-mission', label: '师门助手', icon: ClipboardClock },
]
</script>

<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <RouterLink
        class="app-layout__brand"
        :to="{ name: 'home' }"
        aria-label="梦幻西游工具箱首页"
      >
        <Sparkles
          :size="20"
          aria-hidden="true"
        />
        <span>梦幻西游工具箱</span>
      </RouterLink>

      <nav
        class="app-layout__navigation"
        aria-label="主导航"
      >
        <RouterLink
          v-for="item in navigationItems"
          :key="item.name"
          class="app-layout__navigation-link"
          active-class="app-layout__navigation-link--active"
          :to="{ name: item.name }"
          :aria-current="route.name === item.name ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            :size="19"
            aria-hidden="true"
          />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <header class="app-layout__topbar">
      <RouterLink
        class="app-layout__brand"
        :to="{ name: 'home' }"
        aria-label="梦幻西游工具箱首页"
      >
        <Sparkles
          :size="19"
          aria-hidden="true"
        />
        <span>梦幻西游工具箱</span>
      </RouterLink>

      <nav
        class="app-layout__navigation"
        aria-label="主导航"
      >
        <RouterLink
          v-for="item in navigationItems"
          :key="item.name"
          class="app-layout__navigation-link"
          active-class="app-layout__navigation-link--active"
          :to="{ name: item.name }"
          :aria-current="route.name === item.name ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            :size="18"
            aria-hidden="true"
          />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </header>

    <main class="app-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-layout__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  display: flex;
  flex-direction: column;
  width: 15rem;
  padding: 1.5rem;
  background: var(--surface-soft);
  border-right: 1px solid var(--border);
}

.app-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  width: fit-content;
  color: var(--text);
  font-size: 0.9375rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  text-decoration: none;
}

.app-layout__brand :deep(svg) {
  color: var(--mint-700);
}

.app-layout__navigation {
  display: grid;
  gap: 0.375rem;
  margin-top: 3rem;
}

.app-layout__navigation-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.875rem;
  padding: 0.625rem 0.75rem;
  color: var(--text-muted);
  font-size: 0.9375rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.app-layout__navigation-link:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 68%, transparent);
}

.app-layout__navigation-link--active {
  color: var(--mint-700);
  background: var(--surface);
  border-color: var(--border);
}

.app-layout__topbar {
  display: none;
}

.app-layout__content {
  min-width: 0;
  margin-left: 15rem;
}

@media (max-width: 48rem) {
  .app-layout__sidebar {
    display: none;
  }

  .app-layout__topbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 4.25rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--surface-soft) 94%, transparent);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(0.75rem);
  }

  .app-layout__navigation {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.25rem;
    min-width: 0;
    margin-top: 0;
  }

  .app-layout__navigation-link {
    gap: 0.375rem;
    min-height: 2.5rem;
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
    white-space: nowrap;
  }

  .app-layout__content {
    margin-left: 0;
  }
}

@media (max-width: 30rem) {
  .app-layout__topbar {
    padding-inline: 0.75rem;
  }

  .app-layout__brand span {
    display: none;
  }

  .app-layout__navigation-link {
    padding-inline: 0.5rem;
  }
}
</style>
