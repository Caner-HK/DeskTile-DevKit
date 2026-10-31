# DeskTile DevKit

DeskTile DevKit 是面向 DeskTile OS 的应用开发套件，包含 SDK 1.0、VS Code 扩展、命令行工具和 Windows 本地交互预览器，支持开发 JavaScript 与 Native C++ 应用。

[开发文档](https://caner-hk.github.io/DeskTile-DevKit/) | [English documentation](https://caner-hk.github.io/DeskTile-DevKit/en/) | [下载](https://github.com/Caner-HK/DeskTile-DevKit/releases) | [问题反馈](https://github.com/Caner-HK/DeskTile-DevKit/issues)

## 功能

- 创建、构建和检查 `.dtapp` 应用安装包。
- 在 VS Code 中使用 SDK 类型声明、应用清单校验和组件补全。
- 本地运行 JavaScript 与宿主平台构建的 Native 应用，预览页面交互、主题、语言和状态栏。
- 导入图片，制作应用图标、通知图标及不同尺寸的磁贴资源。
- 通过 USB 安装和启动应用、查看串口日志及设备性能数据。
- 通过文件 App 的 FTP 服务传输用户文件。
- 查阅中英文开发指南、组件参考、API 文档和应用示例。

## 环境要求

| 功能 | 要求 |
| --- | --- |
| VS Code 扩展 | Visual Studio Code 1.95 或更高版本 |
| 命令行与应用打包 | Node.js 20+、Python 3.10+ |
| 本地交互预览 | Windows x64 |
| Native 设备构建 | ESP32-S3 C/C++ 工具链 |
| Native 本地预览 | Visual Studio C++ 桌面开发工具链 |

图片转换使用 Pillow，SVG 转换使用 CairoSVG，USB 串口工具使用 pyserial。详细安装步骤见[安装开发环境](https://caner-hk.github.io/DeskTile-DevKit/start/install.html)。

## 安装

从 [Releases](https://github.com/Caner-HK/DeskTile-DevKit/releases/latest) 下载所需发行包：

| 文件 | 用途 |
| --- | --- |
| `desktile-devkit-1.0.0-win32-x64.vsix` | VS Code 扩展，包含 SDK 和 Windows 预览资源 |
| `desktile-devkit-1.0.0.tgz` | 独立命令行工具 |
| `DeskTile-DevKit-1.0.0-windows-x64.zip` | 完整 Windows 开发套件及离线文档 |
| `artifacts.json` | 发行文件大小和 SHA-256 校验值 |

在 VS Code 扩展视图的菜单中选择 **从 VSIX 安装**，安装下载的 `.vsix`。完成后，在命令面板搜索 `DeskTile DevKit`。

命令行工具通过 npm 安装：

```powershell
npm install --global .\desktile-devkit-1.0.0.tgz
desktile doctor
```

## 快速开始

创建一个 JavaScript 应用，构建安装包并打开交互预览：

```powershell
desktile new my-app --id com.example.myapp --name "My App" --author "Example"
desktile build my-app
desktile preview my-app
```

连接设备并启用 USB 调试后，可以安装生成的应用包：

```powershell
desktile install .\my-app\dist\com.example.myapp.dtapp --port COM4
```

设备连接、权限及 Native 安装要求见[设备工作流程](https://caner-hk.github.io/DeskTile-DevKit/tools/device.html)。

## 文档与示例

- [应用开发指南](https://caner-hk.github.io/DeskTile-DevKit/guide/project.html)
- [设计与组件](https://caner-hk.github.io/DeskTile-DevKit/components/)
- [API 参考](https://caner-hk.github.io/DeskTile-DevKit/api/)
- [命令行参考](https://caner-hk.github.io/DeskTile-DevKit/tools/cli.html)
- [便签示例](sdk-bundle/examples/notes-js)
- [计时器示例](sdk-bundle/examples/timer-js)
- [ToDo 示例](sdk-bundle/examples/native-todo)

完整套件提供离线文档，运行 `desktile docs` 后访问命令输出的本地地址。

## 本地预览

预览器支持主题、语言、字体、缩放、布局边界、状态栏模拟和主机性能观察。支持的系统服务及实机验证范围见[预览器文档](https://caner-hk.github.io/DeskTile-DevKit/tools/)。

源码仓库提供 SDK、示例和开发工具源码。Windows 预览器二进制与字体运行包随 Releases 分发；从源码使用预览器时，将完整发行包中的 `renderer/` 内容复制到仓库的同名目录。

## 许可

DeskTile DevKit 自有代码、SDK、模板、示例和文档采用 [Apache License 2.0](LICENSE)。第三方组件、字体和图标遵循各自的许可，详见 [NOTICE](NOTICE)、[第三方声明](THIRD-PARTY-NOTICES.md) 和 [licenses](licenses/)。
