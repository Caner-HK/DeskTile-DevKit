# 复选框

[文档首页](/) / [设计与组件](/components/) / 操作与输入

表示可独立勾选的项目，也可以显示一组子项部分选中的状态。

<!-- page-outline -->
[[toc]]

## 使用方式

checked 表示选中，indeterminate 表示部分选中。由应用统一计算状态，保持父项与子项显示一致。

## 示例

[下载完整可运行示例](/component-examples/checkbox.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-row height="56" gap="24" alignment="1">
<dt-checkbox width="48" height="48"/>
<dt-checkbox checked="true" width="48" height="48"/>
<dt-checkbox indeterminate="true" width="48" height="48"/>
<dt-checkbox checked="true" enabled="false" width="48" height="48"/>
</dt-row>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `checked` | 当前选中或开启状态。 |
| `indeterminate` | 部分选中状态。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 处理事件

关注 `value-changed` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![复选框浅色](/previews/checkbox/light.png)

## 深色外观

![复选框深色](/previews/checkbox/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
