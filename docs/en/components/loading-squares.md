# Moving squares

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Use the squares style of `dt-progress` while waiting for a directory or page with no known percentage. The host advances the animation. The device loading region is 240 × 30 px with text below. Show it before starting asynchronous work, then hide or destroy it on completion, failure or cancellation. HTML `progress-style="1"` corresponds to `ui.progress({id:"loading",style:"squares"})` and Native `DT_PROPERTY_PROGRESS_STYLE = 1`.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/loading-squares.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-progress id="loading" width="240" height="30" progress-style="1"/>
<dt-text text="正在读取" font-size="20" width="704" height="40" alignment="1" foreground-role="3"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `progress-style` | Determinate, moving squares or pulsing bars. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `animation-duration` | Progress animation period in milliseconds. |
| `visible` | Participate in the current display. |

## Animation

![Animation](/previews/loading-squares/animation.gif)

## Light theme

![Light theme](/previews/loading-squares/light.png)

## Dark theme

![Dark theme](/previews/loading-squares/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
