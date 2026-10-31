# Background tasks

[Documentation home](/en/) / [System services](/en/services/)

The system task service stores status and executes supported work. A page presents progress while the system manages the task after the page closes. Query tasks by ID or list them when re-entering.

## Workflow

1. Declare and obtain the operation's permissions, such as network, destination-file access and applicable background authorization.
2. Submit a supported task and keep its returned identity.
3. Query status on the progress page. Release UI and page requests when leaving.
4. Query again on re-entry to show completion, failure, cancellation or progress.
5. Use notification authorization and task-completion rules for reminders.

`DeskTile.tasks` and Native wrappers share the platform protocol: submission, listing, query, cancel, retry, removal and presented-progress registration. See the [API reference](../api/).

## Choose the execution model

Use network requests for short foreground work. Delegate persistent downloads and copies to task services. Background permission authorizes supported system mechanisms; arbitrary JavaScript loops follow the application's runtime lifetime. Read [notifications](notifications.md) for progress visibility and completion messages.
