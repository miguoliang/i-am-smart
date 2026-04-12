# 更新日志

所有重要的项目变更都会记录在此文件中。

---

## [1.12.8] - 2026-04-12

### 运营

- **仪表盘**：KPI 按决策视角分块（获客与盘子、今天有人用吗、钱与付费、用户留不留得住）；30 天趋势分为使用侧（注册 / DAU / 复习）与收入
- **仪表盘**：页顶说明本页（今日与近 30 天）与侧栏「SaaS 指标」（周期与订阅健康）的职责；各块含一句副文案，加载骨架与分区标题一致

### 发布

- 版本号 **v1.12.8**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.8`**

---

## [1.12.7] - 2026-04-12

### 运营

- **仪表盘**：加载骨架与真实布局对齐——8 个指标卡使用与 `OperatorStatBlock` 相同的卡片结构；下方补充 4 个趋势图卡片的占位（标题、合计、柱图区、日期轴）

### 发布

- 版本号 **v1.12.7**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.7`**

---

## [1.12.6] - 2026-04-12

### 运营

- **仪表盘**：上方 8 个指标卡标题悬停显示指标说明（原底部「指标定义」折叠区已移除）
- **仪表盘**：注册 / DAU / 复习 / 收入 趋势图柱条悬停显示日期与数值（收入按元展示）

### 发布

- 版本号 **v1.12.6**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.6`**

---

## [1.12.5] - 2026-04-12

### 运营

- **SaaS 指标**：移除页面右上角「返回仪表盘」链接（侧栏仍可进入仪表盘）

### 开发

- 新增 Cursor 技能：`release-new-version`（发版流程）、`pwa-supabase-db-push-linked`（在 `apps/pwa` 执行 `supabase db push --linked`）

### 发布

- 版本号 **v1.12.5**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.5`**

---

## [1.12.4] - 2026-04-12

### 数据库与学习

- **`get_due_cards_by_profile`**：到期卡片队列由 `ORDER BY random()` 改为 **弱词优先**——按 `ease_factor` 升序（越低越先）、再 `next_review_date`、`interval_days`、`id`，便于把每日复习额度用在掌握较弱的词上

### 发布

- 版本号 **v1.12.4**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.4`**
- 部署后请在目标环境执行 Supabase migration：`20260412100000_get_due_cards_weak_first.sql`

---

## [1.12.3] - 2026-04-12

### 运营 UI

- 各运营页去掉占位的 **页面标题区**；删除未再使用的 `OperatorPageHeader` 组件
- **`OperatorMain`**：主区内边距略收紧
- **`DataTable`**：加载时用表头 + **Skeleton** 行；支持 **`toolbarLeft`**，与「刷新」「列设置」同一行排布；账户 / 反馈 / 订单 / 词库等页的搜索、筛选、导出与表格控件合并为一行
- **SaaS 指标**：顶部改为简洁的「返回仪表盘」链接

### 发布

- 版本号 **v1.12.3**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.3`**

---

## [1.12.2] - 2026-04-12

### 运营

- **账户管理**：列表不再展示「角色」；「邮箱」默认隐藏（可在列设置中打开，长邮箱省略显示）
- **账户管理**：新增 **套餐**（`accounts.plan`：Pro / 免费）、**学习词库**（默认学习档案的 `exam_target`，与设置里合并词库名一致）
- 用户列表接口合并 `accounts` 与默认 `learner_profiles` 数据；CSV 导出同步

### 发布

- 版本号 **v1.12.2**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.2`**

---

## [1.12.1] - 2026-04-12

### 运营

- **用户详情弹窗**：加载过程使用 **Skeleton** 占位（资料区、学习统计、最近订单），替代纯文案「加载中…」；新增 `components/ui/skeleton`（shadcn）

### API 与安全

- **`handleApiError`**：未知/非 `ApiError` 异常对客户端统一返回安全文案（`PUBLIC_INTERNAL_ERROR_MESSAGE`），详细原因写入服务端日志
- **多类路由**：知识条目、错误报告、运营（封禁、反馈、订单、推送广播）、小程序登录等处的内部错误处理与上述策略对齐，避免将数据库或底层错误原文返回给客户端

### 发布

- 版本号 **v1.12.1**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa`、仓库根 `package.json` 一致）；Git tag **`v1.12.1`**

---

## [1.12.0] - 2026-03-28

### 数据库

- **`knowledge`**：唯一约束改为 `(name, level, pos)`，支持同形异级、同级异义
- **`knowledge`**：新增 `example_sentence`、`image_name`；移除 `metadata` 列；删除 `knowledge_sync_from_metadata` 触发器与 `idx_knowledge_metadata` 索引

