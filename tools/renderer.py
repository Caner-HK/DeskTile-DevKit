"""Build the Windows host renderer from the current firmware component engine."""
from pathlib import Path
import shutil, subprocess
from preview_fonts import prepare
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
OUT=ROOT/'build/renderer'
OUT.mkdir(parents=True,exist_ok=True)
# The existing host adapter supplies a framebuffer, font loader and board stubs.
source=(REPO/'tools/render_pids_review.py').read_text(encoding='utf-8').split('from PIL import Image')[0]
source=source.replace("ROOT = Path(__file__).resolve().parents[1]",'ROOT = REPO').replace("OUT = ROOT / 'build' / 'pids-preview'",'OUT = DESTINATION')
exec(source,{'REPO':REPO,'DESTINATION':OUT,'__file__':str(REPO/'tools/render_pids_review.py')})
for folder in ('ui','runtime','package','security'):
    shutil.copytree(REPO/'src'/folder,OUT/'src'/folder,dirs_exist_ok=True)
shutil.copytree(REPO/'sdk/include',OUT/'sdk/include',dirs_exist_ok=True)
shutil.copyfile(REPO/'src/platform/TextBuffer.h',OUT/'src/platform/TextBuffer.h')
(OUT/'esp_heap_caps.h').write_text('#pragma once\n#include <cstdlib>\n#define MALLOC_CAP_SPIRAM 0\n#define MALLOC_CAP_INTERNAL 0\n#define MALLOC_CAP_8BIT 0\ninline size_t heap_caps_get_free_size(int){return 8*1024*1024;}\ninline void *heap_caps_malloc(size_t n,int){return malloc(n);}\ninline void heap_caps_free(void *p){free(p);}\n')
sample=(REPO/'tools/render_sample_apps.py').read_text(encoding='utf-8')
header=sample.split("write('preview.cpp',r'''",1)[1].split('static void frame(',1)[0]
cpp=header+r'''
#include <filesystem>
#include <iostream>
namespace fs=std::filesystem;
static std::vector<uint8_t> loadFile(const fs::path &p){std::ifstream f(p,std::ios::binary);if(!f)throw std::runtime_error("Cannot open input resource");return {std::istreambuf_iterator<char>(f),{}};}
struct Resources:runtime::ResourceProvider {
 fs::path root;
 bool resolve(const char*p,fs::path &out){
  if(!p||!*p)return false;auto rel=fs::u8path(p);
  if(rel.is_absolute()||rel.has_root_name())return false;
  out=fs::weakly_canonical(root/rel);auto r=out.lexically_relative(root);
  return !r.empty()&&*r.begin()!=L"..";
 }
 dt_result size(const runtime::AppContext&,const char*p,uint64_t&n)override{try{fs::path f;if(!resolve(p,f))return DT_ERR_INVALID_ARGUMENT;n=fs::file_size(f);return DT_OK;}catch(...){return DT_ERR_NOT_FOUND;}}
 dt_result readRange(const runtime::AppContext&,const char*p,uint64_t offset,dt_mutable_bytes&v)override{try{fs::path f;if(!resolve(p,f))return DT_ERR_INVALID_ARGUMENT;std::ifstream in(f,std::ios::binary);if(!in)return DT_ERR_NOT_FOUND;in.seekg(0,std::ios::end);const uint64_t n=in.tellg();if(offset>n)return DT_ERR_INVALID_ARGUMENT;v.size=std::min<uint64_t>(v.capacity,n-offset);in.seekg(offset);in.read(reinterpret_cast<char*>(v.data),v.size);return in?DT_OK:DT_ERR_IO;}catch(...){return DT_ERR_IO;}}
 dt_result read(const runtime::AppContext&c,const char*p,dt_mutable_bytes&v)override{uint64_t n=0;auto r=size(c,p,n);if(r!=DT_OK)return r;if(n>v.capacity){v.size=n;return DT_ERR_BUFFER_TOO_SMALL;}return readRange(c,p,0,v);}
};
int wmain(int argc,wchar_t**argv){try{
 if(argc!=5){std::cerr<<"Expected markup, application directory, font pack, output directory\n";return 2;}
 fontPack=loadFile(argv[3]);native_ui::glyphFinder=findGlyph;native_ui::glyphLoader=loadGlyph;
 runtime::NativeSdkHost host;host.setSurfaceViewport({0,32,800,448});host.setTextMeasure([](const char *s,int size){return ui::sizedTextWidth(s,size,false);});
 Resources resources;resources.root=fs::canonical(argv[2]);host.bindResources(&resources);
 runtime::AppContext context;if(!context.configure("com.example.preview",runtime::Trust::Development,0,0))return 3;
 dt_app_context owner=0;if(host.registerContext(context,owner)!=DT_OK)return 4;
 runtime::HtmlComponentDocument doc;auto markup=loadFile(argv[1]);auto r=doc.load(host,owner,markup.data(),markup.size());
 if(r!=DT_OK){std::cerr<<"Markup load failed: "<<r<<"\n";return 5;}
 if(host.api()->ui_present(owner,doc.root())!=DT_OK)return 6;
 static RgbScanout display;Canvas canvas;canvas.begin(&display);
 for(bool dark:{false,true}){
  ui::setTheme(!dark,0xff9900);canvas.beginFrame({0,0,800,480});canvas.clear(ui::theme().desktop);
  uint32_t fill=0,ink=0;host.statusBarColors(ui::CanvasComponentTarget::systemTheme(),fill,ink);
  auto rgb565=[](uint32_t v){return ui::rgb(v>>16,(v>>8)&255,v&255);};
  canvas.fillRect(0,0,800,32,rgb565(fill));ui::sizedText(canvas,{16,0,120,32},"12:34",rgb565(ink),20);
  ui::CanvasComponentTarget target(canvas,&resources,host.context(owner));
  if(host.renderPresented(target,ui::CanvasComponentTarget::systemTheme(),1190)!=ui::RenderError::None)return 7;
  std::ofstream f(fs::path(argv[4])/(dark?L"dark.rgb565":L"light.rgb565"),std::ios::binary);f.write(reinterpret_cast<char*>(display.buffer),sizeof(display.buffer));if(!f)return 8;
 }
 host.unregisterContext(owner);return 0;
}catch(const std::exception&e){std::cerr<<e.what()<<"\n";return 1;}}
'''
(OUT/'preview.cpp').write_text(cpp.replace('DT_ERR_IO','DT_ERR_STORAGE'),encoding='utf-8')
prepare(OUT)
vs=subprocess.check_output(['C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe','-latest','-products','*','-property','installationPath'],text=True).strip()
cjson=REPO/'.tools/esp-idf-f1a1df9b/components/json/cJSON'
sources=['runtime/NativeSdkHost.cpp','runtime/HtmlComponentDocument.cpp','ui/ComponentTree.cpp','ui/ComponentProperties.cpp','ui/ComponentRuntime.cpp','ui/ComponentRenderer.cpp','ui/CanvasComponentTarget.cpp','graphics/Canvas.cpp']
args=' '.join('"src/'+name+'"' for name in sources)+' "'+str(cjson/'cJSON.c')+'"'
command=f'call "{vs}/Common7/Tools/VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul && cl /nologo /utf-8 /std:c++17 /EHsc /O2 /MT /D_CRT_SECURE_NO_WARNINGS /I. /I"{OUT}/src" /I"{cjson}" preview.cpp {args} /Fe:preview.exe'
subprocess.run('cmd /d /c '+command,cwd=OUT,check=True)
(ROOT/'renderer').mkdir(exist_ok=True)
shutil.copyfile(OUT/'preview.exe',ROOT/'renderer/preview.exe')
shutil.copyfile(OUT/'ui-fonts.pack',ROOT/'renderer/ui-fonts.pack')
shutil.copyfile(OUT/'font-inventory.json',ROOT/'renderer/font-inventory.json')
print('Windows x64 renderer built from current Canvas and component runtime')
