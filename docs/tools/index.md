# 开发工具

[文档首页](/)

VS Code 插件和 `desktile` CLI 调用同一个核心，使用同一份 SDK、模板和包构建器。

<!-- page-outline -->
[[toc]]

## VS Code

资源管理器中的 DeskTile DevKit 提供创建项目、检查环境、构建、本地交互预览、检查包、复制安装包到 SD、打开文档和选择 SDK。命令面板提供相同操作。构建支持取消，执行详情写入 DeskTile DevKit 输出通道。

### 插件界面语言

插件默认跟随 VS Code 的显示语言。点击 DeskTile DevKit 面板中的「界面语言 / Interface language」，可选择跟随 VS Code、简体中文或 English，随后重新加载窗口。此选项控制插件面板和操作提示；VS Code 命令面板的标题跟随编辑器显示语言。预览应用的系统语言在预览器设置中单独选择。

### 创建项目

点击 Create application，填写应用信息和类型，选择项目的存放目录，再输入新文件夹名称。插件会显示完整路径，并在创建后打开项目。

### 本地交互预览

点击 Local interactive preview，在独立窗口运行当前 JavaScript 或 Native C++ 应用。JavaScript 使用 SDK 对应的 QuickJS；Native 从项目源码编译 Windows x64 模块，通过 NativeAppRunner 调用入口、生命周期和事件。两者使用相同的 SDK 宿主和组件引擎，支持按钮、页面切换、鼠标拖动和滚轮、计时更新、文本输入与本地数据保存。

窗口顶部的工具栏提供深浅主题、布局边界、性能读数、帧率上限、应用菜单和预览设置。100% 对应 800×480 个屏幕像素；工具栏使用电脑的系统缩放，位于应用屏幕外，空间不足时换行。设置中可以切换缩放比例、字体、系统语言以及模拟的 Wi-Fi、电量和充电状态。

System language 提供简体中文、繁體中文和 English。点击 Apply 后，正在运行的应用通过 SDK 收到语言变化事件，重新显示对应文字；选择跟随系统的应用会同步切换，自行指定语言的应用保留自己的选择。模板的阅读设置在切换语言后继续保留。

Esc 返回，右键、F10 或工具栏 App menu 打开画面右侧的应用菜单。菜单使用设备的侧边组件及滑入、收回动画，显示应用注册的操作；点击取消或菜单外部收回，退出按钮执行应用退出流程。输入文字使用电脑输入窗口，文件导入和导出通过电脑文件选择器选择目标。

工具栏采用电脑的系统字体。预览字体包含 MiSans、Cabin、Noto Sans 和 Source Serif 4；设备的 Transport Sans 在本地预览中使用 MiSans。

性能读数显示电脑上的绘制帧率、应用更新耗时、绘制耗时和滚动缓存；JavaScript 另显示其运行时内存上限。15、30、60 FPS 选项限制预览绘制频率，便于观察低帧率交互。ESP32 的 CPU、PSRAM、SD 和无线硬件性能须在设备上测量。

应用私有键值数据保存在项目的 `.desktile/preview-data/<package-id>` 中，重新打开会保留。共享日历、待办和应用语言设置使用设备同一套服务实现，由电脑文件系统提供存储，位于 `.desktile/preview-data/system`；权限请求由预览窗口确认。

预览器提供以下服务，JavaScript 和 Native 使用相同的 SDK 接口：

| 服务 | 本地预览行为 |
| --- | --- |
| 网络 | 通过电脑网络异步执行 HTTP/HTTPS GET、POST，支持超时、取消和响应回调；HTTPS 使用 Windows 信任的证书。最多同时处理 4 个请求，响应上限为 32 KiB。 |
| 通知 | 使用设备的通知队列、横幅与滑入收回动画，支持发布、更新、撤回、点击回调和上滑收起。打开 App Menu 或输入面板时暂停展示，关闭后继续。 |
| 文件 | 使用设备文件服务完成目录列表、元数据、分段读取、原子写入、新建目录、重命名、移动和删除。私有文件按应用隔离，用户目录受读写权限控制；覆盖已有用户文件需提供原文件 SHA-256。 |
| 文件选择器 | 用户主动选择电脑上的文件供应用读取，或选择新文件路径导出。已有电脑文件的覆盖由后续版本的选择器适配提供。 |
| 日历与待办 | 使用设备的数据仓库和权限规则，保存清单、任务和日历记录。 |

