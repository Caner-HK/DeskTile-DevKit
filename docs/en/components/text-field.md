# Text field

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Put empty-state guidance in `placeholder` and the current value in `text`. The system supplies the placeholder theme color. Standard fields are 52 px high with 20 px text and 16 px horizontal padding. An internal icon participates in text layout. The example enables pointer input, distinguishes tap, drag and cancellation, and opens the keyboard on release. Commit a successful keyboard result; preserve the old value on cancellation.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/text-field.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-text-field id="name" placeholder="输入名称" width="752" height="52" font-size="20" padding="0,16,0,16" pointer-input="true"/>
```

```js
let request=0, value='', down=null;
function onPointer(event,pointer){
  if(pointer.target!==DeskTile.byId('name')||request)return;
  if(event===12){down={x:pointer.x,y:pointer.y};return;}
  if(event===15){down=null;return;}
  if(!down)return;
  if(Math.abs(pointer.x-down.x)>=8||Math.abs(pointer.y-down.y)>=8){down=null;return;}
  if(event===14){down=null;if(pointer.localX>=0&&pointer.localX<752&&pointer.localY>=0&&pointer.localY<52){const id=DeskTile.keyboard(JSON.stringify({title:'名称',initial:value,maximum_length:512}));if(id>0)request=id;}}
}
function onRequestComplete(id,result,data){if(id!==request)return;request=0;if(result===0){value=DeskTile.utf8Decode(data);DeskTile.setText(DeskTile.byId('name'),0,value);}}
```

## Properties

| Property | Meaning |
| --- | --- |
| `text` | UTF-8 display text. |
| `placeholder` | Guidance shown when text is empty. |
| `icon` | SDK system-icon ID. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Events

Handle `activate`, `focus`, `blur`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/text-field/light.png)

## Dark theme

![Dark theme](/previews/text-field/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
