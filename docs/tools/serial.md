# 串口调试命令

[文档首页](/) / [开发工具](/tools/)

这些命令由 System 固件的 USB 调试输入处理。它们用于开发与实机验收；应用正常运行时通过 SDK 调用系统服务。

<!-- page-outline -->
[[toc]]

## 连接与发送

在「设置 → 系统 → 开发者选项」打开 **USB 调试输入**，并在设备上确认。需要读取诊断结果时，同时打开 **USB 调试输出**。输入关闭时，设备在读取 RX 和解析命令之前直接返回；错误、致命故障及系统开机信息按系统日志规则输出。

使用 115200 波特率、8 数据位、无校验、1 停止位。每条命令以 LF 换行结束，CR 会被忽略。当前固件每行最多接收 63 字节，超长行会整行丢弃。USB 调试输入刚启用时会清除此前积压的输入。

插件中的 **Serial Monitor** 和 `desktile monitor` 用于接收日志。发送任意一条下表命令，可以使用支持发送文本的串口工具，或以下 Python 示例。先释放占用同一端口的监视器。

```python
import serial
import time

command = "diag app-state"
port = serial.Serial(port=None, baudrate=115200, timeout=0.1, write_timeout=2)
port.dtr = False
port.rts = False
port.port = "COM4"
port.open()
with port:
    port.write((command + "\n").encode("ascii"))
    port.flush()
    until = time.monotonic() + 3
    while time.monotonic() < until:
        print(port.read(4096).decode("utf-8", errors="replace"), end="")
```

连接期间保持 DTR、RTS 为关闭状态。设备的自动复位线路与这些信号相关。

## 应用与页面

| 命令 | 用法与适用条件 |
| --- | --- |
| `diag open-app <package-id>` | 打开已安装应用，例如 `diag open-app hk.caner.desktile.timer`。命令总长受 63 字节限制。 |
| `diag app-menu` | 打开当前应用菜单，要求页面支持菜单且当前没有触摸。 |
| `diag settings <page>` | 打开设置页面。`page` 为 `home`、`battery`、`system`、`developer` 或 `install`。 |
| `diag files-path <path>` | 在文件应用中打开目录。要求文件应用已经位于前台。 |
| `diag scroll <offset>` | 设置当前支持滚动页面的绝对偏移，单位为 px，并按内容范围限制。支持相应设置列表、文件选择器、Timeline、PIDS 设置、Mosaic 设置、SDK 滚动视图及桌面编辑。 |

`desktile run . --port COM4` 自动读取当前项目的包 ID 并发送 `diag open-app`。它发送启动请求，启动结果以设备画面和日志为准。

## 触摸输入

坐标采用设备实际 800×480 屏幕坐标，包含顶部状态栏。`x` 为 0–799，`y` 为 0–479。

| 命令 | 用法与适用条件 |
| --- | --- |
| `diag input-tap <x> <y> [duration]` | 经过系统触摸处理路径注入按下和松开。时长默认 60 ms，可用范围 20–700 ms。要求当前没有触摸。 |
| `diag input-drag <x> <from-y> <to-y>` | 在当前支持的纵向列表注入拖动和松手。两个 y 坐标为 104–479。要求键盘、应用菜单关闭且当前没有触摸。 |
| `diag tap <x> <y>` | 直接派发点击；SDK 应用中执行 pointerDown/pointerUp，其他页面执行点击处理。适合功能步骤，完整触摸反馈测试使用 `input-tap`。 |
| `diag long-press <x> <y>` | 调用当前支持页面的长按操作，或进入桌面编辑。权限弹窗和应用菜单会限制执行。 |
| `diag app-pointer <phase> <x> <y>` | 目前仅用于 Calligraphy 页面。phase：0 按下、1 移动、2 松开、3 取消。 |

注入坐标会执行屏幕上的真实操作。测试前核对当前页面与目标控件。

## 状态与性能

以下诊断信息需要打开 USB 调试输出。

| 命令 | 输出或作用 |
| --- | --- |
| `diag app-state` | 当前应用与输入状态、内部 RAM、PSRAM、字体、列表、桌面缓存、弹窗统计及当前应用专用诊断。 |
| `diag app-ui` | 页面、键盘、运行时状态；SDK 应用的组件树与布局，或日历专用状态。 |
| `diag app-names` | 内置应用安装记录中的简体、繁体、英文显示名。 |
| `diag profile` | 请求下一次页面绘制计时；Mosaic 同时记录其绘制阶段。 |
| `diag progress` | 当前进度组件、安装进度和工作任务状态。 |
| `diag motion` | 当前场景、菜单、构建状态与开关动画状态。 |
| `diag scan-reset` | 读取显示扫描诊断并重置统计。 |
| `diag desktop-layout` | 桌面磁贴包 ID、坐标、尺寸、布局校验值和编辑状态。 |
| `diag desktop-trace-start` | 开始桌面性能跟踪。 |
| `diag desktop-trace-stop` | 停止跟踪并输出采样记录。 |

`diag desktop-status` 用于桌面编辑状态栏重绘：仅在桌面编辑可使用缓存且没有触摸时刷新该区域。

## DevKit 设备协议

以下请求和回执用于电脑安装与性能面板，要求 USB 调试输入和输出均开启。回执以 `[DevKit] ` 开头，后接一行 JSON。安装的完整流程由 `desktile install` 管理。

| 命令 | 作用 |
| --- | --- |
| `dev hello` | 返回协议版本、传输分片大小和安装包容量上限。 |
| `dev begin <bytes> <crc32>` | 开始一次暂存传输，CRC32 为十六进制。 |
| `dev put <offset> <base64>` | 发送最多 32 字节，返回下一个字节偏移。电脑收到确认后发送下一片。 |
| `dev commit` | 校验完整传输并进入系统安装流程。 |
| `dev status` | 查询传输或安装状态。 |
| `dev abort` | 取消尚未提交的传输或等待确认的安装。正在提交的安装由系统继续完成。 |
| `dev metrics` | 读取精简性能样本，并续期三秒采集时间。 |
| `dev metrics-stop` | 停止额外渲染计时。 |

## 刷机准备

`diag prepare-flash` 请求系统结束存储访问并重启进入下载模式。它会中断当前设备会话，适用于已准备好固件和刷写流程的维护操作。

## 排查无响应

1. 检查端口和波特率，确认端口由当前工具独占。
2. 在屏幕上确认 USB 调试输入已开启；读取诊断时确认输出也开启。
3. 检查 LF 结尾、63 字节长度限制和命令适用页面。
4. 释放屏幕触摸，再运行需要空闲触摸状态的命令。

`dev` 命令使用上表的结构化回执。`diag` 命令通过画面变化或诊断输出体现结果。文档对应当前 System 固件的 `runUploadCommand` 实现。
