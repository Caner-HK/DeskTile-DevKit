# Project structure

[Documentation home](/en/)

An application consists of a manifest, code and resources. The `.dtapp` container identifies its package and entry points through the manifest.

| Path | Purpose |
| --- | --- |
| `manifest.json` | Identity, entry points, permissions and resources |
| `src/` | Page entries and application logic |
| `ui/` | Copied JavaScript component and navigation modules |
| `locales/` | Catalog and messages for each language |
| `assets/` | Icons and images |
| `.desktile/types/` | JavaScript editor declarations |
| `dist/` | Generated installers |

<!-- page-outline -->
[[toc]]

## Manifest

Declare the package ID, localized name, author, version, runtime, entry, icons, permissions and SDK requirements. Keep the package ID stable across updates. `version` is human-readable; `version_code` orders updates. SDK `minimum` and `target` currently use `1.0`. Query optional capabilities at runtime.

## Pages and logic

The JavaScript document entry creates the component tree. Scripts handle events and business state. One entry can manage several views through modules, navigation and shared components. The framework manages common navigation; the application owns the meaning of its data.

## Resources and data

Package resources are read-only inputs. Use [private storage](../services/storage.md) for settings and business data, and file-service APIs for user-selected files. Language resources belong in `locales`.

## Development configuration

`desktile.json` records the SDK and build target. `jsconfig.json` configures editor checks. `.desktile/types` contains SDK declarations. The builder prepares content in a temporary directory and replaces output only after a successful build, preserving the last successful artifact on failure.
