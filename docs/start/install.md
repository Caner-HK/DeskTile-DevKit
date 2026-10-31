# 安装开发环境

[文档首页](/)

DeskTile DevKit 使用 SDK 1.0。先准备开发电脑，再选择应用类型。

<!-- page-outline -->
[[toc]]

## 安装插件

在 VS Code 的扩展菜单中选择“从 VSIX 安装”，选择随开发套件提供的 `desktile-devkit-1.0.0-win32-x64.vsix`。安装后打开命令面板，输入 `DeskTile DevKit`。

打开一个应用文件夹后，资源管理器中会出现 DeskTile DevKit 面板。首次构建前执行“Check Development Environment”，结果显示在输出面板。

## 开发依赖

JavaScript 应用构建需要 Python 3.10 或以上。命令行还需要 Node.js 20 或以上。插件的 `desktile.pythonPath` 设置可以指定 Python 可执行文件。

串口监视和启动指令需要 Python `pyserial`，签名构建需要 `cryptography`。可以使用 `python -m pip install pyserial cryptography` 安装。本地交互预览使用套件附带的 Windows x64 宿主，运行 JavaScript 应用及原生组件；静态截图使用同一套原生绘制组件。

Native C++ 应用还需要 ESP32-S3 Xtensa 编译工具链，通过 `desktile.compilerPath` 指定 `xtensa-esp32s3-elf-g++`。Native 安装包包含目标处理器机器码，目标型号应与设备匹配。

## SDK 位置

完整发行包附带 `sdk-bundle`。也可以执行“Select SDK”，选择包含 `delivery-manifest.json`、`sdk`、`tools` 和 `examples` 的 SDK 1.0 目录。

## 命令行

在解压后的 DevKit 根目录执行：

```sh
npm install --global .
desktile doctor
```

也可以直接执行 `node bin/desktile.js doctor`。插件和命令行使用相同的构建器与包格式。

独立 CLI 包使用 `npm install --global desktile-devkit-1.0.0.tgz` 安装。更新时安装新版本 VSIX 或 npm 包；项目源码和设备数据由各自目录保存。

## 文档源码

便携套件的 `documentation` 包含 VuePress 源码与依赖锁文件。使用当前 Node.js LTS，在该目录执行 `npm ci` 与 `npm run build` 可重新生成站点。浏览现成离线文档只需执行 `desktile docs`。

下一步：[创建第一个应用](first-app.md)。
