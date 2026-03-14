# 本地环境变量

本地调试时，环境变量从哪里读？

- **推荐**：在 **项目根目录** 放 `.env.local`，Next.js（PWA）会在启动时自动加载根目录的 `.env.local`。
- **备选**：在 `apps/pwa/` 下放 `.env.local` 或 `.env.development.local`，Next 会按 [官方优先级](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) 加载。

根目录的 `.env.local` 通过 `next.config.ts` 里的 dotenv 在配置阶段加载，和 `apps/pwa/` 下的 `.env*` 一起生效（根目录先加载，同 key 时以 Next 后加载的为准）。

安装依赖后需重启一次 `pnpm dev`，环境变量才会生效。
