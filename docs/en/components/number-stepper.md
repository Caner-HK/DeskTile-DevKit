# Number stepper

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Build it with `ui.numberStepper`. Up and down buttons use `id-up` and `id-down`; the value uses `id-value`. Default width is 128 px; buttons and value each have 52 px height and 8 px gaps. `symbols: "arrows"` selects arrow icons. Holding a button generates `activate` every 100 ms. Store and clamp the value in application state and disable the corresponding button at each bound. The example range is 0–20.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/number-stepper.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-column width="128" height="172" gap="8">
<dt-button id="count-up" icon="20" width="128" height="52" button-style="6" repeat-interval="100"/>
<dt-row height="52" gap="8" alignment="1" justification="1">
<dt-text id="count-value" text="10" font-size="32" height="52"/>
<dt-text text="次" font-size="20" height="52" foreground-role="3"/>
</dt-row>
<dt-button id="count-down" icon="21" width="128" height="52" button-style="6" repeat-interval="100"/>
</dt-column>
```

```js
let count=10;
function refresh(){DeskTile.setText(DeskTile.byId('count-value'),0,String(count));DeskTile.setBoolean(DeskTile.byId('count-up'),5,count<20);DeskTile.setBoolean(DeskTile.byId('count-down'),5,count>0);}
function enter(){refresh();}
function onEvent(event,target){if(event!==0)return;if(target===DeskTile.byId('count-up'))count=Math.min(20,count+1);else if(target===DeskTile.byId('count-down'))count=Math.max(0,count-1);else return;refresh();}
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/number-stepper/light.png)

## Dark theme

![Dark theme](/previews/number-stepper/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
