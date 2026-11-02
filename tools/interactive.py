"""Build the local interactive host using the firmware JS and UI engines."""
from pathlib import Path
import shutil, subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
OUT=ROOT/'build/interactive'
# Reuse the maintained framebuffer/font adapter, without running its static build.
prelude=(ROOT/'tools/renderer.py').read_text(encoding='utf-8').split('\nvs=subprocess')[0]
prelude=prelude.replace("OUT=ROOT/'build/renderer'", "OUT=ROOT/'build/interactive'")
exec(prelude, {'__file__':str(ROOT/'tools/renderer.py')})
(OUT/'adapter.h').write_text((OUT/'preview.cpp').read_text(encoding='utf-8').split('int wmain(')[0],encoding='utf-8')
shutil.copyfile(ROOT/'tools/interactive.cpp',OUT/'interactive.cpp')
for name in ('preview_desktop.h','preview_files.h','preview_native.h','preview_storage.h','preview_config.h','preview_chrome.h','preview_network.h','preview_notifications.h','preview_icon_resources.h'):
    shutil.copyfile(ROOT/'tools'/name,OUT/name)
for folder in ('storage','crypto'):
    shutil.copytree(REPO/'src'/folder,OUT/'src'/folder,dirs_exist_ok=True)
for name in ('NotificationBanner.h','NotificationMotion.h','NotificationTime.h'):
    shutil.copyfile(REPO/'src/graphics'/name,OUT/'src/graphics'/name)
for name in ('SharedDataService.h','SharedDataService.cpp','CalendarDataService.h','CalendarAgendaService.h','CalendarAgendaIndex.h','LocaleService.h','LocaleService.cpp','SystemLanguage.h','NotificationQueue.h','FileService.h','FileService.cpp','TaskRuntime.h'):
    shutil.copyfile(REPO/'src/system'/name,OUT/'src/system'/name)
for name in ('KernelJsonMemory.h','KernelJsonApi.h','HttpClient.h'):
    shutil.copyfile(REPO/'src/platform'/name,OUT/'src/platform'/name)
(OUT/'src/apps/calendar').mkdir(parents=True,exist_ok=True)
shutil.copyfile(REPO/'src/apps/calendar/CalendarSources.h',OUT/'src/apps/calendar/CalendarSources.h')
(OUT/'wear_levelling.h').write_text('#pragma once\nusing wl_handle_t=int;constexpr int WL_INVALID_HANDLE=-1;\n')
(OUT/'dirent.h').write_text('#pragma once\n#include <filesystem>\nstruct DIR{std::filesystem::directory_iterator next;};\n')
shutil.copytree(REPO/'src/input',OUT/'src/input',dirs_exist_ok=True)
for name in ('UiSupport.h','TimeSettingsLayout.h','KeyboardLayout.h','ClockPolicy.h'):
    shutil.copyfile(REPO/'src/system'/name,OUT/'src/system'/name)
