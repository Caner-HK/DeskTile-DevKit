# App Menu

[Documentation home](/en/) / [Design and components](/en/components/)

App Menu holds application-wide actions such as Settings, About or reading preferences. The system owns presentation and input; the application registers items and handles callbacks. Page-specific actions use [Menu](menu.md) in an application-owned overlay.

## Open and register

In local preview, use the toolbar App menu action, F10 or a right click. The system side menu animates in and out. Define unique positive `action` IDs:

```js
let rememberRoute = true;

function registerAppMenu() {
  return DeskTile.registerMenu([
    {action: 101, label: '关于', icon: 37, type: 0},
    {action: 102, label: '保留所选路线', type: 1,
     checked: rememberRoute ? 1 : 0}
  ]);
}

function enter() {
  const result = registerAppMenu();
  if (result < 0) throw new Error('Menu registration failed: ' + result);
}

function onEvent(event, target, value) {
  if (event !== 9) return;
  if (target === 101) {
    // 在这里切换到应用自己的关于页面。
  } else if (target === 102) {
    rememberRoute = value === 1;
    // 在这里保存偏好；保存失败时恢复原值并重新注册菜单。
  }
}
```

Event 9 is `app-menu`; `target` is the registered action and `value` is the toggle's current value. The system changes the visual check state before sending the event. The application persists the setting and restores/re-registers on failure.

## Items and updates

SDK 1.0 allows three registered items. Each registration replaces the current menu; an empty array clears it. Use the application's current language and register again when language or availability changes.

| Type | Meaning |
| --- | --- |
| 0 | Action |
| 1 | Toggle |
| 2 | Disabled action |
| 3 | Disabled toggle |

`checked` is 0 or 1. `icon` is a system ID, with a default when omitted. Labels must be valid UTF-8 within the native item capacity. Zero means successful registration, negative values are errors. Native uses `dt_app_menu_item_v1`, `DT_SYSTEM_APP_MENU_COMMAND` and `DT_EVENT_APP_MENU` with the same rules.