### 数据与工具

- **CEFR 词汇**：自 `cefr-a1`…`cefr-c2` JSON 生成分片 SQL seed（`08-cefr-vocab-part-*.sql`），脚本 `scripts/generate-cefr-knowledge-seeds.mjs`

### 应用

- API、仓储与类型：`Knowledge` 使用 `exampleSentence` / `imageName`；`packages/shared` 卡片类型同步

### 发布

- 版本号 **v1.12.0**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）；Git tag **`v1.12.0`**

---

## [1.11.6] - 2026-03-22

### 学习

- **桌面快捷键**：在对应按钮上显示 `(S)`、`(A)`、`(D)` 等提示；不再单独展示 W 说明
- **下一个**：仅保留 **D** 作为快捷键（已移除 N 与回车）

### 运营

- **词条导入**：新增运营端导入流程（JSON 解析、预览、分页与相关 API 封装）

### 发布

- 版本号 **v1.11.6**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.11.5] - 2026-03-21

### 账户与学习

- **退出登录锁定**：学习页（刷词 / 今日完成）退出时全屏遮罩，避免误触复习、NPS、邀请卡片或重复打开设置；设置面板在退出过程中禁用档案与考试目标切换，并显示「正在退出…」
- **统计页**：退出登录时同样展示全屏锁定并禁用退出按钮直至跳转

### 发布

- 版本号 **v1.11.5**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.11.4] - 2026-03-21

### 学习

- **今日完成 NPS**：请求 `/api/nps` 期间展示与问卷布局一致的 **skeleton**，不再先出现邀请卡片再切换；30 天内已 dismiss 的用户仍直接进入邀请卡片

### 发布

- 版本号 **v1.11.4**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.11.3] - 2026-03-28

### 部署

- **deploy.yml**：deploy job 绑定 **`environment: production`**（须在 Settings → Environments 创建同名环境）；`docs/deploy.md` 同步说明 Environment 与仓库级 Secret/Variable 的关系

### 发布

- 版本号 **v1.11.3**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.11.2] - 2026-03-27

### 部署

- **deploy.yml**：`DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_PATH` 支持 **Variable 或 Secret**（`secrets || vars`）；SSH 与 scp 使用统一 job `env`；新增部署前校验，避免 `DEPLOY_PATH` 等为空仍上传
- **文档**：`docs/deploy.md` 说明仓库级 Secret/Variable 与 Environment 的区别及 `DEPLOY_PATH` 建议

### 发布

- 版本号 **v1.11.2**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.11.1] - 2026-03-26

### 部署

- **Deploy workflow**：`build:miniprogram-config` 在 `NEXT_PUBLIC_APP_ORIGIN` 或 `WECHAT_MINIPROGRAM_APP_ID` 为空时自动 `ALLOW_MISSING_CONFIG`，避免仅配 Environment 或未配小程序变量时整段部署失败；`WECHAT_MINIPROGRAM_APP_ID` 增加 `vars` 回退；`docs/deploy.md` 补充说明

### 发布

- 版本号 **v1.11.1**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.11.0] - 2026-03-25

### 部署与应用

- **预发 / 正式按域名运行时区分**：`preview.iamsmart.top` 为预发行为，`www.iamsmart.top` 为正式；同一构建与 PM2 进程（`be-it-forever`）；导航 Preview 角标与登录页逻辑按 Host 判定；`/api/auth/send-otp` 仅正式域名限制
- **Deploy workflow 仅 tag 触发**：仅推送 **`v*`** tag 时执行构建与部署；`main` 推送、PR、手动 Run workflow 均不再触发；已移除原 PR 自动 squash 合并 job
- **文档**：`docs/deploy.md` 与 workflow 注释同步（含反向代理如 Candy 的 Host / `X-Forwarded-Host` 说明）

### 发布

- 版本号 **v1.11.0**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.10.1] - 2026-03-24

### 学习

- **退出登录**：从学习页设置退出时不再短暂闪现访客试学词卡（先发起回首页导航并标记进行中，未登录仍停留在 `/learn` 时显示加载态）

### 发布

- 版本号 **v1.10.1**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.10.0] - 2026-03-23

### 学习

- **今日完成空状态设置**：与学习中顶栏共用 `LearnSettingsSheetContent` — 可切换学习档案、**选择考试目标（词库）**、查看词库进度、跳转 Pro；底部表与 Sheet 样式与 `TopBar` 一致

### 发布

- 版本号 **v1.10.0**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.9.1] - 2026-03-22

### 学习

