# 支付宝密钥格式配置指南

## 错误信息
`error:1E08010C:DECODER routines::unsupported`

这个错误表示 OpenSSL 无法解析私钥或公钥，通常是格式问题。

## 问题原因

1. **私钥格式不正确** - 缺少 BEGIN/END 标记
2. **换行符处理错误** - 环境变量中的换行符格式不对
3. **私钥内容不完整** - 密钥内容被截断或损坏
4. **编码问题** - 密钥包含特殊字符或编码错误

## 正确的密钥格式

### 格式一：PEM 格式（带 BEGIN/END 标记）

#### 私钥格式（RSA2）

```bash
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
（多行密钥内容）
...
-----END RSA PRIVATE KEY-----
```

#### 公钥格式（支付宝公钥）

```bash
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
（多行密钥内容）
...
-----END PUBLIC KEY-----
```

### 格式二：支付宝密钥生成工具格式（纯 Base64，推荐）

支付宝密钥生成工具生成的密钥是**纯 Base64 字符串**，没有 BEGIN/END 标记和换行符：

**私钥示例：**
```
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDxRE7Q/DM14xPBbgQVSXC7huwWEiLPLQESYFxoHRy11u9SF1BBVh3DyYmREXhgGB5E6f0u4bEbPK+e9r8CU++rChrIep1SHYjY5BOKCBLiHPWK12HBvZfnrEVPJZjWmwmqa5w9tUQFWMt4HfbjoC/cRUExSWKB3jha8bL+vkAkD+qGpLortdGIVXwIyzNZJ8ie9Re8hUrNYPJUcoLRqF/5y5Zwc1oFJh5c2k7x75K5Cos2kWbRnpuDKDWH54s1Hzl0gLbO/4McNlmPk5m5TLpwm5QsWTroYXYO0YoIXQegU6hAf3o63yrSNHIyPbBiyMUSBnoVgka0Jv9hr2U+YQn9AgMBAAECggEARfMxCsRkMJZyrt0vz+AoECaxIkEF2J1Kt0I66HCwV0RGxL0/poHKRW6UNPwks2+qrv5MSqBi0evJW0Rc4tblIOjgFQn/vMQVXhTaWWW329jbk/KYRCys8x1uRuE2q9ntdnyWowl//DDfZScC4sIZvjpSCXEmX1LHcg6rf9I3FHz8vEKkv1qrLgj6FEsthkTSDRRC6j052u28IZ0tZwDtXq41FpKqUkRIq+vhK/iojPbp4+uH9P9CCO2DCIgnBTINDFe//eTow0J31TWdfeKwvJnvz/1dZ/I4tS0YxSSkOezbLUqS8gkpM2ngiA3NAg45O3QbAl2SouBdAKUIKMnZfQKBgQD5+x3hFEZ3PLle2zNSGPIzINBkLEtol5mZ6xPmYAD23IxIIxOA44acMLFbg2scQ3xLDBsuUpQjbW46w5d0pfnHIHUk0AsCfY4VGcnQk+Bp2fIdYFils30Tg5Bb43AI+oWrKAOWtgeHzEfEK71dXElSROiNCGc/C/KQtm3h3XlnqwKBgQD3E3o5Rm/DYATuo4hA8X7b8by+eEF7KqtEUZXq3iJHc1hlSkP15aWPBeA1hMbubXqmQLoZZL0ezAWeC5UW2dN103LIQaJZTaeXr+CuKqJ7MxnggcAVFoCKmACvk2zxTUJXAyVnDB9/m8Gl2SWRzEO4B5ysajyGEWNqCL6SbiYM9wKBgGySVHfdhn1jMl+wdKnDi+4I4nmfg2D59wySvSHhsImHYKY0FdR0/ZH41A8bFPpBlUpDB8smspBwht+e87kGHWYPAtHqSd3bCkq/2JduoplWv4Fixx2wxzIigiBmt9IufL/JsUVT6hFg+AqLtMNHwdCpfRdD/xOy7LdNhIwE1SXhAoGAArbkEN0FPVBAvZ5uUMhWbHQrbqxDi+bcGtQKoZnvJnnN7s7yEDGFsByQagYbaWMqhckQQlco/L2hEituZ+HcwN6h1DFkZzbDMJduEHvHbTMShbTnN1QX9W3WFBe6iqwennYaYxdvASfk6L2J/CASXmM3BW3lXFO0k+Wkslcjc+ECgYBONwsQEleCyUCWBKdY3ZqsG2VrbiVwrrxMXPwMvTN2W2E4lrgY8Q9FxFiZLL8poaG+eLG+2i64H2SgFBvKlouVKBOOSFZ+Z1d9Bl2XH6Qw1NePjR6vgbsStw7vW3/pfF0GVD1frfiMqTle4f5GsfoORcHylGU6FRrvwlx8gMqIwQ==
```

