# 图片

[文档首页](/) / [设计与组件](/components/) / 显示内容

显示应用包中的 DTI 图片资源。

<!-- page-outline -->
[[toc]]

## 使用方式

示例采用项目自带的完整 Color Grid 图片，原始尺寸和显示尺寸均为 480×288 px。图片所在容器使用居中对齐，保持原图比例。默认交叉轴 stretch 会拉伸子组件；固定尺寸图片需显式设置父容器 alignment。

## 示例

[下载完整可运行示例](/component-examples/image.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-image resource="picture.dti" width="480" height="288"/>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `resource` | 应用包内的资源路径。 |
| `width` | 组件宽度，单位为像素。 |
| `height` | 组件高度，单位为像素。 |

## 浅色外观

![图片浅色](/previews/image/light.png)

## 深色外观

![图片深色](/previews/image/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
