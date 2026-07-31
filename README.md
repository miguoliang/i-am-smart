# 闪卡英雄

原生 iOS 英语闪卡 App，基于 CEFR 词库与 SM-2 间隔重复算法。词库打包在 App 内，免登录，打开即用。

## 功能

- **学习**：翻转闪卡，「不会 / 会了」两档评分，SM-2 自动调度复习
- **统计**：总词量、已掌握、学习中、今日待复习、30 天热力图
- **设置**：考试目标（KET / PET·四级 / 六级 / 雅思·托福）、每日复习上限、美音/英音

## 技术栈

- Swift 5.9+ / SwiftUI
- SwiftData（本地持久化）
- iOS 17.0+
- 无第三方依赖

## 开发

```bash
# 在 Xcode 中打开
open ShankaHero.xcodeproj

# 命令行构建与测试
xcodebuild -scheme ShankaHero \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  build test
```

## 项目结构

```
ShankaHero/           # App 源码
ShankaHeroTests/      # 单元测试（SM-2、待复习调度）
ShankaHero.xcodeproj
web/                  # 纯前端「词图三消」网页游戏（GitHub Pages）
printables/           # KET 闪卡打印贴纸素材
```

词库文件位于 `ShankaHero/Resources/Vocabulary/`（cefr-a1.json … cefr-c2.json，共 6784 词条）。

## 网页游戏（词图三消）

用 KET 贴纸图 + 英文单词做的学习向三消：同一词条的图片格与英文格可互消。

```bash
cd web && npm install && npm run dev
```

合并到 `main` 后可由 `.github/workflows/deploy-web.yml` 部署到 GitHub Pages（需在仓库 Settings → Pages 选择 GitHub Actions）。详见 `web/README.md`。

## 许可证

MIT — 见 [LICENSE](LICENSE)
