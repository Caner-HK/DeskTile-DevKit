# Row

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

Arrange children horizontally. `gap` sets spacing and `flex-grow` shares remaining width. Cross-axis `alignment` is 0 for start, 1 for center, 2 for end and 3 for stretch. Center fixed-size icons and buttons to preserve their dimensions.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/row.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-row height="52" gap="16" alignment="1">
<dt-button text="保存" icon="49" width="152" height="52" font-size="20" button-style="0"/>
<dt-button text="取消" icon="48" width="152" height="52" font-size="20" button-style="9"/>
</dt-row>
```

## Properties

| Property | Meaning |
| --- | --- |
| `gap` | Space between children. |
| `alignment` | Cross-axis child alignment. |
| `justification` | Distribution along the main axis. |
| `padding` | Inset between content and component edges. |
| `height` | Height in pixels. |

## Light theme

![Light theme](/previews/row/light.png)

## Dark theme

![Dark theme](/previews/row/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
