# System bar

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

Use Scaffold for the app bar. When composing it directly, use a 72 px row containing the navigation action, title and trailing actions. App-bar titles use 32 px text; icon actions use a 72 px hit area and a 32 px icon.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/system-bar.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-text text="旅行计划" font-size="32" height="48"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `height` | Height in pixels. |
| `text` | UTF-8 display text. |
| `background` | Background color as 0xRRGGBB. |
| `foreground` | Explicit foreground color. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/system-bar/light.png)

## Dark theme

![Dark theme](/previews/system-bar/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