- **今日完成空状态**：设置入口与学习中顶栏一致（`learnTopChromeButtonClassName`、固定位置与「设置」文案）
- **今日完成空状态**：不再展示「已掌握 x 词」

### 发布

- 版本号 **v1.9.1**

---

## [1.9.0] - 2026-03-21

### 营销与品牌

- **首页功能卡**：Lucide 线性图标替代 emoji；标题与图标同一行；说明文案加长；卡片表面使用 `muted` / `border` 主题色（暗色下避免冷灰 `gray-800` 发蓝）
- **定价区**：免费版 CTA「立即免费开始」改为 `Button` **secondary**，去掉自定义蓝色样式

### 登录

- **登录页**：整页与表单区使用 `background` / `card` / `destructive` 等设计 token；Suspense 占位一致

### 试学（访客学习）

- **顶栏**：与已登录页「设置」按钮共用 `learnTopChromeStyles`；不展示试学进度；注册提示打开时禁用 A/S/D/W 等快捷键
- **完成页与弹窗**：卡片化与主题色对齐

### 运维与文档

- **部署约定**：`docs/deploy.md` 与 `deploy.yml` 注释明确 — **生产仅 `v*` tag**，**`main` / 手动 workflow 仅预发**；PM2 名与端口说明

### 发布

- 版本号 **v1.9.0**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.8.0] - 2026-03-20

### 运营后台

- **登录与路由**：`/operator/login` 不再被误重定向到 `/signin`（代理白名单）
- **界面**：运营侧布局与组件对齐 shadcn 风格；表格与分页使用主题 token（`border-border`、`bg-card` 等）
- **词库管理**：词库列表与纠错合并为一张表，支持待纠错筛选与按词条批量处理；移除「导入词库」与单条删除词条；修复更新词条时误用表名的问题（`knowledge`）

### 学习

- **复习流程**：两步复习、ASDW 快捷键、卡片文案布局优化
- **纠错**：学习侧可提交知识纠错（与运营端联动）
- **设置**：按考试词库展示学习进度；移除「已掌握」统计口径相关展示

### 数据与工具

- **词库**：CEFR C1/C2 词汇与中文释义种子；考试词库相关脚本与数据扩展

### 发布

- 版本号 **v1.8.0**（`NEXT_PUBLIC_APP_VERSION` 与 `apps/pwa` 包版本一致）

---

## [1.7.2] - 2026-03-15

### 发布

- 版本号更新至 **v1.7.2**（`NEXT_PUBLIC_APP_VERSION` 与包版本一致）。

---

## [1.5.0] - 2026-03-14

### 营销与支付

- **营销单页**：定价区块并入首页（`#pricing`），`/pricing` 重定向至 `/#pricing`，不再维护独立定价页
- **支付页**：与定价区块视觉与布局统一（Card、标题层级、信任文案）

### 学习页

- **背景**：按当前词库/考试显示纹理文字（KET、PET、四级等），sin/cos 公式生成旋转与缩放；不同级别独立配色
- **下载**：PWA「下载」入口移至营销导航右上角，学习页 TopBar 不再展示

### 开发体验

- **环境变量**：`next.config` 从 monorepo 根目录加载 `.env.local`（配合 `dotenv`），本地调试与根目录 `.env.local` 一致；新增 `docs/env-local.md`

### 文档

- 新增 `docs/product-design-philosophy.md`（产品底层原则与红线）
- 清理旧文档（PRD、product-improvement-notes、monorepo 迁移 PDF 等）

---

## [1.4.0] - 2026-02-27

### 新功能 (Features)

- 考试目标系统：用具体考试名称（KET/PET/FCE 等）替代 CEFR 等级
- 完成度指标：设置面板显示已掌握 / 总词数，点击问号可查看计算规则
- 营销首页改版，提升注册转化率
- 注册引导文案优化（损失厌恶 + 行动导向 CTA）

### 改进 (Improvements)

- 设置面板改为底部弹出 Sheet，移动端体验更好
- 档案操作（创建/编辑/删除）改为 inline 交互，不再使用原生 prompt/confirm 对话框
- iOS Safari 禁止自动缩放（viewport maximum-scale）
- iOS 键盘弹出时 Sheet 自动适配可视区域高度
- 创建新档案时自动分配词卡
- 切换档案或考试目标时重置本地卡片状态

### 修复 (Fixes)

- 修复切换档案时出现横向滚动条的问题
- 修复迁移文件版本号冲突

### CI/CD

- PR 通过 CI 后自动 squash merge
- 修复 auto-merge 使用 GITHUB_TOKEN 导致不触发后续 deploy 的问题（改用 PAT）

