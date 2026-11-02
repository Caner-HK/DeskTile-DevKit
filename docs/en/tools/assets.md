# Images, icons and tiles

VS Code provides two tools: **Application Icons and Tiles** manages application identity and desktop tiles; **Import Resources** offers **Import icon** and **Import image** tabs in one editor. Both export device DTI resources. **Build Application** packages the resources and code into a `.dtapp`.

<!-- page-outline -->
[[toc]]

## Application icons and tiles

1. Open an application project and choose **Application Icons and Tiles** in the DeskTile DevKit sidebar.
2. Select the application, notification, default tile icon or one of four tile sizes. Multi-appearance projects also offer an appearance ID selector.
3. When editing icons or using **Custom drawing**, use **Add image** to import PNG, SVG, JPEG, WebP or DTI. Add images, text, titles and rectangles, rename layers and change their order.
4. Drag a layer to position it and drag its lower-right handle to resize. Images and default-icon instances keep their proportions; hold Shift to resize each axis. Enter exact coordinates, dimensions, rotation, colors and text settings in the inspector.
5. Choose Simplified Chinese, Traditional Chinese or English to edit application names, per-size tile names and text. Title layers use the tile name, falling back to the application name.
6. Check edges against light and dark preview backgrounds. Zoom changes the displayed canvas size; saved coordinates remain device pixels.
7. Save to the project, reopen to continue editing, then build the application.

Arrow keys move a selected layer by 1 px; Shift increases the step to 10 px. Delete removes a layer. Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z redoes.

The complete source image is transformed before the canvas clips it. Enlarge and reposition a photograph to adjust its crop. Backgrounds, layers and title layout are independent for each tile size.

### Two tile drawing modes

**Tile drawing** determines who draws all four tile sizes:

- **System managed**: supply the default tile icon and localized names. The device draws the background, icon placement, system font and title. Tile-size pages are read-only previews; **Edit tile icon** opens the shared default icon. Saving exports square icons at 40, 64, 80 and 128 px, leaving titles and backgrounds to the device.
- **Custom drawing**: compose the complete tile, including its background, icon, text and title. Each size has an independent canvas. Saving exports full static images and sets `tile.full_image: true`.

The mode applies to every size and appearance. Switching preserves editable custom compositions; undo restores the previous mode. Existing full-image packages open in Custom drawing mode.

System-managed previews follow the desktop composition. The small tile centers its icon. For other sizes, **Tile title** selects **Show title** or **Hide title**. Visible titles move the icon center 10 px higher; hidden titles center the icon in the tile.

| Tile | Main icon side | With title X / Y | Without title X / Y |
| --- | --- | --- | --- |
| 1 × 1 | 40 px | Always untitled | 20 / 20 |
| 2 × 2 | 64 px | 52 / 42 | 52 / 52 |
| 4 × 2 | 80 px | 132 / 34 | 132 / 44 |
| 4 × 4 | 128 px | 108 / 98 | 108 / 108 |

System firmware supporting `tile.show_title` reads per-size visibility from the manifest's `tile` object, for example `"show_title": {"2x2": false, "4x2": true, "4x4": false}`. Larger sizes default to visible titles; 1 × 1 always centers its icon. Empty names still fall back to the application name; visibility is a separate setting. Complete custom artwork controls its own text.

System titles use a 32 px native font, a 16 px horizontal inset and a 36 px region starting 44 px above the bottom. Long names use an ellipsis. The device uses its current system font, language and theme.

In Custom drawing mode, **Use standard arrangement** restores the current canvas to default-icon and title layers as an editable starting point. The result remains custom artwork. Undo restores the previous composition.

### Default icon and complete tiles

The default tile icon is a reusable 96 × 96 composition. **Add default icon** inserts an instance into a tile. Editing the default composition updates its instances; each instance retains its own position, size, rotation and system-ink color. Existing independent size-specific assets retain their composition when imported.

| Purpose | Canvas |
| --- | --- |
| Application and default tile icons | 96 × 96 |
| Notification icon | 32 × 32 |
| Small 1 × 1 tile | 80 × 80 |
| Medium 2 × 2 tile | 168 × 168 |
| Wide 4 × 2 tile | 344 × 168 |
| Large 4 × 4 tile | 344 × 344 |

Complete artwork owns its background and title. The composition determines title visibility and layout.

### Editable source project

`icon-design/project.json` stores layers, languages, sizes and appearances. Complete source images live in `icon-design/sources`. Include this directory in your application's source control; DevKit excludes it from device packages.

Valid projects from the previous editor retain original sources, color modes and padding. Reopen after an external manifest change. Repeated saves reuse the editor resource directory; resource-derived appearances reuse their declared paths. Application code, versions and unrelated manifest settings are preserved.

System font preview reads DeskTile glyph bitmaps and advance metrics directly. Choose MiSans (system default), Cabin, Noto Sans or Source Serif 4 at native 16, 20, 22, 32 or 48 px sizes. Western glyphs follow the selected family; Chinese uses the system fallback. Preview and static export share the same native glyph data.

Choose **Installed font** to enter a computer font name and use a 6–256 px size. Install the same font when continuing on another computer. Text is exported as pixels in the chosen design font; save again after changing it. Existing complete tiles import as image layers. Replace the original image or add layers to change text already baked into an image.

## Colors and dependencies

System coloring preserves alpha shape and suits monochrome application, notification and default icons. Complete tiles retain composition colors; instances of a system-colored default icon can have their own ink.

