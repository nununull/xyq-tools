# 师门助手紧凑布局实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将师门助手改造成账号可直接操作、常用店铺编号可一屏速查的高密度操作台。

**Architecture:** 保持 Pinia 领域状态、计时算法和现有事件接口不变，只在视图组件内重排信息。账号继续由 `AccountBoard` 编排、`AccountCard` 执行动作；店铺分类根据类型选择编号胶囊或原有详细卡片。

**Tech Stack:** Vue 3、TypeScript、Pinia、Vue Draggable Plus、Scoped CSS、Vite。

## Global Constraints

- 所有新增或修改的方法必须保留中文注释。
- 不新增单元测试文件，不为测试兼容添加冗余生产代码。
- 不修改账号推荐算法、五分钟提醒、数据模型或持久化格式。
- 三药、家具、烹饪默认只显示店铺编号；召唤兽保留详细资料。
- Git 提交说明使用中文。

---

### Task 1: 建立紧凑账号操作台

**Files:**
- Modify: `src/components/accounts/AccountBoard.vue`
- Modify: `src/components/accounts/AccountCard.vue`

**Interfaces:**
- Consumes: 现有 `Account`、`AccountStatus`、`getRecommendedAccount(now)` 及全部账号事件。
- Produces: 保持现有 props 和 emits 完全不变的多列账号操作网格。

- [ ] **Step 1: 压缩账号区标题与统计**

  将四块大统计收拢为标题旁紧凑指标，推荐账号文字保留，新增账号按钮保持可见。

- [ ] **Step 2: 将账号列表改为自适应多列网格**

  桌面端使用 `repeat(auto-fit, minmax(...))`，平板双列、手机单列，卡片高度由内容决定且不横向溢出。

- [ ] **Step 3: 重排账号卡信息与操作**

  将账号名、状态、计时和主要操作压缩到紧凑卡片；备注限制两行；编辑删除保持次级层级；拖拽和键盘排序不变。

- [ ] **Step 4: 强化推荐账号**

  推荐卡使用暖色底、强化边框和“★ 推荐”文字，使推荐状态不依赖颜色表达。

- [ ] **Step 5: 验证账号切片**

  Run: `npm run type-check && npm run lint && npm run build`
  Expected: 三条命令退出码均为 0。

- [ ] **Step 6: 提交账号切片**

  ```powershell
  git add src/components/accounts/AccountBoard.vue src/components/accounts/AccountCard.vue
  git commit -m "feat: 改造紧凑账号操作台"
  ```

### Task 2: 建立店铺编号胶囊墙

**Files:**
- Create: `src/components/shops/ShopNumberPill.vue`
- Modify: `src/components/shops/ShopCategorySection.vue`
- Modify: `src/components/shops/ShopCard.vue`
- Modify: `src/components/shops/ShopPanel.vue`

**Interfaces:**
- Consumes: `Shop`、`ShopCategory`，以及现有 edit、remove、move、reorder 事件。
- Produces: `ShopNumberPill` 接收 `shop`、`categoryTitle`、`canMoveUp`、`canMoveDown`，发出 edit、remove、move；分类组件对非召唤兽渲染胶囊，对召唤兽渲染详细卡。

- [ ] **Step 1: 新增编号胶囊组件**

  胶囊主按钮只渲染 `shop.number` 并点击编辑；独立拖拽把手支持上下方向键；极简删除按钮保留完整管理能力。每个方法添加中文注释。

- [ ] **Step 2: 按分类切换展示模式**

  `category !== 'summon'` 时渲染可换行胶囊墙；`summon` 时沿用 `ShopCard`。两种模式复用现有排序数组和事件，不改 store。

- [ ] **Step 3: 压缩商会区与召唤兽卡片**

  缩小标题、搜索框、分类容器、详细卡片的间距和字体；桌面端四分类按内容合理排布，移动端自然单列。

- [ ] **Step 4: 验证店铺切片**

  Run: `npm run type-check && npm run lint && npm run build`
  Expected: 三条命令退出码均为 0。

- [ ] **Step 5: 提交店铺切片**

  ```powershell
  git add src/components/shops/ShopNumberPill.vue src/components/shops/ShopCategorySection.vue src/components/shops/ShopCard.vue src/components/shops/ShopPanel.vue
  git commit -m "feat: 添加店铺编号胶囊速查"
  ```

### Task 3: 压缩页面编排并完成浏览器验收

**Files:**
- Modify: `src/views/SectMissionView.vue`
- Modify: `src/styles/base.css`（仅在全局控件尺寸确实阻碍紧凑布局时修改）

**Interfaces:**
- Consumes: Task 1 的账号网格与 Task 2 的店铺分类展示。
- Produces: 桌面、平板与手机均无横向溢出的紧凑页面。

- [ ] **Step 1: 压缩页面头部与提醒区**

  缩小页面最大间距和标题字号；空提醒显示单行；有提醒时以紧凑分组显示，所有现有按钮事件不变。

- [ ] **Step 2: 调整页面主布局**

  账号工作台使用页面主要宽度，店铺区移至其后，避免窄侧栏限制胶囊同屏数量。

- [ ] **Step 3: 运行完整静态验证**

  Run: `npm run type-check && npm run lint && npm run build`
  Expected: 三条命令退出码均为 0，`dist` 正常生成。

- [ ] **Step 4: 运行真实浏览器验收**

  启动 Vite，分别检查桌面、平板和手机宽度；确认账号多列可直接操作、推荐账号醒目、三类店铺仅有编号、召唤兽详情完整、无横向溢出且控制台无新增错误或警告。

- [ ] **Step 5: 复核差异并提交页面切片**

  Run: `git diff --check && git status --short`
  Expected: 无空白错误，仅包含本计划范围内文件。

  ```powershell
  git add src/views/SectMissionView.vue src/styles/base.css
  git commit -m "style: 收紧师门助手页面布局"
  ```
