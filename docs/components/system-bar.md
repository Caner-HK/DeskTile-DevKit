# 应用栏

[文档首页](/) / [设计与组件](/components/) / 布局

显示当前页面标题、返回入口和页面操作。它位于系统状态栏下方。

<!-- page-outline -->
[[toc]]

## 使用方式

常规应用优先通过 Scaffold 创建应用栏。直接组合时使用 72 px 高度，并把返回操作、标题和尾部操作放进同一横向容器。

## 示例

[下载完整可运行示例](/component-examples/system-bar.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-text text="旅行计划" font-size="32" height="48"/>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `height` | 组件高度，单位为像素。 |
| `text` | 显示的 UTF-8 文本。 |
| `background` | 背景颜色，按 0xRRGGBB 表示。 |
| `foreground` | 直接指定前景颜色。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![应用栏浅色](/previews/system-bar/light.png)

## 深色外观

![应用栏深色](/previews/system-bar/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
