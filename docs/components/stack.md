# 层叠容器

[文档首页](/) / [设计与组件](/components/) / 布局

让子组件共享同一布局区域，适合叠放背景、图片与文字。

<!-- page-outline -->
[[toc]]

## 使用方式

明确容器尺寸与子组件边界，检查叠放顺序。需要普通横排或纵排时选择 Row 或 Column。

## 示例

[下载完整可运行示例](/component-examples/stack.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-stack width="480" height="288">
<dt-image resource="picture.dti" width="480" height="288"/>
<dt-text text="色彩" width="120" height="48" font-size="32" margin="24,0,0,24"/>
</dt-stack>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `padding` | 内容与组件边缘的内边距。 |
| `background` | 背景颜色，按 0xRRGGBB 表示。 |

## 浅色外观

![层叠容器浅色](/previews/stack/light.png)

## 深色外观

![层叠容器深色](/previews/stack/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
