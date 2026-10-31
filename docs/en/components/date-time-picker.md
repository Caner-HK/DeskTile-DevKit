# Date and time picker

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Use `createDateTimePicker` or `configureDateTimePicker` to set date limits, time limits and the minute step. Save the choice from `onDateTimeChanged`. Use the public configuration structure rather than manually laying out date fields.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/date-time-picker.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-date-time-picker id="date" width="752"/>
```

```js
function enter(){DeskTile.configureDateTimePicker(DeskTile.byId('date'),{mode:'both',symbols:'arrows',date:'2026-10-29',time:'12:34',dateLabel:'日期',timeLabel:'时间',units:['年','月','日','时','分']});}
```

## Properties

| Property | Meaning |
| --- | --- |
| `width` | Width in pixels. |
| `date-time-config` | Picker configuration written by SDK methods. |
| `date-time-corner-text` | Optional upper-right labels for picker columns. |

## Events

Handle `date-time-changed`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/date-time-picker/light.png)

## Dark theme

![Dark theme](/previews/date-time-picker/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
