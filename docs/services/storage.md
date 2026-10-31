# 私有存储与缓存

[文档首页](/) / [系统服务](/services/)

私有存储保存当前应用的设置和业务数据。系统按应用隔离键名，因此不同应用可以使用相同的 `settings` 键。安装包中的资源通过资源接口读取。

<!-- page-outline -->
[[toc]]

## 读取设置

优先使用 `storageReadResult` 区分首次运行和读取失败。

```js
const saved = DeskTile.storageReadResult("settings");
let settings = {schema: 1, enabled: true};
if (saved.result === 0) {
  settings = JSON.parse(DeskTile.utf8Decode(saved.data));
} else if (saved.result !== -8) {
  throw new Error("读取设置失败：" + saved.result);
}
```

`-8` 表示资源不存在，可以使用默认值。解析后检查版本、字段类型和范围，再将内容用于界面。为配置保留 `schema` 字段，方便未来迁移。

## 保存与删除

```js
const bytes = DeskTile.utf8Encode(JSON.stringify(settings));
const result = DeskTile.storageWrite("settings", bytes.buffer);
if (result !== 0) {
  // 显示保存失败，保留尚未成功提交的编辑内容。
}
```

`storageWrite` 返回实际写入结果。`storageRemove` 删除指定键。修改开关等设置时，保存成功后再确认新的持久状态。

## 缓存

`cacheRead`、`cacheWrite` 和 `cacheRemove` 管理可重建的数据。用户清除缓存后，应用应能够重新获取内容。重要业务数据放在私有存储中；用户主动导出的文件通过[文件服务](files.md)写入用户目录。

## 生命周期

应用清除数据、卸载和重新安装都应纳入测试。读取失败时保留错误信息，首次运行时建立默认值，升级时执行明确的数据迁移。

## 配置如何组织

应用设置使用私有存储。将有共同生命周期的小型设置组织为一个带版本号的对象，例如 `settings`；文档、笔记等业务数据按独立记录保存。键名属于应用自己的命名空间，应用通过 SDK 访问，系统负责实际目录与应用隔离。

读取时先判断返回结果，再解析 JSON 并验证字段。新版本新增字段时补默认值；旧版本字段变化时执行迁移，成功保存迁移结果后再更新内存中的持久状态。格式损坏与首次运行是两种情况，应分别处理。

设置开关的点击与滑动事件可能来自不同组件。一次用户操作只提交一次状态变化：保存成功后更新开关；保存失败时保留原值并告知用户。退出、重开和应用升级之后都要核对读取结果。

## 私有数据、缓存与共享记录

| 内容 | 使用位置 | 生命周期 |
| --- | --- | --- |
| 用户偏好、应用业务数据 | `storageReadResult` / `storageWrite` | 随应用私有数据管理 |
| 可重新生成的缩略图、计算结果 | `cacheRead` / `cacheWrite` | 清除缓存后重新生成 |
| 用户选择的导入、导出文件 | 文件服务 | 由用户目录和文件权限管理 |
| 日历、任务等跨应用记录 | 对应共享数据服务 | 由服务记录应用身份、权限和归属 |

共享记录通过[日历与任务服务](data.md)操作。系统从调用上下文取得应用身份，应用代码应使用服务返回的记录标识执行后续修改。

## 本地预览中的保存位置

预览器的主题、缩放、系统语言、字体和模拟状态栏设置保存在 `%LOCALAPPDATA%/DeskTile/Preview/settings.json`，供各项目共用。预览应用的数据保存在预览沙箱；应用仍调用相同的 SDK 存储接口。开发者可用重开预览、删除测试记录和模拟权限拒绝检查生命周期。
