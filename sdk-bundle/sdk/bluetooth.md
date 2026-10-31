# Bluetooth Low Energy

The ESP32-S3 backend implements BLE central and observer roles through the existing schema-1 asynchronous platform service. Native applications use `desktile::sdk::Bluetooth` from `desktile/bluetooth.hpp`; JavaScript applications use `DeskTile.bluetooth`. The public C ABI remains unchanged.

Declare `bluetooth` in the application manifest and obtain its user grant through the existing permission API before issuing commands, including status and event requests. Radio power is controlled by system Settings. An enabled radio initializes on the service worker; application commands do not silently turn it on. This backend supports BLE, rather than Bluetooth Classic audio or serial profiles.

## Commands

Every JSON command contains `schema: 1` and an `operation` with the `bluetooth.` prefix. Each submission returns through the ordinary request-completion mechanism. JavaScript helpers return a request ID or an immediate negative SDK error; Native helpers return `dt_result` and fill a request ID.

| Operation | Fields | Result |
| --- | --- | --- |
| `status` | None | `enabled`, `ready`, `connectionLimit`, `droppedEvents`, `systemConnections`, `uuidGatt`, and caller-owned or system Settings `connections` |
| `attach` | `connection` | Obtains exclusive application read/subscription access to an established Settings connection |
| `detach` | `connection` | Releases that access and asynchronously disables its remote subscriptions |
| `scan` | `durationMs`: 100–60000; `passive`: boolean, default true | Starts a bounded scan |
| `listen` | None | Starts passive advertisement reception until stopped |
| `stopScan` | None | Stops the caller's scan/listener |
| `connect` | `address`: six colon-separated hex octets; `addressType`: 0 public or 1 random | Allocates an opaque `connection`; await `connected` for the radio result |
| `disconnect` | `connection` | Requests disconnection of a caller-owned link |
| `pair` | `connection` | Initiates security on an established caller-owned link; await pairing/security events |
| `pairingReply` | `connection`, `action`: `input`, `display` or `confirm`; `prompt`: nonzero token; `passkey`: 0–999999; `accept`: boolean | Answers the current matching pairing prompt |
| `read` | `connection`, `attribute`: 1–65535 | Requests a GATT read by known attribute handle |
| `write` | `connection`, `attribute`, `data`: even-length hex, up to 244 bytes | Requests a GATT write with response |
| `discoverServices` | `connection`, optional `serviceUuid` | Streams matching service handles and a completion event |
| `discoverCharacteristics` | `connection`, `serviceUuid`, optional `characteristicUuid` | Streams matching characteristics within the first matching service |
| `discoverDescriptors` | `connection`, `serviceUuid`, `characteristicUuid`, optional `descriptorUuid` | Streams descriptors bounded by that characteristic's next declaration or service end |
| `readUuid` | `connection`, `serviceUuid`, `characteristicUuid` | Discovers the current value handle and reads it |
| `subscribe`, `unsubscribe` | `connection`, `serviceUuid`, `characteristicUuid` | Discovers the characteristic and its CCCD, then enables notification/indication or disables it |
| `nextEvent` | `timeoutMs`: 0–30000 | One event, or `{ "schema": 1, "event": null }` at timeout |

Native `write` accepts a byte span and serializes the same hex representation. JavaScript `scan()` defaults to a ten-second passive scan. JavaScript `nextEvent()` defaults to a thirty-second wait. Request scope follows the existing page/application scope mechanism. Reissue `nextEvent` after its completion to keep receiving; waiting occupies a bounded request slot, not the shared service worker. Use ordinary request cancellation when leaving the consuming page. Cancelling an event wait leaves its scan/connection running until explicitly stopped or the application context closes.

## Events and ownership

Event kinds include `advertisement`, `scanFinished`, `connected`, `disconnected`, `read`, `write`, `notification`, `reset`, `pairing`, `securityChanged`, `subscribed`, `unsubscribed`, `services`, `characteristics`, and `descriptors`. Fields include `schema`, `sequence`, `connection`, originating command `request`, SDK `result`, transport `detail`, `attribute`, `data` (hex), `scanResponse`, `truncated`, and device fields (`address`, `addressType`, `name`, `rssi`, `connectable`). UUID operations also carry their UUID fields. Discovery emits one matching item per event followed by the same event kind with `complete: true`. Item events have `complete: false`; `attribute` is the service start, characteristic value, or descriptor handle. Service items add `endAttribute`, characteristic items add the GATT `properties` bitmask, and descriptor items add `descriptorUuid`. An empty successful discovery ends with a successful completion event. A missing parent service or characteristic reports `DT_ERR_NOT_FOUND`. Applications should drain events while discovering and check `droppedEvents` for queue overflow.

