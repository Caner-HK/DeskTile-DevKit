"""Executable component examples, laid out according to the corresponding native pages."""
from pathlib import Path
from html import escape
import json, subprocess

REPO=Path(__file__).resolve().parents[2]/'DeskTile_System'

def appbar(title, icon=58):
    return ('<dt-system-bar id="catalog-appbar" height="72"><dt-row alignment="1" flex-grow="1">'
      '<dt-button id="catalog-back" accessibility-label="返回" width="96" height="72" button-style="5" padding="0,8,0,0" alignment="1" justification="1"><dt-icon icon="11" width="32" height="32"/></dt-button>'
      f'<dt-icon id="catalog-icon" icon="{icon}" width="40" height="40" margin="0,18,4,22" foreground-role="1"/>'
      f'<dt-text id="catalog-title" text="{escape(title)}" font-size="32" flex-grow="1"/>'
      '</dt-row></dt-system-bar>')

def button(text, icon, style=0):
    return f'<dt-button text="{text}" icon="{icon}" width="152" height="52" font-size="20" button-style="{style}"/>'

def rows(labels, height=76):
    return '<dt-list>'+''.join(f'<dt-list-row text="{x}" height="{height}" font-size="20"/>' for x in labels)+'</dt-list>'

def examples():
    builders=json.loads(subprocess.check_output(['node','-e',r'''
const u=require('./sdk/javascript/components');
console.log(JSON.stringify({
row:u.listRow({id:'storage',label:'存储空间',summary:'12 KB'})+u.listRow({id:'notify',label:'接收提醒',toggle:{id:'enabled',checked:true}}),
note:u.listRow({id:'automatic',label:'自动同步时间',toggle:{id:'automatic-toggle',checked:true}})+u.listNote({text:'联网后自动校准日期和时间。'}),
dialog:u.confirmation({id:'confirm',visible:true,title:'删除便签？',body:'删除后将移除这条便签。',actions:[{id:'cancel',label:'取消'},{id:'delete',label:'删除',icon:41,destructive:true}]}),
menu:u.menu({id:'file-menu',title:'旅行计划.txt',items:[{id:'open',label:'打开',icon:73},{id:'rename',label:'重命名',icon:68},{id:'delete',label:'删除',icon:41,destructive:true}]}),
stepper:u.numberStepper({id:'count',value:'10',unit:'次',symbols:'arrows'})
}));'''],cwd=REPO,text=True,encoding='utf-8'))
    return {
      'page':('页面','<dt-text text="我的一天" font-size="32" height="48"/><dt-text text="整理今天的计划，记录值得记住的事。" font-size="20" text-wrap="true"/>'),
      'system-bar':('应用栏','<dt-text text="旅行计划" font-size="32" height="48"/>'),
      'row':('横向容器','<dt-row height="52" gap="16" alignment="1">'+button('保存',49)+button('取消',48,9)+'</dt-row>'),
      'column':('纵向容器','<dt-column gap="12" alignment="0"><dt-text text="周末计划" font-size="32" height="48"/><dt-text text="周六上午去图书馆。" font-size="20" height="28"/><dt-text text="周日下午整理照片。" font-size="20" height="28"/></dt-column>'),
      'stack':('层叠容器','<dt-stack width="480" height="288"><dt-image resource="picture.dti" width="480" height="288"/><dt-text text="色彩" width="120" height="48" font-size="32" margin="24,0,0,24"/></dt-stack>'),
      'grid':('网格','<dt-grid grid-columns="3" width="752" height="116" gap="12">'+''.join(f'<dt-button text="{t}" font-size="20" button-style="9"/>' for t in ['周一','周二','周三','周四','周五','周六'])+'</dt-grid>'),
      'scroll-view':('滚动容器','<dt-scroll flex-grow="1">'+rows(['北京','上海','广州','深圳','杭州','南京','苏州','成都'])+'</dt-scroll>'),
      'text':('文字','<dt-text text="周末计划" font-size="32" height="48"/><dt-text text="早晨出发，沿着海边散步。下午去图书馆，把喜欢的段落记下来。" font-size="20" text-wrap="true" width="752"/><dt-text text="最后修改于昨天" font-size="20" foreground-role="3" height="28"/>'),
      'image':('图片','<dt-image resource="picture.dti" width="480" height="288"/>'),
      'icon':('图标','<dt-row height="64" gap="24" alignment="1"><dt-icon icon="28" width="40" height="40"/><dt-icon icon="49" width="40" height="40"/><dt-icon icon="81" width="40" height="40"/></dt-row>'),
      'button':('按钮','<dt-row height="52" gap="16" alignment="1">'+button('保存',49)+button('取消',48,9)+button('删除',41,2)+'</dt-row>'),
      'fab':('悬浮操作按钮','<dt-stack flex-grow="1"><dt-list><dt-list-row text="旅行计划" height="76" font-size="20"/><dt-list-row text="购物清单" height="76" font-size="20"/></dt-list><dt-column alignment="2" justification="2" padding="0,24,24,0"><dt-button id="fab" accessibility-label="新建便签" width="80" height="80" button-style="8" alignment="1" justification="1"><dt-icon icon="35" width="40" height="40"/></dt-button></dt-column></dt-stack>'),
      'button-variants':('按钮变体','<dt-row height="52" gap="16" alignment="1">'+button('打开',73,1)+button('查看',73,7)+button('更多',10,4)+'</dt-row><dt-row height="80" gap="24" alignment="1"><dt-button accessibility-label="刷新" width="52" height="52" button-style="4" icon="14"/><dt-button accessibility-label="新建" width="80" height="80" button-style="3" icon="35"/><dt-button accessibility-label="新建便签" width="80" height="80" button-style="8" icon="35"/></dt-row>'),
      'color-swatch':('颜色选择','<dt-row height="76" gap="20" alignment="1"><dt-button id="orange" accessibility-label="橙色" width="64" height="64" button-style="10" background="#FF9900" checked="true"/><dt-button id="blue" accessibility-label="蓝色" width="64" height="64" button-style="10" background="#3765FF" checked="false"/><dt-button id="green" accessibility-label="绿色" width="64" height="64" button-style="10" background="#168471" checked="false"/></dt-row>'),
      'toggle':('开关','<dt-list>'+builders['row'].split('</dt-list-row>',1)[1]+'</dt-list>'),
      'slider':('滑块','<dt-text text="亮度" font-size="20" height="28"/><dt-slider id="brightness" width="752" height="52" minimum="0" maximum="100" value="65"/>'),
      'list':('列表',rows(['系统语言','日期和时间','开发者选项'])),
      'list-row':('列表项','<dt-list>'+builders['row']+'</dt-list>'),
      'list-compact':('紧密列表',rows(['显示语言','中文字体','显示车厢信息'],54)),
      'text-field':('输入框','<dt-text-field id="name" placeholder="输入名称" width="752" height="52" font-size="20" padding="0,16,0,16" pointer-input="true"/>'),
      'dialog':('对话框',builders['dialog']),
      'menu':('菜单',builders['menu']),
      'number-stepper':('上下步进器',builders['stepper']),
      'progress':('进度','<dt-text text="正在下载" font-size="20" height="28"/><dt-row width="752" height="32" gap="16" alignment="1"><dt-progress id="download-progress" flex-grow="1" height="12" minimum="0" maximum="100" value="58"/><dt-text id="download-percent" text="58%" font-size="20" width="80" height="32"/></dt-row>'),
      'loading-squares':('移动方块','<dt-progress id="loading" width="240" height="30" progress-style="1"/><dt-text text="正在读取" font-size="20" width="704" height="40" alignment="1" foreground-role="3"/>'),
      'loading-bars':('脉动竖条','<dt-progress id="loading" width="48" height="40" progress-style="2"/><dt-text text="正在读取" font-size="20" width="704" height="40" alignment="1" foreground-role="3"/>'),
      'canvas-view':('画布','<dt-canvas id="chart" width="600" height="240"/>'),
      'checkbox':('复选框','<dt-row height="56" gap="24" alignment="1"><dt-checkbox width="48" height="48"/><dt-checkbox checked="true" width="48" height="48"/><dt-checkbox indeterminate="true" width="48" height="48"/><dt-checkbox checked="true" enabled="false" width="48" height="48"/></dt-row>'),
      'choice-stepper':('左右步进器','<dt-list><dt-list-row text="音量" font-size="20" height="76"><dt-choice-stepper id="volume" height="76" minimum="0" maximum="100" step="5" value="60"/></dt-list-row></dt-list>'),
      'list-note':('列表说明','<dt-list has-following-content="true">'+builders['note'].split('<dt-list-note')[0]+'</dt-list><dt-list-note'+builders['note'].split('<dt-list-note')[1]),
      'document-editor':('文本编辑器','<dt-scroll flex-grow="1"><dt-document-editor id="editor" text="旅行计划&#10;&#10;周六上午出发，带上相机和水。" padding="24" height="376" document-headings="true"/></dt-scroll>'),
      'date-time-picker':('日期时间选择器','<dt-date-time-picker id="date" width="752"/>'),
      'duration-picker':('时长选择器','<dt-duration-picker id="duration" width="752" minimum="0" maximum="3600" value="60"/>'),
    }

