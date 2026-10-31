# 阅读手册（JavaScript）

公开 Scaffold 的完整两页面应用，简体中文为默认语言，同时提供香港繁体和英文。阅读/设置共享同一内容根，导航变化原位更新；大号文字仅由开关切换，修改成功后持久保存，失败保留原值。

构建前将 DevKit `sdk/javascript/` 中的 `components.js`、`navigation.js`、`scaffold.js`、`patterns.js` 复制到本例 `ui/`，并从公开图标资源提供 `assets/application.dti` 与 `assets/tile.dti`。

```powershell
python tools/build_dtapp.py examples/scaffold-js packages/scaffold-js.dtapp --development
```

点击左上角展开导航，底部设置进入字号偏好；长按左上角触发原退出操作。语言变更重新构造本地化内容，同时保留当前页与偏好；主题变更原位刷新。需要 modules、pointerInput、locales 和 checked storage-read 能力。
