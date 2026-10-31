#ifndef DESKTILE_SDK_H
#define DESKTILE_SDK_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define DT_SDK_ABI_MAJOR 1u
#define DT_SDK_ABI_MINOR 0u
#define DT_SDK_ABI_VERSION ((DT_SDK_ABI_MAJOR << 16u) | DT_SDK_ABI_MINOR)

typedef uint32_t dt_app_context;
typedef uint32_t dt_handle;
typedef uint32_t dt_request_id;

typedef enum dt_result {
    DT_OK = 0,
    DT_ERR_PERMISSION_DENIED = -1,
    DT_ERR_NOT_SUPPORTED = -2,
    DT_ERR_INVALID_ARGUMENT = -3,
    DT_ERR_STORAGE = -4,
    DT_ERR_CANCELLED = -5,
    DT_ERR_BUSY = -6,
    DT_ERR_OUT_OF_MEMORY = -7,
    DT_ERR_NOT_FOUND = -8,
    DT_ERR_BUFFER_TOO_SMALL = -9,
    DT_ERR_DEVICE = -10
} dt_result;

typedef struct dt_bytes {
    const uint8_t *data;
    size_t size;
} dt_bytes;

typedef struct dt_mutable_bytes {
    uint8_t *data;
    size_t capacity;
    size_t size;
} dt_mutable_bytes;

typedef enum dt_permission {
    DT_PERMISSION_NETWORK = 0,
    DT_PERMISSION_PRIVATE_STORAGE = 1,
    DT_PERMISSION_USER_FILES_READ = 2,
    DT_PERMISSION_USER_FILES_WRITE = 3,
    DT_PERMISSION_BLUETOOTH = 4,
    DT_PERMISSION_NOTIFICATIONS = 5,
    DT_PERMISSION_BACKGROUND = 6,
    DT_PERMISSION_DISPLAY_KEEP_AWAKE = 7,
    DT_PERMISSION_DEVICE_BASIC_INFO = 8,
    DT_PERMISSION_SYSTEM_SETTINGS = 9,
    DT_PERMISSION_SYSTEM_UPDATE = 10,
    DT_PERMISSION_PACKAGE_INSTALL = 11,
    DT_PERMISSION_PACKAGE_MANAGE = 12,
    DT_PERMISSION_DEVICE_PROVISION = 13,
    DT_PERMISSION_CALENDAR_READ = 14,
    DT_PERMISSION_CALENDAR_WRITE = 15,
    DT_PERMISSION_TASKS_READ = 16,
    DT_PERMISSION_TASKS_WRITE = 17
} dt_permission;

typedef enum dt_permission_state {
    DT_PERMISSION_UNKNOWN = 0,
    DT_PERMISSION_GRANTED = 1,
    DT_PERMISSION_DENIED = 2
} dt_permission_state;

typedef enum dt_component_kind {
    DT_COMPONENT_PAGE,
    DT_COMPONENT_SYSTEM_BAR,
    DT_COMPONENT_ROW,
    DT_COMPONENT_COLUMN,
    DT_COMPONENT_STACK,
    DT_COMPONENT_GRID,
    DT_COMPONENT_SCROLL_VIEW,
    DT_COMPONENT_TEXT,
    DT_COMPONENT_IMAGE,
    DT_COMPONENT_ICON,
    DT_COMPONENT_BUTTON,
    DT_COMPONENT_TOGGLE,
    DT_COMPONENT_SLIDER,
    DT_COMPONENT_LIST,
    DT_COMPONENT_LIST_ROW,
    DT_COMPONENT_TEXT_FIELD,
    DT_COMPONENT_DIALOG,
    DT_COMPONENT_PROGRESS,
    DT_COMPONENT_CANVAS_VIEW,
    DT_COMPONENT_CHECKBOX,
    DT_COMPONENT_CHOICE_STEPPER,
    DT_COMPONENT_LIST_NOTE,
    DT_COMPONENT_DOCUMENT_EDITOR,
    DT_COMPONENT_DATE_TIME_PICKER,
    DT_COMPONENT_DURATION_PICKER
} dt_component_kind;

