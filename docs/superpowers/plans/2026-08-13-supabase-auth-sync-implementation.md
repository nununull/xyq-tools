# Supabase 邮箱认证、云同步与师门统计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 Vue 工具站加入 Supabase 六位邮箱 OTP、按用户隔离的云端状态、离线待同步缓存和每日师门统计，同时完整保留游客本地模式。

**Architecture:** 领域 Store 继续只处理 `PersistedState`；认证 Store 管理 Supabase Session；持久化协调 Store 负责初始化数据源、首次迁移、串行同步和退出隔离。云端使用每用户一行的 JSON 当前快照，并把当前日期的账号指标 upsert 到独立统计表。

**Tech Stack:** Vue 3.5、Pinia 4、TypeScript 6、Vite 8、`@supabase/supabase-js` v2、Supabase Auth/Postgres/RLS、GitHub Pages。

## Global Constraints

- 使用 Supabase Auth 无密码六位邮箱 OTP；OTP 有效期 3600 秒，重发间隔至少 60 秒。
- 未注册邮箱验证时自动创建用户；不实现密码、独立注册页或找回密码。
- 游客只使用本地存储；登录用户以 Supabase 为主，并使用按用户 ID 隔离的本地待同步缓存。
- 多设备冲突采用最后一次成功保存覆盖，不做字段级合并或实时订阅。
- 不新增单元测试文件；每个增量至少运行受影响的类型检查、Lint 或生产构建。
- 所有新增或修改的方法必须有中文注释。
- 不为迎合测试编写冗余兼容代码。
- Secret Key、`service_role` Key 和 SMTP 凭据绝不进入前端、仓库或构建变量。
- 每个提交只包含一个逻辑增量，Git 提交说明使用中文。

## 文件结构

- `supabase/migrations/202608130001_auth_sync.sql`：创建两张表、约束、更新时间触发器和 RLS Policy。
- `src/services/supabase.ts`：校验公开环境变量并创建唯一 Supabase 客户端。
- `src/services/cloudPersistence.ts`：云端读取、快照 upsert、当日统计 upsert。
- `src/services/syncCache.ts`：用户隔离的待同步缓存及单调递增修订号。
- `src/stores/useAuthStore.ts`：OTP、Session、认证事件和退出。
- `src/stores/usePersistenceStore.ts`：数据源初始化、首次迁移、保存队列、重试与同步状态。
- `src/components/auth/AuthModal.vue`：邮箱和六位验证码两步表单。
- `src/components/auth/AccountControl.vue`：本地/云端身份和同步状态入口。
- `src/types/domain.ts`：补充 `completedAt`。
- `src/services/persistence.ts`：公开严格解析、清除游客数据，并迁移旧状态。
- `src/stores/useToolStore.ts`：改成显式 hydrate 和持久化协调，不再模块加载即固定读写本地库。
- `src/layouts/AppLayout.vue`、`src/App.vue`、`src/main.ts`：账户 UI 和应用启动编排。
- `src/env.d.ts`、`.env.example`、`README.md`：配置类型、模板与部署/使用说明。

---

### Task 1: 数据库迁移与 Supabase 客户端

**Files:**
- Create: `supabase/migrations/202608130001_auth_sync.sql`
- Create: `src/services/supabase.ts`
- Create: `.env.example`
- Modify: `src/env.d.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `supabase: SupabaseClient`，供认证和云持久化模块使用。
- Produces: 两张仅允许当前认证用户访问的表 `user_tool_states`、`sect_mission_daily_stats`。

- [ ] **Step 1: 安装官方客户端**

Run:

```powershell
npm install @supabase/supabase-js@^2
```

Expected: `package.json` 和锁文件加入同一主版本依赖，不出现第二套 Supabase 客户端。

- [ ] **Step 2: 创建数据库迁移**

迁移必须包含：

```sql
create table public.user_tool_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.sect_mission_daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  stat_date date not null,
  account_name text not null,
  accumulated_ms bigint not null check (accumulated_ms >= 0),
  high_value_count integer not null check (high_value_count >= 0),
  completed boolean not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, account_id, stat_date)
);
```

再创建一个 `public.set_updated_at()` 触发器函数，并给两张表增加 `before update` 触发器。启用 RLS 后，为每张表分别创建 `select/insert/update/delete` Policy：`using ((select auth.uid()) = user_id)`；插入和更新增加相同 `with check`。函数设置固定 `search_path = ''`，Policy 不得使用恒真表达式。

- [ ] **Step 3: 创建严格的浏览器客户端**

`src/services/supabase.ts` 只读取两个环境变量，缺失时抛出包含变量名的启动错误：

```ts
import { createClient } from '@supabase/supabase-js'

