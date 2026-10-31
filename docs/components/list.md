# 列表

[文档首页](/) / [设计与组件](/components/) / 列表与弹窗

组织同一组可浏览或操作的列表项，并管理分隔线的连续关系。

<!-- page-outline -->
[[toc]]

## 使用方式

列表行使用两种密度：宽松 76 px，紧密 54 px。设置主页采用宽松布局，PIDS 设置采用紧密布局。密度由页面用途决定。列表本身贴齐内容区左右边缘，行内文字由组件提供 24 px 内边距。`checked` 表示持续选中的状态，仅用于选择列表。普通导航列表使用默认状态。

## 示例

[下载完整可运行示例](/component-examples/list.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-list>
<dt-list-row text="系统语言" height="76" font-size="20"/>
<dt-list-row text="日期和时间" height="76" font-size="20"/>
<dt-list-row text="开发者选项" height="76" font-size="20"/>
</dt-list>
```

## 末项分隔线

短列表完整位于视口内、底部还有留白时，显示最后一行的分隔线。列表超出视口需要滚动时，屏幕边缘由内容裁切决定；末项位于屏幕外时，视口底部保持原有裁切。列表后面紧跟说明或其他内容时，末项分隔线保持显示。使用 `has-following-content` 可明确标记由其他容器绘制的后续内容。宽松和紧密列表共用此规则。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `has-following-content` | 标记列表之后还有内容，使最后一条分隔线保持显示。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 浅色外观

![列表浅色](/previews/list/light.png)

## 深色外观

![列表深色](/previews/list/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
