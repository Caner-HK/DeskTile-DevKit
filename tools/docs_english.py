"""English SDK guides generated alongside the Chinese reference.

API declarations and runnable examples are shared with the source documentation.
English prose and component measurements are maintained here.
"""
from pathlib import Path
import json,re
from docs_content import COMPONENTS

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'

TITLES={
'开始使用':'Getting started','DevKit 概览':'DevKit overview','安装开发环境':'Install the tools','创建第一个应用':'Your first application',
'应用开发':'Application development','项目结构':'Project structure','页面与生命周期':'Pages and lifecycle','资源与语言':'Resources and languages','启动画面 Splash':'Splash screen','Native C++ 应用':'Native C++ applications','测试应用':'Testing applications','应用示例':'Examples','示例概览':'Example overview','便签示例':'Notes','计时器示例':'Timer','ToDo 示例':'ToDo',
'设计与组件':'Design and components','界面设计规范':'Design guidelines','组件目录':'Component catalog','应用框架与导航':'Scaffold','导航 Nav':'Navigation','常用界面组合':'Component patterns','完整图标目录':'Icon catalog','系统应用菜单':'App Menu','布局':'Layout','显示内容':'Content','操作与输入':'Actions and input','列表与弹窗':'Lists and dialogs',
'页面 Page':'Page','应用栏 System bar':'System bar','横向容器 Row':'Row','纵向容器 Column':'Column','层叠容器 Stack':'Stack','网格 Grid':'Grid','滚动容器 Scroll view':'Scroll view','文字 Text':'Text','图片 Image':'Image','图标 Icon':'Icon','画布 Canvas view':'Canvas view','进度 Progress':'Progress','移动方块':'Moving squares','脉动竖条':'Pulsing bars','按钮 Button':'Button','按钮变体':'Button variants','悬浮操作按钮 FAB':'Floating action button','颜色选择':'Color swatch','开关 Toggle':'Toggle','复选框 Checkbox':'Checkbox','滑块 Slider':'Slider','输入框 Text field':'Text field','文本编辑器 Document editor':'Document editor','步进选择器 Choice stepper':'Choice stepper','日期时间选择器':'Date and time picker','时长选择器':'Duration picker','上下步进器 Number stepper':'Number stepper','列表 List':'List','列表项 List row':'List row','列表说明 List note':'List note','对话框 Dialog':'Dialog','紧密列表 Compact list':'Compact list','菜单 Menu':'Menu',
'系统服务':'System services','服务概览':'Service overview','权限申请':'Permissions','私有存储':'Private storage','用户文件':'User files','网络请求':'Network requests','后台任务':'Background tasks','通知':'Notifications','蓝牙 BLE':'Bluetooth BLE','日历与待办数据':'Calendar and tasks','系统输入法':'System input',
'API 参考':'API reference','查阅接口':'API overview','JavaScript 全局接口':'JavaScript globals','平台服务类型':'Platform types','界面构建器':'UI builders','Native C/C++ 接口':'Native C/C++','属性、事件与限制':'Properties, events and limits',
'开发工具':'Development tools','VS Code 插件':'VS Code extension','命令行':'Command line','制作图标与磁贴资源':'Images, icons and tiles','连接与安装到设备':'Device workflow','串口调试命令':'Serial commands','发布应用':'Publishing','打包、签名与分发':'Build, sign and distribute'}

USAGE={
'page':('Page','The root of a screen contains the app bar and page content. Keep one active root per screen and restore any saved scroll position when rebuilding a page. The usual app area is 800 × 448 px below the 32 px status bar.'),
'system-bar':('System bar','Use Scaffold for the app bar. When composing it directly, use a 72 px row containing the navigation action, title and trailing actions. App-bar titles use 32 px text; icon actions use a 72 px hit area and a 32 px icon.'),
'row':('Row','Arrange children horizontally. `gap` sets spacing and `flex-grow` shares remaining width. Cross-axis `alignment` is 0 for start, 1 for center, 2 for end and 3 for stretch. Center fixed-size icons and buttons to preserve their dimensions.'),
'column':('Column','Arrange children vertically. The example uses a 32 px heading, 20 px body text and 12 px gaps. Alignment controls the horizontal axis. Choose start or center for fixed-width images and pickers; full-width lists use the available width. Put overflowing content inside a scroll view.'),
'stack':('Stack','Overlay children in the same layout region. Set explicit bounds, check drawing order and preserve image proportions. Use Row or Column for ordinary sequential content.'),
'grid':('Grid','Arrange repeated content in columns. Set `grid-columns`, item sizes and gaps together. Check long labels at the actual column width and give each action its own touch area.'),
'scroll-view':('Scroll view','Use `dt-scroll` for content that exceeds its viewport. Let it fill the space below the app bar, then place the list inside. Rows supply their own padding. The example contains eight rows in an 800 × 376 px viewport. Save the actual offset and restore it with `scroll-position`; check the target capability before using scroll-position APIs.'),
'text':('Text','Use native font sizes for headings, body text and labels. Native measurement supports 16, 20, 22, 32 and 48 px. Enable wrapping for paragraphs and allocate a definite width for list summaries. Test all supported languages and long values.'),
'image':('Image','Load a package-relative DTI resource. This example uses the complete Color Grid image at its original 480 × 288 px size. Center its parent and keep the aspect ratio. A parent with cross-axis stretch can stretch a fixed-size image, so set alignment explicitly. Check transparent edges against light and dark backgrounds.'),
'icon':('Icon','Choose a built-in icon by its SDK number. The example uses three real system assets in 40 × 40 px bounds, in a Row with `alignment="1"`. App-bar action icons use 32 × 32 px. Match the size to the particular component variant and check optical centering. See the [icon catalog](icon-catalog.md) for names, IDs and downloadable DTI resources. Package-owned symbols use Image and a resource path.'),
'button':('Button','Standard buttons are 52 px high with 20 px labels. Save uses primary (0), Cancel uses cancel (9), and Delete uses destructive (2). Handle `activate` and update `enabled` while an asynchronous action is pending. App-bar buttons use their own variants and a 72 px action area.'),
'button-variants':('Button variants','Additional styles include secondary (1), text (4), outlined (7), cut-corner floating (3) and circular (8). The example separates normal actions from icon and floating variants. Give icon-only buttons an `accessibility-label`. App-bar icon actions use a 72 px touch area and a 32 px icon.'),
'fab':('Floating action button','A FAB represents the primary creation action. Notes uses an 80 × 80 px circular button (`button-style="8"`) with a 40 × 40 px icon, 24 px from the right and bottom of the content region. Overlay it with Stack so it stays fixed while the list scrolls. Reserve enough scrollable space below the last item. The cut-corner floating style is a separate variant (3).'),
'color-swatch':('Color swatch','Use `button-style="10"`, `background` for the candidate color and `checked` for selection. The system chooses a contrasting check mark. After `activate`, update the selection and save the color. Supply a color name through `accessibility-label`.'),
'toggle':('Toggle','Use a toggle for a binary setting that takes effect immediately. Keep `checked` in sync with the application state. Commit the setting, then confirm the persisted state; restore the old value and report a failed save. Update dependent controls through `enabled`.'),
'checkbox':('Checkbox','Use independent checkboxes for multiple choices. `checked` marks selection and `indeterminate` marks a partially selected group. Compute group and child states from the same application data.'),
'slider':('Slider','Choose a value in a continuous range, such as brightness. Set `minimum` and `maximum`, validate the reported value and handle `value-changed`. Prefer a stepper when an exact discrete value is required.'),
'list':('List','There are two densities: comfortable rows are 76 px high, as on the settings home page; compact rows are 54 px, as in PIDS settings. Choose density for the page purpose. The list fills the content width and each row supplies 24 px horizontal padding. Use `checked` only for a persistent selection; ordinary navigation rows use the default state.'),
'list-compact':('Compact list','Set each row to 54 px with 20 px text and fill the content width. This is the PIDS-settings density. The comfortable alternative is 76 px; choose one consistent density for the page purpose.'),
'list-row':('List row','Use `ui.listRow` for a 76 px comfortable row or `density: "compact"` for 54 px. Main text is 20 px. Summaries use the trailing slot by default; put toggles there too. Group rows in `dt-list` so it manages the final divider. Toggle hit areas are 112 × 56 px, with height constrained to 54 px in compact rows.'),
'list-note':('List note','Place a note directly after its list in a Column with no extra padding or gap. The component supplies 24 px horizontal padding, a 16 px top gap and 20 px text. Set `has-following-content="true"` on the list to keep the divider above the note. Update visibility when the setting that explains it changes.'),
'text-field':('Text field','Put empty-state guidance in `placeholder` and the current value in `text`. The system supplies the placeholder theme color. Standard fields are 52 px high with 20 px text and 16 px horizontal padding. An internal icon participates in text layout. The example enables pointer input, distinguishes tap, drag and cancellation, and opens the keyboard on release. Commit a successful keyboard result; preserve the old value on cancellation.'),
'document-editor':('Document editor','Follow the Notes body layout: 24 px padding on all four sides inside a scroll view filling the content region. The example enables `document-headings` to display the first paragraph as a heading. Text, cursor and input-session state are shared between the application and system keyboard. Embedded keyboard presentations need the editor handle.'),
'dialog':('Dialog','The standard confirmation layout is 592 px wide with 24 px internal padding. Its title uses 32 px text in a 48 px area, followed by a 12 px gap. The content group gap is 24 px. Bottom buttons are 52 px high with a 12 px gap; Cancel is on the left and confirmation on the right. Delete uses the destructive color. Prefer `ui.confirmation`; only the body scrolls when content is long.'),
'menu':('Menu','`ui.menu` follows the device PopupMenu: 256 px default width, 56 px header and action rows, 20 px secondary header text with 16 px horizontal padding. Row icons are 28 × 28 px at x=16 and labels start at x=60. The border uses the divider theme color. Place this embedded popup in an application overlay, position it near the touch point and dismiss it on an outside click. The example centers the menu surface. Up to eight items are supported; overflowing content scrolls. `showHeader: false` hides the header. Identify actions by item ID, then close the menu. System App Menu uses a separate registration API.'),
'progress':('Progress','Place the percentage at the right end of the bar, vertically centered. Match File downloads: a 12 px bar, 16 px gap and 20 px percentage text in an 80 × 32 px area so 100% keeps a stable layout. Update both the bar and label from the same task value. For unknown totals use an activity indicator.'),
'loading-squares':('Moving squares','Use the squares style of `dt-progress` while waiting for a directory or page with no known percentage. The host advances the animation. The device loading region is 240 × 30 px with text below. Show it before starting asynchronous work, then hide or destroy it on completion, failure or cancellation. HTML `progress-style="1"` corresponds to `ui.progress({id:"loading",style:"squares"})` and Native `DT_PROPERTY_PROGRESS_STYLE = 1`.'),
'loading-bars':('Pulsing bars','Use three animated bars for a compact waiting region, commonly 48 × 40 px. HTML `progress-style="2"` corresponds to `ui.progress({id:"loading",style:"bars"})` and Native `DT_PROPERTY_PROGRESS_STYLE = 2`. The host advances the animation while the application manages the asynchronous task. Hide or destroy the indicator when work finishes; use determinate Progress when a total is available.'),
'canvas-view':('Canvas view','Use `dt-canvas` for custom drawing inside component bounds. This example submits three filled-rectangle commands in `enter`, relative to the canvas origin. Encode the public binary command structure and submit it through `canvas-commands`. The interactive preview executes the same JavaScript. Resubmit the relevant buffer when data changes and keep ownership aligned with the component lifecycle.'),
'choice-stepper':('Choice stepper','Put the left/right stepper in a list row alongside its label. The example uses a 76 px comfortable row. The control spans the whole row; its arrows and value align to the right internally. Arrow buttons are 44 × 44 px with 30 px right spacing. Set `minimum`, `maximum` and `step`, then save the new value on `value-changed`.'),
'number-stepper':('Number stepper','Build it with `ui.numberStepper`. Up and down buttons use `id-up` and `id-down`; the value uses `id-value`. Default width is 128 px; buttons and value each have 52 px height and 8 px gaps. `symbols: "arrows"` selects arrow icons. Holding a button generates `activate` every 100 ms. Store and clamp the value in application state and disable the corresponding button at each bound. The example range is 0–20.'),
'date-time-picker':('Date and time picker','Use `createDateTimePicker` or `configureDateTimePicker` to set date limits, time limits and the minute step. Save the choice from `onDateTimeChanged`. Use the public configuration structure rather than manually laying out date fields.'),
'duration-picker':('Duration picker','Edit durations in hours, minutes and seconds. `value`, `minimum` and `maximum` are in seconds. Corner labels use the three fields of the time group. Save the returned number of seconds on `value-changed`. Suitable for timers and playback intervals.')}

