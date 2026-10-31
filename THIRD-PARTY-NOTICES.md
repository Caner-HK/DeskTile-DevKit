# Third-party components

DeskTile's Apache-2.0 license applies to its own content. The following components retain their original terms.

| Component | Use | Terms included |
| --- | --- | --- |
| QuickJS-ng | Local JavaScript preview runtime | `licenses/QuickJS.txt` |
| cJSON | Native JSON parsing | `licenses/cJSON.txt` |
| Existing DeskTile icon sources | SDK icons and examples | `licenses/icons-MIT.txt` |
| Google Material Symbols | SDK icons and examples | `licenses/icons-Apache-2.0.txt` |
| MiSans | General UI glyphs | `licenses/MiSans.pdf` |
| Cabin | Western UI glyphs | `licenses/Cabin-OFL.txt` |
| Noto Sans | Western UI glyphs | `licenses/NotoSans-OFL.txt` |
| Source Serif 4 | Western UI glyphs | `licenses/SourceSerif-OFL.txt` |
| VuePress, Vue and documentation dependencies | Documentation site and build | `licenses/dependencies.json` and `licenses/dependencies/` |

The preview font inventory is in `renderer/font-inventory.json`. GDS Transport and the app-specific Myriad Pro and DFLiSongHK faces are excluded from the preview executable and font pack. The preview uses MiSans for the device's Transport Sans selection.

The device firmware retains its existing Transport Sans font resources. Those resources are separate from this development kit.

Dependency records identify the installed package version, declared license and copied license or notice files. Microsoft runtime redistribution terms apply to the compiler runtime linked into the Windows preview executable.
