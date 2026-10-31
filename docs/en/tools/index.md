# Development tools

[Documentation home](/en/)

The VS Code extension and `desktile` CLI share the SDK, templates and package builder.

<!-- page-outline -->
[[toc]]

## VS Code

Explorer offers project creation, environment checks, build, preview, package inspection, USB installation, device metrics, SD copying, launch, serial monitoring, documentation and SDK selection. Commands are also available in the command palette. Builds can be canceled; details go to the DeskTile DevKit output channel.

### Interface language

The extension follows VS Code by default. **Interface language** selects automatic, Simplified Chinese or English for extension panels and prompts; reload afterward. Command-palette titles follow the editor language. The preview application's system language is a separate preview setting.

### Project creation

Choose the application type and identity, select a parent directory and enter a new folder name. The extension shows the destination and opens the completed project.

## Local interactive preview

JavaScript uses the matching QuickJS runtime. Native compiles project source into a Windows x64 module and runs its entry, lifecycle and events through NativeAppRunner. Both use the native component engine, supporting clicks, navigation, drag/wheel scrolling, timers, input and local persistence.

The toolbar offers theme, layout bounds, host performance, FPS cap, App Menu and settings. **100% is 800 × 480 physical screen pixels**. Toolbar controls follow host DPI outside the application viewport and wrap when needed. Settings include scale, fonts, system language, simulated Wi-Fi, battery level and charging.

System languages are Simplified Chinese, Hong Kong Traditional Chinese and English. Apply sends the SDK language-change event. Applications following the system refresh their text; explicit application language choices remain in force.

Esc goes back. Right click, F10 or App menu opens the native side menu with slide animations and registered actions. Cancel or an outside click dismisses it; Exit runs the application exit path. Host text dialogs and file pickers provide input/import/export.

The toolbar uses the computer's system font. Preview fonts include MiSans, Cabin, Noto Sans and Source Serif 4. Device Transport Sans maps to MiSans in the preview distribution.

Host metrics show draw FPS, application update time, paint time and scroll-cache use; JavaScript also shows its memory limit. 15/30/60 FPS limits help inspect low-frame-rate behavior. Measure ESP32 CPU, PSRAM, SD and radio performance on the device.

### Persistence and simulated services

Private key-value data persists in `.desktile/preview-data/<package-id>`. Calendar, ToDo and application language use the device service implementation with host filesystem storage under `.desktile/preview-data/system`. Permission requests use preview confirmation.

JavaScript and Native applications use the same SDK interfaces for these services:

| Service | Local preview behavior |
| --- | --- |
| Network | Asynchronous HTTP/HTTPS GET and POST over the computer's network, including timeout, cancellation and completion callbacks. HTTPS uses Windows certificate trust. Up to four requests run concurrently; each response is limited to 32 KiB. |
| Notifications | The device queue, banner and slide animations support posting, updating, cancelling, click callbacks and swipe dismissal. App Menu and input panels suspend display until closed. |
| Files | The device file service handles directory listings, metadata, range reads, atomic writes, directory creation, rename, move and delete. Private files are isolated by package; user files require read/write permissions. Replacing an existing user file requires its original SHA-256. |
| File picker | The user can select a computer file to read or a new path to export. Replacement of existing computer files is reserved for a future picker adapter. |
| Calendar and ToDo | The device repositories and permission rules store calendars, lists and tasks. |

File API private directories are stored in `.desktile/preview-data/system/desktile/data/<package-id>/files`; the simulated user directory is `.desktile/preview-data/system/desktile/user`. Place test files there directly. Preview storage and files explicitly selected through the computer picker are managed separately.

Bluetooth, remote calendar-subscription refresh and system background tasks require device validation. `files.copy` runs through a background task and is included in that scope. Notification previews cover the current application process; verify post-exit background lifecycles on the device.

Preview settings are saved separately in `%LOCALAPPDATA%/DeskTile/Preview/settings.json`: language, theme, font, scale, bounds, metrics, FPS cap and simulated status bar. Explicit `--locale` and `--theme` override saved values. Invalid values fall back to defaults. Tests can isolate configuration using `DESKTILE_PREVIEW_CONFIG_DIR`. Saving writes a temporary file before replacement.

## Native preview

Install Visual Studio 2022 or Build Tools with Desktop development with C++, MSVC x64 and Windows SDK. DevKit detects it automatically and reports missing dependencies.

```sh
desktile preview . --locale zh-HK --theme light
```

Each launch builds C/C++ source beneath `src` into `.desktile/preview-native/app.dll` using C++17 and selected SDK headers, including nested source/include folders. GCC export annotations are adapted only in temporary build copies. This host module is separate from the device ELF and `.dtapp`. Run trusted Native source; ESP-IDF, chip registers and Xtensa assembly need host implementations.

## Other tools

Static screenshot export produces light/dark PNGs. Manifest JSON Schema checks, JavaScript types, HTML `dt-` completion and Native include-path configuration aid editing. See [assets](assets.md), [CLI](cli.md), [device workflow](device.md) and [serial commands](serial.md).