/* Property payloads are encoded as documented by dt_property_value_kind.
 * Text and resource values are UTF-8 byte sequences without a trailing NUL. */
typedef enum dt_property_value_kind {
    DT_VALUE_UTF8,
    DT_VALUE_BOOL,
    DT_VALUE_I32,
    DT_VALUE_U32,
    DT_VALUE_F32,
    DT_VALUE_COLOR,
    DT_VALUE_EDGE_INSETS,
    DT_VALUE_SIZE,
    DT_VALUE_BYTES
} dt_property_value_kind;

typedef enum dt_property {
    DT_PROPERTY_TEXT,
    DT_PROPERTY_ACCESSIBILITY_LABEL,
    DT_PROPERTY_RESOURCE,
    DT_PROPERTY_ICON,
    DT_PROPERTY_VISIBLE,
    DT_PROPERTY_ENABLED,
    DT_PROPERTY_CHECKED,
    DT_PROPERTY_VALUE,
    DT_PROPERTY_MINIMUM,
    DT_PROPERTY_MAXIMUM,
    DT_PROPERTY_FOREGROUND,
    DT_PROPERTY_BACKGROUND,
    DT_PROPERTY_ACCENT,
    DT_PROPERTY_FONT_SIZE,
    DT_PROPERTY_FONT_WEIGHT,
    DT_PROPERTY_WIDTH,
    DT_PROPERTY_HEIGHT,
    DT_PROPERTY_MIN_WIDTH,
    DT_PROPERTY_MIN_HEIGHT,
    DT_PROPERTY_MAX_WIDTH,
    DT_PROPERTY_MAX_HEIGHT,
    DT_PROPERTY_PADDING,
    DT_PROPERTY_MARGIN,
    DT_PROPERTY_GAP,
    DT_PROPERTY_FLEX_GROW,
    DT_PROPERTY_ALIGNMENT,
    DT_PROPERTY_JUSTIFICATION,
    DT_PROPERTY_SCROLL_AXIS,
    DT_PROPERTY_GRID_COLUMNS,
    DT_PROPERTY_CANVAS_COMMANDS,
    DT_PROPERTY_BUTTON_STYLE,
    DT_PROPERTY_SURFACE_STYLE,
    DT_PROPERTY_DIALOG_PRESENTATION,
    DT_PROPERTY_FOREGROUND_ROLE,
    DT_PROPERTY_TEXT_WRAP,
    DT_PROPERTY_REPEAT_INTERVAL,
    DT_PROPERTY_DIALOG_TITLE_DIVIDER,
    DT_PROPERTY_ICON_TRAILING,
    DT_PROPERTY_DIALOG_BORDER,
    DT_PROPERTY_DIALOG_BORDER_COLOR,
    DT_PROPERTY_INDETERMINATE,
    DT_PROPERTY_STATUS_BAR_BACKGROUND,
    DT_PROPERTY_STATUS_BAR_FOREGROUND,
    DT_PROPERTY_DIALOG_DESTRUCTIVE,
    DT_PROPERTY_SLOT_POSITION,
    DT_PROPERTY_STEP,
    DT_PROPERTY_PROGRESS_STYLE,
    DT_PROPERTY_ANIMATION_DURATION,
    DT_PROPERTY_ANIMATION_DELAY,
    DT_PROPERTY_ITEM_SIZE,
    DT_PROPERTY_ITEM_GAP,
    DT_PROPERTY_DOCUMENT_HEADINGS,
    DT_PROPERTY_DOCUMENT_CURSOR,
    DT_PROPERTY_DOCUMENT_SCROLL,
    DT_PROPERTY_DOCUMENT_FOCUSED,
    DT_PROPERTY_DOCUMENT_CARET_VISIBLE,
    DT_PROPERTY_PLACEHOLDER,
    DT_PROPERTY_POINTER_INPUT,
    DT_PROPERTY_DATE_TIME_CONFIG,
    DT_PROPERTY_LIST_HAS_FOLLOWING_CONTENT,
    /* I32 scroll offset along the view's configured axis; writes are clamped. */
    DT_PROPERTY_SCROLL_POSITION,
    DT_PROPERTY_TEXT_STRIKETHROUGH,
    /* Optional dt_date_time_corner_text_v1; absent means hidden. */
    DT_PROPERTY_DATE_TIME_CORNER_TEXT,
    /* Optional root-page dt_navigation_presentation_v1. Probe ui_set support. */
    DT_PROPERTY_NAVIGATION_PRESENTATION
} dt_property;

