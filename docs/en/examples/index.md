# Application examples

[Documentation home](/en/) / [Application development](/en/guide/project.md)

<!-- page-outline -->
[[toc]]

## Complete application source

| Application | Runtime | Reference topics |
| --- | --- | --- |
| [Notes](notes.md) | JavaScript | Editor, private storage, import/export, unsaved changes |
| [Timer](timer.md) | JavaScript | Duration, countdown, overdue state, restoration |
| [ToDo](todo.md) | Native C++ | Shared tasks, permissions, lists, forms, asynchronous work |

Each page links a source ZIP with manifest, entries, icons and languages. The same code is in `sdk-bundle/examples`. Open a folder and build through VS Code or `desktile build .`.

The three examples use Apache-2.0. Packages include `LICENSE` and original icon licenses under `licenses/`. They retain their real package IDs; change ID, name and author when creating your own application.

## JavaScript reading template

`sdk-bundle/examples/scaffold-js` includes reading/settings pages, three languages, text-size persistence and save-error handling. Project creation copies it and sets application identity.

## Native reading template

`sdk-bundle/examples/scaffold-native` uses the public C++ wrappers with the same page structure. Device builds require the Xtensa toolchain; local builds use the [Native preview](../tools/#native-preview) toolchain.

## Adapting an example

Start with titles/body text in language resources, then add pages and business logic. Consult [components](../components/) and [services](../services/) for correct usage.
