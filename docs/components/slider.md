# 滑块

[文档首页](/) / [设计与组件](/components/) / 操作与输入

在连续范围内选择一个数值，适合亮度等可直接感知的设置。

<!-- page-outline -->
[[toc]]

## 使用方式

明确 minimum 与 maximum，并在事件处理中校验实际值。需要精确离散数值时，可选择步进选择器。

## 示例

[下载完整可运行示例](/component-examples/slider.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-text text="亮度" font-size="20" height="28"/>
<dt-slider id="brightness" width="752" height="52" minimum="0" maximum="100" value="65"/>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `minimum` | 允许的最小值。 |
| `maximum` | 允许的最大值。 |
| `value` | 当前数值。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `width` | 组件宽度，单位为像素。 |

## 处理事件

关注 `value-changed` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![滑块浅色](/previews/slider/light.png)

## 深色外观

![滑块深色](/previews/slider/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
