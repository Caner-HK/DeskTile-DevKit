# Calendar and tasks

[Documentation home](/en/) / [System services](/en/services/)

`DeskTile.data` accesses shared `events`, `tasks` and `lists`. Authorized applications share records; the system maintains creator identity and revisions.

<!-- page-outline -->
[[toc]]

## Create and query

Declare the relevant calendar or task read/write permissions.

```js
const request = DeskTile.data.create("tasks", {
  title: "准备资料", completed: false,
  due_date: "2026-11-01", due_time: "09:00"
});
```

A positive return is a request ID. Decode completion with `platformResult` and retain the returned `id` and `revision`. Use paginated `list` and single-record `get`.

## Update and delete

```js
DeskTile.data.update("tasks", task.id, task.revision, {completed: true});
```

Updates and deletes include the last-read revision. On conflict, reread and decide against current content. The system-maintained `creator` records ownership; calls are checked against the current application identity and permissions.

## Boundaries

Keep preferences and editing drafts in private storage. Use shared services for collaborative calendar/list/task records. Test external updates/deletion and permission revocation. See [SharedDataApi](../api/platform.md#shareddataapi) and [SharedRecord](../api/platform.md#sharedrecord).
