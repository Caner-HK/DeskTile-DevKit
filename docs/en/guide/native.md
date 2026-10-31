# Native C++ applications

[Documentation home](/en/) / [Application development](/en/guide/project.md)

Native applications enter through `dt_app_entry` and communicate through the public ABI. The device build targets ESP32-S3 Xtensa with freestanding C++17.

<!-- page-outline -->
[[toc]]

## Toolchain and build

Install the Espressif ESP32-S3 Xtensa toolchain. Set `desktile.compilerPath`, pass `--compiler`, or set `DESKTILE_COMPILER` to `xtensa-esp32s3-elf-g++`. The matching `strip` tool must be next to it.

```sh
desktile new native-app --kind native --id com.example.nativeapp --name "Native App" --author "Example"
desktile build native-app --compiler /path/to/xtensa-esp32s3-elf-g++
```

Creation generates C/C++ include-path configuration. Sources live in `src`; the builder packages the ELF into `.dtapp` and runs the shared validator.

## ABI and ownership

Every host call receives the application context. Component handles, requests and storage belong to that context. Copy borrowed callback data if it must outlive the callback. Prefer the public C++ wrappers. The default build disables exceptions and RTTI; available standard-library and platform behavior depend on the toolchain and loader.

## Other processors and local preview

Compatible SDK interfaces allow source reuse. An ESP32-S3 ELF still depends on its instruction set, relocations and loader. ESP32-P4 requires rebuilding with a suitable toolchain and compatible target ABI. [Local Native preview](../tools/#native-preview) compiles a separate Windows module from source.

## Installation

Native installation follows developer settings and on-device risk confirmation. Verify installation, upgrades, exit and permission revocation on the target device.
