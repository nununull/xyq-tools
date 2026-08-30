# 奇遇攻略路线速查 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增加一个可扩展的“奇遇攻略”入口，以路线签卡片展示“九色鹿·上”六个结局和“九色鹿·下”五个结局的纯选择路线。

**Architecture:** 路线事实集中在一个只读静态数据模块，类型模块定义“攻略—结局—候选路径—有序步骤”边界。通用选择器和路线卡只接收 props，页面负责选择当前攻略，主导航与首页从共享工具目录派生入口；不接入 Store、localStorage、Supabase 或运行时网络请求。

**Tech Stack:** Vue 3.5.41、TypeScript 6.0.3、Vue Router 5.2.0、Lucide Vue Next 1.0.0、Vite 8.2.1、现有原生 CSS。

## Global Constraints

- 所有新增方法必须写中文注释；能直接用声明式模板完成的交互不额外制造方法。
- 禁止新增单元测试文件，不得为了测试增加生产冗余代码。
- 只在最终验收运行一次 `npm run lint` 和一次 `npm run build`，不频繁执行 typecheck。
- 页面图标只使用 `lucide-vue-next`，路线连接使用 `ChevronRight` / `ChevronDown`，不使用含义不明的 Unicode 图标。
- 攻略数据是路线事实唯一来源，组件内禁止复制路线文本或维护第二份状态。
- 不新增后端表、HTTP 接口、Supabase 调用、持久化或统计上报。
- 保持现有薄荷色主题，只在奇遇攻略页面局部使用 `#b67832` 赭金色。
- 页面从 `320px` 宽度开始无横向溢出，长结局名和长选项必须完整换行。
- 不修改或提交当前未跟踪的 `pnpm-lock.yaml`。
- 每次 Git 提交说明使用中文。

---

## File Map

**Create**

- `src/types/adventureGuide.ts`：只定义攻略、结局、候选路径和有序步骤的只读类型。
- `src/data/adventureGuides.ts`：保存全部路线正文、核对日期与来源，是唯一内容来源。
- `src/config/toolCatalog.ts`：保存师门助手与奇遇攻略的共享入口元数据，供侧栏和首页单向派生。
- `src/components/guides/GuideSelector.vue`：可访问的攻略单选标签组。
- `src/components/guides/RouteCard.vue`：展示一个结局及其一条或多条候选路径。
- `src/views/AdventureGuidesView.vue`：组合页面标题、攻略切换、核对日期、路线列表和空状态。

**Modify**

- `src/router/index.ts`：新增 `/adventure-guides` 路由。
- `src/layouts/AppLayout.vue`：从共享工具目录生成工具导航项。
- `src/views/HomeView.vue`：从共享工具目录生成可用工具卡，并移除失真的“更多工具即将推出”条目。

## Content Sources

- “九色鹿·上”六条路线来自用户提供的截图，完整文本已写入 Task 1。
- “九色鹿·下”交叉核对：
  - 17173《九色鹿·下路线和成就攻略，5个结局怎么选？》：<http://xyq.17173.com/content/12162019/111410854.shtml>
  - 3DM《梦幻西游九色鹿下攻略》：<https://ol.3dmgame.com/gl/99374.html>
  - 网易号《奇遇-【九色鹿·下】不同的路线分支成就》：<https://www.163.com/dy/article/FJ2I5E0B0526GONF.html>
- 页面只录入这些来源一致支持的路线条件，不录入战斗、坐标、奖励和成就说明。

---

### Task 1: 建立攻略类型与唯一静态数据源

**Files:**

- Create: `src/types/adventureGuide.ts`
- Create: `src/data/adventureGuides.ts`

**Interfaces:**

- Produces: `AdventurePath`、`AdventureEnding`、`AdventureGuide`。
- Produces: `ADVENTURE_GUIDES: readonly AdventureGuide[]`，供页面和选择器只读消费。

- [ ] **Step 1: 创建只读内容类型**

写入 `src/types/adventureGuide.ts`：

```ts
export interface AdventurePath {
  id: string
  label?: string
  steps: readonly string[]
}

export interface AdventureEnding {
  id: string
  title: string
  paths: readonly AdventurePath[]
}

export interface AdventureGuide {
  id: string
  title: string
  verifiedAt: string
  sourceUrls: readonly string[]
  endings: readonly AdventureEnding[]
}
```

- [ ] **Step 2: 写入“九色鹿·上”完整路线**

创建 `src/data/adventureGuides.ts`，先写入上篇。字段名和文本必须逐字使用以下内容：

