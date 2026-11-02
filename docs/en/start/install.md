# Install the tools

[Documentation home](/en/)

DeskTile DevKit targets SDK 1.0. Prepare your development computer before choosing an application runtime.

<!-- page-outline -->
[[toc]]

## Download DeskTile DevKit

The latest version is available from [GitHub Releases](https://github.com/Caner-HK/DeskTile-DevKit/releases/latest). The current release is **1.0.0**. Local interactive preview targets **Windows x64**.

| Download | Purpose |
| --- | --- |
| [VS Code extension (VSIX)](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/desktile-devkit-1.0.1-win32-x64.vsix) | Development in VS Code, including the SDK and preview runtime |
| [Command-line tools (TGZ)](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/desktile-devkit-1.0.1.tgz) | Install the standalone CLI with npm |
| [Complete Windows toolkit (ZIP)](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/DeskTile-DevKit-1.0.1-windows-x64.zip) | Tools, SDK, preview, examples and offline documentation |
| [Checksum manifest](https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/artifacts.json) | Release file sizes and SHA-256 checksums |

Choose the VSIX for development in VS Code, or the complete ZIP for standalone tools and offline documentation. GitHub's Source code downloads contain repository sources; preview runtime files are included in the release assets above. Browse the [source repository](https://github.com/Caner-HK/DeskTile-DevKit) or [report an issue](https://github.com/Caner-HK/DeskTile-DevKit/issues).

## VS Code extension

Choose **Install from VSIX** in VS Code and select `desktile-devkit-1.0.1-win32-x64.vsix`. Open an application folder to display DeskTile DevKit in Explorer. Run **Check Development Environment** before building. The tools panel displays results and provides Python, compiler and dependency setup actions. It also includes package inspection and device installation; see [Development tools](../tools/).

The extension follows the VS Code display language. **Interface language** selects automatic, Simplified Chinese or English for panels and prompts. Reload the window after changing it. Command-palette titles follow VS Code itself.

## Dependencies

JavaScript builds need Python 3.10 or newer. The CLI also needs Node.js 20 or newer. Set `desktile.pythonPath` to select Python. Install `pyserial` for serial access and `cryptography` for signing with `python -m pip install pyserial cryptography`.

The local preview includes a Windows x64 host with QuickJS and the native component renderer. Native C++ device builds require the ESP32-S3 Xtensa toolchain. Environment checks common installation directories automatically. Use **Find toolchain** or **Choose compiler** to save a validated `xtensa-esp32s3-elf-g++` to `desktile.compilerPath`. Validation checks the target and matching strip executable. **Install toolchain** opens the official setup guide. Native local preview requires the Visual Studio C++ desktop workload described in [tools](../tools/).

## SDK location

The complete distribution includes `sdk-bundle`. **Select SDK** can select another SDK 1.0 folder containing `delivery-manifest.json`, `sdk`, `tools` and `examples`.

## Command line

Run these commands in the extracted DevKit root:

```sh
npm install --global .
desktile doctor
```

You can also run `node bin/desktile.js doctor`. Install a standalone CLI archive with `npm install --global desktile-devkit-1.0.1.tgz`. Updates install a new VSIX or npm package while project sources and device data remain in their own locations.

## Offline documentation

Run `desktile docs` to read the bundled site. The portable distribution includes VuePress sources and a lock file in `documentation`; run `npm ci` and `npm run build` there to rebuild it with a current Node.js LTS release.
