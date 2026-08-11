# 梦幻西游师门工具站实施计划

> **供执行代理使用：**必须使用 `subagent-driven-development`（推荐）或 `executing-plans`，严格按任务顺序执行并在每个检查点复核。所有步骤使用复选框追踪。

**目标：**从空仓库构建一个可静态部署的 Vue 3 + TypeScript 梦幻西游工具站，交付首页、可并行计时的师门账号工作台、五分钟高价值提醒和同页商会店铺管理。

**架构：**应用使用 Vue Router 组织首页与师门页，Pinia 作为唯一业务状态源，版本化 `localStorage` 负责持久化。计时保存绝对时间戳，界面每秒推导显示值而不每秒写盘；账号和店铺 UI 通过领域 action 修改状态，不直接接触存储格式。

**技术栈：**Vue 3.5、TypeScript 7、Vite 8、Vue Router 5、Pinia 4、`vue-draggable-plus`、`lucide-vue-next`、原生 CSS、ESLint 10。

## 全局约束

- 所有业务方法必须添加中文注释，说明行为、边界或设计原因。
- 使用严格 TypeScript，禁止 `any`，组件统一使用 Composition API 和 `<script setup>`。
- 不创建单元测试文件，不为兼容测试添加冗余生产代码。
- 每个任务结束必须运行任务指定的类型检查、代码检查、构建或浏览器验证。
- Git 提交说明必须使用中文；提交前执行 `git diff --check` 并检查暂存内容。
- 账号允许同时计时；推荐结果只高亮，不自动开始账号。
- 删除账号、删除店铺和手动重置必须二次确认。
- `.superpowers/`、`node_modules/`、`dist/`、环境文件和密钥不得提交。

---

## 文件结构

```text
index.html                         Vite 入口文档
package.json                       依赖和脚本
vite.config.ts                     Vue 构建配置
eslint.config.js                   ESLint Flat Config
src/
  main.ts                          应用启动、Pinia 和路由注册
  App.vue                          根组件、全局反馈宿主
  router/index.ts                  路由定义
  layouts/AppLayout.vue            左侧导航与响应式外壳
  views/HomeView.vue               首页工具导航
  views/SectMissionView.vue        师门页功能编排
  types/domain.ts                  账号、店铺、持久化类型
  services/localDate.ts            本地日期与每日重置辅助
  services/persistence.ts          版本化存储、校验、损坏备份
  stores/useToolStore.ts           师门与商会领域状态
  stores/useUiStore.ts             弹窗确认和提示消息状态
  composables/useClock.ts          共享秒级时钟与页面生命周期结算
  composables/useNotifier.ts       声音、标题和系统通知
  components/common/               弹窗、确认、提示消息
  components/accounts/             账号工作台、卡片和表单
  components/shops/                商会检索、分组、卡片和表单
  styles/base.css                  设计变量、基础样式、响应式规则
```

依赖顺序：工程基础 → 应用外壳 → 路由首页 → 领域状态 → 全局交互 → 账号完整切片 → 商会完整切片 → 全量验收。

---

### Task 1: 建立可复现的 Vue 工程基础

**文件：**

- 创建：`package.json`
- 创建：`package-lock.json`（由 `npm install` 生成）
- 创建：`tsconfig.json`
- 创建：`vite.config.ts`
- 创建：`index.html`

**接口：**

- 产出脚本：`npm run dev`、`npm run type-check`、`npm run lint`、`npm run build`。
- 后续任务依赖 `@` 指向 `src/` 的路径别名。

- [ ] **步骤 1：写入依赖和脚本**

  `package.json` 使用以下版本与脚本：

  ```json
  {
    "name": "xyq-tools",
    "private": true,
    "version": "0.1.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "type-check": "vue-tsc --noEmit",
      "lint": "eslint .",
      "build": "npm run type-check && vite build"
    },
    "dependencies": {
      "lucide-vue-next": "^1.0.0",
      "pinia": "^4.0.2",
      "vue": "^3.5.41",
      "vue-draggable-plus": "^0.6.1",
      "vue-router": "^5.2.0"
    },
    "devDependencies": {
      "@eslint/js": "^10.0.1",
      "@vitejs/plugin-vue": "^6.0.8",
      "eslint": "^10.8.1",
      "eslint-plugin-vue": "^10.10.0",
      "typescript": "^7.0.2",
      "typescript-eslint": "^8.67.0",
      "vite": "^8.2.1",
      "vue-tsc": "^3.3.9"
    }
  }
  ```

