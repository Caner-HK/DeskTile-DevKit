# Dialog

[Documentation home](/en/) / [Design and components](/en/components/) / Lists and dialogs

The standard confirmation layout is 592 px wide with 24 px internal padding. Its title uses 32 px text in a 48 px area, followed by a 12 px gap. The content group gap is 24 px. Bottom buttons are 52 px high with a 12 px gap; Cancel is on the left and confirmation on the right. Delete uses the destructive color. Prefer `ui.confirmation`; only the body scrolls when content is long.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/dialog.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-dialog id="confirm" width="592" max-height="400" dialog-presentation="1" dialog-title-divider="true" padding="24" surface-style="2" visible="true">
<dt-column gap="24" flex-grow="1">
<dt-text text="删除便签？" font-size="32" height="48" margin="0,0,12,0"/>
<dt-scroll flex-grow="1">
<dt-text text="删除后将移除这条便签。" font-size="20" foreground-role="4" text-wrap="true"/>
</dt-scroll>
<dt-row height="52" gap="12">
<dt-button id="cancel" text="取消" width="0" height="52" flex-grow="1" font-size="20" button-style="9"/>
<dt-button id="delete" text="删除" width="0" height="52" flex-grow="1" font-size="20" button-style="2" icon="41"/>
</dt-row>
</dt-column>
</dt-dialog>
```

```js
function onEvent(event,target){if(event===0&&['open','rename','delete','cancel'].some(function(id){return target===DeskTile.byId(id);}))DeskTile.setBoolean(DeskTile.byId('confirm'),4,false);}
```

## Properties

| Property | Meaning |
| --- | --- |
| `dialog-presentation` | embedded or centered presentation. |
| `dialog-destructive` | Destructive confirmation color semantics. |
| `dialog-title-divider` | Show the title divider. |
| `width` | Width in pixels. |
| `max-height` | Maximum height. |
| `visible` | Participate in the current display. |

## Light theme

![Light theme](/previews/dialog/light.png)

## Dark theme

![Dark theme](/previews/dialog/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
