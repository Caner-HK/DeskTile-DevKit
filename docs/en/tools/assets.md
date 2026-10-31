# Images, icons and tiles

[Documentation home](/en/) / [Development tools](/en/tools/)

Create application, tile and notification icons from PNG or SVG. Conversion produces `.dti` resources and updates the manifest. **Build Application** packages code and resources into `.dtapp`.

<!-- page-outline -->
[[toc]]

## Icon editor

1. Open the project and choose **Create icons and tile resources**.
2. Select application, notification, default tile or an individual tile size, then choose an image.
3. Select system coloring or retained image colors.
4. Set the surrounding padding percentage. The complete asset is centered proportionally in a square canvas.
5. Inspect all four tile sizes and light/dark backgrounds. Each size has independent image, mode and padding; click a tile to select it. **Use default tile icon** resets that size to the default asset.
6. Save to the project, then build the installer.

Saving creates a resource directory and updates manifest paths. Original images and editor parameters remain in `.desktile`; closing releases conversion drafts. The editor manages one icon set. Projects with multiple `icons.appearances` retain their existing per-appearance paths.

## Color and sizes

System coloring preserves alpha shape and uses theme color. Custom mode stores RGB565 with binary transparency; partially transparent edges become transparent or opaque. Previews decode the actual DTI pixels.

Notification icons are 32 px, application/default tile icons are 96 px. Size-specific tile icons are 40, 64, 80 and 128 px. Both modes support per-size resources. Install conversion dependencies:

```sh
python -m pip install Pillow CairoSVG
```

SVGs should have complete paths. Convert external images, styles and fonts to self-contained vector paths in the source tool.

## CLI icons

Generate and inspect the returned light/dark previews:

```sh
desktile icon . --source ./artwork/logo.svg --purpose tile --mode system --padding 8
```

Apply the same parameters and build:

```sh
desktile icon . --source ./artwork/logo.svg --purpose tile --mode system --padding 8 --apply
desktile build .
```

Purposes are `application`, `tile` and `notification`. Creating a notification icon updates resources; the application declares notification permission separately.

## Page images and custom symbols

The image command accepts PNG, JPEG, WebP, SVG and DTI. It preserves aspect ratio and defaults to original dimensions. SVG requires a viewBox or explicit pixel size. Output goes in package assets:

```sh
desktile image . --source artwork/picture.png --output assets/picture.dti
desktile image . --source artwork/symbol.svg --output assets/symbol.dti --width 40 --height 40 --mode system
desktile build .
```

Width/height are maximum bounds. Both specified dimensions fit the complete image proportionally; one specified dimension determines the other. Results report actual dimensions and decoded theme previews. Existing output requires `--replace`.

```html
<dt-image resource="assets/picture.dti" width="320" height="180"/>
<dt-image resource="assets/symbol.dti" width="40" height="40"/>
```

Keep component and resource aspect ratios equal. Default `custom` uses RGB565 and binary transparency; `system` retains alpha and uses the current accent. Limits are 4096 px per side and 1,048,576 total pixels; resize larger sources. Decoding supports RGB565, RLE RGB565, masked RGB565 and theme alpha formats. See the [icon catalog](../components/icon-catalog.md).
