# 权限

[文档首页](/) / [系统服务](/services/)

应用先在 `manifest.json` 的 `permissions` 中声明用途，再通过 SDK 检查和申请授权。权限由系统按包名管理，设置中的授权变化会影响后续调用。

<!-- page-outline -->
[[toc]]

## 声明与申请

例如需要联网的应用声明 `"permissions": ["network"]`。JavaScript 使用数字权限编号调用接口，网络的编号为 0。

```js
const state = DeskTile.permission(0);
if (state !== 1) {
  const request = DeskTile.requestPermission(0, "获取最新列车资讯");
  // request > 0：等待 onPermissionResult。
  // request === 0：已经获得授权，可以继续操作。
  // request < 0：申请未被接受，按错误码处理。
}

function onPermissionResult(request, permission, state) {
  if (permission === 0 && state === 1) {
    // 开始此前等待授权的网络操作。
  }
}
```

状态值为 0（未询问）、1（已授权）、2（已拒绝）。保存申请返回的请求 ID，在回调中核对请求与权限，处理用户拒绝后的页面状态。

## 选择权限

| 用途 | 清单标识 | 编号 |
| --- | --- | --- |
| 网络请求 | `network` | 0 |
| 应用私有存储 | `private-storage` | 1 |
| 读取用户文件 | `user-files.read` | 2 |
| 修改用户文件 | `user-files.write` | 3 |
| 蓝牙 | `bluetooth` | 4 |
| 发布通知 | `notifications` | 5 |
| 系统支持的后台执行 | `background` | 6 |
| 保持屏幕常亮 | `display.keep-awake` | 7 |
| 设备基本信息 | `device.basic-info` | 8 |
| 读取／修改日历 | `calendar.read` / `calendar.write` | 14 / 15 |
| 读取／修改待办 | `tasks.read` / `tasks.write` | 16 / 17 |

私有存储为应用隐含能力。编号 9 至 13 对应系统管理能力，适用于系统信任范围内的应用。完整定义见[权限清单](/api-source/permissions.json)。

## 授权变化

每次服务调用都处理实际返回结果。用户撤销授权、应用停用或设备状态变化后，原来成功的操作也可能失败。将错误反馈到相关功能，并释放该功能持有的请求或订阅。

后台运行和通知分开申请：前者允许使用对应后台执行机制，后者允许发布提醒。下载等长任务的完整流程见[后台任务](tasks.md)。