```ts
import type { AdventureGuide } from '@/types/adventureGuide'

export const ADVENTURE_GUIDES = [
  {
    id: 'nine-colored-deer-upper',
    title: '九色鹿·上',
    verifiedAt: '2026-08-30',
    sourceUrls: [],
    endings: [
      {
        id: 'beauty-or-demon',
        title: '妖女？佳人？',
        paths: [{
          id: 'default',
          steps: ['离开河边', '一起救人', '离开森林，寻找妖魔的轨迹', '杀死调达', '离开森林，前往皇宫', '立刻擒住女子'],
        }],
      },
      {
        id: 'slay-the-demon',
        title: '斩妖除魔',
        paths: [{
          id: 'default',
          steps: ['离开河边', '一起救人', '离开森林，寻找妖魔的轨迹', '杀死调达', '离开森林，前往皇宫', '暗中调查'],
        }],
      },
      {
        id: 'rage-to-the-crown',
        title: '怒发冲冠',
        paths: [{
          id: 'default',
          steps: ['告知有危险', '阻止九色鹿救人', '离开森林，前往皇宫', '刺杀妖魔女子'],
        }],
      },
      {
        id: 'deer-in-danger',
        title: '神鹿有难',
        paths: [{
          id: 'default',
          steps: ['离开河边', '阻止九色鹿救人', '离开森林，前往皇宫', '和平解决'],
        }],
      },
      {
        id: 'wicked-heart',
        title: '人心不古',
        paths: [{
          id: 'default',
          steps: ['告知有危险', '一起救人', '继续说服', '离开森林，前往皇宫', '调达会揭榜'],
        }],
      },
      {
        id: 'demon-revealed',
        title: '魔源现身',
        paths: [{
          id: 'default',
          steps: ['离开河边', '一起救人', '继续说服', '离开森林，前往皇宫', '调达不会揭榜'],
        }],
      },
    ],
  },
] as const satisfies readonly AdventureGuide[]
```

- [ ] **Step 3: 写入“九色鹿·下”五个结局及替代路径**

在同一个数组追加下篇。下篇的第一步明确写出需要先完成的上篇结局；同一结局存在多种达成方式时保留多个 `paths`，不能合并成含糊描述：

```ts
{
  id: 'nine-colored-deer-lower',
  title: '九色鹿·下',
  verifiedAt: '2026-08-30',
  sourceUrls: [
    'http://xyq.17173.com/content/12162019/111410854.shtml',
    'https://ol.3dmgame.com/gl/99374.html',
    'https://www.163.com/dy/article/FJ2I5E0B0526GONF.html',
  ],
  endings: [
    {
      id: 'happy-reunion',
      title: '花好月圆',
      paths: [{
        id: 'lost-way-home',
        label: '迷途归路',
        steps: ['九色鹿·上完成「神鹿有难」或「怒发冲冠」', '找到调达', '选择「救调达」'],
      }],
    },
    {
      id: 'dream-of-nanke',
      title: '南柯一梦',
      paths: [
        {
          id: 'deer-entrustment',
          label: '神鹿之托',
          steps: ['九色鹿·上完成「妖女？佳人？」或「斩妖除魔」', '找到九色鹿', '选择「收下九色鹿的角」'],
        },
        {
          id: 'mutual-destruction-with-horn',
          label: '同类相残·持有鹿角',
          steps: ['九色鹿·上完成「神鹿有难」或「怒发冲冠」', '找到调达', '选择「不救调达」', '持有九色鹿的角'],
        },
      ],
    },
    {
      id: 'deer-sacrifice',
      title: '灵鹿献身',
      paths: [
        {
          id: 'stubborn-path',
          label: '执迷不返',
          steps: ['九色鹿·上完成「人心不古」', '找到国王和调达', '任意选择一个对话选项'],
        },
        {
          id: 'lone-army',
          label: '孤军深入',
          steps: ['九色鹿·上完成「妖女？佳人？」或「斩妖除魔」', '找到九色鹿', '选择「不收九色鹿的角」'],
        },
        {
          id: 'mutual-destruction-without-horn',
          label: '同类相残·没有鹿角',
          steps: ['九色鹿·上完成「神鹿有难」或「怒发冲冠」', '找到调达', '选择「不救调达」', '没有九色鹿的角'],
        },
      ],
    },
    {
      id: 'flowers-fall',
      title: '花落人亡',
      paths: [{
        id: 'fated-beauty',
        label: '红颜薄命',
        steps: ['九色鹿·上完成「魔源现身」', '找到神志不清的王妃', '选择「阻止王妃」'],
      }],
    },
    {
      id: 'parting-in-love',
      title: '爱别离',
      paths: [{
        id: 'courageous-red-lips',
        label: '义胆红唇',
        steps: ['九色鹿·上完成「魔源现身」', '找到神志不清的王妃', '选择「唤醒王妃」'],
      }],
    },
  ],
},
```

