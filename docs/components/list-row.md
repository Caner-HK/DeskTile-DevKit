# 列表项

[文档首页](/) / [设计与组件](/components/) / 列表与弹窗

在一行中安排主文案、图标、摘要和尾部操作。

<!-- page-outline -->
[[toc]]

## 使用方式

用 `ui.listRow` 创建 76 px 宽松行，或指定 `density: "compact"` 创建 54 px 紧密行。主文案为 20 px，摘要默认位于右侧 trailing 插槽。将一组行放进 `dt-list`，由列表处理末项分隔线。开关的点击区域为 112×56 px；紧密行会把高度限制为 54 px。

## 示例

[下载完整可运行示例](/component-examples/list-row.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-list>
<dt-list-row id="storage" text="存储空间" font-size="20" height="76" enabled="true">
<dt-text text="12 KB" font-size="20" foreground-role="3" slot="2"/>
</dt-list-row>
<dt-list-row id="notify" text="接收提醒" font-size="20" height="76" enabled="true">
<dt-toggle id="enabled" checked="true" enabled="true" width="112" height="56" slot="2"/>
</dt-list-row>
</dt-list>
```

## 末项分隔线

短列表完整位于视口内、底部还有留白时，显示最后一行的分隔线。列表超出视口需要滚动时，屏幕边缘由内容裁切决定；末项位于屏幕外时，视口底部保持原有裁切。列表后面紧跟说明或其他内容时，末项分隔线保持显示。使用 `has-following-content` 可明确标记由其他容器绘制的后续内容。宽松和紧密列表共用此规则。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `text` | 显示的 UTF-8 文本。 |
| `height` | 组件高度，单位为像素。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `checked` | 当前选中或开启状态。 |

## 处理事件

关注 `activate` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![列表项浅色](/previews/list-row/light.png)

## 深色外观

![列表项深色](/previews/list-row/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
