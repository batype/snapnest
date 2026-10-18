# 参与拾光 SnapNest

欢迎提交问题和改进。请先说明使用场景、复现步骤、浏览器或 Node.js 版本，并使用脱敏截图。

```sh
npm ci
npm test
npm run build
npm run dev
```

网页位于 `dist/`，是直接维护的应用源文件，无需打包框架。Node API 位于 `node/`，CLI 位于 `bin/`。`dist/core.mjs` 是双方共享的布局逻辑；修改时请同时验证浏览器布局和 Node 导出。

请保持图片在本地处理，不引入截图上传或静默统计。涉及图像处理的改动请覆盖：横图、竖图、画布比例、EXIF 方向和实心遮挡导出。提交前运行 `npm test`、`npm run build` 和 `git diff --check`。

PR 会自动运行测试；只有合入 main 才会部署 GitHub Pages。npm 发布不会自动执行。