- [ ] **步骤 2：配置 TypeScript 与 Vite**

  `tsconfig.json` 开启 `strict`、`noUncheckedIndexedAccess`、`noImplicitOverride`，包含 `src/**/*.ts`、`src/**/*.vue` 和 `vite.config.ts`。`vite.config.ts` 注册 Vue 插件并将 `@` 映射到 `./src`。

  ```ts
  import { fileURLToPath, URL } from 'node:url'
  import vue from '@vitejs/plugin-vue'
  import { defineConfig } from 'vite'

  export default defineConfig({
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  })
  ```

- [ ] **步骤 3：创建 Vite HTML 入口并安装依赖**

  `index.html` 提供 `#app` 和 `/src/main.ts` 模块入口，页面标题为“梦幻工具箱”。运行：

  ```powershell
  npm install
  npm ls --depth=0
  ```

  预期：安装退出码为 0，顶层依赖无 `invalid` 或 `missing`。

- [ ] **步骤 4：检查并提交工程基础**

  ```powershell
  git diff --check
  git add package.json package-lock.json tsconfig.json vite.config.ts index.html
  git commit -m "chore: 初始化 Vue 工程基础"
  ```

---

### Task 2: 交付可构建的应用外壳和薄荷绿基础主题

**文件：**

- 创建：`eslint.config.js`
- 创建：`src/env.d.ts`
- 创建：`src/main.ts`
- 创建：`src/App.vue`
- 创建：`src/styles/base.css`

**接口：**

- 产出 CSS 变量：`--mint-500`、`--mint-700`、`--surface`、`--surface-soft`、`--text`、`--text-muted`、`--border`、`--danger`。
- 产出根挂载点和 Pinia 实例，后续路由与 store 可直接注册。

- [ ] **步骤 1：配置 Vue 与 TypeScript ESLint**

  `eslint.config.js` 组合 `@eslint/js`、`typescript-eslint` 和 `eslint-plugin-vue` 的推荐配置，对 `.vue` 文件使用 TypeScript parser，并忽略 `dist/`、`node_modules/`、`.superpowers/`：

  ```js
  import eslint from '@eslint/js'
  import pluginVue from 'eslint-plugin-vue'
  import tseslint from 'typescript-eslint'

  export default tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', '.superpowers/**'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
      files: ['**/*.vue'],
      languageOptions: {
        parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
      },
    },
  )
  ```

- [ ] **步骤 2：创建应用入口**

  `src/main.ts` 创建 Vue 应用、注册 Pinia、导入 `base.css` 并挂载：

  ```ts
  import { createPinia } from 'pinia'
  import { createApp } from 'vue'
  import App from './App.vue'
  import './styles/base.css'

  const app = createApp(App)
  app.use(createPinia())
  app.mount('#app')
  ```

- [ ] **步骤 3：建立主题和根组件**

  `base.css` 定义低饱和薄荷绿变量、暖白背景、字体、焦点轮廓、按钮基础和 `prefers-reduced-motion`。`App.vue` 暂时渲染品牌标题与“应用正在搭建”空状态，禁止使用刺眼纯白大面积背景。

- [ ] **步骤 4：运行首次完整验证**

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  ```

  预期：三个命令退出码均为 0，`dist/` 生成但保持未跟踪忽略状态。

- [ ] **步骤 5：提交应用外壳**

  ```powershell
  git add eslint.config.js src
  git commit -m "feat: 建立薄荷绿应用外壳"
  ```

---

### Task 3: 交付首页与师门路由入口

**文件：**

- 创建：`src/router/index.ts`
- 创建：`src/views/HomeView.vue`
- 创建：`src/views/SectMissionView.vue`

**接口：**

- 产出 Hash 路由：`/#/`（首页）、`/#/sect-mission`（师门助手）。
- 产出命名路由 `home`、`sect-mission`，供 Task 4 的导航外壳消费。

- [ ] **步骤 1：先创建两个可访问页面**

  `HomeView.vue` 提供欢迎区、可点击的“师门助手”工具卡和不可点击的后续工具扩展卡。`SectMissionView.vue` 先呈现页面标题、当日说明和后续业务区域容器，不提前混入账号或店铺领域逻辑。