- [ ] **Step 4: 做轻量结构检查**

运行：

```powershell
git diff --check -- src/types/adventureGuide.ts src/data/adventureGuides.ts
rg -n "title: ''|steps: \[\]" src/types/adventureGuide.ts src/data/adventureGuides.ts
```

预期：`git diff --check` 无输出；`rg` 无匹配。此处不运行 typecheck。

- [ ] **Step 5: 提交路线数据**

```powershell
git add -- src/types/adventureGuide.ts src/data/adventureGuides.ts
git commit -m "feat: 增加九色鹿路线攻略数据"
```

---

### Task 2: 实现攻略选择器与路线签卡片

**Files:**

- Create: `src/components/guides/GuideSelector.vue`
- Create: `src/components/guides/RouteCard.vue`

**Interfaces:**

- Consumes: `AdventureGuide`、`AdventureEnding`。
- Produces: `GuideSelector` 的 `modelValue` / `update:modelValue` 接口。
- Produces: `RouteCard` 的 `ending` 与 `position` props。

- [ ] **Step 1: 创建可访问的攻略选择器**

`GuideSelector.vue` 使用 `role="tablist"` 和原生按钮。按钮 ID 与面板 ID 必须稳定对应：

```vue
<script setup lang="ts">
import type { AdventureGuide } from '@/types/adventureGuide'

defineProps<{
  guides: readonly AdventureGuide[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [guideId: string]
}>()
</script>

<template>
  <div class="guide-selector" role="tablist" aria-label="选择奇遇攻略">
    <button
      v-for="guide in guides"
      :id="`guide-tab-${guide.id}`"
      :key="guide.id"
      class="guide-selector__item"
      :class="{ 'guide-selector__item--active': guide.id === modelValue }"
      type="button"
      role="tab"
      :aria-selected="guide.id === modelValue"
      :aria-controls="`guide-panel-${guide.id}`"
      @click="$emit('update:modelValue', guide.id)"
    >
      {{ guide.title }}
    </button>
  </div>
</template>
```

样式要求：标签可换行；默认白底和普通边框；当前项使用玉石绿文字、赭金色内描边和淡赭金背景；触控高度不小于现有按钮的 `2.5rem`；不要覆盖全局 `:focus-visible`。

- [ ] **Step 2: 创建路线签卡片**

`RouteCard.vue` 使用有序列表保留语义顺序。一个结局有多条路径时，逐条展示路径标签和完整步骤：

```vue
<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { AdventureEnding } from '@/types/adventureGuide'

defineProps<{
  ending: AdventureEnding
  position: number
}>()
</script>

<template>
  <article class="route-card" :aria-labelledby="`ending-${ending.id}`">
    <header class="route-card__header">
      <span class="route-card__index">结局 {{ position }}</span>
      <h2 :id="`ending-${ending.id}`">{{ ending.title }}</h2>
    </header>

    <div class="route-card__variants">
      <section
        v-for="path in ending.paths"
        :key="path.id"
        class="route-card__variant"
      >
        <h3 v-if="path.label">{{ path.label }}</h3>
        <ol class="route-card__steps">
          <li v-for="(step, stepIndex) in path.steps" :key="`${path.id}-${stepIndex}`">
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
```

样式要求：

- 卡片为单列白底、`1px` 淡边框、`0.75rem` 圆角；不要使用大阴影。
- 结局序号用赭金色，结局名使用系统中文衬线字体栈 `"Noto Serif SC", "Songti SC", SimSun, serif`。
- 桌面端 `.route-card__steps` 使用 flex 换行，每个 `li` 保持“节点 + 连接图标”组合，节点可以换行但不能截断。
- `max-width: 40rem` 以下切成纵向步骤；隐藏右箭头，显示下箭头。
- 多条路径之间用细分隔线，不用嵌套大卡片。

- [ ] **Step 3: 做轻量模板检查**

```powershell
git diff --check -- src/components/guides/GuideSelector.vue src/components/guides/RouteCard.vue
rg -n "→|▶|⌄" src/components/guides
```

预期：两个命令都无输出。此处不启动服务、不运行 typecheck。

- [ ] **Step 4: 提交通用组件**

```powershell
git add -- src/components/guides/GuideSelector.vue src/components/guides/RouteCard.vue
git commit -m "feat: 增加奇遇攻略路线组件"
```

---

### Task 3: 组装奇遇攻略页面

