# 创建第一个应用

[文档首页](/)

这一节创建一个可安装的阅读应用。它有阅读和设置两个视图，可以保存文字大小选择。

<!-- page-outline -->
[[toc]]

## 创建项目

在 VS Code 命令面板选择“DeskTile DevKit: Create Application”，选择 JavaScript，填写应用名称、作者和反向域名形式的包名，例如 `com.example.reader`，再选择新项目目录。

对应命令：

```sh
desktile new reader --id com.example.reader --name "Reader" --author "Example"
```

新项目包含应用清单、界面入口、JavaScript 逻辑、语言资源和图标。打开 `locales` 中的文件修改页面文字，再阅读 `src/main.js` 中的 `enter`、`onEvent` 和 `leave`。

## 构建

执行“Build Application”，或在终端执行：

```sh
desktile build reader
desktile check reader/dist/com.example.reader.dtapp
```

输出位于 `dist`。构建时编辑器配置、类型辅助文件与上一次构建产物会从应用包中排除。

## 安装到设备

将设备 SD 卡连接电脑，选择“Copy Installer to SD Card”。选择构建产物和 SD 根目录。工具将包放入 `desktile/user/Packages`。

安全弹出 SD，装回设备，通过“设置 → 应用 → 安装应用”安装。开发包的安装受设备开发者选项控制。

## 验证交互

打开应用，切换阅读和设置页面，改变文字大小，然后退出重开。确认文字大小已经保存。再切换设备主题和语言，检查页面内容与布局。

继续阅读[项目结构](../guide/project.md)，理解这些文件怎样共同组成应用。