/** 读取必需的公开环境变量，缺失时阻止应用带着半套配置启动。 */
function requirePublicEnvironment(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string' || value.length === 0) throw new Error(`缺少环境变量 ${name}`)
  return value
}

export const supabase = createClient(
  requirePublicEnvironment('VITE_SUPABASE_URL'),
  requirePublicEnvironment('VITE_SUPABASE_PUBLISHABLE_KEY'),
)
```

- [ ] **Step 4: 补齐环境类型和示例**

`ImportMetaEnv` 将两个变量声明为只读字符串；`.env.example` 只放占位值，绝不复制真实公钥：

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

- [ ] **Step 5: 验证并提交**

Run:

```powershell
npm run type-check
npm run lint
git diff --check
```

Expected: 全部退出码为 0；暂不要求浏览器访问尚未存在的表。

Commit:

```powershell
git add package.json package-lock.json .env.example src/env.d.ts src/services/supabase.ts supabase/migrations/202608130001_auth_sync.sql
git commit -m "feat: 建立 Supabase 数据与客户端基础"
```

### Task 2: 完成时间与本地持久化接口

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/services/persistence.ts`
- Modify: `src/stores/useToolStore.ts`

**Interfaces:**
- Produces: `Account.completedAt: number | null`。
- Produces: `parsePersistedState(raw: unknown): PersistedState`、`clearGuestPersistedState(): SaveResult`。
- Produces: `toolStore.hydrate(state, warning?)` 和 `toolStore.snapshot()`，供持久化协调 Store 调用。

- [ ] **Step 1: 扩展领域模型及旧数据迁移**

给 `Account` 加 `completedAt`。`createDefaultPersistedState` 不需要额外字段；账号创建时写 `null`。迁移函数为缺少该字段的账号补 `null`，严格校验要求它为 `null` 或合法非负有限时间戳。

- [ ] **Step 2: 修正完成状态转换**

- `completeAccount(id, now)` 成功时写 `completedAt = now`。
- `reopenAccount(id)` 成功时清空 `completedAt`。
- `resetDailyProgress(now)` 清空全部账号的 `completedAt`。
- 非完成状态必须保证 `completedAt === null`；完成状态允许非空完成时间，迁移来的历史完成状态允许 `null`。

- [ ] **Step 3: 提取可复用解析和游客清除接口**

把现有内部迁移与校验组合成：

```ts
/** 迁移并严格解析任意来源的持久化状态，非法数据直接抛错。 */
export function parsePersistedState(value: unknown): PersistedState

/** 清除游客业务主键，不触碰损坏备份、认证 Session 或用户同步缓存。 */
export function clearGuestPersistedState(): SaveResult
```

`loadPersistedState()` 复用 `parsePersistedState(JSON.parse(raw))`，不能维护两套校验。

- [ ] **Step 4: 把领域 Store 改为可 hydrate**

删除 Store 创建时不可控的“加载、立即保存、watch 直接写 localStorage”流程。增加：

```ts
/** 用已经校验的数据替换全部领域状态，并规范实体排序。 */
function hydrate(state: PersistedState, warning: string | null = null): void

/** 返回与响应式对象脱钩的当前完整状态快照。 */
function snapshot(): PersistedState
```

保留领域操作签名；持久化触发改由后续协调 Store 注册。`hydrate` 期间不得触发远端保存。

- [ ] **Step 5: 验证并提交**

Run:

```powershell
npm run type-check
npm run lint
npm run build
```

手工检查游客模式完成、撤销和刷新后 `completedAt` 行为；不得新增测试文件。

Commit:

```powershell
git add src/types/domain.ts src/services/persistence.ts src/stores/useToolStore.ts
git commit -m "feat: 补充师门完成时间与状态装载接口"
```

