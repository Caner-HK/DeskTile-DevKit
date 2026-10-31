# 文字

[文档首页](/) / [设计与组件](/components/) / 显示内容

显示标题、正文、标签或说明文字。

<!-- page-outline -->
[[toc]]

## 使用方式

按信息层级选择原生字号。长段落启用换行；列表中的摘要则先确定可用宽度。原生文字测量支持 16、20、22、32、48 px。

## 示例

[下载完整可运行示例](/component-examples/text.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。

```html
<dt-text text="周末计划" font-size="32" height="48"/>
<dt-text text="早晨出发，沿着海边散步。下午去图书馆，把喜欢的段落记下来。" font-size="20" text-wrap="true" width="752"/>
<dt-text text="最后修改于昨天" font-size="20" foreground-role="3" height="28"/>
```

## 常用属性

| 属性 | 用途 |
| --- | --- |
| `text` | 显示的 UTF-8 文本。 |
| `font-size` | 文字字号，使用设备提供的原生档位。 |
| `foreground-role` | 选择主题中的文字或图标颜色角色。 |
| `text-wrap` | 是否允许文字换行。 |
| `text-strikethrough` | 为单行文字绘制删除线。 |

## 浅色外观

![文字浅色](/previews/text/light.png)

## 深色外观

![文字深色](/previews/text/dark.png)

预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。
