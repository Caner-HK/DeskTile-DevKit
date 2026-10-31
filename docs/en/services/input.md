# System input

[Documentation home](/en/) / [System services](/en/services/)

The field displays content; the system keyboard edits it. Commit a successful completion and retain the original text on cancellation.

## Open the keyboard

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

Retain the request ID while waiting so repeated taps open one editing session. A successful payload is UTF-8 text; cancellation returns `-5`. Check storage results separately when saving the business data.

## Embedded editing

Use `presentation: "embedded_field"` and `editor_target` for a field. Multi-line text uses `embedded_document` or `embedded_plain_text` with the editor handle. The component manages cursor, scroll and focus. See [Text field](../components/text-field.md), [Document editor](../components/document-editor.md) and the date/duration pickers for numeric input.