**Files:**

- Create: `src/views/AdventureGuidesView.vue`

**Interfaces:**

- Consumes: `ADVENTURE_GUIDES`、`GuideSelector`、`RouteCard`。
- Produces: 可由 Vue Router 懒加载的默认页面组件。

- [ ] **Step 1: 实现当前攻略选择和稳定回退**

脚本只维护当前攻略 ID，攻略内容始终从静态数组派生：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import GuideSelector from '@/components/guides/GuideSelector.vue'
import RouteCard from '@/components/guides/RouteCard.vue'
import { ADVENTURE_GUIDES } from '@/data/adventureGuides'

const activeGuideId = ref(ADVENTURE_GUIDES[0]?.id ?? '')
const activeGuide = computed(() =>
  ADVENTURE_GUIDES.find(({ id }) => id === activeGuideId.value) ?? null,
)
</script>
```

- [ ] **Step 2: 实现紧凑页面结构和空状态**

模板使用一个 `tabpanel`，切换后同步更新 `aria-labelledby`。核对日期按项目接口时间格式显示为 `yyyy-MM-dd`，这里直接展示静态 ISO 日期，不调用 `Date` 做时区转换：

```vue
<template>
  <div class="adventure-guides-view">
    <header class="adventure-guides-view__header">
      <p class="adventure-guides-view__eyebrow">路线速查</p>
      <h1>奇遇攻略</h1>
      <p>少翻长文，照着路线直接选。</p>
    </header>

    <GuideSelector v-model="activeGuideId" :guides="ADVENTURE_GUIDES" />

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

      <div v-if="activeGuide.endings.length > 0" class="adventure-guides-view__routes">
        <RouteCard
          v-for="(ending, index) in activeGuide.endings"
          :key="ending.id"
          :ending="ending"
          :position="index + 1"
        />
      </div>
      <p v-else class="adventure-guides-view__empty" role="status">
        攻略正在核对，暂不提供路线。
      </p>
    </section>
  </div>
</template>
```

- [ ] **Step 3: 写入页面级视觉样式**

在同文件的 scoped style 中实现：

- 容器最大宽度 `68rem`，使用与 `HomeView` 相同的响应式页面内边距。
- 标题区保持紧凑，`h1` 不超过 `clamp(2rem, 5vw, 3.5rem)`。
- 攻略选择器与面板间距清晰，面板标题不做外层大卡片。
- 路线卡列表使用单列网格，卡片间距 `1rem`。
- 页面局部定义 `--guide-accent: #b67832` 与淡化背景色，禁止修改 `:root` 全局主题。
- `320px` 下不出现固定宽度；所有容器使用 `min-width: 0`。

- [ ] **Step 4: 做轻量页面检查**

```powershell
git diff --check -- src/views/AdventureGuidesView.vue
rg -n "overflow-x: auto|text-overflow: ellipsis" src/views/AdventureGuidesView.vue
```

预期：两个命令都无输出。

- [ ] **Step 5: 提交页面**

```powershell
git add -- src/views/AdventureGuidesView.vue
git commit -m "feat: 增加奇遇攻略路线页面"
```

---

### Task 4: 接入共享工具目录、路由、侧栏和首页

**Files:**

- Create: `src/config/toolCatalog.ts`
- Modify: `src/router/index.ts`
- Modify: `src/layouts/AppLayout.vue`
- Modify: `src/views/HomeView.vue`

**Interfaces:**

- Produces: `ToolRouteName` 与 `TOOL_CATALOG`，作为侧栏和首页工具入口的唯一来源。
- Consumes: `AdventureGuidesView.vue` 默认导出。

- [ ] **Step 1: 创建共享工具目录**

```ts
import { ClipboardClock, Map } from 'lucide-vue-next'
import type { Component } from 'vue'

export type ToolRouteName = 'sect-mission' | 'adventure-guides'

export interface ToolCatalogItem {
  index: string
  routeName: ToolRouteName
  label: string
  description: string
  icon: Component
}

export const TOOL_CATALOG: readonly ToolCatalogItem[] = [
  {
    index: '01',
    routeName: 'sect-mission',
    label: '师门助手',
    description: '多账号计时、高价值提醒和商会检索，一页处理。',
    icon: ClipboardClock,
  },
  {
    index: '02',
    routeName: 'adventure-guides',
    label: '奇遇攻略',
    description: '九色鹿上下路线按结局速查，照着选就行。',
    icon: Map,
  },
]
```

- [ ] **Step 2: 新增路由**

在 `src/router/index.ts` 的现有 routes 数组追加：

