# Native API

[Documentation home](/en/) / [API reference](/en/api/)

The host function table uses the application context to isolate components, requests, storage and resources. Check `abi_version` and optional capabilities. `dt_bytes` borrows memory for the call; copy data needed after a callback. If a read buffer is too small, allocate the returned size and retry.

## Host function table

### abi_version

```c
uint32_t abi_version;
```

### log

```c
void (*log)(dt_app_context context, uint8_t level, const char *message);
```

### monotonic_ms

```c
uint64_t (*monotonic_ms)(dt_app_context context);
```

### wall_clock_seconds

```c
int64_t (*wall_clock_seconds)(dt_app_context context);
```

### permission_check

```c
dt_permission_state (*permission_check)(dt_app_context context, dt_permission permission);
```

### permission_request

```c
dt_result (*permission_request)(dt_app_context context, dt_permission permission,
                                    const char *reason, dt_request_id *request);
```

### ui_create

```c
dt_result (*ui_create)(dt_app_context context, dt_component_kind kind, dt_handle *component);
```

### ui_destroy

```c
dt_result (*ui_destroy)(dt_app_context context, dt_handle component);
```

### ui_append

```c
dt_result (*ui_append)(dt_app_context context, dt_handle parent, dt_handle child);
```

### ui_set

```c
dt_result (*ui_set)(dt_app_context context, dt_handle component, dt_property property,
                        dt_bytes value);
```

### ui_present

```c
dt_result (*ui_present)(dt_app_context context, dt_handle root);
```

### storage_read

```c
dt_result (*storage_read)(dt_app_context context, const char *key, dt_mutable_bytes *value);
```

### storage_write

```c
dt_result (*storage_write)(dt_app_context context, const char *key, dt_bytes value);
```

### storage_remove

```c
dt_result (*storage_remove)(dt_app_context context, const char *key);
```

### network_request

```c
dt_result (*network_request)(dt_app_context context, dt_bytes request,
                                 dt_request_id *request_id);
```

### request_cancel

```c
dt_result (*request_cancel)(dt_app_context context, dt_request_id request_id);
```

### keyboard_show

```c
dt_result (*keyboard_show)(dt_app_context context, dt_bytes options,
                               dt_request_id *request_id);
```

### request_exit

```c
dt_result (*request_exit)(dt_app_context context);
```

### abi_version

```c
/* App resources are immutable;
```

### resource_read

```c
cache records are package-isolated and may
     * be removed by the system at any time. */
    dt_result (*resource_read)(dt_app_context context, const char *path,
                               dt_mutable_bytes *value);
```

### resource_size

```c
dt_result (*resource_size)(dt_app_context context, const char *path,
                               uint64_t *size);
```

### resource_read_range

```c
dt_result (*resource_read_range)(dt_app_context context, const char *path,
                                    uint64_t offset, dt_mutable_bytes *value);
```

### cache_read

```c
dt_result (*cache_read)(dt_app_context context, const char *key,
                            dt_mutable_bytes *value);
```

### cache_write

```c
dt_result (*cache_write)(dt_app_context context, const char *key, dt_bytes value);
```

### cache_remove

```c
dt_result (*cache_remove)(dt_app_context context, const char *key);
```

### notification_post

```c
/* Payloads for network, keyboard and notifications are UTF-8 JSON documents
     * described by the public contract. Results are delivered through
     * DT_EVENT_REQUEST_COMPLETE. */
    dt_result (*notification_post)(dt_app_context context, dt_bytes notification,
                                   dt_request_id *request_id);
```

### device_state

```c
dt_result (*device_state)(dt_app_context context, dt_device_state_v1 *state);
```

### user_files_list

```c
dt_result (*user_files_list)(dt_app_context context, const char *path,
                                 uint32_t offset, dt_request_id *request_id);
```

### platform_request

```c
/* Available only when DT_CAPABILITY_PLATFORM_SERVICES is advertised.
     * The existing v1 table prefix is unchanged. Completion payload is UTF-8 JSON. */
    dt_result (*platform_request)(dt_app_context context, dt_bytes request_json,
                                  dt_request_id *request_id);
```

### ui_get

```c
/* Copy a stored property from a component owned by this context.
     * Requires DT_CAPABILITY_COMPONENT_READ. size reports the required bytes. */
    dt_result (*ui_get)(dt_app_context context, dt_handle component, dt_property property,
                       dt_mutable_bytes *value);
```

