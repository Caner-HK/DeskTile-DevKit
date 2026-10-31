# Component patterns

[Documentation home](/en/) / [Design and components](/en/components/)

`components.js` generates native component markup for settings, confirmation dialogs and steppers. Generated projects already contain the SDK modules in `ui`.

```js
const ui = DeskTile.require("ui/components.js");
const row = ui.listRow({id: "storage", label: "存储空间", summary: "12 KB"});
```

Mount generated markup in a page or Scaffold. The following source examples show actual slot placement with their original labels.

<!-- page-outline -->
[[toc]]

## Trailing summary

```html
<dt-list-row id="storage" text="存储空间" font-size="20" height="76" enabled="true"><dt-text text="12 KB" font-size="20" foreground-role="3" slot="2"/></dt-list-row>
```

## Trailing toggle

```html
<dt-list-row id="notify" text="接收提醒" font-size="20" height="76" enabled="true"><dt-toggle id="enabled" checked="true" enabled="true" width="112" height="56" slot="2"/></dt-list-row>
```

## Number stepper

```html
<dt-column width="128" height="172" gap="8"><dt-button id="hour-up" icon="39" width="128" height="52" button-style="6" repeat-interval="100"/><dt-row height="52" gap="8" alignment="1" justification="1"><dt-text id="hour-value" text="09" font-size="32" height="52"/><dt-text text="时" font-size="20" height="52" foreground-role="3"/></dt-row><dt-button id="hour-down" icon="40" width="128" height="52" button-style="6" repeat-interval="100"/></dt-column>
```

## State and density

`listRow` defaults to 76 px; `density: "compact"` uses 54 px. Summaries align right unless `summaryPosition: "middle"` is explicitly requested. Handle `value-changed`, save the preference and confirm persistent state; restore `checked` on failure. Update dependencies with `enabled`.

## Confirmation and menus

`ui.confirmation` accepts title, body and actions. Choose cancel/destructive variants by meaning. `ui.menu` creates a menu with an optional header. See [builders](../api/builders.md), [Scaffold](scaffold.md) and the individual component pages for dimensions and behavior.
