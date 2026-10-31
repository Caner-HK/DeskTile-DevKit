# Page

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

The root of a screen contains the app bar and page content. Keep one active root per screen and restore any saved scroll position when rebuilding a page. The usual app area is 800 × 448 px below the 32 px status bar.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/page.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-text text="我的一天" font-size="32" height="48"/>
<dt-text text="整理今天的计划，记录值得记住的事。" font-size="20" text-wrap="true"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `background` | Background color as 0xRRGGBB. |
| `status-bar-background` | Background of the adjacent status bar. |
| `status-bar-foreground` | Status-bar text and icon color. |

## Light theme

![Light theme](/previews/page/light.png)

## Dark theme

![Dark theme](/previews/page/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
