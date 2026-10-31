# Pages, events and lifecycle

[Documentation home](/en/) / [Application development](/en/guide/project.md)

Entering the foreground, switching an internal page and exiting the application are separate transitions. Resource ownership should match each transition.

<!-- page-outline -->
[[toc]]

## Entry and callbacks

Read saved settings and create the page in `enter()`. Distinguish a missing setting on first use from a failed read.

| Callback | Purpose |
| --- | --- |
| `enter()` | Read settings and create the page |
| `onEvent(event, target, value)` | Handle component activation and changes |
| `onRequestComplete(request, result, payload)` | Receive asynchronous results |
| `onPermissionResult(request, permission, state)` | Continue or end work awaiting authorization |
| `update(now)` | Advance time-dependent state using the monotonic clock |
| `onExit()` | Handle system back/exit requests |
| `leave()` | Release application-session resources |

Identify components by event target. Update affected properties to preserve page and scroll state. Release subscriptions and temporary resources when leaving their owning view; keep shared session data at application scope.

## Exit and background work

`leave()` cleans up the application session. A page closing is distinct from a background task finishing. Background permission authorizes supported execution mechanisms; each task API defines its lifecycle. Notifications require their own permission, in addition to background and network/file/Bluetooth permissions required by the actual work.

## Asynchronous results

An accepted request has a positive ID. Save it and dispatch completion to the original operation. Check that its page is still current before using component handles. Page-scoped requests are canceled when their page leaves; application-scoped requests follow the application session. Use [system tasks](../services/tasks.md) for work such as downloads that must survive application exit.
