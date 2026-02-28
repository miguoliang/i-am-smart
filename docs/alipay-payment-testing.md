# 支付宝支付验证指南

本文档说明如何在这个项目中验证支付宝支付功能。

## 📋 验证前准备

### 1. 配置支付宝沙箱环境

1. **登录支付宝开放平台**
   - 访问：https://open.alipay.com/
   - 进入 **控制台** → **网页&移动应用**

2. **创建沙箱应用**
   - 在开放平台创建沙箱应用
   - 获取沙箱 APPID
   - 配置应用密钥（RSA2）

3. **配置环境变量**

在 `.env.local` 或部署环境变量中配置：

```bash
# 支付宝沙箱配置
ALIPAY_APP_ID=你的沙箱APPID
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n你的应用私钥\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n支付宝公钥\n-----END PUBLIC KEY-----"

# 使用沙箱网关（开发环境会自动使用）
ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do

# 应用域名（用于生成回调地址）
NEXT_PUBLIC_APP_ORIGIN=https://你的测试域名
```

4. **配置回调地址**
   - 在支付宝开放平台配置异步通知地址：`https://你的域名/api/pay/alipay/notify`
   - 确保回调地址可以被支付宝访问（本地开发可使用 ngrok 等工具）

## 🧪 验证步骤

### 方法一：通过 API 直接测试

#### 1. 创建 PC 网站支付订单

```bash
curl -X POST http://localhost:3000/api/pay/alipay/page \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "subject": "测试商品",
    "body": "测试商品描述",
    "return_url": "https://你的域名/pay/result"
  }'
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "form_html": "<!DOCTYPE html>...",
    "out_trade_no": "AP1234567890..."
  }
}
```

#### 2. 创建手机网站支付订单

```bash
curl -X POST http://localhost:3000/api/pay/alipay/wap \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "subject": "测试商品",
    "return_url": "https://你的域名/pay/result",
    "quit_url": "https://你的域名"
  }'
```

#### 3. 验证支付表单

1. 将返回的 `form_html` 保存为 HTML 文件
2. 在浏览器中打开该 HTML 文件
3. 应该会自动跳转到支付宝支付页面

#### 4. 使用沙箱账号支付

- 使用支付宝沙箱提供的测试账号登录
- 完成支付流程
- 支付成功后会自动跳转到 `return_url`

#### 5. 验证订单状态

```bash
# 查询订单状态
curl http://localhost:3000/api/pay/orders/AP1234567890...
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "out_trade_no": "AP1234567890...",
    "status": "paid",
    "amount_total": 1,
    "description": "测试商品",
    "paid_at": "2026-02-19T10:30:00.000Z"
  }
}
```

### 方法二：通过前端页面测试

#### 1. 创建测试页面

创建一个测试页面来调用支付 API：

```typescript
// src/app/test-alipay/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/form/Button";

export default function TestAlipayPage() {
  const [loading, setLoading] = useState(false);
  const [formHtml, setFormHtml] = useState<string | null>(null);

  const createPagePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pay/alipay/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 0.01,
          subject: "测试商品",
        }),
      });
      const data = await res.json();
      if (data.success && data.data.form_html) {
        setFormHtml(data.data.form_html);
      }
    } catch (error) {
      console.error("创建订单失败", error);
    } finally {
      setLoading(false);
    }
  };

  if (formHtml) {
    return (
      <div dangerouslySetInnerHTML={{ __html: formHtml }} />
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">支付宝支付测试</h1>
      <Button onClick={createPagePay} disabled={loading}>
        {loading ? "创建中..." : "创建 PC 网站支付订单"}
      </Button>
    </div>
  );
}
```

#### 2. 访问测试页面

访问 `http://localhost:3000/test-alipay`，点击按钮创建订单并跳转到支付宝。

### 方法三：验证异步通知

#### 1. 模拟支付宝异步通知

支付宝支付成功后会向 `notify_url` 发送 POST 请求。你可以使用以下方式模拟：

```bash
curl -X POST http://localhost:3000/api/pay/alipay/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "notify_time=2026-02-19 10:30:00&notify_type=trade_status_sync&notify_id=test123&app_id=你的APPID&charset=utf-8&version=1.0&sign_type=RSA2&sign=测试签名&trade_no=2026021922001234567890123456&out_trade_no=AP1234567890&trade_status=TRADE_SUCCESS&total_amount=0.01&buyer_id=2088123456789012&seller_id=2088765432109876&gmt_payment=2026-02-19 10:30:00"
```