typedef struct dt_navigation_presentation_v1 {
    uint32_t structure_size;
    int32_t x,y,width,height,panel_width,content_inset;
} dt_navigation_presentation_v1;

typedef enum dt_slot_position { DT_SLOT_LEADING=0, DT_SLOT_MIDDLE=1, DT_SLOT_TRAILING=2 } dt_slot_position;
typedef enum dt_progress_style { DT_PROGRESS_DETERMINATE=0, DT_PROGRESS_TRAVELLING_SQUARES=1, DT_PROGRESS_PULSING_BARS=2 } dt_progress_style;

typedef enum dt_dialog_presentation {
    DT_DIALOG_EMBEDDED = 0,
    DT_DIALOG_CENTERED = 1
} dt_dialog_presentation;

typedef enum dt_foreground_role {
    DT_FOREGROUND_DEFAULT = 0,
    DT_FOREGROUND_ACCENT = 1,
    DT_FOREGROUND_DANGER = 2,
    DT_FOREGROUND_SECONDARY = 3,
    DT_FOREGROUND_BODY = 4,
    DT_FOREGROUND_DISABLED = 5,
    DT_FOREGROUND_PRIMARY = 6,
    DT_FOREGROUND_SUCCESS = 7,
    DT_FOREGROUND_WARNING = 8
} dt_foreground_role;

typedef enum dt_surface_style {
    DT_SURFACE_DEFAULT = 0,
    DT_SURFACE_ACCENT = 1,
    DT_SURFACE_RAISED = 2,
    DT_SURFACE_FULLSCREEN = 3,
    DT_SURFACE_POPUP = 4
} dt_surface_style;

typedef enum dt_button_style {
    DT_BUTTON_PRIMARY = 0,
    DT_BUTTON_SECONDARY = 1,
    DT_BUTTON_DESTRUCTIVE = 2,
    DT_BUTTON_FLOATING = 3,
    DT_BUTTON_TEXT = 4,
    DT_BUTTON_NAVIGATION = 5,
    DT_BUTTON_TIME_STEPPER = 6,
    DT_BUTTON_OUTLINED = 7,
    DT_BUTTON_CIRCULAR = 8,
    DT_BUTTON_CANCEL = 9,
    DT_BUTTON_COLOR_SWATCH = 10
} dt_button_style;

typedef enum dt_ui_event {
    DT_EVENT_ACTIVATE,
    DT_EVENT_VALUE_CHANGED,
    DT_EVENT_TEXT_CHANGED,
    DT_EVENT_SUBMIT,
    DT_EVENT_FOCUS,
    DT_EVENT_BLUR,
    DT_EVENT_SCROLL,
    DT_EVENT_PERMISSION_RESULT,
    DT_EVENT_REQUEST_COMPLETE,
    DT_EVENT_APP_MENU,
    DT_EVENT_TICK,
    DT_EVENT_EXIT_REQUEST,
    DT_EVENT_POINTER_DOWN,
    DT_EVENT_POINTER_MOVE,
    DT_EVENT_POINTER_UP,
    DT_EVENT_POINTER_CANCEL,
    DT_EVENT_DATE_TIME_CHANGED,
    DT_EVENT_LANGUAGE_CHANGED,
    DT_EVENT_NOTIFICATION
} dt_ui_event;

