# 开关

[文档首页](/) / [设计与组件](/components/) / 操作与输入

设置一个立即生效的二选一状态，例如是否启用某项功能。

<!-- page-outline -->
[[toc]]

## 使用方式

checked 来自业务状态。保存或提交成功后更新状态；失败时恢复原值并给出原因。存在依赖关系时同步设置 enabled。

## 示例

[下载完整可运行示例](/component-examples/toggle.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-list>
<dt-list-row id="notify" text="接收提醒" font-size="20" height="76" enabled="true">
<dt-toggle id="enabled" checked="true" enabled="true" width="112" height="56" slot="2"/>
</dt-list-row>
</dt-list>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `checked` | 当前选中或开启状态。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 处理事件

关注 `value-changed` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![开关浅色](/previews/toggle/light.png)

## 深色外观

![开关深色](/previews/toggle/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
