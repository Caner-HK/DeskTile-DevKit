"""Render a font review with the actual application runtime and Canvas."""
from pathlib import Path
import json, shutil, struct, subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent/'DeskTile_System'
OUT=ROOT/'build/interactive'
EVIDENCE=ROOT/'build/transport-review'
EVIDENCE.mkdir(parents=True,exist_ok=True)
source=(ROOT/'tools/interactive.cpp').read_text(encoding='utf-8')
anchor='preview->start(argv[1]'
assert source.count(anchor)==1
source=source.replace(anchor,'native_ui::setWesternFont(sdk::WesternFont::GdsTransport);'+anchor)
(OUT/'interactive_transport.cpp').write_text(source,encoding='utf-8')
vs=subprocess.check_output(['C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe','-latest','-products','*','-property','installationPath'],text=True).strip()
objects=['NativeSdkHost','HtmlComponentDocument','ComponentTree','ComponentProperties','ComponentRuntime','ComponentRenderer','CanvasComponentTarget','Canvas','cJSON','JavaScriptAppRunner','quickjs','dtoa','libregexp','libunicode']
qjs=REPO/'components/quickjs-ng/quickjs-ng'
cjson=REPO/'.tools/esp-idf-f1a1df9b/components/json/cJSON'
command=f'call "{vs}/Common7/Tools/VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul && cl /nologo /utf-8 /std:c++17 /EHsc /O2 /MT /D_CRT_SECURE_NO_WARNINGS /I. /Isrc /I"{qjs}" /I"{cjson}" interactive_transport.cpp '+' '.join(n+'.obj' for n in objects)+' preview.res user32.lib gdi32.lib /Fe:interactive_transport.exe'
subprocess.run('cmd /d /c '+command,cwd=OUT,check=True)
project=EVIDENCE/'timer'
shutil.copytree(REPO/'samples/timer-js',project,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.desktile','dist'))
steps=[]
for theme in ('light','dark'):
    steps += [dict(action='theme',value=theme),dict(action='save',path=str(EVIDENCE/theme))]
scenario=EVIDENCE/'scenario.json';scenario.write_text(json.dumps(steps),encoding='utf-8')
subprocess.run([str(OUT/'interactive_transport.exe'),str(project),str(ROOT/'renderer/ui-fonts.pack'),'en-US','light',str(scenario)],check=True)
for theme in ('light','dark'):
    image=Image.new('RGB',(800,480))
    image.putdata([(((v>>11)&31)*255//31,((v>>5)&63)*255//63,(v&31)*255//31) for v, in struct.iter_unpack('<H',(EVIDENCE/(theme+'.rgb565')).read_bytes())])
    image.save(EVIDENCE/(theme+'.png'))
print(EVIDENCE)
