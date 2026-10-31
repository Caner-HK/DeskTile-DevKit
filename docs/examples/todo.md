# ToDo

[文档首页](/) / [应用开发](/guide/project.md) / [应用示例](/examples/index.md)

ToDo 是一个 Native C++ 应用，通过公开 SDK 访问系统共享待办仓库。示例将入口、数据模型、界面和操作控制拆成独立文件，适合参考多页面应用的组织方式。

[下载 ToDo 完整源码](/downloads/native-todo.zip)

<!-- page-outline -->
[[toc]]

## 阅读顺序

| 文件 | 重点 |
| --- | --- |
| `manifest.json` | Native 入口和 `tasks.read`、`tasks.write` 权限 |
| `src/main.cpp` | `dt_app_entry`、生命周期和事件入口 |
| `src/TodoModel.h` | 应用状态与记录结构 |
| `src/TodoController.h`、`TodoController.cpp` | 请求、操作与页面状态的协调 |
| `src/TodoView.cpp` | 列表、编辑表单及弹窗布局 |
| `src/TodoSchedule.cpp` | 待办日程处理 |
| `src/TodoTexts.h` | 界面文案 |

## 共享数据与权限

应用通过待办服务读取和修改记录，系统负责共享数据存储及调用者权限判断。请求与应用上下文关联，完成后由事件回调交回结果。退出页面或应用时，需要处理仍在执行的请求和输入法交互。

先阅读[日历与待办数据](../services/data.md)理解共享记录，再结合[权限申请](../services/permissions.md)和 [Native C/C++ 接口](../api/native.md)查看实际调用方式。

## 构建

安装 ESP32-S3 Xtensa 工具链，将编译器路径替换为本机路径：

```sh
desktile build . --compiler "C:/toolchains/xtensa-esp32s3-elf-g++.exe"
desktile check dist/hk.caner.desktile.todo.dtapp
```

插件中也可通过 `desktile.compilerPath` 指定编译器，然后运行构建命令。

## 实机验证

分别验证读取和写入权限的允许、拒绝状态；创建、编辑、完成和删除任务；打开输入法后返回；退出重开后确认共享记录和当前列表一致。

## 许可

源码采用 Apache-2.0，完整许可和图标来源声明随下载包提供。
