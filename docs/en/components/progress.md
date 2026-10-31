# Progress

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Place the percentage at the right end of the bar, vertically centered. Match File downloads: a 12 px bar, 16 px gap and 20 px percentage text in an 80 × 32 px area so 100% keeps a stable layout. Update both the bar and label from the same task value. For unknown totals use an activity indicator.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/progress.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-text text="正在下载" font-size="20" height="28"/>
<dt-row width="752" height="32" gap="16" alignment="1">
<dt-progress id="download-progress" flex-grow="1" height="12" minimum="0" maximum="100" value="58"/>
<dt-text id="download-percent" text="58%" font-size="20" width="80" height="32"/>
</dt-row>
```

## Properties

| Property | Meaning |
| --- | --- |
| `minimum` | Lower bound. |
| `maximum` | Upper bound. |
| `value` | Current value. |
| `progress-style` | Determinate, moving squares or pulsing bars. |
| `animation-duration` | Progress animation period in milliseconds. |

## Light theme

![Light theme](/previews/progress/light.png)

## Dark theme

![Dark theme](/previews/progress/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