---

## [1.3.0] - 2026-02-22

### 学习体验大幅简化

去掉卡片翻转动画，简化为直接显示答案的流程。减少交互摩擦，让背单词更快更顺畅。

### 新功能 (Features)

- 去掉翻转动画，改为单面卡片 + "显示答案"按钮直接展示答案
- "显示答案"按钮放在卡片下方，点击后原地替换为评分按钮
- 发音按钮简化为单个 🔊，默认美音，口音偏好存 localStorage
- 🔊 按钮移到操作区，和显示答案/评分按钮并排，手机上更好点击

### 改进 (Improvements)

- 卡片去掉固定最小高度，手机端更紧凑
- 去掉答案显示动画，点击后立即出现
- 修复 /learn 页面 useSearchParams 缺少 Suspense boundary 导致构建失败的问题

### 其他

- NPS 评分 + 邀请推荐系统
- SaaS 指标仪表盘（MRR、NRR、LTV）
- 移除每日复习次数限制
- 产品信息统一为"聪明的背单词工具"

---

## [1.0.8] - 2026-02-17

### #Apple 登录与微信小程序

集成 Apple Sign-In 登录功能，新增微信小程序支持，并修复多个 Bug，提升稳定性。

### 新功能 (Features) ↓↑

- 集成 Apple Sign-In 登录（popup 模式），后改为 Supabase OAuth 重定向流程
- 在移动端/平板隐藏微信登录，仅显示 Apple 登录
- 新增微信小程序支持（登录、学习卡片、统计等完整功能）
- 小程序新增反馈页面，替代设置页面加入 tabBar
- 改进小程序登录集成，添加 TypeScript watcher
- 启用小程序懒加载代码（lazy code loading）

### 改进 (Improvements) ↓↑

- 改进 Pro 和 Coming Soon 徽章在小程序设置页面的样式
- 添加微信小程序 ICP 备案准备指南文档
- 添加微信小程序功能介绍文档
- 添加微信小程序发布指南文档
- 为部署配置添加 NEXT_PUBLIC_APPLE_CLIENT_ID 环境变量
- 记录 Apple Sign-In 多域名重定向 URL 要求

### 变更 (Changes) ↓↑

- 使用 Apple JS SDK 实现原生 Sign in with Apple
- 从小程序设置中移除登出功能
- 从首页顶栏移除等级选择器
- 更新 .gitignore 忽略 shared 目录的编译文件

### Bug 修复 (Bug Fixes) ↓↑

- 修复 Apple Sign-In 重定向 URI 配置问题（改用 Supabase 回调 URL）
- 修复小程序 API 客户端兼容两种响应格式
- 修复统计 API 响应使用 apiSuccess 包装
- 修复统计页面添加防御性检查和错误处理
- 修复小程序缺少页面 json 配置和移除 lazyCodeLoading 的问题
- 修复小程序设置中每日限额和等级变更的事件处理
- 修复小程序设置页面未加入 app.json 的问题
- 修复小程序 FEEDBACK 端点缺失的问题
- 修复复习页面隐藏分享菜单按钮
- 修复 API 调用仅在成功登录后才发起
- 修复 TypeScript onLoad options 参数类型
- 修复小程序中重复 API 请求的问题
- 添加小程序登录 verifyOtp 失败的详细日志
- 修复 shared 目录复制到小程序的模块解析问题
- 修复小程序 Bug：工厂函数、配置生成、loadCard 和每日限额选择器

---

## [1.0.13] - 2026-02-19

### #支付宝支付集成

集成支付宝 PC 网站支付和手机网站支付功能，支持完整的支付流程和订单管理。

### 新功能 (Features) ↓↑

- 集成支付宝 PC 网站支付（alipay.trade.page.pay）
- 集成支付宝手机网站支付（alipay.trade.wap.pay）
- 添加支付宝异步通知处理接口（/api/pay/alipay/notify）
- 支持支付宝订单状态查询和更新
- 添加支付宝支付相关的数据库字段（alipay_trade_no, pay_channel）
- 支持通过环境变量配置支付宝网关（支持沙箱/正式环境切换）

### 改进 (Improvements) ↓↑

- 改进支付网关配置，支持根据环境自动选择沙箱/正式网关
- 添加支付宝支付环境变量配置说明
- 优化支付订单表结构，支持多支付渠道

### 变更 (Changes) ↓↑

- 数据库迁移：添加 alipay_trade_no 和 pay_channel 字段
- 更新环境变量示例文件，添加支付宝配置说明

### Bug 修复 (Bug Fixes) ↓↑

