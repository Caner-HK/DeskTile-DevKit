# 便签

[文档首页](/) / [应用开发](/guide/project.md) / [应用示例](/examples/index.md)

便签是一个 JavaScript 应用，展示列表与编辑器之间的导航、私有数据保存，以及通过文件服务导入和导出文本的流程。

[下载便签完整源码](/downloads/notes-js.zip)

<!-- page-outline -->
[[toc]]

## 阅读顺序

| 文件 | 重点 |
| --- | --- |
| `manifest.json` | 入口、文件读写权限、图标和磁贴尺寸 |
| `src/index.html` | 列表、编辑器和确认弹窗的结构 |
| `src/main.js` | 草稿、保存、未保存确认、文件操作与回调 |
| `locales/` | 简体中文、香港繁体中文和英文文案 |

## 数据与操作

便签通过 `notes-v1` 私有存储项保存内容。代码先检查读取结果，再解析数据；保存成功后才更新已保存状态。阅读 `persist`、`save` 和 `dirty`，可以看到如何区分编辑草稿与持久数据。

导入和导出通过系统文件服务完成。用户文件权限在需要操作时申请，异步请求返回后再更新页面。相关接口见[用户文件](../services/files.md)和[私有存储](../services/storage.md)。

## 构建

解压源码，在应用目录运行：

```sh
desktile build .
desktile check dist/hk.caner.desktile.notes.dtapp
```

## 实机验证

创建并保存便签，退出后重开，检查内容恢复；修改内容后返回，分别验证保存、放弃和取消；再测试文件权限允许及拒绝时的导入导出结果。

源码中的数量和长度上限体现该应用的选择，可结合自己的存储与界面需求调整。页面组织见[页面与生命周期](../guide/lifecycle.md)，编辑交互见[文本编辑器](../components/document-editor.md)。

## 许可

源码采用 Apache-2.0，完整许可和图标来源声明随下载包提供。
