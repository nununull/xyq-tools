# Supabase 邮箱认证、云同步与师门统计设计

## 目标

在保留游客本地模式的前提下，为梦幻西游工具箱接入 Supabase：用户通过邮箱六位验证码登录，登录后的业务数据按用户隔离保存到云端，并为未来的师门统计页面沉淀结构化每日数据。

本次范围只包含认证、云端持久化、离线待同步缓存和统计数据采集，不包含统计展示页面，也不增加“当天任务次数”等新业务字段。

## 已确认约束

- 使用 Supabase Auth 的无密码邮箱 OTP，不提供密码、注册页或找回密码流程。
- OTP 有效期采用项目当前配置的 3600 秒，重发间隔至少 60 秒。
- 未注册邮箱完成首次验证时自动创建用户。
- Supabase Session 使用 SDK 默认的浏览器持久化与自动刷新机制。
- 游客继续使用本地数据库；登录用户以 Supabase 为主。
- 多设备冲突采用最后一次成功保存覆盖前一次，不做字段级合并。
- 不新增单元测试文件，通过类型检查、Lint、生产构建和浏览器人工场景验证。
- 所有新增或修改的方法必须带中文注释。

## 方案选择

### 采用方案：当前快照与每日统计分离

当前完整业务状态保存在每用户一行的 JSON 快照中；师门每日统计另存为结构化记录。

该方案保留现有 `PersistedState` 模型和整份保存语义，能以较小改动实现稳定同步，同时不会因为每日重置而丢失未来统计需要的历史数据。

### 未采用方案

- 全量 JSON：实现最简单，但每日历史会随状态覆盖，无法支持可靠统计。
- 完全关系化拆表：便于查询单个实体，但会显著增加排序、计时、跨日重置和事务复杂度，当前没有足够收益。
- 事件日志同步：离线及冲突能力最强，但需要事件幂等、重放、压缩与版本演进，超出首版需要。

## 总体架构

系统划分为四个清晰边界：

1. Supabase 客户端模块：只负责根据 Vite 环境变量创建客户端。
2. 认证 Store：负责 Session 初始化、发送 OTP、验证 OTP、认证事件和退出。
3. 持久化协调服务：根据访客或登录状态选择本地存储或云同步，并管理迁移、缓存和重试。
4. 领域 Store：继续管理账号、计时、每日重置和店铺，不直接调用 Supabase SDK。

应用启动时必须先确定认证状态和目标数据源，再开放业务编辑。不得先把游客状态挂载到界面，然后异步用云端状态覆盖，以免初始化期间产生错误写入。

## 配置与密钥

前端只读取：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

本地值存放在被 Git 忽略的 `.env.local`。GitHub Pages 构建通过 GitHub Actions Repository Variables 注入同名变量。

Publishable Key 允许出现在浏览器构建产物中，数据安全依赖认证 JWT 与 RLS。Secret Key、Legacy `service_role` Key 和 SMTP 凭据不得进入前端源码、环境变量或构建产物。

## 邮箱 OTP 认证

### 登录流程

1. 用户输入邮箱并请求验证码。
2. 客户端调用 `supabase.auth.signInWithOtp()`，保持默认的自动创建用户行为。
3. 界面进入验证码步骤并启动 60 秒重发倒计时。
4. 用户输入六位验证码，客户端调用 `verifyOtp({ email, token, type: 'email' })`。
5. 验证成功后，认证 Store 接收 Session，持久化协调服务开始选择或迁移数据。

Supabase 的 Magic Link 邮件模板必须使用 `{{ .Token }}` 输出六位验证码，而不是使用 `{{ .ConfirmationURL }}`。

### Session 生命周期

- 应用启动后监听 `onAuthStateChange`，处理初始 Session、登录、刷新和退出。
- SDK 持久化有效 Session；页面刷新不重新发送 OTP。
- 主动退出或 Session 失效后，用户才需再次请求验证码。
- 初始化未完成期间显示明确的加载状态，并禁止业务编辑。

### 账户界面

- 桌面侧栏底部显示账户区。
- 游客显示“本地模式”和邮箱登录入口。
- 登录后显示用户邮箱、同步状态和退出入口。
- 移动端顶部提供紧凑账户入口，复用同一个认证弹窗。
- 同步状态至少区分：正在初始化、已同步、等待同步、同步失败、本地模式。

