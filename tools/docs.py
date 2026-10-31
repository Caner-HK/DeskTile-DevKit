"""Generate SDK references and render component examples for the VuePress site."""
from pathlib import Path
import json,re,shutil,subprocess,tempfile,struct,zipfile
import sys
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from html import escape
from docs_content import COMPONENTS, PROPERTIES
from component_examples import examples as component_examples, page, script, DETAILS
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
DOCS=ROOT/'docs'
PUBLIC=DOCS/'.vuepress/public'

def write(name,body):
    p=DOCS/name;p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(body.replace(chr(183),' / '),encoding='utf-8')

def markdown_table(headers,rows):
    def row(values):return '| '+' | '.join(str(v).replace('|','&#124;').replace('\n',' ') for v in values)+' |\n'
    return row(headers)+row(['---']*len(headers))+''.join(row(values) for values in rows)

def navigation():
    paths={}
    def target(link):
        relative=link.strip('/')
        if not relative:return DOCS/'README.md'
        if link.endswith('/'):
            directory=DOCS/relative
            return directory/('README.md' if (directory/'README.md').is_file() else 'index.md')
        return DOCS/relative
    def walk(nodes,parents):
        for node in nodes:
            link=node.get('link');chain=parents
            if link:
                relative=link.strip('/')
                path=target(link)
                if not path.is_file():raise ValueError('Navigation target missing: '+str(path))
                if not node.get('children'):
                    if path in paths:raise ValueError('Duplicate navigation page: '+str(path))
                    paths[path]=parents
                chain=parents+[(node['text'],link)]
            else:chain=parents+[(node['text'],None)]
            walk(node.get('children',[]),chain)
    for filename in ('navigation.json','navigation.en.json'):
        walk(json.loads((DOCS/filename).read_text(encoding='utf-8')),[])
    for path in DOCS.rglob('*.md'):
        if 'node_modules' in path.parts or '.vuepress' in path.parts:continue
        if path not in paths:raise ValueError('Page missing from navigation: '+str(path))
        body=path.read_text(encoding='utf-8');lines=body.splitlines()
        english=path.relative_to(DOCS).parts[0]=='en'
        home='/en/' if english else '/'
        lines=[line for line in lines if not line.startswith(('[文档首页](/)','[Documentation home](/en/)')) and line not in ('[[toc]]','<!-- page-outline -->')]
        crumbs=['[Documentation home](/en/)' if english else '[文档首页](/)']
        for title,link in paths[path]:
            relative=(link or '').strip('/')
            parent=target(link) if link else None
            if link!=home and parent!=path:crumbs.append(f'[{title}]({link})' if link else title)
        body=re.sub(r'\n{3,}','\n\n','\n'.join(lines)).strip()
        if path.name!='README.md':
            title,rest=body.split('\n',1);body=title+'\n\n'+' / '.join(crumbs)+'\n'+rest
        # A local outline belongs to the article, separate from the site sidebar.
        if len(re.findall(r'^## ',body,re.M))>=3:
            body=body.replace('\n## ','\n<!-- page-outline -->\n[[toc]]\n\n## ',1)
        path.write_text(re.sub(r'\n{3,}','\n\n',body)+'\n',encoding='utf-8')
    print('Navigation covers',len(paths),'pages')

