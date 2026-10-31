# Notifications

[Documentation home](/en/) / [System services](/en/services/)

The system manages application identity, queueing, banners and click callbacks. JavaScript and Native share delivery and authorization rules. Check capabilities and obtain `notifications` permission for the relevant operation.

<!-- page-outline -->
[[toc]]

## Authorization and background work

Declare `notifications` in the manifest. Foreground delivery needs notification authorization. Background work also needs `background` and permissions required by its operation. Supported system tasks provide continued execution; notification permission authorizes visible messages.

## Notification icon

```json
{
  "icons": {
    "application": "assets/application.dti",
    "tile": "assets/tile.dti",
    "notification": {"path": "assets/notification.dti", "mode": "system"}
  }
}
```

| Mode | Appearance | DTI encoding |
| --- | --- | --- |
| `system` | Banner foreground color | alpha8, encoding 3 |
| `custom` | Supplied colors and transparency | RGB565 0 or masked RGB565 2 |

The icon is square, 16–128 px per side. Banners render it at 32 px; 32 × 32 resources map directly. Omission uses the system bell. Package and installer validation check paths, dimensions, encoding, length and integrity.

## Post, update and cancel

After authorization:

```js
const request = DeskTile.postNotification({
  id: 'download', title: '下载完成', body: 'report.pdf',
  data: 'file:report.pdf'
});
DeskTile.updateNotification({
  id: 'download', title: '可以查看文件', body: 'report.pdf',
  data: 'file:report.pdf'
});
DeskTile.cancelNotification('download');
```

Positive IDs complete through `onRequestComplete`; immediate failures return negative SDK errors. Accepted messages enter the queue. An ID is scoped to its application. Updating replaces all fields; omitted body, callback data and event time use defaults. Updating or canceling an unknown ID returns `DT_ERR_NOT_FOUND`.

## Click callback

```js
function onNotification(notification) {
  if (notification.data === 'file:report.pdf') {
    DeskTile.router.navigate('document', {path: 'report.pdf'});
  }
}
```

The application registers its own `document` route. Clicking a banner enters the owning application and delivers `id` and `data`; an already foreground application receives it directly. Native uses `DT_EVENT_NOTIFICATION`, `dt_notification_event_v1` and `DT_LAUNCH_NOTIFICATION` when launched from a notification.

## Event time

`eventTime` is an integer Unix-seconds timestamp from 1 to 253402300799. It describes the event discussed by the notification and produces relative labels such as now, five minutes ago or in ten minutes. Omission uses publication time.

```js
DeskTile.postNotification({
  id: 'meeting-42', title: '会议提醒', body: '每周例会',
  eventTime: DeskTile.wallClockSeconds() + 10 * 60,
  data: 'meeting:42'
});
```

This posts immediately about a meeting ten minutes away. Deferred posting needs a supported task/event mechanism to submit at that time.

## Native

```cpp
#include <desktile/notifications.hpp>
desktile::sdk::Notifications notifications(host);
dt_request_id request = 0;
dt_result result = notifications.post(
    "download", "Download complete", "report.pdf", "file:report.pdf", request);
```

The final optional `post`/`update` argument is event time in Unix seconds. The C ABI passes UTF-8 JSON to `notification_post`.

## Queue and lifecycle

| Item | Rule |
| --- | --- |
| UTF-8 sizes | ID 1–64 bytes, title 1–128, body up to 320, data up to 256 |
| Queue | Eight entries including the current banner; full returns `DT_ERR_BUSY` |
| Visibility | Five seconds; updating the visible banner restarts its timer |
| Pause | Touch, system modal interaction or sleep pauses timing |
| Removal | Expiry, swipe dismissal or cancellation removes the transient record |
| Exit | Accepted banners survive application exit |
| Authorization/data | Revocation, disabling, uninstall or clear-data removes the application's queue |

The current service supplies local banners. Persistent history, a notification center and remote push are separate capabilities.

## System-task completion

On success or final failure, the system checks notification authorization and whether the task's progress is currently presented. Downloads, copies, moves, verification and visible calendar-sync tasks use this rule.

Report actually visible tasks with `DeskTile.tasks.presented([taskId])`, up to 12 IDs. Update when scrolling, navigating or being covered; send an empty array when leaving. Application exit clears this registration. Polling a list alone does not mark progress visible.

Completion `data` is a JSON string such as `{"taskId":"123"}`. Parse it, query the task and open its page.
