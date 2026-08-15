# 陪练本（Web）

家长课后英语巩固：词汇热身 → 看图说话（固定问题库）→ 口头巩固。素材来自仓库内 KET 闪卡图。

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

## 使用

1. 选词包（食物 / 动物 / 日常事物）
2. 词汇热身：看图听读
3. 看图说话：家长照着固定英文问句问孩子（点问句可朗读）
4. 口头巩固：遮词提问 → 揭晓 → 套句型

问题库（框架）在 `src/data/questions.ts`；词包（内容）在 `src/content/`，格式说明见 `public/content/README.md`。
