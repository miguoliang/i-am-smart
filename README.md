# 陪练本（I Am Smart）

家长课后英语巩固工具：**框架**（开口练习 + 固定问句 + 词汇 / 句子流程）与**内容**（一课一份课包）解耦。打开即用，无需登录。

## 为什么做这个

孩子上外教课，家长在旁边听。把这节课用到的词和句子记下来，一课一份，课后拿出来练。外教课故事会换，但问句和句型几乎不变——**课程给框架，课后专项巩固才是效果基础**。

V1 面向家长陪练：

1. **词汇热身** — 看图或看词、听读、认中英  
2. **开口练习** — 固定问题库（名词看图，动词问动作，形容词问描述）  
3. **课堂句子** — 跟读这节课记下的句子（有句子时）  
4. **口头巩固** — 遮词 / 遮句提问 → 揭晓 → 套句型  

课后陪练可以 **分科巩固**（只练词汇或只练句子，名词 / 动词 / 形容词也可单练），也可以 **综合巩固**（一节课的词句混着抽问，或把几节课混在一起练）。

内容侧支持：网页里**记一节课 / 编辑**（上课先记英文，中文课后可补）、导入备份、导出 / 删除；**Supabase** 同步自定义课包。格式见 `web/public/content/README.md`。

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
  src/content/  # 课包类型、校验、内置示例、本机 + 云端存储
  src/data/     # 框架层：开口练习问题库（按词性）
  src/practice/
  public/cards  # 内置名词配图
supabase/       # 迁移（lesson_packs 等）
data/           # CEFR 词库 JSON（素材层，不进网页运行时）
```
