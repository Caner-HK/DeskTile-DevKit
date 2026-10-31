# 日期时间选择器

[文档首页](/) / [设计与组件](/components/) / 操作与输入

以系统数字选择组件编辑日期、时间或两者。

<!-- page-outline -->
[[toc]]

## 使用方式

通过 createDateTimePicker 或 configureDateTimePicker 设置日期范围、时间范围与分钟步长，接收 onDateTimeChanged 回调后保存选择。

## 示例

[下载完整可运行示例](/component-examples/date-time-picker.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-date-time-picker id="date" width="752"/>
```

### 示例逻辑

```js
function enter(){DeskTile.configureDateTimePicker(DeskTile.byId('date'),{mode:'both',symbols:'arrows',date:'2026-10-29',time:'12:34',dateLabel:'日期',timeLabel:'时间',units:['年','月','日','时','分']});}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `date-time-config` | 日期时间选择器配置结构，由 SDK 配置方法写入。 |
| `date-time-corner-text` | 各列右上角的可选文字配置。 |

## 处理事件

关注 `date-time-changed` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![日期时间选择器浅色](/previews/date-time-picker/light.png)

## 深色外观

![日期时间选择器深色](/previews/date-time-picker/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
