# 陪练本（Web）

家长课后英语巩固：词汇热身 → 看图说话（固定问题库）→ 口头巩固。素材来自仓库内 KET 闪卡图。

## 本地运行

```bash
cd web
npm install
npm run dev
```

复制 `.env.example` 为 `.env.local`，填入 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。首页可点「连接并同步云端」。

## 构建 / 发布

```bash
npm run build
```

生产环境把 `web/dist` 发到 **Netlify**（见仓库根目录 `netlify.toml`）。Supabase 只同步词包，不托管网页。

问题库（框架）在 `src/data/questions.ts`；词包（内容）在 `src/content/`，格式说明见 `public/content/README.md`。
