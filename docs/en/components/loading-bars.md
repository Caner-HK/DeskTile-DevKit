# Pulsing bars

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Use three animated bars for a compact waiting region, commonly 48 × 40 px. HTML `progress-style="2"` corresponds to `ui.progress({id:"loading",style:"bars"})` and Native `DT_PROPERTY_PROGRESS_STYLE = 2`. The host advances the animation while the application manages the asynchronous task. Hide or destroy the indicator when work finishes; use determinate Progress when a total is available.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/loading-bars.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-progress id="loading" width="48" height="40" progress-style="2"/>
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

![Animation](/previews/loading-bars/animation.gif)

## Light theme

![Light theme](/previews/loading-bars/light.png)

## Dark theme

![Dark theme](/previews/loading-bars/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
