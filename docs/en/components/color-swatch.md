# Color swatch

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Use `button-style="10"`, `background` for the candidate color and `checked` for selection. The system chooses a contrasting check mark. After `activate`, update the selection and save the color. Supply a color name through `accessibility-label`.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/color-swatch.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-row height="76" gap="20" alignment="1">
<dt-button id="orange" accessibility-label="橙色" width="64" height="64" button-style="10" background="#FF9900" checked="true"/>
<dt-button id="blue" accessibility-label="蓝色" width="64" height="64" button-style="10" background="#3765FF" checked="false"/>
<dt-button id="green" accessibility-label="绿色" width="64" height="64" button-style="10" background="#168471" checked="false"/>
</dt-row>
```

```js
function onEvent(event,target){if(event!==0)return;const ids=['orange','blue','green'];if(!ids.some(function(id){return target===DeskTile.byId(id);}))return;ids.forEach(function(id){DeskTile.setBoolean(DeskTile.byId(id),6,target===DeskTile.byId(id));});}
```

## Properties

| Property | Meaning |
| --- | --- |
| `button-style` | Button-variant enum. |
| `background` | Background color as 0xRRGGBB. |
| `checked` | Current selected or on state. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/color-swatch/light.png)

## Dark theme

![Dark theme](/previews/color-swatch/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
