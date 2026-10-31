# 用户文件

[文档首页](/) / [系统服务](/services/)

`DeskTile.files` 提供目录、文件内容和文件选择操作。`scope: "private"` 指向应用私有空间，`scope: "user"` 指向用户文件空间。访问用户文件需要相应读写权限。

<!-- page-outline -->
[[toc]]

## 浏览目录

```js
const request = DeskTile.files.list("Downloads", {
  scope: "user", offset: 0, limit: 16
});
```

保存正数请求 ID，在 `onRequestComplete` 中核对请求与结果，再用 `DeskTile.platformResult(payload)` 解码平台返回的 JSON。目录列表按分页读取，进入新目录时更新当前路径和分页位置。

页面离开后，使用页面范围的请求会随导航取消。需要在应用内跨页面管理的请求可以设置 `{scope: "application"}`。重新进入页面时重新查询当前目录。

## 读取内容

```js
const request = DeskTile.files.read("Downloads/readme.txt", {
  scope: "user", offset: "0", maximum_bytes: 4096
});
```

读取结果包含 `data_base64`、`offset`、`next_offset`、`file_bytes` 和 `eof`。使用 `DeskTile.files.bytes(result)` 得到字节，或 `DeskTile.files.text(result)` 解码文本。读取大文件时按 `next_offset` 继续，直到 `eof`。

## 写入与选择文件

`writeText` 写入文本，`writeBytes` 写入字节。`create_only` 用于要求新建文件，`expected_sha256` 用于检查覆盖前的内容版本。写入完成后检查结果，再刷新受影响的列表。

```js
DeskTile.files.writeText("Downloads/readme.txt", "Hello DeskTile", {
  scope: "user", create_only: true
});
```

`files.pick` 打开系统文件选择流程。成功结果包含选中的路径，取消按普通取消处理。需要退出应用后继续执行的下载或复制交给[后台任务](tasks.md)。

全部参数见 [FilesApi](../api/platform.md#filesapi)。
