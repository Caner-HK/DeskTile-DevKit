# Duration picker

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Edit durations in hours, minutes and seconds. `value`, `minimum` and `maximum` are in seconds. Corner labels use the three fields of the time group. Save the returned number of seconds on `value-changed`. Suitable for timers and playback intervals.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/duration-picker.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-duration-picker id="duration" width="752" minimum="0" maximum="3600" value="60"/>
```

```js
function enter(){const data=new ArrayBuffer(80),view=new DataView(data),bytes=new Uint8Array(data);view.setUint32(0,80,true);view.setUint32(4,1,true);['时','分','秒'].forEach(function(unit,i){bytes.set(DeskTile.utf8Encode(unit),44+i*12);});DeskTile.setBytes(DeskTile.byId('duration'),62,data);}
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `value` | Current value. |
| `minimum` | Lower bound. |
| `maximum` | Upper bound. |
| `date-time-corner-text` | Optional upper-right labels for picker columns. |

## Events

Handle `value-changed`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/duration-picker/light.png)

## Dark theme

![Dark theme](/previews/duration-picker/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