def icon_catalog():
    source=(REPO/'src/graphics/UiIcons.h').read_text(encoding='utf-8')
    names=[n.strip() for n in re.search(r'enum class Id : uint8_t \{ (.*?) \};',source).group(1).split(',')]
    side=int(re.search(r'kSize = (\d+)',source).group(1))
    destination=PUBLIC/'icon-catalog';destination.mkdir(parents=True,exist_ok=True)
    rows=[]
    for index,name in enumerate(names):
        image=Image.open(REPO/'assets/ui-icons/generated-sharp'/f'{name.lower()}-{side}.png').convert('RGBA')
        alpha=image.getchannel('A');thumb=Image.new('RGBA',image.size,(31,31,31,0));thumb.putalpha(alpha)
        thumb.resize((40,40),Image.Resampling.LANCZOS).save(destination/(name+'.png'))
        (destination/(name+'.dti')).write_bytes(struct.pack('<4sHHB3x',b'DTI1',side,side,3)+alpha.tobytes())
        rows.append((f'![{name}](/icon-catalog/{name}.png)',name,str(index),f'[DTI](/icon-catalog/{name}.dti)'))
    for filename in ('LICENSE','LICENSE-MATERIAL-SYMBOLS','MATERIAL-SYMBOLS.md'):
        shutil.copyfile(REPO/'assets/ui-icons'/filename,destination/filename)
    with zipfile.ZipFile(destination/'icons.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for p in sorted(destination.iterdir()):
            if p.suffix=='.dti' or p.name in ('LICENSE','LICENSE-MATERIAL-SYMBOLS','MATERIAL-SYMBOLS.md'):archive.write(p,p.name)
    write('components/icon-catalog.md','# 图标目录\n\n目录从设备的 `UiIcons::Id` 和原始图标资源生成，共 '+str(len(names))+' 个图标。每个预览保持正方形比例。\n\n## 使用方式\n\n[下载全部 DTI 资源与许可](/icon-catalog/icons.zip)。将需要的文件放入应用的 `assets` 目录，通过 [Image 组件](image.md)加载；所有目录条目均可采用这个方式随应用打包。原始 SVG 随 SDK 安装在 `resources/icons/source`，编号清单位于 `resources/icons/catalog.json`。\n\n当前 SDK 1.0 的 `dt-icon` 渲染入口接受 0–120；JavaScript 的 Scaffold、列表和菜单构建器接受 0–103。编号 121 及以后的图形使用包内 DTI 资源。这里同时列出完整设备资源，方便按名称查找。\n\n```html\n<dt-icon icon="28" width="40" height="40"/>\n<dt-image resource="assets/Notifications.dti" width="40" height="40"/>\n```\n\n## 全部图标\n\n'+markdown_table(['预览','名称','设备编号','资源'],rows))

def main():
    icon_catalog()
    write('api/index.md','# SDK 1.0 接口参考\n\n这里列出随 DevKit 附带的接口签名。首次使用某项服务时，先阅读[系统服务](../services/)中的调用流程，再查阅参数和返回类型。\n\n| 参考 | 内容 |\n| --- | --- |\n| [JavaScript 全局接口](javascript.md) | 组件操作、资源、请求与应用回调 |\n| [平台服务类型](platform.md) | 文件、后台任务、共享数据、蓝牙与语言 |\n| [组件构建器](builders.md) | 列表、弹窗与常用界面组合 |\n| [Native C/C++](native.md) | 宿主函数表与 C++ 包装器 |\n| [数据与组件契约](contract.md) | 属性类型、事件、能力和运行限制 |\n\nJavaScript 与 Native 共用系统的权限、应用身份和资源所有权规则。\n')
    js=(REPO/'sdk/javascript/desktile.d.ts').read_text(encoding='utf-8')
    body='# JavaScript API\n\n`DeskTile` 是设备运行时提供的全局对象。类型声明随项目复制到 `.desktile/types`，编辑器据此提供签名与类型检查。\n\n请求成功返回正数 ID，立即失败返回具体负数错误；同步操作和已满足的权限请求按各自签名处理。所有句柄和请求归调用应用所有。\n\n[下载完整类型声明](/api-source/desktile.d.ts)。\n'
    parts=re.split(r'(?=^(?:interface |declare (?:const|function)|type ))',js,flags=re.M)
    for part in parts:
        if not part.strip():continue
        m=re.search(r'^(?:interface |declare (?:const|function) |type )(\w+)',part,re.M)
        body+='\n## '+(m.group(1) if m else '使用约定')+'\n\n```ts\n'+part.strip()+'\n```\n'
    for filename,title,page_name,guide in [('platform.d.ts','平台服务类型','platform','../services/'),('components.d.ts','组件构建器','builders','../components/patterns.md')]:
        reference='# '+title+'\n\n先阅读[使用指南]('+guide+')，再按类型名称查找参数。这里保留与编辑器补全一致的完整签名。\n\n[下载类型声明](/api-source/'+filename+')\n'
        declarations=(REPO/'sdk/javascript'/filename).read_text(encoding='utf-8')
        groups={}
        for part in re.split(r'(?=^export (?:interface|type|function|class|const) )',declarations,flags=re.M):
            if not part.strip():continue
            match=re.search(r'^export (?:interface|type|function|class|const) (\w+)',part,re.M)
            name=match.group(1) if match else '类型导入'
            if page_name=='platform':
                if name.startswith(('Bluetooth',)):group='蓝牙 BLE'
                elif name.startswith(('Locale','I18n')):group='语言与区域'
                elif name.startswith(('PrivateStorage','Storage')):group='私有存储'
                elif name.startswith(('Shared',)):group='共享数据'
                elif name.startswith(('Task','Download','FileVerify','FileCopy')):group='后台任务'
                elif name.startswith(('File',)):group='用户文件'
                else:group='调用上下文'
            else:
                if 'Navigation' in name or 'Scaffold' in name or name in ('scaffoldLayout','Rect','PointerEvent'):group='页面框架与导航'
                elif name.startswith(('Menu','Confirmation','menu','confirmation')):group='菜单与确认'
                elif name.startswith(('Progress','progress')):group='进度显示'
                elif name.startswith(('List','list','settingsPath')):group='设置与列表'
                else:group='输入与选择'
            groups.setdefault(group,[]).append((name,part.strip()))
        for group,items in groups.items():
            reference+='\n## '+group+'\n'
            for name,part in items:reference+='\n### '+name+'\n\n```ts\n'+part+'\n```\n'
        write('api/'+page_name+'.md',reference)
    body+='\n## 按用途查找\n\n文件、任务和蓝牙等对象的类型见[平台服务类型](platform.md)。生成常用界面的参数见[组件构建器](builders.md)。组件属性编号与返回码见[数据与组件契约](contract.md)。\n'
    write('api/javascript.md',body)
    h=(REPO/'sdk/include/desktile/sdk.h').read_text(encoding='utf-8')
    table=h.split('typedef struct dt_host_api_v1 {',1)[1].split('} dt_host_api_v1',1)[0]
    body='# Native API\n\n宿主函数表使用应用上下文隔离组件、请求、存储与资源。先检查 `abi_version` 与实际能力。\n\n## 宿主函数表\n\n每项签名来自 `sdk.h`。`dt_bytes` 是调用期间借用的内存；回调数据需要跨回调使用时由应用复制。读取缓冲区过小时，按返回的 `size` 准备足够空间再重试。\n'
    for statement in table.split(';'):
        statement=statement.strip()
        if not statement:continue
        m=re.search(r'\(\*(\w+)\)',statement)
        body+='\n### '+(m.group(1) if m else 'abi_version')+'\n\n```c\n'+statement+';\n```\n'
    body+='\n## C++ 包装器\n\n在应用中包含对应头文件。包装器建立在相同的 C ABI 上。\n\n| 头文件 | 源码 |\n| --- | --- |\n'
    for p in sorted((REPO/'sdk/include/desktile').glob('*.hpp')):
        body+=f'| `{p.name}` | [查看声明](/api-source/include/{p.name}) |\n'
    body+='\n## 结构、事件和枚举\n\n[完整 sdk.h](/api-source/include/sdk.h) 提供事件布局、返回码和宿主 ABI；[契约](contract.md) 提供组件与服务数据约束。\n'
    write('api/native.md',body)
    contract=json.loads((REPO/'sdk/contract/desktile-api.json').read_text(encoding='utf-8'))
    body='# 数据与组件契约\n\nSDK ABI 为 1.0。字符串使用 UTF-8，颜色使用 `0xRRGGBB`，组件句柄属于创建它的应用。调用可选功能前检查目标设备返回的能力集合。\n\n## 组件属性\n\n属性编号对应以下表格的顺序，从 0 开始。HTML 使用属性名，脚本和 Native 接口使用对应枚举。\n\n'
    body+=markdown_table(['编号','属性','类型','枚举值'],[(i,'`'+p['id']+'`',p['value'],'，'.join(f'{k}={v}' for k,v in p.get('values',{}).items())) for i,p in enumerate(contract['properties'])])
    body+='\n## 事件\n\n事件发送给所属应用。处理时先核对目标句柄，并根据事件类型读取载荷。\n\n'+markdown_table(['编号','事件'],[(i,str(e)) for i,e in enumerate(contract['events'])])
    body+='\n## 运行限制\n\n这些数值帮助应用在构建和运行前控制数据量。回调预算用于约束脚本执行时间，长任务使用系统异步服务。\n\n'+markdown_table(['项目','上限'],contract['limits'].items())
    body+='\n## 可选能力\n\n通过 `DeskTile.capabilities()` 或 Native 能力接口读取设备支持的功能，再决定是否使用对应接口。\n\n'+markdown_table(['能力','位值'],contract['capabilities'].items())
    body+='\n## 原始定义\n\n[SDK 契约 JSON](/api-source/desktile-api.json)用于工具生成和自动校验；[权限清单 JSON](/api-source/permissions.json)列出权限标识。权限的声明、申请和拒绝处理见[权限指南](../services/permissions.md)。\n'
    write('api/contract.md',body)
    (PUBLIC/'api-source/include').mkdir(parents=True,exist_ok=True)
    for declaration in (REPO/'sdk/javascript').glob('*.d.ts'):
        shutil.copyfile(declaration,PUBLIC/'api-source'/declaration.name)
    shutil.copytree(REPO/'sdk/include/desktile',PUBLIC/'api-source/include',dirs_exist_ok=True)
    for name in ('desktile-api.json','permissions.json'):shutil.copyfile(REPO/'sdk/contract'/name,PUBLIC/'api-source'/name)
    examples=component_examples()
    picture=Image.open(REPO/'assets/user-presets/Color Grid.png').convert('RGB')
    resource=struct.pack('<4sHHB3x',b'DTI1',*picture.size,0)+b''.join(struct.pack('<H',((r>>3)<<11)|((g>>2)<<5)|(b>>3)) for r,g,b in picture.getdata())
    for name,(title,snippet) in examples.items():
        title,group,intro,usage,properties,events=COMPONENTS[name]
        usage=DETAILS.get(name,usage)
        build=ROOT/'build/docs-markup'/name;build.mkdir(parents=True,exist_ok=True)
        manifest={'id':'com.example.catalog.'+name.replace('-',''),'name':title,'version':'1.0.0','version_code':1,'runtime':'javascript','sdk':{'target':'1.0'},'entry':{'document':'page.html','script':'main.js'}}
        (build/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf-8')
        (build/'page.html').write_text(page(name,title,snippet),encoding='utf-8')
        (build/'main.js').write_text(script(name),encoding='utf-8')
        if name in ('image','stack'):(build/'picture.dti').write_bytes(resource)
        archive=PUBLIC/'component-examples'/(name+'.zip');archive.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
            for f in ('manifest.json','page.html','main.js')+ (('picture.dti',) if name in ('image','stack') else ()):
                z.write(build/f,f)
        destination=PUBLIC/'previews'/name
        if '--text-only' not in sys.argv:
            destination.mkdir(parents=True,exist_ok=True)
            steps=[{'action':'save','path':str(build/'light')},{'action':'theme','value':'dark'},{'action':'save','path':str(build/'dark')}]
            (build/'scenario.json').write_text(json.dumps(steps),encoding='utf-8')
            subprocess.run([str(ROOT/'renderer/interactive.exe'),str(build),str(ROOT/'renderer/ui-fonts.pack'),'zh-CN','light',str(build/'scenario.json')],check=True,stdout=subprocess.DEVNULL)
            for theme in ('light','dark'):
                raw=(build/(theme+'.rgb565')).read_bytes()
                pixels=[((v>>11)*255//31,((v>>5)&63)*255//63,(v&31)*255//31) for (v,) in struct.iter_unpack('<H',raw)]
                im=Image.new('RGB',(800,480));im.putdata(pixels);im.save(destination/(theme+'.png'))
            if name in ('loading-squares','loading-bars'):
                count=44 if name=='loading-squares' else 10
                steps=[]
                for i in range(count):steps.extend([{'action':'wait','ms':32},{'action':'save','path':str(build/f'frame-{i}'),'ms':32}])
                (build/'animation.json').write_text(json.dumps(steps),encoding='utf-8')
                subprocess.run([str(ROOT/'renderer/interactive.exe'),str(build),str(ROOT/'renderer/ui-fonts.pack'),'zh-CN','light',str(build/'animation.json')],check=True,stdout=subprocess.DEVNULL)
                frames=[]
                for i in range(count):
                    raw=(build/f'frame-{i}.rgb565').read_bytes()
                    im=Image.new('RGB',(800,480));im.putdata([((v>>11)*255//31,((v>>5)&63)*255//63,(v&31)*255//31) for (v,) in struct.iter_unpack('<H',raw)])
                    frames.append(im)
                if len({frame.crop((280,208,520,248)).tobytes() for frame in frames})<4:raise RuntimeError('Loading animation did not advance: '+name)
                frames[0].save(destination/'animation.gif',save_all=True,append_images=frames[1:],duration=64,loop=0)
        formatted=snippet.replace('><','>\n<')
        body=f'# {title}\n\n{intro}\n\n## 使用方式\n\n{usage}\n\n## 示例\n\n[下载完整可运行示例](/component-examples/{name}.zip)。解压后使用 DevKit 的交互预览运行，下面列出正文组件标记。完整页面及其父容器布局位于包内 `page.html`。\n\n```html\n{formatted}\n```\n'
        if script(name)!='function enter(){}\n':body+='\n### 示例逻辑\n\n```js\n'+script(name)+'```\n'
        if name in ('loading-squares','loading-bars'):
            variant='squares' if name=='loading-squares' else 'bars'
            number=1 if variant=='squares' else 2
            body+=f'\n### 动态效果\n\n![{title}动画](/previews/{name}/animation.gif)\n\n动画来自实际组件渲染帧。HTML 的 `progress-style="{number}"` 对应 JavaScript 构建器 `ui.progress({{id: "loading", style: "{variant}"}})`。Native 使用 `DT_COMPONENT_PROGRESS`，并将 `DT_PROPERTY_PROGRESS_STYLE` 设为 {number}。\n\n开始任务前显示组件；任务通过异步接口执行，宿主负责推进加载动画。收到完成或失败结果后，将 `visible` 设为 `false` 或销毁组件，再显示内容或错误提示。组件只表示等待，应用负责实际任务生命周期。\n'
        if name=='menu':body+='\n### 与系统 App Menu 的区别\n\n页面内菜单由应用创建、打开和关闭。系统 App Menu 则通过 `DeskTile.registerMenu([{action: 1, label: "设置", icon: 3}])` 注册，收到 `app-menu` 事件后按 action 切换页面。它跟随系统应用菜单入口，详见[Scaffold 与导航](scaffold.md)。\n'
        if name=='icon':body+='\n## 图标目录与自有图标\n\n[完整图标目录](icon-catalog.md)列出名称、编号、预览和可打包的 DTI 文件。自己的图形使用 [Image 组件](image.md)加载包内资源；[资源制作](../tools/assets.md)说明如何将原始图片转换为 DTI。\n\n```html\n<dt-image resource="assets/my-symbol.dti" width="40" height="40"/>\n```\n\n系统着色 DTI 保留透明度并使用当前主色；自定义颜色 DTI 保留图片颜色。图形显示区域保持原素材宽高比。`dt-icon` 的编号用于系统内置图标，包内图形由 `dt-image` 的资源路径指定。\n'
        if name in ('list','list-compact','list-row','scroll-view','list-note'):
            body+='\n## 末项分隔线\n\n短列表完整位于视口内、底部还有留白时，显示最后一行的分隔线。列表超出视口需要滚动时，屏幕边缘由内容裁切决定；末项位于屏幕外时，视口底部保持原有裁切。列表后面紧跟说明或其他内容时，末项分隔线保持显示。使用 `has-following-content` 可明确标记由其他容器绘制的后续内容。宽松和紧密列表共用此规则。\n'
        body+='\n## 常用属性\n\n'
        body+=markdown_table(['属性','用途'],[('`'+p+'`',PROPERTIES[p]) for p in properties])
        if events:body+='\n## 处理事件\n\n关注 '+ '、'.join('`'+event+'`' for event in events)+' 事件。根据事件目标识别组件，将新值写入应用状态，再更新需要变化的组件。事件编号见[组件契约](../api/contract.md)。\n'
        body+=f'\n## 浅色外观\n\n![{title}浅色](/previews/{name}/light.png)\n\n## 深色外观\n\n![{title}深色](/previews/{name}/dark.png)\n\n预览使用系统原生渲染器，尺寸为 800×480。完整属性见[组件契约](../api/contract.md)，组合用法见[组合模式](patterns.md)。\n'
        write('components/'+name+'.md',body)
    custom=ROOT/'build/docs-markup/custom-icon';custom.mkdir(parents=True,exist_ok=True)
    original=ROOT/'build/docs-markup/icon'
    shutil.copyfile(original/'manifest.json',custom/'manifest.json')
    shutil.copyfile(original/'main.js',custom/'main.js')
    snippet=(original/'page.html').read_text(encoding='utf-8')
    for number,name in [(28,'Folder'),(49,'Check'),(81,'PermissionShield')]:
        # Reuse the same accepted icon row geometry for package-owned resources.
        source=next(p for p in (PUBLIC/'icon-catalog').glob('*.dti') if p.stem==name)
        shutil.copyfile(source,custom/(name+'.dti'))
        snippet=snippet.replace(f'<dt-icon icon="{number}" width="40" height="40"/>',f'<dt-image resource="{name}.dti" width="40" height="40"/>')
    (custom/'page.html').write_text(snippet,encoding='utf-8')
    with zipfile.ZipFile(PUBLIC/'component-examples/custom-icon.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for f in ['manifest.json','main.js','page.html','Folder.dti','Check.dti','PermissionShield.dti']:archive.write(custom/f,f)
    if '--text-only' not in sys.argv:
        (custom/'scenario.json').write_text(json.dumps([{'action':'save','path':str(custom/'light')}]),encoding='utf-8')
        subprocess.run([str(ROOT/'renderer/interactive.exe'),str(custom),str(ROOT/'renderer/ui-fonts.pack'),'zh-CN','light',str(custom/'scenario.json')],check=True,stdout=subprocess.DEVNULL)
        im=Image.new('RGB',(800,480));im.putdata([((v>>11)*255//31,((v>>5)&63)*255//63,(v&31)*255//31) for (v,) in struct.iter_unpack('<H',(custom/'light.rgb565').read_bytes())]);im.save(PUBLIC/'previews/icon/custom.png')
    icon_page=DOCS/'components/icon.md'
    with icon_page.open('a',encoding='utf-8') as output:output.write('\n## 包内图标示例\n\n[下载包内 DTI 图标完整示例](/component-examples/custom-icon.zip)。三个图形使用与上方相同的布局，Image 组件读取应用包中的图标资源并使用当前主色。\n\n![包内图标](/previews/icon/custom.png)\n')
    body='# 组件目录\n\n按页面需要选择组件。每个条目包含用途、示例、常用属性、事件与深浅主题预览。建立完整应用时，从 [Scaffold 与导航](scaffold.md)开始；三态侧栏与切换动画见[导航 Nav](navigation.md)；设置列表、确认弹窗等常见组合见[组合模式](patterns.md)。\n'
    tree=json.loads((DOCS/'navigation.json').read_text(encoding='utf-8'))
    component_section=next(section for section in tree if section['link']=='/components/')
    for group in component_section['children']:
        if not group.get('children'):continue
        rows=[]
        for child in group['children']:
            name=Path(child['link']).stem
            info=COMPONENTS[name]
            rows.append((f'[{info[0]}]({name}.md)',info[2]))
        body+='\n## '+group['text']+'\n\n'+markdown_table(['组件','用途'],rows)
    body+='\n## 组件与组合用法\n\nFAB、颜色选择和菜单属于已有基础组件的组合或变体，各自提供独立用法和示例。系统键盘、系统 App Menu 与通知通过系统服务接入，参见[平台服务](../services/)。\n\n## 原生页面与公开 SDK 的区别\n\n| 设备已有用法 | SDK 1.0 的当前入口 |\n| --- | --- |\n| 圆形及切角 FAB | Button 的 circular（8）与 floating（3）变体 |\n| 颜色选择 | Button 的 color-swatch（10）变体 |\n| 页面操作菜单 | `ui.menu`，采用原生 PopupMenu 的尺寸和主题 |\n| 系统 App Menu | `DeskTile.registerMenu` 和 `app-menu` 事件 |\n| 侧栏导航 | Scaffold 的导航条目、展开与收起接口 |\n| 侧边 Dialog | 原生系统已有专用绘制；公开 Dialog 当前提供 embedded 和 centered 两种呈现 |\n| Radio 单选 | 原生系统已有 radio 绘制；公开组件枚举尚未提供独立 Radio |\n| 文件路径面包屑 | 文件 App 的导航组合；SDK 可用 Row、Button 与 Text 组织路径 |\n| 列表分组标题 | 使用 Text 与 List 组合，标题和列表属于同一滚动内容 |\n'
    write('components/index.md',body)
    patterns=json.loads(subprocess.check_output(['node','-e',"const u=require('./sdk/javascript/components'); console.log(JSON.stringify([{name:'列表摘要',code:u.listRow({id:'storage',label:'存储空间',summary:'12 KB'})},{name:'尾部开关',code:u.listRow({id:'notify',label:'接收提醒',toggle:{id:'enabled',checked:true}})},{name:'数字步进',code:u.numberStepper({id:'hour',value:'09',unit:'时'})}]))"],cwd=REPO,text=True,encoding='utf-8'))
    write('components/patterns.md','# 组合模式\n\n`components.js` 构建器生成系统组件标记，适用于常规设置列表、确认弹窗和数字步进。先把 SDK 模块复制到包内，再从应用逻辑中加载。创建的项目已包含这些模块。\n\n```js\nconst ui = DeskTile.require("ui/components.js");\nconst row = ui.listRow({id: "storage", label: "存储空间", summary: "12 KB"});\n```\n\n将生成的标记放入当前页面或传给 Scaffold 的 mount 方法。下面展示构建器生成的实际结构，便于理解插槽位置。\n'+''.join('\n## '+p['name']+'\n\n```html\n'+p['code']+'\n```\n' for p in patterns)+'\n## 选择与状态\n\n`listRow` 默认使用 76 px 行高，`density: "compact"` 使用 54 px。摘要默认位于右侧；需要中间摘要时显式设置 `summaryPosition: "middle"`。\n\n开关通过 `value-changed` 事件处理新值，保存成功后更新持久状态。保存失败时恢复原值，设置其 `checked` 属性；依赖项同步更新 `enabled`。\n\n## 确认与菜单\n\n`ui.confirmation` 接受标题、正文和操作列表。按操作语义指定取消或破坏性样式。`ui.menu` 生成具有可选标题的操作菜单。具体参数见[组件构建器](../api/builders.md)，完整页面组织见[Scaffold 与导航](scaffold.md)。\n')
    # Curated example guides are maintained alongside the application sources.
    from docs_english import main as english_docs
    english_docs()
    navigation()
    print('References and',len(examples),'component pages generated')

def check():
    root=ROOT/'site';errors=[];references=[];anchors={}
    class Scan(HTMLParser):
        def handle_starttag(self,tag,attrs):
            for key,value in attrs:
                if key=='id':anchors[self.source].add(value)
                if key not in ('href','src') or not value:continue
                u=urlsplit(value)
                if u.scheme or u.netloc:continue
                p=self.source if not u.path else root/unquote(u.path).lstrip('/') if u.path.startswith('/') else self.source.parent/unquote(u.path)
                if p.is_dir():p=p/'index.html'
                if not p.is_file():errors.append((str(self.source.relative_to(root)),value))
                elif u.fragment:references.append((self.source,p.resolve(),unquote(u.fragment)))
    pages=list(root.rglob('*.html'))
    if not pages:raise SystemExit('Documentation site is missing')
    for source in pages:
        source=source.resolve();anchors[source]=set()
        parser=Scan();parser.source=source;parser.feed(source.read_text(encoding='utf-8'))
    for source,target,anchor in references:
        if target.suffix=='.html' and anchor not in anchors.get(target,set()):errors.append((str(source.relative_to(root)),str(target)+'#'+anchor))
    for source in DOCS.rglob('*.md'):
        if 'node_modules' in source.parts or '.vuepress' in source.parts:continue
        text=source.read_text(encoding='utf-8');plain=re.sub(r'```.*?```','',text,flags=re.S)
        levels=[len(m.group(1)) for m in re.finditer(r'^(#{1,6}) ',plain,flags=re.M)]
        if levels.count(1)!=1 or any(b>a+1 for a,b in zip(levels,levels[1:])):errors.append((str(source),'heading hierarchy'))
        if chr(183) in text:errors.append((str(source),'forbidden character'))
    print('HTML pages:',len(pages),'broken local references:',len(errors))
    for error in errors[:20]:print(error)
    if errors:raise SystemExit(1)

if __name__=='__main__':
    if '--check' in sys.argv:check()
    else:main()
