# 小程序开发指南

## TypeScript 编译

小程序使用 TypeScript 开发，需要将 `.ts` 文件编译为 `.js` 文件才能在微信开发者工具中运行。

### 手动编译

```bash
npm run build:miniprogram
```

### 自动监听编译（推荐）

启动文件监听器，当 TypeScript 文件发生变化时自动编译：

```bash
npm run watch:miniprogram
```

这个命令会：
- 监听 `apps/miniprogram/` 目录下所有 `.ts` 文件的变化
- 自动编译修改的文件为对应的 `.js` 文件
- 保持运行状态，直到手动停止（Ctrl+C）

### 开发流程

1. 启动监听器：
   ```bash
   npm run watch:miniprogram
   ```

2. 在另一个终端或编辑器中修改 TypeScript 文件

3. 保存文件后，监听器会自动编译

4. 在微信开发者工具中刷新页面查看效果

### 注意事项

- 监听器会持续运行，占用一个终端窗口
- 如果编译出错，监听器会显示错误信息但继续运行
- 修改文件后，监听器会自动重新编译
- 编译后的 `.js` 文件会被 gitignore 忽略，不会提交到仓库
