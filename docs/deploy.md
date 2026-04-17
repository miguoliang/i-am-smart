# 通过 GitHub Actions 部署到服务器

**同一套构建产物**部署到服务器；**预发 / 正式由访问域名在运行时决定**（见 `apps/pwa/src/lib/runtimeDeployment.ts`），不再依赖构建期 `NEXT_PUBLIC_APP_ENV`。

## 发布策略（约定）

| 请求的 Host | 行为 |
|-------------|------|
| **`preview.iamsmart.top`** | 预发：导航显示 Preview 角标；登录页不展示桌面端微信扫码等（与原先 preview 一致） |
| **`www.iamsmart.top`** | 正式：无 Preview 角标；`/api/auth/send-otp` 等对「仅正式」的限制按生产处理 |
| 其他（如 `localhost`） | 开发/其它环境：不按上述两域名套用 |

| 触发方式 | 部署 |
|----------|------|
| 仅推送符合 **`v*`** 的 **tag**（如 `v1.10.0`） | 构建、测试、打包并 SSH 部署；解压后重启 PM2 **`be-it-forever`**（默认 **`PORT=3000`**） |
| 推送 **`main`**、**Pull Request**、其它事件 | **不运行**本 Deploy workflow |

**反向代理 / 网关（如 Candy、Nginx、Caddy 等）**：`preview.iamsmart.top` 与 `www.iamsmart.top` 应反代到**同一 Node 端口**，并保留 **`Host`**（或正确设置 **`X-Forwarded-Host`**），以便应用识别域名。

**说明**：Deploy workflow 的 job 已写 **`environment: production`**，会读取 GitHub **Environment `production`** 下的 Secrets/Variables（并与仓库级合并；同名时一般以 Environment 为准，以 GitHub 实际行为为准）。请先在 **Settings → Environments** 创建 **`production`**。**应用层预发/正式由域名决定**，不再使用构建期 `NEXT_PUBLIC_APP_ENV`。

## 1. 在 GitHub 仓库配置 Secrets / Variables

仓库 → **Settings** → **Secrets and variables** → **Actions**：

- **Secrets**：敏感信息（加密、不出现在日志）。
- **Variables**：非敏感配置（如 URL、统计 ID）；同名时 workflow 优先用 Secret。

### Environment 级 vs Repository 级

| 级别 | 配置位置 | 适用场景 |
|------|----------|----------|
| **Repository** | Actions → Secrets / Variables（仓库级） | 全仓库共用；例如 **CI 构建**（`ci.yml`）用的 Supabase URL/Anon Key、或**仅有一个部署目标**时全部放这里。 |
| **Environment** | Settings → Environments → 某环境（如 production）→ Secrets / Variables | 按**部署目标**区分（production / staging 等）；部署 job 里写 `environment: production` 即用该环境的配置。适合多环境、或对生产部署做审批/等待。 |

**建议**：

- **当前 deploy.yml**：deploy job 固定使用 **`environment: production`**，请在该 Environment 下配置**部署与应用**相关 Secrets/Variables（也可同时在仓库级配置，按需复用）。
- **多环境 / 审批**：可在 `production` 上开启保护规则、审批人；若需改用其它环境名，修改 `deploy.yml` 中 `environment:` 并与 GitHub 中 Environment 名称一致。

### 部署与服务器（必填）

Workflow 使用 **`secrets.<名> || vars.<名>`**（同名 Secret 优先）。Job 绑定 **`production`** 后，**Environment `production`** 与**仓库级** Actions Secrets/Variables 均可能参与解析；请至少保证 **`production`** 环境已创建，且 `DEPLOY_*`、应用构建所需项在该环境或仓库级有值。

| 名称 | 类型 | 说明 |
|------|------|------|
| `DEPLOY_HOST` | **Variable** 或 Secret | 服务器 IP 或域名。 |
| `DEPLOY_USER` | **Variable** 或 Secret | SSH 登录用户名。 |
| `DEPLOY_SSH_PASSWORD` | **Secret**（必填） | SSH 登录密码；勿用 Variable。 |
| `DEPLOY_PATH` | **Variable** 或 Secret | 应用在服务器上的绝对路径，如 `/var/www/i-am-smart`。路径非敏感，**建议用 Repository Variable**。 |

