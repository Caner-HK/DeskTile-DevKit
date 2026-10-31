# 组合模式

[文档首页](/) / [设计与组件](/components/)

`components.js` 构建器生成系统组件标记，适用于常规设置列表、确认弹窗和数字步进。先把 SDK 模块复制到包内，再从应用逻辑中加载。创建的项目已包含这些模块。

```js
const ui = DeskTile.require("ui/components.js");
const row = ui.listRow({id: "storage", label: "存储空间", summary: "12 KB"});
```

将生成的标记放入当前页面或传给 Scaffold 的 mount 方法。下面展示构建器生成的实际结构，便于理解插槽位置。

<!-- page-outline -->
[[toc]]

## 列表摘要

```html
<dt-list-row id="storage" text="存储空间" font-size="20" height="76" enabled="true"><dt-text text="12 KB" font-size="20" foreground-role="3" slot="2"/></dt-list-row>
```

## 尾部开关

```html
<dt-list-row id="notify" text="接收提醒" font-size="20" height="76" enabled="true"><dt-toggle id="enabled" checked="true" enabled="true" width="112" height="56" slot="2"/></dt-list-row>
```

## 数字步进

```html
<dt-column width="128" height="172" gap="8"><dt-button id="hour-up" icon="39" width="128" height="52" button-style="6" repeat-interval="100"/><dt-row height="52" gap="8" alignment="1" justification="1"><dt-text id="hour-value" text="09" font-size="32" height="52"/><dt-text text="时" font-size="20" height="52" foreground-role="3"/></dt-row><dt-button id="hour-down" icon="40" width="128" height="52" button-style="6" repeat-interval="100"/></dt-column>
```

## 选择与状态

`listRow` 默认使用 76 px 行高，`density: "compact"` 使用 54 px。摘要默认位于右侧；需要中间摘要时显式设置 `summaryPosition: "middle"`。

开关通过 `value-changed` 事件处理新值，保存成功后更新持久状态。保存失败时恢复原值，设置其 `checked` 属性；依赖项同步更新 `enabled`。

## 确认与菜单

`ui.confirmation` 接受标题、正文和操作列表。按操作语义指定取消或破坏性样式。`ui.menu` 生成具有可选标题的操作菜单。具体参数见[组件构建器](../api/builders.md)，完整页面组织见[Scaffold 与导航](scaffold.md)。
