# Column

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

Arrange children vertically. The example uses a 32 px heading, 20 px body text and 12 px gaps. Alignment controls the horizontal axis. Choose start or center for fixed-width images and pickers; full-width lists use the available width. Put overflowing content inside a scroll view.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/column.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-column gap="12" alignment="0">
<dt-text text="周末计划" font-size="32" height="48"/>
<dt-text text="周六上午去图书馆。" font-size="20" height="28"/>
<dt-text text="周日下午整理照片。" font-size="20" height="28"/>
</dt-column>
```

## Properties

| Property | Meaning |
| --- | --- |
| `gap` | Space between children. |
| `alignment` | Cross-axis child alignment. |
| `justification` | Distribution along the main axis. |
| `padding` | Inset between content and component edges. |
| `flex-grow` | Share of remaining space. |

## Light theme

![Light theme](/previews/column/light.png)

## Dark theme

![Dark theme](/previews/column/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