### abi_version

```c
/* Current system UI font: 16/20/22/32/48px;
```

### text_width

```c
bounded UTF-8 up to 1024 bytes. */
    dt_result (*text_width)(dt_app_context context, dt_bytes text, uint16_t font_size,
                           int32_t *width);
```

## C++ wrappers

The wrappers use the same C ABI. [Download sdk.h](/api-source/include/sdk.h) for structures, events and enums.

| Header | Reference |
| --- | --- |
| `adaptive_choice.hpp` | [View declaration](/api-source/include/adaptive_choice.hpp) |
| `base64.hpp` | [View declaration](/api-source/include/base64.hpp) |
| `bluetooth.hpp` | [View declaration](/api-source/include/bluetooth.hpp) |
| `bluetooth_uuid.hpp` | [View declaration](/api-source/include/bluetooth_uuid.hpp) |
| `color_palette.hpp` | [View declaration](/api-source/include/color_palette.hpp) |
| `color_palette_paint.hpp` | [View declaration](/api-source/include/color_palette_paint.hpp) |
| `color_scheme.hpp` | [View declaration](/api-source/include/color_scheme.hpp) |
| `config_state.hpp` | [View declaration](/api-source/include/config_state.hpp) |
| `confirmation_dialog.hpp` | [View declaration](/api-source/include/confirmation_dialog.hpp) |
| `date.hpp` | [View declaration](/api-source/include/date.hpp) |
| `date_time_picker.hpp` | [View declaration](/api-source/include/date_time_picker.hpp) |
| `file_metadata.hpp` | [View declaration](/api-source/include/file_metadata.hpp) |
| `file_picker.hpp` | [View declaration](/api-source/include/file_picker.hpp) |
| `font_preferences.hpp` | [View declaration](/api-source/include/font_preferences.hpp) |
| `geometry.hpp` | [View declaration](/api-source/include/geometry.hpp) |
| `icon_appearance.hpp` | [View declaration](/api-source/include/icon_appearance.hpp) |
| `json.hpp` | [View declaration](/api-source/include/json.hpp) |
| `list.hpp` | [View declaration](/api-source/include/list.hpp) |
| `locale.hpp` | [View declaration](/api-source/include/locale.hpp) |
| `messages.hpp` | [View declaration](/api-source/include/messages.hpp) |
| `native_sample.hpp` | [View declaration](/api-source/include/native_sample.hpp) |
| `navigation.hpp` | [View declaration](/api-source/include/navigation.hpp) |
| `notifications.hpp` | [View declaration](/api-source/include/notifications.hpp) |
| `progress.hpp` | [View declaration](/api-source/include/progress.hpp) |
| `record_store.hpp` | [View declaration](/api-source/include/record_store.hpp) |
| `save_state.hpp` | [View declaration](/api-source/include/save_state.hpp) |
| `scaffold.hpp` | [View declaration](/api-source/include/scaffold.hpp) |
| `scaffold_view.hpp` | [View declaration](/api-source/include/scaffold_view.hpp) |
| `sdk.hpp` | [View declaration](/api-source/include/sdk.hpp) |
| `settings_path.hpp` | [View declaration](/api-source/include/settings_path.hpp) |
| `settings_state.hpp` | [View declaration](/api-source/include/settings_state.hpp) |
| `splash_policy.hpp` | [View declaration](/api-source/include/splash_policy.hpp) |
| `stepper.hpp` | [View declaration](/api-source/include/stepper.hpp) |
| `system_app.hpp` | [View declaration](/api-source/include/system_app.hpp) |
| `task_list.hpp` | [View declaration](/api-source/include/task_list.hpp) |
| `text_limits.hpp` | [View declaration](/api-source/include/text_limits.hpp) |
| `tile_icon.hpp` | [View declaration](/api-source/include/tile_icon.hpp) |
| `tile_time_model.hpp` | [View declaration](/api-source/include/tile_time_model.hpp) |
| `tile_time_picker.hpp` | [View declaration](/api-source/include/tile_time_picker.hpp) |
| `wave_progress.hpp` | [View declaration](/api-source/include/wave_progress.hpp) |
| `wrap.hpp` | [View declaration](/api-source/include/wrap.hpp) |
