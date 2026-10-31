# User files

[Documentation home](/en/) / [System services](/en/services/)

`DeskTile.files` provides directory, content and file-picker operations. File payload `scope: "private"` targets application-private files; `scope: "user"` targets user files and requires read/write authorization.

<!-- page-outline -->
[[toc]]

## List a directory

```js
const request = DeskTile.files.list("Downloads", {
  scope: "user", offset: 0, limit: 16
});
```

Save the positive request ID. Match it in `onRequestComplete`, check the result and decode platform JSON with `DeskTile.platformResult(payload)`. Read directories in pages, updating the current path and offset on navigation. Request lifetime scope is separate from the file payload's storage scope; use the service's request-context options for page or application lifetime.

## Read content

```js
const request = DeskTile.files.read("Downloads/readme.txt", {
  scope: "user", offset: "0", maximum_bytes: 4096
});
```

Results include `data_base64`, `offset`, `next_offset`, `file_bytes` and `eof`. `DeskTile.files.bytes(result)` returns bytes; `DeskTile.files.text(result)` decodes text. Continue at `next_offset` until `eof` for larger files.

## Write and choose files

`writeText` writes text and `writeBytes` writes bytes. `create_only` requires a new file; `expected_sha256` checks the content version before replacement. Check completion before refreshing a list.

```js
DeskTile.files.writeText("Downloads/readme.txt", "Hello DeskTile", {
  scope: "user", create_only: true
});
```

`files.pick` starts the system file picker and returns the chosen path on success. Handle cancellation as an ordinary canceled action. Use [background tasks](tasks.md) for downloads or copies that must continue after exit. Exact fields are in [FilesApi](../api/platform.md#filesapi).
