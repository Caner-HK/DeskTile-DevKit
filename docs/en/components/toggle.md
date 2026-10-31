# Toggle

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Use a toggle for a binary setting that takes effect immediately. Keep `checked` in sync with the application state. Commit the setting, then confirm the persisted state; restore the old value and report a failed save. Update dependent controls through `enabled`.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/toggle.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-list>
<dt-list-row id="notify" text="接收提醒" font-size="20" height="76" enabled="true">
<dt-toggle id="enabled" checked="true" enabled="true" width="112" height="56" slot="2"/>
</dt-list-row>
</dt-list>
```

## Properties

| Property | Meaning |
| --- | --- |
| `checked` | Current selected or on state. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Events

Handle `value-changed`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/toggle/light.png)

## Dark theme

![Dark theme](/previews/toggle/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
