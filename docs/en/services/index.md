# System services

[Documentation home](/en/)

The system owns service resources and caller identity. Applications submit requests through the SDK, receive results and release their resources.

| Service | Main responsibility |
| --- | --- |
| [Permissions](permissions.md) | Declare, request and handle authorization changes |
| [Private storage](storage.md) | Settings, data and read/write failures |
| [User files](files.md) | Permission-controlled file operations |
| [Network](network.md) | Requests and completion callbacks |
| [Background tasks](tasks.md) | Work managed by the system after page exit |
| [Notifications](notifications.md) | Post, update, cancel and handle clicks |
| [Bluetooth](bluetooth.md) | BLE discovery, connections and subscriptions |
| [Calendar and tasks](data.md) | Shared records and ownership |
| [Input](input.md) | System keyboard and editors |

## Permissions and results

Declare required permissions in `manifest.json`, check current authorization and give a clear reason when requesting access. Private storage is implicit application isolation. Background execution and notifications are separate permissions.

Positive request IDs mean accepted asynchronous work; negative values are immediate SDK errors. Some synchronous or already-satisfied operations return zero, according to their contracts. Save the ID and dispatch completion to its operation. Cancel page-scoped requests on navigation; manage application-scoped work with the application lifecycle.
