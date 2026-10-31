# Scroll view

[Documentation home](/en/) / [Design and components](/en/components/) / Layout

Use `dt-scroll` for content that exceeds its viewport. Let it fill the space below the app bar, then place the list inside. Rows supply their own padding. The example contains eight rows in an 800 × 376 px viewport. Save the actual offset and restore it with `scroll-position`; check the target capability before using scroll-position APIs.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/scroll-view.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-scroll flex-grow="1">
<dt-list>
<dt-list-row text="北京" height="76" font-size="20"/>
<dt-list-row text="上海" height="76" font-size="20"/>
<dt-list-row text="广州" height="76" font-size="20"/>
<dt-list-row text="深圳" height="76" font-size="20"/>
<dt-list-row text="杭州" height="76" font-size="20"/>
<dt-list-row text="南京" height="76" font-size="20"/>
<dt-list-row text="苏州" height="76" font-size="20"/>
<dt-list-row text="成都" height="76" font-size="20"/>
</dt-list>
</dt-scroll>
```

## Final divider

Show the last row divider when the whole list fits in the viewport with space below it. For a scrolling list whose last row is off-screen, preserve the viewport clipping. When a note or other content follows the list, always show the final divider. `has-following-content` marks following content drawn by another container. Both list densities use this rule.

## Properties

| Property | Meaning |
| --- | --- |
| `height` | Height in pixels. |
| `flex-grow` | Share of remaining space. |
| `scroll-axis` | vertical or horizontal. |
| `scroll-position` | Actual offset, clamped to the scrollable range. |

## Events

Handle `scroll`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/scroll-view/light.png)

## Dark theme

![Dark theme](/previews/scroll-view/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
