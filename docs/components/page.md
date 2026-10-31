# 页面

[文档首页](/) / [设计与组件](/components/) / 布局

作为一个界面的根节点，承载应用栏和正文。

<!-- page-outline -->
[[toc]]

## 使用方式

一个显示中的界面使用一个根页面。子页面切换时重新建立或更新该页面的内容，并保存需要保留的滚动位置。

## 示例

[下载完整可运行示例](/component-examples/page.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-text text="我的一天" font-size="32" height="48"/>
<dt-text text="整理今天的计划，记录值得记住的事。" font-size="20" text-wrap="true"/>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `background` | 背景颜色，按 0xRRGGBB 表示。 |
| `status-bar-background` | 指定该页面相邻状态栏的背景颜色。 |
| `status-bar-foreground` | 指定状态栏文字与图标的颜色。 |

## 浅色外观

![页面浅色](/previews/page/light.png)

## 深色外观

![页面深色](/previews/page/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
