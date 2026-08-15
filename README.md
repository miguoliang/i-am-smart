# 陪练本（I Am Smart）

家长课后英语巩固工具：**框架**（开口练习 + 固定问句 + 词汇流程）与**内容**（词包）解耦。打开即用，无需登录。

## 为什么做这个

外教课故事会换，但问句和句型几乎不变。每周两三节、每节约 20 分钟不够形成能力——**课程给框架，课后专项巩固才是效果基础**。不同机构 / 老师教材不同，所以词包必须可替换。

V1 面向家长陪练：

1. **词汇热身** — 看图或看词、听读、认中英  
2. **开口练习** — 固定问题库（名词看图，动词问动作，形容词问描述）  
3. **口头巩固** — 遮词提问 → 揭晓 → 套句型  

内容侧支持：网页里**新建 / 编辑词包**（不用改 JSON）、导入备份、导出 / 删除；**Supabase** 同步自定义词包。格式见 `web/public/content/README.md`。

## 本地运行

```bash
cd web
cp .env.example .env.local   # 填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

浏览器打开 Vite 给出的本地地址（默认 `/`）。

## 托管：Netlify（网页）+ Supabase（后端）

网页发到 **Netlify**。Supabase 只负责匿名登录、`lesson_packs` 和 `pack-images`，不托管 HTML。

### Netlify

在 Netlify 里 **Import 这个 GitHub 仓库** 即可，不需要 `NETLIFY_AUTH_TOKEN`。仓库根目录的 `netlify.toml` 会构建 `web/` 并发布 `web/dist`。

站点 **Environment variables**（要给 Builds 用）加上：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`（anon/publishable，不要放 service_role）

然后 **Trigger deploy**。生产分支用 `main`（或你在 Netlify 里选的分支）。

把自定义域名（例如 `www.iamsmart.top`）指到该站点后，把同一个 origin 加进 Supabase Auth 的 Redirect URLs；本地 Vite 已包含 `localhost:5173`。

### Supabase（词包同步）

```bash
# 建表 + 开匿名登录
node scripts/apply-supabase-schema.mjs
```

仓库 Secrets 里词包同步还需要：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 项目结构

```
web/            # 陪练本（Vite），发到 Netlify
  src/content/  # 词包类型、校验、内置示例、本机 + 云端存储
  src/data/     # 框架层：开口练习问题库（按词性）
  src/practice/
  public/cards  # 内置名词词包配图
supabase/       # 迁移（lesson_packs 等）
data/           # CEFR 词库 JSON（素材层，不进网页运行时）
```