**公钥示例：**
```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

**✅ 代码会自动处理：**
- 自动检测是否为纯 Base64 格式（无 BEGIN/END 标记）
- 自动添加 PEM 格式标记
- 自动按每 64 字符换行（PEM 标准格式）
- 无需手动转换，直接使用即可

## 配置方法

### 方法一：支付宝密钥生成工具格式（最简单，推荐）

**直接从支付宝密钥生成工具复制，无需任何处理：**

```bash
# 私钥：直接复制纯 Base64 字符串
ALIPAY_PRIVATE_KEY="MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDxRE7Q/DM14xPBbgQVSXC7huwWEiLPLQESYFxoHRy11u9SF1BBVh3DyYmREXhgGB5E6f0u4bEbPK+e9r8CU++rChrIep1SHYjY5BOKCBLiHPWK12HBvZfnrEVPJZjWmwmqa5w9tUQFWMt4HfbjoC/cRUExSWKB3jha8bL+vkAkD+qGpLortdGIVXwIyzNZJ8ie9Re8hUrNYPJUcoLRqF/5y5Zwc1oFJh5c2k7x75K5Cos2kWbRnpuDKDWH54s1Hzl0gLbO/4McNlmPk5m5TLpwm5QsWTroYXYO0YoIXQegU6hAf3o63yrSNHIyPbBiyMUSBnoVgka0Jv9hr2U+YQn9AgMBAAECggEARfMxCsRkMJZyrt0vz+AoECaxIkEF2J1Kt0I66HCwV0RGxL0/poHKRW6UNPwks2+qrv5MSqBi0evJW0Rc4tblIOjgFQn/vMQVXhTaWWW329jbk/KYRCys8x1uRuE2q9ntdnyWowl//DDfZScC4sIZvjpSCXEmX1LHcg6rf9I3FHz8vEKkv1qrLgj6FEsthkTSDRRC6j052u28IZ0tZwDtXq41FpKqUkRIq+vhK/iojPbp4+uH9P9CCO2DCIgnBTINDFe//eTow0J31TWdfeKwvJnvz/1dZ/I4tS0YxSSkOezbLUqS8gkpM2ngiA3NAg45O3QbAl2SouBdAKUIKMnZfQKBgQD5+x3hFEZ3PLle2zNSGPIzINBkLEtol5mZ6xPmYAD23IxIIxOA44acMLFbg2scQ3xLDBsuUpQjbW46w5d0pfnHIHUk0AsCfY4VGcnQk+Bp2fIdYFils30Tg5Bb43AI+oWrKAOWtgeHzEfEK71dXElSROiNCGc/C/KQtm3h3XlnqwKBgQD3E3o5Rm/DYATuo4hA8X7b8by+eEF7KqtEUZXq3iJHc1hlSkP15aWPBeA1hMbubXqmQLoZZL0ezAWeC5UW2dN103LIQaJZTaeXr+CuKqJ7MxnggcAVFoCKmACvk2zxTUJXAyVnDB9/m8Gl2SWRzEO4B5ysajyGEWNqCL6SbiYM9wKBgGySVHfdhn1jMl+wdKnDi+4I4nmfg2D59wySvSHhsImHYKY0FdR0/ZH41A8bFPpBlUpDB8smspBwht+e87kGHWYPAtHqSd3bCkq/2JduoplWv4Fixx2wxzIigiBmt9IufL/JsUVT6hFg+AqLtMNHwdCpfRdD/xOy7LdNhIwE1SXhAoGAArbkEN0FPVBAvZ5uUMhWbHQrbqxDi+bcGtQKoZnvJnnN7s7yEDGFsByQagYbaWMqhckQQlco/L2hEituZ+HcwN6h1DFkZzbDMJduEHvHbTMShbTnN1QX9W3WFBe6iqwennYaYxdvASfk6L2J/CASXmM3BW3lXFO0k+Wkslcjc+ECgYBONwsQEleCyUCWBKdY3ZqsG2VrbiVwrrxMXPwMvTN2W2E4lrgY8Q9FxFiZLL8poaG+eLG+2i64H2SgFBvKlouVKBOOSFZ+Z1d9Bl2XH6Qw1NePjR6vgbsStw7vW3/pfF0GVD1frfiMqTle4f5GsfoORcHylGU6FRrvwlx8gMqIwQ=="

# 公钥：从支付宝开放平台获取的支付宝公钥（也是纯 Base64）
ALIPAY_PUBLIC_KEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

**✅ 优势：**
- 无需手动添加 BEGIN/END 标记
- 无需处理换行符
- 代码会自动转换为标准 PEM 格式
- 直接从工具复制粘贴即可

### 方法二：使用 `\n` 表示换行（PEM 格式）

如果使用标准的 PEM 格式，在环境变量中使用 `\n` 表示换行符：

```bash
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n...\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n...\n-----END PUBLIC KEY-----"
```

### 方法三：使用实际换行（某些平台支持）

```bash
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----"
```

## 配置步骤

### 1. 获取私钥文件内容

```bash
# 查看私钥文件
cat app_private_key.pem

# 输出示例：
# -----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# ...
# -----END RSA PRIVATE KEY-----
```

### 2. 转换为单行格式（使用 \n）

