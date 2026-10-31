# 列表说明

[文档首页](/) / [设计与组件](/components/) / 列表与弹窗

在列表附近补充与这一组设置相关的说明。

<!-- page-outline -->
[[toc]]

## 使用方式

说明紧跟所属列表，列表与说明共同放进无额外 gap、无外层 padding 的纵向容器。组件提供左右 24 px 内边距、顶部 16 px 间隔和 20 px 字号。设置 `has-following-content="true"` 保留说明上方的最后一条分隔线。

## 示例

[下载完整可运行示例](/component-examples/list-note.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-list has-following-content="true">
<dt-list-row id="automatic" text="自动同步时间" font-size="20" height="76" enabled="true">
<dt-toggle id="automatic-toggle" checked="true" enabled="true" width="112" height="56" slot="2"/>
</dt-list-row>
</dt-list>
<dt-list-note text="联网后自动校准日期和时间。"/>
```

## 末项分隔线

短列表完整位于视口内、底部还有留白时，显示最后一行的分隔线。列表超出视口需要滚动时，屏幕边缘由内容裁切决定；末项位于屏幕外时，视口底部保持原有裁切。列表后面紧跟说明或其他内容时，末项分隔线保持显示。使用 `has-following-content` 可明确标记由其他容器绘制的后续内容。宽松和紧密列表共用此规则。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `text` | 显示的 UTF-8 文本。 |
| `visible` | 是否参与当前显示。 |
| `foreground-role` | 选择主题中的文字或图标颜色角色。 |

## 浅色外观

![列表说明浅色](/previews/list-note/light.png)

## 深色外观

![列表说明深色](/previews/list-note/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
