# Menu

[Documentation home](/en/) / [Design and components](/en/components/) / Lists and dialogs

`ui.menu` follows the device PopupMenu: 256 px default width, 56 px header and action rows, 20 px secondary header text with 16 px horizontal padding. Row icons are 28 × 28 px at x=16 and labels start at x=60. The border uses the divider theme color. Place this embedded popup in an application overlay, position it near the touch point and dismiss it on an outside click. The example centers the menu surface. Up to eight items are supported; overflowing content scrolls. `showHeader: false` hides the header. Identify actions by item ID, then close the menu. System App Menu uses a separate registration API.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/menu.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-dialog id="file-menu" width="256" height="224" dialog-presentation="0" surface-style="4">
<dt-column height="56" padding="12,16,12,16">
<dt-text text="旅行计划.txt" font-size="20" height="32" foreground-role="3"/>
</dt-column>
<dt-scroll flex-grow="1">
<dt-column>
<dt-button id="open" accessibility-label="打开" height="56" button-style="4" enabled="true">
<dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">
<dt-icon icon="73" width="28" height="28"/>
<dt-text text="打开" font-size="20" height="56" flex-grow="1"/>
</dt-row>
</dt-button>
<dt-button id="rename" accessibility-label="重命名" height="56" button-style="4" enabled="true">
<dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">
<dt-icon icon="68" width="28" height="28"/>
<dt-text text="重命名" font-size="20" height="56" flex-grow="1"/>
</dt-row>
</dt-button>
<dt-button id="delete" accessibility-label="删除" height="56" button-style="4" enabled="true">
<dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">
<dt-icon icon="41" width="28" height="28" foreground-role="2"/>
<dt-text text="删除" font-size="20" height="56" flex-grow="1" foreground-role="2"/>
</dt-row>
</dt-button>
</dt-column>
</dt-scroll>
</dt-dialog>
```

```js
function onEvent(event,target){if(event===0&&['open','rename','delete','cancel'].some(function(id){return target===DeskTile.byId(id);}))DeskTile.setBoolean(DeskTile.byId('file-menu'),4,false);}
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `visible` | Participate in the current display. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/menu/light.png)

## Dark theme

![Dark theme](/previews/menu/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
