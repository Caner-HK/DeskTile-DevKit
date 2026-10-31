# 交付应用

[文档首页](/)

<!-- page-outline -->
[[toc]]

## 准备清单

为应用确定稳定的反向域名包 ID，填写作者、本地化名称、版本和递增的 `version_code`。清单声明实际需要的权限、入口、图标和 SDK 目标 1.0。

通知图标可采用系统着色或自定义颜色模式。所有声明的资源应包含在应用包中，文件名与大小写保持一致。

## 构建

开发包：

```sh
desktile build .
desktile check dist/com.example.myapp.dtapp
```

签名包使用受支持的 P-256 私钥 PEM，并安装 Python `cryptography` 依赖：

```sh
desktile build . --signing-key /secure/path/application-key.pem
```

签名表明包由对应密钥签发，设备的信任配置决定是否接受。密钥保存在应用源码和安装包之外。

## 验收

在目标固件执行首次安装、升级、卸载后安装和权限流程。核对通知点击、后台任务、断网与存储不足等应用实际使用到的场景。保存包、版本、测试记录和配套 SDK 版本。

## 分发与更新

交付 `.dtapp`、支持的设备型号、所需 SDK 版本和更新说明。保持包 ID 稳定，正式更新递增 `version_code`，并保留用户数据的迁移规则。使用[复制安装包到 SD](../tools/device.md)的流程在设备上安装最终产物。
