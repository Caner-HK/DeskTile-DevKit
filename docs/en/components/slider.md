# Slider

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Choose a value in a continuous range, such as brightness. Set `minimum` and `maximum`, validate the reported value and handle `value-changed`. Prefer a stepper when an exact discrete value is required.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/slider.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-text text="亮度" font-size="20" height="28"/>
<dt-slider id="brightness" width="752" height="52" minimum="0" maximum="100" value="65"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `minimum` | Lower bound. |
| `maximum` | Upper bound. |
| `value` | Current value. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `width` | Width in pixels. |

## Events

Handle `value-changed`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/slider/light.png)

## Dark theme

![Dark theme](/previews/slider/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
