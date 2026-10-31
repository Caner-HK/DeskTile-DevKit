# Changelog

## [1.0.0] - 2026-10-31

Initial public release: SDK 1.0, Tools 1.

### Added

- A VS Code tools panel for environment checks, package inspection and USB device installation, with Chinese and English interfaces, progress, cancellation and setup actions.
- Separate tool-version and supported-SDK metadata in CLI output, environment results and distribution manifests.
- Automatic ESP32-S3 toolchain discovery and validated compiler selection, with an installation guide and build retry.

- VS Code extension with Chinese and English interfaces, project creation, environment checks, application builds, manifest validation and SDK completion.
- Command-line tools for JavaScript and Native C++ projects, `.dtapp` packaging, package validation and SD deployment.
- Windows x64 interactive preview for JavaScript and host-built Native applications, including application menus, input, scrolling and local storage.
- Preview settings for system language, theme, font, display scale and simulated status-bar values, with persistent local configuration.
- Preview adapters for HTTP/HTTPS requests, notification queues and activation callbacks, user files, calendars and tasks.
- Image conversion and icon editing tools with system-colored and original-color assets, notification icons and per-size tile previews.
- USB application installation, application launch, serial monitoring and device performance visualization.
- File upload and download commands through the device File app's FTP server.
- Chinese and English SDK documentation, component examples, API references and downloadable Notes, Timer and ToDo application sources.
- Apache-2.0 licensing for original DevKit content, with third-party license and attribution files.

### Fixed

- Native builds now check the selected compiler, target and matching strip executable before invoking the package builder.
- SDK navigation pixel rounding builds in GCC 14 freestanding mode without depending on hosted C++ math headers.

[1.0.0]: https://github.com/Caner-HK/DeskTile-DevKit/releases/tag/v1.0.0
