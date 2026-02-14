# 微信网页登录

登录页支持「微信登录」（微信开放平台 - 网站应用，PC 扫码）。未配置时不显示该按钮。

## 1. 微信开放平台

1. 登录 [微信开放平台](https://open.weixin.qq.com/)。
2. 创建或使用已有 **网站应用**，申请「微信登录」能力（审核通过后获得 AppID、AppSecret）。
3. 在应用后台配置 **授权回调域**：只填域名（无协议、无路径），例如 `www.iamsmart.top`；若有预览环境可再填 `preview.iamsmart.top`。回调实际地址为 `https://<域名>/api/auth/wechat/callback`。**授权回调域必须与 `NEXT_PUBLIC_APP_ORIGIN` 的域名一致**（代码用该变量拼 `redirect_uri`），否则微信会报「redirect_uri 参数错误」。

## 2. 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `WECHAT_OPEN_APP_ID` | 是（若启用微信登录） | 网站应用 AppID，服务端 callback 用 |
| `WECHAT_OPEN_APP_SECRET` | 是 | 网站应用 AppSecret，**仅服务端**，勿提交到仓库 |
| `NEXT_PUBLIC_WECHAT_OPEN_APP_ID` | 是 | 与上面同值，前端拼授权 URL 用 |
| `NEXT_PUBLIC_APP_ORIGIN` | 推荐 | 站点根 URL，如 `https://www.iamsmart.top`（须与微信「授权回调域」一致），用于拼 **redirect_uri**、callback 重定向与错误跳转；未设置时用当前访问的 origin |

本地开发：在 `.env.local` 中配置；部署：在 GitHub Environments / Vercel 等中配置。

## 3. Supabase

- **Authentication → URL Configuration → Redirect URLs**：加入你的站点域名，例如 `https://www.iamsmart.top/**`、`https://preview.iamsmart.top/**`，以便 Magic Link 验证后跳回站内。

## 4. 测试环境

微信要求授权回调域公网可访问，不能填 localhost。可选：

- **内网穿透**：用 ngrok / cloudflared 暴露本地，授权回调域填穿透域名。
- **Preview 部署**：用现有 [deploy](deploy.md) 部署到 preview 环境，授权回调域填 preview 域名。

详见计划文档中的「测试环境准备」章节。
