# Scaffold 与导航

[文档首页](/) / [设计与组件](/components/)

Scaffold 负责应用栏、当前页面和导航入口。业务页面负责自己的内容与事件。通过同一个状态源更新当前页面、标题和导航选中项。

[导航 Nav](navigation.md) 介绍全部收回、图标与文字展开、仅图标折叠三种状态，以及占位规则、切换动画和 JS／Native 接法。

JavaScript 使用 `sdk/javascript/scaffold.js` 与 `navigation.js`；Native 使用 `desktile/scaffold_view.hpp`。创建应用模板已经给出阅读页和设置页的完整组合，可从这两个页面开始替换业务内容。

## 页面生命周期

进入页面加载显示内容；离开页面取消页面范围请求；应用退出释放整个应用范围资源。保存阅读位置等持久状态应在生命周期回调中完成，并处理保存失败。

## 事件归属

让 Scaffold 先处理属于应用栏和导航的事件，再把剩余事件交给当前页面。页面重建后重新取得组件句柄。异步完成时确认请求仍属于当前有效页面。

完整类型和回调签名见 [JavaScript API](../api/javascript.md)；可运行代码位于 `sdk-bundle/examples/scaffold-js` 和 `scaffold-native`。
