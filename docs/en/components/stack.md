# Stack

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

Overlay children in the same layout region. Set explicit bounds, check drawing order and preserve image proportions. Use Row or Column for ordinary sequential content.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/stack.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-stack width="480" height="288">
<dt-image resource="picture.dti" width="480" height="288"/>
<dt-text text="色彩" width="120" height="48" font-size="32" margin="24,0,0,24"/>
</dt-stack>
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `padding` | Inset between content and component edges. |
| `background` | Background color as 0xRRGGBB. |

## Light theme

![Light theme](/previews/stack/light.png)

## Dark theme

![Dark theme](/previews/stack/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