PROPERTIES={
'width':'Width in pixels.','height':'Height in pixels.','max-height':'Maximum height.','background':'Background color as 0xRRGGBB.','foreground':'Explicit foreground color.','foreground-role':'Theme role for text or icon color.','status-bar-background':'Background of the adjacent status bar.','status-bar-foreground':'Status-bar text and icon color.','text':'UTF-8 display text.','font-size':'A native font-size tier.','text-wrap':'Allow wrapping.','text-strikethrough':'Draw a strike through a single text line.','gap':'Space between children.','padding':'Inset between content and component edges.','alignment':'Cross-axis child alignment.','justification':'Distribution along the main axis.','flex-grow':'Share of remaining space.','grid-columns':'Number of columns.','scroll-axis':'vertical or horizontal.','scroll-position':'Actual offset, clamped to the scrollable range.','resource':'Package-relative resource path.','icon':'SDK system-icon ID.','button-style':'Button-variant enum.','enabled':'Accept input and use the corresponding enabled/disabled appearance.','checked':'Current selected or on state.','indeterminate':'Partially selected state.','minimum':'Lower bound.','maximum':'Upper bound.','value':'Current value.','step':'Change per step.','has-following-content':'Keep the final divider when content follows the list.','placeholder':'Guidance shown when text is empty.','dialog-presentation':'embedded or centered presentation.','dialog-destructive':'Destructive confirmation color semantics.','dialog-title-divider':'Show the title divider.','visible':'Participate in the current display.','progress-style':'Determinate, moving squares or pulsing bars.','animation-duration':'Progress animation period in milliseconds.','canvas-commands':'Encoded public Canvas command buffer.','pointer-input':'Receive pointer events.','document-headings':'Render document heading styles.','document-cursor':'Text cursor position.','document-scroll':'Internal editor scroll position.','document-focused':'Editor focus state.','date-time-config':'Picker configuration written by SDK methods.','date-time-corner-text':'Optional upper-right labels for picker columns.'}

def write(name,body):
    p=DOCS/'en'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body.strip()+'\n',encoding='utf-8')

def code_blocks(name):
    return re.findall(r'```[^\n]*\n.*?```',(DOCS/name).read_text(encoding='utf-8'),re.S)

