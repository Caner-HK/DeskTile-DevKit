# 通知服务

[文档首页](/) / [系统服务](/services/)

通知由系统管理应用身份、队列、横幅和点击回调。JavaScript 与 Native 使用同一套权限与投递规则。先检查目标设备的通知能力，再在相关操作中申请 `notifications` 权限。

<!-- page-outline -->
[[toc]]

## 权限与后台执行

在清单的 `permissions` 中声明 `notifications`。前台发布需要通知授权；后台工作还需要 `background` 和工作本身需要的权限。持续执行应使用系统支持的任务服务，通知权限的作用是授权向用户显示消息。

## 通知图标

在 `icons.notification` 声明专用图标：

```json
{
  "icons": {
    "application": "assets/application.dti",
    "tile": "assets/tile.dti",
    "notification": {"path": "assets/notification.dti", "mode": "system"}
  }
}
```

| 模式 | 显示方式 | DTI 编码 |
| --- | --- | --- |
| `system` | 图形使用系统横幅前景色 | alpha8，编码 3 |
| `custom` | 保留图片颜色与透明度 | RGB565 编码 0，或 masked RGB565 编码 2 |

图标为边长 16–128 像素的正方形。横幅使用 32 像素图标，提供 32×32 资源可直接映射像素。省略声明时使用系统铃铛。打包和安装会检查资源路径、尺寸、编码、长度和完整性。

## 发布、更新和撤回

下面代码在用户已授权之后执行：

```js
const request = DeskTile.postNotification({
  id: 'download', title: '下载完成', body: 'report.pdf',
  data: 'file:report.pdf'
});
DeskTile.updateNotification({
  id: 'download', title: '可以查看文件', body: 'report.pdf',
  data: 'file:report.pdf'
});
DeskTile.cancelNotification('download');
```

调用返回正数请求 ID，随后通过 `onRequestComplete` 返回接受结果；立即失败返回负数 SDK 错误。系统接受后，消息按队列顺序显示。

同一应用的相同 ID 更新原通知。更新是完整替换，省略的正文、回调数据和事件时间采用默认值。更新或撤回不存在的 ID 返回 `DT_ERR_NOT_FOUND`。

## 点击回调

```js
function onNotification(notification) {
  if (notification.data === 'file:report.pdf') {
    DeskTile.router.navigate('document', {path: 'report.pdf'});
  }
}
```

例子中的 `document` 是应用自己注册的路由。点击横幅后系统进入所属应用，再投递 `id` 和 `data`。应用已经在前台时直接投递。Native 使用 `DT_EVENT_NOTIFICATION` 和 `dt_notification_event_v1`；由通知启动时，启动来源为 `DT_LAUNCH_NOTIFICATION`。

## 事件时间

`eventTime` 是整数 Unix 秒时间戳，范围为 1–253402300799。它表示通知所说事件的时间，系统显示“现在”“5 分钟前”“10 分钟后”等相对时间。省略时采用发布时间。

```js
DeskTile.postNotification({
  id: 'meeting-42', title: '会议提醒', body: '每周例会',
  eventTime: DeskTile.wallClockSeconds() + 10 * 60,
  data: 'meeting:42'
});
```

这会立即提交一条关于十分钟后会议的通知。需要到指定时间才发布的场景，应由受支持的任务或事件机制触发提交。

## Native 用法

```cpp
#include <desktile/notifications.hpp>
desktile::sdk::Notifications notifications(host);
dt_request_id request = 0;
dt_result result = notifications.post(
    "download", "Download complete", "report.pdf", "file:report.pdf", request);
```

`post` 和 `update` 最后的可选参数为事件 Unix 秒时间戳。C ABI 通过 `notification_post` 传递 UTF-8 JSON，包装器负责构造相同的协议。

## 队列与生命周期

| 项目 | 规则 |
| --- | --- |
| 标识与文本 | ID 1–64、标题 1–128、正文最多 320、回调数据最多 256 个 UTF-8 字节 |
| 队列 | 包括当前横幅最多 8 条，满时返回 `DT_ERR_BUSY` |
| 显示时间 | 每条 5 秒，更新可见横幅重新计时 |
| 暂停 | 触摸、系统模态交互或休眠暂停计时 |
| 结束 | 到期、划走或撤回后移除临时记录 |
| 应用退出 | 系统保留已接受的横幅 |
| 授权与数据变化 | 撤销通知权限、停用、卸载或清除应用数据会移除该应用队列 |

当前服务提供本地横幅。通知中心、持久历史和系统级远程推送属于独立能力。

## 系统任务的完成通知

可见任务成功或最终失败时，系统检查所属应用的通知授权，并判断该任务进度是否已经呈现给用户。下载、复制、移动、校验和可见日历同步任务使用这套规则。

进度页用 `DeskTile.tasks.presented([taskId])` 上报实际可见任务；滚动、切页或界面被覆盖时更新此列表，离开时传空数组。最多 12 个任务 ID。应用退出会清除呈现登记。

任务完成通知的回调 `data` 为 JSON 字符串，例如 `{"taskId":"123"}`。应用应解析后调用任务查询接口，再显示对应任务。仅轮询任务列表与实际上报可见进度具有不同含义。

继续阅读：[后台任务](tasks.md)、[JavaScript API](../api/javascript.md)、[Native API](../api/native.md)。
