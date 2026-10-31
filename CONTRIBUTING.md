# 维护与发行

仓库根目录就是 DevKit，保留 GitHub 初始化提交和原有 LICENSE。

## 文档

使用 Node.js 22 和 `npm ci --prefix docs` 安装锁定的依赖。`npm run build --prefix docs` 输出 `site/`。

`DESKTILE_DOCS_BASE` 控制部署前缀；本地离线文档默认 `/`，项目 Pages 使用 `/DeskTile-DevKit/`。保持中文、英文导航和原有组件实例对应。构建后运行：

```powershell
python tools/check_pages.py site --base /
```

Pages 工作流使用锁文件安装依赖，构建 151 页并检查本地资源地址。Pull Request 仅验证，合入 `main` 后部署。首次在仓库 Settings → Pages 选择 GitHub Actions。

## SDK 和预览器

`sdk-bundle/` 是当前 SDK 1.0 的受控源码快照。预览器 EXE 和字体运行包放在 Releases 的完整 ZIP 中：开发时复制其中的 `renderer/` 到本仓库同名目录，Git 会忽略这些二进制输出。字体清单随仓库维护。

预览器复用 DeskTile OS 的实际 QuickJS、组件和系统服务源码。重新编译预览器或重新生成 SDK 快照时，需要配套 DeskTile OS 开发工作区、其依赖和 Windows C++ 工具链；`tools/stage.py`、`tools/interactive.py`、`tools/renderer.py` 等维护脚本当前采用 DevKit 位于系统源码下的工作区布局。文档构建和 SDK 应用开发使用本仓库内容，运行预览器时加上 Release 中的运行资源。

更新 SDK 或运行资源时同时更新许可证清单、文档、示例和交付摘要。系统 App 版本保持当前约定的 1.0.0 / version_code 1。

## 制作发行包

本地先构建根路径文档并完成相应回归。安装官方打包工具后运行：

```powershell
npm install --prefix build/packaging-tools @vscode/vsce
python tools/package.py --vsce build/packaging-tools/node_modules/@vscode/vsce/vsce
```

`dist/` 中的 `.vsix`、`.tgz`、完整 `.zip` 和 `artifacts.json` 作为同一 GitHub Release 的附件上传。Git 仓库保存输入，发行安装包保存到 Releases。

发布前检查暂存区：排除本地应用数据、串口记录、下载文件、私钥、环境变量文件和构建缓存。`.gitignore` 已覆盖常见本地文件；新增运行资源时核对其来源和许可。