- [ ] **步骤 2：定义适合纯静态部署的 Hash 路由**

  ```ts
  import { createRouter, createWebHashHistory } from 'vue-router'

  export const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
      { path: '/sect-mission', name: 'sect-mission', component: () => import('@/views/SectMissionView.vue') },
    ],
  })
  ```

- [ ] **步骤 3：验证页面模块可独立构建**

  依次运行 `npm run type-check`、`npm run lint`、`npm run build`，确认页面和路由模块没有类型或静态检查错误。此时应用入口尚未接入路由，不进行浏览器导航检查。

- [ ] **步骤 4：提交页面和路由模块**

  ```powershell
  git add src/router src/views
  git commit -m "feat: 添加工具首页和师门页面入口"
  ```

### Task 4: 接入布局 A 导航外壳

**文件：**

- 创建：`src/layouts/AppLayout.vue`
- 修改：`src/main.ts`
- 修改：`src/App.vue`

**接口：**

- 消费 Task 3 的 `router`、命名路由 `home` 和 `sect-mission`。
- 产出带响应式导航的可浏览应用框架。

- [ ] **步骤 1：实现布局 A 的导航外壳**

  `AppLayout.vue` 使用 `Home`、`ClipboardClock`、`Sparkles` 图标构建左侧导航。桌面端固定侧栏，窄窗口改为顶部栏；当前路由必须有 `aria-current="page"`。

- [ ] **步骤 2：接入路由并验证导航**

  `main.ts` 注册 `router`，`App.vue` 只渲染 `AppLayout`。运行：

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  ```

  浏览器检查：首页卡片进入 `/#/sect-mission`，左侧导航可返回首页，直接刷新 Hash 子路由仍可加载。

- [ ] **步骤 3：提交导航外壳**

  ```powershell
  git add src/main.ts src/App.vue src/layouts
  git commit -m "feat: 接入站点导航外壳"
  ```

---

### 检查点一：基础与导航

- [ ] `npm run type-check`、`npm run lint`、`npm run build` 全部通过。
- [ ] 首页与师门页可以双向导航。
- [ ] 桌面端左侧导航和窄窗口顶部导航均无横向溢出。
- [ ] Git 工作区只允许存在后续任务明确产生的未提交文件。

---

### Task 5: 建立领域模型、每日重置和版本化持久化

**文件：**

- 创建：`src/types/domain.ts`
- 创建：`src/services/localDate.ts`
- 创建：`src/services/persistence.ts`
- 创建：`src/stores/useToolStore.ts`
- 创建：`src/composables/useClock.ts`

**接口：**

- `getLocalDateKey(now: Date): string`
- `loadPersistedState(): LoadResult`
- `savePersistedState(state: PersistedState): SaveResult`
- `useToolStore()` actions：`addAccount`、`updateAccount`、`removeAccount`、`reorderAccounts`、`startAccount`、`pauseAccount`、`waitAccount`、`completeAccount`、`reopenAccount`、`expireWaits`、`ensureCurrentDate`、`resetDailyProgress`、`checkpointRunning`、`addShop`、`updateShop`、`removeShop`、`reorderShops`。
- `useClock(onTick?: (now: number) => void): { now: Readonly<Ref<number>> }`

- [ ] **步骤 1：定义严格领域类型**

  `domain.ts` 精确实现设计文档中的 `AccountStatus`、`Account`、`ShopCategory`、`Shop` 和 `PersistedState`。另外定义去除系统字段的 `AccountDraft`、`ShopDraft`，禁止表单伪造 `id`、状态、耗时和排序。

- [ ] **步骤 2：实现本地日期和默认数据工厂**

  `getLocalDateKey` 必须使用本地年、月、日拼接，不能使用会按 UTC 截断的 `toISOString()`：

  ```ts
  /** 返回浏览器本地自然日键，避免 UTC 日期造成凌晨误重置。 */
  export function getLocalDateKey(now: Date): string {
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  ```

- [ ] **步骤 3：实现安全持久化**

  `persistence.ts` 使用键 `xyq-tools:sect-mission:v1`。加载时逐层校验数组、枚举和数值字段；解析失败则把原字符串写入 `xyq-tools:sect-mission:corrupt:<timestamp>`，返回默认状态和中文警告。写入失败返回 `{ ok: false, message }`，不吞掉异常也不让组件直接碰 `localStorage`。

