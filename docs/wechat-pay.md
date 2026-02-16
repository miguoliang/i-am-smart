# 微信支付 Native 支付

网站展示二维码，用户使用微信扫码完成支付（微信支付 API v3 Native 模式）。

## 1. 商户平台配置

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)。
2. 获取 **商户号**（mchid）、**APIv3 密钥**（32 位，用于解密回调）。
3. **API 证书**：在「账户中心 → API 安全」下载并安装证书，得到：
   - 商户私钥（apiclient_key.pem）用于请求签名；
   - 证书序列号（apiclient_cert.pem 中的 serial number）用于请求头。
4. 将 **商户号** 与 **公众号/小程序/开放平台应用 AppID** 在商户平台完成绑定（开发配置）。

## 2. 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `WECHAT_PAY_MCH_ID` | 是 | 商户号 |
| `WECHAT_PAY_APP_ID` | 是 | 与商户号绑定的 AppID（可与微信登录的 `WECHAT_OPEN_APP_ID` 一致，需已在商户平台绑定） |
| `WECHAT_PAY_MERCHANT_SERIAL_NO` | 是 | 商户 API 证书序列号 |
| `WECHAT_PAY_PRIVATE_KEY` | 是 | 商户私钥 PEM 全文（可换行，用于签名请求） |
| `WECHAT_PAY_API_V3_KEY` | 是 | APIv3 密钥（32 字节，用于解密支付成功回调） |

以上均仅服务端使用，勿提交到仓库。部署时在 GitHub Secrets / 服务器环境中配置。

`NEXT_PUBLIC_APP_ORIGIN` 需已配置（用于 notify_url 和前端跳转）。

## 3. 流程简述

1. 前端请求 `POST /api/pay/wechat/native`，传入 `amount`（单位：分）、`description`（商品描述）等。
2. 服务端生成商户订单号、调用微信「Native 下单」、落库 `pay_orders`，返回 `code_url`、`out_trade_no`。
3. 前端将 `code_url` 生成二维码展示，用户微信扫码支付。
4. 微信支付异步 POST 到 `notify_url`（如 `https://www.iamsmart.top/api/pay/wechat/notify`），服务端验签、解密、更新订单为已支付并返回 200。
5. 前端可轮询 `GET /api/pay/orders/[out_trade_no]` 获取订单状态。

演示页：`/pay`（营销站内「微信支付」链接可进入）。

## 4. 数据库

执行迁移 `supabase/migrations/20260215000000_add_pay_orders.sql`，创建 `pay_orders` 表。RLS 允许用户仅查看本人订单（按 `account_id`）。
