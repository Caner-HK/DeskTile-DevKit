# 应用示例

[文档首页](/) / [应用开发](/guide/project.md)

<!-- page-outline -->
[[toc]]

## 完整应用源码

以下示例来自实际应用，包含清单、入口代码、图标及语言资源，可用 DevKit 独立构建。

| 应用 | 实现 | 适合参考 |
| --- | --- | --- |
| [便签](notes.md) | JavaScript | 编辑器、私有存储、文件导入导出、未保存确认 |
| [计时器](timer.md) | JavaScript | 时长选择、倒计时、逾时和状态恢复 |
| [ToDo](todo.md) | Native C++ | 共享待办数据、权限申请、列表与表单、异步请求 |

各应用页面提供源码 ZIP 下载。离线套件的 `sdk-bundle/examples/` 也包含相同代码。解压后用 VS Code 打开应用目录，运行 **DeskTile DevKit: Build Application**，或在目录中执行 `desktile build .`。

三个示例的源码采用 **Apache-2.0**，完整许可见 `LICENSE`，图标的原许可见 `licenses/`。示例保留原应用包名；开发自己的应用时，先修改 `manifest.json` 的 `id`、名称和作者，再构建安装。

## JavaScript 阅读模板

`sdk-bundle/examples/scaffold-js` 包含阅读页、设置页、三种语言、字号存储和保存失败处理。创建项目命令会复制这份完整代码并设置应用身份。

## Native 阅读模板

`sdk-bundle/examples/scaffold-native` 使用公开 C++ 包装器组织相同的页面结构。先安装对应 Xtensa 工具链，再构建应用。

## 修改示例

先修改语言资源中的标题和正文，再添加自己的页面与业务逻辑。组件示例可从[组件目录](../components/)复制到页面，服务使用方式见[系统服务](../services/)。
