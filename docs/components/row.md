# 横向容器

[文档首页](/) / [设计与组件](/components/) / 布局

将子组件从左到右排列，适合按钮组和一行内的标签、数值。

<!-- page-outline -->
[[toc]]

## 使用方式

gap 控制子项间距，flex-grow 分配剩余宽度。alignment 控制交叉轴：0 起点、1 居中、2 末端、3 拉伸。图标和固定高度按钮使用居中对齐，以保持各自规格。

## 示例

[下载完整可运行示例](/component-examples/row.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-row height="52" gap="16" alignment="1">
<dt-button text="保存" icon="49" width="152" height="52" font-size="20" button-style="0"/>
<dt-button text="取消" icon="48" width="152" height="52" font-size="20" button-style="9"/>
</dt-row>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `gap` | 同一容器内子组件之间的间距。 |
| `alignment` | 子组件在交叉轴上的对齐方式。 |
| `justification` | 子组件在排列方向上的分布方式。 |
| `padding` | 内容与组件边缘的内边距。 |
| `height` | 组件高度，单位为像素。 |

## 浅色外观

![横向容器浅色](/previews/row/light.png)

## 深色外观

![横向容器深色](/previews/row/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
