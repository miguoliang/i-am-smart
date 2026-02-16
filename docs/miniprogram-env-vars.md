# 小程序环境变量和 Secrets 配置指南

## 📋 概述

小程序功能需要配置以下环境变量和 GitHub Secrets。

## 🔐 必需的环境变量

### 1. 小程序登录配置（后端）

**用途**：小程序登录 API (`/api/auth/miniprogram/login`) 需要这些变量来验证微信登录 code。

| 变量名 | 类型 | 说明 | 获取方式 |
|--------|------|------|----------|
| `WECHAT_MINIPROGRAM_APP_ID` | Secret | 小程序 AppID | 微信公众平台 → 开发 → 开发管理 → 开发设置 |
| `WECHAT_MINIPROGRAM_APP_SECRET` | Secret | 小程序 AppSecret | 微信公众平台 → 开发 → 开发管理 → 开发设置 |

**⚠️ 注意**：
- `WECHAT_MINIPROGRAM_APP_SECRET` 是敏感信息，必须设置为 **Secret**（不能是 Variable）
- 这两个变量是**必需的**，缺少会导致小程序登录失败

## 📝 配置步骤

### 1. 本地开发环境 (`.env.local`)

在项目根目录的 `.env.local` 文件中添加：

```bash
# 小程序登录配置
WECHAT_MINIPROGRAM_APP_ID=你的小程序AppID
WECHAT_MINIPROGRAM_APP_SECRET=你的小程序AppSecret
```

### 2. GitHub Secrets（部署环境）

在 GitHub 仓库中配置 Secrets：

1. 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `WECHAT_MINIPROGRAM_APP_ID` | 你的小程序 AppID | 小程序 AppID |
| `WECHAT_MINIPROGRAM_APP_SECRET` | 你的小程序 AppSecret | 小程序 AppSecret（敏感） |

### 3. 小程序端配置

小程序端不需要环境变量，但需要在代码中配置：

**`miniprogram/app.ts`**：
```typescript
const APP_CONFIG = {
  API_BASE_URL: 'https://your-domain.com', // 替换为实际后端域名
};
```

**`miniprogram/project.config.json`**：
```json
{
  "appid": "你的小程序AppID"
}
```

## 🔍 如何获取小程序 AppID 和 AppSecret

### 步骤 1：注册小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号（需要企业认证或个体工商户）
3. 完成注册后，进入小程序管理后台

### 步骤 2：获取 AppID

1. 登录小程序管理后台
2. 进入 **开发** → **开发管理** → **开发设置**
3. 在 **开发者 ID(AppID)** 部分可以看到 AppID
4. 复制 AppID

### 步骤 3：获取 AppSecret

1. 在同一个页面（开发设置）
2. 找到 **开发者密钥(AppSecret)** 部分
3. 点击 **生成** 或 **重置**（如果已生成）
4. **⚠️ 重要**：AppSecret 只显示一次，请立即保存
5. 复制 AppSecret

## 📦 环境变量清单

### 后端环境变量（必需）

```bash
# 小程序登录
WECHAT_MINIPROGRAM_APP_ID=wx1234567890abcdef
WECHAT_MINIPROGRAM_APP_SECRET=your_app_secret_here
```

### 后端环境变量（已存在，小程序复用）

这些变量已经存在，小程序会复用：

```bash
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API 地址（小程序需要）
NEXT_PUBLIC_APP_ORIGIN=https://your-domain.com
```

## 🚀 GitHub Actions 配置

### 更新 `deploy.yml`

需要在 `.github/workflows/deploy.yml` 的 `env` 部分添加：

```yaml
env:
  # ... 现有变量 ...
  WECHAT_MINIPROGRAM_APP_ID: ${{ secrets.WECHAT_MINIPROGRAM_APP_ID }}
  WECHAT_MINIPROGRAM_APP_SECRET: ${{ secrets.WECHAT_MINIPROGRAM_APP_SECRET }}
```

并在 `Package` 步骤的 `for v in ...` 循环中添加：

```bash
for v in ... WECHAT_MINIPROGRAM_APP_ID WECHAT_MINIPROGRAM_APP_SECRET; do
  # ...
done
```

## ✅ 验证配置

### 1. 本地验证

```bash
# 检查环境变量是否设置
node -e "console.log(process.env.WECHAT_MINIPROGRAM_APP_ID)"
node -e "console.log(process.env.WECHAT_MINIPROGRAM_APP_SECRET ? 'Set' : 'Not set')"
```

### 2. API 测试

启动开发服务器后，测试小程序登录 API：

```bash
curl -X POST http://localhost:3000/api/auth/miniprogram/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'
```

如果配置正确，应该返回错误信息（因为 code 无效），而不是 "小程序登录未配置"。

### 3. 小程序端验证

1. 在微信开发者工具中打开小程序
2. 查看控制台是否有 API 调用错误
3. 尝试登录，检查是否能成功获取 token

## 🔒 安全注意事项

1. **AppSecret 保密**：
   - 永远不要提交到代码仓库
   - 只在 GitHub Secrets 中配置
   - 不要在前端代码中使用

2. **域名配置**：
   - 在微信公众平台配置 request 合法域名
   - 添加你的后端 API 域名（如 `https://your-domain.com`）

3. **HTTPS 要求**：
   - 小程序只能请求 HTTPS 接口
   - 确保后端 API 使用 HTTPS

## 📚 相关文档

- [微信小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [小程序 code2session API](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
