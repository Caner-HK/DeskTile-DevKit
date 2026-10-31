# 输入框

[文档首页](/) / [设计与组件](/components/) / 操作与输入

显示当前输入内容，并作为打开系统输入法的入口。

<!-- page-outline -->
[[toc]]

## 使用方式

空值提示放在 placeholder 属性，输入内容放在 text 属性。系统根据当前主题选择提示文字颜色。常规输入框高 52 px、文字 20 px，左右各 16 px 内边距。内部 icon 参与文本区域计算。示例采用错误代码 App 的指针处理方式：启用 pointer-input，在 onPointer 中辨别轻触、拖动和取消，松手后打开系统键盘，成功返回后更新内容。

## 示例

[下载完整可运行示例](/component-examples/text-field.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-text-field id="name" placeholder="输入名称" width="752" height="52" font-size="20" padding="0,16,0,16" pointer-input="true"/>
```

### 示例逻辑

```js
let request=0, value='', down=null;
function onPointer(event,pointer){
  if(pointer.target!==DeskTile.byId('name')||request)return;
  if(event===12){down={x:pointer.x,y:pointer.y};return;}
  if(event===15){down=null;return;}
  if(!down)return;
  if(Math.abs(pointer.x-down.x)>=8||Math.abs(pointer.y-down.y)>=8){down=null;return;}
  if(event===14){down=null;if(pointer.localX>=0&&pointer.localX<752&&pointer.localY>=0&&pointer.localY<52){const id=DeskTile.keyboard(JSON.stringify({title:'名称',initial:value,maximum_length:512}));if(id>0)request=id;}}
}
function onRequestComplete(id,result,data){if(id!==request)return;request=0;if(result===0){value=DeskTile.utf8Decode(data);DeskTile.setText(DeskTile.byId('name'),0,value);}}
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `text` | 显示的 UTF-8 文本。 |
| `placeholder` | 内容为空时的提示文字。 |
| `icon` | SDK 图标目录中的编号。 |
| `enabled` | 是否接受用户操作；禁用时使用对应的视觉状态。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 处理事件

关注 `activate`、`focus`、`blur` 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。

## 浅色外观

![输入框浅色](/previews/text-field/light.png)

## 深色外观

![输入框深色](/previews/text-field/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
