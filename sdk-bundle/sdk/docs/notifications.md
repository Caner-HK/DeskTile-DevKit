# Local notifications

The system owns notification identity, delivery and activation. JavaScript and
Native apps use the same queue and permission checks. Query
`DT_CAPABILITY_NOTIFICATIONS` before using this API.

Declare `notifications` in the app manifest and request the user's permission.
Foreground posting needs this permission. Background work additionally needs
`background` and the permissions required by that work. Notification permission
does not keep an app alive. This service delivers local banners.

## Package icon

An independent `icons.notification` declaration supports the same two rendering
models as desktop tile icons:

```json
"icons": {
  "application": "assets/application.dti",
  "tile": "assets/tile.dti",
  "notification": {"path": "assets/notification.dti", "mode": "system"}
}
```

* `system`: the supplied shape uses the banner's foreground color. Supply a
  `DTI1` alpha8 image (`DT_IMAGE_THEME_MASK`, encoding 3).
* `custom`: the supplied image retains its colors and transparency. Supply
  `DT_IMAGE_RGB565` (encoding 0) or `DT_IMAGE_MASKED_RGB565` (encoding 2).

The dedicated resource must be square, 16 to 128 pixels per side. A native
32-pixel asset gives direct pixel mapping in the banner. The package builder and
installer check declaration, path, dimensions, encoding, payload length and
integrity. Empty transparent icons fail validation. Omitting the declaration
uses the system notification bell.

The first phase uses this resource only in the banner. Status bar notification
icons and persistent notification history belong to the notification-center phase.

## JavaScript

```js
// After the user grants notification permission:
const request = DeskTile.postNotification({
  id: 'download', title: 'Download complete', body: 'report.pdf', data: 'file:report.pdf'
});
// Replace an active or waiting notification belonging to this app:
DeskTile.updateNotification({id: 'download', title: 'Ready to open', body: 'report.pdf'});
DeskTile.cancelNotification('download');

function onNotification(notification) {
  // Called after this app has entered, or immediately if already in the foreground.
  openView(notification.data);
}
```

Each call returns a positive request ID, followed by `onRequestComplete` with
the acceptance result, or an immediate negative SDK error. Completion means
the system accepted the operation. The banner may still be waiting its turn.

## Native

```cpp
#include <desktile/notifications.hpp>
desktile::sdk::Notifications notifications(host);
dt_request_id request = 0;
const dt_result result = notifications.post("download", "Download complete",
                                          "report.pdf", "file:report.pdf", request);
notifications.update("download", "Ready to open", "report.pdf", "file:report.pdf", request);
notifications.cancel("download", request);
```

Handle `DT_EVENT_NOTIFICATION` with a `dt_notification_event_v1` payload to receive
`id` and `data`. A cold launch has origin `DT_LAUNCH_NOTIFICATION`. The event is
delivered after the app's normal enter routine, including for Native modules.

## Delivery contract

`eventTime` is an optional integer Unix timestamp in **seconds**, from 1 to
253402300799. It identifies the event the notification is about and defaults to
the time of posting. The system formats its relative time in the current system
language, including future events, past events and "Now". Delivery happens when
the notification reaches the front of the queue. The display deadline remains
five seconds from presentation.

For a meeting ten minutes away, post the reminder now:

```js
DeskTile.postNotification({
  id: 'meeting-42', title: 'Meeting reminder', body: 'Weekly meeting',
  eventTime: Math.floor(Date.now() / 1000) + 10 * 60,
  data: 'meeting:42'
});
```

Native callers pass the optional timestamp as the final `post` or `update`
argument. A zero final argument omits the field. For example:

```cpp
notifications.post("meeting-42", "Meeting reminder", "Weekly meeting",
                   "meeting:42", request, meetingUnixSeconds);
```

The status-bar clock keeps showing the current system time on the left; the
event's relative time appears on the right. App name, resolved from its manifest,
and notification text use native 22px regular weight. The content row has 24px
side insets; both status-bar times remain native 20px. A vertical divider with 16 pixels of
space on each side separates the app name from the notification text.

* IDs are scoped to the caller's package. Posting the same ID replaces that
  app's existing notification; it never changes another app's message.
* IDs: 1–64 UTF-8 bytes; title: 1–128; body: at most 320; data: at most 256.
  Values must be valid UTF-8 without embedded NUL or control characters.
* Post and update replace the whole message, including `body`, `data` and `eventTime`.
  Omitted optional fields become empty. Update or cancel of a missing ID returns
  `DT_ERR_NOT_FOUND`.
* Up to eight banners, including the displayed banner, wait in FIFO order.
  A full queue returns `DT_ERR_BUSY`; accepted messages keep their place.
* Each banner displays for five seconds. Updating the visible banner starts
  a fresh five seconds. Touching it, a system modal or sleep pauses its timer.
* Tap opens the owning app and delivers `id` and `data`. Swipe dismisses it.
  Expiry, dismissal and cancellation remove the transient record.
* App exit preserves accepted banners. Revoking notification permission,
  disabling/uninstalling the app or clearing its data removes its queued banners.

The C ABI transport remains `notification_post` with UTF-8 JSON. Its payload is
`{"action":"post|update|cancel","id":"...","title":"...","body":"...","data":"..."}`.
The payload also accepts optional `eventTime`. The action defaults to `post`;
cancel requires only action and ID. Unknown fields,
duplicate keys and invalid data are rejected. Title-only legacy messages need
to be updated to include an app-scoped ID.
# Background task results

The system posts a result notification for a visible Runtime task when it succeeds or finally fails and its owner has granted `notifications`. This includes `network.download`, `file.copy`, `file.move`, `file.verify` and visible `calendar.sync` tasks. Intermediate network retries, hidden tasks and explicit cancellation stay silent. `background` authorizes task execution; `notifications` separately authorizes its result banner. Existing completed records are not replayed at boot.

Declare `notifications` and request permission from a relevant foreground action. Refusing notifications leaves an otherwise authorized task running.

Report only task IDs whose progress is actually visible using `DeskTile.tasks.presented([id])` in JavaScript, or a Native platform request `{"schema":1,"operation":"tasks.presented","ids":["123"]}`. Replace the list when scrolling or changing pages, and send an empty list when progress is covered or the page is left. Up to 12 IDs are accepted. IDs are scoped to the calling application's identity. Closing the application clears this registration; the JavaScript router also clears it during page transitions. Polling `tasks.list` alone leaves notifications enabled.

The completion decision uses the presented IDs at completion time. Results not already visible enter the existing bounded banner queue. Application name and icon come from the system package identity. Result titles follow the system language; the body contains the task title. Clicking delivers the existing `DT_EVENT_NOTIFICATION` / `onNotification` callback with ID `task-<taskId>-<attempt>` and JSON data string `{"taskId":"123"}`. Resolve that task through `tasks.get` or `tasks.list`. The built-in Files app opens and scrolls its task list to the selected task. If its editor or download form is in use, the destination is retained until that interaction finishes.

