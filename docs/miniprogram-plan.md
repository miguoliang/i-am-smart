# 小程序集成计划

## 📋 概述

在现有 Next.js 项目中集成微信小程序，采用 monorepo 结构，共享 API 和业务逻辑。

## 🏗️ 项目结构

```
i-am-smart/
├── src/                    # Next.js Web 应用
│   ├── app/
│   ├── lib/
│   └── ...
├── miniprogram/            # 微信小程序（新增）
│   ├── app.json           # 小程序配置
│   ├── app.ts             # 小程序入口
│   ├── pages/             # 页面
│   │   ├── index/         # 首页（学习）
│   │   ├── review/        # 复习页面
│   │   ├── stats/         # 统计页面
│   │   └── settings/      # 设置页面
│   ├── components/        # 组件
│   ├── utils/             # 工具函数
│   │   ├── api.ts         # API 调用封装
│   │   ├── auth.ts        # 认证相关
│   │   └── storage.ts     # 本地存储
│   ├── types/             # TypeScript 类型定义
│   └── project.config.json # 小程序项目配置
├── shared/                 # 共享代码（新增）
│   ├── types/             # 共享类型定义
│   │   ├── api.ts         # API 响应类型
│   │   ├── card.ts        # 卡片类型
│   │   └── user.ts        # 用户类型
│   └── constants/         # 共享常量
│       └── levels.ts      # 等级常量
├── package.json           # 根 package.json（workspace）
└── ...
```

## 🛠️ 技术选型

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **原生小程序** | • 性能最佳<br>• 官方支持<br>• 无额外依赖 | • 需要单独维护<br>• 代码复用率低 | ⭐⭐⭐⭐⭐ |
| **Taro** | • React 语法<br>• 多端统一 | • 学习成本<br>• 包体积大 | ⭐⭐⭐ |
| **uni-app** | • Vue 语法<br>• 生态丰富 | • 与 Next.js 技术栈不一致 | ⭐⭐ |

### 推荐方案：原生小程序

**理由：**
1. 性能最优，用户体验好
2. 官方支持，文档完善
3. 与 Next.js 项目独立，互不影响
4. 可以通过 `shared/` 目录共享类型和常量

## 📦 代码共享策略

### 1. 类型定义共享

```typescript
// shared/types/api.ts
export interface ApiResponse<T> {
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// shared/types/card.ts
export interface Card {
  id: number;
  name: string;
  description: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  // ...
}
```

### 2. 常量共享

```typescript
// shared/constants/levels.ts
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const DAILY_REVIEW_LIMIT = 20;
```

### 3. API 端点共享

```typescript
// shared/constants/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://your-domain.com';

export const API_ENDPOINTS = {
  CARDS_DUE: '/api/cards/due',
  CARD_REVIEW: '/api/cards/:id/review',
  ACCOUNTS_ME: '/api/accounts/me',
  STATS: '/api/stats',
  MINIPROGRAM_LOGIN: '/api/auth/miniprogram/login',
} as const;
```

## 🔧 开发工具配置

### 1. TypeScript 配置

```json
// miniprogram/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "CommonJS",
    "lib": ["ES2017"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. 小程序项目配置

```json
// miniprogram/project.config.json
{
  "description": "聪明的背单词工具小程序",
  "packOptions": {
    "ignore": [
      "node_modules",
      ".git",
      "tsconfig.json"
    ]
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.5.0",
  "appid": "your-miniprogram-appid",
  "projectname": "i-am-smart-miniprogram",
  "condition": {}
}
```

### 3. 小程序 app.json

```json
{
  "pages": [
    "pages/index/index",
    "pages/review/review",
    "pages/stats/stats",
    "pages/settings/settings"
  ],
  "window": {
    "navigationBarTitleText": "聪明的背单词工具",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "学习"
      },
      {
        "pagePath": "pages/stats/stats",
        "text": "统计"
      },
      {
        "pagePath": "pages/settings/settings",
        "text": "设置"
      }
    ]
  },
  "networkTimeout": {
    "request": 10000
  }
}
```

## 📱 小程序核心功能

### 1. 认证流程

```typescript
// miniprogram/utils/auth.ts
import { API_BASE_URL, API_ENDPOINTS } from '@shared/constants/api';

