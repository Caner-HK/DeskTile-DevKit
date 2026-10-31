# List

[Documentation home](/en/) / [Design and components](/en/components/) / Lists and dialogs

There are two densities: comfortable rows are 76 px high, as on the settings home page; compact rows are 54 px, as in PIDS settings. Choose density for the page purpose. The list fills the content width and each row supplies 24 px horizontal padding. Use `checked` only for a persistent selection; ordinary navigation rows use the default state.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/list.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-list>
<dt-list-row text="系统语言" height="76" font-size="20"/>
<dt-list-row text="日期和时间" height="76" font-size="20"/>
<dt-list-row text="开发者选项" height="76" font-size="20"/>
</dt-list>
```

## Final divider

Show the last row divider when the whole list fits in the viewport with space below it. For a scrolling list whose last row is off-screen, preserve the viewport clipping. When a note or other content follows the list, always show the final divider. `has-following-content` marks following content drawn by another container. Both list densities use this rule.

## Properties

| Property | Meaning |
| --- | --- |
| `has-following-content` | Keep the final divider when content follows the list. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Light theme

![Light theme](/previews/list/light.png)

## Dark theme

![Dark theme](/previews/list/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
