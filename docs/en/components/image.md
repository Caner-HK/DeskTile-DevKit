# Image

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Load a package-relative DTI resource. This example uses the complete Color Grid image at its original 480 × 288 px size. Center its parent and keep the aspect ratio. A parent with cross-axis stretch can stretch a fixed-size image, so set alignment explicitly. Check transparent edges against light and dark backgrounds.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/image.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-image resource="picture.dti" width="480" height="288"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `resource` | Package-relative resource path. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |

## Light theme

![Light theme](/previews/image/light.png)

## Dark theme

![Dark theme](/previews/image/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.
