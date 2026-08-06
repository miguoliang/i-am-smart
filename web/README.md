# 词图三消（Web）

纯前端学习向三消：用食物图片消消乐，顺便认英文。素材来自仓库内 KET 闪卡贴纸图。

## 本地运行

```bash
cd web
npm install
npm run dev
```

## 构建

```bash
cd web
npm run build
```

产物在 `web/dist/`。GitHub Pages 的 `base` 已设为 `/i-am-smart/`（见 `vite.config.ts`）。

首次部署前需在仓库 Settings → Pages 将 Source 设为 **GitHub Actions**（private 仓库还需 Pro/Team，或改为 public）。详见根目录 `README.md`。

## 接近原生体验

- 支持添加到手机主屏幕（PWA / standalone）
- 禁止页面橡皮筋滚动抢手势
- 消除时轻微震动反馈（支持的手机）
- 离线可打开最近缓存的页面壳

## 玩法

- 主题：食物（8 词），棋盘为图片格
- 相邻交换，横向/纵向 ≥3 相同词消除
- **四连** → 火箭（清一行或一列）；**五连 / L·T** → 炸弹（清周围 3×3）；特效可连锁
- **连击 x3+** → +1 步
- 完成一个收集目标后，有机会出现 **看图选英文** 加步挑战（+2 步）
- 每消一组弹出中英对照并朗读英文；过关后点图复习发音
- 目标：每个词收集 3 组，28 步内过关