**注意：** 实际测试时需要使用真实的签名。签名验证逻辑在 `apps/pwa/src/lib/alipay.ts` 的 `verifyNotify` 函数中。

#### 2. 检查数据库订单状态

```sql
-- 查询订单
SELECT * FROM pay_orders 
WHERE out_trade_no = 'AP1234567890...';

-- 应该看到：
-- status: 'paid'
-- alipay_trade_no: 支付宝交易号
-- paid_at: 支付时间
```

## ✅ 验证检查清单

### 功能验证

- [ ] **创建订单**
  - [ ] PC 网站支付订单创建成功
  - [ ] 手机网站支付订单创建成功
  - [ ] 订单信息正确保存到数据库

- [ ] **支付跳转**
  - [ ] 支付表单 HTML 正确生成
  - [ ] 能够跳转到支付宝支付页面
  - [ ] 支付参数正确（金额、商品名称等）

- [ ] **支付完成**
  - [ ] 支付成功后能跳转回 `return_url`
  - [ ] 异步通知能正确接收
  - [ ] 订单状态正确更新为 `paid`
  - [ ] 支付宝交易号正确保存

- [ ] **订单查询**
  - [ ] 能通过订单号查询订单状态
  - [ ] 订单信息返回正确

### 安全验证

- [ ] **签名验证**
  - [ ] 异步通知签名验证通过
  - [ ] 无效签名被拒绝

- [ ] **数据验证**
  - [ ] 金额范围验证（0.01 ~ 999999.99）
  - [ ] 商品标题必填且长度限制
  - [ ] 订单号格式正确

### 错误处理

- [ ] **配置错误**
  - [ ] 未配置 ALIPAY_APP_ID 时返回错误
  - [ ] 未配置密钥时返回错误

- [ ] **支付失败**
  - [ ] 支付取消时订单状态不变
  - [ ] 支付失败时订单状态不变

## 🔍 调试技巧

### 1. 查看日志

支付宝支付相关的日志会记录在应用日志中：

```typescript
// 查看订单创建日志
logger.info("创建支付宝订单", { out_trade_no, amount, subject });

// 查看异步通知日志
logger.warn("Alipay notify: signature verification failed", { params });
logger.error("Alipay notify: update order failed", { out_trade_no, error });
```

### 2. 检查数据库

```sql
-- 查看所有支付宝订单
SELECT * FROM pay_orders 
WHERE pay_channel LIKE 'alipay%'
ORDER BY created_at DESC;

-- 查看待支付订单
SELECT * FROM pay_orders 
WHERE status = 'pending' AND pay_channel LIKE 'alipay%';

-- 查看已支付订单
SELECT * FROM pay_orders 
WHERE status = 'paid' AND pay_channel LIKE 'alipay%';
```

### 3. 测试签名验证

```typescript
// 在 src/lib/alipay.ts 中添加测试代码
import { verifyNotify } from "@/lib/alipay";

const testParams = {
  notify_time: "2026-02-19 10:30:00",
  notify_type: "trade_status_sync",
  trade_status: "TRADE_SUCCESS",
  out_trade_no: "AP1234567890",
  trade_no: "2026021922001234567890123456",
  // ... 其他参数
  sign: "签名值"
};

const isValid = verifyNotify(testParams);
console.log("签名验证结果:", isValid);
```

## 📝 常见问题

### Q1: 支付表单无法跳转？

**A:** 检查：
- 网关地址是否正确（沙箱/正式环境）
- 签名是否正确
- 浏览器控制台是否有错误

### Q2: 异步通知收不到？

**A:** 检查：
- 回调地址是否在支付宝开放平台配置
- 回调地址是否可访问（HTTPS）
- 服务器日志是否有错误

### Q3: 签名验证失败？

**A:** 检查：
- 支付宝公钥是否正确（不是应用公钥）
- 私钥格式是否正确（包含换行符）
- 签名算法是否为 RSA2

### Q4: 订单状态未更新？

**A:** 检查：
- 异步通知是否成功接收
- 数据库更新是否有错误
- 订单状态是否为 `pending`（只有 pending 状态才会更新）

## 🚀 生产环境验证

在生产环境验证前，确保：

1. ✅ 使用正式环境 APPID 和密钥
2. ✅ 配置正式环境网关地址
3. ✅ 回调地址使用 HTTPS
4. ✅ 在支付宝开放平台配置生产环境回调地址
5. ✅ 完成应用审核（如需要）

## 📚 相关文档

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [支付宝 PC 网站支付文档](https://opendocs.alipay.com/open/270/105899)
- [支付宝手机网站支付文档](https://opendocs.alipay.com/open/203/105285)
