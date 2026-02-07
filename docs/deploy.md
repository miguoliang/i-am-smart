# 通过 GitHub Actions 部署到服务器

推送 `main` 分支或手动触发 workflow 后，会构建 Next.js standalone 包并 SSH 部署到指定服务器。

## 1. 在 GitHub 仓库配置 Secrets / Variables

仓库 → **Settings** → **Secrets and variables** → **Actions**：

- **Secrets**：敏感信息（加密、不出现在日志），用 **New repository secret**。
- **Variables**：非敏感配置（如 URL、统计 ID），用 **Variables** 页签添加；同一名字若既有 Secret 又有 Variable，workflow 优先用 Secret。

### 部署与服务器（必填，全部用 Secret）

| 名称 | 类型 | 说明 |
|------|------|------|
| `DEPLOY_HOST` | Secret | 服务器 IP 或域名。 |
| `DEPLOY_USER` | Secret | SSH 登录用户名。 |
| `DEPLOY_SSH_KEY` | Secret | SSH 私钥全文。 |
| `DEPLOY_PATH` | Secret | 应用在服务器上的目录，如 `/var/www/be-it-forever`。 |

### 应用环境变量（与本地 `.env.supabase` 对应）

Workflow 用这些在构建时生成 `.env.supabase` 并打入部署包。**敏感必须用 Secret，非敏感可用 Variable。**

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

变量名与本地 `.env.supabase` / 根目录 `.env.supabase.example` 一致。

## 2. 服务器准备

- **Node.js**：建议 20.x，与 CI 一致。
- **SSH**：用上面配置的 `DEPLOY_USER` + `DEPLOY_SSH_KEY` 能无密码登录。
- **部署目录**：`DEPLOY_PATH` 对应的目录需存在或可由对应用户创建（workflow 会 `mkdir -p`）。
- **pm2**：若已安装 [pm2](https://pm2.keymetrics.io/)，workflow 解压后会自动执行 `pm2 restart be-it-forever`；若该进程尚未存在，会执行 `pm2 start server.js --name be-it-forever`。未安装 pm2 时需自行用 systemd 等方式启动/重启。
- **gh**（可选）：若服务器已安装 [GitHub CLI](https://cli.github.com/)（`gh`），可用于在服务器上拉取 artifact、查看 run 等；当前部署流程为 Actions 主动 SCP 推送，不依赖 `gh`。

### 首次在服务器上手动启动（未用 pm2 时）

```bash
cd $DEPLOY_PATH   # 如 /var/www/be-it-forever
PORT=3000 node server.js
```

或使用 systemd / 其他方式，保证运行前已加载同目录下的 `.env.supabase`（部署包内会包含）。

## 3. 触发部署

- **自动**：推送到 `main` 分支后会自动运行 Deploy workflow。
- **手动**：仓库 **Actions** → 选择 **Deploy to Server** → **Run workflow**。

## 4. 流程说明

1. 用上述**应用环境变量**类 Secret 在 workflow 中生成 `.env.supabase`（与本地格式一致，逐项写入，不用 base64）。
2. 执行 `npm run package:standalone:supabase` 构建并打包，生成的包内包含该 `.env.supabase`。
3. 通过 SCP 将 `deploy/standalone.tar.gz` 传到服务器 `/tmp`。
4. SSH 到服务器，在 `DEPLOY_PATH` 解压（`--strip-components=1`），删除临时包；若检测到 pm2 则重启或启动 `be-it-forever`。