### Task 3: 云端读写与用户隔离缓存

**Files:**
- Create: `src/services/cloudPersistence.ts`
- Create: `src/services/syncCache.ts`

**Interfaces:**
- Produces: `loadCloudState(userId): Promise<CloudLoadResult>`。
- Produces: `saveCloudState(userId, state): Promise<void>`。
- Produces: `loadSyncCache/saveSyncCache/clearSyncCache`，所有接口都要求显式 `userId`。

- [ ] **Step 1: 定义云端 DTO 和加载结果**

```ts
export type CloudLoadResult =
  | { found: false }
  | { found: true; state: PersistedState; updatedAt: string }
```

`loadCloudState` 使用 `.select('state, updated_at').eq('user_id', userId).maybeSingle()`；数据库错误直接抛出，`state` 必须经 `parsePersistedState` 校验。

- [ ] **Step 2: 实现快照和统计的完整保存**

`saveCloudState` 先 upsert `user_tool_states`，再把 `state.accounts` 映射为当天统计 DTO 并 upsert 到 `sect_mission_daily_stats`。字段映射固定为：

```ts
{
  user_id: userId,
  account_id: account.id,
  stat_date: state.activeDate,
  account_name: account.name,
  accumulated_ms: Math.floor(account.accumulatedMs),
  high_value_count: account.highValueCount,
  completed: account.status === 'completed',
  completed_at: account.completedAt === null ? null : new Date(account.completedAt).toISOString(),
}
```

任一步失败都抛错。账号为空时跳过统计 upsert，但快照仍必须成功保存。

- [ ] **Step 3: 实现隔离缓存**

缓存键格式为 `xyq-tools:sync:${userId}:v1`，结构固定：

```ts
export interface SyncCacheEntry {
  revision: number
  queuedAt: number
  state: PersistedState
}
```

`saveSyncCache(userId, state)` 读取同用户旧修订号并加一，返回新条目；`clearSyncCache(userId, revision)` 只有当前条目修订号等于参数时才删除；解析失败时保留原文并抛错，不能悄悄覆盖。

- [ ] **Step 4: 验证并提交**

Run:

```powershell
npm run type-check
npm run lint
```

Commit:

```powershell
git add src/services/cloudPersistence.ts src/services/syncCache.ts
git commit -m "feat: 实现云端状态与用户同步缓存"
```

### Task 4: OTP 认证 Store

**Files:**
- Create: `src/stores/useAuthStore.ts`

**Interfaces:**
- Produces: `initialize()`、`sendOtp(email)`、`verifyOtp(email, token)`、`signOut()`。
- Produces refs: `initialized`、`session`、`user`、`email`、`busy`、`errorMessage`。

- [ ] **Step 1: 建立认证状态机**

`initialize()` 必须幂等：立即注册 `onAuthStateChange`，通过 `INITIAL_SESSION` 或 `getSession()` 收敛初始 Session，且只在确认完成后设置 `initialized = true`。回调不得执行长时间 Supabase 请求，避免认证锁死。

- [ ] **Step 2: 实现 OTP API**

`sendOtp(email)`：规范化为 `trim().toLowerCase()`，校验非空后调用：

```ts
supabase.auth.signInWithOtp({
  email: normalizedEmail,
  options: { shouldCreateUser: true },
})
```

`verifyOtp(email, token)`：只接受 `/^\d{6}$/`，然后调用 `verifyOtp({ email, token, type: 'email' })`。429 转为“请求过于频繁，请稍后再试”，其他错误转为稳定中文提示，原始异常只用于开发控制台。

- [ ] **Step 3: 实现退出和销毁**

`signOut()` 只调用 Supabase Auth 退出；业务缓存和领域清理由持久化协调 Store 负责。Store 保存 subscription，并提供带中文注释的 `dispose()` 取消监听。

- [ ] **Step 4: 验证并提交**

Run:

```powershell
npm run type-check
npm run lint
```

Commit:

```powershell
git add src/stores/useAuthStore.ts
git commit -m "feat: 接入 Supabase 邮箱验证码认证"
```

### Task 5: 持久化协调、迁移与离线重试

