<script setup lang="ts">
import {
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { inject, ref } from 'vue'
import AccountControl from '@/components/auth/AccountControl.vue'
import { TOOL_CATALOG, type ToolRouteName } from '@/config/toolCatalog'

interface NavigationItem {
  name: 'home' | ToolRouteName
  label: string
  icon: Component
}

const route = useRoute()
const openAuthModal = inject<() => void>('openAuthModal', () => undefined)
const SIDEBAR_COLLAPSED_KEY = 'xyq-tools:sidebar-collapsed'

/** 读取侧栏偏好；浏览器禁用本地存储时安全回退为展开状态。 */
function readSidebarCollapsed(): boolean {
  try {
    return globalThis.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

const sidebarCollapsed = ref(readSidebarCollapsed())

/** 切换桌面侧栏状态，并尽力保存用户选择。 */
function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
  try {
    globalThis.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed.value))
  } catch {
    // 本地存储不可用时仍保留当前页面内的交互状态。
  }
}

const navigationItems: readonly NavigationItem[] = [
  { name: 'home', label: '首页', icon: Home },
  ...TOOL_CATALOG.map(({ routeName, label, icon }) => ({
    name: routeName,
    label,
    icon,
  })),
]
</script>

<template>
  <div class="app-layout">
    <a
      class="app-layout__skip-link"
      href="#main-content"
    >跳到主要内容</a>

    <aside
      id="desktop-sidebar"
      class="app-layout__sidebar"
      :class="{ 'app-layout__sidebar--collapsed': sidebarCollapsed }"
    >
      <div class="app-layout__sidebar-header">
        <RouterLink
          class="app-layout__brand"
          :to="{ name: 'home' }"
          aria-label="梦幻西游工具箱首页"
          :title="sidebarCollapsed ? '梦幻西游工具箱' : undefined"
        >
          <Sparkles
            :size="20"
            aria-hidden="true"
          />
          <span>梦幻西游工具箱</span>
        </RouterLink>
        <button
          class="app-layout__sidebar-toggle"
          type="button"
          :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          aria-controls="desktop-sidebar"
          :aria-expanded="!sidebarCollapsed"
          @click="toggleSidebar"
        >
          <PanelLeftOpen
            v-if="sidebarCollapsed"
            :size="18"
            aria-hidden="true"
          />
          <PanelLeftClose
            v-else
            :size="18"
            aria-hidden="true"
          />
        </button>
      </div>

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
          :title="sidebarCollapsed ? item.label : undefined"
        >
          <component
            :is="item.icon"
            :size="19"
            aria-hidden="true"
          />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <AccountControl
        class="app-layout__storage-note"
        :compact="sidebarCollapsed"
        @login="openAuthModal"
      />
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
          :aria-label="item.label"
        >
          <component
            :is="item.icon"
            :size="18"
            aria-hidden="true"
          />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <AccountControl
        class="app-layout__mobile-account"
        @login="openAuthModal"
      />
    </header>

    <main
      id="main-content"
      class="app-layout__content"
      :class="{ 'app-layout__content--sidebar-collapsed': sidebarCollapsed }"
      tabindex="-1"
    >
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-layout__skip-link {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 20;
  padding: 0.625rem 0.875rem;
  color: var(--surface-raised);
  font-weight: 800;
  text-decoration: none;
  background: var(--mint-800);
  border-radius: 0.5rem;
  transform: translateY(calc(-100% - 1rem));
  transition: transform 160ms ease;
}

.app-layout__skip-link:focus {
  transform: translateY(0);
}

.app-layout__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  display: flex;
  flex-direction: column;
  width: 15rem;
  padding: 1.5rem;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 46%), transparent 16rem),
    var(--surface-soft);
  border-right: 1px solid var(--border);
  transition: width 180ms ease, padding 180ms ease;
}

.app-layout__sidebar--collapsed {
  width: 4.5rem;
  padding-inline: 0.75rem;
}

.app-layout__sidebar-header {
  min-width: 0;
}

.app-layout__sidebar-toggle {
  position: absolute;
  top: 4.25rem;
  right: -1.25rem;
  z-index: 1;
  display: grid;
  width: 2.5rem;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  place-items: center;
  color: var(--mint-700);
  background: var(--surface-raised);
  border-color: var(--border);
  border-radius: 50%;
  box-shadow: 0 0.25rem 0.75rem rgb(37 54 48 / 10%);
}

.app-layout__sidebar-toggle:hover {
  color: var(--text);
  background: var(--surface-raised);
  border-color: var(--border);
}

.app-layout__sidebar--collapsed .app-layout__brand {
  justify-content: center;
  width: 2.5rem;
  min-width: 2.5rem;
  min-height: 2.5rem;
}

.app-layout__sidebar--collapsed .app-layout__brand span,
.app-layout__sidebar--collapsed .app-layout__navigation-link span {
  display: none;
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
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  color: var(--text-muted);
  font-size: 0.9375rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.app-layout__sidebar--collapsed .app-layout__navigation-link {
  justify-content: center;
  width: 3rem;
  padding-inline: 0;
}

.app-layout__navigation-link:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--surface-raised) 72%, transparent);
}

.app-layout__navigation-link--active {
  color: var(--mint-700);
  background: var(--surface-raised);
  border-color: var(--border-strong);
  box-shadow: inset 0.1875rem 0 var(--mint-700);
}

.app-layout__storage-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: auto 0 0;
  padding-top: 1.5rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
  border-top: 1px solid var(--border);
}

.app-layout__storage-note span {
  color: var(--mint-500);
  font-size: 0.5rem;
}

.app-layout__sidebar--collapsed .app-layout__storage-note {
  display: grid;
  justify-items: center;
  padding-top: 1rem;
}

.app-layout__topbar {
  display: none;
}

.app-layout__content {
  min-width: 0;
  margin-left: 15rem;
  transition: margin-left 180ms ease;
}

.app-layout__content--sidebar-collapsed {
  margin-left: 4.5rem;
}

@media (max-width: 44.999rem) {
  .app-layout__sidebar {
    display: none;
  }

  .app-layout__topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 4.25rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
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

  .app-layout__navigation-link--active {
    box-shadow: inset 0 -0.1875rem var(--mint-700);
  }

  .app-layout__content {
    margin-left: 0;
  }

  .app-layout__content--sidebar-collapsed {
    margin-left: 0;
  }
}

@media (max-width: 30rem) {
  .app-layout__topbar {
    padding-inline: 0.75rem;
  }

  .app-layout__brand span,
  .app-layout__navigation-link span,
  .app-layout__mobile-account :deep(div) {
    display: none;
  }

  .app-layout__brand {
    justify-content: center;
    width: 2.5rem;
    min-width: 2.5rem;
    min-height: 2.5rem;
  }

  .app-layout__navigation-link {
    padding-inline: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-layout__skip-link,
  .app-layout__sidebar,
  .app-layout__content {
    transition: none;
  }
}
</style>
