<p align="center">
  <img src="assets/logo.svg" width="200" height="200" alt="DeskTile Logo">
</p>

<h1 align="center">DeskTile DevKit</h1>

<p align="center">
  The application development toolkit for DeskTile OS<br>
  SDK 1.0, VS Code extension, command-line tools and local interactive preview
</p>

<p align="center">English | <a href="README.zh-CN.md">简体中文</a></p>

<p align="center">
  <a href="https://caner-hk.github.io/DeskTile-DevKit/en/">Documentation</a> |
  <a href="https://github.com/Caner-HK/DeskTile-DevKit/releases">Downloads</a> |
  <a href="https://github.com/Caner-HK/DeskTile-DevKit/issues">Issues</a>
</p>

---

DeskTile DevKit supports JavaScript and Native C++ application development, with tools for creating projects, previewing interfaces, building packages and debugging on a device.

## Features

- Create, build and validate `.dtapp` application packages.
- Use SDK type declarations, manifest validation and component completion in VS Code.
- Run JavaScript and host-built Native applications locally to preview interactions, themes, languages and status-bar states.
- Convert images and create application icons, notification icons and assets for different tile sizes.
- Install and launch applications over USB, monitor serial logs and inspect device performance.
- Transfer user files through the File app's FTP server.
- Browse Chinese and English development guides, component references, APIs and application examples.

## Requirements

| Feature | Requirements |
| --- | --- |
| VS Code extension | Visual Studio Code 1.95 or later |
| CLI and application packaging | Node.js 20+ and Python 3.10+ |
| Local interactive preview | Windows x64 |
| Native device builds | ESP32-S3 C/C++ toolchain |
| Native local preview | Visual Studio Desktop development with C++ |

Image conversion uses Pillow, SVG conversion uses CairoSVG, and USB serial tools use pyserial. See [Install the tools](https://caner-hk.github.io/DeskTile-DevKit/en/start/install.html) for setup instructions.

## Installation

Download the appropriate package from [Releases](https://github.com/Caner-HK/DeskTile-DevKit/releases/latest):

| File | Purpose |
| --- | --- |
| `desktile-devkit-1.0.0-win32-x64.vsix` | VS Code extension, including the SDK and Windows preview resources |
| `desktile-devkit-1.0.0.tgz` | Standalone command-line toolkit |
| `DeskTile-DevKit-1.0.0-windows-x64.zip` | Complete Windows toolkit and offline documentation |
| `artifacts.json` | Release file sizes and SHA-256 checksums |

In VS Code, open the Extensions view menu, choose **Install from VSIX**, and select the downloaded `.vsix`. After installation, search for `DeskTile DevKit` in the Command Palette.

Install the command-line tools with npm:

```powershell
npm install --global .\desktile-devkit-1.0.0.tgz
desktile doctor
```

## Quick start

Create a JavaScript application, build its package and open the interactive preview:

```powershell
desktile new my-app --id com.example.myapp --name "My App" --author "Example"
desktile build my-app
desktile preview my-app
```

Connect a device and enable USB debugging to install the generated package:

```powershell
desktile install .\my-app\dist\com.example.myapp.dtapp --port COM4
```

See [Device workflow](https://caner-hk.github.io/DeskTile-DevKit/en/tools/device.html) for connection, permission and Native installation requirements.

## Documentation and examples

- [Application development](https://caner-hk.github.io/DeskTile-DevKit/en/guide/project.html)
- [Design and components](https://caner-hk.github.io/DeskTile-DevKit/en/components/)
- [API reference](https://caner-hk.github.io/DeskTile-DevKit/en/api/)
- [CLI reference](https://caner-hk.github.io/DeskTile-DevKit/en/tools/cli.html)
- [Notes example](sdk-bundle/examples/notes-js)
- [Timer example](sdk-bundle/examples/timer-js)
- [ToDo example](sdk-bundle/examples/native-todo)

The complete toolkit includes offline documentation. Run `desktile docs` and open the local address printed by the command.

## Local preview

The preview provides theme, language, font and scale settings, layout boundaries, simulated status-bar values and host performance information. See the [preview documentation](https://caner-hk.github.io/DeskTile-DevKit/en/tools/) for supported services and device testing requirements.

This repository contains the SDK, examples and development tool sources. Windows preview executables and the runtime font pack are distributed through Releases. To use the preview from a source checkout, copy the complete release archive's `renderer/` contents into the repository's corresponding directory.

## License

Original DevKit code, SDK, templates, examples and documentation are licensed under the [Apache License 2.0](LICENSE). Third-party components, fonts and icons retain their respective licenses. See [NOTICE](NOTICE), [third-party notices](THIRD-PARTY-NOTICES.md) and [licenses](licenses/).
