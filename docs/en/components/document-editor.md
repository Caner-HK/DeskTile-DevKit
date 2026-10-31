# Document editor

[Documentation home](/en/) / [Design and components](/en/components/) / Actions and input

Follow the Notes body layout: 24 px padding on all four sides inside a scroll view filling the content region. The example enables `document-headings` to display the first paragraph as a heading. Text, cursor and input-session state are shared between the application and system keyboard. Embedded keyboard presentations need the editor handle.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/document-editor.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-scroll flex-grow="1">
<dt-document-editor id="editor" text="旅行计划&#10;&#10;周六上午出发，带上相机和水。" padding="24" height="376" document-headings="true"/>
</dt-scroll>
```

## Properties

| Property | Meaning |
| --- | --- |
| `text` | UTF-8 display text. |
| `height` | Height in pixels. |
| `document-headings` | Render document heading styles. |
| `document-cursor` | Text cursor position. |
| `document-scroll` | Internal editor scroll position. |
| `document-focused` | Editor focus state. |

## Events

Handle `text-changed`, `focus`, `blur`. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).

## Light theme

![Light theme](/previews/document-editor/light.png)

## Dark theme

![Dark theme](/previews/document-editor/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
