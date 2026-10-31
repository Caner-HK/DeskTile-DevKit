# 图标

[文档首页](/) / [设计与组件](/components/) / 显示内容

使用 SDK 的系统图标编号显示操作或内容类别。

<!-- page-outline -->
[[toc]]

## 使用方式

这三个图标均来自系统图标资源，显示边界为 40×40 px。横向容器使用 `alignment="1"` 垂直居中，保持图标正方形。列表中的图标规格按相应列表变体使用；Appbar 操作图标为 32×32 px。

## 示例

[下载完整可运行示例](/component-examples/icon.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-row height="64" gap="24" alignment="1">
<dt-icon icon="28" width="40" height="40"/>
<dt-icon icon="49" width="40" height="40"/>
<dt-icon icon="81" width="40" height="40"/>
</dt-row>
```

## 图标目录与自有图标

[完整图标目录](icon-catalog.md)列出名称、编号、预览和可打包的 DTI 文件。自己的图形使用 [Image 组件](image.md)加载包内资源；[资源制作](../tools/assets.md)说明如何将原始图片转换为 DTI。

```html
<dt-image resource="assets/my-symbol.dti" width="40" height="40"/>
```

系统着色 DTI 保留透明度并使用当前主色；自定义颜色 DTI 保留图片颜色。图形显示区域保持原素材宽高比。`dt-icon` 的编号用于系统内置图标，包内图形由 `dt-image` 的资源路径指定。

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `icon` | SDK 图标目录中的编号。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |
| `foreground-role` | 选择主题中的文字或图标颜色角色。 |

## 浅色外观

![图标浅色](/previews/icon/light.png)

## 深色外观

![图标深色](/previews/icon/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。

## 包内图标示例

[下载包内 DTI 图标完整示例](/component-examples/custom-icon.zip)。三个图形使用与上方相同的布局，Image 组件读取应用包中的图标资源并使用当前主色。

![包内图标](/previews/icon/custom.png)