**手动转换：**
- 将每行末尾添加 `\n`
- 最后一行不需要 `\n`

**使用脚本转换：**

```bash
# 将 PEM 文件转换为单行格式（使用 \n）
cat app_private_key.pem | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
```

### 3. 配置到环境变量

#### 本地开发（.env.local）

```bash
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n...\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n...\n-----END PUBLIC KEY-----"
```

#### GitHub Secrets（部署环境）

1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 添加 Secret：
   - Name: `ALIPAY_PRIVATE_KEY`
   - Value: 完整的私钥内容（使用 `\n` 表示换行）

**注意：** GitHub Secrets 中可以直接粘贴多行内容，但建议使用 `\n` 格式以确保兼容性。

### 4. 验证配置

创建一个测试脚本来验证密钥格式：

```typescript
// test-alipay-key.ts
import { createSign } from "crypto";

const privateKey = process.env.ALIPAY_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!privateKey) {
  console.error("ALIPAY_PRIVATE_KEY not set");
  process.exit(1);
}

try {
  const sign = createSign("RSA-SHA256");
  sign.update("test", "utf8");
  sign.sign(privateKey, "base64");
  console.log("✅ Private key format is valid");
} catch (error) {
  console.error("❌ Private key format error:", error);
  process.exit(1);
}
```

运行测试：
```bash
node -r ts-node/register test-alipay-key.ts
```

## 常见错误和解决方案

### 错误 1: 缺少 BEGIN/END 标记

**错误示例：**
```bash
ALIPAY_PRIVATE_KEY="MIIEpAIBAAKCAQEA..."
```

**正确格式：**
```bash
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

### 错误 2: 换行符格式错误

**错误示例：**
```bash
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA..."
```
（在某些环境中，实际换行符可能不被正确处理）

**正确格式：**
```bash
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

### 错误 3: 使用了应用公钥而不是支付宝公钥

**错误：** 使用自己生成的应用公钥

**正确：** 必须使用从支付宝开放平台获取的**支付宝公钥**（不是应用公钥）

### 错误 4: 密钥内容被截断

**检查方法：**
```bash
# 检查私钥长度（RSA 2048 位私钥通常约 1700 字符）
echo "$ALIPAY_PRIVATE_KEY" | wc -c
```

**解决：** 确保完整复制密钥内容，包括所有行。

## 密钥格式验证工具

### 使用 OpenSSL 验证

```bash
# 验证私钥格式
echo "$ALIPAY_PRIVATE_KEY" | openssl rsa -in - -check -noout

# 验证公钥格式
echo "$ALIPAY_PUBLIC_KEY" | openssl rsa -pubin -in - -noout
```

### 使用 Node.js 验证

```javascript
const crypto = require('crypto');

function validatePrivateKey(key) {
  try {
    const normalized = key.replace(/\\n/g, '\n');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update('test');
    sign.sign(normalized, 'base64');
    return true;
  } catch (error) {
    console.error('Invalid private key:', error.message);
    return false;
  }
}

function validatePublicKey(key) {
  try {
    const normalized = key.replace(/\\n/g, '\n');
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update('test');
    return true;
  } catch (error) {
    console.error('Invalid public key:', error.message);
    return false;
  }
}
```

## 快速检查清单

- [ ] 私钥包含 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`
- [ ] 公钥包含 `-----BEGIN PUBLIC KEY-----` 和 `-----END PUBLIC KEY-----`
- [ ] 使用 `\n` 表示换行符（或确保实际换行符被正确处理）
- [ ] 密钥内容完整，没有被截断
- [ ] 使用的是支付宝公钥（不是应用公钥）
- [ ] 环境变量已正确设置并重启了服务

## 调试技巧

### 1. 检查环境变量是否正确加载

```bash
# 在代码中添加调试日志
console.log('Private key length:', process.env.ALIPAY_PRIVATE_KEY?.length);
console.log('Private key starts with:', process.env.ALIPAY_PRIVATE_KEY?.substring(0, 30));
console.log('Private key ends with:', process.env.ALIPAY_PRIVATE_KEY?.substring(-30));
```

### 2. 检查密钥格式

```bash
# 检查是否包含必要的标记
echo "$ALIPAY_PRIVATE_KEY" | grep -q "BEGIN RSA PRIVATE KEY" && echo "✅ Has BEGIN marker" || echo "❌ Missing BEGIN marker"
echo "$ALIPAY_PRIVATE_KEY" | grep -q "END RSA PRIVATE KEY" && echo "✅ Has END marker" || echo "❌ Missing END marker"
```

### 3. 测试密钥解析

```bash
# 尝试解析私钥
echo "$ALIPAY_PRIVATE_KEY" | sed 's/\\n/\n/g' | openssl rsa -in - -check -noout 2>&1
```

## 相关文档

- [支付宝开放平台 - 密钥生成指南](https://opendocs.alipay.com/common/02kkv7)
- [OpenSSL RSA 密钥格式说明](https://www.openssl.org/docs/man1.1.1/man1/rsa.html)
