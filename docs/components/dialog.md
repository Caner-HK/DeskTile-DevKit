# 对话框

[文档首页](/) / [设计与组件](/components/) / 列表与弹窗

在当前操作中显示确认、说明或需要立即处理的内容。

<!-- page-outline -->
[[toc]]

## 使用方式

确认弹窗沿用便签和系统确认布局：宽 592 px，外边距由居中呈现处理，内部 padding 24 px；标题 32 px、高 48 px，标题后间隔 12 px，内容组 gap 24 px；底部按钮高 52 px、间距 12 px。取消在左，确认在右，删除使用危险色。优先调用 `ui.confirmation`，正文较长时仅正文区域滚动。

## 示例

[下载完整可运行示例](/component-examples/dialog.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-dialog id="confirm" width="592" max-height="400" dialog-presentation="1" dialog-title-divider="true" padding="24" surface-style="2" visible="true">
<dt-column gap="24" flex-grow="1">
<dt-text text="删除便签？" font-size="32" height="48" margin="0,0,12,0"/>
<dt-scroll flex-grow="1">
<dt-text text="删除后将移除这条便签。" font-size="20" foreground-role="4" text-wrap="true"/>
</dt-scroll>
<dt-row height="52" gap="12">
<dt-button id="cancel" text="取消" width="0" height="52" flex-grow="1" font-size="20" button-style="9"/>
<dt-button id="delete" text="删除" width="0" height="52" flex-grow="1" font-size="20" button-style="2" icon="41"/>
</dt-row>
</dt-column>
</dt-dialog>
```

### 示例逻辑

```js
function onEvent(event,target){if(event===0&&['open','rename','delete','cancel'].some(function(id){return target===DeskTile.byId(id);}))DeskTile.setBoolean(DeskTile.byId('confirm'),4,false);}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `dialog-presentation` | embedded 为内嵌呈现，centered 为居中呈现。 |
| `dialog-destructive` | 标记破坏性确认的颜色语义。 |
| `dialog-title-divider` | 是否显示标题分隔线。 |
| `width` | 组件宽度，单位为像素。 |
| `max-height` | 组件允许使用的最大高度。 |
| `visible` | 是否参与当前显示。 |

## 浅色外观

![对话框浅色](/previews/dialog/light.png)

## 深色外观

![对话框深色](/previews/dialog/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
