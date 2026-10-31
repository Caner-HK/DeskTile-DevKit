# Choice stepper

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Put the left/right stepper in a list row alongside its label. The example uses a 76 px comfortable row. The control spans the whole row; its arrows and value align to the right internally. Arrow buttons are 44 × 44 px with 30 px right spacing. Set `minimum`, `maximum` and `step`, then save the new value on `value-changed`.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/choice-stepper.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-list>
<dt-list-row text="音量" font-size="20" height="76">
<dt-choice-stepper id="volume" height="76" minimum="0" maximum="100" step="5" value="60"/>
</dt-list-row>
</dt-list>
```

## Properties

| Property | Meaning |
| --- | --- |
| `minimum` | Lower bound. |
| `maximum` | Upper bound. |
| `step` | Change per step. |
| `value` | Current value. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `width` | Width in pixels. |

## Events

Handle `value-changed`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/choice-stepper/light.png)

## Dark theme

![Dark theme](/previews/choice-stepper/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
