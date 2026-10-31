# 文本编辑器

[文档首页](/) / [设计与组件](/components/) / 操作与输入

在页面内显示和编辑多行文本，保留光标与滚动位置。

<!-- page-outline -->
[[toc]]

## 使用方式

编辑器沿用便签的正文布局：四边各 24 px 内边距，放入占满内容区的滚动容器。示例开启 document-headings，使首段作为标题显示。编辑内容、光标和输入会话由应用与系统键盘共同管理。

## 示例

[下载完整可运行示例](/component-examples/document-editor.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-scroll flex-grow="1">
<dt-document-editor id="editor" text="旅行计划&#10;&#10;周六上午出发，带上相机和水。" padding="24" height="376" document-headings="true"/>
</dt-scroll>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `text` | 显示的 UTF-8 文本。 |
| `height` | 组件高度，单位为像素。 |
| `document-headings` | 是否按标题规则显示正文。 |
| `document-cursor` | 文本光标位置。 |
| `document-scroll` | 编辑器内部滚动位置。 |
| `document-focused` | 编辑器的焦点状态。 |

## 处理事件

关注 `text-changed`、`focus`、`blur` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![文本编辑器浅色](/previews/document-editor/light.png)

## 深色外观

![文本编辑器深色](/previews/document-editor/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
