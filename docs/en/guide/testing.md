# Testing applications

[Documentation home](/en/) / [Application development](/en/guide/project.md)

<!-- page-outline -->
[[toc]]

## Local checks

`desktile build` validates manifests, entries and resources. `desktile check` validates paths, file-table bounds and file digests. Device trust settings decide whether a signature is accepted.

`desktile preview` runs JavaScript through QuickJS, or a Native module built for the host, with the actual component engine. Test clicks, dragging, scrolling, text input, App Menu, timers and persistence. The toolbar provides theme, layout bounds, host metrics and 15/30/60 FPS limits. JavaScript uses the runtime memory and execution budgets. Device binaries and hardware behavior require device testing.

```sh
desktile preview my-app --locale zh-HK --theme light
desktile screenshot my-app --page src/index.html
```

`desktile screenshot` exports 800 × 480 light and dark PNGs for static HTML layout inspection.

## Lifecycle scenarios

Local checks can exercise HTTP/HTTPS requests, notification queues and click callbacks, file directory operations, and shared calendar/ToDo data. See the [preview service coverage](../tools/index.md#persistence-and-simulated-services). Bluetooth, remote calendar subscriptions and system background tasks require device tests.

Cover first launch, back, exit, reopen, permission denial/revocation, lost network and failed storage writes. For background work, verify continuation after exit, progress restoration and notification callbacks.

## Performance

Use realistic amounts of text, images and cross-day records. Compare memory at idle, after entry, after interaction and after exit; repeat to check release. Host metrics describe the host tool. Device measurements establish hardware performance and touch behavior.

## Logs

USB debugging input and output have separate developer switches. Capture a complete operation, including panic and backtrace lines when present. [Serial commands](../tools/serial.md) explain how to send diagnostics safely with the intended port and page state.
