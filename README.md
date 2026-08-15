# 陪练本（I Am Smart）

家长课后英语巩固工具：**框架**（看图说话 + 固定问句 + 词汇流程）与**内容**（词包）解耦。打开即用，无需登录。

## 为什么做这个

外教课故事会换，但问句和句型几乎不变。每周两三节、每节约 20 分钟不够形成能力——**课程给框架，课后专项巩固才是效果基础**。不同机构 / 老师教材不同，所以词包必须可替换。

V1 面向家长陪练：

1. **词汇热身** — 看图、听读、认中英  
2. **看图说话** — 固定问题库（问句不变，只换图和词）  
3. **口头巩固** — 遮词提问 → 揭晓 → 套句型  

内容侧支持：**导入 JSON 词包**、**本机新建词包**、导出 / 删除；**Supabase** 同时托管网页并同步自定义词包。格式见 `web/public/content/README.md`。

## 本地运行

```bash
cd web
cp .env.example .env.local   # 填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

浏览器打开 Vite 给出的本地地址（默认 `/`）。

## 托管到 Supabase

网页由 Edge Function `app` 输出 HTML，JS/CSS/闪卡图放在 Storage 桶 `site`。词包同步用表 `lesson_packs` 和桶 `pack-images`。

```bash
# 建表 + 开匿名登录
node scripts/apply-supabase-schema.mjs

# 构建并发布（需要上面四个环境变量）
node scripts/deploy-supabase-web.mjs
```

发布地址：`https://<project-ref>.supabase.co/functions/v1/app`

GitHub Actions（`.github/workflows/deploy-supabase.yml`）在推到 `main` 时做同样的发布。仓库 Secrets 需要：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`（anon/publishable，不要放 service_role）
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

## 项目结构

```
web/            # 陪练本（Vite）
  src/content/  # 词包类型、校验、内置示例、本机 + 云端存储
  src/data/     # 框架层：看图说话问题库
  src/practice/
  public/cards  # 内置词包配图
supabase/       # 迁移 + Edge Function
data/           # CEFR 词库 JSON（素材层，不进网页运行时）
printables/     # KET 闪卡贴纸素材
```
