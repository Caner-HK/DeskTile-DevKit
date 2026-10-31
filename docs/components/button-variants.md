# 按钮变体

[文档首页](/) / [设计与组件](/components/) / 操作与输入

按操作语义使用文字、图标、描边和悬浮按钮。

<!-- page-outline -->
[[toc]]

## 使用方式

除保存、取消和危险操作外，按钮还提供 secondary（1）、text（4）、outlined（7）及悬浮变体。示例第一行分别为次要、描边和文字按钮；第二行展示纯图标按钮、切角悬浮按钮及圆形按钮。纯图标按钮设置 accessibility-label；页面 Appbar 的图标操作使用 72 px 点击区域和 32 px 图标。

## 示例

[下载完整可运行示例](/component-examples/button-variants.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-row height="52" gap="16" alignment="1">
<dt-button text="打开" icon="73" width="152" height="52" font-size="20" button-style="1"/>
<dt-button text="查看" icon="73" width="152" height="52" font-size="20" button-style="7"/>
<dt-button text="更多" icon="10" width="152" height="52" font-size="20" button-style="4"/>
</dt-row>
<dt-row height="80" gap="24" alignment="1">
<dt-button accessibility-label="刷新" width="52" height="52" button-style="4" icon="14"/>
<dt-button accessibility-label="新建" width="80" height="80" button-style="3" icon="35"/>
<dt-button accessibility-label="新建便签" width="80" height="80" button-style="8" icon="35"/>
</dt-row>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `button-style` | 按钮变体，例如 primary、cancel 或 destructive 的枚举值。 |
| `text` | 显示的 UTF-8 文本。 |
| `icon` | SDK 图标目录中的编号。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![按钮变体浅色](/previews/button-variants/light.png)

## 深色外观

![按钮变体深色](/previews/button-variants/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