## 数据模型

### 当前状态表 `user_tool_states`

每个用户最多一行：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | `uuid` | 主键，引用 `auth.users(id)`，级联删除 | 数据所有者 |
| `state` | `jsonb` | 非空 | 当前版本完整 `PersistedState` |
| `updated_at` | `timestamptz` | 非空，数据库默认当前时间 | 最后成功保存时间 |

写入使用 upsert，并由数据库更新 `updated_at`。客户端仍需对 `state` 执行版本和结构校验，非法云端数据不得进入领域 Store。

### 每日统计表 `sect_mission_daily_stats`

每个用户、账号和本地日期最多一行：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | `uuid` | 引用 `auth.users(id)`，级联删除 | 数据所有者 |
| `account_id` | `uuid` | 非空 | 领域账号 ID |
| `stat_date` | `date` | 非空 | 用户设备本地自然日 |
| `account_name` | `text` | 非空 | 当日保存时的名称快照 |
| `accumulated_ms` | `bigint` | 非负 | 当日有效耗时 |
| `high_value_count` | `integer` | 非负 | 当日高价值次数 |
| `completed` | `boolean` | 非空 | 当日是否处于完成状态 |
| `completed_at` | `timestamptz` | 可空 | 当日完成时间 |
| `updated_at` | `timestamptz` | 非空，数据库默认当前时间 | 最后成功保存时间 |

主键为 `(user_id, account_id, stat_date)`。账号改名只影响以后保存的当日记录；跨日后历史名称不会被后续改名篡改。删除账号不会删除历史统计。

### 领域模型补充

`Account` 新增 `completedAt: number | null`：

- 完成账号时写入操作时间。
- 撤销完成时清空。
- 跨日重置时清空。
- 旧版本地数据迁移时补为 `null`，不得推测旧记录的完成时间。

## RLS 设计

两张表均启用 RLS，并分别为 `SELECT`、`INSERT`、`UPDATE`、`DELETE` 建立策略：

- 可见行必须满足 `auth.uid() = user_id`。
- 插入和更新后的行必须满足 `auth.uid() = user_id`。
- 客户端不能替其他用户写入或读取数据。

数据库迁移脚本负责创建表、约束、索引、更新时间触发器和完整策略。不得用宽松的 `true` Policy，也不得依赖客户端传入的邮箱作为所有权依据。

## 数据源与首次登录迁移

### 游客模式

- 使用现有游客 `localStorage` 主键保存完整状态。
- 游客不写 Supabase，也不生成云端统计。
- 读取失败或结构损坏时沿用现有备份与保护逻辑。

### 登录用户已有云端快照

1. 读取该用户的云端快照。
2. 严格校验版本和结构。
3. 云端合法时载入领域 Store。
4. 清除游客业务数据，不把游客数据覆盖到云端。
5. 用户专属待同步缓存若比云端更新，则进入重试和最后写入者胜出的恢复流程；不得向游客界面暴露缓存内容。

### 登录用户没有云端快照

1. 读取并校验当前游客数据。
2. 将游客完整状态 upsert 到 `user_tool_states`。
3. 将当日每个账号的统计 upsert 到统计表。
4. 两部分均成功后，清除游客业务数据。
5. 任一部分失败时保留游客数据和用户专属待同步缓存，不宣称迁移成功。

该规则实现“首次登录自动上传”，同时防止老用户在新设备上的游客数据覆盖已有云端数据。

## 保存与离线同步

### 保存顺序

登录用户每次领域状态变化后：

1. 立即把完整状态写入包含 `user_id` 的本地待同步缓存。
2. 对短时间连续修改进行防抖。
3. 串行 upsert 当前状态快照。
4. 串行 upsert 当天所有账号的统计行。
5. 两部分均成功后，只有当缓存版本仍与本次提交一致时才清除待同步标记。

同步过程中如果又产生新状态，旧请求完成后必须继续提交最新版，不能让旧请求清掉更新缓存。

### 待同步缓存

- 缓存键必须包含 Supabase 用户 ID。
- 缓存保存完整 `PersistedState`、单调递增的本地修订号以及待同步时间。
- 退出后缓存可以保留供下次登录重试，但绝不加载到游客领域状态。
- 不同用户之间不得读取、覆盖或复用缓存。

