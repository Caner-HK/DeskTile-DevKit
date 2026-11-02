"""Check generated examples against native layouts and run their actual JS."""
from pathlib import Path
from html.parser import HTMLParser
import json, re, subprocess
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent/'DeskTile_System'
BUILD=ROOT/'build/docs-markup'
PUBLIC=ROOT/'docs/.vuepress/public/previews'

class Nodes(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.nodes=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        if tag.startswith('dt-'): self.nodes.append((tag,dict(attrs)))

def example(name, theme='light'):
    nodes=Nodes((BUILD/name/'page.html').read_text(encoding='utf-8')).nodes
    boxes=json.loads((BUILD/name/(theme+'.json')).read_text(encoding='utf-8'))
    assert len(nodes)==len(boxes),(name,len(nodes),len(boxes))
    return [(tag,attrs,box) for (tag,attrs),box in zip(nodes,boxes)]

def named(nodes, name):
    return next((attrs,box) for _,attrs,box in nodes if attrs.get('id')==name)

def check():
    native=Nodes((REPO/'samples/notes-js/src/index.html').read_text(encoding='utf-8')).nodes
    source=lambda name:next(attrs for _,attrs in native if attrs.get('id')==name)
    for theme in ('light','dark'):
        for name,height in [('list',76),('list-compact',54)]:
            rows=[box for tag,_,box in example(name,theme) if tag=='dt-list-row']
            assert len(rows)==3
            im=Image.open(PUBLIC/name/(theme+'.png'))
            for index,box in enumerate(rows):
                assert (box['x'],box['y'],box['width'],box['height'])==(0,104+index*height,800,height)
                y=box['y']+box['height']-1
                assert len(set(im.crop((0,y,800,y+1)).getdata()))==1
                assert im.getpixel((400,y))!=im.getpixel((400,y-1)),(name,theme,'missing separator')
        editor,_=named(example('document-editor',theme),'editor')
        for key in ('padding','height','document-headings'): assert editor[key]==source('body')[key]
        fab,box=named(example('fab',theme),'fab')
        for key in ('width','height','button-style','alignment','justification'): assert fab[key]==source('new')[key]
        assert (box['x'],box['y'],box['width'],box['height'])==(696,376,80,80)
        _,step=named(example('choice-stepper',theme),'volume')
        assert (step['x'],step['y'],step['width'],step['height'])==(0,104,800,76)
        layout=(REPO/'src/apps/files/FileTransferLayout.h').read_text()
        track=list(map(int,re.search(r'value.track=\{(\d+),progressTop\+(\d+),(\d+),(\d+)\}',layout).groups()))
        percent=list(map(int,re.search(r'value.percent=\{(\d+),progressTop,(\d+),(\d+)\}',layout).groups()))
        _,bar=named(example('progress',theme),'download-progress')
        _,number=named(example('progress',theme),'download-percent')
        assert number['x']-bar['x']-bar['width']==percent[0]-track[0]-track[2]==16
        assert bar['height']==track[3]==12 and number['height']==percent[2]==32
        assert bar['y']+bar['height']/2==number['y']+number['height']/2
        assert bar['x']==24 and number['x']+number['width']==776
        menu=example('menu',theme);_,panel=named(menu,'file-menu')
        popup=(REPO/'src/graphics/PopupMenu.h').read_text()
        header,row=map(int,re.search(r'headerHeight=(\d+),rowHeight=(\d+)',popup).groups())
        assert panel['width']==256 and panel['height']==header+3*row
        for i,name in enumerate(('open','rename','delete')):
            _,item=named(menu,name)
            assert item['height']==row and item['y']==panel['y']+header+i*row
        im=Image.open(PUBLIC/'menu'/(theme+'.png'))
        border=im.getpixel((panel['x'],panel['y']))
        assert border==im.getpixel((panel['x']+panel['width']-1,panel['y']+panel['height']-1))
        assert im.getpixel((0,200))==im.getpixel((0,470)), 'menu added scrim'
    print('PASS: native editor and FAB, 54/76 list lines, list stepper, trailing percentage, native PopupMenu geometry in both themes')

def scenario(name, actions):
    base=BUILD/name;file=base/'verification.json'
    steps=[{'action':'save','path':str(base/'before')}]+actions+[{'action':'save','path':str(base/'after')}]
    file.write_text(json.dumps(steps),encoding='utf-8')
    subprocess.run([str(ROOT/'renderer/interactive.exe'),str(base),str(ROOT/'renderer/ui-fonts.pack'),'zh-CN','light',str(file)],check=True)
    before=(base/'before.rgb565').read_bytes()[104*800*2:]
    after=(base/'after.rgb565').read_bytes()[104*800*2:]
    assert before!=after,(name,'interaction did not change the rendered content')

if __name__=='__main__':
    check()
    for name,button in [('number-stepper','count-up'),('color-swatch','blue'),('menu','open')]:
        _,box=named(example(name),button)
        scenario(name,[{'action':'tap','x':box['x']+box['width']//2,'y':box['y']+box['height']//2},{'action':'wait','ms':240}])
    scenario('choice-stepper',[{'action':'tap','x':748,'y':142},{'action':'wait','ms':240}])
    scenario('text-field',[{'action':'tap','x':200,'y':150},{'action':'text','text':'旅行计划'},{'action':'wait','ms':240}])
    print('PASS: real JS interactions for vertical and horizontal steppers, color selection, menu dismissal and keyboard result')
