# 纵向容器

[文档首页](/) / [设计与组件](/components/) / 布局

将子组件从上到下排列，适合页面正文、说明与表单。

<!-- page-outline -->
[[toc]]

## 使用方式

纵向容器按内容顺序排列。示例标题 32 px，正文 20 px，段落间距 12 px。alignment 控制水平对齐；固定宽度图片、选择器使用起点或居中，完整列表使用填满宽度的布局。

## 示例

[下载完整可运行示例](/component-examples/column.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-column gap="12" alignment="0">
<dt-text text="周末计划" font-size="32" height="48"/>
<dt-text text="周六上午去图书馆。" font-size="20" height="28"/>
<dt-text text="周日下午整理照片。" font-size="20" height="28"/>
</dt-column>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `gap` | 同一容器内子组件之间的间距。 |
| `alignment` | 子组件在交叉轴上的对齐方式。 |
| `justification` | 子组件在排列方向上的分布方式。 |
| `padding` | 内容与组件边缘的内边距。 |
| `flex-grow` | 分配剩余空间时的比例。 |

## 浅色外观

![纵向容器浅色](/previews/column/light.png)

## 深色外观

![纵向容器深色](/previews/column/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
