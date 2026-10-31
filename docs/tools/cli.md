# CLI 参考

[文档首页](/) / [开发工具](/tools/)

<!-- page-outline -->
[[toc]]

## 命令

| 命令 | 用途 |
| --- | --- |
| `desktile doctor` | 检查 SDK、Python、可选 Native 编译器和预览工具 |
| `desktile new <目录>` | 创建独立应用，要求 `--id`、`--name`、`--author` |
| `desktile build [目录]` | 构建 `.dtapp`，缺省使用当前目录 |
| `desktile check <包>` | 验证包边界、路径、文件摘要和入口资源 |
| `desktile preview [目录]` | 在本地交互窗口运行 JavaScript 或编译后的 Native 应用 |
| `desktile screenshot [目录]` | 导出静态标记图像，`--page` 选择 HTML 文件 |
| `desktile icon [目录]` | 从 PNG/SVG 制作图标与磁贴资源，生成预览后可用 `--apply` 写入项目 |
| `desktile image [目录]` | 将 PNG、JPEG、WebP、SVG 或 DTI 转换为包内图片资源，返回深浅主题预览 |
| `desktile deploy <包> --sd <根目录>` | 复制到 SD 的应用安装目录 |
| `desktile install <包> --port COM4` | 通过 USB 传输并调用设备安装器 |
| `desktile profile --port COM4 --seconds 60` | 采集实机性能数据 |
| `desktile push <本地文件> <设备路径> --host <地址>` | 通过文件 App 的 FTP 服务写入用户目录 |
| `desktile pull <设备路径> <本地文件> --host <地址>` | 从设备用户目录取回文件 |
| `desktile docs` | 在本机启动离线文档服务 |
| `desktile devices` | 列出电脑可见的串口 |
| `desktile monitor --port COM4` | 监听串口，可用 `--log-file` 保存轮转日志 |
| `desktile run [目录] --port COM4` | 通过调试输入发送已安装应用的启动指令 |

## SDK 与环境

SDK 路径的优先级为 `--sdk`、`DESKTILE_SDK`、随 DevKit 附带的 SDK。Python 使用 `--python`、`DESKTILE_PYTHON` 或 PATH 中的 `python`。

`new` 的 `--kind javascript` 为默认类型；`--kind native` 创建 Native C++ 项目。Native 编译器使用 `--compiler` 或 `DESKTILE_COMPILER`。

## 构建与交付

`build --output <文件>` 指定输出包，默认写入项目 `dist/<package-id>.dtapp`。`--signing-key <PEM>` 使用签名密钥；缺省产生开发包。

`deploy --replace` 替换 SD 中同包名的安装包。安装包路径为 `desktile/user/Packages/<package-id>.dtapp`。完成复制后在设备的安装应用页面执行安装。

## 预览与文档

`preview --locale zh-HK --theme dark` 指定启动语言和主题。语言可选 `zh-CN`、`zh-HK`、`en-US`；主题可选 `light`、`dark`。工具栏可随时切换主题、显示布局边界和性能读数。

`screenshot --page src/index.html --output <目录>` 指定标记页面和浅色、深色 PNG 的输出位置。默认输出到 `.desktile/preview`。

`docs --port 8800` 在 `127.0.0.1` 启动文档服务，按 Ctrl+C 关闭。

## 自动化

图标命令需要 `--source`、`--purpose application|tile|notification` 和 `--mode system|custom`；`--padding 8` 设置四周留白百分比。[图标制作](assets.md) 提供完整步骤。[串口命令参考](serial.md) 说明设备接收的调试指令及发送方法。

图片命令使用 `--source` 与 `--output assets/picture.dti`；`--width` 和 `--height` 按比例限定尺寸，`--mode custom|system` 选择颜色模式，默认保留图片颜色。覆盖同一路径时添加 `--replace`。

成功返回 0，失败返回 1，取消返回 130。`--json` 将成功结果压为单行 JSON；失败对象包含 `error.code` 和 `error.message`。构建日志位于 stderr。

```sh
desktile build . --json
```

为每个并行构建指定独立输出路径。项目目录和参数通过进程参数传递，含空格的路径使用终端的引号规则。
