# Checkbox

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Use independent checkboxes for multiple choices. `checked` marks selection and `indeterminate` marks a partially selected group. Compute group and child states from the same application data.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/checkbox.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-row height="56" gap="24" alignment="1">
<dt-checkbox width="48" height="48"/>
<dt-checkbox checked="true" width="48" height="48"/>
<dt-checkbox indeterminate="true" width="48" height="48"/>
<dt-checkbox checked="true" enabled="false" width="48" height="48"/>
</dt-row>
```

## Properties

| Property | Meaning |
| --- | --- |
| `checked` | Current selected or on state. |
| `indeterminate` | Partially selected state. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Events

Handle `value-changed`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/checkbox/light.png)

## Dark theme

![Dark theme](/previews/checkbox/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
