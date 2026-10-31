# 时长选择器

[文档首页](/) / [设计与组件](/components/) / 操作与输入

编辑以时、分、秒表示的持续时间，适合计时和播放间隔。

<!-- page-outline -->
[[toc]]

## 使用方式

value、minimum 和 maximum 使用秒。时长选择器的角标使用时间组的三个列字段；收到数值变化事件后保存新的秒数。

## 示例

[下载完整可运行示例](/component-examples/duration-picker.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-duration-picker id="duration" width="752" minimum="0" maximum="3600" value="60"/>
```

### 示例逻辑

```js
function enter(){const data=new ArrayBuffer(80),view=new DataView(data),bytes=new Uint8Array(data);view.setUint32(0,80,true);view.setUint32(4,1,true);['时','分','秒'].forEach(function(unit,i){bytes.set(DeskTile.utf8Encode(unit),44+i*12);});DeskTile.setBytes(DeskTile.byId('duration'),62,data);}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `value` | 当前数值。 |
| `minimum` | 允许的最小值。 |
| `maximum` | 允许的最大值。 |
| `date-time-corner-text` | 各列右上角的可选文字配置。 |

## 处理事件

关注 `value-changed` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![时长选择器浅色](/previews/duration-picker/light.png)

## 深色外观

![时长选择器深色](/previews/duration-picker/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
