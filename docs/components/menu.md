# 菜单

[文档首页](/) / [设计与组件](/components/) / 列表与弹窗

显示针对当前内容的可选操作。

<!-- page-outline -->
[[toc]]

## 使用方式

`ui.menu` 沿用设备 PopupMenu：默认宽 256 px，标题区域和操作行各高 56 px；标题使用 20 px 次要文字，左右内边距 16 px；行图标为 28×28 px，距左侧 16 px，文字从左侧 60 px 开始。外框使用主题分隔线颜色，操作行连续排列。菜单使用内嵌 popup 表面，呈现时保持背景内容原样；应用将其放入覆盖层，按触点位置放置并处理外部点击关闭。示例居中展示菜单本体。最多八项，内容超高时滚动。传入 showHeader: false 隐藏标题。通过 item.id 识别 activate，执行后关闭菜单。系统 App Menu 使用 DeskTile.registerMenu，详见下方接口区别。

## 示例

[下载完整可运行示例](/component-examples/menu.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-dialog id="file-menu" width="256" height="224" dialog-presentation="0" surface-style="4">
<dt-column height="56" padding="12,16,12,16">
<dt-text text="旅行计划.txt" font-size="20" height="32" foreground-role="3"/>
</dt-column>
<dt-scroll flex-grow="1">
<dt-column>
<dt-button id="open" accessibility-label="打开" height="56" button-style="4" enabled="true">
<dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">
<dt-icon icon="73" width="28" height="28"/>
<dt-text text="打开" font-size="20" height="56" flex-grow="1"/>
</dt-row>
</dt-button>
<dt-button id="rename" accessibility-label="重命名" height="56" button-style="4" enabled="true">
<dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">
<dt-icon icon="68" width="28" height="28"/>
<dt-text text="重命名" font-size="20" height="56" flex-grow="1"/>
</dt-row>
</dt-button>
<dt-button id="delete" accessibility-label="删除" height="56" button-style="4" enabled="true">
<dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">
<dt-icon icon="41" width="28" height="28" foreground-role="2"/>
<dt-text text="删除" font-size="20" height="56" flex-grow="1" foreground-role="2"/>
</dt-row>
</dt-button>
</dt-column>
</dt-scroll>
</dt-dialog>
```

### 示例逻辑

```js
function onEvent(event,target){if(event===0&&['open','rename','delete','cancel'].some(function(id){return target===DeskTile.byId(id);}))DeskTile.setBoolean(DeskTile.byId('file-menu'),4,false);}
```

### 与系统 App Menu 的区别

页面内菜单由应用创建、打开和关闭。系统 App Menu 则通过 `DeskTile.registerMenu([{action: 1, label: "设置", icon: 3}])` 注册，收到 `app-menu` 事件后按 action 切换页面。它跟随系统应用菜单入口，详见[Scaffold 与导航](scaffold.md)。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `visible` | 是否参与当前显示。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![菜单浅色](/previews/menu/light.png)

## 深色外观

![菜单深色](/previews/menu/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
