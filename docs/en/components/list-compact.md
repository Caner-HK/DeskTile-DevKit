# Compact list

[Documentation home](/en/) / [Design and components](/en/components/) / Lists and dialogs

Set each row to 54 px with 20 px text and fill the content width. This is the PIDS-settings density. The comfortable alternative is 76 px; choose one consistent density for the page purpose.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/list-compact.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-list>
<dt-list-row text="显示语言" height="54" font-size="20"/>
<dt-list-row text="中文字体" height="54" font-size="20"/>
<dt-list-row text="显示车厢信息" height="54" font-size="20"/>
</dt-list>
```

## Final divider

Show the last row divider when the whole list fits in the viewport with space below it. For a scrolling list whose last row is off-screen, preserve the viewport clipping. When a note or other content follows the list, always show the final divider. `has-following-content` marks following content drawn by another container. Both list densities use this rule.

## Properties

| Property | Meaning |
| --- | --- |
| `height` | Height in pixels. |
| `text` | UTF-8 display text. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/list-compact/light.png)

## Dark theme

![Dark theme](/previews/list-compact/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
