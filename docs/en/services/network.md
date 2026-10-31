# Network requests

[Documentation home](/en/) / [System services](/en/services/)

For short foreground requests, declare and obtain `network` permission, then use `DeskTile.network`. Downloads that must continue after exit use [background tasks](tasks.md).

## Submit

```js
let pending = 0;
function load() {
  const result = DeskTile.network(JSON.stringify({
    url: "https://example.com/data.json", method: "GET"
  }));
  if (result > 0) pending = result;
  else {
    // 处理请求立即被拒绝的错误码。
  }
}
```

Save the positive request ID and show pending state. Cancel the request with `cancelRequest` when its page leaves or the user cancels, and clear the page's pending state.

## Decode the response

The completion `result` is the SDK result. HTTP status is in the first eight bytes of `dt_network_response_header_v1`: a little-endian signed 32-bit status followed by an unsigned 32-bit body length. The body follows the header.

```js
function onRequestComplete(request, result, payload) {
  if (request !== pending) return;
  pending = 0;
  if (result !== 0 || payload.byteLength < 8) return;
  const header = new DataView(payload);
  const status = header.getInt32(0, true);
  const length = header.getUint32(4, true);
  if (length > payload.byteLength - 8) return;
  const body = DeskTile.utf8Decode(payload.slice(8, 8 + length));
  // 根据 status 检查 HTTP 结果，再解析 body。
}
```

Handle offline state, non-success HTTP status, empty content, malformed data and cancellation separately. Validate business fields and payload size before displaying the result.
