# 梦幻西游工具箱

一个只在浏览器中运行的静态工具站。当前首个工具是「师门助手」，用于多账号并行计时、高价值任务五分钟提醒，以及商会店铺分类检索。

## 运行环境

- Node.js `^22.18.0` 或 `>=24.11.0`
- npm

## 本地开发

```powershell
npm install
npm run dev
```

复制 `.env.example` 为不会提交的 `.env.local`，只填写浏览器公开配置：

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

严禁把 Secret、`service_role` Key 或 SMTP 凭据放进前端、仓库或构建变量。

开发服务器启动后，按终端显示的地址打开页面。质量检查与生产构建命令：

```powershell
npm run type-check
npm run lint
npm run build
```

构建产物位于 `dist/`。

## 静态部署

将 `npm run build` 生成的 `dist/` 完整上传到任意静态托管服务即可。项目使用 Hash 路由，师门页地址形如 `/#/sect-mission`，直接刷新不会要求服务器配置业务路由回退。

仓库已经配置 GitHub Pages 自动部署。推送到 `main` 后，GitHub Actions 会执行类型检查、Lint 和生产构建，再发布 `dist/`：

- 站点地址：<https://nununull.github.io/xyq-tools/>
- 发布记录：<https://github.com/nununull/xyq-tools/actions/workflows/deploy-pages.yml>

首次发布前，需要在仓库 `Settings → Pages → Build and deployment` 中把 `Source` 设为 `GitHub Actions`；以后推送 `main` 会自动重新发布。

本地构建默认以站点根目录 `/` 为部署位置；GitHub Actions 构建时自动使用 `/xyq-tools/` 子路径，避免静态资源在项目站点中出现 404。

## 师门助手怎么用

1. 在「今日账号」新增账号；账号可同时计时，页面不会替你自动切换或启动账号。
2. 推荐账号会排除已完成和高价值等待中的账号，再优先选择有效耗时最少者；耗时相同时按手动排序决定。
3. 账号计时中点击「高价值」，有效计时会暂停，并开始该账号独立的五分钟等待。
4. 等待结束后，账号进入「可以切回」。手动点击「继续」才会恢复有效计时。
5. 商会区域把三药、家具、召唤兽和烹饪放在同一页；搜索覆盖编号、名称、商品和备注。拖动把手可在当前分类内排序，跨分类请编辑店铺资料。

## 登录、云同步与本地模式

未登录时是游客本地模式，业务数据只保存在当前浏览器。账户入口支持邮箱六位验证码登录；验证码有效期按 Supabase 项目配置为 3600 秒，重新发送至少等待 60 秒。首次验证邮箱会自动创建用户。

新用户首次登录且云端没有快照时，会上传当前游客数据和当天师门统计，全部成功后才清除游客副本。已有云端快照的用户登录新设备时始终以云端为准，不会被该设备的游客数据覆盖。断网或服务故障时，修改进入按用户 ID 隔离的待同步缓存，联网、重新聚焦或再次打开时自动补传；退出后游客绝不会看到登录用户的云端数据或缓存。

多设备采用“最后一次成功保存覆盖”规则，不支持同时编辑后的字段级合并。

## Supabase 数据库与部署配置

在目标项目的 SQL Editor 完整执行 `supabase/migrations/202608130001_auth_sync.sql`，然后确认 `user_tool_states`、`sect_mission_daily_stats` 两张表均启用 RLS，且每张表都有受 `auth.uid() = user_id` 限制的 SELECT、INSERT、UPDATE、DELETE 策略。

在 Authentication 邮件模板中把 Magic Link 内容改为包含 `{{ .Token }}` 的六位验证码，不能使用 `{{ .ConfirmationURL }}` 代替。生产部署在 GitHub 仓库 Repository Variables 配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`；工作流只把这两个公开值注入构建。

## 本地数据与每日重置

游客的账号资料、账号排序、当日状态和商会店铺保存在当前浏览器的 `localStorage` 中；登录用户则以 Supabase 云端快照为主。

页面按设备的本地自然日判断日期。进入新的一天后，账号的有效耗时、等待状态和完成状态会自动重置，账号资料、排序和商会店铺会保留。页面右上角的「重置今日进度」可以手动执行同样的当日重置，操作前会再次确认。

## 到期提醒与通知权限

五分钟等待到期后，页面会显示「可以切回」，并尝试更新页面标题和播放短提示音。声音可能受浏览器自动播放策略、系统静音或后台节流影响。

系统通知是可选增强能力，只有点击「启用系统通知」后才会向浏览器请求权限。拒绝或不支持通知时，账号状态、页面提醒和标题提醒仍可使用。浏览器通知权限需要在浏览器或系统设置中修改，本工具不会绕过权限，也不会在页面加载时主动索取。
