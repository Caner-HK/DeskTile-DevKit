# Text

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Use native font sizes for headings, body text and labels. Native measurement supports 16, 20, 22, 32 and 48 px. Enable wrapping for paragraphs and allocate a definite width for list summaries. Test all supported languages and long values.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/text.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-text text="周末计划" font-size="32" height="48"/>
<dt-text text="早晨出发，沿着海边散步。下午去图书馆，把喜欢的段落记下来。" font-size="20" text-wrap="true" width="752"/>
<dt-text text="最后修改于昨天" font-size="20" foreground-role="3" height="28"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `text` | UTF-8 display text. |
| `font-size` | A native font-size tier. |
| `foreground-role` | Theme role for text or icon color. |
| `text-wrap` | Allow wrapping. |
| `text-strikethrough` | Draw a strike through a single text line. |

## Light theme

![Light theme](/previews/text/light.png)

## Dark theme

![Dark theme](/previews/text/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
