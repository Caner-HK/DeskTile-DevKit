# Floating action button

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

A FAB represents the primary creation action. Notes uses an 80 × 80 px circular button (`button-style="8"`) with a 40 × 40 px icon, 24 px from the right and bottom of the content region. Overlay it with Stack so it stays fixed while the list scrolls. Reserve enough scrollable space below the last item. The cut-corner floating style is a separate variant (3).

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/fab.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-stack flex-grow="1">
<dt-list>
<dt-list-row text="旅行计划" height="76" font-size="20"/>
<dt-list-row text="购物清单" height="76" font-size="20"/>
</dt-list>
<dt-column alignment="2" justification="2" padding="0,24,24,0">
<dt-button id="fab" accessibility-label="新建便签" width="80" height="80" button-style="8" alignment="1" justification="1">
<dt-icon icon="35" width="40" height="40"/>
</dt-button>
</dt-column>
</dt-stack>
```

```js
function onEvent(event,target){if(event===0&&target===DeskTile.byId('fab'))DeskTile.keyboard(JSON.stringify({title:'新建便签',initial:'',maximum_length:512}));}
```

## Properties

| Property | Meaning |
| --- | --- |
| `button-style` | Button-variant enum. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `icon` | SDK system-icon ID. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/fab/light.png)

## Dark theme

![Dark theme](/previews/fab/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
