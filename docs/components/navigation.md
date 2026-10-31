# 导航 Nav

[文档首页](/) / [设计与组件](/components/)

Nav 用于在同一个应用的页面之间切换，位于应用栏下方、正文左侧。通过 Scaffold 创建导航条目、处理点击并维护选中项；页面内容放进 Scaffold 的 content 插槽。系统右侧的 [App Menu](app-menu.md) 用于应用操作，与这里的页面导航分别接入。

<!-- page-outline -->
[[toc]]

## 三种状态

| 状态 | 显示内容 | 默认宽度 |
| --- | --- | --- |
| 全部收回 `hidden` | 正文占用整个页面宽度 | 0 px |
| 展开 `labels` | 图标与文字 | 320 px |
| 折叠 `icons` | 仅图标，选中标记保持可见 | 96 px |

默认策略在收回和展开之间切换。把 `dismissed` 设置为 `icons` 后，连续点击左上角导航按钮会依次展开、折叠、全部收回。`permanentIcons: true` 适合始终保留导航入口的应用，此时导航在图标栏与完整侧栏之间切换。

导航项高 64 px，图标为 32×32 px，图标距侧栏左边 32 px；展开后的文字从左边 96 px 处开始。顶端与底端各留 8 px。`bottomCount` 指定末尾多少项固定在侧栏底部，例如设置入口。条目最多为 8 个，当前选中项用左侧主色标记表示。

## 正文占位

图标状态为正文留出 96 px。展开状态的占位沿用应用选择的策略：折叠后保留图标的导航占用 96 px，展开的其余部分覆盖正文；折叠后全部收回的导航展开时覆盖正文。状态栏和应用栏保持原位置。

Scaffold 会同步更新 content 插槽的位置和可用宽度。业务页面应依据插槽布局内容，并在切换页面时更新标题与选中项。

## JavaScript 接入

创建项目模板已经包含 SDK 模块和完整事件转发。以下配置启用三态循环：

```js
const ui = DeskTile.require("ui/components.js");
const shell = ui.createScaffold({
  id: "main",
  title: "阅读",
  items: [
    { label: "阅读", icon: 43 },
    { label: "设置", icon: 3 }
  ],
  bottomCount: 1,
  navigation: {
    initial: "hidden",
    opened: "labels",
    dismissed: "icons"
  }
});
```

通过 `shell.mount(DeskTile, contentMarkup, actionsMarkup)` 创建页面。处理返回值后，按以下顺序转发事件：

```js
function onPointer(kind, event) {
  handleNavigation(shell.pointer(kind, event));
}
function onEvent(kind, target, value) {
  const result = shell.event(kind, target);
  handleNavigation(result);
  if (result.consumed) return;
  handlePageEvent(kind, target, value);
}
function update(now) {
  handleNavigation(shell.tick(now));
}
```

`handleNavigation` 是应用自己的函数：检查 `result.result`；遇到 `action === "selected"` 时显示 `result.index` 对应页面；遇到 `action === "original"` 时执行原有返回或退出操作。`handlePageEvent` 处理正文事件。完整实现可参考 [JavaScript 阅读模板](/examples/#javascript-阅读模板)。

`shell.select(index)` 更新选中项，`shell.setTitle(title)` 更新标题，`shell.setEntry(index, entry)` 更新条目文字、图标及可用状态。主题变化时调用 `refresh()`，退出时调用 `destroy()`。

## Native 接入

```cpp
#include <desktile/scaffold_view.hpp>
using namespace desktile::sdk;

ScaffoldView shell;
ScaffoldOptions options;
options.navigation.initial = NavigationMode::Hidden;
options.navigation.opened = NavigationMode::Labels;
options.navigation.dismissed = NavigationMode::Icons;
const NavigationEntry entries[] = {{"阅读", 43}, {"设置", 3}};
// host 是应用已创建的 Host；检查返回值后向 shell.content() 添加正文。
const auto result = shell.create(host, options, "阅读", entries, 2, 1);
```

把宿主事件交给 `shell.event(kind, payload)`，其中包含指针、激活及 tick 事件。按 `ScaffoldEvent.action` 切换页面或执行原返回操作；`consumed` 为真时结束该事件的页面分发。完整生命周期见 [Native 阅读模板](/examples/#native-阅读模板)。

## 状态切换动画

Scaffold 默认启用导航动画：展开为 350 ms，折叠或收回为 120 ms，采用 `cubic-bezier(0.1, 0.9, 0.2, 1)` 缓动。侧栏边界与正文占位同步过渡，图标、文字保持原尺寸。隐藏与折叠、折叠与展开、隐藏与展开均支持双向过渡，状态关系由应用的导航配置决定。

设备上，Scaffold 将最终布局交给系统，由系统缓存切换前的内容区域，按屏幕刷新节奏合成过渡。800 × 376 px 的导航内容区临时占用 601,600 字节 PSRAM；最终画面复用显示缓冲，动画完成且显示扫描解除引用后释放临时缓存。内存不足时直接呈现最终布局。

过渡期间暂停点击，结束后按最终布局恢复命中。桌面预览器使用尺寸插值路径，JavaScript 应持续调用 `shell.tick(now)`，Native 应通过 `shell.event` 转发 tick。Scaffold 会自动探测设备的缓存呈现能力。需要立即切换的场景可设置 `animateNavigation: false`；Native 对应 `options.animateNavigation = false`。

## 实际预览

下列画面来自本地预览器运行完整应用，布局为 800×480。

### 全部收回

![全部收回](/previews/navigation/hidden.png)

### 展开图标与文字

![展开图标与文字](/previews/navigation/labels.png)

### 折叠为图标栏

![折叠为图标栏](/previews/navigation/icons.png)

相关接口见 [组件构建器](../api/builders.md)，页面结构见 [Scaffold 与导航](scaffold.md)。
