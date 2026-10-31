# 颜色选择

[文档首页](/) / [设计与组件](/components/) / 操作与输入

展示可选择的颜色，并标记当前选择。

<!-- page-outline -->
[[toc]]

## 使用方式

颜色选择使用 button-style="10"。background 表示候选颜色，checked 标记当前选择，勾选符号由系统按底色对比度绘制。应用在 activate 后更新选中状态，并保存对应颜色。色块通过 accessibility-label 提供名称。

## 示例

[下载完整可运行示例](/component-examples/color-swatch.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-row height="76" gap="20" alignment="1">
<dt-button id="orange" accessibility-label="橙色" width="64" height="64" button-style="10" background="#FF9900" checked="true"/>
<dt-button id="blue" accessibility-label="蓝色" width="64" height="64" button-style="10" background="#3765FF" checked="false"/>
<dt-button id="green" accessibility-label="绿色" width="64" height="64" button-style="10" background="#168471" checked="false"/>
</dt-row>
```

### 示例逻辑

```js
function onEvent(event,target){if(event!==0)return;const ids=['orange','blue','green'];if(!ids.some(function(id){return target===DeskTile.byId(id);}))return;ids.forEach(function(id){DeskTile.setBoolean(DeskTile.byId(id),6,target===DeskTile.byId(id));});}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `button-style` | 按钮变体，例如 primary、cancel 或 destructive 的枚举值。 |
| `background` | 背景颜色，按 0xRRGGBB 表示。 |
| `checked` | 当前选中或开启状态。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![颜色选择浅色](/previews/color-swatch/light.png)

## 深色外观

![颜色选择深色](/previews/color-swatch/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
