# Private storage and cache

[Documentation home](/en/) / [System services](/en/services/)

Private storage holds application settings and business data. Keys are isolated by application, so separate apps may use the same `settings` key. Read packaged assets with resource APIs.

<!-- page-outline -->
[[toc]]

## Read settings

Use `storageReadResult` to distinguish first use from a read failure:

```js
const saved = DeskTile.storageReadResult("settings");
let settings = {schema: 1, enabled: true};
if (saved.result === 0) {
  settings = JSON.parse(DeskTile.utf8Decode(saved.data));
} else if (saved.result !== -8) {
  throw new Error("读取设置失败：" + saved.result);
}
```

`-8` means not found and permits defaults. After parsing, validate the schema, field types and ranges. Keep a `schema` version for migrations. Treat malformed data separately from missing data.

## Save and remove

```js
const bytes = DeskTile.utf8Encode(JSON.stringify(settings));
const result = DeskTile.storageWrite("settings", bytes.buffer);
if (result !== 0) {
  // 显示保存失败，保留尚未成功提交的编辑内容。
}
```

`storageWrite` returns the actual write result; `storageRemove` removes a key. Confirm the persisted state only after a successful save, and preserve unsaved edits on failure. One user action should commit one state change even if components report different activation/value events.

## Organize configuration

Group small settings with a common lifecycle into a versioned object. Save documents and other independent records separately. The SDK manages paths and application isolation. Fill new fields with defaults, explicitly migrate changed schemas and save the migrated result before confirming the new persistent state. Test first use, exit/reopen, updates, clearing data, uninstall and reinstall.

## Data boundaries

| Content | API | Lifecycle |
| --- | --- | --- |
| Preferences and business data | `storageReadResult`, `storageWrite` | Application-private data |
| Rebuildable thumbnails or results | `cacheRead`, `cacheWrite`, `cacheRemove` | Recreate after cache removal |
| User-selected imports and exports | [File service](files.md) | User directories and file permissions |
| Shared calendar/task/list records | [Shared data](data.md) | Service-managed identity, authorization and ownership |

Shared records use IDs returned by the service. The system derives caller identity from the context. Important business data belongs in private storage rather than disposable cache.

## Local preview

Application data lives in `.desktile/preview-data/<package-id>`, with shared service data under `.desktile/preview-data/system`. The application uses the same SDK calls. The preview tool's own settings live separately at `%LOCALAPPDATA%/DeskTile/Preview/settings.json`. Test reopening, deleting test records and permission denial as separate cases.