/* Delivered after opening the owning application from a notification banner.
 * The payload is copied; strings are UTF-8 and NUL terminated. */
typedef struct dt_notification_event_v1 {
    char id[65];
    char data[257];
} dt_notification_event_v1;

typedef struct dt_tick_event { uint64_t monotonic_ms; } dt_tick_event;
typedef struct dt_language_event_v1 { char locale[32]; } dt_language_event_v1;

/* Primary pointer only. Coordinates remain available outside the captured bounds.
 * Capture ends on up, cancellation, removal, disabling or a system gesture. */
typedef struct dt_pointer_event {
    dt_handle target;
    int32_t x, y, local_x, local_y;
    uint32_t pointer_id;
    uint64_t monotonic_ms;
} dt_pointer_event;

typedef enum dt_date_time_mode { DT_PICKER_DATE_TIME=0, DT_PICKER_DATE=1, DT_PICKER_TIME=2 } dt_date_time_mode;
typedef struct dt_date_time_event { dt_handle target; int32_t day, minute; } dt_date_time_event;
/* Days since 1970-01-01, local minute of day; inclusive limits. UTF-8 labels are NUL-terminated. */
typedef struct dt_date_time_picker_v1 {
    uint32_t structure_size, mode, symbols, minute_step;
    int32_t day, minute, minimum_day, maximum_day, minimum_minute, maximum_minute;
    int32_t button_height, value_height, vertical_gap, column_gap, group_gap;
    int32_t number_size, unit_size, unit_gap, title_height, title_gap;
    char date_label[32], time_label[32], units[5][12];
} dt_date_time_picker_v1;

/* UTF-8, NUL-terminated, up to 11 bytes per corner. Empty strings hide a
 * column. Date order: year/month/day. Time order: hour/minute/AM-PM.
 * Text is presentation only and does not change the selected value's units. */
typedef struct dt_date_time_corner_text_v1 {
    uint32_t structure_size, enabled;
    char date[3][12], time[3][12];
} dt_date_time_corner_text_v1;

typedef enum dt_axis {
    DT_AXIS_VERTICAL = 0,
    DT_AXIS_HORIZONTAL = 1
} dt_axis;

typedef enum dt_alignment {
    DT_ALIGNMENT_START = 0,
    DT_ALIGNMENT_CENTER = 1,
    DT_ALIGNMENT_END = 2,
    DT_ALIGNMENT_STRETCH = 3
} dt_alignment;

typedef enum dt_justification {
    DT_JUSTIFICATION_START = 0,
    DT_JUSTIFICATION_CENTER = 1,
    DT_JUSTIFICATION_END = 2,
    DT_JUSTIFICATION_SPACE_BETWEEN = 3,
    DT_JUSTIFICATION_SPACE_AROUND = 4
} dt_justification;

/* UI event payloads are valid only for the duration of the event callback. */
typedef struct dt_component_event {
    dt_handle target;
} dt_component_event;

typedef struct dt_value_event {
    dt_handle target;
    float value;
} dt_value_event;

typedef struct dt_scroll_event {
    dt_handle target;
    int32_t offset_x;
    int32_t offset_y;
} dt_scroll_event;

typedef struct dt_permission_result_event {
    dt_request_id request;
    dt_permission permission;
    dt_permission_state state;
} dt_permission_result_event;

typedef struct dt_request_complete_event {
    dt_request_id request;
    dt_result result;
    dt_bytes payload;
} dt_request_complete_event;

/* DT_EVENT_REQUEST_COMPLETE payload for a network request. The UTF-8 response
 * body begins immediately after this fixed header. */
typedef struct dt_network_response_header_v1 {
    int32_t status_code;
    uint32_t body_bytes;
} dt_network_response_header_v1;

