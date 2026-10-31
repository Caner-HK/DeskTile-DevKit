# 网络请求

[文档首页](/) / [系统服务](/services/)

前台短请求使用 `DeskTile.network`。先声明并取得 `network` 权限，再提交请求。需要退出应用后继续完成的下载使用[后台任务](tasks.md)。

## 提交请求

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

请求 ID 仅用于关联这一次操作。收到完成事件之前显示等待状态；用户离开页面或取消操作时调用 `cancelRequest`，并清除对应页面的等待状态。

## 读取响应

完成事件的 `result` 是 SDK 结果，HTTP 状态码位于响应头。响应缓冲区前 8 字节是 `dt_network_response_header_v1`：前 4 字节为状态码，后 4 字节为正文长度，均为小端序。正文紧随其后。

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

为无网络、非成功 HTTP 状态、空正文、格式错误和取消分别提供处理路径。服务返回数据用于显示前，还需检查业务字段和允许的数据量。
