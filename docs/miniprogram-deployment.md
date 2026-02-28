# 小程序部署指南

## 📋 概述

小程序部署流程与 Web 应用不同：
- **Web 应用**：代码部署到服务器
- **小程序**：代码上传到微信平台，通过微信公众平台管理

## 🚀 部署流程

### 1. 准备部署

#### 1.1 确保配置正确

检查以下配置：

- ✅ `apps/miniprogram/config.ts` - API 地址和 AppID 已配置
- ✅ `apps/miniprogram/project.config.json` - AppID 已配置
- ✅ 后端 API 正常运行（`https://preview.iamsmart.top`）
- ✅ 微信公众平台已配置 request 合法域名

#### 1.2 构建配置（如果需要）

如果使用环境变量生成配置：

```bash
# 设置环境变量
export NEXT_PUBLIC_APP_ORIGIN=https://preview.iamsmart.top
export WECHAT_MINIPROGRAM_APP_ID=wxe3af85edd5fae27f

# 生成配置文件
npm run build:miniprogram-config
```

#### 1.3 类型检查（可选）

```bash
npm run type-check:miniprogram
```

### 2. 在微信开发者工具中上传

#### 2.1 打开项目

1. 打开微信开发者工具
2. 导入项目：选择 `apps/miniprogram/` 目录
3. 确认 AppID：`wxe3af85edd5fae27f`

#### 2.2 预览测试

1. 点击工具栏的 **预览** 按钮
2. 用微信扫码在手机上测试
3. 确认功能正常

#### 2.3 上传代码

1. 点击工具栏的 **上传** 按钮
2. 填写版本号（如：`1.0.0`）
3. 填写项目备注（可选，如：`初始版本`）
4. 点击 **上传**

**⚠️ 注意**：
- 版本号格式：`主版本号.次版本号.修订号`（如：`1.0.0`）
- 每次上传都会生成一个新版本
- 上传后代码会保存到微信平台，但不会立即发布

### 3. 在微信公众平台管理版本

#### 3.1 登录管理后台

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 登录小程序账号
3. 进入 **版本管理**

#### 3.2 查看上传的版本

在 **开发版本** 中可以看到刚才上传的代码版本。

#### 3.3 提交审核（可选，用于正式发布）

如果需要发布到线上供用户使用：

1. 点击 **提交审核**
2. 填写审核信息：
   - **服务类目**：选择小程序的服务类目（如：教育、工具等）
   - **标签**：添加标签便于搜索
   - **功能页面**：选择主要功能页面
   - **版本描述**：描述本次更新的内容
3. 提交审核

**⚠️ 注意**：
- 审核通常需要 1-7 个工作日
- 审核通过后才能发布到线上
- 测试号通常不需要审核，可以直接体验

#### 3.4 发布版本（正式环境）

审核通过后：

1. 在 **审核版本** 中找到审核通过的版本
2. 点击 **发布**
3. 确认发布

发布后，用户就可以在微信中搜索并使用你的小程序了。

### 4. 体验版（推荐用于测试）

#### 4.1 设置为体验版

1. 在 **版本管理** → **开发版本**
2. 点击 **选为体验版**
3. 设置体验人员（最多 40 人）

#### 4.2 分享体验版

体验版可以通过链接分享给测试人员，无需审核。

## 📝 部署检查清单

### 代码准备
- [ ] 配置文件已生成（`apps/miniprogram/config.ts`）
- [ ] AppID 已配置（`project.config.json`）
- [ ] API 地址已配置（`config.ts`）
- [ ] TypeScript 类型检查通过（可选）

### 微信公众平台配置
- [ ] request 合法域名已配置（`https://preview.iamsmart.top`）
- [ ] AppID 和 AppSecret 已获取
- [ ] 后端环境变量已配置（`WECHAT_MINIPROGRAM_APP_ID` 和 `WECHAT_MINIPROGRAM_APP_SECRET`）

### 上传和发布
- [ ] 在微信开发者工具中预览测试通过
- [ ] 代码已上传到微信平台
- [ ] 版本已设置为体验版（测试）或提交审核（正式）

## 🔄 更新流程

### 日常更新

1. **修改代码**
2. **生成配置**（如果使用环境变量）：
   ```bash
   npm run build:miniprogram-config
   ```
3. **在开发者工具中测试**
4. **上传新版本**（版本号递增，如：`1.0.1`）
5. **设置为体验版**或**提交审核**

### 版本号规范

建议使用语义化版本号：
- `主版本号.次版本号.修订号`（如：`1.0.0`）
- 重大更新：`2.0.0`
- 新功能：`1.1.0`
- Bug 修复：`1.0.1`

## 🎯 不同环境的配置

### 开发环境（本地）

```typescript
// apps/miniprogram/config.ts
API_BASE_URL: 'https://preview.iamsmart.top'
```

### 测试环境（体验版）

```typescript
// apps/miniprogram/config.ts
API_BASE_URL: 'https://preview.iamsmart.top'
```

### 生产环境（正式版）

```typescript
// apps/miniprogram/config.ts
API_BASE_URL: 'https://www.iamsmart.top'
```

**切换方式**：
1. 修改环境变量 `NEXT_PUBLIC_APP_ORIGIN`
2. 运行 `npm run build:miniprogram-config`
3. 上传新版本

## ⚠️ 注意事项

1. **域名配置**：
   - 每个环境都需要在微信公众平台配置对应的 request 合法域名
   - 生产环境必须配置 `https://www.iamsmart.top`

2. **版本管理**：
   - 每次上传都会创建新版本，不会覆盖旧版本
   - 可以回退到之前的版本

3. **审核要求**：
   - 正式发布需要审核
   - 体验版不需要审核，但只能分享给最多 40 人

4. **代码大小限制**：
   - 小程序代码包大小不能超过 2MB
   - 如果超过，需要使用分包加载

5. **API 域名限制**：
   - 最多配置 20 个 request 合法域名
   - 必须是 HTTPS 协议

## 📚 相关文档

- [微信小程序发布流程](https://developers.weixin.qq.com/apps/miniprogram/dev/framework/release.html)
- [小程序版本管理](https://developers.weixin.qq.com/apps/miniprogram/dev/framework/release/version.html)
- [小程序审核指南](https://developers.weixin.qq.com/apps/miniprogram/dev/framework/release/audit.html)
