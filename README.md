# 陪练本（I Am Smart）

家长课后英语巩固工具：把外教课里稳定的骨架（看图说话 + 固定问句 + 词汇）变成可照着练的流程。打开即用，无需登录。

## 为什么做这个

外教课故事会换，但问句和句型几乎不变。每周两三节、每节约 20 分钟不够形成能力——**课程给框架，课后专项巩固才是效果基础**。

V1 面向家长陪练，先做：

1. **词汇热身** — 看图、听读、认中英  
2. **看图说话** — 固定问题库（问句不变，只换图和词）  
3. **口头巩固** — 遮词提问 → 揭晓 → 套句型再说一遍  

故事 Q&A / retell、老师备课出课后续再做。

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

预期地址：`https://miguoliang.github.io/i-am-smart/`。

## 项目结构

```
web/          # 陪练本网页（Vite + TypeScript）
  src/data/   # 词包、看图说话问题库
  src/practice/
data/         # CEFR 词库 JSON（素材层）
printables/   # KET 闪卡贴纸素材（图片源）
```

旧版「词图三消」游戏代码仍留在 `web/src/game/`，当前入口已改为陪练本。