typedef enum dt_device_power_source {
    DT_POWER_SOURCE_UNKNOWN = 0,
    DT_POWER_SOURCE_BATTERY = 1,
    DT_POWER_SOURCE_EXTERNAL = 2
} dt_device_power_source;

typedef struct dt_device_state_v1 {
    uint32_t structure_size;
    uint8_t battery_percent;
    uint8_t wifi_connected;
    uint8_t display_awake;
    uint8_t power_source;
    uint32_t free_heap_bytes;
    uint32_t free_psram_bytes;
    char model[8];
    char serial[16];
} dt_device_state_v1;

#define DT_SYSTEM_LAUNCH_INFO_RESOURCE "@system/launch-info"
#define DT_SYSTEM_CLOCK_INFO_RESOURCE "@system/clock-info"
#define DT_SYSTEM_CAPABILITIES_RESOURCE "@system/sdk-capabilities"
#define DT_SYSTEM_LOCALE_INFO_RESOURCE "@system/locale-info"
#define DT_SYSTEM_COLOR_SCHEME_RESOURCE "@system/color-scheme"
#define DT_SYSTEM_COLOR_PALETTE_RESOURCE "@system/color-palette"
#define DT_MAX_CUSTOM_COLORS 32

/* Original RGB888 user colors, in Personalization order; read-only snapshot. */
typedef struct dt_color_palette_v1 {
    uint32_t structure_size, schema, count;
    uint32_t colors[DT_MAX_CUSTOM_COLORS];
} dt_color_palette_v1;

/* Current display-representable RGB888 semantic colors, including user accent. */
typedef struct dt_color_scheme_v1 {
    uint32_t structure_size, schema;
    uint32_t background, surface, header, raised, alternate, sidebar;
    uint32_t primary_text, body_text, supporting_text, disabled_text, border;
    uint32_t accent, on_accent, list_pressed;
    uint32_t success, warning, danger, danger_fill, on_danger;
    uint32_t keyboard, key, input, input_text, pressed, on_pressed;
    uint32_t selection_border, switch_track, switch_ink, icon_ink;
} dt_color_scheme_v1;
typedef struct dt_locale_info_v1 {
    uint32_t structure_size, schema, use_24_hour, flags;
    int32_t utc_offset_minutes;
    char system_locale[32], application_locale[32], requested_locale[32], timezone[64];
} dt_locale_info_v1;
/* Query this resource instead of inferring features from the 1.0 ABI number.
 * Unavailable on older firmware: treat all extension flags as absent. */
