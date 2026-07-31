# 词图三消（Web）

纯前端学习向三消：同一词条的 **图片格** 与 **英文格** 可以连消。素材来自仓库内 KET 闪卡贴纸图。

## 本地运行

```bash
cd web
npm install
npm run dev
```

## 构建

```bash
cd web
npm run build
```

产物在 `web/dist/`。GitHub Pages 的 `base` 已设为 `/i-am-smart/`（见 `vite.config.ts`）。

## 玩法（MVP）

- 主题：食物（8 词）
- 相邻交换，横向/纵向 ≥3 个相同 `wordId` 消除（图与英文互通）
- 每消一组弹出中英对照并朗读英文
- 目标：每个词收集 2 组，28 步内过关
