# 陪练本（Web）

家长课后英语巩固：词汇热身 → 开口练习（按词性套问句）→ 口头巩固。词包在网页里编辑，不用改 JSON。

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

生产环境由 Netlify 读取仓库根目录 `netlify.toml` 构建。站点环境变量需要 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。Supabase 只同步词包，不托管网页。

问题库（框架）在 `src/data/questions.ts`；词包（内容）在 `src/content/`，格式说明见 `public/content/README.md`。
