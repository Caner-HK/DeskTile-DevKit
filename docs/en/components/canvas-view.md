# Canvas view

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Use `dt-canvas` for custom drawing inside component bounds. This example submits three filled-rectangle commands in `enter`, relative to the canvas origin. Encode the public binary command structure and submit it through `canvas-commands`. The interactive preview executes the same JavaScript. Resubmit the relevant buffer when data changes and keep ownership aligned with the component lifecycle.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/canvas-view.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-canvas id="chart" width="600" height="240"/>
```

```js
function enter(){
  const bytes=new ArrayBuffer(60), view=new DataView(bytes);
  const bars=[[40,100,96,100,0xFF9900],[180,40,96,160,0x168471],[320,70,96,130,0x3765FF]];
  bars.forEach(function(b,i){const p=i*20;view.setUint8(p,1);view.setUint16(p+2,20,true);for(let k=0;k<4;k++)view.setInt16(p+4+k*2,b[k],true);view.setUint32(p+12,b[4],true);});
  DeskTile.setBytes(DeskTile.byId('chart'),29,bytes);
}
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `canvas-commands` | Encoded public Canvas command buffer. |
| `pointer-input` | Receive pointer events. |

## Events

Handle `pointer-down`, `pointer-move`, `pointer-up`, `pointer-cancel`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/canvas-view/light.png)

## Dark theme

![Dark theme](/previews/canvas-view/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
