# Properties, events and limits

[Documentation home](/en/) / [API reference](/en/api/)

SDK ABI: 1.0. Strings use UTF-8 and colors use `0xRRGGBB`. Handles belong to the application that creates them. Query optional capabilities before calling their APIs.

<!-- page-outline -->
[[toc]]

## Properties

Property IDs follow this zero-based table. HTML uses names; scripts and Native calls use the matching enums.

| ID | Property | Type | Enum values |
| --- | --- | --- | --- |
| 0 | `text` | utf8 |  |
| 1 | `accessibility-label` | utf8 |  |
| 2 | `resource` | utf8 |  |
| 3 | `icon` | u32 |  |
| 4 | `visible` | bool |  |
| 5 | `enabled` | bool |  |
| 6 | `checked` | bool |  |
| 7 | `value` | f32 |  |
| 8 | `minimum` | f32 |  |
| 9 | `maximum` | f32 |  |
| 10 | `foreground` | color |  |
| 11 | `background` | color |  |
| 12 | `accent` | color |  |
| 13 | `font-size` | i32 |  |
| 14 | `font-weight` | u32 |  |
| 15 | `width` | i32 |  |
| 16 | `height` | i32 |  |
| 17 | `min-width` | i32 |  |
| 18 | `min-height` | i32 |  |
| 19 | `max-width` | i32 |  |
| 20 | `max-height` | i32 |  |
| 21 | `padding` | edge-insets |  |
| 22 | `margin` | edge-insets |  |
| 23 | `gap` | i32 |  |
| 24 | `flex-grow` | f32 |  |
| 25 | `alignment` | u32 |  |
| 26 | `justification` | u32 |  |
| 27 | `scroll-axis` | u32 |  |
| 28 | `grid-columns` | u32 |  |
| 29 | `canvas-commands` | bytes |  |
| 30 | `button-style` | u32 | primary=0, secondary=1, destructive=2, floating=3, text=4, navigation=5, time-stepper=6, outlined=7, circular=8, cancel=9, color-swatch=10 |
| 31 | `surface-style` | u32 | default=0, accent=1, raised=2, fullscreen=3, popup=4 |
| 32 | `dialog-presentation` | u32 | embedded=0, centered=1 |
| 33 | `foreground-role` | u32 | default=0, accent=1, danger=2, secondary=3, body=4, disabled=5, primary=6, success=7, warning=8 |
| 34 | `text-wrap` | bool |  |
| 35 | `repeat-interval` | u32 |  |
| 36 | `dialog-title-divider` | bool |  |
| 37 | `icon-trailing` | bool |  |
| 38 | `dialog-border` | bool |  |
| 39 | `dialog-border-color` | color |  |
| 40 | `indeterminate` | bool |  |
| 41 | `status-bar-background` | color |  |
| 42 | `status-bar-foreground` | color |  |
| 43 | `dialog-destructive` | bool |  |
| 44 | `slot-position` | u32 |  |
| 45 | `step` | f32 |  |
| 46 | `progress-style` | u32 |  |
| 47 | `animation-duration` | u32 |  |
| 48 | `animation-delay` | u32 |  |
| 49 | `item-size` | i32 |  |
| 50 | `item-gap` | i32 |  |
| 51 | `document-headings` | bool |  |
| 52 | `document-cursor` | i32 |  |
| 53 | `document-scroll` | i32 |  |
| 54 | `document-focused` | bool |  |
| 55 | `document-caret-visible` | bool |  |
| 56 | `placeholder` | utf8 |  |
| 57 | `pointer-input` | bool |  |
| 58 | `date-time-config` | dt_date_time_picker_v1 |  |
| 59 | `list-has-following-content` | bool |  |
| 60 | `scroll-position` | i32 |  |
| 61 | `text-strikethrough` | bool |  |
| 62 | `date-time-corner-text` | dt_date_time_corner_text_v1 |  |
| 63 | `navigation-presentation` | dt_navigation_presentation_v1 |  |

## Events

| ID | Event |
| --- | --- |
| 0 | activate |
| 1 | value-changed |
| 2 | text-changed |
| 3 | submit |
| 4 | focus |
| 5 | blur |
| 6 | scroll |
| 7 | permission-result |
| 8 | request-complete |
| 9 | app-menu |
| 10 | tick |
| 11 | exit-request |
| 12 | pointer-down |
| 13 | pointer-move |
| 14 | pointer-up |
| 15 | pointer-cancel |
| 16 | date-time-changed |
| 17 | language-changed |
| 18 | notification |

## Runtime limits

| Item | Limit |
| --- | --- |
| component_nodes | 384 |
| component_properties | 768 |
| property_bytes | 65536 |
| document_bytes | 65536 |
| script_bytes | 262144 |
| javascript_heap_bytes | 524288 |
| callback_cpu_ms | 100 |
| module_count | 32 |
| module_source_bytes | 262144 |
| history_default | 16 |
| history_maximum | 32 |
| template_depth | 8 |

## Optional capabilities

| Capability | Bit value |
| --- | --- |
| modules | 1 |
| navigation | 2 |
| sharedTemplates | 4 |
| listSlots | 8 |
| choiceStepper | 16 |
| nativeModules | 32 |
| listNotes | 64 |
| versionCode | 128 |
| animatedProgress | 256 |
| applicationActionIcons | 512 |
| applicationSplash | 1024 |
| confirmationDialogs | 2048 |
| systemColorScheme | 4096 |
| embeddedDocumentEditor | 8192 |
| platformServices | 16384 |
| sharedData | 32768 |
| pointerInput | 65536 |
| dateTimePicker | 131072 |
| locales | 262144 |
| publicFiles | 524288 |
| listDividerContext | 1048576 |
| canvasClipping | 2097152 |
| filePicker | 4194304 |
| canvasWaves | 8388608 |
| componentRead | 16777216 |
| textMetrics | 33554432 |
| scrollPosition | 67108864 |
| taskDueTime | 134217728 |
| textStrikethrough | 268435456 |
| colorSwatch | 536870912 |
| taskListTiles | 1073741824 |

## Source definitions

[Contract JSON](/api-source/desktile-api.json), [permission definitions](/api-source/permissions.json), and [permission guide](../services/permissions.md). Execution budgets apply to callbacks; use asynchronous services for long operations.
