# 词图三消

纯前端英语学习小游戏：用 KET 闪卡图片玩三消，顺带认英文。打开即玩，无需登录。

## 玩法

- 相邻交换，横向 / 纵向 ≥3 个相同词条即可消除（棋盘为图片格）
- 四连出火箭、五连或 L/T 出炸弹；特效可连锁
- 连击 x3+ 加步；完成目标后有机会看图选英文再加步
- 消除时显示中英对照并朗读英文
- MVP 主题：食物（8 词）

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

### 首次启用 GitHub Pages（必做一次）

当前仓库若未开启 Pages，部署会在 deploy 阶段 404。请仓库管理员：

1. 打开 [Settings → Pages](https://github.com/miguoliang/i-am-smart/settings/pages)
2. **Build and deployment → Source** 选 **GitHub Actions**
3. 若仓库是 **private**：需要 GitHub Pro/Team，或把仓库改为 **public**（免费可用 Pages）
4. 到 Actions 里重新运行 **Deploy web game to GitHub Pages**

预期地址：`https://miguoliang.github.io/i-am-smart/`（若配置了自定义域名则走该域名）。

## 项目结构

```
web/          # 网页游戏（Vite + TypeScript）
data/         # CEFR 词库 JSON
printables/   # KET 闪卡贴纸素材（图片源）
```

## 许可证

MIT — 见 [LICENSE](LICENSE)