def main():
    tree=json.loads((DOCS/'navigation.json').read_text(encoding='utf-8'))
    def translate(nodes):
        for node in nodes:
            node['text']=TITLES[node['text']]
            if 'link' in node:node['link']='/en'+node['link']
            translate(node.get('children',[]))
    translate(tree)
    (DOCS/'navigation.en.json').write_text(json.dumps(tree,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    for name,(title,usage) in USAGE.items():
        source=(DOCS/'components'/f'{name}.md').read_text(encoding='utf-8')
        props,events=COMPONENTS[name][4:6]
        body=f'# {title}\n\n{usage}\n\n## Example\n\n[Download the runnable example](/component-examples/{name}.zip). Open it in the interactive preview. The shared example retains its original UI labels; the geometry and behavior are the same in both language editions. The complete parent layout is in `page.html`.\n\n'+'\n\n'.join(code_blocks('components/'+name+'.md'))
        if name in ('list','list-compact','list-row','scroll-view','list-note'):
            body+='\n\n## Final divider\n\nShow the last row divider when the whole list fits in the viewport with space below it. For a scrolling list whose last row is off-screen, preserve the viewport clipping. When a note or other content follows the list, always show the final divider. `has-following-content` marks following content drawn by another container. Both list densities use this rule.'
        body+='\n\n## Properties\n\n| Property | Meaning |\n| --- | --- |\n'+''.join(f'| `{p}` | {PROPERTIES[p]} |\n' for p in props)
        if events:body+='\n## Events\n\nHandle '+', '.join('`'+e+'`' for e in events)+'. Identify the target, update application state and refresh the affected properties. Event IDs are listed in the [contract](../api/contract.md).\n'
        if name.startswith('loading-'):body+=f'\n## Animation\n\n![Animation](/previews/{name}/animation.gif)\n'
        body+=f'\n## Light theme\n\n![Light theme](/previews/{name}/light.png)\n\n## Dark theme\n\n![Dark theme](/previews/{name}/dark.png)\n\nThese 800 × 480 images use the native component renderer. See the [contract](../api/contract.md) for all properties and [patterns](patterns.md) for common combinations.\n'
        if name=='icon':body+='\n## Package-owned icons\n\n[Download the custom-icon example](/component-examples/custom-icon.zip). Image loads the packaged DTI assets at the same square bounds. System-colored DTI uses the current accent; custom-colored DTI retains its pixels. Convert source images with the [asset tools](../tools/assets.md).\n\n![Packaged icons](/previews/icon/custom.png)\n'
        write('components/'+name+'.md',body)
    for name,body in GUIDES.items():
        # Insert the exact source code examples by index, preserving API names.
        blocks=code_blocks(name)
        body=re.sub(r'\{\{code:(\d+)\}\}',lambda m:blocks[int(m[1])],body)
        write(name,body)
    generate_references()
    print('English guides and component references generated')

GUIDES={
'README.md':'''# DeskTile DevKit

DeskTile DevKit is the development suite for DeskTile applications, using SDK **1.0**. The VS Code extension and command-line tools share the same SDK, templates and packaging implementation.

## Get started

[Install the tools](start/install.md), then [create your first application](start/first-app.md). Build a project, edit its interface, create an installer and run it on the device.

## Understand an application

Read [project structure](guide/project.md), [pages and lifecycle](guide/lifecycle.md), and [resources and languages](guide/resources.md). The [complete examples](examples/) demonstrate real application workflows.

## Build an interface

Use the [design guidelines](design/) and [component catalog](components/). Examples include real component geometry, states and runnable source.

## Use system services

Start with [permissions](services/permissions.md), then choose [system services](services/) for storage, files, network, Bluetooth, notifications and tasks. Use the [API reference](api/) for exact signatures.

## Deliver an application

The [tool guide](tools/) covers local preview and device installation. [Publishing](publish/) covers manifests, signing, validation and updates.
''',
'start/install.md':'''# Install the tools

DeskTile DevKit targets SDK 1.0. Prepare your development computer before choosing an application runtime.

## VS Code extension

Choose **Install from VSIX** in VS Code and select `desktile-devkit-1.0.0-win32-x64.vsix`. Open an application folder to display DeskTile DevKit in Explorer. Run **Check Development Environment** before building; results appear in the output panel.

The extension follows the VS Code display language. **Interface language** selects automatic, Simplified Chinese or English for panels and prompts. Reload the window after changing it. Command-palette titles follow VS Code itself.

## Dependencies

JavaScript builds need Python 3.10 or newer. The CLI also needs Node.js 20 or newer. Set `desktile.pythonPath` to select Python. Install `pyserial` for serial access and `cryptography` for signing with `python -m pip install pyserial cryptography`.

The local preview includes a Windows x64 host with QuickJS and the native component renderer. Native C++ device builds require the ESP32-S3 Xtensa toolchain; set `desktile.compilerPath` to `xtensa-esp32s3-elf-g++`. Native local preview requires the Visual Studio C++ desktop workload described in [tools](../tools/).

## SDK location

The complete distribution includes `sdk-bundle`. **Select SDK** can select another SDK 1.0 folder containing `delivery-manifest.json`, `sdk`, `tools` and `examples`.

## Command line

Run these commands in the extracted DevKit root:

{{code:0}}

You can also run `node bin/desktile.js doctor`. Install a standalone CLI archive with `npm install --global desktile-devkit-1.0.0.tgz`. Updates install a new VSIX or npm package while project sources and device data remain in their own locations.

## Offline documentation

Run `desktile docs` to read the bundled site. The portable distribution includes VuePress sources and a lock file in `documentation`; run `npm ci` and `npm run build` there to rebuild it with a current Node.js LTS release.
''',
'start/first-app.md':'''# Your first application

Create a reading application with a reading page, a settings page and a saved text-size preference.

## Create the project

Run **DeskTile DevKit: Create Application**. Choose JavaScript, enter a name, author and reverse-domain package ID such as `com.example.reader`. Choose the parent folder and enter the new project-folder name. The extension opens the generated project.

{{code:0}}

The project contains its manifest, document entry, JavaScript, language resources and icons. Edit `locales` and inspect `enter`, `onEvent` and `leave` in `src/main.js`.

## Build

Use **Build Application**, or:

{{code:1}}

The installer is written to `dist`. Editor configuration, type helpers and previous build output are excluded from the application package.

## Install

Use **Install on Device** with USB debugging input/output enabled, or copy the installer to SD with **Copy Installer to SD Card**. SD installers are stored in `desktile/user/Packages`; install them through Settings → Applications → Install application. See the [device workflow](../tools/device.md) for prerequisites and results.

## Check interaction

Switch between reading and settings, change text size, exit and reopen. Confirm the preference survives. Check all three languages and both themes, then continue to [project structure](../guide/project.md).
''',
'guide/project.md':'''# Project structure

An application consists of a manifest, code and resources. The `.dtapp` container identifies its package and entry points through the manifest.

| Path | Purpose |
| --- | --- |
| `manifest.json` | Identity, entry points, permissions and resources |
| `src/` | Page entries and application logic |
| `ui/` | Copied JavaScript component and navigation modules |
| `locales/` | Catalog and messages for each language |
| `assets/` | Icons and images |
| `.desktile/types/` | JavaScript editor declarations |
| `dist/` | Generated installers |

## Manifest

Declare the package ID, localized name, author, version, runtime, entry, icons, permissions and SDK requirements. Keep the package ID stable across updates. `version` is human-readable; `version_code` orders updates. SDK `minimum` and `target` currently use `1.0`. Query optional capabilities at runtime.

## Pages and logic

The JavaScript document entry creates the component tree. Scripts handle events and business state. One entry can manage several views through modules, navigation and shared components. The framework manages common navigation; the application owns the meaning of its data.

## Resources and data

Package resources are read-only inputs. Use [private storage](../services/storage.md) for settings and business data, and file-service APIs for user-selected files. Language resources belong in `locales`.

## Development configuration

`desktile.json` records the SDK and build target. `jsconfig.json` configures editor checks. `.desktile/types` contains SDK declarations. The builder prepares content in a temporary directory and replaces output only after a successful build, preserving the last successful artifact on failure.
''',
'guide/lifecycle.md':'''# Pages, events and lifecycle

Entering the foreground, switching an internal page and exiting the application are separate transitions. Resource ownership should match each transition.

## Entry and callbacks

Read saved settings and create the page in `enter()`. Distinguish a missing setting on first use from a failed read.

| Callback | Purpose |
| --- | --- |
| `enter()` | Read settings and create the page |
| `onEvent(event, target, value)` | Handle component activation and changes |
| `onRequestComplete(request, result, payload)` | Receive asynchronous results |
| `onPermissionResult(request, permission, state)` | Continue or end work awaiting authorization |
| `update(now)` | Advance time-dependent state using the monotonic clock |
| `onExit()` | Handle system back/exit requests |
| `leave()` | Release application-session resources |

Identify components by event target. Update affected properties to preserve page and scroll state. Release subscriptions and temporary resources when leaving their owning view; keep shared session data at application scope.

## Exit and background work

`leave()` cleans up the application session. A page closing is distinct from a background task finishing. Background permission authorizes supported execution mechanisms; each task API defines its lifecycle. Notifications require their own permission, in addition to background and network/file/Bluetooth permissions required by the actual work.

## Asynchronous results

An accepted request has a positive ID. Save it and dispatch completion to the original operation. Check that its page is still current before using component handles. Page-scoped requests are canceled when their page leaves; application-scoped requests follow the application session. Use [system tasks](../services/tasks.md) for work such as downloads that must survive application exit.
''',
'guide/resources.md':'''# Resources and languages

Package assets, private settings and user-selected files have different ownership and APIs.

## Icons

Application, tile and notification icons have distinct roles. Declare each resource in the manifest, check its pixel dimensions, transparency and theme behavior. Notification icons support system coloring or retained image colors; see [notifications](../services/notifications.md).

## Text and fonts

Prefer native font tiers. Manage specialized application fonts as resources and check their actual language coverage. Provide text for empty, error, disabled and completed states as well as ordinary content.

## Localization

Use the same keys across language files. Keep parameterized sentences as complete messages so translations can reorder words.

{{code:0}}

The catalog declares supported and default languages. The framework resolves application and system language, then reads the appropriate message file. Refresh text when language changes. Split large business datasets by language and load them when needed.

## Reading resources

`resourceText` reads text, `resourceJson` parses JSON and `resourceRead` returns bytes. Use `resourceSize` and `resourceReadRange` for large resources. Paths are relative to the package and must match filename case. Build checks validate references and structure; device checks cover glyphs, truncation, wrapping and touch areas.
''',
'guide/native.md':'''# Native C++ applications

Native applications enter through `dt_app_entry` and communicate through the public ABI. The device build targets ESP32-S3 Xtensa with freestanding C++17.

## Toolchain and build

Install the Espressif ESP32-S3 Xtensa toolchain. Set `desktile.compilerPath`, pass `--compiler`, or set `DESKTILE_COMPILER` to `xtensa-esp32s3-elf-g++`. The matching `strip` tool must be next to it.

{{code:0}}

Creation generates C/C++ include-path configuration. Sources live in `src`; the builder packages the ELF into `.dtapp` and runs the shared validator.

## ABI and ownership

Every host call receives the application context. Component handles, requests and storage belong to that context. Copy borrowed callback data if it must outlive the callback. Prefer the public C++ wrappers. The default build disables exceptions and RTTI; available standard-library and platform behavior depend on the toolchain and loader.

## Other processors and local preview

Compatible SDK interfaces allow source reuse. An ESP32-S3 ELF still depends on its instruction set, relocations and loader. ESP32-P4 requires rebuilding with a suitable toolchain and compatible target ABI. [Local Native preview](../tools/#native-preview) compiles a separate Windows module from source.

## Installation

Native installation follows developer settings and on-device risk confirmation. Verify installation, upgrades, exit and permission revocation on the target device.
''',
'guide/splash.md':'''# Splash screen

The system owns the launch screen background, status bar, loading indicator and completion. JavaScript and Native packages declare the same optional icon.

## Manifest

Merge this fragment into `manifest.json`:

{{code:0}}

Paths are package-relative and assets must be included. A declared missing file fails packaging validation.

## Icon and layout

Provide a square DTI, preferably **96 × 96 px**. Alpha-mask resources use the current accent; colored formats preserve image colors. Keep suitable transparent padding in the icon. On an 800 × 480 screen its bounds are `x=352, y=176, w=96, h=96`, with the loading indicator below. The system composes the complete screen.

If loading fails, the system tries the application icon and then the default icon. Omitting `icons.splash` skips this application splash path.

## Timing

The system tracks launch time by application ID and version. First launches and launches without a measurement show Splash. A previous launch below 200 ms can cause the next one to skip it; system paths that force a splash still show it. The in-memory history holds eight applications and resets after reboot.

The host manages the splash lifetime. Network and other asynchronous work after entry should use loading state inside the application page.

## Verification

Build, install and open from the device desktop. Check the icon, both themes and the handoff to the first frame. Repeat exits and launches to check the fast-launch behavior. Local preview displays application pages; the device desktop owns launch timing and Splash.
''',
'guide/testing.md':'# Testing applications\n\n\n## Local checks\n\n`desktile build` validates manifests, entries and resources. `desktile check` validates paths, file-table bounds and file digests. Device trust settings decide whether a signature is accepted.\n\n`desktile preview` runs JavaScript through QuickJS, or a Native module built for the host, with the actual component engine. Test clicks, dragging, scrolling, text input, App Menu, timers and persistence. The toolbar provides theme, layout bounds, host metrics and 15/30/60 FPS limits. JavaScript uses the runtime memory and execution budgets. Device binaries and hardware behavior require device testing.\n\n```sh\ndesktile preview my-app --locale zh-HK --theme light\ndesktile screenshot my-app --page src/index.html\n```\n\n`desktile screenshot` exports 800 × 480 light and dark PNGs for static HTML layout inspection.\n\n## Lifecycle scenarios\n\nLocal checks can exercise HTTP/HTTPS requests, notification queues and click callbacks, file directory operations, and shared calendar/ToDo data. See the [preview service coverage](../tools/index.md#persistence-and-simulated-services). Bluetooth, remote calendar subscriptions and system background tasks require device tests.\n\nCover first launch, back, exit, reopen, permission denial/revocation, lost network and failed storage writes. For background work, verify continuation after exit, progress restoration and notification callbacks.\n\n## Performance\n\nUse realistic amounts of text, images and cross-day records. Compare memory at idle, after entry, after interaction and after exit; repeat to check release. Host metrics describe the host tool. Device measurements establish hardware performance and touch behavior.\n\n## Logs\n\nUSB debugging input and output have separate developer switches. Capture a complete operation, including panic and backtrace lines when present. [Serial commands](../tools/serial.md) explain how to send diagnostics safely with the intended port and page state.\n',
'design/index.md':'''# Interface design

DeskTile applications use system-rendered components. Start with the user task, navigation and information order, then choose components and states for the 800 × 480 screen.

## Page structure

The normal status bar occupies 32 px; the application uses the remaining 800 × 448 px. The standard app bar is 72 px high. Scaffold manages the shared title, back behavior and navigation. Full-screen pages and dialogs have their own presentation rules. Check root status-bar properties against real theme renders.

## Lists

Comfortable settings rows are 76 px high; compact PIDS settings rows are 54 px. `ui.listRow` defaults to comfortable and accepts `density: "compact"`. Summaries align right and toggles occupy the trailing slot. Lists fill the content width and native rows provide 24 px horizontal text padding.

Show arrows for navigation and buttons for actions. Use toggles for binary settings and selection controls for exclusive choices. Show a final divider for a fully visible short list or when a note follows it; preserve clipping when the last row is outside the viewport.

## Text and color

Use native font tiers; app-bar titles are 32 px. Check Simplified Chinese, Hong Kong Traditional Chinese and English, including long names and wrapping. System-colored icons follow theme semantics and custom-colored icons retain their supplied colors. Destructive actions use the warning color. Inspect actual icon bounds and optical centering at native size.

## Input and verification

Provide pressed, disabled and current-value states, with independent touch areas for adjacent controls. Use component scrolling and modal behavior. Check both themes, all languages, empty/error states, quick taps, long presses, scrolling, exit/reopen and notification/dialog overlays. Local preview verifies interaction and geometry; device tests establish hardware, touch and memory behavior.
''',
'services/index.md':'''# System services

The system owns service resources and caller identity. Applications submit requests through the SDK, receive results and release their resources.

| Service | Main responsibility |
| --- | --- |
| [Permissions](permissions.md) | Declare, request and handle authorization changes |
| [Private storage](storage.md) | Settings, data and read/write failures |
| [User files](files.md) | Permission-controlled file operations |
| [Network](network.md) | Requests and completion callbacks |
| [Background tasks](tasks.md) | Work managed by the system after page exit |
| [Notifications](notifications.md) | Post, update, cancel and handle clicks |
| [Bluetooth](bluetooth.md) | BLE discovery, connections and subscriptions |
| [Calendar and tasks](data.md) | Shared records and ownership |
| [Input](input.md) | System keyboard and editors |

## Permissions and results

Declare required permissions in `manifest.json`, check current authorization and give a clear reason when requesting access. Private storage is implicit application isolation. Background execution and notifications are separate permissions.

Positive request IDs mean accepted asynchronous work; negative values are immediate SDK errors. Some synchronous or already-satisfied operations return zero, according to their contracts. Save the ID and dispatch completion to its operation. Cancel page-scoped requests on navigation; manage application-scoped work with the application lifecycle.
''',
'services/storage.md':'''# Private storage and cache

Private storage holds application settings and business data. Keys are isolated by application, so separate apps may use the same `settings` key. Read packaged assets with resource APIs.

## Read settings

Use `storageReadResult` to distinguish first use from a read failure:

{{code:0}}

`-8` means not found and permits defaults. After parsing, validate the schema, field types and ranges. Keep a `schema` version for migrations. Treat malformed data separately from missing data.

## Save and remove

{{code:1}}

`storageWrite` returns the actual write result; `storageRemove` removes a key. Confirm the persisted state only after a successful save, and preserve unsaved edits on failure. One user action should commit one state change even if components report different activation/value events.

## Organize configuration

Group small settings with a common lifecycle into a versioned object. Save documents and other independent records separately. The SDK manages paths and application isolation. Fill new fields with defaults, explicitly migrate changed schemas and save the migrated result before confirming the new persistent state. Test first use, exit/reopen, updates, clearing data, uninstall and reinstall.

## Data boundaries

| Content | API | Lifecycle |
| --- | --- | --- |
| Preferences and business data | `storageReadResult`, `storageWrite` | Application-private data |
| Rebuildable thumbnails or results | `cacheRead`, `cacheWrite`, `cacheRemove` | Recreate after cache removal |
| User-selected imports and exports | [File service](files.md) | User directories and file permissions |
| Shared calendar/task/list records | [Shared data](data.md) | Service-managed identity, authorization and ownership |

Shared records use IDs returned by the service. The system derives caller identity from the context. Important business data belongs in private storage rather than disposable cache.

## Local preview

Application data lives in `.desktile/preview-data/<package-id>`, with shared service data under `.desktile/preview-data/system`. The application uses the same SDK calls. The preview tool's own settings live separately at `%LOCALAPPDATA%/DeskTile/Preview/settings.json`. Test reopening, deleting test records and permission denial as separate cases.
''',
'services/files.md':'''# User files

`DeskTile.files` provides directory, content and file-picker operations. File payload `scope: "private"` targets application-private files; `scope: "user"` targets user files and requires read/write authorization.

## List a directory

{{code:0}}

Save the positive request ID. Match it in `onRequestComplete`, check the result and decode platform JSON with `DeskTile.platformResult(payload)`. Read directories in pages, updating the current path and offset on navigation. Request lifetime scope is separate from the file payload's storage scope; use the service's request-context options for page or application lifetime.

## Read content

{{code:1}}

Results include `data_base64`, `offset`, `next_offset`, `file_bytes` and `eof`. `DeskTile.files.bytes(result)` returns bytes; `DeskTile.files.text(result)` decodes text. Continue at `next_offset` until `eof` for larger files.

## Write and choose files

`writeText` writes text and `writeBytes` writes bytes. `create_only` requires a new file; `expected_sha256` checks the content version before replacement. Check completion before refreshing a list.

{{code:2}}

`files.pick` starts the system file picker and returns the chosen path on success. Handle cancellation as an ordinary canceled action. Use [background tasks](tasks.md) for downloads or copies that must continue after exit. Exact fields are in [FilesApi](../api/platform.md#filesapi).
''',
'services/network.md':'''# Network requests

For short foreground requests, declare and obtain `network` permission, then use `DeskTile.network`. Downloads that must continue after exit use [background tasks](tasks.md).

## Submit

{{code:0}}

Save the positive request ID and show pending state. Cancel the request with `cancelRequest` when its page leaves or the user cancels, and clear the page's pending state.

## Decode the response

The completion `result` is the SDK result. HTTP status is in the first eight bytes of `dt_network_response_header_v1`: a little-endian signed 32-bit status followed by an unsigned 32-bit body length. The body follows the header.

{{code:1}}

Handle offline state, non-success HTTP status, empty content, malformed data and cancellation separately. Validate business fields and payload size before displaying the result.
''',
'services/input.md':'''# System input

The field displays content; the system keyboard edits it. Commit a successful completion and retain the original text on cancellation.

## Open the keyboard

{{code:0}}

Retain the request ID while waiting so repeated taps open one editing session. A successful payload is UTF-8 text; cancellation returns `-5`. Check storage results separately when saving the business data.

## Embedded editing

Use `presentation: "embedded_field"` and `editor_target` for a field. Multi-line text uses `embedded_document` or `embedded_plain_text` with the editor handle. The component manages cursor, scroll and focus. See [Text field](../components/text-field.md), [Document editor](../components/document-editor.md) and the date/duration pickers for numeric input.
''',
'services/data.md':'''# Calendar and tasks

`DeskTile.data` accesses shared `events`, `tasks` and `lists`. Authorized applications share records; the system maintains creator identity and revisions.

## Create and query

Declare the relevant calendar or task read/write permissions.

{{code:0}}

A positive return is a request ID. Decode completion with `platformResult` and retain the returned `id` and `revision`. Use paginated `list` and single-record `get`.

## Update and delete

{{code:1}}

Updates and deletes include the last-read revision. On conflict, reread and decide against current content. The system-maintained `creator` records ownership; calls are checked against the current application identity and permissions.

## Boundaries

Keep preferences and editing drafts in private storage. Use shared services for collaborative calendar/list/task records. Test external updates/deletion and permission revocation. See [SharedDataApi](../api/platform.md#shareddataapi) and [SharedRecord](../api/platform.md#sharedrecord).
''',
'services/tasks.md':'''# Background tasks

The system task service stores status and executes supported work. A page presents progress while the system manages the task after the page closes. Query tasks by ID or list them when re-entering.

## Workflow

1. Declare and obtain the operation's permissions, such as network, destination-file access and applicable background authorization.
2. Submit a supported task and keep its returned identity.
3. Query status on the progress page. Release UI and page requests when leaving.
4. Query again on re-entry to show completion, failure, cancellation or progress.
5. Use notification authorization and task-completion rules for reminders.

`DeskTile.tasks` and Native wrappers share the platform protocol: submission, listing, query, cancel, retry, removal and presented-progress registration. See the [API reference](../api/).

## Choose the execution model

Use network requests for short foreground work. Delegate persistent downloads and copies to task services. Background permission authorizes supported system mechanisms; arbitrary JavaScript loops follow the application's runtime lifetime. Read [notifications](notifications.md) for progress visibility and completion messages.
''',
'api/index.md':'''# SDK 1.0 API reference

Read a [service guide](../services/) for the workflow, then use these exact bundled signatures for parameters and results.

| Reference | Content |
| --- | --- |
| [JavaScript](javascript.md) | Components, resources, requests and callbacks |
| [Platform types](platform.md) | Files, tasks, shared data, Bluetooth and language |
| [UI builders](builders.md) | Lists, dialogs and common layouts |
| [Native C/C++](native.md) | Host function table and wrappers |
| [Contract](contract.md) | Properties, events, capabilities and limits |

JavaScript and Native share identity, permission and ownership rules.
''',
'publish/index.md':'''# Publish an application

## Manifest

Choose a stable reverse-domain package ID. Set the author, localized names, version and increasing `version_code`. Declare only required permissions, entries, icons and SDK target 1.0. Include all declared resources with matching filename case. Notification icons may use system or custom colors.

## Build and sign

Create and validate a development package:

{{code:0}}

Signed builds require a supported P-256 private-key PEM and Python `cryptography`:

{{code:1}}

Keep signing keys outside application sources and installers. A signature identifies the signing key; device trust configuration determines acceptance.

## Verification and updates

Test first installation, upgrade, uninstall/reinstall and permissions on target firmware. Include notification clicks, persistent tasks, offline and storage-full cases used by the app. Keep the installer, version, SDK version and test record together.

Distribute the `.dtapp`, supported device models, SDK requirements and release notes. Preserve the package ID, increment `version_code` for releases, and maintain data migrations. Install the final artifact through the [device workflow](../tools/device.md).
'''
}

GUIDES.update({
'tools/cli.md':'# Command-line reference\n\n\n## Commands\n\n| Command | Purpose |\n| --- | --- |\n| `desktile doctor` | Check SDK, Python, optional Native compiler and preview tools |\n| `desktile new <directory>` | Create a project with `--id`, `--name`, `--author` |\n| `desktile build [directory]` | Build `.dtapp`; current directory by default |\n| `desktile check <package>` | Validate paths, bounds, hashes and entries |\n| `desktile preview [directory]` | Run a JavaScript or host-built Native application |\n| `desktile screenshot [directory]` | Export static markup; select HTML with `--page` |\n| `desktile icon [directory]` | Convert PNG/SVG into icons and tiles, preview, then `--apply` |\n| `desktile image [directory]` | Convert PNG/JPEG/WebP/SVG/DTI into package image assets |\n| `desktile deploy <package> --sd <root>` | Copy to SD installer directory |\n| `desktile push <local-file> <device-path> --host <address>` | Upload through the File app FTP server |\n| `desktile pull <device-path> <local-file> --host <address>` | Download from the device user directory |\n| `desktile install <package> --port COM4` | Transfer through USB and invoke the device installer |\n| `desktile profile --port COM4 --seconds 60` | Collect device metrics |\n| `desktile docs` | Serve bundled documentation locally |\n| `desktile devices` | List serial ports |\n| `desktile monitor --port COM4` | Receive logs; `--log-file` enables rotating capture |\n| `desktile run [directory] --port COM4` | Send an installed-application launch command |\n\n## SDK and environment\n\nSDK selection priority is `--sdk`, `DESKTILE_SDK`, then the bundled SDK. Python uses `--python`, `DESKTILE_PYTHON`, then `python` on PATH. `new --kind javascript` is default; `--kind native` creates C++. Select the Native compiler with `--compiler` or `DESKTILE_COMPILER`.\n\n## Build and deployment\n\n`build --output <file>` overrides `dist/<package-id>.dtapp`. `--signing-key <PEM>` signs; otherwise a development package is produced. `deploy --replace` replaces an existing SD installer at `desktile/user/Packages/<package-id>.dtapp`. Install that package through the device application installer.\n\n## Preview and documentation\n\n`preview --locale zh-HK --theme dark` overrides saved startup settings. Locales are `zh-CN`, `zh-HK`, `en-US`; themes are light/dark. The toolbar controls appearance, bounds and host metrics. `screenshot --page src/index.html --output <directory>` selects markup and light/dark output; default output is `.desktile/preview`.\n\n`docs --port 8800` serves on `127.0.0.1`; Ctrl+C stops it. English pages are under `/en/`.\n\n## Assets and automation\n\nIcons require `--source`, `--purpose application|tile|notification` and `--mode system|custom`; `--padding 8` sets the percentage inset. Images use `--source`, `--output assets/picture.dti`, optional proportional width/height bounds, color mode and `--replace` for existing output. See [assets](assets.md).\n\nExit codes are 0 success, 1 failure and 130 cancellation. `--json` returns single-line result JSON; errors contain `error.code` and `error.message`. Build logs go to stderr. Give parallel builds separate output paths and quote paths according to the host shell.\n\n```sh\ndesktile build . --json\n```\n',
'tools/serial.md':'''# Serial debugging commands

System firmware handles these through USB debugging input. They are development and device-test commands; applications normally call SDK services.

## Connect and send

Enable USB debugging input in Settings → System → Developer options and confirm on the device. Enable output when reading diagnostics. With input disabled, the system returns before reading RX or parsing commands. Error, fatal and system-boot output follow the system logging policy.

Use 115200 baud, 8 data bits, no parity and one stop bit. End each command with LF; CR is ignored. Lines are limited to 63 bytes and overlong lines are discarded. Enabling input clears previously buffered bytes. Serial Monitor receives logs; release it before using another tool to send commands:

{{code:0}}

Keep DTR and RTS false because the device auto-reset circuit uses these signals.

## Applications and pages

| Command | Meaning and conditions |
| --- | --- |
| `diag open-app <package-id>` | Launch an installed application; the whole command must fit in 63 bytes |
| `diag app-menu` | Open the current supported App Menu while touch is idle |
| `diag settings <page>` | Open `home`, `battery`, `system`, `developer` or `install` |
| `diag files-path <path>` | Open a directory while Files is foreground |
| `diag scroll <offset>` | Set an absolute, clamped pixel offset on supported settings lists, pickers, Timeline, PIDS/Mosaic settings, SDK scroll views or desktop editing |

`desktile run . --port COM4` obtains the project ID and sends `diag open-app`. Confirm the actual launch through device output and display.

## Touch injection

Coordinates cover the actual 800 × 480 screen including the status bar: x=0–799, y=0–479.

| Command | Meaning and conditions |
| --- | --- |
| `diag input-tap <x> <y> [duration]` | Inject down/up through system touch processing, default 60 ms, range 20–700 ms; touch must be idle |
| `diag input-drag <x> <from-y> <to-y>` | Inject vertical dragging/release on supported lists; y=104–479, keyboard and App Menu closed, touch idle |
| `diag tap <x> <y>` | Direct click dispatch; SDK apps receive pointerDown/pointerUp, other pages their click handler. Use input-tap for full feedback tests |
| `diag long-press <x> <y>` | Invoke a supported long-press action or desktop editing; modal permissions/App Menu restrict it. It invokes the action directly rather than measuring physical hold recognition |
| `diag app-pointer <phase> <x> <y>` | Calligraphy only; phase 0 down, 1 move, 2 up, 3 cancel |

These execute actual actions. Check the current page and target before injection.

## State and performance

Diagnostic output requires USB debugging output.

| Command | Result |
| --- | --- |
| `diag app-state` | App/input state, internal RAM, PSRAM, fonts, lists, desktop cache, dialog and app-specific diagnostics |
| `diag app-ui` | Page, keyboard and runtime state; SDK component tree/layout or calendar state |
| `diag app-names` | Installed built-in names in Simplified Chinese, Traditional Chinese and English |
| `diag profile` | Time the next page draw; Mosaic includes rendering phases |
| `diag progress` | Progress components, installer and task state |
| `diag motion` | Scene, menu, construction and transition state |
| `diag scan-reset` | Read and reset display-scan diagnostics |
| `diag desktop-layout` | Tile IDs, coordinates, sizes, checksum and editing state |
| `diag desktop-trace-start` | Start desktop performance tracing |
| `diag desktop-trace-stop` | Stop and print desktop tracing samples |
| `diag desktop-status` | Redraw desktop-edit status region when cached editing and idle touch permit |

## DevKit protocol

Both debug switches are required. Replies start with `[DevKit] ` followed by one JSON line. `desktile install` manages the transfer and installer flow.

| Command | Purpose |
| --- | --- |
| `dev hello` | Protocol version, chunk size and package limit |
| `dev begin <bytes> <crc32>` | Start staging; CRC32 is hexadecimal |
| `dev put <offset> <base64>` | Send up to 32 bytes; wait for the next-offset acknowledgment |
| `dev commit` | Verify transmission and enter installation |
| `dev status` | Transfer/install state |
| `dev abort` | Cancel uncommitted transfer or confirmation wait; active commit completes in the system |
| `dev metrics` | Read compact metrics and renew the three-second collection lease |
| `dev metrics-stop` | Stop additional rendering timing |

## Flash preparation

`diag prepare-flash` ends storage access and reboots into download mode. It interrupts the current device session and belongs to a prepared firmware-maintenance workflow.

## Troubleshooting

Check exclusive port ownership, baud rate, debug switches, LF termination, length and command-specific page requirements. Release touch before idle-only commands. `dev` has structured replies; `diag` effects appear in the display or diagnostic output. This reference follows System `runUploadCommand`.
''',
'services/permissions.md':'''# Permissions

Declare purposes in manifest `permissions`, then check and request access through the SDK. System settings manage authorization by package identity and affect later calls.

## Request access

For networking, declare `"permissions": ["network"]`. Its numeric ID is 0:

{{code:0}}

States are 0 (not asked), 1 (allowed) and 2 (denied). A positive request ID means wait for `onPermissionResult`; zero means already authorized; a negative result means the request was rejected. Match the callback's request ID and permission and handle refusal in the relevant feature.

## Permission identifiers

| Purpose | Manifest name | ID |
| --- | --- | --- |
| Network | `network` | 0 |
| Private storage | `private-storage` | 1 |
| Read user files | `user-files.read` | 2 |
| Modify user files | `user-files.write` | 3 |
| Bluetooth | `bluetooth` | 4 |
| Notifications | `notifications` | 5 |
| Supported background work | `background` | 6 |
| Keep display awake | `display.keep-awake` | 7 |
| Basic device information | `device.basic-info` | 8 |
| Calendar read/write | `calendar.read`, `calendar.write` | 14, 15 |
| Tasks read/write | `tasks.read`, `tasks.write` | 16, 17 |

Private storage is implicit application capability. IDs 9–13 are system-management capabilities for system-trusted applications. See the [complete definitions](/api-source/permissions.json).

## Revocation and failures

Check every call's actual result. Revocation, application disabling and device-state changes can invalidate previous successes. Release requests/subscriptions and show the result in the affected feature. Background and notification permissions are separate; see [tasks](tasks.md).
''',
'services/bluetooth.md':'''# Bluetooth BLE

JavaScript uses `DeskTile.bluetooth`; Native uses `<desktile/bluetooth.hpp>`. The ESP32-S3 backend provides BLE central and observer roles, scanning, connections, pairing, GATT discovery, reads, writes and characteristic notifications.

## Prerequisites

Declare and obtain `bluetooth` permission. System settings control radio power. Query `status.enabled`, `ready`, `uuidGatt` and the connection list before acting. Methods return a request ID or immediate error; completion returns JSON. Wireless connection, read and subscription results also arrive through `nextEvent`.

## Scan and receive events

{{code:0}}

`nextEvent` timeout returns `event: null`. Start the next wait after completion, cancel the owning request on exit and stop scanning. Use `listen` for sustained passive advertisements and `stopScan` to end it. Identify devices by address and address type; a name may be absent.

## Connection ownership

`connect(address, addressType)` creates an application-owned connection. Wait for `connected` before GATT operations. Use the scan-provided address type: 0 public or 1 random.

Connections established in system settings have `system: true`. `attach(connection)` obtains read, discovery and subscription access. `detach(connection)` removes access and subscriptions while the system retains its connection. Writing, disconnecting and pairing require ownership. Application-owned connections are released with their context; permission revocation reaches active contexts.

## UUID operations

UUID strings may be 16-bit, 32-bit or full 128-bit.

| Method | Arguments after connection | Purpose |
| --- | --- | --- |
| `discoverServices` | optional service UUID | Discover services |
| `discoverCharacteristics` | service UUID, optional characteristic UUID | Discover characteristics |
| `discoverDescriptors` | service UUID, characteristic UUID, optional descriptor UUID | Discover descriptors |
| `readUuid` | service UUID, characteristic UUID | Resolve and read a value |
| `subscribe` | service UUID, characteristic UUID | Configure CCCD and receive updates |
| `unsubscribe` | service UUID, characteristic UUID | Stop updates |

{{code:1}}

Discovery emits individual results and a final `complete: true` event, including empty results. Subscription completion reports the value handle, which identifies later `notification` events. A connection runs one GATT procedure at a time; wait for completion when busy. Known handles can use `read`/`write`. Writes accept even-length hexadecimal data, at most 244 bytes. Device protocols define UUIDs, byte order, units and security.

## Pairing

Connection, encryption, authentication and bonding are distinct. Call `pair` when required by the protocol. A `pairing` event supplies `pairingAction`, `prompt` and `passkey`. Reply through `pairingReply(connection, action, prompt, passkey, accept)`. Preserve leading zeros in six-digit codes and follow the user's numeric-confirmation choice. Stale prompts and other applications' connections are rejected. Check final `securityChanged` results and flags.

## Capacity and cleanup

The backend supports three connections, one scan/listen owner, 32 queued events and one pending event wait per context. Consume events and check `droppedEvents`. Distinguish immediate call errors, request completion and final wireless events. Clean up on power-off, disconnection, revocation and exit. See [platform types](../api/platform.md) and [Native API](../api/native.md).
''',
'services/notifications.md':'''# Notifications

The system manages application identity, queueing, banners and click callbacks. JavaScript and Native share delivery and authorization rules. Check capabilities and obtain `notifications` permission for the relevant operation.

## Authorization and background work

Declare `notifications` in the manifest. Foreground delivery needs notification authorization. Background work also needs `background` and permissions required by its operation. Supported system tasks provide continued execution; notification permission authorizes visible messages.

## Notification icon

{{code:0}}

| Mode | Appearance | DTI encoding |
| --- | --- | --- |
| `system` | Banner foreground color | alpha8, encoding 3 |
| `custom` | Supplied colors and transparency | RGB565 0 or masked RGB565 2 |

The icon is square, 16–128 px per side. Banners render it at 32 px; 32 × 32 resources map directly. Omission uses the system bell. Package and installer validation check paths, dimensions, encoding, length and integrity.

## Post, update and cancel

After authorization:

{{code:1}}

Positive IDs complete through `onRequestComplete`; immediate failures return negative SDK errors. Accepted messages enter the queue. An ID is scoped to its application. Updating replaces all fields; omitted body, callback data and event time use defaults. Updating or canceling an unknown ID returns `DT_ERR_NOT_FOUND`.

## Click callback

{{code:2}}

The application registers its own `document` route. Clicking a banner enters the owning application and delivers `id` and `data`; an already foreground application receives it directly. Native uses `DT_EVENT_NOTIFICATION`, `dt_notification_event_v1` and `DT_LAUNCH_NOTIFICATION` when launched from a notification.

## Event time

`eventTime` is an integer Unix-seconds timestamp from 1 to 253402300799. It describes the event discussed by the notification and produces relative labels such as now, five minutes ago or in ten minutes. Omission uses publication time.

{{code:3}}

This posts immediately about a meeting ten minutes away. Deferred posting needs a supported task/event mechanism to submit at that time.

## Native

{{code:4}}

The final optional `post`/`update` argument is event time in Unix seconds. The C ABI passes UTF-8 JSON to `notification_post`.

## Queue and lifecycle

| Item | Rule |
| --- | --- |
| UTF-8 sizes | ID 1–64 bytes, title 1–128, body up to 320, data up to 256 |
| Queue | Eight entries including the current banner; full returns `DT_ERR_BUSY` |
| Visibility | Five seconds; updating the visible banner restarts its timer |
| Pause | Touch, system modal interaction or sleep pauses timing |
| Removal | Expiry, swipe dismissal or cancellation removes the transient record |
| Exit | Accepted banners survive application exit |
| Authorization/data | Revocation, disabling, uninstall or clear-data removes the application's queue |

The current service supplies local banners. Persistent history, a notification center and remote push are separate capabilities.

## System-task completion

On success or final failure, the system checks notification authorization and whether the task's progress is currently presented. Downloads, copies, moves, verification and visible calendar-sync tasks use this rule.

Report actually visible tasks with `DeskTile.tasks.presented([taskId])`, up to 12 IDs. Update when scrolling, navigating or being covered; send an empty array when leaving. Application exit clears this registration. Polling a list alone does not mark progress visible.

Completion `data` is a JSON string such as `{"taskId":"123"}`. Parse it, query the task and open its page.
''',
'components/scaffold.md':'''# Scaffold

Scaffold owns the app bar, current page and navigation entry. Business pages own their content and events. Keep the current page, title and selected navigation item in one state source.

## Integration

JavaScript uses `scaffold.js` and `navigation.js`; Native uses `<desktile/scaffold_view.hpp>`. The reading templates include complete reading/settings pages. [Navigation](navigation.md) explains hidden, icons-only and expanded states, content placement and transitions.

## Lifecycle

Load page content on entry, cancel page-scoped requests on departure and release application-scoped resources on exit. Persist reading position and preferences with explicit save-error handling.

## Events

Let Scaffold consume app-bar/navigation events first, then forward remaining events to the current page. Reacquire component handles after rebuilding and validate request ownership before touching a page from an asynchronous callback. See [JavaScript API](../api/javascript.md) and `sdk-bundle/examples/scaffold-js` / `scaffold-native`.
''',
'components/navigation.md':'''# Navigation

Nav switches pages inside an application. It sits below the app bar and left of content. Scaffold creates entries, handles input and selection, and supplies the content slot. The right-side [App Menu](app-menu.md) is a separate system surface for application actions.

## States

| State | Content | Default width |
| --- | --- | --- |
| `hidden` | Full-width page | 0 px |
| `labels` | Icons and labels | 320 px |
| `icons` | Icons and selection indicator | 96 px |

Default navigation switches between hidden and expanded. `dismissed: "icons"` cycles expanded, icons, then hidden. `permanentIcons: true` keeps the icon rail and switches between icons and labels. The application chooses its state relationship.

Rows are 64 px high, with 32 × 32 px icons at x=32 and expanded labels at x=96. Top and bottom padding are 8 px. `bottomCount` anchors trailing items such as settings to the bottom. Up to eight items are supported; a left accent mark identifies the selected page.

## Content placement

The icon rail reserves 96 px. When expanded, an icon-preserving configuration continues to reserve 96 px and overlays the rest. A hidden-on-dismiss configuration overlays content while expanded. Status bar and app bar stay fixed. Scaffold updates the content slot's position and width; business pages lay out within that slot.

## JavaScript

{{code:0}}

Mount through `shell.mount(DeskTile, contentMarkup, actionsMarkup)` and forward events:

{{code:1}}

`handleNavigation` is application logic: check the returned result; `action === "selected"` opens `result.index`, while `action === "original"` performs the original back/exit action. Dispatch unconsumed events to the current page. `select`, `setTitle` and `setEntry` update selection, title and entry state. Refresh on theme changes and destroy on exit.

## Native

{{code:2}}

Forward host pointer, activation and tick events through `shell.event(kind, payload)`. Act on `ScaffoldEvent.action` and stop page dispatch when `consumed` is true. The [reading templates](../examples/) contain complete implementations.

## Motion

Expansion takes 350 ms; collapse/retraction takes 120 ms with `cubic-bezier(0.1, 0.9, 0.2, 1)`. Bounds and content placement transition together while icons and text retain their sizes. All three state pairs work in both directions.

On the device, Scaffold submits final layout and the system composites a cached previous content region at display cadence. An 800 × 376 region temporarily uses 601,600 bytes of PSRAM; the final frame reuses display buffers. Release follows completion and the display scanner releasing references. Allocation failure presents the final layout directly.

Input pauses during the transition and resumes against final geometry. Desktop preview interpolates dimensions; keep JavaScript `shell.tick(now)` running or forward Native tick events. Capability detection selects the cached device path. Set `animateNavigation: false` or Native `options.animateNavigation = false` for immediate changes.

## Preview

### Hidden

![Hidden](/previews/navigation/hidden.png)

### Expanded

![Expanded](/previews/navigation/labels.png)

### Icons only

![Icons](/previews/navigation/icons.png)
''',
'components/app-menu.md':'''# App Menu

App Menu holds application-wide actions such as Settings, About or reading preferences. The system owns presentation and input; the application registers items and handles callbacks. Page-specific actions use [Menu](menu.md) in an application-owned overlay.

## Open and register

In local preview, use the toolbar App menu action, F10 or a right click. The system side menu animates in and out. Define unique positive `action` IDs:

{{code:0}}

Event 9 is `app-menu`; `target` is the registered action and `value` is the toggle's current value. The system changes the visual check state before sending the event. The application persists the setting and restores/re-registers on failure.

## Items and updates

SDK 1.0 allows three registered items. Each registration replaces the current menu; an empty array clears it. Use the application's current language and register again when language or availability changes.

| Type | Meaning |
| --- | --- |
| 0 | Action |
| 1 | Toggle |
| 2 | Disabled action |
| 3 | Disabled toggle |

`checked` is 0 or 1. `icon` is a system ID, with a default when omitted. Labels must be valid UTF-8 within the native item capacity. Zero means successful registration, negative values are errors. Native uses `dt_app_menu_item_v1`, `DT_SYSTEM_APP_MENU_COMMAND` and `DT_EVENT_APP_MENU` with the same rules.
''',
'components/patterns.md':'''# Component patterns

`components.js` generates native component markup for settings, confirmation dialogs and steppers. Generated projects already contain the SDK modules in `ui`.

{{code:0}}

Mount generated markup in a page or Scaffold. The following source examples show actual slot placement with their original labels.

## Trailing summary

{{code:1}}

## Trailing toggle

{{code:2}}

## Number stepper

{{code:3}}

## State and density

`listRow` defaults to 76 px; `density: "compact"` uses 54 px. Summaries align right unless `summaryPosition: "middle"` is explicitly requested. Handle `value-changed`, save the preference and confirm persistent state; restore `checked` on failure. Update dependencies with `enabled`.

## Confirmation and menus

`ui.confirmation` accepts title, body and actions. Choose cancel/destructive variants by meaning. `ui.menu` creates a menu with an optional header. See [builders](../api/builders.md), [Scaffold](scaffold.md) and the individual component pages for dimensions and behavior.
''',
'tools/index.md':"# Development tools\n\n\n## VS Code\n\nExplorer offers project creation, environment checks, build, preview, package inspection, USB installation, device metrics, SD copying, launch, serial monitoring, documentation and SDK selection. Commands are also available in the command palette. Builds can be canceled; details go to the DeskTile DevKit output channel.\n\n### Interface language\n\nThe extension follows VS Code by default. **Interface language** selects automatic, Simplified Chinese or English for extension panels and prompts; reload afterward. Command-palette titles follow the editor language. The preview application's system language is a separate preview setting.\n\n### Project creation\n\nChoose the application type and identity, select a parent directory and enter a new folder name. The extension shows the destination and opens the completed project.\n\n## Local interactive preview\n\nJavaScript uses the matching QuickJS runtime. Native compiles project source into a Windows x64 module and runs its entry, lifecycle and events through NativeAppRunner. Both use the native component engine, supporting clicks, navigation, drag/wheel scrolling, timers, input and local persistence.\n\nThe toolbar offers theme, layout bounds, host performance, FPS cap, App Menu and settings. **100% is 800 × 480 physical screen pixels**. Toolbar controls follow host DPI outside the application viewport and wrap when needed. Settings include scale, fonts, system language, simulated Wi-Fi, battery level and charging.\n\nSystem languages are Simplified Chinese, Hong Kong Traditional Chinese and English. Apply sends the SDK language-change event. Applications following the system refresh their text; explicit application language choices remain in force.\n\nEsc goes back. Right click, F10 or App menu opens the native side menu with slide animations and registered actions. Cancel or an outside click dismisses it; Exit runs the application exit path. Host text dialogs and file pickers provide input/import/export.\n\nThe toolbar uses the computer's system font. Preview fonts include MiSans, Cabin, Noto Sans and Source Serif 4. Device Transport Sans maps to MiSans in the preview distribution.\n\nHost metrics show draw FPS, application update time, paint time and scroll-cache use; JavaScript also shows its memory limit. 15/30/60 FPS limits help inspect low-frame-rate behavior. Measure ESP32 CPU, PSRAM, SD and radio performance on the device.\n\n### Persistence and simulated services\n\nPrivate key-value data persists in `.desktile/preview-data/<package-id>`. Calendar, ToDo and application language use the device service implementation with host filesystem storage under `.desktile/preview-data/system`. Permission requests use preview confirmation.\n\nJavaScript and Native applications use the same SDK interfaces for these services:\n\n| Service | Local preview behavior |\n| --- | --- |\n| Network | Asynchronous HTTP/HTTPS GET and POST over the computer's network, including timeout, cancellation and completion callbacks. HTTPS uses Windows certificate trust. Up to four requests run concurrently; each response is limited to 32 KiB. |\n| Notifications | The device queue, banner and slide animations support posting, updating, cancelling, click callbacks and swipe dismissal. App Menu and input panels suspend display until closed. |\n| Files | The device file service handles directory listings, metadata, range reads, atomic writes, directory creation, rename, move and delete. Private files are isolated by package; user files require read/write permissions. Replacing an existing user file requires its original SHA-256. |\n| File picker | The user can select a computer file to read or a new path to export. Replacement of existing computer files is reserved for a future picker adapter. |\n| Calendar and ToDo | The device repositories and permission rules store calendars, lists and tasks. |\n\nFile API private directories are stored in `.desktile/preview-data/system/desktile/data/<package-id>/files`; the simulated user directory is `.desktile/preview-data/system/desktile/user`. Place test files there directly. Preview storage and files explicitly selected through the computer picker are managed separately.\n\nBluetooth, remote calendar-subscription refresh and system background tasks require device validation. `files.copy` runs through a background task and is included in that scope. Notification previews cover the current application process; verify post-exit background lifecycles on the device.\n\nPreview settings are saved separately in `%LOCALAPPDATA%/DeskTile/Preview/settings.json`: language, theme, font, scale, bounds, metrics, FPS cap and simulated status bar. Explicit `--locale` and `--theme` override saved values. Invalid values fall back to defaults. Tests can isolate configuration using `DESKTILE_PREVIEW_CONFIG_DIR`. Saving writes a temporary file before replacement.\n\n## Native preview\n\nInstall Visual Studio 2022 or Build Tools with Desktop development with C++, MSVC x64 and Windows SDK. DevKit detects it automatically and reports missing dependencies.\n\n```sh\ndesktile preview . --locale zh-HK --theme light\n```\n\nEach launch builds C/C++ source beneath `src` into `.desktile/preview-native/app.dll` using C++17 and selected SDK headers, including nested source/include folders. GCC export annotations are adapted only in temporary build copies. This host module is separate from the device ELF and `.dtapp`. Run trusted Native source; ESP-IDF, chip registers and Xtensa assembly need host implementations.\n\n## Other tools\n\nStatic screenshot export produces light/dark PNGs. Manifest JSON Schema checks, JavaScript types, HTML `dt-` completion and Native include-path configuration aid editing. See [assets](assets.md), [CLI](cli.md), [device workflow](device.md) and [serial commands](serial.md).\n",
'tools/device.md':"# Device workflow\n\n\n## SD installation\n\nEnd device SD access before moving the card to the computer. Select its root containing `desktile`:\n\n```powershell\ndesktile deploy .\\dist\\com.example.myapp.dtapp --sd E:\\\n```\n\nDevKit validates and copies the package to `desktile/user/Packages`. Safely eject, return the SD and install through Settings → Applications → Install application.\n\n## Install from the computer\n\nEnable USB debugging input and output. Release any monitor using the same port. Choose **Install on Device**, or:\n\n```powershell\ndesktile install .\\dist\\com.example.myapp.dtapp --port COM4\n```\n\nThe tool checks the local package and transfers chunks into SD staging at `desktile/install/.devkit`. The device checks length and transfer CRC, then invokes the system installer for structure, resource integrity, SDK and version checks. Native packages additionally require the Native-install setting and on-device risk confirmation.\n\nSuccess returns `complete`; an existing identical version returns `already-installed`. Downgrades, corrupt packages, storage failures and cancellation have separate results. Updates preserve private data through the system's existing rules.\n\nThe limit is 16 MiB at 115200 baud. Progress reports sent bytes and percentage. Ctrl+C ends the host operation; more than 15 seconds of transfer inactivity closes and removes incomplete staging. Once an install commit begins, the system completes its transaction. This requires System firmware with DevKit protocol 1.\n\n## Device performance\n\nChoose **Device Performance**, select a port and click Start. Once per second the panel reads free internal RAM/PSRAM, rendering CPU time and scroll/dialog buffer use. It retains 120 samples on the computer. Rendering CPU milliseconds per second includes partial redraws and differs from display scan rate, network latency or total application CPU.\n\nStop or close the panel to end collection. Each sample request renews a three-second device lease, so unexpected host exit also stops extra timing. Device state and counters occupy 24 bytes. Free memory reads existing counters.\n\n```powershell\ndesktile profile --port COM4 --seconds 60\n```\n\n## File transfers\n\nStart the FTP server in the device File app and connect both devices to the same LAN. Use the address, port and account shown there. `push` and `pull` transfer individual files. Remote `/` maps to `desktile/user`, so `/Downloads/demo.txt` appears in the File app's Downloads directory.\n\nSet the password for the current PowerShell session:\n\n```powershell\n$credential = Get-Credential -UserName desktile -Message 'File app FTP account'\n$env:DESKTILE_FTP_PASSWORD = $credential.GetNetworkCredential().Password\ndesktile push .\\demo.txt /Downloads/demo.txt --host 192.168.1.20 --user $credential.UserName\ndesktile pull /Downloads/demo.txt .\\downloaded-demo.txt --host 192.168.1.20 --user $credential.UserName\nRemove-Item Env:DESKTILE_FTP_PASSWORD\n```\n\nThe default port is `2121`; override it with `--port`. The destination directory must exist. Existing destination files produce an error; choose a new name. Uploads use a temporary file and SHA-256 readback verification before commit. Downloads use a local temporary file and verify the length before commit. Results include byte count and SHA-256. FTP uses a plaintext LAN connection intended for trusted development networks; stop the File app server when finished.\n\nUSB `install` installs application packages; file `push` and `pull` use the network connection described above.\n\n## Serial workflow\n\nThe developer page controls input and output separately; enabling input requires on-device confirmation. Ports are exclusive at 115200 baud. Install `pyserial`, list ports with `desktile devices`, and capture logs with `desktile monitor --port COM4 --log-file serial.log`. Ctrl+C releases the port. Logs rotate at 5 MiB, keeping the current and previous file. The extension saves project logs to `.desktile/serial.log`.\n\n`desktile run . --port COM4` sends a launch request for the current installed package. Verify its result on the device. The complete [serial command reference](serial.md) lists parameters and page requirements.\n\n## Verification\n\nCheck localized names, themes, permission denial/re-authorization, exit/reopen, continued tasks, persisted data and clear-data behavior. Use device touch and scroll tests in addition to local layout checks.\n",
'tools/assets.md':'''# Images, icons and tiles

Create application, tile and notification icons from PNG or SVG. Conversion produces `.dti` resources and updates the manifest. **Build Application** packages code and resources into `.dtapp`.

## Icon editor

1. Open the project and choose **Create icons and tile resources**.
2. Select application, notification, default tile or an individual tile size, then choose an image.
3. Select system coloring or retained image colors.
4. Set the surrounding padding percentage. The complete asset is centered proportionally in a square canvas.
5. Inspect all four tile sizes and light/dark backgrounds. Each size has independent image, mode and padding; click a tile to select it. **Use default tile icon** resets that size to the default asset.
6. Save to the project, then build the installer.

Saving creates a resource directory and updates manifest paths. Original images and editor parameters remain in `.desktile`; closing releases conversion drafts. The editor manages one icon set. Projects with multiple `icons.appearances` retain their existing per-appearance paths.

## Color and sizes

System coloring preserves alpha shape and uses theme color. Custom mode stores RGB565 with binary transparency; partially transparent edges become transparent or opaque. Previews decode the actual DTI pixels.

Notification icons are 32 px, application/default tile icons are 96 px. Size-specific tile icons are 40, 64, 80 and 128 px. Both modes support per-size resources. Install conversion dependencies:

{{code:0}}

SVGs should have complete paths. Convert external images, styles and fonts to self-contained vector paths in the source tool.

## CLI icons

Generate and inspect the returned light/dark previews:

{{code:1}}

Apply the same parameters and build:

{{code:2}}

Purposes are `application`, `tile` and `notification`. Creating a notification icon updates resources; the application declares notification permission separately.

## Page images and custom symbols

The image command accepts PNG, JPEG, WebP, SVG and DTI. It preserves aspect ratio and defaults to original dimensions. SVG requires a viewBox or explicit pixel size. Output goes in package assets:

{{code:3}}

Width/height are maximum bounds. Both specified dimensions fit the complete image proportionally; one specified dimension determines the other. Results report actual dimensions and decoded theme previews. Existing output requires `--replace`.

{{code:4}}

Keep component and resource aspect ratios equal. Default `custom` uses RGB565 and binary transparency; `system` retains alpha and uses the current accent. Limits are 4096 px per side and 1,048,576 total pixels; resize larger sources. Decoding supports RGB565, RLE RGB565, masked RGB565 and theme alpha formats. See the [icon catalog](../components/icon-catalog.md).
''',
'examples/index.md':'''# Application examples

## Complete application source

| Application | Runtime | Reference topics |
| --- | --- | --- |
| [Notes](notes.md) | JavaScript | Editor, private storage, import/export, unsaved changes |
| [Timer](timer.md) | JavaScript | Duration, countdown, overdue state, restoration |
| [ToDo](todo.md) | Native C++ | Shared tasks, permissions, lists, forms, asynchronous work |

Each page links a source ZIP with manifest, entries, icons and languages. The same code is in `sdk-bundle/examples`. Open a folder and build through VS Code or `desktile build .`.

The three examples use Apache-2.0. Packages include `LICENSE` and original icon licenses under `licenses/`. They retain their real package IDs; change ID, name and author when creating your own application.

## JavaScript reading template

`sdk-bundle/examples/scaffold-js` includes reading/settings pages, three languages, text-size persistence and save-error handling. Project creation copies it and sets application identity.

## Native reading template

`sdk-bundle/examples/scaffold-native` uses the public C++ wrappers with the same page structure. Device builds require the Xtensa toolchain; local builds use the [Native preview](../tools/#native-preview) toolchain.

## Adapting an example

Start with titles/body text in language resources, then add pages and business logic. Consult [components](../components/) and [services](../services/) for correct usage.
''',
'examples/notes.md':'''# Notes

A JavaScript application demonstrating list/editor navigation, private persistence and text import/export through system files.

[Download source](/downloads/notes-js.zip)

## Read the source

Read `manifest.json` for entry points, permissions and icons, `src/index.html` for lists/editor/dialogs, `src/main.js` for drafts, saves, dirty-state confirmation and asynchronous file results, and `locales/` for three-language messages.

## Data and actions

The private key `notes-v1` stores content. Check `persist`, `save` and `dirty`: reads are checked before parsing and saved state changes only after success. File permissions are requested at the operation and the page updates after asynchronous completion. See [storage](../services/storage.md) and [files](../services/files.md).

## Build

{{code:0}}

## Verify

Create/save/reopen, then edit and exercise Save, Discard and Cancel. Test import/export with allowed and denied file permissions. Source count/length limits are choices for this application. The download contains Apache-2.0 and icon notices.
''',
'examples/timer.md':'# Timer\n\n\n## Read the source\n\nRead the manifest, `src/index.html` for pickers/display/buttons, `src/main.js` for time calculations, transitions, updates and persistence, and `locales/` for the three languages.\n\n## State\n\nFollow start, stop and restore, and how updates calculate remaining and overdue time. The duration component supplies a numeric value; the application owns the timer state. Restoring after exit uses saved data and recalculation. Independent continued work uses [tasks](../services/tasks.md); reminders use [notifications](../services/notifications.md).\n\n## Build\n\nThe three shortcuts default to 1, 5 and 15 minutes. Starting a new timer moves its duration to the front of the three most recently started distinct durations. Selecting a duration or resuming a paused timer preserves the existing order. Shortcuts persist with timer state across restarts. The `timer-v1` private record reads older formats and migrates them when next saved.\n\n```sh\ndesktile build .\ndesktile check dist/hk.caner.desktile.timer.dtapp\n```\n\n## Verify\n\nStart a short timer, check zero and overdue states, exit/reopen during counting and check restoration, then stop and change duration. Confirm buttons, numbers and persistent state agree. Source and icon notices are included under Apache-2.0 and their respective asset licenses.\n',
'examples/todo.md':'''# ToDo

A Native C++ application using public SDK access to the shared task repository. Entry, model, view and controller are separated for a multi-page application.

[Download source](/downloads/native-todo.zip)

## Read the source

| File | Purpose |
| --- | --- |
| `manifest.json` | Native entry and task read/write permissions |
| `src/main.cpp` | Entry, lifecycle and events |
| `src/TodoModel.h` | State and records |
| `src/TodoController.h`, `TodoController.cpp` | Requests, actions and page coordination |
| `src/TodoView.cpp` | Lists, forms and dialogs |
| `src/TodoSchedule.cpp` | Task scheduling fields |
| `src/TodoTexts.h` | UI messages |

## Services

The shared service owns storage and permission checks. Requests belong to the application context and complete through events. Handle in-flight requests and keyboard sessions on departure. Read [shared data](../services/data.md), [permissions](../services/permissions.md) and [Native API](../api/native.md).

## Build

Install the ESP32-S3 Xtensa toolchain and replace the compiler path:

{{code:0}}

The extension uses `desktile.compilerPath` for the same toolchain.

## Verify

Test allowed/denied reads and writes; create, edit, complete and delete tasks; return during keyboard input; exit/reopen and compare records with the current list. Apache-2.0 source and icon notices accompany the download.
'''
})

def generate_references():
    """Reuse exact API declarations and machine-readable values."""
    for name,title,lead in [
      ('javascript','JavaScript API','`DeskTile` is the global provided by the runtime. Projects copy the declarations into `.desktile/types` for editor completion. Positive request IDs identify accepted asynchronous work; negative results are SDK errors. Check each signature for synchronous or already-satisfied results.'),
      ('platform','Platform service types','Read the [service guides](../services/) before using these signatures. File, task, storage, locale and Bluetooth APIs share the application context and permission rules.'),
      ('builders','UI builders','Read [component patterns](../components/patterns.md) for common layouts. These are the same declarations used for editor completion.'),
      ('native','Native API','The host function table uses the application context to isolate components, requests, storage and resources. Check `abi_version` and optional capabilities. `dt_bytes` borrows memory for the call; copy data needed after a callback. If a read buffer is too small, allocate the returned size and retry.')]:
        source=(DOCS/'api'/f'{name}.md').read_text(encoding='utf-8')
        body=f'# {title}\n\n{lead}\n'
        if name=='native':body+='\n## Host function table\n'
        for index,match in enumerate(re.finditer(r'```[^\n]*\n.*?```',source,re.S)):
            headings=re.findall(r'^#{2,3} (.+)$',source[:match.start()],re.M)
            label=headings[-1] if headings else 'Conventions'
            label={'使用约定':'Conventions'}.get(label,label)
            body+='\n'+('### ' if name=='native' else '## ')+label+'\n\n'+match[0]+'\n'
        if name=='native':
            body+='\n## C++ wrappers\n\nThe wrappers use the same C ABI. [Download sdk.h](/api-source/include/sdk.h) for structures, events and enums.\n\n'
            body+='| Header | Reference |\n| --- | --- |\n'
            body+='\n'.join(line.replace('查看声明','View declaration') for line in source.splitlines() if line.startswith('| `'))+'\n'
        else:body+='\n## Type declarations\n\n[Download](/api-source/'+{'javascript':'desktile','platform':'platform','builders':'components'}[name]+'.d.ts).\n'
        write('api/'+name+'.md',body)
    contract=json.loads((ROOT.parent/'sdk/contract/desktile-api.json').read_text(encoding='utf-8'))
    body='# Properties, events and limits\n\nSDK ABI: 1.0. Strings use UTF-8 and colors use `0xRRGGBB`. Handles belong to the application that creates them. Query optional capabilities before calling their APIs.\n\n## Properties\n\nProperty IDs follow this zero-based table. HTML uses names; scripts and Native calls use the matching enums.\n\n| ID | Property | Type | Enum values |\n| --- | --- | --- | --- |\n'
    for i,p in enumerate(contract['properties']):body+=f"| {i} | `{p['id']}` | {p['value']} | "+', '.join(f'{k}={v}' for k,v in p.get('values',{}).items())+' |\n'
    for title,head,rows in [('Events','ID | Event',enumerate(contract['events'])),('Runtime limits','Item | Limit',contract['limits'].items()),('Optional capabilities','Capability | Bit value',contract['capabilities'].items())]:
        body+='\n## '+title+'\n\n| '+head+' |\n| --- | --- |\n'+''.join(f'| {k} | {v} |\n' for k,v in rows)
    body+='\n## Source definitions\n\n[Contract JSON](/api-source/desktile-api.json), [permission definitions](/api-source/permissions.json), and [permission guide](../services/permissions.md). Execution budgets apply to callbacks; use asynchronous services for long operations.\n'
    write('api/contract.md',body)
    source=(DOCS/'components/icon-catalog.md').read_text(encoding='utf-8')
    rows='\n'.join(line for line in source.splitlines() if line.startswith('| !['))
    write('components/icon-catalog.md','# Icon catalog\n\nGenerated from the device `UiIcons::Id` and original assets. [Download all DTI files and licenses](/icon-catalog/icons.zip). Source SVGs are in the SDK `resources/icons/source`; IDs are in `resources/icons/catalog.json`.\n\n## Using an icon\n\nCopy DTI files into package assets and load them with [Image](image.md). SDK 1.0 `dt-icon` accepts IDs 0–120; JavaScript Scaffold, list and menu builders accept 0–103. Use packaged DTI resources for other icons. Preserve square bounds and choose a symbol matching the action.\n\n'+ '\n\n'.join(code_blocks('components/icon-catalog.md'))+'\n\n## All icons\n\n| Preview | Name | Device ID | Resource |\n| --- | --- | --- | --- |\n'+rows)
    body='# Component catalog\n\nEach component page explains its purpose, usage, properties, events and real light/dark renders. Start with [Scaffold](scaffold.md), [Navigation](navigation.md) and [patterns](patterns.md).\n'
    for group in ('Layout','Content','Actions and input','Lists and dialogs'):
        body+='\n## '+group+'\n\n'
        for name,(title,usage) in USAGE.items():
            if TITLES[COMPONENTS[name][1]]==group:body+=f'- [{title}]({name}.md)\n'
    body+='\n## System surfaces and combinations\n\nFAB and color swatches are Button variants. Page menus use `ui.menu`; [App Menu](app-menu.md) is registered with the system. Public Dialog offers embedded and centered presentations; the system also has its own side dialog. Native system radio drawing is available internally; SDK 1.0 has no standalone Radio enum. Compose breadcrumbs with Row, Button and Text, and list group headings with Text above List in the same scroll content.\n'
    write('components/index.md',body)

if __name__=='__main__':main()