UUID strings accept 16-bit, 32-bit and full 128-bit forms. Only one GATT procedure per connection runs at once; another submission returns `DT_ERR_BUSY`. Subscription setup selects notifications when available and indications otherwise. The completion event reports the discovered value handle for matching later `notification` events.

## Pairing and bonds

`status.connections` and the two security event kinds include `pairing`, `pairingAction`, `prompt`, `passkey`, `encrypted`, `authenticated`, and `bonded`. Other event payloads retain their existing fields. Link connection, encryption, authenticated pairing, and a stored bond are separate states; read the security result and flags to determine the actual outcome.

A `pairing` event requests input, display, or numeric confirmation. Present a six-digit code with leading zeros. For `input`, submit the code entered by the user. For `display` and `confirm`, echo the exact event code and prompt token; confirmation must reflect the user's decision. Rejecting input/display disconnects the link; rejecting numeric confirmation sends a negative security response. A stale token, different action, wrong confirmation code, or another owner's connection is rejected. A failed reply submission leaves the prompt available for retry when it is still current. Host callbacks may occur synchronously during command submission.

The backend advertises keyboard/display capability, requests bonding, Secure Connections and MITM protection, and exposes the negotiated security flags. The NimBLE store is initialized when enabling the radio, with NVS persistence enabled in namespace `nimble_bond`. Factory reset clears this namespace along with system data and retains its pending marker until all erase stages succeed. A repeat-pairing request preserves the existing bond and reports a permission error. Saved-device enumeration and explicit per-device forgetting remain pending work in the Settings integration.

Settings initiates security on its own links after a successful GAP connection event. Application-owned links retain application-controlled pairing and their own event inboxes. Settings presents numeric comparison and code-entry prompts using the existing connection sidebar and system numeric keyboard. Display-only pairing installs the generated code automatically and keeps it visible while the peer enters it. Code entry accepts exactly six ASCII digits, preserves leading zeros on screen, and clears the input on completion, cancellation, prompt expiry or radio shutdown. The existing shared service worker submits the replies.

The pinned ESP-IDF NimBLE NVS restore source reads the last bond entry even when the restored table is empty. `cmake/NimbleStoreSafety.cmake` generates a guarded build-local copy and substitutes that source in the Bluetooth component. Empty tables initialize their bond counter to zero; populated tables retain the vendor behavior. The installed SDK remains unchanged. An SDK source change that no longer matches the two reviewed expressions fails configuration for review.

The backend permits three concurrent links across all applications and one active scanner/listener owner. The observed-device cache holds 24 devices and the event queue holds 32 entries. Overflow is reported in `droppedEvents`; control/GATT events are favored over advertisements. There are four simultaneous event waits system-wide, at most one per context. Hardware coexistence and released memory capacity still require device acceptance measurements.

Application-created connections belong to their opaque context. Settings-created connections remain owned by Settings and appear with `system: true` to applications granted Bluetooth permission. `attach` grants one application context read, discovery and subscription access; direct writes, disconnect and pairing remain owner operations. This is a general SDK capability for all authorized applications.

An attached reader may track up to eight subscribed characteristics per connection. Detach, context close or permission revocation immediately suppresses its events and schedules CCCD disable writes on the worker. A subsequent attachment waits for in-flight procedures and subscription cleanup to finish. Cleanup retries failed submissions and acknowledgements while retaining the Settings link. Multiple subscriptions retain separate value/CCCD handles. Application-owned connections instead follow their existing disconnect-on-close lifecycle. A successful permission change synchronizes all live contexts of the same package, including queued event completions.

Completion-queue backpressure preserves the encoded event for retry. Timeout uses wrap-safe monotonic time. Event memory is allocated only for an active wait and is released on completion, cancellation or context close. Radio state is allocated when powered on and released after successful shutdown.

## Verification status

Production transport and event-service methods have deterministic host coverage for startup/shutdown, three links, ownership, stale handles, permission propagation/revocation, late callbacks, bounded queues, timeout, cancellation and completion backpressure. Integration uses the existing platform worker and request completions. Settings UI, physical radio interoperability and on-device memory/coexistence acceptance are tracked in the system refresh work ledger.

Pairing host tests cover input/display/confirmation, rejected and stale prompts, ownership, retry after injection/cancellation failure, synchronous callbacks, actual security flags, unsupported OOB handling, repeat pairing, and revocation. Native and JavaScript helpers serialize the same schema. Settings tests cover automatic pairing, prompt replies, six-digit keyboard validation, foreign-owner isolation, and stale/power-off input cleanup. Native renders cover all three prompt types in three languages and two themes, including sliced repaints. The reset test exercises production erase logic with mocked NVS failure/retry states. The NVS restore regression reproduces the original empty-table access and tests the generated correction across all 16 combinations of local/peer table counts from zero to three and restore failures. Saved-device management and physical bond persistence/interoperability acceptance remain outstanding.