typedef enum dt_sdk_capability {
    DT_CAPABILITY_MODULES = 1,
    DT_CAPABILITY_NAVIGATION = 2,
    DT_CAPABILITY_SHARED_TEMPLATES = 4,
    DT_CAPABILITY_LIST_SLOTS = 8,
    DT_CAPABILITY_CHOICE_STEPPER = 16,
    DT_CAPABILITY_NATIVE_MODULES = 32,
    DT_CAPABILITY_LIST_NOTES = 64,
    DT_CAPABILITY_VERSION_CODE = 128,
    DT_CAPABILITY_ANIMATED_PROGRESS = 256,
    DT_CAPABILITY_APPLICATION_ACTION_ICONS = 512,
    DT_CAPABILITY_APPLICATION_SPLASH = 1024,
    DT_CAPABILITY_CONFIRMATION_DIALOGS = 2048,
    DT_CAPABILITY_SYSTEM_COLOR_SCHEME = 4096,
    DT_CAPABILITY_EMBEDDED_DOCUMENT_EDITOR = 8192,
    DT_CAPABILITY_PLATFORM_SERVICES = 16384,
    DT_CAPABILITY_SHARED_DATA = 32768,
    DT_CAPABILITY_POINTER_INPUT = 65536,
    DT_CAPABILITY_DATE_TIME_PICKER = 131072,
    DT_CAPABILITY_LOCALES = 262144,
    DT_CAPABILITY_PUBLIC_FILES = 524288,
    DT_CAPABILITY_LIST_DIVIDER_CONTEXT = 1048576,
    DT_CAPABILITY_CANVAS_CLIPPING = 2097152,
    DT_CAPABILITY_FILE_PICKER = 4194304,
    DT_CAPABILITY_CANVAS_WAVES = 8388608,
    DT_CAPABILITY_COMPONENT_READ = 16777216,
    DT_CAPABILITY_TEXT_METRICS = 33554432,
    DT_CAPABILITY_SCROLL_POSITION = 67108864,
    DT_CAPABILITY_TASK_DUE_TIME = 134217728,
    DT_CAPABILITY_TEXT_STRIKETHROUGH = 268435456,
    DT_CAPABILITY_COLOR_SWATCH = 536870912,
    DT_CAPABILITY_TASK_LIST_TILES = 1073741824,
    DT_CAPABILITY_NOTIFICATIONS = 0x80000000u
} dt_sdk_capability;
typedef struct dt_sdk_capabilities_v1 {
    uint32_t structure_size, abi_major, abi_minor, flags;
} dt_sdk_capabilities_v1;
#define DT_SYSTEM_APP_MENU_COMMAND "@system/app-menu"
#define DT_SYSTEM_ICON_APPEARANCE_COMMAND "@system/icon-appearance"
#define DT_APP_MENU_MAX_ITEMS 3
#define DT_APP_MENU_MAX_ICON 124
#define DT_APP_MENU_BUTTON 0u
#define DT_APP_MENU_TOGGLE 1u
#define DT_APP_MENU_DISABLED 2u
#define DT_APP_MENU_TYPE_MASK 3u
typedef struct dt_app_menu_item_v1 {
    uint32_t action,icon,type,checked; /* button/toggle, optionally OR DISABLED */
    char label[64];
} dt_app_menu_item_v1;
typedef struct dt_clock_info_v1 {uint32_t boot_id;uint32_t reserved;} dt_clock_info_v1;
typedef enum dt_launch_origin {
    DT_LAUNCH_UNKNOWN=0,DT_LAUNCH_DESKTOP=1,DT_LAUNCH_SETTINGS=2,
    DT_LAUNCH_INSTALLER=3,DT_LAUNCH_FILES=4,DT_LAUNCH_OTHER=5,DT_LAUNCH_NOTIFICATION=6
} dt_launch_origin;
typedef struct dt_launch_info_v1 {
    uint32_t origin;
    uint32_t exit_icon; /* Home icon 13 for Desktop, Back icon 11 otherwise. */
} dt_launch_info_v1;

/* Paths are relative to the user directory; empty denotes its root.
 * Five entries per response in filesystem order. next_offset is UINT32_MAX
 * at the end. Names are UTF-8. System paths are not exposed. */
typedef struct dt_user_file_v1 {
    char name[768];
    uint64_t bytes;
    uint8_t directory;
    uint8_t reserved[7];
} dt_user_file_v1;
typedef struct dt_user_files_page_v1 {
    uint32_t count;
    uint32_t next_offset;
    dt_user_file_v1 entries[5];
} dt_user_files_page_v1;

typedef struct dt_edge_insets {
    int16_t top;
    int16_t right;
    int16_t bottom;
    int16_t left;
} dt_edge_insets;

typedef struct dt_size {
    int32_t width;
    int32_t height;
} dt_size;

/* Device-native image resource. Pixel words are little-endian RGB565. RLE data
 * is a sequence of little-endian {run_length, pixel} word pairs. Masked images
 * store a one-bit, most-significant-bit-first visibility mask followed by one
 * RGB565 word for every pixel. Theme masks store one alpha byte per pixel and
 * are painted using the current accent (desktop tile foreground on launchers). */
