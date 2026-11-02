# 安装开发环境

[文档首页](/)

DeskTile DevKit 使用 SDK 1.0。先准备开发电脑，再选择应用类型。

<!-- page-outline -->
[[toc]]

## 下载 DeskTile DevKit

最新版本发布在 [GitHub Releases](https://github.com/Caner-HK/DeskTile-DevKit/releases/latest)。当前版本为 **1.0.0**，本地交互预览面向 **Windows x64**。

| 下载 | 用途 |
| --- | --- |
| [VS Code 扩展（VSIX）](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/desktile-devkit-1.0.1-win32-x64.vsix) | 在 VS Code 内开发，包含 SDK 和预览运行资源 |
| [命令行工具（TGZ）](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/desktile-devkit-1.0.1.tgz) | 通过 npm 安装独立 CLI |
| [完整 Windows 套件（ZIP）](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/DeskTile-DevKit-1.0.1-windows-x64.zip) | 包含工具、SDK、预览器、示例与离线文档 |
| [文件校验清单](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/artifacts.json) | 查看发行文件的 SHA-256 和大小 |

首次使用 VS Code 开发时选择 VSIX；需要独立工具和离线文档时选择完整 ZIP。GitHub 的 Source code 下载提供仓库源码，预览器运行文件随上述发行附件提供。[源码仓库](https://github.com/Caner-HK/DeskTile-DevKit)和[问题反馈](https://github.com/Caner-HK/DeskTile-DevKit/issues)对所有开发者开放。

## 安装插件

在 VS Code 的扩展菜单中选择“从 VSIX 安装”，选择随开发套件提供的 `desktile-devkit-1.0.1-win32-x64.vsix`。安装后打开命令面板，输入 `DeskTile DevKit`。

打开一个应用文件夹后，资源管理器中会出现 DeskTile DevKit 面板。首次构建前执行“Check Development Environment”，在工具面板查看检查结果，并通过按钮配置编译器、Python 和依赖。面板也提供安装包检查及设备安装，详见[开发工具](../tools/)。

## 开发依赖

JavaScript 应用构建需要 Python 3.10 或以上。命令行还需要 Node.js 20 或以上。插件的 `desktile.pythonPath` 设置可以指定 Python 可执行文件。

串口监视和启动指令需要 Python `pyserial`，签名构建需要 `cryptography`。可以使用 `python -m pip install pyserial cryptography` 安装。本地交互预览使用套件附带的 Windows x64 宿主，运行 JavaScript 应用及原生组件；静态截图使用同一套原生绘制组件。

Native C++ 应用还需要 ESP32-S3 Xtensa 编译工具链。环境检查会自动查找常用安装目录；可点击「查找工具链」选择安装目录，或点击「选择编译器」指定 `xtensa-esp32s3-elf-g++` 并保存到 `desktile.compilerPath`。工具会验证目标架构与配套 strip 程序；「工具链安装指南」提供官方安装入口。Native 安装包包含目标处理器机器码，目标型号应与设备匹配。

## SDK 位置

完整发行包附带 `sdk-bundle`。也可以执行“Select SDK”，选择包含 `delivery-manifest.json`、`sdk`、`tools` 和 `examples` 的 SDK 1.0 目录。

## 命令行

在解压后的 DevKit 根目录执行：

```sh
npm install --global .
desktile doctor
```

也可以直接执行 `node bin/desktile.js doctor`。插件和命令行使用相同的构建器与包格式。

独立 CLI 包使用 `npm install --global desktile-devkit-1.0.1.tgz` 安装。更新时安装新版本 VSIX 或 npm 包；项目源码和设备数据由各自目录保存。

## 文档源码

便携套件的 `documentation` 包含 VuePress 源码与依赖锁文件。使用当前 Node.js LTS，在该目录执行 `npm ci` 与 `npm run build` 可重新生成站点。浏览现成离线文档只需执行 `desktile docs`。

下一步：[创建第一个应用](first-app.md)。