export async function login(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            const response = await wx.request({
              url: `${API_BASE_URL}${API_ENDPOINTS.MINIPROGRAM_LOGIN}`,
              method: 'POST',
              data: { code: res.code },
            });
            
            const { access_token } = response.data.data;
            wx.setStorageSync('access_token', access_token);
            resolve(access_token);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('获取 code 失败'));
        }
      },
      fail: reject,
    });
  });
}
```

### 2. API 调用封装

```typescript
// miniprogram/utils/api.ts
import { API_BASE_URL } from '@shared/constants/api';
import type { ApiResponse } from '@shared/types/api';

export async function request<T>(
  endpoint: string,
  options: WechatMiniprogram.RequestOption = {}
): Promise<T> {
  const token = wx.getStorageSync('access_token');
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const response = res.data as ApiResponse<T>;
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.data);
          }
        } else if (res.statusCode === 401) {
          // Token 过期，重新登录
          login().then(() => {
            // 重试请求
            request<T>(endpoint, options).then(resolve).catch(reject);
          }).catch(reject);
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: reject,
    });
  });
}
```

### 3. 页面结构示例

```typescript
// miniprogram/pages/index/index.ts
import { request } from '../../utils/api';
import { API_ENDPOINTS } from '@shared/constants/api';
import type { Card } from '@shared/types/card';

Page({
  data: {
    cards: [] as Card[],
    loading: false,
  },

  onLoad() {
    this.loadCards();
  },

  async loadCards() {
    this.setData({ loading: true });
    try {
      const cards = await request<Card[]>(API_ENDPOINTS.CARDS_DUE);
      this.setData({ cards, loading: false });
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },
});
```

## 🚀 构建和部署

### 1. 开发流程

```bash
# 安装依赖（根目录）
npm install

# 开发 Next.js（终端 1）
npm run dev

# 开发小程序（终端 2）
# 使用微信开发者工具打开 miniprogram/ 目录
```

### 2. 构建脚本

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:miniprogram": "echo '小程序无需构建，直接上传到微信平台'",
    "type-check": "tsc --noEmit",
    "type-check:miniprogram": "cd miniprogram && tsc --noEmit"
  }
}
```

### 3. CI/CD 集成

小程序不需要 CI/CD 构建，但可以添加：
- TypeScript 类型检查
- 代码格式检查（如果需要）
- 上传到微信平台（可选，需要微信 CLI 工具）

## 📝 实施步骤

### Phase 1: 项目结构搭建
- [ ] 创建 `miniprogram/` 目录
- [ ] 创建 `shared/` 目录
- [ ] 配置 TypeScript
- [ ] 配置小程序项目文件（`app.json`, `project.config.json`）

### Phase 2: 基础功能
- [ ] 实现认证流程（登录 API）
- [ ] 实现 API 调用封装
- [ ] 实现本地存储工具
- [ ] 创建基础页面结构

### Phase 3: 核心功能
- [ ] 实现卡片列表页面
- [ ] 实现复习页面
- [ ] 实现统计页面
- [ ] 实现设置页面

### Phase 4: 优化和测试
- [ ] 错误处理优化
- [ ] 加载状态优化
- [ ] 用户体验优化
- [ ] 测试和调试

## 🔐 环境变量

需要在 `.env.local` 和 GitHub Secrets 中添加：

```bash
# 小程序配置
WECHAT_MINIPROGRAM_APP_ID=你的小程序AppID
WECHAT_MINIPROGRAM_APP_SECRET=你的小程序AppSecret
```

## 📚 参考资料

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信小程序 TypeScript 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/edit.html#TypeScript)
- [小程序 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/)

## ❓ 待决策事项

1. **小程序 AppID**：需要先在微信公众平台注册小程序
2. **小程序名称**：是否与 Web 应用名称一致？
3. **功能范围**：小程序是否需要包含所有 Web 功能，还是简化版？
4. **支付功能**：小程序是否也需要支付功能？（需要小程序支付配置）
