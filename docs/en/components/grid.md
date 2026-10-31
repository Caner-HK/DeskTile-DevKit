# Grid

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

Arrange repeated content in columns. Set `grid-columns`, item sizes and gaps together. Check long labels at the actual column width and give each action its own touch area.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/grid.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-grid grid-columns="3" width="752" height="116" gap="12">
<dt-button text="周一" font-size="20" button-style="9"/>
<dt-button text="周二" font-size="20" button-style="9"/>
<dt-button text="周三" font-size="20" button-style="9"/>
<dt-button text="周四" font-size="20" button-style="9"/>
<dt-button text="周五" font-size="20" button-style="9"/>
<dt-button text="周六" font-size="20" button-style="9"/>
</dt-grid>
```

## Properties

| Property | Meaning |
| --- | --- |
| `grid-columns` | Number of columns. |
| `gap` | Space between children. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `padding` | Inset between content and component edges. |

## Light theme

![Light theme](/previews/grid/light.png)

## Dark theme

![Dark theme](/previews/grid/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
