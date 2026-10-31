# 悬浮操作按钮

[文档首页](/) / [设计与组件](/components/) / 操作与输入

浮在内容上方，提供页面最主要的新增操作。

<!-- page-outline -->
[[toc]]

## 使用方式

FAB 用于页面最主要的一项新增操作。便签采用 80×80 px 圆形按钮（button-style="8"），内部为 40×40 px 图标，距内容区右侧和底部各 24 px。通过 Stack 将它叠在列表之上，独立于列表滚动；列表底部需预留足够的可滚动空间，使最后一项可完整移出按钮覆盖区。示例点按后打开新建输入窗口。切角悬浮变体为 button-style="3"，与便签的圆形规格分别使用。

## 示例

[下载完整可运行示例](/component-examples/fab.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-stack flex-grow="1">
<dt-list>
<dt-list-row text="旅行计划" height="76" font-size="20"/>
<dt-list-row text="购物清单" height="76" font-size="20"/>
</dt-list>
<dt-column alignment="2" justification="2" padding="0,24,24,0">
<dt-button id="fab" accessibility-label="新建便签" width="80" height="80" button-style="8" alignment="1" justification="1">
<dt-icon icon="35" width="40" height="40"/>
</dt-button>
</dt-column>
</dt-stack>
```

### 示例逻辑

```js
function onEvent(event,target){if(event===0&&target===DeskTile.byId('fab'))DeskTile.keyboard(JSON.stringify({title:'新建便签',initial:'',maximum_length:512}));}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `button-style` | 按钮变体，例如 primary、cancel 或 destructive 的枚举值。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `icon` | SDK 图标目录中的编号。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![悬浮操作按钮浅色](/previews/fab/light.png)

## 深色外观

![悬浮操作按钮深色](/previews/fab/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
