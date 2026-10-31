# 画布

[文档首页](/) / [设计与组件](/components/) / 显示内容

在组件范围内提交自定义绘制命令。HTML 标签使用 dt-canvas。

<!-- page-outline -->
[[toc]]

## 使用方式

Canvas 示例在 enter 中提交三条填充矩形命令，坐标相对于画布左上角。使用公开的二进制命令结构，通过属性 canvas-commands 提交。预览运行同一段 JavaScript 并显示真实绘制结果；更新数据时重新提交相应命令缓冲区。

## 示例

[下载完整可运行示例](/component-examples/canvas-view.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-canvas id="chart" width="600" height="240"/>
```

### 示例逻辑

```js
function enter(){
  const bytes=new ArrayBuffer(60), view=new DataView(bytes);
  const bars=[[40,100,96,100,0xFF9900],[180,40,96,160,0x168471],[320,70,96,130,0x3765FF]];
  bars.forEach(function(b,i){const p=i*20;view.setUint8(p,1);view.setUint16(p+2,20,true);for(let k=0;k<4;k++)view.setInt16(p+4+k*2,b[k],true);view.setUint32(p+12,b[4],true);});
  DeskTile.setBytes(DeskTile.byId('chart'),29,bytes);
}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `canvas-commands` | 按 SDK 结构编码的绘制命令缓冲区。 |
| `pointer-input` | 是否接收指针事件。 |

## 处理事件

关注 `pointer-down`、`pointer-move`、`pointer-up`、`pointer-cancel` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![画布浅色](/previews/canvas-view/light.png)

## 深色外观

![画布深色](/previews/canvas-view/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