FLUSH={'list','list-row','list-compact','list-note','scroll-view','toggle','document-editor','choice-stepper','fab'}
CENTER={'image','stack','number-stepper','canvas-view','menu'}
def page(name,title,snippet):
    if name in ('loading-squares','loading-bars'):
        indicator=snippet.split('<dt-text',1)[0]
        top=114 if name=='loading-squares' else 104
        return '<dt-page>'+appbar(title)+f'<dt-column flex-grow="1" padding="{top},48,0,48" gap="16" alignment="1">'+indicator+'<dt-text text="正在读取" font-size="20" width="704" height="40" alignment="1" foreground-role="3"/></dt-column></dt-page>'
    attrs='' if name in FLUSH else ' padding="24" gap="20" alignment="0"'
    if name in CENTER:attrs=' padding="24" alignment="1" justification="1"'
    return '<dt-page>'+appbar(title)+f'<dt-column flex-grow="1"{attrs}>'+snippet+'</dt-column></dt-page>'

def script(name):
    if name=='date-time-picker':
        return "function enter(){DeskTile.configureDateTimePicker(DeskTile.byId('date'),{mode:'both',symbols:'arrows',date:'2026-10-29',time:'12:34',dateLabel:'日期',timeLabel:'时间',units:['年','月','日','时','分']});}\n"
    if name=='duration-picker':
        return "function enter(){const data=new ArrayBuffer(80),view=new DataView(data),bytes=new Uint8Array(data);view.setUint32(0,80,true);view.setUint32(4,1,true);['时','分','秒'].forEach(function(unit,i){bytes.set(DeskTile.utf8Encode(unit),44+i*12);});DeskTile.setBytes(DeskTile.byId('duration'),62,data);}\n"
    if name=='color-swatch':
        return "function onEvent(event,target){if(event!==0)return;const ids=['orange','blue','green'];if(!ids.some(function(id){return target===DeskTile.byId(id);}))return;ids.forEach(function(id){DeskTile.setBoolean(DeskTile.byId(id),6,target===DeskTile.byId(id));});}\n"
    if name=='fab':
        return "function onEvent(event,target){if(event===0&&target===DeskTile.byId('fab'))DeskTile.keyboard(JSON.stringify({title:'新建便签',initial:'',maximum_length:512}));}\n"
    if name=='canvas-view':
        return '''function enter(){
  const bytes=new ArrayBuffer(60), view=new DataView(bytes);
  const bars=[[40,100,96,100,0xFF9900],[180,40,96,160,0x168471],[320,70,96,130,0x3765FF]];
  bars.forEach(function(b,i){const p=i*20;view.setUint8(p,1);view.setUint16(p+2,20,true);for(let k=0;k<4;k++)view.setInt16(p+4+k*2,b[k],true);view.setUint32(p+12,b[4],true);});
  DeskTile.setBytes(DeskTile.byId('chart'),29,bytes);
}
'''
    if name=='number-stepper':
        return '''let count=10;
function refresh(){DeskTile.setText(DeskTile.byId('count-value'),0,String(count));DeskTile.setBoolean(DeskTile.byId('count-up'),5,count<20);DeskTile.setBoolean(DeskTile.byId('count-down'),5,count>0);}
function enter(){refresh();}
function onEvent(event,target){if(event!==0)return;if(target===DeskTile.byId('count-up'))count=Math.min(20,count+1);else if(target===DeskTile.byId('count-down'))count=Math.max(0,count-1);else return;refresh();}
'''
    if name in ('menu','dialog'):
        handle='file-menu' if name=='menu' else 'confirm'
        return f"function onEvent(event,target){{if(event===0&&['open','rename','delete','cancel'].some(function(id){{return target===DeskTile.byId(id);}}))DeskTile.setBoolean(DeskTile.byId('{handle}'),4,false);}}\n"
    if name=='text-field':
        return '''let request=0, value='', down=null;
function onPointer(event,pointer){
  if(pointer.target!==DeskTile.byId('name')||request)return;
  if(event===12){down={x:pointer.x,y:pointer.y};return;}
  if(event===15){down=null;return;}
  if(!down)return;
  if(Math.abs(pointer.x-down.x)>=8||Math.abs(pointer.y-down.y)>=8){down=null;return;}
  if(event===14){down=null;if(pointer.localX>=0&&pointer.localX<752&&pointer.localY>=0&&pointer.localY<52){const id=DeskTile.keyboard(JSON.stringify({title:'名称',initial:value,maximum_length:512}));if(id>0)request=id;}}
}
function onRequestComplete(id,result,data){if(id!==request)return;request=0;if(result===0){value=DeskTile.utf8Decode(data);DeskTile.setText(DeskTile.byId('name'),0,value);}}
'''
    return 'function enter(){}\n'

