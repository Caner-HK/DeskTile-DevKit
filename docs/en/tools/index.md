# Development tools

[Documentation home](/en/)

The VS Code extension and `desktile` CLI share the SDK, templates and package builder.

<!-- page-outline -->
[[toc]]

## VS Code

Select the DeskTile logo in the Activity Bar to open the dedicated DeskTile DevKit sidebar. Its tools include project creation, application icons and tiles, resource import, build, preview, package inspection, USB installation, device metrics, SD copying, launch, serial monitoring, documentation and Settings. Settings uses five tabs: SDK, Development environment, Updates, Interface and About. Interface contains language and toolbox location settings. Choose Activity Bar or Explorer under Toolbox location; the selection takes effect immediately and is saved. Commands are also available in the command palette. Builds can be canceled; details go to the DeskTile DevKit output channel.

### Tools panel

**Check environment** displays results and configuration actions inside Settings > Development environment. Command palette checks and compiler recovery during builds use the same settings tab. **Inspect package** and **Install on device** retain independent editor tabs with their own selections and job state. Environment actions are aligned at the right of each row. The compiler row's More actions picker offers directory search and setup guidance. Cancellation waits for computer-side subprocess cleanup and reports a normal cancelled result.

- **Environment** reports the selected SDK, Python, Node.js, Native compiler, serial dependency, image conversion and interactive preview. Choose Python or a compiler, search a toolchain directory, install Python dependencies or select an SDK. Execution logs go to the DeskTile DevKit output channel.
- **Package inspection** shows the localized application name, package ID, version and code, runtime, SDK target, permissions, size and files. Results appear after the file table and SHA-256 integrity checks pass. The device performs signature trust verification.
- **Device installation** lets you choose a package, refresh/select a serial port and start installation. Progress includes transfer percentage, device verification, Native confirmation and the final result. Cancel or close stops the computer-side job; an installation already started on the device may continue.

Enable USB debugging input and output and release other programs using the serial port. An already-installed version is reported separately. The CLI retains the corresponding `doctor`, `check` and `install` commands.

### Native device compiler

Device packages require `xtensa-esp32s3-elf-g++` and its matching `xtensa-esp32s3-elf-strip` in the same directory. Tools check explicit configuration, PATH, `IDF_TOOLS_PATH`, the user's `.espressif/tools` and common Espressif installation directories. Validation checks that the compiler runs and targets Xtensa.

If the toolchain is missing, open the compiler row's **More actions → Find toolchain** to search its installation directory, or **Choose compiler** to select the executable. A validated selection is saved to the VS Code user setting `desktile.compilerPath`. **More actions → Toolchain setup guide** opens Espressif's official Windows setup guide. Install the ESP32-S3 tools, then check again. CLI `--compiler` or `DESKTILE_COMPILER` settings take precedence over automatic discovery.

A toolchain error during Native builds opens Environment with **Retry build**. Native desktop preview uses MSVC; device packages use Xtensa. Configure each environment for its own target.

### Tool and SDK versions

DevKit tool versions and SDK versions are recorded separately. This edition is **SDK 1.0, Tools 2**, with the VS Code/npm package version **1.0.1**. SDK **1.0** is bundled and supported. `desktile --version`, CLI environment results and release manifests show the SDK and tool revision separately.

Tool revisions increase within each SDK series: SDK 1.0 Tools 1, SDK 1.0 Tools 2, and so on. A new SDK series starts with Tools 1. This release is Tools 2; subsequent updates increment the tool revision and corresponding package version. Each tool release declares its supported SDKs. Applications select their SDK through `sdk.target` and manage their own `version` and `version_code`. Updating tools preserves the saved SDK path; developers can explicitly select another SDK supported by that release.

### Check for updates

In **Settings > Updates**, choose **Check for Updates** to read stable public GitHub Releases and their `artifacts.json` metadata. Progress, results and errors appear in this tab, with cancellation and another check available. The command palette update check opens the same tab. Tools filter releases for the selected SDK and compare package versions, excluding drafts and prereleases. Results offer the VSIX download, release notes or releases page. Install the downloaded VSIX through VS Code's **Install from VSIX** command.

Release metadata keeps `sdk`, `supportedSdks`, `toolRevision` and `version` separate. No compatible update, no stable release, timeout and GitHub request limits each have a specific result.

### Code completion

- **HTML**: complete `dt-` tags, attributes, boolean and SDK enum values, system icon IDs and project DTI resource paths. Existing attributes are removed from suggestions.
- **JavaScript**: type `DeskTile.` for SDK APIs. `DeskTile.require("ui/…")` offers SDK module paths; module variables offer their actual exports and signatures. Generated `.desktile/types` and `jsconfig.json` retain VS Code type-based IntelliSense.
- **Native C++**: `#include <desktile/…>` offers selected SDK headers. With the Microsoft C/C++ extension installed, new projects' generated `.vscode/c_cpp_properties.json` configures SDK header IntelliSense.

Suggestions use the selected SDK's contract, declarations and headers. Press `Ctrl+Space` to open completion manually.

### Interface language

The extension follows VS Code by default. **Interface language** selects automatic, Simplified Chinese or English for extension panels and prompts; reload afterward. Command-palette titles follow the editor language. The preview application's system language is a separate preview setting.

### Project creation

**Create application** opens an independent form for JavaScript or Native C++, application name, package ID, author, parent directory and new folder name. Project location previews the complete path. Create validates the form, generates the project and opens it. If the destination already exists, choose another folder name.

## Local interactive preview

JavaScript uses the matching QuickJS runtime. Native compiles project source into a Windows x64 module and runs its entry, lifecycle and events through NativeAppRunner. Both use the native component engine, supporting clicks, navigation, drag/wheel scrolling, timers, input and local persistence.

The toolbar offers theme, layout bounds, host performance, FPS cap, App Menu and settings. **100% is 800 × 480 physical screen pixels**. Toolbar controls follow host DPI outside the application viewport and wrap when needed. Settings group Interface, App preview and Status bar options: host light/dark theme and Chinese/English language, app scale, fonts, system language, simulated Wi-Fi and battery level. The host interface follows VS Code's theme and extension language by default, or Windows when launched independently. Explicit interface choices persist separately from the simulated application's theme and language.

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

**[Application Icons and Tiles](assets.md#application-icons-and-tiles)** manages application identity and desktop tiles. **[Import Resources](assets.md#import-resources)** provides **Import icon** and **Import image** tabs for system-coloured icons and original-colour images, with optional preview, direct saving and Image markup.

Static screenshot export produces light/dark PNGs. Manifest JSON Schema checks, JavaScript types, HTML `dt-` completion and Native include-path configuration aid editing. See [assets](assets.md), [CLI](cli.md), [device workflow](device.md) and [serial commands](serial.md).
