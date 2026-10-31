# Command-line reference

[Documentation home](/en/) / [Development tools](/en/tools/)

<!-- page-outline -->
[[toc]]

## Commands

| Command | Purpose |
| --- | --- |
| `desktile doctor` | Check SDK, Python, optional Native compiler and preview tools |
| `desktile new <directory>` | Create a project with `--id`, `--name`, `--author` |
| `desktile build [directory]` | Build `.dtapp`; current directory by default |
| `desktile check <package>` | Validate paths, bounds, hashes and entries |
| `desktile preview [directory]` | Run a JavaScript or host-built Native application |
| `desktile screenshot [directory]` | Export static markup; select HTML with `--page` |
| `desktile icon [directory]` | Convert PNG/SVG into icons and tiles, preview, then `--apply` |
| `desktile image [directory]` | Convert PNG/JPEG/WebP/SVG/DTI into package image assets |
| `desktile deploy <package> --sd <root>` | Copy to SD installer directory |
| `desktile push <local-file> <device-path> --host <address>` | Upload through the File app FTP server |
| `desktile pull <device-path> <local-file> --host <address>` | Download from the device user directory |
| `desktile install <package> --port COM4` | Transfer through USB and invoke the device installer |
| `desktile profile --port COM4 --seconds 60` | Collect device metrics |
| `desktile docs` | Serve bundled documentation locally |
| `desktile devices` | List serial ports |
| `desktile monitor --port COM4` | Receive logs; `--log-file` enables rotating capture |
| `desktile run [directory] --port COM4` | Send an installed-application launch command |

## SDK and environment

SDK selection priority is `--sdk`, `DESKTILE_SDK`, then the bundled SDK. Python uses `--python`, `DESKTILE_PYTHON`, then `python` on PATH. `new --kind javascript` is default; `--kind native` creates C++. Select the Native compiler with `--compiler` or `DESKTILE_COMPILER`.

## Build and deployment

`build --output <file>` overrides `dist/<package-id>.dtapp`. `--signing-key <PEM>` signs; otherwise a development package is produced. `deploy --replace` replaces an existing SD installer at `desktile/user/Packages/<package-id>.dtapp`. Install that package through the device application installer.

## Preview and documentation

`preview --locale zh-HK --theme dark` overrides saved startup settings. Locales are `zh-CN`, `zh-HK`, `en-US`; themes are light/dark. The toolbar controls appearance, bounds and host metrics. `screenshot --page src/index.html --output <directory>` selects markup and light/dark output; default output is `.desktile/preview`.

`docs --port 8800` serves on `127.0.0.1`; Ctrl+C stops it. English pages are under `/en/`.

## Assets and automation

Icons require `--source`, `--purpose application|tile|notification` and `--mode system|custom`; `--padding 8` sets the percentage inset. Images use `--source`, `--output assets/picture.dti`, optional proportional width/height bounds, color mode and `--replace` for existing output. See [assets](assets.md).

Exit codes are 0 success, 1 failure and 130 cancellation. `--json` returns single-line result JSON; errors contain `error.code` and `error.message`. Build logs go to stderr. Give parallel builds separate output paths and quote paths according to the host shell.

```sh
desktile build . --json
```
