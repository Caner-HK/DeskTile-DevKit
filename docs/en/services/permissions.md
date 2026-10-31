# Permissions

[Documentation home](/en/) / [System services](/en/services/)

Declare purposes in manifest `permissions`, then check and request access through the SDK. System settings manage authorization by package identity and affect later calls.

<!-- page-outline -->
[[toc]]

## Request access

For networking, declare `"permissions": ["network"]`. Its numeric ID is 0:

```js
const state = DeskTile.permission(0);
if (state !== 1) {
  const request = DeskTile.requestPermission(0, "获取最新列车资讯");
  // request > 0：等待 onPermissionResult。
  // request === 0：已经获得授权，可以继续操作。
  // request < 0：申请未被接受，按错误码处理。
}

function onPermissionResult(request, permission, state) {
  if (permission === 0 && state === 1) {
    // 开始此前等待授权的网络操作。
  }
}
```

States are 0 (not asked), 1 (allowed) and 2 (denied). A positive request ID means wait for `onPermissionResult`; zero means already authorized; a negative result means the request was rejected. Match the callback's request ID and permission and handle refusal in the relevant feature.

## Permission identifiers

| Purpose | Manifest name | ID |
| --- | --- | --- |
| Network | `network` | 0 |
| Private storage | `private-storage` | 1 |
| Read user files | `user-files.read` | 2 |
| Modify user files | `user-files.write` | 3 |
| Bluetooth | `bluetooth` | 4 |
| Notifications | `notifications` | 5 |
| Supported background work | `background` | 6 |
| Keep display awake | `display.keep-awake` | 7 |
| Basic device information | `device.basic-info` | 8 |
| Calendar read/write | `calendar.read`, `calendar.write` | 14, 15 |
| Tasks read/write | `tasks.read`, `tasks.write` | 16, 17 |

Private storage is implicit application capability. IDs 9–13 are system-management capabilities for system-trusted applications. See the [complete definitions](/api-source/permissions.json).

## Revocation and failures

Check every call's actual result. Revocation, application disabling and device-state changes can invalidate previous successes. Release requests/subscriptions and show the result in the affected feature. Background and notification permissions are separate; see [tasks](tasks.md).
