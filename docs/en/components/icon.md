# Icon

[Documentation home](/en/) / [Design and components](/en/components/) / Content

Choose a built-in icon by its SDK number. The example uses three real system assets in 40 × 40 px bounds, in a Row with `alignment="1"`. App-bar action icons use 32 × 32 px. Match the size to the particular component variant and check optical centering. See the [icon catalog](icon-catalog.md) for names, IDs and downloadable DTI resources. Package-owned symbols use Image and a resource path.

<!-- page-outline -->
[[toc]]

## Example

[Download the runnable example](/component-examples/icon.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.

```html
<dt-row height="64" gap="24" alignment="1">
<dt-icon icon="28" width="40" height="40"/>
<dt-icon icon="49" width="40" height="40"/>
<dt-icon icon="81" width="40" height="40"/>
</dt-row>
```

```html
<dt-image resource="assets/my-symbol.dti" width="40" height="40"/>
```

## Properties

| Property | Meaning |
| --- | --- |
| `icon` | SDK system-icon ID. |
| `width` | Width in pixels. |
| `height` | Height in pixels. |
| `foreground-role` | Theme role for text or icon color. |

## Light theme

![Light theme](/previews/icon/light.png)

## Dark theme

![Dark theme](/previews/icon/dark.png)

These 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.

## Package-owned icons

[Download the custom-icon example](/component-examples/custom-icon.zip). Image loads the packaged DTI assets at the same square bounds. System-colored DTI uses the current accent; custom-colored DTI retains its pixels. Import, preview and save external graphics with the [Import icon tab](../tools/assets.md#import-icon).

![Packaged icons](/previews/icon/custom.png)