Custom artwork exports as RGB565 with binary transparency: alpha below 128 becomes transparent; other pixels become opaque. System-colored icons retain 8-bit alpha. The desktop canvas defaults to 100% and renders at the screen pixel density with smooth edges; exports use native device resolution and encoding. SVG previews rasterize the complete source bounds while the project preserves the original file. Low-resolution bitmaps retain their source detail; import the original SVG or a higher-resolution image when available.

```sh
python -m pip install Pillow CairoSVG
```

Use self-contained SVG paths and images. Convert text to paths for portable vector artwork.

## SDK 1.0 complete static tiles

Custom drawing sets `tile.full_image` and `icons.tile_variants`. System managed exports square icon variants and removes `tile.full_image`. This example declares custom drawing:

```json
{
  "icons": {
    "application": "assets/application.dti",
    "tile": "assets/tile.dti",
    "tile_variants": true
  },
  "tile": {
    "default_size": "2x2",
    "supported_sizes": ["1x1", "2x2", "4x2", "4x4"],
    "full_image": true
  }
}
```

These paths use `assets/tile-1x1.dti`, `tile-2x2.dti`, `tile-4x2.dti` and `tile-4x4.dti` at the canvas dimensions above. Optional Traditional Chinese and English companions add `-zh-HK` and `-en` after the size. Missing companions fall back to the unsuffixed resource. The system samples the actual artwork for transition background colors.

Legacy icon-only tiles retain their 40, 64, 80 and 128 px square variants and system title layout. Complete static tiles require the matching updated System firmware and SDK build tools. This capability is included in **SDK 1.0 / Tools 2**.

## Multiple icon appearances

Applications select appearances through one public API. Declare up to 16 inline IDs, or discover additional IDs from packaged resource directories:

```json
"appearances": { "default": "ADM", "from_resources": true }
```

This field belongs inside `icons` and is an alternative to `choices`. IDs contain 1–16 ASCII letters, digits, underscores or hyphens. Resource-derived appearances support up to 256 IDs; the package still has a 512-file limit and device installation size limits.

For base resources `assets/application.dti` and `assets/tile.dti`, ADM uses `assets/ADM/application.dti` and `assets/ADM/tile.dti`. Complete tiles also require four size variants in that directory. Retain base resources as the default fallback. Optional splash images follow the same directory rule; a missing selected splash falls back to the base splash.

```js
const current = DeskTile.icons.current();
const result = DeskTile.icons.select('ADM');
if (result !== 0) {
  // Show an application-owned save error.
}
DeskTile.icons.reset();
```

```cpp
#include <desktile/icon_appearance.hpp>
char current[17]{};
auto result = desktile::sdk::iconAppearance(host, current);
result = desktile::sdk::setIconAppearance(host, "ADM");
result = desktile::sdk::setIconAppearance(host, "");
```

Selection is package-scoped and persistent. An empty ID restores the manifest default. Successful changes refresh the icon cache; missing resources or failed writes preserve the previous selection. Interactive preview implements the same API and local persistence. Calligraphy's 43 appearances use this public model and migrate its earlier saved choice.

## Import resources

Open **Import Resources** from the DeskTile DevKit sidebar. Its **Import icon** and **Import image** tabs retain their own source, settings and preview. **Save to project** is the primary action and processes the current settings directly. **Preview** provides an optional check before saving.

### Import icon

Import external symbols for page content, buttons or lists:

1. Open an application project and choose **Import Resources → Import icon**.
2. Browse for an SVG, PNG, JPEG, WebP or DTI file. The source can be outside the project. Choose an output path inside the project's `assets` directory.
3. Set maximum width and height. Conversion preserves the source aspect ratio and exports a system-coloured icon resource, retaining its shape and transparency.
4. Optionally click **Preview** to check light and dark backgrounds and the actual pixel dimensions.
5. Click **Save to project** to generate and write the DTI resource from the current settings. Confirm replacement for an existing file. Preview alone creates temporary files, which are cleaned up when the page closes.
6. After saving, copy the **Image markup** into your page layout, then build the application.

Interface icons are loaded through the `dt-image` resource path and coloured by the system. **Application Icons and Tiles** manages application names, identity icons and tile configuration.

### Import image

1. Switch to **Import image**, choose the source and set an output path inside the project's `assets` directory.
2. Leave dimensions empty for the original size, or set maximum bounds while preserving the aspect ratio. Images retain their original colours within the device format; see Colors and dependencies for transparency rules.
3. Optionally preview against light and dark backgrounds, then **Save to project**, or save directly. Copy the saved Image markup into your page layout.

## Command-line conversion

The CLI provides quick centered conversion; use the visual editor for layered composition:

```sh
desktile icon . --source artwork/logo.svg --purpose tile --mode system --padding 8
desktile icon . --source artwork/logo.svg --purpose tile --mode system --padding 8 --apply
desktile build .
```

Purposes are application, tile and notification. Applications declare notification permission according to actual use. Page images accept PNG, JPEG, WebP, SVG and DTI:

```sh
desktile image . --source artwork/picture.png --output assets/picture.dti
desktile image . --source artwork/symbol.svg --output assets/symbol.dti --width 40 --height 40 --mode system
```

Width and height are proportional maximum bounds. One dimension determines the other. Existing output requires `--replace`. Generated images allow 4096 px per side and 1,048,576 total pixels; the device Image component additionally limits an individual image to 384,000 pixels.

```html
<dt-image resource="assets/picture.dti" width="320" height="180"/>
```

Keep component and resource proportions equal. See the [icon catalog](../components/icon-catalog.md) for system symbols and licenses.
