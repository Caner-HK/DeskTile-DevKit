# 上下步进器

[文档首页](/) / [设计与组件](/components/) / 操作与输入

通过上、下按钮调整一个离散数值，支持长按连续变化。

<!-- page-outline -->
[[toc]]

## 使用方式

上下步进器由 `ui.numberStepper` 生成。上下按钮分别使用 id-up、id-down，数值为 id-value。默认宽 128 px，按钮和数值区各高 52 px，间隔 8 px；`symbols: "arrows"` 使用上下箭头。长按每 100 ms 产生一次 activate。应用保存当前值、限制上下界，并在到达边界时禁用对应按钮。示例范围为 0 至 20。

## 示例

[下载完整可运行示例](/component-examples/number-stepper.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-column width="128" height="172" gap="8">
<dt-button id="count-up" icon="20" width="128" height="52" button-style="6" repeat-interval="100"/>
<dt-row height="52" gap="8" alignment="1" justification="1">
<dt-text id="count-value" text="10" font-size="32" height="52"/>
<dt-text text="次" font-size="20" height="52" foreground-role="3"/>
</dt-row>
<dt-button id="count-down" icon="21" width="128" height="52" button-style="6" repeat-interval="100"/>
</dt-column>
```

### 示例逻辑

```js
let count=10;
function refresh(){DeskTile.setText(DeskTile.byId('count-value'),0,String(count));DeskTile.setBoolean(DeskTile.byId('count-up'),5,count<20);DeskTile.setBoolean(DeskTile.byId('count-down'),5,count>0);}
function enter(){refresh();}
function onEvent(event,target){if(event!==0)return;if(target===DeskTile.byId('count-up'))count=Math.min(20,count+1);else if(target===DeskTile.byId('count-down'))count=Math.max(0,count-1);else return;refresh();}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![上下步进器浅色](/previews/number-stepper/light.png)

## 深色外观

![上下步进器深色](/previews/number-stepper/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
