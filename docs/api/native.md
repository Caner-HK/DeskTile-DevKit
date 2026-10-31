# Native API

[文档首页](/) / [API 参考](/api/)

宿主函数表使用应用上下文隔离组件、请求、存储与资源。先检查 `abi_version` 与实际能力。

<!-- page-outline -->
[[toc]]

## 宿主函数表

每项签名来自 `sdk.h`。`dt_bytes` 是调用期间借用的内存；回调数据需要跨回调使用时由应用复制。读取缓冲区过小时，按返回的 `size` 准备足够空间再重试。

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

## C++ 包装器

在应用中包含对应头文件。包装器建立在相同的 C ABI 上。

| 头文件 | 源码 |
| --- | --- |
| `adaptive_choice.hpp` | [查看声明](/api-source/include/adaptive_choice.hpp) |
| `base64.hpp` | [查看声明](/api-source/include/base64.hpp) |
| `bluetooth.hpp` | [查看声明](/api-source/include/bluetooth.hpp) |
| `bluetooth_uuid.hpp` | [查看声明](/api-source/include/bluetooth_uuid.hpp) |
| `color_palette.hpp` | [查看声明](/api-source/include/color_palette.hpp) |
| `color_palette_paint.hpp` | [查看声明](/api-source/include/color_palette_paint.hpp) |
| `color_scheme.hpp` | [查看声明](/api-source/include/color_scheme.hpp) |
| `config_state.hpp` | [查看声明](/api-source/include/config_state.hpp) |
| `confirmation_dialog.hpp` | [查看声明](/api-source/include/confirmation_dialog.hpp) |
| `date.hpp` | [查看声明](/api-source/include/date.hpp) |
| `date_time_picker.hpp` | [查看声明](/api-source/include/date_time_picker.hpp) |
| `file_metadata.hpp` | [查看声明](/api-source/include/file_metadata.hpp) |
| `file_picker.hpp` | [查看声明](/api-source/include/file_picker.hpp) |
| `font_preferences.hpp` | [查看声明](/api-source/include/font_preferences.hpp) |
| `geometry.hpp` | [查看声明](/api-source/include/geometry.hpp) |
| `icon_appearance.hpp` | [查看声明](/api-source/include/icon_appearance.hpp) |
| `json.hpp` | [查看声明](/api-source/include/json.hpp) |
| `list.hpp` | [查看声明](/api-source/include/list.hpp) |
| `locale.hpp` | [查看声明](/api-source/include/locale.hpp) |
| `messages.hpp` | [查看声明](/api-source/include/messages.hpp) |
| `native_sample.hpp` | [查看声明](/api-source/include/native_sample.hpp) |
| `navigation.hpp` | [查看声明](/api-source/include/navigation.hpp) |
| `notifications.hpp` | [查看声明](/api-source/include/notifications.hpp) |
| `progress.hpp` | [查看声明](/api-source/include/progress.hpp) |
| `record_store.hpp` | [查看声明](/api-source/include/record_store.hpp) |
| `save_state.hpp` | [查看声明](/api-source/include/save_state.hpp) |
| `scaffold.hpp` | [查看声明](/api-source/include/scaffold.hpp) |
| `scaffold_view.hpp` | [查看声明](/api-source/include/scaffold_view.hpp) |
| `sdk.hpp` | [查看声明](/api-source/include/sdk.hpp) |
| `settings_path.hpp` | [查看声明](/api-source/include/settings_path.hpp) |
| `settings_state.hpp` | [查看声明](/api-source/include/settings_state.hpp) |
| `splash_policy.hpp` | [查看声明](/api-source/include/splash_policy.hpp) |
| `stepper.hpp` | [查看声明](/api-source/include/stepper.hpp) |
| `system_app.hpp` | [查看声明](/api-source/include/system_app.hpp) |
| `task_list.hpp` | [查看声明](/api-source/include/task_list.hpp) |
| `text_limits.hpp` | [查看声明](/api-source/include/text_limits.hpp) |
| `tile_icon.hpp` | [查看声明](/api-source/include/tile_icon.hpp) |
| `tile_time_model.hpp` | [查看声明](/api-source/include/tile_time_model.hpp) |
| `tile_time_picker.hpp` | [查看声明](/api-source/include/tile_time_picker.hpp) |
| `wave_progress.hpp` | [查看声明](/api-source/include/wave_progress.hpp) |
| `wrap.hpp` | [查看声明](/api-source/include/wrap.hpp) |

## 结构、事件和枚举

[完整 sdk.h](/api-source/include/sdk.h) 提供事件布局、返回码和宿主 ABI；[契约](contract.md) 提供组件与服务数据约束。
