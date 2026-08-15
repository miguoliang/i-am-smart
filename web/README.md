# 陪练本（Web）

家长课后英语巩固：一课一份。上课记下词和句子；课后可分科巩固，也可以综合巩固。

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

生产环境由 Netlify 读取仓库根目录 `netlify.toml` 构建。站点环境变量需要 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。Supabase 只同步课包，不托管网页。

问题库（框架）在 `src/data/questions.ts`；课包（内容）在 `src/content/`，格式说明见 `public/content/README.md`。
