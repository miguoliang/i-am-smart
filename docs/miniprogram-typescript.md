# 小程序 TypeScript 支持

微信小程序**完全支持 TypeScript**开发。本项目已配置好 TypeScript 支持。

## ✅ 已配置内容

### 1. TypeScript 配置文件

`miniprogram/tsconfig.json` 已配置：
- ✅ 目标版本：ES2017
- ✅ 模块系统：CommonJS（小程序标准）
- ✅ 严格模式：启用
- ✅ 小程序 API 类型：`miniprogram-api-typings`

### 2. 类型定义

需要在 `package.json` 中添加小程序类型定义包：

```bash
npm install --save-dev miniprogram-api-typings
```

## 📝 TypeScript 使用说明

### 1. 小程序 API 类型

所有微信小程序 API 都有完整的类型定义：

```typescript
// ✅ 有类型提示和检查
wx.login({
  success: (res) => {
    console.log(res.code); // TypeScript 知道 res.code 的类型
  },
  fail: (error) => {
    console.error(error.errMsg); // TypeScript 知道 error.errMsg 的类型
  },
});

// ✅ Page 和 Component 都有类型
Page({
  data: {
    name: 'test', // TypeScript 会检查类型
  },
  onLoad() {
    // 有完整的类型提示
  },
});
```

### 2. 自定义类型

项目中使用 TypeScript 定义的类型：

```typescript
// ✅ 从 shared 导入类型
import type { Card, DueCardsResult } from '@shared/types/card';
import type { LoginResponse } from '@shared/types/user';

// ✅ 使用类型
const cards: Card[] = [];
const result: DueCardsResult = await request('/api/cards/due');
```

### 3. 类型检查

运行类型检查：

```bash
npm run type-check:miniprogram
```

## 🔧 微信开发者工具配置

### 1. 启用 TypeScript 编译

在微信开发者工具中：
1. 打开项目设置
2. 勾选 "启用 TypeScript 编译"
3. 工具会自动编译 `.ts` 文件为 `.js`

### 2. 编辑器支持

推荐使用 VS Code 或 WebStorm：
- VS Code：安装 "微信小程序开发" 扩展
- WebStorm：内置小程序支持

## 📚 类型定义位置

### 小程序 API 类型
- 来源：`miniprogram-api-typings` 包
- 包含：`wx.*` 所有 API 的类型定义

### 项目自定义类型
- `shared/types/` - 共享类型定义
- `miniprogram/utils/*.ts` - 工具函数类型

## ⚠️ 注意事项

1. **文件扩展名**：小程序使用 `.ts` 而不是 `.tsx`（没有 JSX）
2. **模块系统**：必须使用 CommonJS（`module.exports` / `require`）
3. **编译**：微信开发者工具会自动编译 TypeScript
4. **类型检查**：开发时编辑器会显示类型错误，但不会阻止运行

## 🎯 示例

### 完整的类型化页面示例

```typescript
// pages/index/index.ts
import { request } from '../../utils/api';
import { API_ENDPOINTS } from '@shared/constants/api';
import type { DueCardsResult } from '@shared/types/card';
import type { Level } from '@shared/constants/levels';

Page<{
  cards: Card[];
  loading: boolean;
  level: Level;
}, {
  loadCards(): Promise<void>;
  onCardTap(e: WechatMiniprogram.TapEvent): void;
}>({
  data: {
    cards: [],
    loading: false,
    level: 'A1',
  },

  async loadCards() {
    // TypeScript 会检查类型
    const result: DueCardsResult = await request(API_ENDPOINTS.CARDS_DUE);
    this.setData({ cards: result.cards });
  },

  onCardTap(e: WechatMiniprogram.TapEvent) {
    // e 有完整的类型定义
    const cardId = e.currentTarget.dataset.id;
  },
});
```

## 📖 参考文档

- [微信小程序 TypeScript 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/edit.html#TypeScript)
- [miniprogram-api-typings](https://www.npmjs.com/package/miniprogram-api-typings)
