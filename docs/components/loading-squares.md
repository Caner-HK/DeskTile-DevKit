# 移动方块

[文档首页](/) / [设计与组件](/components/) / 显示内容

用一组依次移动的方块表示正在等待结果。

<!-- page-outline -->
[[toc]]

## 使用方式

适合目录读取、页面加载等没有完成百分比的操作。使用 dt-progress 的 squares 样式，由宿主驱动动画。开始异步操作时显示，完成、失败或取消后移除或隐藏。设备加载页面的指示区域为 240×30 px，文字位于其下方。

## 示例

[下载完整可运行示例](/component-examples/loading-squares.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-progress id="loading" width="240" height="30" progress-style="1"/>
<dt-text text="正在读取" font-size="20" width="704" height="40" alignment="1" foreground-role="3"/>
```

### 动态效果

![移动方块动画](/previews/loading-squares/animation.gif)

动画来自实际组件渲染帧。HTML 的 `progress-style="1"` 对应 JavaScript 构建器 `ui.progress({id: "loading", style: "squares"})`。Native 使用 `DT_COMPONENT_PROGRESS`，并将 `DT_PROPERTY_PROGRESS_STYLE` 设为 1。

开始任务前显示组件；任务通过异步接口执行，宿主负责推进加载动画。收到完成或失败结果后，将 `visible` 设为 `false` 或销毁组件，再显示内容或错误提示。组件只表示等待，应用负责实际任务生命周期。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `progress-style` | 确定进度、移动方块或脉动竖条。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `animation-duration` | 进度动画周期，单位为毫秒。 |
| `visible` | 是否参与当前显示。 |

## 浅色外观

![移动方块浅色](/previews/loading-squares/light.png)

## 深色外观

![移动方块深色](/previews/loading-squares/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