- 修复支付宝支付代码中的未使用导入警告
- 修复安全加固相关的 API 路由问题
- 修复 Supabase 客户端重复创建问题
- 修复 NEXT_PUBLIC_APP_ENV 缓存键问题，防止预览徽章在生产环境显示

---

## [未发布]

### 改进 (Improvements) ↓↑

### 变更 (Changes) ↓↑

### Bug 修复 (Bug Fixes) ↓↑

---

## [1.0.4] - 2026-02-14

### #微信登录修复

修复微信扫码登录后回调失败的问题，确保微信登录流程正常完成。

### Bug 修复 (Bug Fixes) ↓↑

- 修复微信登录 state cookie 未正确设置的问题：将 cookies().set() 改为直接在 NextResponse 对象上设置 cookie，避免 Set-Cookie header 丢失
- 修复 WECHAT_OPEN_APP_ID 环境变量找不到的问题：添加对 NEXT_PUBLIC_WECHAT_OPEN_APP_ID 的 fallback 支持
- 修复 Magic Link 与 PKCE 流程不兼容的问题：改用服务端 verifyOtp() 验证邮箱 OTP 并直接写入 session cookies，避免客户端缺少 PKCE code verifier
- 改进错误日志，添加结构化上下文信息
- 回调路由改用 request.cookies 读取 cookie，替代 cookies() API

---

## [1.0.3] - 2026-02-14

### #微信登录与Bug修复

集成微信登录功能，修复多个界面Bug，提升用户体验。

### 改进 (Improvements) ↓↑

- 集成微信登录功能，使用 iamsmart.top 域名配置回调
- 为微信登录按钮添加 tooltip 和 aria-label，当未同意条款时禁用按钮并提示
- 部署配置中添加微信登录相关环境变量

### 变更 (Changes) ↓↑

- ESLint 配置忽略 `scripts/svg-to-png.mjs` 文件

### Bug 修复 (Bug Fixes) ↓↑

- 修复服务条款和隐私政策页面的导航栏重复显示bug
- 修复微信回调 redirect_uri 使用 NEXT_PUBLIC_APP_ORIGIN 的问题

---

## [2025-01-16]

### #主页样式优化

优化了主页的视觉样式和深色模式配色，提升用户体验。

- 移除了 `bg-linear-to-b` 和 `bg-linear-to-br` 渐变类
- 统一了 CTA 部分的深色模式配色，使其与页面背景保持一致
- 改进了文本颜色对比度，提升可读性

### 改进 (Improvements) ↓↑

- 统一了深色模式下的背景配色方案
- 优化了 CTA 部分的文本颜色对比度

### 变更 (Changes) ↓↑

- 移除了主容器和 CTA 部分的线性渐变背景类

---

## [2025-01-15]

### #主页视觉更新

更新了主页的图片资源，使用本地图片替代占位符。

- 替换了 Section 1 和 Section 2 的占位图片为本地 WebP 图片
- 优化了 CTA 部分的宽度，使其完全填充容器
- 更新了图片的 alt 文本，提升可访问性

### 改进 (Improvements) ↓↑

- 使用优化的 WebP 格式图片，提升加载性能
- 改进了图片的语义化描述

### 变更 (Changes) ↓↑

- CTA 部分改为全宽布局

---

## [2025-01-14]

### #主页重新设计

重新设计了主页，采用情感化叙事和视觉化展示。

- 实现了情感化的三段式叙事结构（戳痛区、向往区、行动区）
- 添加了图片占位符，为后续内容做准备
- 优化了响应式布局和移动端体验

### 改进 (Improvements) ↓↑

- 改进了主页的内容结构和视觉层次
- 优化了移动端的显示效果

---

## [2025-01-13]

### #代码质量改进

修复了代码审查中发现的问题和代码规范问题。

- 修复了低优先级的代码审查问题
- 解决了代码规范警告
- 改进了代码的可维护性

### Bug 修复 (Bug Fixes) ↓↑

- 修复了代码审查中发现的问题
- 解决了 linting 警告

---

## [2025-01-12]

### #学习界面优化

优化了学习界面的显示效果和用户体验。

- 在主页的 iPad 和 iPhone 框架中添加了 MockLearnScreen
- 居中对齐了进度指示器
- 改进了学习界面的视觉呈现

### 改进 (Improvements) ↓↑

- 优化了学习界面的布局和视觉呈现
- 改进了进度指示器的对齐方式

---

## 下一步 →

更早的更新记录请查看 [Git 提交历史](https://github.com/miguoliang/be-it-forever/commits/main)。
