# Button

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Standard buttons are 52 px high with 20 px labels. Save uses primary (0), Cancel uses cancel (9), and Delete uses destructive (2). Handle `activate` and update `enabled` while an asynchronous action is pending. App-bar buttons use their own variants and a 72 px action area.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/button.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-row height="52" gap="16" alignment="1">
<dt-button text="保存" icon="49" width="152" height="52" font-size="20" button-style="0"/>
<dt-button text="取消" icon="48" width="152" height="52" font-size="20" button-style="9"/>
<dt-button text="删除" icon="41" width="152" height="52" font-size="20" button-style="2"/>
</dt-row>
```

## Properties

| Property | Meaning |
| --- | --- |
| `text` | UTF-8 display text. |
| `icon` | SDK system-icon ID. |
| `button-style` | Button-variant enum. |
| `enabled` | Accept input and use the corresponding enabled/disabled appearance. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Events

Handle `activate`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/button/light.png)

## Dark theme

![Dark theme](/previews/button/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
