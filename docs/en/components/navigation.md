# Navigation

[Documentation home](/en/) / [Design and components](/en/components/)

Nav switches pages inside an application. It sits below the app bar and left of content. Scaffold creates entries, handles input and selection, and supplies the content slot. The right-side [App Menu](app-menu.md) is a separate system surface for application actions.

<!-- page-outline -->
[[toc]]

## States

| State | Content | Default width |
| --- | --- | --- |
| `hidden` | Full-width page | 0 px |
| `labels` | Icons and labels | 320 px |
| `icons` | Icons and selection indicator | 96 px |

Default navigation switches between hidden and expanded. `dismissed: "icons"` cycles expanded, icons, then hidden. `permanentIcons: true` keeps the icon rail and switches between icons and labels. The application chooses its state relationship.

Rows are 64 px high, with 32 × 32 px icons at x=32 and expanded labels at x=96. Top and bottom padding are 8 px. `bottomCount` anchors trailing items such as settings to the bottom. Up to eight items are supported; a left accent mark identifies the selected page.

## Content placement

The icon rail reserves 96 px. When expanded, an icon-preserving configuration continues to reserve 96 px and overlays the rest. A hidden-on-dismiss configuration overlays content while expanded. Status bar and app bar stay fixed. Scaffold updates the content slot's position and width; business pages lay out within that slot.

## JavaScript

```js
const ui = DeskTile.require("ui/components.js");
const shell = ui.createScaffold({
  id: "main",
  title: "阅读",
  items: [
    { label: "阅读", icon: 43 },
    { label: "设置", icon: 3 }
  ],
  bottomCount: 1,
  navigation: {
    initial: "hidden",
    opened: "labels",
    dismissed: "icons"
  }
});
```

Mount through `shell.mount(DeskTile, contentMarkup, actionsMarkup)` and forward events:

```js
function onPointer(kind, event) {
  handleNavigation(shell.pointer(kind, event));
}
function onEvent(kind, target, value) {
  const result = shell.event(kind, target);
  handleNavigation(result);
  if (result.consumed) return;
  handlePageEvent(kind, target, value);
}
function update(now) {
  handleNavigation(shell.tick(now));
}
```

`handleNavigation` is application logic: check the returned result; `action === "selected"` opens `result.index`, while `action === "original"` performs the original back/exit action. Dispatch unconsumed events to the current page. `select`, `setTitle` and `setEntry` update selection, title and entry state. Refresh on theme changes and destroy on exit.

## Native

```cpp
#include <desktile/scaffold_view.hpp>
using namespace desktile::sdk;

ScaffoldView shell;
ScaffoldOptions options;
options.navigation.initial = NavigationMode::Hidden;
options.navigation.opened = NavigationMode::Labels;
options.navigation.dismissed = NavigationMode::Icons;
const NavigationEntry entries[] = {{"阅读", 43}, {"设置", 3}};
// host 是应用已创建的 Host；检查返回值后向 shell.content() 添加正文。
const auto result = shell.create(host, options, "阅读", entries, 2, 1);
```

Forward host pointer, activation and tick events through `shell.event(kind, payload)`. Act on `ScaffoldEvent.action` and stop page dispatch when `consumed` is true. The [reading templates](../examples/) contain complete implementations.

## Motion

Expansion takes 350 ms; collapse/retraction takes 120 ms with `cubic-bezier(0.1, 0.9, 0.2, 1)`. Bounds and content placement transition together while icons and text retain their sizes. All three state pairs work in both directions.

On the device, Scaffold submits final layout and the system composites a cached previous content region at display cadence. An 800 × 376 region temporarily uses 601,600 bytes of PSRAM; the final frame reuses display buffers. Release follows completion and the display scanner releasing references. Allocation failure presents the final layout directly.

Input pauses during the transition and resumes against final geometry. Desktop preview interpolates dimensions; keep JavaScript `shell.tick(now)` running or forward Native tick events. Capability detection selects the cached device path. Set `animateNavigation: false` or Native `options.animateNavigation = false` for immediate changes.

## Preview

### Hidden

![Hidden](/previews/navigation/hidden.png)

### Expanded

![Expanded](/previews/navigation/labels.png)

### Icons only

![Icons](/previews/navigation/icons.png)
