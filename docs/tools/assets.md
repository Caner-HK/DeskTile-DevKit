# 制作图片、图标与磁贴资源

[文档首页](/) / [开发工具](/tools/)

应用图标、桌面磁贴图标和通知图标都可以由自己的 PNG 或 SVG 制作。工具会生成设备使用的 `.dti` 资源，并更新应用清单。最终安装文件仍由 Build Application 生成，为 `.dtapp`。

<!-- page-outline -->
[[toc]]

## 在 VS Code 中制作

1. 打开应用项目，点击 DeskTile DevKit 面板中的 **Create icons and tile resources**。
2. 在打开的编辑面板中选择应用图标、通知图标、默认磁贴图标或某种磁贴尺寸，再点击 **Choose image** 导入 PNG 或 SVG。
3. 选择 **Use system colours**，让系统按主题给图形着色；或选择 **Keep image colours**，保留图片颜色。
4. 设置图形四周留白的百分比。完整素材会等比例居中放进正方形画布。
5. 在右侧查看四种尺寸的磁贴。点击磁贴也可以选中对应尺寸；可以切换深浅背景。每种尺寸的素材、颜色模式和留白独立设置，**Use default tile icon** 可将该尺寸恢复为默认素材。
6. 点击 **Save to project** 写入项目。再次打开面板可以继续修改原始素材和参数。
7. 点击 **Build application**，将资源与代码一起打包。

保存时会创建独立资源目录并更新清单中的路径。原始图片与编辑参数保存在 `.desktile` 目录，便于继续编辑；转换草稿在关闭面板时释放。面板面向单套应用与磁贴图标，带多套 `icons.appearances` 的项目使用各外观原有的资源路径。

## 两种颜色模式

系统着色模式保留 PNG 或 SVG 的透明度形状，适用于单色符号。桌面磁贴同时生成 40、64、80、128 px 的原生图标，分别对应四种磁贴规格。

自定义颜色模式保留 RGB565 颜色和逐像素透明区域。设备该格式使用二值透明度，半透明边缘会转成透明或不透明；预览图直接使用转换后的像素，便于检查边缘。通知图标为 32 px，应用及默认磁贴图标为 96 px；四种尺寸的磁贴图标分别为 40、64、80、128 px，两种颜色模式都支持独立尺寸资源。

图片转换需要 Python Pillow；SVG 还需要 CairoSVG。安装命令：

```sh
python -m pip install Pillow CairoSVG
```

SVG 应包含完整矢量路径；外部图片、外部样式及字体请先在绘图工具中转成路径。

## 命令行

先生成预览，查看返回的 `light` 与 `dark` 文件：

```sh
desktile icon . --source ./artwork/logo.svg --purpose tile --mode system --padding 8
```

确定后用同样参数加 `--apply` 写入项目，再打包：

```sh
desktile icon . --source ./artwork/logo.svg --purpose tile --mode system --padding 8 --apply
desktile build .
```

`--purpose` 可选 `application`、`tile`、`notification`。通知权限由应用按实际用途在清单中声明；制作通知图标只更新图标声明。

## 页面图片与自有图标

普通页面图片使用 `image` 命令。支持 PNG、JPEG、WebP、SVG 和已有 DTI；默认保留原图尺寸和比例。SVG 使用 viewBox 或明确的像素尺寸。输出写入项目 `assets` 目录，构建时随应用装入 `.dtapp`。

```sh
desktile image . --source artwork/picture.png --output assets/picture.dti
desktile image . --source artwork/symbol.svg --output assets/symbol.dti --width 40 --height 40 --mode system
desktile build .
```

`--width`、`--height` 指定最大显示尺寸；同时指定时，完整图形按比例放进这个范围，输出采用缩放后的实际宽高。只指定一边时，另一边按比例计算。结果返回 `width`、`height` 和浅色、深色预览路径，预览使用转换后的实际 DTI 像素。已有输出需要显式添加 `--replace`。

```html
<dt-image resource="assets/picture.dti" width="320" height="180"/>
<dt-image resource="assets/symbol.dti" width="40" height="40"/>
```

组件宽高应与资源保持相同比例。默认 `custom` 模式保存 RGB565 色彩与二值透明度；`system` 模式保留透明度形状，由 Image 组件按系统主色着色。DTI 输出每边最多 4096 px、总像素最多 1,048,576；较大原图通过宽高参数缩小。图片预览和磁贴资源面板共用 DTI 解码规则，支持 RGB565、RLE RGB565、带透明区域 RGB565 及主题透明度图形。

系统图标的名称、编号、预览和下载见[完整图标目录](../components/icon-catalog.md)。