- [ ] **步骤 4：实现账号与商会领域 action**

  `useToolStore.ts` 在创建时加载数据、检查本地日期并订阅持久化。关键计时动作遵守：

  ```ts
  /** 结算账号本次运行区间，并清除开始时间。 */
  function settleRunningAccount(account: Account, now: number): void {
    if (account.status !== 'running' || account.startedAt === null) return
    account.accumulatedMs += Math.max(0, now - account.startedAt)
    account.startedAt = null
  }
  ```

  `waitAccount` 固定写入 `now + 5 * 60 * 1000`；`expireWaits` 只把到期账号变为 `ready` 并返回新到期账号 ID，不自动恢复；`ensureCurrentDate` 在本地自然日变化时执行每日重置；`recommendedAccount` 排除 `completed`、`waiting`，按实时有效耗时和 `order` 排序。

- [ ] **步骤 5：实现共享时钟与生命周期结算**

  `useClock` 每秒更新一次 `now`，组件卸载时清除 interval。页面 `visibilitychange` 和 `beforeunload` 时调用 `checkpointRunning(Date.now())`，把所有运行中区间结算后以新时间戳继续，避免刷新边界丢失毫秒。

- [ ] **步骤 6：验证领域层并提交**

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  git add src/types src/services src/stores/useToolStore.ts src/composables/useClock.ts
  git commit -m "feat: 建立师门领域状态和本地持久化"
  ```

  浏览器开发工具检查：首次加载生成版本化存储；手工写入非法 JSON 后刷新，页面不会白屏且产生损坏备份键。

---

### Task 6: 建立统一弹窗、确认和反馈机制

**文件：**

- 创建：`src/stores/useUiStore.ts`
- 创建：`src/components/common/BaseModal.vue`
- 创建：`src/components/common/ConfirmDialog.vue`
- 创建：`src/components/common/ToastHost.vue`
- 修改：`src/App.vue`

**接口：**

- `confirm(options: ConfirmOptions): Promise<boolean>`
- `toast(message: string, tone?: 'info' | 'success' | 'warning' | 'danger'): void`
- `BaseModal` props：`open`、`title`、`description?`；emits：`close`。

- [ ] **步骤 1：实现全局反馈状态**

  `useUiStore` 管理单个确认请求和最多三条提示消息。`confirm` 返回 Promise；用户确认、取消或关闭弹窗时必须只 resolve 一次。Toast 五秒后自动移除并允许手动关闭。

- [ ] **步骤 2：实现可访问弹窗**

  `BaseModal.vue` 使用原生 `<dialog>`，打开时聚焦首个可交互元素，关闭时恢复触发按钮焦点；支持 Escape 关闭、遮罩点击关闭，并设置 `aria-labelledby`、`aria-describedby`。

- [ ] **步骤 3：实现确认和提示宿主**

  `ConfirmDialog` 明确区分普通确认和危险确认，危险按钮文案不允许只写“确定”。`ToastHost` 使用 `aria-live="polite"`，损坏数据或保存失败使用 `role="alert"`。

- [ ] **步骤 4：挂载到根组件并验证**

  `App.vue` 在 `AppLayout` 之后挂载 `ConfirmDialog` 与 `ToastHost`。运行完整验证，并在浏览器检查 Tab、Shift+Tab、Escape 和焦点恢复。

- [ ] **步骤 5：提交交互基础设施**

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  git add src/App.vue src/stores/useUiStore.ts src/components/common
  git commit -m "feat: 添加统一弹窗和操作反馈"
  ```

---

### Task 7: 交付账号维护、并行计时和高价值提醒完整切片

**文件：**

- 创建：`src/components/accounts/AccountBoard.vue`
- 创建：`src/components/accounts/AccountCard.vue`
- 创建：`src/components/accounts/AccountFormModal.vue`
- 创建：`src/composables/useNotifier.ts`
- 修改：`src/views/SectMissionView.vue`

**接口：**

- `AccountCard` props：`account`、`now`、`recommended`；emits：`start`、`pause`、`wait`、`complete`、`reopen`、`edit`、`remove`。
- `AccountFormModal` props：`open`、`account?`；emits：`save(AccountDraft)`、`close`。
- `useNotifier()`：`requestPermission()`、`notifyReady(accountName: string)`、`restoreTitle()`。

- [ ] **步骤 1：实现账号表单与卡片状态动作**

  表单校验名称非空并去除首尾空白。卡片根据状态只显示合法动作：未开始显示“开始”，计时中显示“暂停 / 高价值 / 完成”，暂停显示“继续 / 完成”，等待显示剩余时间，已到期显示“继续 / 完成”，已完成显示“撤销完成”。所有按钮必须有完整中文可访问名称。

