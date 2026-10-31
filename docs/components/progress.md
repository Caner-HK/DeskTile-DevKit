# 进度

[文档首页](/) / [设计与组件](/components/) / 显示内容

显示已知完成比例。

<!-- page-outline -->
[[toc]]

## 使用方式

确定进度的百分比放在进度条右侧尾部，与进度条垂直居中。沿用文件 App 下载进度的规格：条高 12 px，条与数字间隔 16 px，百分比使用 20 px 正文字号并预留 80×32 px 区域，显示 100% 时布局保持稳定。应用用同一份任务进度同时更新 value 和百分比文案。总量未知时采用活动指示器。

## 示例

[下载完整可运行示例](/component-examples/progress.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-text text="正在下载" font-size="20" height="28"/>
<dt-row width="752" height="32" gap="16" alignment="1">
<dt-progress id="download-progress" flex-grow="1" height="12" minimum="0" maximum="100" value="58"/>
<dt-text id="download-percent" text="58%" font-size="20" width="80" height="32"/>
</dt-row>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `minimum` | 允许的最小值。 |
| `maximum` | 允许的最大值。 |
| `value` | 当前数值。 |
| `progress-style` | 确定进度、移动方块或脉动竖条。 |
| `animation-duration` | 进度动画周期，单位为毫秒。 |

## 浅色外观

![进度浅色](/previews/progress/light.png)

## 深色外观

![进度深色](/previews/progress/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