DETAILS={
 'fab':'FAB 用于页面最主要的一项新增操作。便签采用 80×80 px 圆形按钮（button-style="8"），内部为 40×40 px 图标，距内容区右侧和底部各 24 px。通过 Stack 将它叠在列表之上，独立于列表滚动；列表底部需预留足够的可滚动空间，使最后一项可完整移出按钮覆盖区。示例点按后打开新建输入窗口。切角悬浮变体为 button-style="3"，与便签的圆形规格分别使用。',
 'button-variants':'除保存、取消和危险操作外，按钮还提供 secondary（1）、text（4）、outlined（7）及悬浮变体。示例第一行分别为次要、描边和文字按钮；第二行展示纯图标按钮、切角悬浮按钮及圆形按钮。纯图标按钮设置 accessibility-label；页面 Appbar 的图标操作使用 72 px 点击区域和 32 px 图标。',
 'color-swatch':'颜色选择使用 button-style="10"。background 表示候选颜色，checked 标记当前选择，勾选符号由系统按底色对比度绘制。应用在 activate 后更新选中状态，并保存对应颜色。色块通过 accessibility-label 提供名称。',
 'progress':'确定进度的百分比放在进度条右侧尾部，与进度条垂直居中。沿用文件 App 下载进度的规格：条高 12 px，条与数字间隔 16 px，百分比使用 20 px 正文字号并预留 80×32 px 区域，显示 100% 时布局保持稳定。应用用同一份任务进度同时更新 value 和百分比文案。总量未知时采用活动指示器。',
 'document-editor':'编辑器沿用便签的正文布局：四边各 24 px 内边距，放入占满内容区的滚动容器。示例开启 document-headings，使首段作为标题显示。编辑内容、光标和输入会话由应用与系统键盘共同管理。',
 'choice-stepper':'左右步进器用于列表中的数值或选项调整，与左侧标签保持在同一行。示例使用 76 px 宽松列表行，控件占据完整行的布局范围，内部箭头和数值自动靠右排列；箭头按钮为 44×44 px，右侧留 30 px。minimum、maximum 和 step 控制数值范围与步长，value-changed 事件通知应用保存新值。',
 'list':'列表行使用两种密度：宽松 76 px，紧密 54 px。设置主页采用宽松布局，PIDS 设置采用紧密布局。密度由页面用途决定。列表本身贴齐内容区左右边缘，行内文字由组件提供 24 px 内边距。`checked` 表示持续选中的状态，仅用于选择列表。普通导航列表使用默认状态。',
 'list-row':'用 `ui.listRow` 创建 76 px 宽松行，或指定 `density: "compact"` 创建 54 px 紧密行。主文案为 20 px，摘要默认位于右侧 trailing 插槽。将一组行放进 `dt-list`，由列表处理末项分隔线。开关的点击区域为 112×56 px；紧密行会把高度限制为 54 px。',
 'list-note':'说明紧跟所属列表，列表与说明共同放进无额外 gap、无外层 padding 的纵向容器。组件提供左右 24 px 内边距、顶部 16 px 间隔和 20 px 字号。设置 `has-following-content="true"` 保留说明上方的最后一条分隔线。',
 'scroll-view':'让滚动容器占用 Appbar 下方剩余区域，再把列表放进去。列表内边距由行处理。示例含八行，实际滚动视口为 800×376 px，拖动可看到后面的城市。滚动位置保存在应用状态中，返回页面时通过 `scroll-position` 恢复。',
 'image':'示例采用项目自带的完整 Color Grid 图片，原始尺寸和显示尺寸均为 480×288 px。图片所在容器使用居中对齐，保持原图比例。默认交叉轴 stretch 会拉伸子组件；固定尺寸图片需显式设置父容器 alignment。',
 'icon':'这三个图标均来自系统图标资源，显示边界为 40×40 px。横向容器使用 `alignment="1"` 垂直居中，保持图标正方形。列表中的图标规格按相应列表变体使用；Appbar 操作图标为 32×32 px。',
 'button':'常规按钮高 52 px，文案使用 20 px。保存使用 primary（0），取消使用 cancel（9），删除使用 destructive（2）。收到 activate 后执行操作，异步操作等待期间更新 enabled。Appbar 使用自己的文本按钮变体和 72 px 操作区域。',
 'text-field':'空值提示放在 placeholder 属性，输入内容放在 text 属性。系统根据当前主题选择提示文字颜色。常规输入框高 52 px、文字 20 px，左右各 16 px 内边距。内部 icon 参与文本区域计算。示例采用错误代码 App 的指针处理方式：启用 pointer-input，在 onPointer 中辨别轻触、拖动和取消，松手后打开系统键盘，成功返回后更新内容。',
 'dialog':'确认弹窗沿用便签和系统确认布局：宽 592 px，外边距由居中呈现处理，内部 padding 24 px；标题 32 px、高 48 px，标题后间隔 12 px，内容组 gap 24 px；底部按钮高 52 px、间距 12 px。取消在左，确认在右，删除使用危险色。优先调用 `ui.confirmation`，正文较长时仅正文区域滚动。',
 'menu':'`ui.menu` 沿用设备 PopupMenu：默认宽 256 px，标题区域和操作行各高 56 px；标题使用 20 px 次要文字，左右内边距 16 px；行图标为 28×28 px，距左侧 16 px，文字从左侧 60 px 开始。外框使用主题分隔线颜色，操作行连续排列。菜单使用内嵌 popup 表面，呈现时保持背景内容原样；应用将其放入覆盖层，按触点位置放置并处理外部点击关闭。示例居中展示菜单本体。最多八项，内容超高时滚动。传入 showHeader: false 隐藏标题。通过 item.id 识别 activate，执行后关闭菜单。系统 App Menu 使用 DeskTile.registerMenu，详见下方接口区别。',
 'number-stepper':'上下步进器由 `ui.numberStepper` 生成。上下按钮分别使用 id-up、id-down，数值为 id-value。默认宽 128 px，按钮和数值区各高 52 px，间隔 8 px；`symbols: "arrows"` 使用上下箭头。长按每 100 ms 产生一次 activate。应用保存当前值、限制上下界，并在到达边界时禁用对应按钮。示例范围为 0 至 20。',
 'canvas-view':'Canvas 示例在 enter 中提交三条填充矩形命令，坐标相对于画布左上角。使用公开的二进制命令结构，通过属性 canvas-commands 提交。预览运行同一段 JavaScript 并显示真实绘制结果；更新数据时重新提交相应命令缓冲区。',
 'row':'gap 控制子项间距，flex-grow 分配剩余宽度。alignment 控制交叉轴：0 起点、1 居中、2 末端、3 拉伸。图标和固定高度按钮使用居中对齐，以保持各自规格。',
 'column':'纵向容器按内容顺序排列。示例标题 32 px，正文 20 px，段落间距 12 px。alignment 控制水平对齐；固定宽度图片、选择器使用起点或居中，完整列表使用填满宽度的布局。',
}
