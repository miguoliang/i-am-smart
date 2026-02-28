# 支付宝支付配置问题排查指南

## 错误信息
`[INTERNAL_ERROR] 支付宝支付未配置`

## 问题原因

这个错误表示代码没有找到 `ALIPAY_APP_ID` 环境变量。代码检查逻辑在 `src/app/api/pay/alipay/page/route.ts` 和 `src/app/api/pay/alipay/wap/route.ts` 中：

```typescript
const appId = process.env.ALIPAY_APP_ID;
if (!appId) {
  throw ApiError.internal("支付宝支付未配置");
}
```

## 排查步骤

### 1. 检查环境变量是否配置

#### 本地开发环境

**检查 `.env.local` 文件：**

```bash
# 确保文件存在且包含以下配置
ALIPAY_APP_ID=你的应用APPID
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n你的私钥\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n支付宝公钥\n-----END PUBLIC KEY-----"
```

**验证环境变量是否加载：**

```bash
# 在项目根目录运行
node -e "console.log('ALIPAY_APP_ID:', process.env.ALIPAY_APP_ID)"
```

如果输出 `undefined`，说明环境变量没有加载。

#### 生产/部署环境

**Vercel：**（若使用 Vercel 部署；本项目使用自有服务器 + PM2，见 [deploy.md](deploy.md)）
1. 进入项目设置 → Environment Variables
2. 检查是否配置了以下变量：
   - `ALIPAY_APP_ID`
   - `ALIPAY_PRIVATE_KEY`
   - `ALIPAY_PUBLIC_KEY`
   - `ALIPAY_GATEWAY`（可选）

**其他平台：**
确保在部署平台的环境变量配置中添加了上述变量。

### 2. 检查环境变量名称

确保环境变量名称完全正确（区分大小写）：
- ✅ `ALIPAY_APP_ID`
- ❌ `ALIPAY_APPID`
- ❌ `alipay_app_id`
- ❌ `ALIPAYAPPID`

### 3. 检查环境变量文件位置

**Next.js 环境变量文件加载顺序：**
1. `.env.local`（本地开发，优先级最高）
2. `.env.development`（开发环境）
3. `.env.production`（生产环境）
4. `.env`（所有环境）

**确保：**
- 文件在项目根目录（与 `package.json` 同级）
- 文件名正确（注意 `.env.local` 不是 `.env.local.txt`）
- 文件没有被 `.gitignore` 忽略（`.env.local` 应该被忽略）

### 4. 重启开发服务器

修改环境变量后，**必须重启开发服务器**：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### 5. 检查环境变量格式

**私钥和公钥格式：**

```bash
# 正确格式（包含换行符）
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----"

# 或者使用 \n 表示换行
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

**常见错误：**
- ❌ 缺少引号
- ❌ 换行符格式错误
- ❌ 包含多余的空格或特殊字符

### 6. 验证环境变量是否在运行时可用

创建一个测试 API 路由来检查：

```typescript
// src/app/api/test-alipay-config/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasAppId: !!process.env.ALIPAY_APP_ID,
    hasPrivateKey: !!process.env.ALIPAY_PRIVATE_KEY,
    hasPublicKey: !!process.env.ALIPAY_PUBLIC_KEY,
    appIdLength: process.env.ALIPAY_APP_ID?.length || 0,
    // 注意：不要输出完整的密钥内容
  });
}
```

访问 `http://localhost:3000/api/test-alipay-config` 查看环境变量是否加载。

### 7. 检查部署环境

**如果是在 Vercel 等平台部署：**（本项目使用自有服务器 + PM2，见 [deploy.md](deploy.md)）

1. **检查环境变量作用域：**
   - Production
   - Preview
   - Development
   
   确保在正确的环境中配置了变量。

2. **重新部署：**
   修改环境变量后需要重新部署才能生效。

3. **检查构建日志：**
   查看部署日志，确认环境变量是否在构建时可用。

## 完整配置示例

### `.env.local`（本地开发）

```bash
# 支付宝支付配置
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"

# 可选：指定网关（不设置则根据 NODE_ENV 自动选择）
# ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do

# 应用域名
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

### Vercel 环境变量配置（若使用 Vercel）

在 Vercel Dashboard → Settings → Environment Variables 中添加：

| Name | Value | Environment |
|------|-------|-------------|
| `ALIPAY_APP_ID` | `你的APPID` | Production, Preview, Development |
| `ALIPAY_PRIVATE_KEY` | `你的私钥（完整内容）` | Production, Preview, Development |
| `ALIPAY_PUBLIC_KEY` | `支付宝公钥（完整内容）` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_ORIGIN` | `https://你的域名.com` | Production, Preview, Development |

## 快速检查清单

- [ ] `.env.local` 文件存在且包含 `ALIPAY_APP_ID`
- [ ] 环境变量名称拼写正确（区分大小写）
- [ ] 开发服务器已重启
- [ ] 私钥和公钥格式正确（包含 BEGIN/END 标记）
- [ ] 部署环境中已配置环境变量
- [ ] 修改环境变量后已重新部署

## 如果问题仍然存在

1. **检查代码逻辑：**
   ```typescript
   // 在 apps/pwa/src/app/api/pay/alipay/page/route.ts 中添加调试日志
   console.log("ALIPAY_APP_ID:", process.env.ALIPAY_APP_ID);
   console.log("All ALIPAY env vars:", {
     APP_ID: !!process.env.ALIPAY_APP_ID,
     PRIVATE_KEY: !!process.env.ALIPAY_PRIVATE_KEY,
     PUBLIC_KEY: !!process.env.ALIPAY_PUBLIC_KEY,
   });
   ```

2. **检查 Next.js 配置：**
   确保没有在 `next.config.js` 中覆盖环境变量。

3. **验证文件编码：**
   确保 `.env.local` 文件使用 UTF-8 编码。

4. **检查权限：**
   确保环境变量文件有读取权限。

## 相关文件

- `apps/pwa/src/app/api/pay/alipay/page/route.ts` - PC 网站支付 API
- `apps/pwa/src/app/api/pay/alipay/wap/route.ts` - 手机网站支付 API
- `apps/pwa/src/lib/alipay.ts` - 支付宝支付库
- `.env.supabase.example` - 环境变量示例文件
