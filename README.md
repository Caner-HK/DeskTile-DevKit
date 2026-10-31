# DeskTile-DevKit
Unleash your creativity and bring your apps to DeskTile OS with the DeskTile DevKit and SDK.

DeskTile SDK 1.0 开发套件，提供 VS Code 插件、命令行、Windows x64 本地交互预览器、SDK、应用示例及中英文文档。

- [SDK 文档](https://caner-hk.github.io/DeskTile-DevKit/)
- [English documentation](https://caner-hk.github.io/DeskTile-DevKit/en/)
- [下载发行包](https://github.com/Caner-HK/DeskTile-DevKit/releases)

## 安装使用

在 Releases 下载 VSIX，通过 VS Code 的「从 VSIX 安装」安装插件。命令行包使用：

```powershell
npm install --global .\desktile-devkit-1.0.0.tgz
desktile doctor
desktile new my-app --id com.example.myapp --name "My App" --author "Example"
desktile build my-app
desktile preview my-app
```

要求 Node.js 20+、Python 3.10+。图像处理使用 Pillow，SVG 使用 CairoSVG；USB 工具使用 pyserial。Native 设备构建使用 ESP32-S3 工具链；Native 本地预览使用 Visual Studio C++ 桌面工具链。

克隆此仓库后可使用 `npm install --global .` 安装源码版本的 CLI。预览器的 `interactive.exe`、`preview.exe`、`ui-fonts.pack` 从完整 Release ZIP 的 `renderer/` 复制到本仓库同名目录。首次使用离线文档前，按下面的步骤构建文档。

## 仓库内容

| 目录 | 内容 |
| --- | --- |
| `bin/`、`lib/` | CLI、VS Code 插件及资源面板源码 |
| `sdk-bundle/` | SDK 1.0 头文件、JavaScript、合约、打包工具和应用示例 |
| `renderer/font-inventory.json` | 预览字体清单；EXE 和字体运行包随 Releases 分发 |
| `tools/`、`test/` | 维护脚本及验证工具 |
| `docs/` | VuePress 中英文文档源码及图片、示例下载等静态资源 |
| `licenses/` | 第三方依赖许可 |

`dist/` 是本地发行输出：VSIX、npm TGZ、完整 ZIP 上传到 GitHub Releases。`site/` 是文档构建输出，由 GitHub Actions 部署到 Pages。两个目录由 `.gitignore` 忽略。

## 构建文档

```powershell
npm ci --prefix docs
npm run build --prefix docs
node bin/desktile.js docs --port 8812
```

浏览器打开 `http://localhost:8812/`。本地构建默认使用 `/`，GitHub Actions 使用 `/DeskTile-DevKit/`。每次提交 `main` 的文档变更，工作流会构建并部署。

仓库管理员首次在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。构建步骤、运行资源来源和发行方法见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

自有 SDK、插件、CLI、模板、示例和文档采用 [Apache-2.0](LICENSE)。第三方组件、字体和图标按各自许可分发，详见 [NOTICE](NOTICE)、[第三方声明](THIRD-PARTY-NOTICES.md) 和 `licenses/`。
