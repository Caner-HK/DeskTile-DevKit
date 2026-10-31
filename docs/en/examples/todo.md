# ToDo

[Documentation home](/en/) / [Application development](/en/guide/project.md) / [Examples](/en/examples/index.md)

A Native C++ application using public SDK access to the shared task repository. Entry, model, view and controller are separated for a multi-page application.

[Download source](/downloads/native-todo.zip)

<!-- page-outline -->
[[toc]]

## Read the source

| File | Purpose |
| --- | --- |
| `manifest.json` | Native entry and task read/write permissions |
| `src/main.cpp` | Entry, lifecycle and events |
| `src/TodoModel.h` | State and records |
| `src/TodoController.h`, `TodoController.cpp` | Requests, actions and page coordination |
| `src/TodoView.cpp` | Lists, forms and dialogs |
| `src/TodoSchedule.cpp` | Task scheduling fields |
| `src/TodoTexts.h` | UI messages |

## Services

The shared service owns storage and permission checks. Requests belong to the application context and complete through events. Handle in-flight requests and keyboard sessions on departure. Read [shared data](../services/data.md), [permissions](../services/permissions.md) and [Native API](../api/native.md).

## Build

Install the ESP32-S3 Xtensa toolchain and replace the compiler path:

```sh
desktile build . --compiler "C:/toolchains/xtensa-esp32s3-elf-g++.exe"
desktile check dist/hk.caner.desktile.todo.dtapp
```

The extension uses `desktile.compilerPath` for the same toolchain.

## Verify

Test allowed/denied reads and writes; create, edit, complete and delete tasks; return during keyboard input; exit/reopen and compare records with the current list. Apache-2.0 source and icon notices accompany the download.
