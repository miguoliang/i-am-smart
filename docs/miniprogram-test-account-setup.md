# 小程序测试号开发配置指南

## 📋 概述

使用小程序测试号开发时，需要在微信公众平台和微信开发者工具中进行配置。

## 🎯 测试号 vs 正式号

### 测试号（开发版）
- ✅ **无需企业认证**，个人开发者可用
- ✅ **快速开始**，注册后即可开发
- ⚠️ **功能限制**：部分高级功能不可用
- ⚠️ **域名限制**：需要配置合法域名才能调用后端 API

### 正式号
- ✅ **功能完整**：所有功能可用
- ⚠️ **需要认证**：企业或个体工商户
- ⚠️ **审核流程**：发布需要审核

## 🚀 测试号注册步骤

### 1. 注册小程序测试号

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 点击右上角 **立即注册**
3. 选择 **小程序**
4. 填写邮箱、密码等信息
5. **选择账号类型**：
   - 个人开发者：选择 **个人**
   - 企业开发者：选择 **企业**（需要营业执照）
6. 完成注册后，进入小程序管理后台

### 2. 获取测试号 AppID

1. 登录小程序管理后台
2. 进入 **开发** → **开发管理** → **开发设置**
3. 在 **开发者 ID(AppID)** 部分可以看到 AppID
4. 复制 AppID（格式：`wx` 开头的一串字符）

### 3. 获取 AppSecret（可选，用于后端登录）

1. 在同一个页面（开发设置）
2. 找到 **开发者密钥(AppSecret)** 部分
3. 点击 **生成** 或 **重置**
4. **⚠️ 重要**：AppSecret 只显示一次，请立即保存
5. 复制 AppSecret

## ⚙️ 微信公众平台配置

### 1. 配置服务器域名（必需）

小程序调用后端 API 需要配置合法域名。

#### 步骤：

1. 登录小程序管理后台
2. 进入 **开发** → **开发管理** → **开发设置**
3. 找到 **服务器域名** 部分
4. 点击 **修改** 按钮
5. 配置以下域名：

#### request 合法域名（必需）

用于 `wx.request` API 调用后端接口：

```
https://your-domain.com
```

**示例**：
- 开发环境：`https://localhost:3000`（本地开发不支持，需要用内网穿透）
- 测试环境：`https://preview.your-domain.com`
- 生产环境：`https://your-domain.com`

**⚠️ 注意事项**：
- 必须是 **HTTPS** 协议（小程序要求）
- 不能包含端口号（如 `:3000`）
- 不能使用 `localhost` 或 `127.0.0.1`
- 本地开发需要使用内网穿透工具（如 ngrok、natapp）

#### socket 合法域名（可选）

如果使用 WebSocket：

```
wss://your-domain.com
```

#### uploadFile 合法域名（可选）

如果上传文件：

```
https://your-domain.com
```

#### downloadFile 合法域名（可选）

如果下载文件：

```
https://your-domain.com
```

### 2. 配置业务域名（可选）

如果小程序内嵌 H5 页面，需要配置业务域名。

**步骤**：
1. 进入 **开发** → **开发管理** → **开发设置**
2. 找到 **业务域名** 部分
3. 点击 **添加**，输入域名
4. 下载验证文件，上传到服务器根目录

### 3. 配置不校验合法域名（开发时）

**⚠️ 仅用于开发调试，不要在生产环境使用！**

在微信开发者工具中：
1. 打开 **设置** → **项目设置**
2. 勾选 **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**
3. 这样可以在本地开发时跳过域名校验

## 🔧 微信开发者工具配置

### 1. 导入项目

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 选择 **导入项目**
3. 选择项目目录：`miniprogram/` 文件夹
4. 填写 AppID：输入测试号的 AppID
5. 项目名称：`i-am-smart-miniprogram`
6. 点击 **导入**

### 2. 配置 AppID

**方式一：在 `project.config.json` 中配置**

```json
{
  "appid": "wx1234567890abcdef",
  "projectname": "i-am-smart-miniprogram"
}
```

**方式二：在开发者工具中配置**

