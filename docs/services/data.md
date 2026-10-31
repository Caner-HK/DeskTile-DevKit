# 日历与待办

[文档首页](/) / [系统服务](/services/)

`DeskTile.data` 操作系统共享的 `events`（日历事件）、`tasks`（待办）和 `lists`（清单）。多个获授权应用可以访问这些记录，记录的创建者和版本由系统维护。

<!-- page-outline -->
[[toc]]

## 创建与查询

声明对应的日历或待办读写权限。创建待办的示例：

```js
const request = DeskTile.data.create("tasks", {
  title: "准备资料", completed: false,
  due_date: "2026-11-01", due_time: "09:00"
});
```

正数返回值是异步请求 ID。完成后用 `platformResult` 解析结果，保存系统返回的记录 `id` 和 `revision`。通过 `list` 分页浏览记录，通过 `get` 读取单条记录。

## 更新与删除

```js
DeskTile.data.update("tasks", task.id, task.revision, {completed: true});
```

更新和删除都携带上次读取的 `revision`。发生冲突时重新读取记录，再根据最新内容决定操作。记录的 `creator` 是系统维护的归属信息，应用通过当前调用身份接受权限与归属检查。

## 数据边界

界面偏好和临时编辑草稿保存在应用私有存储。需要其他应用协作的日历、清单和待办使用共享服务。测试应覆盖记录被其他应用更新、删除以及权限被撤销的情况。

字段与方法见 [SharedDataApi](../api/platform.md#shareddataapi) 和 [SharedRecord](../api/platform.md#sharedrecord)。
