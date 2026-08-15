# 陪练本（I Am Smart）

家长课后英语巩固工具：**框架**（看图说话 + 固定问句 + 词汇流程）与**内容**（词包）解耦。打开即用，无需登录。

## 为什么做这个

外教课故事会换，但问句和句型几乎不变。每周两三节、每节约 20 分钟不够形成能力——**课程给框架，课后专项巩固才是效果基础**。不同机构 / 老师教材不同，所以词包必须可替换。

V1 面向家长陪练：

1. **词汇热身** — 看图、听读、认中英  
2. **看图说话** — 固定问题库（问句不变，只换图和词）  
3. **口头巩固** — 遮词提问 → 揭晓 → 套句型  

内容侧支持：**导入 JSON 词包**、**本机新建词包**、导出 / 删除；可选 **Supabase 云端同步**（IndexedDB 本地缓存 + 云端备份）。格式见 `web/public/content/README.md`。

### Supabase（可选）

环境变量见 `web/.env.example`。应用库表：

```bash
# 需要 SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF
node scripts/apply-supabase-schema.mjs
```

并在 Dashboard → Authentication → Providers 开启 **Anonymous** 登录。

## 本地运行

```bash
cd web
npm install
npm run dev
```

浏览器打开带 `/i-am-smart/` 路径的本地地址（见 Vite 终端输出）。

## 构建与部署

```bash
cd web
npm run build
```

产物在 `web/dist/`。推到 `main`（或手动 Run workflow）后由 `.github/workflows/deploy-web.yml` 部署。

## 项目结构

```
web/
  src/content/   # 词包类型、校验、内置示例、本机存储
  src/data/      # 框架层：看图说话问题库
  src/practice/  # TTS / viewport
  public/content # 词包格式说明与示例 JSON
data/            # CEFR 词库 JSON（素材层）
printables/      # KET 闪卡贴纸素材
```
