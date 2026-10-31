# 网格

[文档首页](/) / [设计与组件](/components/) / 布局

按列排列重复的操作或内容，让每一项保持一致的布局规则。

<!-- page-outline -->
[[toc]]

## 使用方式

先设置列数，再安排内容尺寸与间距。长文字应在目标列宽下检查，确保每个项目都可独立点击。

## 示例

[下载完整可运行示例](/component-examples/grid.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-grid grid-columns="3" width="752" height="116" gap="12">
<dt-button text="周一" font-size="20" button-style="9"/>
<dt-button text="周二" font-size="20" button-style="9"/>
<dt-button text="周三" font-size="20" button-style="9"/>
<dt-button text="周四" font-size="20" button-style="9"/>
<dt-button text="周五" font-size="20" button-style="9"/>
<dt-button text="周六" font-size="20" button-style="9"/>
</dt-grid>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `grid-columns` | 网格列数。 |
| `gap` | 同一容器内子组件之间的间距。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `padding` | 内容与组件边缘的内边距。 |

## 浅色外观

![网格浅色](/previews/grid/light.png)

## 深色外观

![网格深色](/previews/grid/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
