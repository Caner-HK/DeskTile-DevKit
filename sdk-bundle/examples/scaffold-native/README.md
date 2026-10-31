# 阅读手册（Native）

仅依赖公开 C++ SDK 的独立 ESP32-S3 应用。简体默认，另含香港繁体和英文；稳定 Scaffold 内容区承载阅读/设置，字号由独立 Toggle 切换并保存。原退出图标由启动来源决定，500ms 长按保留原操作。

```powershell
python tools/build_native_app.py examples/scaffold-native packages/scaffold-native.dtapp --compiler C:/toolchains/xtensa-esp-elf/bin/xtensa-esp32s3-elf-g++.exe --development
```

两个示例各使用自己的包 ID，私有键 `large-text` 保存一字节的 0/1 值。写入失败撤销本次开关并显示本地化错误。入口用静态存储和 placement new 初始化，LEAVE/destroy 递归释放组件；语言变化重新挂载内容，主题变化原位刷新。
