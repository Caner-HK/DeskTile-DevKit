# Bluetooth BLE

[Documentation home](/en/) / [System services](/en/services/)

JavaScript uses `DeskTile.bluetooth`; Native uses `<desktile/bluetooth.hpp>`. The ESP32-S3 backend provides BLE central and observer roles, scanning, connections, pairing, GATT discovery, reads, writes and characteristic notifications.

<!-- page-outline -->
[[toc]]

## Prerequisites

Declare and obtain `bluetooth` permission. System settings control radio power. Query `status.enabled`, `ready`, `uuidGatt` and the connection list before acting. Methods return a request ID or immediate error; completion returns JSON. Wireless connection, read and subscription results also arrive through `nextEvent`.

## Scan and receive events

```js
const scanRequest = DeskTile.bluetooth.scan({durationMs: 10000, passive: true});
let eventRequest = DeskTile.bluetooth.nextEvent(30000);

function onRequestComplete(request, result, payload) {
  if (request !== eventRequest) return;
  if (result < 0) { eventRequest = 0; return; }
  const event = DeskTile.platformResult(payload);
  if (event.event === 'advertisement') {
    // 用 address 和 addressType 区分设备，name 可能为空。
  }
  eventRequest = DeskTile.bluetooth.nextEvent(30000);
}

function leave() {
  if (eventRequest > 0) DeskTile.cancelRequest(eventRequest);
  eventRequest = 0;
  DeskTile.bluetooth.stopScan();
}
```

`nextEvent` timeout returns `event: null`. Start the next wait after completion, cancel the owning request on exit and stop scanning. Use `listen` for sustained passive advertisements and `stopScan` to end it. Identify devices by address and address type; a name may be absent.

## Connection ownership

`connect(address, addressType)` creates an application-owned connection. Wait for `connected` before GATT operations. Use the scan-provided address type: 0 public or 1 random.

Connections established in system settings have `system: true`. `attach(connection)` obtains read, discovery and subscription access. `detach(connection)` removes access and subscriptions while the system retains its connection. Writing, disconnecting and pairing require ownership. Application-owned connections are released with their context; permission revocation reaches active contexts.

## UUID operations

UUID strings may be 16-bit, 32-bit or full 128-bit.

| Method | Arguments after connection | Purpose |
| --- | --- | --- |
| `discoverServices` | optional service UUID | Discover services |
| `discoverCharacteristics` | service UUID, optional characteristic UUID | Discover characteristics |
| `discoverDescriptors` | service UUID, characteristic UUID, optional descriptor UUID | Discover descriptors |
| `readUuid` | service UUID, characteristic UUID | Resolve and read a value |
| `subscribe` | service UUID, characteristic UUID | Configure CCCD and receive updates |
| `unsubscribe` | service UUID, characteristic UUID | Stop updates |

```js
// connection 来自当前应用可访问的已连接设备。
const request = DeskTile.bluetooth.readUuid(connection, '180f', '2a19');
```

Discovery emits individual results and a final `complete: true` event, including empty results. Subscription completion reports the value handle, which identifies later `notification` events. A connection runs one GATT procedure at a time; wait for completion when busy. Known handles can use `read`/`write`. Writes accept even-length hexadecimal data, at most 244 bytes. Device protocols define UUIDs, byte order, units and security.

## Pairing

Connection, encryption, authentication and bonding are distinct. Call `pair` when required by the protocol. A `pairing` event supplies `pairingAction`, `prompt` and `passkey`. Reply through `pairingReply(connection, action, prompt, passkey, accept)`. Preserve leading zeros in six-digit codes and follow the user's numeric-confirmation choice. Stale prompts and other applications' connections are rejected. Check final `securityChanged` results and flags.

## Capacity and cleanup

The backend supports three connections, one scan/listen owner, 32 queued events and one pending event wait per context. Consume events and check `droppedEvents`. Distinguish immediate call errors, request completion and final wireless events. Clean up on power-off, disconnection, revocation and exit. See [platform types](../api/platform.md) and [Native API](../api/native.md).