部署前 workflow 会校验以上四项均非空；`DEPLOY_PATH` 为空时日志会提示优先检查 Variable。

### 应用环境变量（与本地 `.env.supabase` 对应）

Workflow 在 **Build** 步使用，并在 **Package** 步写入部署包内的 `.env`（与本地 `.env.supabase` 同组变量）。**敏感必须用 Secret，非敏感可用 Variable。**

| 名称 | 必填 | 建议类型 | 说明 |
|------|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Variable | Supabase 项目 URL（会打进前端，非密钥）。 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | Secret | 匿名公钥（可被滥用，建议 Secret）。 |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | **Secret** | 服务角色密钥，仅服务端，必须 Secret。 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 是 | Variable | Web Push VAPID 公钥（公开）。 |
| `VAPID_PRIVATE_KEY` | 是 | **Secret** | Web Push VAPID 私钥，必须 Secret。 |
| `VAPID_SUBJECT` | 是 | Variable | 如 `mailto:your@email.com`。 |
| `NEXT_PUBLIC_BAIDU_ANALYTICS_ID` | 是 | Variable | 百度统计站点 ID（公开）。 |
| `NEXT_PUBLIC_SITE_URL` | 否 | Variable | 站点根 URL（SEO）；不填用默认。 |
| `NEXT_PUBLIC_APP_ORIGIN` | 见下 | Variable / Secret | PWA 与回调等。 |

变量名与本地 `.env.supabase` / 根目录 `.env.supabase.example` 一致。

**级别建议**：上述部署与服务器 + 应用环境变量，若用 Environment 则都放在同一 Environment（如 production）；若用 Repository 则都放在仓库级。

## 2. 服务器准备

- **Node.js**：建议 20.x，与 CI 一致。
- **SSH**：用上面配置的 `DEPLOY_USER` + `DEPLOY_SSH_PASSWORD` 能通过密码登录。
- **部署目录**：`DEPLOY_PATH` 对应的目录需存在或可由对应用户创建（workflow 会 `mkdir -p`）。
- **pm2**：若已安装 [pm2](https://pm2.keymetrics.io/)，workflow 解压后会重启 **`be-it-forever`**（默认端口 `3000`）；进程不存在时会 `PORT=3000 pm2 start server.js --name be-it-forever`。未安装 pm2 时需自行用 systemd 等方式启动/重启。
- **运行时环境变量**：部署包内已包含 `.env`（由 workflow 从 Secrets/Variables 生成）。若需在服务器上覆盖，可在 `DEPLOY_PATH` 下放 `.env.local` 或在 pm2/systemd 中设置 `env`。
- **gh**（可选）：若服务器已安装 [GitHub CLI](https://cli.github.com/)（`gh`），可用于在服务器上拉取 artifact、查看 run 等；当前部署流程为 Actions 主动 SCP 推送，不依赖 `gh`。

### 首次在服务器上手动启动（未用 pm2 时）

部署包内已有 `.env`，直接启动即可：

```bash
cd $DEPLOY_PATH   # 如 /var/www/i-am-smart
PORT=3000 node server.js
```

或使用 systemd / pm2。

## 3. 触发部署

- **上线**：在要打版本的 commit 上执行 **`git tag vX.Y.Z && git push origin vX.Y.Z`**（须符合 **`v*`**），仅此会触发 **Deploy to Server**。
- **日常合并到 `main`**：不会触发本 workflow；需要合并前跑 lint/测试时，请本地执行或另建 **CI workflow**（本仓库当前未包含）。

## 4. 流程说明

1. Workflow 从 Secrets/Variables（及 Environment `production` 若已配置）读取应用环境变量，在 **Build** 步执行 `pnpm build`（standalone 输出）。
2. **Package** 步：将 `public/`、`.next/static` 拷入 standalone 输出，从 Secrets/Variables 生成 `.env` 打入包内，打成 `deploy/<repo>.tar.gz`（`<repo>` 为仓库名）。
3. 通过 SCP 将上述 tarball 传到服务器 `/tmp`。
4. SSH 到服务器，在 `DEPLOY_PATH` 解压（`--strip-components=1`），删除临时包；若检测到 pm2 则重启 **`be-it-forever`**。