(OUT/'esp_heap_caps.h').write_text('''#pragma once
#include <cstdlib>
#include <malloc.h>
#define MALLOC_CAP_SPIRAM 1
#define MALLOC_CAP_INTERNAL 2
#define MALLOC_CAP_8BIT 4
inline void *heap_caps_malloc(size_t n,int){return malloc(n);}
inline void *heap_caps_calloc(size_t a,size_t b,int){return calloc(a,b);}
inline void *heap_caps_realloc(void *p,size_t n,int){return realloc(p,n);}
inline void heap_caps_free(void *p){free(p);}
inline size_t heap_caps_get_allocated_size(void *p){return _msize(p);}
inline size_t heap_caps_get_free_size(int){return 8*1024*1024;}
''')
(OUT/'freertos').mkdir(exist_ok=True)
for n in ('FreeRTOS.h','task.h'):(OUT/'freertos'/n).write_text('#pragma once\n')
(OUT/'freertos/idf_additions.h').write_text('''#pragma once
#include <cstdint>
inline uint8_t *pxTaskGetStackStart(void *){volatile uint8_t marker=0;return reinterpret_cast<uint8_t*>(reinterpret_cast<uintptr_t>(&marker)-192*1024);}
''')
# Host time must advance for motion and pressed feedback as well as JS timers.
p=OUT/'src/platform/Runtime.h'
s=p.read_text(encoding='utf-8').replace('#include <ctime>','#include <ctime>\n#include <chrono>')
s=s.replace('inline uint32_t uptimeUs() { return 0; }','inline uint32_t uptimeUs() { return uint32_t(std::chrono::duration_cast<std::chrono::microseconds>(std::chrono::steady_clock::now().time_since_epoch()).count()); }')
s=s.replace('inline uint32_t uptimeMs() { return 0; }','inline uint32_t uptimeMs() { return uint32_t(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count()); }')
p.write_text(s,encoding='utf-8')
# PIDS assets are app resources; the host must not reach into the developer repository.
p=OUT/'src/graphics/Canvas.cpp'
p.write_text(p.read_text(encoding='utf-8').replace('#include "../../MtrPidsHostFontCache.h"',''),encoding='utf-8')
vs=subprocess.check_output(['C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe','-latest','-products','*','-property','installationPath'],text=True).strip()
qjs=REPO/'components/quickjs-ng/quickjs-ng'
cjson=REPO/'.tools/esp-idf-f1a1df9b/components/json/cJSON'
c='cl /nologo /utf-8 /std:c11 /O2 /MT /TC /DQUICKJS_NG_BUILD /D_CRT_SECURE_NO_WARNINGS /I"'+str(qjs)+'" /c '+' '.join('"'+str(qjs/(n+'.c'))+'"' for n in ('quickjs','dtoa','libregexp','libunicode'))
runner=f'cl /nologo /utf-8 /std:c++17 /EHsc /O2 /MT /DESP_PLATFORM /D_CRT_SECURE_NO_WARNINGS /I. /I"{qjs}" /c src/runtime/JavaScriptAppRunner.cpp'
sources=['runtime/NativeSdkHost.cpp','runtime/NativeAppRunner.cpp','runtime/HtmlComponentDocument.cpp','ui/ComponentTree.cpp','ui/ComponentProperties.cpp','ui/ComponentRuntime.cpp','ui/ComponentRenderer.cpp','ui/CanvasComponentTarget.cpp','graphics/Canvas.cpp','runtime/data/SharedDataRepository.cpp','system/SharedDataService.cpp','crypto/Sha256.cpp']
args=' '.join('"src/'+n+'"' for n in sources)
args+=' src/system/LocaleService.cpp src/storage/PrivateAppStorage.cpp'
args+=' src/system/FileService.cpp'
# A desktop preview has no persistent system worker. FileService uses its real
# private/user storage implementation; worker-backed copy reports unsupported.
(OUT/'preview_tasks.cpp').write_text('#include "src/system/TaskRuntime.h"\nnamespace desktile { dt_result TaskRuntime::command(const runtime::AppContext &, const char *, const cJSON *, cJSON *&) { return DT_ERR_NOT_SUPPORTED; } }\n',encoding='utf-8')
args+=' preview_tasks.cpp'
Image.open(ROOT/'assets/logo.png').save(OUT/'preview.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128)])
(OUT/'preview.rc').write_text('1 ICON "preview.ico"\n',encoding='utf-8')
host=f'cl /nologo /utf-8 /std:c++17 /EHsc /O2 /MT /D_CRT_SECURE_NO_WARNINGS /I. /Isrc /I"{qjs}" /I"{cjson}" interactive.cpp {args} "{cjson}/cJSON.c" JavaScriptAppRunner.obj quickjs.obj dtoa.obj libregexp.obj libunicode.obj preview.res user32.lib gdi32.lib comdlg32.lib winhttp.lib uiautomationcore.lib oleaut32.lib ole32.lib /Fe:interactive.exe'
subprocess.run('cmd /d /c '+f'call "{vs}/Common7/Tools/VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul && rc /nologo preview.rc && {c} && {runner} && {host}',cwd=OUT,check=True)
shutil.copyfile(OUT/'interactive.exe',ROOT/'renderer/interactive.exe')
shutil.copyfile(OUT/'ui-fonts.pack',ROOT/'renderer/ui-fonts.pack')
shutil.copyfile(OUT/'font-inventory.json',ROOT/'renderer/font-inventory.json')
print('Interactive Windows host built from the actual QuickJS runner and Canvas components')