1. 点击右上角 **详情**
2. 在 **本地设置** 中填写 AppID
3. 或者在 **项目设置** 中修改

### 3. 启用 TypeScript 编译

1. 点击右上角 **详情**
2. 在 **本地设置** 中勾选 **启用 TypeScript 编译**
3. 工具会自动编译 `.ts` 文件为 `.js`

### 4. 不校验合法域名（开发时）

1. 点击右上角 **详情**
2. 在 **本地设置** 中勾选 **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**
3. 这样可以在本地开发时调用本地 API

## 📝 本地开发配置

### 1. 使用内网穿透（推荐）

由于小程序不能使用 `localhost`，需要使用内网穿透工具：

#### 使用 ngrok

```bash
# 安装 ngrok
brew install ngrok  # macOS
# 或下载：https://ngrok.com/download

# 启动内网穿透
ngrok http 3000

# 会得到一个公网地址，如：
# https://abc123.ngrok.io -> http://localhost:3000
```

#### 使用 natapp

```bash
# 下载 natapp：https://natapp.cn/
# 注册账号，获取免费隧道

# 启动
./natapp -authtoken=your_token -subdomain=your_subdomain
```

### 2. 配置 API 地址

在 `miniprogram/app.ts` 中：

```typescript
const APP_CONFIG = {
  // 使用内网穿透地址
  API_BASE_URL: 'https://abc123.ngrok.io', // 替换为你的内网穿透地址
  
  // 或者使用测试服务器地址
  // API_BASE_URL: 'https://preview.your-domain.com',
};
```

### 3. 配置环境变量

在 `.env.local` 中：

```bash
# 小程序测试号配置
WECHAT_MINIPROGRAM_APP_ID=wx1234567890abcdef  # 测试号 AppID
WECHAT_MINIPROGRAM_APP_SECRET=your_test_app_secret  # 测试号 AppSecret（如果有）
```

## ✅ 配置检查清单

### 微信公众平台
- [ ] 注册小程序测试号
- [ ] 获取 AppID
- [ ] 获取 AppSecret（可选）
- [ ] 配置 request 合法域名（后端 API 地址）
- [ ] 配置 socket 合法域名（如果使用 WebSocket）
- [ ] 配置 uploadFile 合法域名（如果上传文件）

### 微信开发者工具
- [ ] 导入项目（选择 `miniprogram/` 目录）
- [ ] 配置 AppID（测试号 AppID）
- [ ] 启用 TypeScript 编译
- [ ] 勾选"不校验合法域名"（开发时）

### 本地开发环境
- [ ] 配置 `.env.local`（AppID 和 AppSecret）
- [ ] 配置 `miniprogram/app.ts`（API 地址）
- [ ] 配置 `miniprogram/project.config.json`（AppID）
- [ ] 启动内网穿透（如果需要本地开发）

### 后端配置
- [ ] 配置 GitHub Secrets（如果部署）
- [ ] 确保后端 API 使用 HTTPS
- [ ] 确保后端 API 地址与小程序配置的域名一致

## 🔍 常见问题

### Q1: 为什么不能使用 localhost？

**A**: 小程序安全策略要求使用 HTTPS，且不能使用 `localhost` 或 `127.0.0.1`。需要使用内网穿透工具。

### Q2: 测试号和正式号有什么区别？

**A**: 
- 测试号：无需认证，快速开始，但功能有限
- 正式号：需要认证，功能完整，可以发布上线

### Q3: 可以不配置合法域名吗？

**A**: 
- 开发时：可以在开发者工具中勾选"不校验合法域名"
- 生产环境：必须配置合法域名

### Q4: AppSecret 是必需的吗？

**A**: 
- 如果使用后端登录 API（`/api/auth/miniprogram/login`），需要 AppSecret
- 如果只用前端功能，不需要 AppSecret

### Q5: 如何测试小程序登录？

**A**: 
1. 确保后端 API 已配置 AppID 和 AppSecret
2. 在小程序中调用 `wx.login()` 获取 code
3. 调用 `/api/auth/miniprogram/login` 接口
4. 检查返回的 access_token

## 📚 相关文档

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [服务器域名配置](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/devtools.html)