文件 API 的私有目录位于 `.desktile/preview-data/system/desktile/data/<package-id>/files`，模拟用户目录位于 `.desktile/preview-data/system/desktile/user`。开发者可直接在此放入测试文件。预览数据与电脑文件选择器中主动选取的文件分别管理。

蓝牙通信、日历远程订阅刷新以及系统后台任务在设备上验证。`files.copy` 通过后台任务执行，因此也属于实机验证范围。通知预览覆盖当前应用进程中的交互，设备退出后的后台生命周期以实机结果为准。

预览器自身的设置保存到 `%LOCALAPPDATA%\DeskTile\Preview\settings.json`，与应用数据分开。语言、主题、字体、缩放、布局边界、性能读数、帧率上限及模拟状态栏在下次启动时恢复。默认缩放为 100%，应用屏幕对应 800×480 个物理像素。命令行显式传入的 `--locale`、`--theme` 优先于保存值；损坏或超范围的设置使用相应默认值。

自动化测试可以用 `DESKTILE_PREVIEW_CONFIG_DIR` 指定隔离的配置目录。预览器保存设置时先写临时文件，再替换完整配置。

### Native 预览准备

安装 Visual Studio 2022 或 Visual Studio Build Tools 的「使用 C++ 的桌面开发」工作负载，包含 MSVC x64 编译器及 Windows SDK。首次使用 Native 预览时，DevKit 自动查找该工具链；缺少工具链时，输出通道会提示需要安装的内容。

在 Native 项目中点击 Local interactive preview，或运行：

```sh
desktile preview . --locale zh-HK --theme light
```

每次启动均从 `src` 下的 C/C++ 源码构建 `.desktile/preview-native/app.dll`，再运行 `dt_app_entry`。构建采用 C++17 和当前选择的 SDK 头文件，支持子目录中的源码及头文件。模板中的 GCC 导出标记只在临时构建副本中转换为 Windows 导出标记，项目源码保持原样。

桌面模块与设备的 `app.elf`、`.dtapp` 分别构建。预览运行的是宿主机代码，开发者应当只运行可信的 Native 源码。直接使用 ESP-IDF、芯片寄存器或 Xtensa 汇编的代码需要自行提供桌面实现；这些硬件功能的最终行为以实机验收为准。

Export Static Markup Images 命令将指定 HTML 导出为浅色和深色 PNG，适合检查独立页面的初始布局。

“Serial Monitor”读取串口并保存当前会话日志；“Launch Installed Application”启动已安装的应用；“Install on Device”通过 USB 传包并读取系统安装结果；“Device Performance”显示实机内存、绘制耗时和缓冲占用。完整步骤见[设备工作流程](device.md)。

清单使用 JSON Schema 校验。JavaScript 项目附带类型声明，HTML 提供 `dt-` 组件补全。Native 项目生成 C/C++ 包含路径，便于使用 Microsoft C/C++ 扩展。

## 图标与磁贴

[制作图标与磁贴资源](assets.md) 说明如何导入 PNG/SVG、选择系统着色或保留颜色、检查预览并写入应用清单。资源随应用一起打包为 `.dtapp`。

## 命令行

[CLI 参考](cli.md) 提供命令、参数、输出和退出码。自动化构建可以使用 `--json` 读取结果，日志写入标准错误。

## 设备

[设备工作流程](device.md) 说明 SD 安装、USB 调试和实机检查。DevKit 的 SDK 选择影响开发工具；设备运行的固件与 SDK 能力由设备提供。

[串口调试命令](serial.md) 列出当前固件支持的命令、参数、适用页面和发送示例。