- [ ] **步骤 2：实现账号工作台和拖拽排序**

  `AccountBoard.vue` 使用 `VueDraggable` 绑定排序副本，结束后调用 `reorderAccounts(ids)`。顶部显示账号总数、计时中数量、等待数量和推荐账号；没有账号时显示明确的新增引导。

- [ ] **步骤 3：实现提醒能力**

  `useNotifier.ts` 使用 Web Audio 生成两段轻提示音，不添加音频文件。系统通知仅在 `Notification.permission === 'granted'` 时发送；权限拒绝或 API 不存在时静默降级。到期后将标题改为“⏰ 账号可切回｜梦幻工具箱”，用户聚焦页面或处理提醒后恢复。

- [ ] **步骤 4：编排每秒更新与到期事件**

  `SectMissionView.vue` 使用 `useClock` 每秒先调用 `ensureCurrentDate(now)`，再调用 `expireWaits(now)`；只对本次新到期 ID 调用 `notifyReady`，避免每秒重复鸣叫。页面集中列出所有 `waiting` 和 `ready` 账号；新增、编辑、删除、手动重置均使用统一弹窗与反馈，删除和重置必须二次确认。

- [ ] **步骤 5：验证并行计时与刷新恢复**

  浏览器依次执行：新增三个账号；同时启动两个；暂停其中一个；另一个进入高价值等待；刷新页面；确认运行耗时继续、暂停耗时不变、等待截止时间不漂；把等待截止时间改为临近值，确认只提醒一次；完成账号后确认推荐排除该账号。

- [ ] **步骤 6：提交账号完整切片**

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  git add src/components/accounts src/composables/useNotifier.ts src/views/SectMissionView.vue
  git commit -m "feat: 完成账号并行计时和高价值提醒"
  ```

---

### 检查点二：师门核心流程

- [ ] 至少三个账号可独立开始、暂停、等待、继续、完成和撤销完成。
- [ ] 两个以上账号同时运行时，有效耗时互不干扰。
- [ ] 多个五分钟等待使用各自绝对截止时间，到期提醒不重复。
- [ ] 推荐算法排除已完成和等待中账号，并在同耗时时遵守拖拽顺序。
- [ ] 刷新页面后所有状态、耗时和排序正确恢复。

---

### Task 8: 交付同页商会分类检索和维护完整切片

**文件：**

- 创建：`src/components/shops/ShopPanel.vue`
- 创建：`src/components/shops/ShopCategorySection.vue`
- 创建：`src/components/shops/ShopCard.vue`
- 创建：`src/components/shops/ShopFormModal.vue`
- 修改：`src/views/SectMissionView.vue`

**接口：**

- `ShopPanel` 无业务 props，直接使用领域 store 读取四类分组和搜索结果。
- `ShopCategorySection` props：`category`、`title`、`shops`；emits：`add`、`edit`、`remove`、`reorder`。
- `ShopFormModal` props：`open`、`shop?`、`defaultCategory?`；emits：`save(ShopDraft)`、`close`。

- [ ] **步骤 1：实现店铺表单标准化**

  分类、编号、名称必填。商品输入支持中文顿号、中文逗号、英文逗号和换行，提交前执行：

  ```ts
  /** 将自由输入的商品名称标准化为去空、去重的关键词。 */
  function normalizeItems(input: string): string[] {
    return [...new Set(input.split(/[、，,\n]/).map((item) => item.trim()).filter(Boolean))]
  }
  ```

- [ ] **步骤 2：实现四类同页展示**

  `ShopPanel` 固定按三药、家具、召唤兽、烹饪渲染四个分类区，不使用分类路由和隐藏 Tab。每区显示店铺数量和新增按钮；空分类保留简洁空状态。

- [ ] **步骤 3：实现搜索与店铺卡片**

  搜索忽略大小写和首尾空白，同时匹配编号、名称、商品和备注。搜索时四个分类仍同时存在，只隐藏不匹配卡片；无结果时明确显示“没有匹配店铺”，不能让用户误以为数据被删。

- [ ] **步骤 4：实现分类内拖拽、编辑和删除**

  每个分类独立使用 `VueDraggable`，拖动结束后调用 `reorderShops(category, ids)`。跨分类调整通过编辑表单改变分类，不支持直接跨组拖动，避免误分类。删除显示包含店铺编号和名称的危险确认文案。

- [ ] **步骤 5：验证商会完整流程并提交**

  浏览器为每类各新增两家店铺，验证编辑、删除、商品分隔符标准化、全字段搜索、无结果提示和分类内拖拽。刷新后确认数据与顺序恢复。

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  git add src/components/shops src/views/SectMissionView.vue
  git commit -m "feat: 完成商会店铺分类检索和维护"
  ```