### 自动重试

以下时机尝试同步最新版缓存：

- 网络从离线恢复为在线。
- 页面重新获得焦点或从后台恢复。
- 应用重新打开并恢复相同用户 Session。
- 新业务修改触发下一轮保存。

重试应有防抖或有限退避，避免持续失败时形成紧密请求循环。

## 多设备冲突

首版采用最后一次成功保存覆盖：

- `user_tool_states` 整份快照以数据库最后成功 upsert 为准。
- `sect_mission_daily_stats` 以唯一键逐行 upsert，最后成功写入覆盖对应账号当天记录。
- 不做字段级合并、实时订阅或冲突对话框。

该语义必须在界面和文档中说明，避免用户误以为多设备可以同时无损编辑。

## 退出流程

1. 如果没有待同步数据，直接调用 Supabase 退出并切换为空白游客状态。
2. 如果存在待同步数据，先执行一次立即同步。
3. 同步仍失败时明确提示风险，由用户选择继续停留或强制退出。
4. 强制退出保留该用户隔离缓存，但游客界面从新的空白本地状态开始。

云端数据和用户缓存不得复制到游客主键中。

## 错误处理

- OTP 发送和验证失败显示可理解的错误，不暴露原始内部对象或敏感信息。
- 429 限流提示用户等待，不自动高频重发。
- 云端读取失败时不擅自把空白状态写回数据库。
- 云端数据非法或版本不兼容时停止载入和写入，保留本地缓存并显示明确异常。
- 云端写入部分失败时整体保持“待同步”，不得提前清除缓存。
- 免费项目暂停、断网和短暂服务故障均降级为用户专属待同步状态，而不是游客模式。

## 日期与统计语义

- `stat_date` 沿用当前设备本地自然日，与现有每日重置规则一致。
- 每次保存当前状态时同步 upsert 当天统计，而不是等待跨日结算。
- 当天撤销完成、继续计时或增加高价值次数时，统计行随最新状态更新。
- 跨日后旧日期行不再由当前状态保存修改，从而成为历史记录。
- 当前统计不记录任务次数。

## 验收方案

不新增单元测试文件，完成实现后执行：

```powershell
npm run type-check
npm run lint
npm run build
```

并在真实浏览器及 Supabase 项目中验证：

1. 游客新增、编辑、排序和刷新后数据仍存在。
2. 新邮箱请求六位 OTP、验证并自动创建用户。
3. 有游客数据的新用户首次登录后自动上传；快照和当日统计均成功后游客副本被清除。
4. 老用户在新设备存在游客数据时登录，云端数据胜出且不被覆盖。
5. 断网后仍可修改；恢复网络或重新聚焦后自动同步。
6. 同步失败时状态提示正确，缓存不会被提前清除。
7. 退出后看不到云端数据和该用户待同步缓存，游客从空白状态开始。
8. 同一用户在另一设备登录后能载入最新云端快照。
9. 改名或删除账号后，过去日期的名称快照和统计仍保留。
10. 完成、撤销完成和跨日重置时 `completedAt` 正确变化。
11. 用另一个认证用户尝试访问前一用户两张表的数据时，被 RLS 拒绝。
12. GitHub Pages 构建能读取 Repository Variables，生产站点能初始化 Supabase 客户端。

## 官方依据

- Supabase Passwordless Email Login：<https://supabase.com/docs/guides/auth/auth-email-passwordless?language=js&queryGroups=language>
- Supabase JavaScript `signInWithOtp`：<https://supabase.com/docs/reference/javascript/auth-signinwithotp>
- Supabase JavaScript `verifyOtp`：<https://supabase.com/docs/reference/javascript/auth-verifyotp>
- Supabase Auth 状态监听：<https://supabase.com/docs/reference/javascript/auth-onauthstatechange>
- Supabase Auth 客户端 Session 行为：<https://supabase.com/docs/reference/javascript/auth>
- Supabase Email Templates：<https://supabase.com/docs/guides/auth/auth-email-templates>
- Supabase Auth Rate Limits：<https://supabase.com/docs/guides/auth/rate-limits>
- Supabase Custom SMTP：<https://supabase.com/docs/guides/auth/auth-smtp>
