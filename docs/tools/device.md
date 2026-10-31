# 设备工作流程

[文档首页](/) / [开发工具](/tools/)

<!-- page-outline -->
[[toc]]

## SD 安装

在设备结束 SD 访问后，将 SD 连接电脑。选择包含 `desktile` 目录的根路径，执行 Copy Installer to SD Card，或运行：

```powershell
desktile deploy .\dist\com.example.myapp.dtapp --sd E:\
```

工具验证包并复制到 `desktile/user/Packages`。安全弹出 SD、装回设备，在「设置 → 应用 → 安装应用」中安装。桌面或应用列表提供启动入口。

## 从电脑安装

设备启用 **USB 调试输入**和 **USB 调试输出**，通过 USB 连接电脑。关闭正在占用同一串口的监视器，在插件选择 **Install on Device**，或执行：

```powershell
desktile install .\dist\com.example.myapp.dtapp --port COM4
```

工具先检查电脑上的安装包，再分段传输到设备 SD 的 `desktile/install/.devkit` 暂存目录。设备验证完整长度和传输 CRC，然后调用系统安装器执行包结构、资源完整性、SDK 和版本检查。JavaScript 包通过校验后开始安装；Native 包还需要设备开启 Native 安装选项，并在安装器中确认风险。

成功时返回 `complete`；同一版本已存在时返回 `already-installed`。版本降级、损坏包、存储错误和取消都会返回各自结果。升级按系统现有规则保留私有数据。

传输上限为 16 MiB，使用 115200 波特率。串口传输期间可看到已发送字节和百分比。Ctrl+C 结束电脑操作；设备在传输空闲超过 15 秒后关闭临时文件并清理未完成内容。安装事务开始后由系统安装器完成提交。

此命令需要支持 DevKit 协议 1 的 System 固件。连接无响应时，检查两个调试开关、串口占用和固件版本。

## 实机性能面板

插件选择 **Device Performance**，选择串口后点击 **Start**。面板每秒读取一次真实设备数据，展示最近 120 个样本：

- 内部 RAM、PSRAM 的剩余空间。
- 每秒渲染 CPU 耗时，包含分片绘制和局部刷新。
- SDK 与系统列表的滚动缓冲，以及弹窗缓冲占用。

渲染耗时统计的是系统绘制函数占用时间。它适合比较操作前后的开销；显示扫描帧率、网络等待时间与整个应用 CPU 使用率各有独立含义。

点击 **Stop** 或关闭面板会结束采集。设备收到一次采样请求后续期三秒，电脑异常退出时也会自动停止额外计时。设备保留 24 字节的采样状态和计数器；120 条历史样本存储在电脑端。剩余内存直接读取现有计数。

命令行可以取得相同的 JSON 样本，适合存档或接入其他分析工具：

```powershell
desktile profile --port COM4 --seconds 60
```

## 文件传输

在设备的文件 App 中启动 FTP 服务，电脑与设备连接同一局域网。使用页面显示的地址、端口和账户。`push` / `pull` 传输单个文件，远端 `/` 对应 `desktile/user`；例如 `/Downloads/demo.txt` 会显示在文件 App 的 Downloads 中。

在当前 PowerShell 会话设置密码，然后执行：

```powershell
$credential = Get-Credential -UserName desktile -Message '文件 App 的 FTP 账户'
$env:DESKTILE_FTP_PASSWORD = $credential.GetNetworkCredential().Password
desktile push .\demo.txt /Downloads/demo.txt --host 192.168.1.20 --user $credential.UserName
desktile pull /Downloads/demo.txt .\downloaded-demo.txt --host 192.168.1.20 --user $credential.UserName
Remove-Item Env:DESKTILE_FTP_PASSWORD
```

端口默认 `2121`，可用 `--port` 指定。目标目录须已存在；同名目标返回错误，请指定新名称。上传先写临时文件，读回验证 SHA-256 后提交；下载先写本地临时文件，核对长度后提交。命令返回字节数及 SHA-256。FTP 使用明文局域网连接，适用于可信开发网络；结束传输后在文件 App 关闭服务。

USB 的 `install` 用于安装应用包，文件 `push` / `pull` 使用上述网络连接。

## USB 调试

在设备「设置 → 系统 → 开发者选项」中按需启用 USB 调试输入、USB 调试输出。打开输入需要设备确认。串口通常使用 115200 波特率，一次由一个工具独占。

调试输出包含应用日志和系统诊断。记录一次操作从开始到完成的日志，以便分析启动、权限、异步结果和崩溃。监听期间保持用户数据和应用状态，重启或刷机需要单独执行相应操作。

串口功能需要 `python -m pip install pyserial`。使用 `desktile devices` 列出端口，`desktile monitor --port COM4 --log-file serial.log` 监听并保存日志，按 Ctrl+C 释放端口。日志每个文件上限 5 MiB，保留当前文件与上一份轮转文件。

`desktile run . --port COM4` 发送当前应用包 ID 的启动诊断指令。应用应先安装，设备启用 USB 调试输入；命令发送后在设备上确认启动结果。插件提供 Launch Installed Application 与 Serial Monitor，插件日志保存在项目 `.desktile/serial.log`。

## 安装后检查

检查应用名称、三种语言、深浅主题、权限拒绝和重新授权、退出重开、持续任务、存储数据及清除数据行为。UI 布局可以先用桌面预览确认，触摸、滚动和内存需要在目标设备上验证。