---

### Task 9: 完成响应式、可访问性和全量验收

**文件：**

- 修改：`src/styles/base.css`
- 修改：`src/layouts/AppLayout.vue`
- 修改：`src/views/HomeView.vue`
- 修改：`src/views/SectMissionView.vue`
- 创建：`README.md`

**接口：**

- 不新增领域接口，只完成表现层收口和使用说明。

- [ ] **步骤 1：完成桌面与窄窗口布局**

  桌面宽度不小于 `1100px` 时保持左侧导航、账号主区和商会侧栏；低于 `1100px` 时商会移动到账号下方；低于 `720px` 时导航变为顶部横向导航、账号卡片单列、弹窗占据可用宽度。任何断点不得出现页面级横向滚动条。

- [ ] **步骤 2：完成状态和键盘可访问性检查**

  所有交互元素保留可见焦点；推荐、计时、等待、到期和完成状态同时使用图标、文字与颜色；拖拽项提供可见拖动把手；按钮触控高度不低于 `40px`；减少动态效果设置下关闭非必要过渡。

- [ ] **步骤 3：编写使用说明**

  `README.md` 写明安装、开发、构建、静态部署、本地数据范围、浏览器通知权限和每日重置规则。明确数据只存当前浏览器，不宣传不存在的云同步。

- [ ] **步骤 4：执行全量静态验证**

  ```powershell
  npm run type-check
  npm run lint
  npm run build
  git diff --check
  git status --short
  ```

  预期：类型检查、代码检查、生产构建和空白检查均退出 0；`dist/` 未被 Git 跟踪。

- [ ] **步骤 5：执行真实浏览器验收**

  在开发服务器中逐项验证设计文档第 11 节的九项流程。至少检查 `1440×900`、`1024×768`、`390×844` 三种视口；检查控制台无 error、无未处理 Promise rejection，刷新 `/#/sect-mission` 时应用状态恢复。

- [ ] **步骤 6：审查变更并提交收口**

  ```powershell
  git diff --check
  git add src README.md
  git diff --staged --stat
  git commit -m "feat: 完成师门工具站首版体验"
  ```

---

## 最终验收清单

- [ ] 首页可以导航到师门助手，并为后续工具保留清晰入口。
- [ ] 账号支持嵌入式新增、编辑、删除和拖拽排序。
- [ ] 多账号并行计时、暂停、高价值等待、到期、完成和撤销完成符合状态规则。
- [ ] 推荐账号仅高亮，并遵守“排除等待与完成、有效耗时最少、排序优先”的算法。
- [ ] 多个倒计时独立运行，到期提供页面、声音、标题及可选系统通知。
- [ ] 商会四类店铺同页展示，支持维护、搜索和分类内拖拽排序。
- [ ] 刷新、关闭重开、损坏数据和跨日重置行为符合设计。
- [ ] 薄荷绿主题在三种视口中可读、无横向溢出、键盘可操作。
- [ ] 未创建单元测试文件，未写测试兼容代码。
- [ ] 类型检查、Lint、生产构建和浏览器验收全部通过。

## 风险与处理

| 风险 | 影响 | 处理 |
|---|---|---|
| 后台标签页计时器被浏览器节流 | 高 | 保存绝对时间戳，显示时用当前时间推导，不依赖 interval 累加 |
| Web Audio 或系统通知被权限策略阻止 | 中 | 页面提醒和标题变化始终可用，声音与系统通知渐进增强 |
| 本地数据损坏导致白屏或丢失 | 高 | 严格校验、损坏原文备份、恢复默认状态并明确警告 |
| 拖拽误把店铺移动到错误分类 | 中 | 只允许分类内拖动，跨分类必须通过编辑表单确认 |
| 空仓库一次变更过大难以回退 | 中 | 按九个可验证任务提交，每个核心切片都有独立保存点 |

## 未决问题

无。所有产品、架构、状态和视觉决策已经用户确认。