```ts
{
  path: '/adventure-guides',
  name: 'adventure-guides',
  component: () => import('@/views/AdventureGuidesView.vue'),
},
```

- [ ] **Step 3: 让侧栏从工具目录派生导航**

在 `AppLayout.vue`：

- 删除 `ClipboardClock` 的直接导入，仅保留 `Home`、`PanelLeftClose`、`PanelLeftOpen`、`Sparkles`。
- 导入 `TOOL_CATALOG` 与 `ToolRouteName`。
- 把 `NavigationItem.name` 改为 `'home' | ToolRouteName`。
- 把导航数据改为：

```ts
const navigationItems: readonly NavigationItem[] = [
  { name: 'home', label: '首页', icon: Home },
  ...TOOL_CATALOG.map(({ routeName, label, icon }) => ({
    name: routeName,
    label,
    icon,
  })),
]
```

模板无需新增特殊分支，桌面侧栏和移动顶栏自动得到“奇遇攻略”。

- [ ] **Step 4: 让首页从工具目录派生工具卡**

在 `HomeView.vue` 的 `<script setup>` 导入 `TOOL_CATALOG`。把两个手写卡片替换为一个 `v-for`：

```vue
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
  <span class="tool-card__action" aria-hidden="true">打开工具</span>
</RouterLink>
```

同时删除 `.tool-card--upcoming`、`.tool-card__status` 及其子选择器，避免保留死样式。动作文字不使用 Unicode 箭头。

- [ ] **Step 5: 做集成差异检查**

```powershell
git diff --check -- src/config/toolCatalog.ts src/router/index.ts src/layouts/AppLayout.vue src/views/HomeView.vue
rg -n "更多工具|即将推出|→" src/config/toolCatalog.ts src/layouts/AppLayout.vue src/views/HomeView.vue
```

预期：两个命令都无输出。

- [ ] **Step 6: 提交入口集成**

```powershell
git add -- src/config/toolCatalog.ts src/router/index.ts src/layouts/AppLayout.vue src/views/HomeView.vue
git commit -m "feat: 接入奇遇攻略菜单入口"
```

---

### Task 5: 最终静态检查、构建与真实浏览器验收

**Files:**

- Verify: Tasks 1-4 的全部文件
- Do not create: 任何单元测试文件

**Interfaces:**

- Consumes: 完整奇遇攻略功能。
- Produces: 构建、类型、lint、桌面/移动端和控制台验收结果。

- [ ] **Step 1: 确认变更范围干净**

```powershell
git status --short
git log -5 --oneline
```

预期：只看见用户原有的 `?? pnpm-lock.yaml`；最近四个功能提交均为中文说明。

- [ ] **Step 2: 运行一次完整 lint**

```powershell
npm run lint
```

预期：退出码 `0`，无 ESLint 错误。

- [ ] **Step 3: 运行一次完整构建**

```powershell
npm run build
```

预期：`vue-tsc --noEmit` 和 `vite build` 均成功，退出码 `0`。

- [ ] **Step 4: 启动一次本地调试服务**

```powershell
npm run dev -- --host 127.0.0.1
```

记录 Vite 输出的本地地址。服务只用于本轮浏览器验收，验收完成后必须停止。

- [ ] **Step 5: 使用当前 Chrome 登录态验收桌面端**

打开 `/#/adventure-guides`，在桌面宽度检查：

- 侧栏出现“奇遇攻略”，首页第二张工具卡也能进入同一页面。
- 默认展示“九色鹿·上”，六个结局顺序和路线文本与 Task 1 完全一致。
- 切换“九色鹿·下”后展示五个结局；南柯一梦有两条路径，灵鹿献身有三条路径。
- 路线节点自然换行，无空卡、截断、横向滚动或重叠。
- 当前标签、键盘焦点和核对日期可见。
- 浏览器控制台无新增错误或警告。

- [ ] **Step 6: 验收移动端与键盘操作**

切换到 `390 × 844` 视口：

- 页面无横向溢出，路线连接从右箭头变为下箭头。
- 长步骤完整换行，卡片间距和触控高度合理。
- 使用 `Tab` 可依次聚焦攻略切换按钮；按 `Enter` / `Space` 可切换攻略。
- 当前项具有 `aria-selected="true"`，面板 `aria-labelledby` 指向当前标签。

- [ ] **Step 7: 停止服务并确认没有遗留进程**

在启动服务的终端发送 `Ctrl+C`，再确认对应 Vite 进程已经退出。最后运行：

```powershell
git status --short
```

预期：没有实现文件残留未提交；仍只保留用户原有的 `?? pnpm-lock.yaml`。
