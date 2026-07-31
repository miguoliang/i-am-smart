# 词图三消

纯前端英语学习小游戏：用 KET 闪卡图片和英文单词玩三消。同一词条的图片格与英文格可以互消。打开即玩，无需登录。

## 玩法

- 相邻交换，横向 / 纵向 ≥3 个相同词条即可消除
- 图块与英文块属于同一词即可连消
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

产物在 `web/dist/`。推到 `main` 后由 `.github/workflows/deploy-web.yml` 部署到 GitHub Pages（仓库 Settings → Pages → Source 选 **GitHub Actions**）。

预期地址：`https://miguoliang.github.io/i-am-smart/`（若配置了自定义域名则走该域名）。

## 项目结构

```
web/          # 网页游戏（Vite + TypeScript）
data/         # CEFR 词库 JSON
printables/   # KET 闪卡贴纸素材（图片源）
```

## 许可证

MIT — 见 [LICENSE](LICENSE)
