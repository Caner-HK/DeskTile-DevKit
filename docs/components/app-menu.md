# 系统应用菜单 App Menu

[文档首页](/) / [设计与组件](/components/)

App Menu 放置应用级操作，例如打开设置、关于应用或切换阅读偏好。系统负责菜单的展示与输入，应用注册条目并处理回调。便签通过这个入口提供“关于”。

<!-- page-outline -->
[[toc]]

## 与页面菜单的区别

| 用途 | 接口 | 生命周期 |
| --- | --- | --- |
| 应用级操作 | `DeskTile.registerMenu` | 系统持有当前应用注册的条目 |
| 当前文件、图片等内容的操作 | `ui.menu` | 应用在自己的页面覆盖层中管理 |

在本地交互预览中，点击工具栏的 App menu、按 F10 或点击鼠标右键，可以打开系统应用菜单。页面菜单的布局与示例见[菜单](menu.md)。

## 注册与处理

下面的示例注册“关于”和一个开关项。`action` 是应用自己定义的正整数，保持每个条目的标识唯一。

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

事件 `9` 为 `app-menu`。`target` 是注册时的 `action`，`value` 为当前开关值。用户点击开关后，系统先切换菜单勾选状态，再发送事件；应用负责业务状态与持久化。

## 条目与更新

SDK 1.0 最多注册三个条目。每次调用都替换当前菜单；传入空数组清空应用注册项。菜单文字使用应用当前语言，在语言或可操作状态变化时重新注册。

| `type` | 含义 |
| --- | --- |
| `0` | 普通操作 |
| `1` | 开关项 |
| `2` | 禁用的普通操作 |
| `3` | 禁用的开关项 |

`checked` 使用 `0` 或 `1`。`icon` 使用系统图标编号，省略时采用默认图标。标签必须为有效 UTF-8，并满足原生条目结构的容量限制。

返回值为 `0` 表示注册成功；负数为错误码。原生应用使用 `dt_app_menu_item_v1`、`DT_SYSTEM_APP_MENU_COMMAND` 和 `DT_EVENT_APP_MENU`，与 JavaScript 共享条目限制及事件语义。

相关内容：[页面与生命周期](../guide/lifecycle.md)、[便签示例](../examples/notes.md)、[SDK 接口参考](../api/javascript.md)。