**Files:**
- Create: `src/stores/usePersistenceStore.ts`
- Modify: `src/stores/useToolStore.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: Task 2 的 `hydrate/snapshot`，Task 3 的云端和缓存 API，Task 4 的认证状态。
- Produces refs: `initialized`、`mode: 'guest' | 'cloud'`、`syncStatus: 'initializing' | 'local' | 'syncing' | 'synced' | 'pending' | 'error'`、`syncMessage`。
- Produces: `initialize()`、`queueSave()`、`flush()`、`requestSignOut(force)`、`dispose()`。

- [ ] **Step 1: 实现启动数据源选择**

`initialize()` 顺序固定：

1. 等待 `authStore.initialize()`。
2. 无用户时加载游客状态并 hydrate，进入 `local`。
3. 有用户时读取云端状态和同用户缓存。
4. 云端存在时优先 hydrate 云端；若缓存存在，随后排队重试缓存。
5. 云端不存在时把游客状态写缓存并立即执行首次上传。
6. 首次上传全部成功才调用 `clearGuestPersistedState()`。
7. 初始化完成后才注册领域深度 watch 和浏览器重试事件。

云端读取失败或数据非法时保持初始化错误，绝不写空白云端状态。

- [ ] **Step 2: 实现游客保存和云端排队**

领域变化时：游客同步调用 `savePersistedState`；登录用户调用 `saveSyncCache` 后将状态设为 `pending`，300ms 防抖后 `void flush()`。使用 `isHydrating` 阻止 hydrate 反向触发保存。

- [ ] **Step 3: 实现串行 flush**

使用单一 `flushPromise`，重复调用复用当前 Promise。每轮读取最新缓存、保存云端、按修订号条件清除；若清除后发现又有新缓存则继续下一轮。失败时保留缓存并设为 `error`，不得紧密自旋。

- [ ] **Step 4: 注册有限重试事件**

监听 `online`、`focus` 和 `visibilitychange`；仅在相同登录用户、页面可见且存在缓存时触发 `flush()`。`dispose()` 清理监听器、watch 和防抖计时器。

- [ ] **Step 5: 实现安全退出**

`requestSignOut(false)` 发现缓存时先 `flush()`；仍失败则返回 `{ ok: false, requiresForce: true, message }`。`requestSignOut(true)` 保留用户缓存，调用 Auth 退出，hydrate 新建的空白游客状态并保存到游客主键。

- [ ] **Step 6: 改造应用启动**

`main.ts` 在创建 Pinia 后取得协调 Store，等待 `initialize()` 完成再 `mount('#app')`。初始化失败时仍挂载应用，但必须暴露不可编辑的错误状态和重试入口；不得出现空白页。

- [ ] **Step 7: 验证并提交**

Run:

```powershell
npm run type-check
npm run lint
npm run build
```

Commit:

```powershell
git add src/stores/usePersistenceStore.ts src/stores/useToolStore.ts src/main.ts
git commit -m "feat: 编排游客迁移与离线云同步"
```

### Task 6: 认证弹窗、账户入口与编辑门禁

**Files:**
- Create: `src/components/auth/AuthModal.vue`
- Create: `src/components/auth/AccountControl.vue`
- Modify: `src/layouts/AppLayout.vue`
- Modify: `src/App.vue`
- Modify: `src/views/SectMissionView.vue`

**Interfaces:**
- Consumes: Auth Store 和 Persistence Store 的状态与操作。
- Produces: 桌面、移动端共用的账户入口和两步 OTP 弹窗。

- [ ] **Step 1: 实现两步 OTP 弹窗**

复用 `BaseModal`。第一步邮箱输入，发送成功后进入验证码输入；第二步限制六位数字并提供验证、返回修改邮箱、60 秒后重发。关闭弹窗时清空验证码和错误，不主动退出已登录 Session。所有按钮都有 busy/disabled 和可访问标签。

- [ ] **Step 2: 实现账户与同步状态组件**

游客显示“本地模式”和“邮箱登录”；登录显示邮箱、状态文案与退出。状态文案固定映射：本地模式、正在初始化、正在同步、云端已同步、等待同步、同步失败。移动端允许只显示图标和短状态，但 `aria-label` 必须完整。

- [ ] **Step 3: 实现退出失败确认**

普通退出先调用 `requestSignOut(false)`；若要求强制退出，复用 `useUiStore.confirm()`，说明未同步修改会保留在该账号的本地缓存，确认后调用 `requestSignOut(true)`。

- [ ] **Step 4: 接入布局和全局弹窗**

桌面侧栏底部替换旧存储说明；移动顶部加入账户入口。`App.vue` 挂载单个 `AuthModal`，通过 UI 状态控制，禁止桌面和移动端各自创建一套弹窗。

- [ ] **Step 5: 增加编辑门禁**

持久化尚未初始化或处于致命加载错误时，师门页显示明确状态并禁用新增、编辑、计时、重排、重置等写操作。不要只靠视觉遮罩；实际事件处理也必须拒绝执行。

- [ ] **Step 6: 浏览器验证并提交**

Run:

```powershell
npm run type-check
npm run lint
npm run build
npm run dev
```

在桌面和窄屏验证键盘焦点、弹窗关闭、倒计时、禁用态及状态文案。

Commit:

```powershell
git add src/components/auth/AuthModal.vue src/components/auth/AccountControl.vue src/layouts/AppLayout.vue src/App.vue src/views/SectMissionView.vue
git commit -m "feat: 增加邮箱登录与同步状态界面"
```

### Task 7: 部署说明、真实数据库与端到端验收

**Files:**
- Modify: `README.md`
- Verify: `.github/workflows/deploy-pages.yml`
- Verify: `supabase/migrations/202608130001_auth_sync.sql`

**Interfaces:**
- Produces: 可复现的 Supabase 配置、迁移执行和部署说明。

- [ ] **Step 1: 更新 README**

明确记录：

- 游客本地模式与登录云端模式的区别。
- 邮箱六位 OTP 登录和 60 秒重发规则。
- 首次登录迁移、老用户云端优先、退出后的数据隔离。
- 最后写入者胜出的多设备限制。
- `.env.local` 与 GitHub Repository Variables 配置名。
- Magic Link 模板必须含 `{{ .Token }}`。
- 如何在 Supabase SQL Editor 执行迁移，以及绝不能使用 Secret Key。

- [ ] **Step 2: 在目标 Supabase 项目执行迁移**

在 SQL Editor 执行 `supabase/migrations/202608130001_auth_sync.sql`。执行后在 Table Editor 确认两张表存在且 RLS 为 Enabled；在 Policies 页面确认每张表四种操作均有限制。

- [ ] **Step 3: 执行真实认证和迁移场景**

按顺序验证：游客创建数据 → 请求 OTP → 输入六位码 → 自动上传 → 游客主键清除 → 刷新仍载入云端。再用第二邮箱登录，确认无法读取第一用户数据。

- [ ] **Step 4: 执行离线和多设备场景**

浏览器开发者工具切 Offline，修改账号并确认显示待同步；恢复 Online 后确认两张表更新。另一浏览器登录同用户，修改并保存，确认重新载入时符合最后成功保存覆盖规则。

- [ ] **Step 5: 执行最终质量检查**

Run:

```powershell
npm run type-check
npm run lint
npm run build
git diff --check
git status --short
```

Expected: 三个 npm 命令和 `git diff --check` 全部退出码为 0；状态中只有本任务预期文档改动。

- [ ] **Step 6: 提交文档并检查 Actions**

```powershell
git add README.md
git commit -m "docs: 补充 Supabase 使用与部署说明"
git log --oneline -8
```

推送后检查 GitHub Pages 工作流的类型检查、Lint、生产构建和发布均成功，并在生产站点完成一次 OTP 登录。

## 最终人工验收清单

- [ ] 游客增删改、排序、刷新均正常。
- [ ] 新邮箱 OTP 登录自动创建用户并上传游客数据。
- [ ] 已有云端数据时不会被新设备游客数据覆盖。
- [ ] 云端快照与当天统计同步更新。
- [ ] 完成时间在完成、撤销和跨日时正确变化。
- [ ] 断网修改保留，联网后自动补传。
- [ ] 旧请求不会清除更新修订的缓存。
- [ ] 退出后游客看不到登录用户数据。
- [ ] 不同用户被 RLS 完全隔离。
- [ ] 桌面和移动端认证交互可用。
- [ ] GitHub Pages 构建和生产初始化成功。
