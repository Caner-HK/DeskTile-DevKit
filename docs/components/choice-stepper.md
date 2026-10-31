# 步进选择器

[文档首页](/) / [设计与组件](/components/) / 操作与输入

用左右操作在指定范围内逐步调整一个数值。

<!-- page-outline -->
[[toc]]

## 使用方式

左右步进器用于列表中的数值或选项调整，与左侧标签保持在同一行。示例使用 76 px 宽松列表行，控件占据完整行的布局范围，内部箭头和数值自动靠右排列；箭头按钮为 44×44 px，右侧留 30 px。minimum、maximum 和 step 控制数值范围与步长，value-changed 事件通知应用保存新值。

## 示例

[下载完整可运行示例](/component-examples/choice-stepper.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-list>
<dt-list-row text="音量" font-size="20" height="76">
<dt-choice-stepper id="volume" height="76" minimum="0" maximum="100" step="5" value="60"/>
</dt-list-row>
</dt-list>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `minimum` | 允许的最小值。 |
| `maximum` | 允许的最大值。 |
| `step` | 每次调整的数值跨度。 |
| `value` | 当前数值。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `width` | 组件宽度，单位为像素。 |

## 处理事件

关注 `value-changed` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![步进选择器浅色](/previews/choice-stepper/light.png)

## 深色外观

![步进选择器深色](/previews/choice-stepper/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
