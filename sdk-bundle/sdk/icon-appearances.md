# Application icon appearances

An application may offer up to 16 packaged icon appearances. The shell owns selection persistence and icon refresh. The application owns the settings UI and decides when to save a choice.

## Manifest

```json
"icons": {
  "application": "assets/icons/application.dti",
  "tile": "assets/icons/tile.dti",
  "appearances": {"default": "HOM", "choices": ["HOM", "YMT"]}
}
```

IDs contain 1–16 ASCII letters, digits, underscores or hyphens. They are unique and the default belongs to `choices`. Every choice supplies the same icon filenames inside its ID subdirectory, for example `assets/icons/HOM/application.dti` and `assets/icons/HOM/tile.dti`. Keep the base files as the default fallback for package inspection and older readers. When `tile_variants` is enabled, each appearance also includes all four native-size variant files under its directory. The package builder validates their presence. An optional splash image follows the same path convention, for example `assets/icons/HOM/splash.dti`. Base splash reads resolve to the selected appearance when that resource exists; otherwise they use the base splash. Supply a native 96px image for the standard launch indicator.

## Resize transition colors

Applications can optionally declare the color used while desktop tile content changes size:

```json
"tile": {
  "default_size": "2x2",
  "supported_sizes": ["1x1", "2x2", "4x2", "4x4"],
  "transition_color": "#96AF76",
  "appearance_transition_colors": {"HOM": "#96AF76", "YMT": "#D4C3B1"}
}
```

Colors are opaque `#RRGGBB` strings, converted to the display's RGB565 format. Appearance keys must be declared in `icons.appearances.choices`. The selected appearance color takes priority, followed by `transition_color`, then the existing shell fallback. Each field is optional; an appearance map, when supplied, must contain at least one entry. Black is a valid explicit color.

The shell reads this metadata without opening the app. Complete custom tiles fade through the selected color. Shell-painted icon tiles ease their background toward it during the content change and return to the normal background at both endpoints. Timing, title placement, normal/pressed artwork, and normal tile colors stay unchanged. Mosaic registers the base palette color of each of its twelve stations.

This is a manifest extension shared by JavaScript and native packages, with no new host function or ABI-table change. Packages using these fields require firmware with this parser extension; earlier strict parsers reject the fields. Existing packages retain their fallback behavior. The parsed metadata adds at most 40 bytes per manifest and uses the existing selected-appearance cache.

## C and C++

Include `desktile/icon_appearance.hpp`:

```cpp
char id[17]{};
auto result = desktile::sdk::iconAppearance(host, id);
result = desktile::sdk::setIconAppearance(host, "YMT");
result = desktile::sdk::setIconAppearance(host, ""); // restore default
```

The ABI remains 1.0. C callers use `storage_read` and `storage_write` with `DT_SYSTEM_ICON_APPEARANCE_COMMAND`. Read returns the ID bytes without a terminator. Write takes at most 16 bytes, without a terminator; zero bytes selects the default. No new application permission is required. The host resolves the registered calling context, validates the declared ID and required resources, and persists it using app-private storage. A successful write refreshes desktop, image and list caches. Always check the result before reporting success.

## JavaScript

```js
const current = DeskTile.icons.current();
const result = DeskTile.icons.select("YMT");
const resetResult = DeskTile.icons.reset();
```

`current()` returns a string or `null` when unsupported/unavailable. Writes return `dt_result`: zero is success. Undeclared IDs and malformed input are rejected. Incomplete resource sets and storage failures retain the existing selection.

## Lifecycle and rendering

Selections survive application exit and reboot. Clearing application data removes the choice. If an update removes a saved choice, the package default is used. Selection does not launch the application at boot; the host loads and caches a small ID on first icon access. Resource reads of the base application/tile paths (including size and range reads) resolve to the selected appearance. Explicit appearance paths remain usable for picker previews.

Trusted firmware custom painters receive `SystemTile.appearance` and `SystemTile.pressed`; the selected ID remains independent of application runtime state. The shell's standard icon painter uses the selected package resources. Custom painters are responsible for native-size composition and preserving their foreground during pressed feedback.

Existing manifests without `appearances` retain their current behavior. Older firmware parsers reject the new manifest field, so distribute the first appearance-enabled application package with matching firmware. This optional extension preserves the host ABI table but requires the updated host implementation. An older host returns an error for the command; applications should retain their default icon in that case.

Mosaic uses all 12 existing station palettes and defaults to HOM. Desktop custom tiles retain procedural backgrounds and losslessly encoded train foregrounds. Its icon picker reads PC-prerendered 168px normal/pressed images from a lossless row-indexed RGB565 atlas, loaded only while the picker is open. It paints clipped rows through the system scroll cache and draws the app name separately. The package includes native 96px splash images for every choice. Rebuild foregrounds with `tools/generate_mosaic_icons.py`, then previews and packaged icons with `tools/test_mosaic_tiles.py`.