typedef enum dt_image_encoding_v1 {
    DT_IMAGE_RGB565 = 0,
    DT_IMAGE_RLE_RGB565 = 1,
    DT_IMAGE_MASKED_RGB565 = 2,
    DT_IMAGE_THEME_MASK = 3
} dt_image_encoding_v1;

typedef struct dt_image_header_v1 {
    uint8_t magic[4]; /* "DTI1" */
    uint16_t width;
    uint16_t height;
    uint8_t encoding;
    uint8_t reserved[3];
} dt_image_header_v1;

/* Canvas command buffers are validated command-by-command by the host. Each
 * command's byte_size includes its header and any trailing UTF-8 bytes. */
typedef enum dt_canvas_opcode_v1 {
    DT_CANVAS_FILL_RECT = 1,
    DT_CANVAS_STROKE_RECT = 2,
    DT_CANVAS_LINE = 3,
    DT_CANVAS_TEXT = 4,
    DT_CANVAS_ICON = 5,
    DT_CANVAS_DOCUMENT_TEXT = 6,
    DT_CANVAS_SET_CLIP = 7,
    DT_CANVAS_RESET_CLIP = 8,
    DT_CANVAS_WAVE_FILL = 9,
    DT_CANVAS_ADAPTIVE_TEXT = 10
} dt_canvas_opcode_v1;

typedef struct dt_canvas_command_header_v1 {
    uint8_t opcode;
    uint8_t reserved;
    uint16_t byte_size;
} dt_canvas_command_header_v1;

/* Clip is relative to the Canvas view; reset restores the caller's clip. */
typedef struct dt_canvas_clip_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x, y, width, height;
} dt_canvas_clip_command_v1;

typedef struct dt_canvas_rect_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x, y, width, height;
    uint32_t color;
    uint16_t thickness;
    uint16_t reserved;
} dt_canvas_rect_command_v1;

typedef struct dt_canvas_line_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x0, y0, x1, y1;
    uint32_t color;
    uint16_t thickness;
    uint16_t reserved;
} dt_canvas_line_command_v1;

typedef struct dt_canvas_text_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x, y, width, height;
    uint32_t color;
    uint16_t font_size;
    uint16_t text_bytes;
    /* UTF-8 bytes follow. */
} dt_canvas_text_command_v1;

/* A bottom-up fill inside the given bounds; level is filled pixels. */
typedef struct dt_canvas_wave_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x,y,width,height;
    uint32_t color;
    uint16_t level,amplitude,wavelength,phase;
} dt_canvas_wave_command_v1;

/* Text keeps native glyph coverage, with alternate ink on matching background. */
typedef struct dt_canvas_adaptive_text_command_v1 {
    dt_canvas_text_command_v1 text;
    uint32_t matching_background,matching_foreground;
    /* UTF-8 bytes follow. */
} dt_canvas_adaptive_text_command_v1;

typedef struct dt_canvas_document_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x,y,width,height;
    uint32_t color;
    uint16_t headings,text_bytes;
    /* Exact UTF-8 document bytes follow. */
} dt_canvas_document_command_v1;

typedef struct dt_canvas_icon_command_v1 {
    dt_canvas_command_header_v1 header;
    int16_t x, y, width, height;
    uint32_t color;
    uint16_t icon;
    uint16_t reserved;
} dt_canvas_icon_command_v1;

typedef enum dt_lifecycle_event {
    DT_LIFECYCLE_ENTER,
    DT_LIFECYCLE_SUSPEND,
    DT_LIFECYCLE_RESUME,
    DT_LIFECYCLE_LEAVE,
    DT_LIFECYCLE_THEME_CHANGED,
    DT_LIFECYCLE_MEMORY_PRESSURE
} dt_lifecycle_event;

