# Native C++ 应用

[文档首页](/) / [应用开发](/guide/project.md)

Native 应用通过公开 ABI 与系统通信，入口为 `dt_app_entry`。本版本构建目标是 ESP32-S3 Xtensa，使用 freestanding C++17。

<!-- page-outline -->
[[toc]]

## 工具链

安装 Espressif ESP32-S3 Xtensa 工具链，将 `xtensa-esp32s3-elf-g++` 的完整路径填入 VS Code 的 `DeskTile: Compiler Path`。命令行使用 `--compiler` 或 `DESKTILE_COMPILER`。编译器旁边需要对应的 `strip` 工具。

```sh
desktile new native-app --kind native --id com.example.nativeapp --name "Native App" --author "Example"
desktile build native-app --compiler /path/to/xtensa-esp32s3-elf-g++
```

创建时生成 C/C++ 扩展可识别的包含路径配置。项目源码位于 `src`，构建器生成 ELF 并装入 `.dtapp`，应用包由 SDK 的统一校验器检查。

## ABI 与所有权

应用收到宿主函数表和本应用上下文。每次调用传入该上下文；组件句柄、请求和存储属于应用。回调参数中借用的数据如需在回调之后使用，应复制到应用拥有的存储。

优先使用公开 C++ 包装器。标准库、异常、RTTI 和平台依赖应以目标工具链及加载器实际支持范围为准。构建默认关闭异常和 RTTI。

## 迁移到其他处理器

SDK 接口一致可以支持复用源码。已构建的 ESP32-S3 Xtensa ELF 依赖指令集、重定位规则与加载器；ESP32-P4 等不同架构需要相应工具链重新构建，并由目标设备提供兼容 ABI。

## 安装

开发包在设备上遵循开发者选项和 Native 应用风险确认。安装、升级、退出和权限撤销都应纳入设备验收。构建成功表示编译与打包完成。
