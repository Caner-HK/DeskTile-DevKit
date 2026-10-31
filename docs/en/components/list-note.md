# List note

[Documentation home](/en/) / [Design and components](/en/components/) / Lists and dialogs

Place a note directly after its list in a Column with no extra padding or gap. The component supplies 24 px horizontal padding, a 16 px top gap and 20 px text. Set `has-following-content="true"` on the list to keep the divider above the note. Update visibility when the setting that explains it changes.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/list-note.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-list has-following-content="true">
<dt-list-row id="automatic" text="自动同步时间" font-size="20" height="76" enabled="true">
<dt-toggle id="automatic-toggle" checked="true" enabled="true" width="112" height="56" slot="2"/>
</dt-list-row>
</dt-list>
<dt-list-note text="联网后自动校准日期和时间。"/>
```

## Final divider

Show the last row divider when the whole list fits in the viewport with space below it. For a scrolling list whose last row is off-screen, preserve the viewport clipping. When a note or other content follows the list, always show the final divider. `has-following-content` marks following content drawn by another container. Both list densities use this rule.

## Properties

| Property | Meaning |
| --- | --- |
| `text` | UTF-8 display text. |
| `visible` | Participate in the current display. |
| `foreground-role` | Theme role for text or icon color. |

## Light theme

![Light theme](/previews/list-note/light.png)

## Dark theme

![Dark theme](/previews/list-note/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