typedef struct dt_host_api_v1 {
    uint32_t abi_version;
    void (*log)(dt_app_context context, uint8_t level, const char *message);
    uint64_t (*monotonic_ms)(dt_app_context context);
    int64_t (*wall_clock_seconds)(dt_app_context context);

    dt_permission_state (*permission_check)(dt_app_context context, dt_permission permission);
    dt_result (*permission_request)(dt_app_context context, dt_permission permission,
                                    const char *reason, dt_request_id *request);

    dt_result (*ui_create)(dt_app_context context, dt_component_kind kind, dt_handle *component);
    dt_result (*ui_destroy)(dt_app_context context, dt_handle component);
    dt_result (*ui_append)(dt_app_context context, dt_handle parent, dt_handle child);
    dt_result (*ui_set)(dt_app_context context, dt_handle component, dt_property property,
                        dt_bytes value);
    dt_result (*ui_present)(dt_app_context context, dt_handle root);

    dt_result (*storage_read)(dt_app_context context, const char *key, dt_mutable_bytes *value);
    dt_result (*storage_write)(dt_app_context context, const char *key, dt_bytes value);
    dt_result (*storage_remove)(dt_app_context context, const char *key);

    dt_result (*network_request)(dt_app_context context, dt_bytes request,
                                 dt_request_id *request_id);
    dt_result (*request_cancel)(dt_app_context context, dt_request_id request_id);
    dt_result (*keyboard_show)(dt_app_context context, dt_bytes options,
                               dt_request_id *request_id);
    dt_result (*request_exit)(dt_app_context context);

    /* App resources are immutable; cache records are package-isolated and may
     * be removed by the system at any time. */
    dt_result (*resource_read)(dt_app_context context, const char *path,
                               dt_mutable_bytes *value);
    dt_result (*resource_size)(dt_app_context context, const char *path,
                               uint64_t *size);
    dt_result (*resource_read_range)(dt_app_context context, const char *path,
                                    uint64_t offset, dt_mutable_bytes *value);
    dt_result (*cache_read)(dt_app_context context, const char *key,
                            dt_mutable_bytes *value);
    dt_result (*cache_write)(dt_app_context context, const char *key, dt_bytes value);
    dt_result (*cache_remove)(dt_app_context context, const char *key);

    /* Payloads for network, keyboard and notifications are UTF-8 JSON documents
     * described by the public contract. Results are delivered through
     * DT_EVENT_REQUEST_COMPLETE. */
    dt_result (*notification_post)(dt_app_context context, dt_bytes notification,
                                   dt_request_id *request_id);
    dt_result (*device_state)(dt_app_context context, dt_device_state_v1 *state);
    dt_result (*user_files_list)(dt_app_context context, const char *path,
                                 uint32_t offset, dt_request_id *request_id);
    /* Available only when DT_CAPABILITY_PLATFORM_SERVICES is advertised.
     * The existing v1 table prefix is unchanged. Completion payload is UTF-8 JSON. */
    dt_result (*platform_request)(dt_app_context context, dt_bytes request_json,
                                  dt_request_id *request_id);
    /* Copy a stored property from a component owned by this context.
     * Requires DT_CAPABILITY_COMPONENT_READ. size reports the required bytes. */
    dt_result (*ui_get)(dt_app_context context, dt_handle component, dt_property property,
                       dt_mutable_bytes *value);
    /* Current system UI font: 16/20/22/32/48px; bounded UTF-8 up to 1024 bytes. */
    dt_result (*text_width)(dt_app_context context, dt_bytes text, uint16_t font_size,
                           int32_t *width);
} dt_host_api_v1;

typedef struct dt_app_instance_v1 {
    uint32_t abi_version;
    void *user_data;
    dt_result (*lifecycle)(void *user_data, dt_lifecycle_event event);
    dt_result (*event)(void *user_data, uint16_t event, dt_bytes payload);
    void (*destroy)(void *user_data);
} dt_app_instance_v1;

typedef dt_result (*dt_app_entry_v1)(const dt_host_api_v1 *host, dt_app_context context,
                                     dt_app_instance_v1 *instance);

#ifdef __cplusplus
}
#endif

#endif
