# 背它一辈子 - 微信小程序

这是 "背它一辈子" 应用的微信小程序版本。

## 📋 项目结构

```
miniprogram/
├── app.ts              # 小程序入口
├── app.json            # 小程序配置
├── pages/              # 页面目录
│   ├── index/         # 学习页面（首页）
│   ├── review/        # 复习页面
│   ├── stats/         # 统计页面
│   └── settings/      # 设置页面
├── utils/              # 工具函数
│   ├── api.ts         # API 调用封装
│   ├── auth.ts         # 认证相关
│   └── storage.ts      # 本地存储
└── project.config.json # 小程序项目配置
```

## 🚀 开发指南

### 1. 注册小程序测试号（推荐）

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号（个人或企业）
3. 获取 AppID 和 AppSecret

详细步骤见：[测试号配置指南](../docs/miniprogram-test-account-setup.md)

### 2. 配置小程序 AppID

**方式一：在 `project.config.json` 中配置**

```json
{
  "appid": "wx1234567890abcdef"
}
```

**方式二：在微信开发者工具中配置**

1. 打开微信开发者工具
2. 点击右上角 **详情** → **项目设置**
3. 填写 AppID

### 3. 配置 API 地址

在 `app.ts` 中设置 API 基础地址：

```typescript
const APP_CONFIG = {
  // 开发时：使用内网穿透地址（如 ngrok）
  // API_BASE_URL: 'https://abc123.ngrok.io',
  
  // 测试/生产时：使用实际域名
  API_BASE_URL: 'https://your-domain.com',
};
```

**⚠️ 注意**：
- 小程序不能使用 `localhost`，需要使用内网穿透工具
- 必须使用 HTTPS 协议
- 域名需要在微信公众平台配置为合法域名

### 4. 配置微信公众平台

1. 登录小程序管理后台
2. 进入 **开发** → **开发管理** → **开发设置**
3. 配置 **服务器域名** → **request 合法域名**
4. 添加你的后端 API 域名（如 `https://your-domain.com`）

详细配置见：[测试号配置指南](../docs/miniprogram-test-account-setup.md)

### 3. 环境变量

确保后端 API 已配置以下环境变量：

```bash
WECHAT_MINIPROGRAM_APP_ID=你的小程序AppID
WECHAT_MINIPROGRAM_APP_SECRET=你的小程序AppSecret
```

### 4. 使用微信开发者工具

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 选择 "导入项目"
3. 选择 `miniprogram/` 目录
4. 输入 AppID（或使用测试号）
5. 开始开发

## 📱 功能说明

### 学习页面（首页）
- 显示待复习的卡片列表
- 选择学习等级（A1-C2）
- 显示今日已复习数量
- 点击卡片进入复习页面

### 复习页面
- 显示卡片详情
- 选择复习质量评分（0-5）
- 提交复习结果

### 统计页面
- 显示总卡片数、已掌握、学习中、新卡片
- 显示连续复习天数
- 显示最后复习日期

### 设置页面
- 设置学习等级
- 设置每日复习上限
- 退出登录

## 🔧 开发命令

```bash
# TypeScript 类型检查
npm run type-check:miniprogram
```

## 📝 注意事项

1. **API 地址配置**：确保 `app.ts` 中的 `API_BASE_URL` 指向正确的后端地址
2. **小程序域名配置**：在微信公众平台配置 request 合法域名
3. **登录流程**：小程序启动时会自动尝试登录，如果失败会提示用户
4. **Token 刷新**：API 调用会自动处理 token 过期和刷新

## 🔗 相关文档

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [小程序 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [TypeScript 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/edit.html#TypeScript)
