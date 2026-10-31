# 系统输入法

[文档首页](/) / [系统服务](/services/)

应用通过系统键盘编辑文本。输入框负责显示内容，键盘完成回调负责提交新的文本。原有内容应在取消时保留。

## 打开键盘

```js
let keyboardRequest = 0;
let value = "";
function edit() {
  if (keyboardRequest) return;
  const result = DeskTile.keyboard(JSON.stringify({
    title: "编辑名称", initial: value,
    maximum_length: 128, input_type: "text"
  }));
  if (result > 0) keyboardRequest = result;
}
function onRequestComplete(request, result, payload) {
  if (request !== keyboardRequest) return;
  keyboardRequest = 0;
  if (result === 0) value = DeskTile.utf8Decode(payload);
  // 更新对应输入框；取消时 value 保持原值。
}
```

等待键盘结果期间保留请求 ID，使重复点击只对应一次编辑。成功结果为 UTF-8 文本，取消结果为 `-5`。保存业务数据时还需检查存储写入结果。

## 页面内编辑

`presentation: "embedded_field"` 配合 `editor_target` 指向输入框。多行文本可以使用 `embedded_document` 或 `embedded_plain_text`，并传入文本编辑器句柄。输入过程中的光标、滚动和焦点由对应组件管理。

组件用法见[输入框](../components/text-field.md)与[文本编辑器](../components/document-editor.md)。日期、时间和持续时长使用对应选择器，按其数值事件处理输入。
