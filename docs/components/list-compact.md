# 紧密列表

[文档首页](/) / [设计与组件](/components/) / 列表与弹窗

使用 54 px 行高的设置列表，适合 PIDS 设定等密集配置页面。

<!-- page-outline -->
[[toc]]

## 使用方式

每行明确使用 54 px 高度、20 px 文字，列表铺满内容区宽度。宽松密度为 76 px。

## 示例

[下载完整可运行示例](/component-examples/list-compact.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-list>
<dt-list-row text="显示语言" height="54" font-size="20"/>
<dt-list-row text="中文字体" height="54" font-size="20"/>
<dt-list-row text="显示车厢信息" height="54" font-size="20"/>
</dt-list>
```

## 末项分隔线

短列表完整位于视口内、底部还有留白时，显示最后一行的分隔线。列表超出视口需要滚动时，屏幕边缘由内容裁切决定；末项位于屏幕外时，视口底部保持原有裁切。列表后面紧跟说明或其他内容时，末项分隔线保持显示。使用 `has-following-content` 可明确标记由其他容器绘制的后续内容。宽松和紧密列表共用此规则。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `height` | 组件高度，单位为像素。 |
| `text` | 显示的 UTF-8 文本。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![紧密列表浅色](/previews/list-compact/light.png)

## 深色外观

![紧密列表深色](/previews/list-compact/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
