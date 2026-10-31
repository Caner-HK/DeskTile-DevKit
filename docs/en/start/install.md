# Install the tools

[Documentation home](/en/)

DeskTile DevKit targets SDK 1.0. Prepare your development computer before choosing an application runtime.

<!-- page-outline -->
[[toc]]

## VS Code extension

Choose **Install from VSIX** in VS Code and select `desktile-devkit-1.0.0-win32-x64.vsix`. Open an application folder to display DeskTile DevKit in Explorer. Run **Check Development Environment** before building; results appear in the output panel.

The extension follows the VS Code display language. **Interface language** selects automatic, Simplified Chinese or English for panels and prompts. Reload the window after changing it. Command-palette titles follow VS Code itself.

## Dependencies

JavaScript builds need Python 3.10 or newer. The CLI also needs Node.js 20 or newer. Set `desktile.pythonPath` to select Python. Install `pyserial` for serial access and `cryptography` for signing with `python -m pip install pyserial cryptography`.

The local preview includes a Windows x64 host with QuickJS and the native component renderer. Native C++ device builds require the ESP32-S3 Xtensa toolchain; set `desktile.compilerPath` to `xtensa-esp32s3-elf-g++`. Native local preview requires the Visual Studio C++ desktop workload described in [tools](../tools/).

## SDK location

The complete distribution includes `sdk-bundle`. **Select SDK** can select another SDK 1.0 folder containing `delivery-manifest.json`, `sdk`, `tools` and `examples`.

## Command line

Run these commands in the extracted DevKit root:

```sh
npm install --global .
desktile doctor
```

You can also run `node bin/desktile.js doctor`. Install a standalone CLI archive with `npm install --global desktile-devkit-1.0.0.tgz`. Updates install a new VSIX or npm package while project sources and device data remain in their own locations.

## Offline documentation

Run `desktile docs` to read the bundled site. The portable distribution includes VuePress sources and a lock file in `documentation`; run `npm ci` and `npm run build` there to rebuild it with a current Node.js LTS release.
