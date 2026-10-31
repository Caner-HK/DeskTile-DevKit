# Button variants

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Additional styles include secondary (1), text (4), outlined (7), cut-corner floating (3) and circular (8). The example separates normal actions from icon and floating variants. Give icon-only buttons an `accessibility-label`. App-bar icon actions use a 72 px touch area and a 32 px icon.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/button-variants.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-row height="52" gap="16" alignment="1">
<dt-button text="打开" icon="73" width="152" height="52" font-size="20" button-style="1"/>
<dt-button text="查看" icon="73" width="152" height="52" font-size="20" button-style="7"/>
<dt-button text="更多" icon="10" width="152" height="52" font-size="20" button-style="4"/>
</dt-row>
<dt-row height="80" gap="24" alignment="1">
<dt-button accessibility-label="刷新" width="52" height="52" button-style="4" icon="14"/>
<dt-button accessibility-label="新建" width="80" height="80" button-style="3" icon="35"/>
<dt-button accessibility-label="新建便签" width="80" height="80" button-style="8" icon="35"/>
</dt-row>
```

## Properties

| Property | Meaning |
| --- | --- |
| `button-style` | Button-variant enum. |
| `text` | UTF-8 display text. |
| `icon` | SDK system-icon ID. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/button-variants/light.png)

## Dark theme

![Dark theme](/previews/button-variants/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
