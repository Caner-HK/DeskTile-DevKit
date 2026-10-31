# List row

[Documentation home](/en/) / [Design and components](/en/components/) / Lists and dialogs

Use `ui.listRow` for a 76 px comfortable row or `density: "compact"` for 54 px. Main text is 20 px. Summaries use the trailing slot by default; put toggles there too. Group rows in `dt-list` so it manages the final divider. Toggle hit areas are 112 × 56 px, with height constrained to 54 px in compact rows.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/list-row.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-list>
<dt-list-row id="storage" text="存储空间" font-size="20" height="76" enabled="true">
<dt-text text="12 KB" font-size="20" foreground-role="3" slot="2"/>
</dt-list-row>
<dt-list-row id="notify" text="接收提醒" font-size="20" height="76" enabled="true">
<dt-toggle id="enabled" checked="true" enabled="true" width="112" height="56" slot="2"/>
</dt-list-row>
</dt-list>
```

## Final divider

Show the last row divider when the whole list fits in the viewport with space below it. For a scrolling list whose last row is off-screen, preserve the viewport clipping. When a note or other content follows the list, always show the final divider. `has-following-content` marks following content drawn by another container. Both list densities use this rule.

## Properties

| Property | Meaning |
| --- | --- |
| `text` | UTF-8 display text. |
| `height` | Height in pixels. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `checked` | Current selected or on state. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/list-row/light.png)

## Dark theme

![Dark theme](/previews/list-row/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
