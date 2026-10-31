# 按钮

[文档首页](/) / [设计与组件](/components/) / 操作与输入

触发保存、取消、打开或删除等明确操作。

<!-- page-outline -->
[[toc]]

## 使用方式

常规按钮高 52 px，文案使用 20 px。保存使用 primary（0），取消使用 cancel（9），删除使用 destructive（2）。收到 activate 后执行操作，异步操作等待期间更新 enabled。Appbar 使用自己的文本按钮变体和 72 px 操作区域。

## 示例

[下载完整可运行示例](/component-examples/button.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-row height="52" gap="16" alignment="1">
<dt-button text="保存" icon="49" width="152" height="52" font-size="20" button-style="0"/>
<dt-button text="取消" icon="48" width="152" height="52" font-size="20" button-style="9"/>
<dt-button text="删除" icon="41" width="152" height="52" font-size="20" button-style="2"/>
</dt-row>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `text` | 显示的 UTF-8 文本。 |
| `icon` | SDK 图标目录中的编号。 |
| `button-style` | 按钮变体，例如 primary、cancel 或 destructive 的枚举值。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![按钮浅色](/previews/button/light.png)

## 深色外观

![按钮深色](/previews/button/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
