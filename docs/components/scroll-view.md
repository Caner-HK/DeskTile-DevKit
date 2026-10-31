# 滚动容器

[文档首页](/) / [设计与组件](/components/) / 布局

在限定视口中显示超出可用空间的内容。HTML 标签使用 dt-scroll。

<!-- page-outline -->
[[toc]]

## 使用方式

让滚动容器占用 Appbar 下方剩余区域，再把列表放进去。列表内边距由行处理。示例含八行，实际滚动视口为 800×376 px，拖动可看到后面的城市。滚动位置保存在应用状态中，返回页面时通过 `scroll-position` 恢复。

## 示例

[下载完整可运行示例](/component-examples/scroll-view.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-scroll flex-grow="1">
<dt-list>
<dt-list-row text="北京" height="76" font-size="20"/>
<dt-list-row text="上海" height="76" font-size="20"/>
<dt-list-row text="广州" height="76" font-size="20"/>
<dt-list-row text="深圳" height="76" font-size="20"/>
<dt-list-row text="杭州" height="76" font-size="20"/>
<dt-list-row text="南京" height="76" font-size="20"/>
<dt-list-row text="苏州" height="76" font-size="20"/>
<dt-list-row text="成都" height="76" font-size="20"/>
</dt-list>
</dt-scroll>
```

## 末项分隔线

短列表完整位于视口内、底部还有留白时，显示最后一行的分隔线。列表超出视口需要滚动时，屏幕边缘由内容裁切决定；末项位于屏幕外时，视口底部保持原有裁切。列表后面紧跟说明或其他内容时，末项分隔线保持显示。使用 `has-following-content` 可明确标记由其他容器绘制的后续内容。宽松和紧密列表共用此规则。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `height` | 组件高度，单位为像素。 |
| `flex-grow` | 分配剩余空间时的比例。 |
| `scroll-axis` | 滚动方向：vertical 或 horizontal。 |
| `scroll-position` | 实际滚动偏移，写入值会限制在可滚动范围内。 |

## 处理事件

关注 `scroll` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![滚动容器浅色](/previews/scroll-view/light.png)

## 深色外观

![滚动容器深色](/previews/scroll-view/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
