# Notes

[Documentation home](/en/) / [Application development](/en/guide/project.md) / [Examples](/en/examples/index.md)

A JavaScript application demonstrating list/editor navigation, private persistence and text import/export through system files.

[Download source](/downloads/notes-js.zip)

<!-- page-outline -->
[[toc]]

## Read the source

Read `manifest.json` for entry points, permissions and icons, `src/index.html` for lists/editor/dialogs, `src/main.js` for drafts, saves, dirty-state confirmation and asynchronous file results, and `locales/` for three-language messages.

## Data and actions

The private key `notes-v1` stores content. Check `persist`, `save` and `dirty`: reads are checked before parsing and saved state changes only after success. File permissions are requested at the operation and the page updates after asynchronous completion. See [storage](../services/storage.md) and [files](../services/files.md).

## Build

```sh
desktile build .
desktile check dist/hk.caner.desktile.notes.dtapp
```

## Verify

Create/save/reopen, then edit and exercise Save, Discard and Cancel. Test import/export with allowed and denied file permissions. Source count/length limits are choices for this application. The download contains Apache-2.0 and icon notices.
