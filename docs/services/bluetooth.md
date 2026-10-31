# 蓝牙 BLE

[文档首页](/) / [系统服务](/services/)

SDK 提供 BLE 扫描、连接、配对、GATT 发现、读取、写入和特征通知。JavaScript 使用 `DeskTile.bluetooth`，Native 使用 `<desktile/bluetooth.hpp>`。当前 ESP32-S3 后端提供 BLE central 与 observer 能力。

<!-- page-outline -->
[[toc]]

## 开始之前

在清单声明 `bluetooth`，通过权限接口取得用户授权。蓝牙电源由系统设置控制。先查询 `status` 的 `enabled`、`ready`、`uuidGatt` 和连接列表，再执行相应操作。

每次方法调用返回请求 ID 或立即错误，通过请求完成回调读取 JSON 结果。连接、读取和订阅的实际无线结果继续通过 `nextEvent` 接收。

## 扫描与接收事件

```js
const scanRequest = DeskTile.bluetooth.scan({durationMs: 10000, passive: true});
let eventRequest = DeskTile.bluetooth.nextEvent(30000);

function onRequestComplete(request, result, payload) {
  if (request !== eventRequest) return;
  if (result < 0) { eventRequest = 0; return; }
  const event = DeskTile.platformResult(payload);
  if (event.event === 'advertisement') {
    // 用 address 和 addressType 区分设备，name 可能为空。
  }
  eventRequest = DeskTile.bluetooth.nextEvent(30000);
}

function leave() {
  if (eventRequest > 0) DeskTile.cancelRequest(eventRequest);
  eventRequest = 0;
  DeskTile.bluetooth.stopScan();
}
```

`nextEvent` 超时返回 `event: null`。每次完成后重新等待；页面离开时取消所属请求。长期被动接收广播使用 `listen`，结束时调用 `stopScan`。

## 连接与系统连接

`connect(address, addressType)` 创建应用拥有的连接，等待 `connected` 事件后操作 GATT。地址类型为 0（public）或 1（random），使用扫描结果提供的值。

系统设置建立的连接在 `status.connections` 中带有 `system: true`。`attach(connection)` 取得该连接的读取、发现和订阅访问权；`detach(connection)` 释放访问权并清理订阅，系统继续持有连接。写入、断开和配对属于连接所有者操作。

应用自建连接随应用上下文关闭而释放。权限撤回会同步到活动上下文，应用应据此结束相应页面状态。

## 按 UUID 操作

UUID 可使用 16 位、32 位或完整 128 位字符串。

| 方法 | 参数 | 用途 |
| --- | --- | --- |
| `discoverServices` | connection、可选 serviceUuid | 查找服务 |
| `discoverCharacteristics` | connection、serviceUuid、可选 characteristicUuid | 查找服务下的特征 |
| `discoverDescriptors` | connection、serviceUuid、characteristicUuid、可选 descriptorUuid | 查找特征描述符 |
| `readUuid` | connection、serviceUuid、characteristicUuid | 发现值句柄并读取 |
| `subscribe` | connection、serviceUuid、characteristicUuid | 配置 CCCD 并接收特征更新 |
| `unsubscribe` | connection、serviceUuid、characteristicUuid | 关闭该特征的更新 |

```js
// connection 来自当前应用可访问的已连接设备。
const request = DeskTile.bluetooth.readUuid(connection, '180f', '2a19');
```

发现过程逐项返回事件，最后一条带 `complete: true`。空结果也有完成事件。订阅完成事件返回特征值句柄，后续 `notification` 事件使用该句柄标识更新来源。每条连接同时执行一个 GATT 过程，忙时等待当前操作完成再提交。

已知句柄时可用 `read` 或 `write`。写入使用偶数长度十六进制字符串，最多 244 字节。设备协议决定具体 UUID、字节顺序、数据单位和安全要求。

## 配对

连接、加密、认证和保存绑定是不同状态。应用根据设备协议决定何时调用 `pair`。`pairing` 事件提供 `pairingAction`、`prompt` 和 `passkey`。

使用 `pairingReply(connection, action, prompt, passkey, accept)` 回答当前提示。输入和展示六位代码时保留前导零，数字确认遵循用户选择。过期提示令牌和其他应用的连接会被拒绝。通过 `securityChanged` 的实际结果和标志判断最终状态。

## 容量与错误处理

当前后端最多 3 条连接、1 个扫描或广播监听所有者、32 条事件缓存和每个上下文 1 个事件等待。应用持续消费事件，并检查 `droppedEvents` 以识别溢出。

即时负数返回值、请求完成结果和无线事件结果分别代表不同阶段。界面应根据最终连接或读写事件显示成功状态。设备关闭、断开、权限撤销和应用退出都应清理请求与页面状态。

完整签名见 [JavaScript API](../api/javascript.md)，Native 包装器见 [Native API](../api/native.md)。
