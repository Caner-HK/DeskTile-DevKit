// Local desktop adapter. The application, JS engine and components are shared with firmware.
#define NOMINMAX
#include <windows.h>
#include <windowsx.h>
#include <commdlg.h>
#include <map>
#include "sdk/include/desktile/base64.hpp"
#include "adapter.h"
#include "src/runtime/JavaScriptAppRunner.h"
#include "preview_native.h"
#include "src/system/SharedDataService.h"
#include "src/system/LocaleService.h"
#include "src/system/FileService.h"
#include "preview_storage.h"
#include "preview_network.h"
#include "preview_notifications.h"
#include <memory>
#include <chrono>
#include <thread>
#include <functional>

static std::wstring wide(const std::string&s){if(s.empty())return {};int n=MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,s.data(),int(s.size()),nullptr,0);std::wstring out(n,0);MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,s.data(),int(s.size()),out.data(),n);return out;}
static std::string utf8(const std::wstring&s){if(s.empty())return {};int n=WideCharToMultiByte(CP_UTF8,0,s.data(),int(s.size()),nullptr,0,nullptr,nullptr);std::string out(n,0);WideCharToMultiByte(CP_UTF8,0,s.data(),int(s.size()),out.data(),n,nullptr,nullptr);return out;}
static const char *str(cJSON*j,const char*k,const char*d=""){auto*v=cJSON_GetObjectItemCaseSensitive(j,k);return cJSON_IsString(v)?v->valuestring:d;}
static int num(cJSON*j,const char*k,int d=0){auto*v=cJSON_GetObjectItemCaseSensitive(j,k);return cJSON_IsNumber(v)?v->valueint:d;}
using Json=std::unique_ptr<cJSON,decltype(&cJSON_Delete)>;
struct TickGuard {bool& busy;explicit TickGuard(bool& value):busy(value){busy=true;}~TickGuard(){busy=false;}};
struct FrameWake {
 HANDLE handle=CreateWaitableTimerExW(nullptr,nullptr,0x00000002,TIMER_ALL_ACCESS);
 FrameWake(){if(!handle)handle=CreateWaitableTimerExW(nullptr,nullptr,0,TIMER_ALL_ACCESS);if(!handle)throw std::runtime_error("Cannot create preview frame timer");}
 ~FrameWake(){CloseHandle(handle);}
 void wait(std::chrono::steady_clock::time_point deadline){
  const auto remaining=std::chrono::duration_cast<std::chrono::nanoseconds>(deadline-std::chrono::steady_clock::now()).count();
  LARGE_INTEGER due;due.QuadPart=-std::max<int64_t>(1,remaining/100);
  if(!SetWaitableTimer(handle,&due,0,nullptr,nullptr,FALSE))throw std::runtime_error("Cannot schedule preview frame");
  if(MsgWaitForMultipleObjectsEx(1,&handle,INFINITE,QS_ALLINPUT,MWMO_INPUTAVAILABLE)==WAIT_FAILED)throw std::runtime_error("Preview message wait failed");
 }
};
static LRESULT CALLBACK flatControlProc(HWND,UINT,WPARAM,LPARAM);
struct Preview;
static int flatPopup(Preview*,HWND,HWND,const std::vector<std::wstring>&,int);
static Json parse(const std::vector<uint8_t>&b){return Json(cJSON_ParseWithLength(reinterpret_cast<const char*>(b.data()),b.size()),cJSON_Delete);}
#include "preview_config.h"
static std::string keyFile(const char*key){std::string out;for(auto p=reinterpret_cast<const unsigned char*>(key);*p;++p){char hex[3];sprintf_s(hex,"%02x",*p);out+=hex;}return out;}
struct Storage:runtime::PrivateStorageProvider{
 fs::path root;
 dt_result read(const runtime::AppContext&,const char*key,dt_mutable_bytes&v)override{try{auto p=root/keyFile(key);if(!fs::is_regular_file(p))return DT_ERR_NOT_FOUND;auto n=fs::file_size(p);v.size=size_t(n);if(n>v.capacity)return DT_ERR_BUFFER_TOO_SMALL;std::ifstream f(p,std::ios::binary);f.read(reinterpret_cast<char*>(v.data),v.size);return f?DT_OK:DT_ERR_STORAGE;}catch(...){return DT_ERR_STORAGE;}}
 dt_result write(const runtime::AppContext&,const char*key,dt_bytes v)override{try{fs::create_directories(root);auto p=root/keyFile(key),temp=p;temp+=L".tmp";{std::ofstream f(temp,std::ios::binary);f.write(reinterpret_cast<const char*>(v.data),v.size);if(!f)return DT_ERR_STORAGE;}if(!MoveFileExW(temp.c_str(),p.c_str(),MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH))return DT_ERR_STORAGE;return DT_OK;}catch(...){return DT_ERR_STORAGE;}}
 dt_result remove(const runtime::AppContext&,const char*key)override{try{fs::remove(root/keyFile(key));return DT_OK;}catch(...){return DT_ERR_STORAGE;}}
};
struct Services:runtime::SystemServiceProvider{
 preview_network::Requests network;
 preview_notifications::Service notifications;runtime::NativeSdkHost* notificationHost=nullptr;
 std::unique_ptr<FileSystem> sharedStorage;SharedDataService shared;LocaleService locales;FileService files;
 dt_request_id dataRequest=0;dt_app_context dataOwner=0;const runtime::AppContext *dataCaller=nullptr;std::string dataOptions;
 void bindShared(const fs::path &root){fs::create_directories(root/"desktile/user");sharedStorage=std::make_unique<FileSystem>(root.u8string().c_str());shared.bind(sharedStorage.get());locales.bind(sharedStorage.get());files.bind(sharedStorage.get(),nullptr);}
 void processData(runtime::NativeSdkHost &host){
  if(!dataRequest)return;const auto id=dataRequest,owner=dataOwner;auto caller=dataCaller;auto text=std::move(dataOptions);dataRequest=0;dataCaller=nullptr;
  Json request(cJSON_Parse(text.c_str()),cJSON_Delete);cJSON *response=nullptr;dt_result result=DT_ERR_STORAGE;
  try{
   const std::string operation=str(request.get(),"operation");
   if(operation.compare(0,7,"locale.")==0){
    locales.useSystemLocale(locale.c_str());result=locales.command(*caller,operation.c_str(),request.get(),response);
    if(result==DT_OK){sdk::LocaleSet catalog;strcpy_s(catalog.defaultTag,str(response,"default"));auto*list=cJSON_GetObjectItemCaseSensitive(response,"supported");catalog.count=unsigned(cJSON_GetArraySize(list));for(unsigned i=0;i<catalog.count&&i<sdk::localeLimit;++i)strcpy_s(catalog.tags[i],cJSON_GetArrayItem(list,i)->valuestring);
     if(!host.setLocale(owner,str(response,"locale"),cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(response,"registered")),str(response,"requested"),sdk::localeSetValid(catalog)?&catalog:nullptr))result=DT_ERR_OUT_OF_MEMORY;
    }
   }else if(operation.compare(0,6,"files.")==0){result=files.command(*caller,operation.c_str(),request.get(),response);if(result==DT_OK&&!response)response=cJSON_CreateObject();}
   else result=shared.command(*caller,operation.c_str(),request.get(),response);
  }catch(...){result=DT_ERR_STORAGE;}
  Json owned(response,cJSON_Delete);char *payload=result==DT_OK&&response?cJSON_PrintUnformatted(response):nullptr;
  if(result==DT_OK&&!payload)result=DT_ERR_OUT_OF_MEMORY;
  const auto completed=host.completeRequest(owner,id,result,payload,payload?strlen(payload):0);cJSON_free(payload);
  if(completed!=DT_OK)throw std::runtime_error("Shared service completion failed");
 }
 std::string locale="zh-HK",keyboardOptions;dt_request_id keyboard=0;
 std::string fileOptions;dt_request_id fileRequest=0;int battery=78,wifi=2;bool charging=false;
 struct SelectedFile {fs::path path;bool writable;};std::map<std::string,SelectedFile> selections;unsigned selectionSerial=0;
 dt_result networkRequest(dt_app_context owner,const runtime::AppContext&,dt_bytes input,dt_request_id id)override{return network.start(owner,input,id);}
 dt_result notificationPost(dt_app_context owner,const runtime::AppContext&caller,dt_bytes value,dt_request_id request)override{return notificationHost?notifications.post(*notificationHost,owner,caller,value,request):DT_ERR_INVALID_ARGUMENT;}
 bool notificationsSupported()const override{return true;}
 dt_result cancelRequest(dt_app_context owner,dt_request_id id)override{network.cancel(owner,id);if(keyboard==id){keyboard=0;keyboardOptions.clear();}if(fileRequest==id){fileRequest=0;fileOptions.clear();}if(dataRequest==id){dataRequest=0;dataCaller=nullptr;dataOptions.clear();}return DT_OK;}
 dt_result keyboardShow(dt_app_context,const runtime::AppContext&,dt_bytes options,dt_request_id id)override{if(keyboard)return DT_ERR_BUSY;keyboard=id;keyboardOptions.assign(reinterpret_cast<const char*>(options.data),options.size);return DT_OK;}
 dt_result deviceState(const runtime::AppContext&,dt_device_state_v1&)override;
 bool platformSupported()const override{return true;}
 bool taskDueTimeSupported()const override{return true;}
 bool filePickerSupported()const override{return true;}
 dt_result platformRequest(dt_app_context,const runtime::AppContext&,dt_bytes,dt_request_id)override;
 bool localesSupported()const override{return true;}
 const char*systemLocale()const override{return locale.c_str();}
 dt_result localeInfo(const runtime::AppContext&c,dt_locale_info_v1&i)override{i={};i.structure_size=sizeof(i);i.schema=1;i.use_24_hour=1;strcpy_s(i.system_locale,locale.c_str());strcpy_s(i.application_locale,c.locale());return DT_OK;}
};
struct Preview{
 struct FrameProbe {std::string path;int duration=3500;std::chrono::steady_clock::time_point start;std::vector<double> frames;};
 std::unique_ptr<FrameProbe> frameProbe;
 runtime::NativeSdkHost host;runtime::AppContext context;dt_app_context owner=0;
 Resources resources;Storage storage,cache;Services services;
 std::unique_ptr<runtime::DynamicAppRunner> app;
 RgbScanout screen;Canvas canvas;std::vector<uint32_t> pixels=std::vector<uint32_t>(800*480);
 HWND window=nullptr,keyboardWindow=nullptr,edit=nullptr;bool dark=false,failed=false,scripted=false,changed=true;
 bool bounds=false,performance=false,ticking=false,nativeRuntime=false;int frameLimit=60;uint64_t lastPaint=0,metricsAt=0;uint32_t frameCount=0;double updateMs=0,paintMs=0;std::wstring metrics=L"800 x 480";
 std::chrono::steady_clock::time_point nextFrame{};
 bool appMenuVisible=false,popupOpen=false;int appMenuPressed=-1;std::string displayName;DialogMotion menuMotion;
 preview_notifications::Overlay notificationOverlay;std::string notificationIcon;bool notificationSystemIcon=false;
 bool notificationBlocked(){runtime::NativeSdkHost::PermissionRequestView permission;return canvas.dialogVisible()||appMenuVisible||menuMotion.moving()||keyboardWindow||settingsWindow||popupOpen||services.keyboard||host.nextPermissionRequest(permission);}
 void drawNotification(const NotificationQueue::Item&item){
  Canvas::UiFontScope systemFont(canvas,false);ui::notification_banner::background(canvas);
  bool drawn=false;if(!notificationIcon.empty()){ui::CanvasComponentTarget target(canvas,&resources,host.context(owner),false);if(notificationSystemIcon)target.setImageInk(ui::theme().onAccent);drawn=target.image(ui::notification_banner::iconBounds,notificationIcon.c_str());}
  if(!drawn)ui::icon(canvas,ui_icons::Id::Notifications,ui::notification_banner::iconBounds,ui::theme().onAccent);
  SYSTEMTIME time;GetLocalTime(&time);char clock[20],relative[64];sprintf_s(clock,"%02u:%02u",time.wHour,time.wMinute);ui::notification_time::format(relative,sizeof(relative),item.eventTime,::time(nullptr),services.locale.c_str());
  const std::string message=std::string(item.title)+(item.body[0]?" ":"")+item.body;
  ui::notification_banner::text(canvas,displayName.c_str(),message.c_str(),clock,relative);
 }
 double dpi=1.0,zoom=1.0;bool fit=false;HWND settingsWindow=nullptr;HFONT formFont=nullptr;
 int settingValues[5]{};bool settingCharging=false;
 void loadPreferences(){auto v=preview_config::read(preview_config::directory());dark=v.dark;fit=v.fit;zoom=v.zoom;bounds=v.bounds;performance=v.performance;frameLimit=v.fps;services.locale=v.locale;services.battery=v.battery;services.wifi=v.wifi;services.charging=v.charging;native_ui::setWesternFont(sdk::WesternFont(v.font));}
 void savePreferences(){preview_config::Values v;v.dark=dark;v.fit=fit;v.zoom=zoom;v.bounds=bounds;v.performance=performance;v.fps=frameLimit;v.locale=services.locale;v.battery=services.battery;v.wifi=services.wifi;v.charging=services.charging;v.font=int(native_ui::currentWesternFont);preview_config::write(preview_config::directory(),v);}
 RECT viewport()const;POINT logicalPoint(int x,int y)const;void resizePreview();void layoutToolbar();void openSettings();bool applySettings();void processFile(const std::wstring*scriptPath=nullptr);bool desktopScenario(cJSON*);void drawAppMenu();Rect appMenuRow(size_t,size_t)const;int appMenuHit(int,int);void appMenuPointer(int,int,int);
 HWND themeControl=nullptr,boundsControl=nullptr,performanceControl=nullptr,rateControl=nullptr;HFONT chromeFont=nullptr;
 HFONT systemFont(){if(!chromeFont){NONCLIENTMETRICSW m{};m.cbSize=sizeof(m);SystemParametersInfoW(SPI_GETNONCLIENTMETRICS,sizeof(m),&m,0);m.lfMessageFont.lfHeight=int(std::lround(m.lfMessageFont.lfHeight/dpi));chromeFont=CreateFontIndirectW(&m.lfMessageFont);}return chromeFont;}
 HFONT panelFont(){if(!formFont){NONCLIENTMETRICSW m{};m.cbSize=sizeof(m);SystemParametersInfoW(SPI_GETNONCLIENTMETRICS,sizeof(m),&m,0);formFont=CreateFontIndirectW(&m.lfMessageFont);}return formFont;}
 RECT controlRect(int id,int width=0){if(!width){RECT r{0,0,800,556};if(window)GetClientRect(window,&r);width=window?int(r.right/dpi):800;}HDC dc=GetDC(nullptr);auto old=SelectObject(dc,systemFont());int x=8,y=6;RECT result{};for(int n=201;n<=id;++n){SIZE s{};auto text=controlLabel(n);GetTextExtentPoint32W(dc,text.c_str(),int(text.size()),&s);const int reserve=n==202||n==203?38:n==201||n==204?40:24;const int w=s.cx+reserve;if(x+w>width-8&&x>8){x=8;y+=36;}result={x,y,x+w,y+32};x+=w+4;}SelectObject(dc,old);ReleaseDC(nullptr,dc);return result;}
 int toolbarHeight(int width=0){return controlRect(206,width).bottom+6;}
 std::wstring controlLabel(int id)const{switch(id){case 201:return dark?L"Dark theme":L"Light theme";case 202:return L"Layout bounds";case 203:return L"Performance";case 204:return std::to_wstring(frameLimit)+L" FPS";case 205:return L"App menu";default:return L"Settings";}}
 bool controlChecked(int id)const{return id==202?bounds:id==203?performance:false;}
 void paintControl(HDC dc,int id,RECT r,bool pressed=false,bool focused=false){
  const bool checked=controlChecked(id),toggle=id==202||id==203,hot=window&&GetPropW(GetDlgItem(window,id),L"DeskTileHot");auto fill=CreateSolidBrush(pressed?RGB(220,225,230):checked?RGB(224,237,249):hot?RGB(235,238,241):RGB(246,246,246));FillRect(dc,&r,fill);DeleteObject(fill);
  SelectObject(dc,systemFont());SetBkMode(dc,TRANSPARENT);SetTextColor(dc,RGB(32,32,32));RECT text=r;text.left+=toggle?30:12;text.right-=id==201||id==204?28:8;
  if(toggle){RECT box{r.left+9,r.top+10,r.left+21,r.top+22};auto pen=CreatePen(PS_SOLID,1,checked?RGB(0,100,180):RGB(100,100,100));auto oldPen=SelectObject(dc,pen),oldBrush=SelectObject(dc,GetStockObject(NULL_BRUSH));Rectangle(dc,box.left,box.top,box.right,box.bottom);if(checked){MoveToEx(dc,box.left+2,box.top+6,nullptr);LineTo(dc,box.left+5,box.top+9);LineTo(dc,box.right-2,box.top+3);}SelectObject(dc,oldPen);SelectObject(dc,oldBrush);DeleteObject(pen);}
  const auto label=controlLabel(id);DrawTextW(dc,label.c_str(),-1,&text,DT_LEFT|DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX);
  if(id==201||id==204){auto pen=CreatePen(PS_SOLID,1,RGB(70,70,70));auto old=SelectObject(dc,pen);const int x=r.right-18,y=r.top+14;MoveToEx(dc,x,y,nullptr);LineTo(dc,x+4,y+4);LineTo(dc,x+8,y);SelectObject(dc,old);DeleteObject(pen);}
  if(focused){InflateRect(&r,-2,-2);DrawFocusRect(dc,&r);}
 }
 void paintChrome(HDC dc,int width=800,int height=556){const int topHeight=toolbarHeight(width);RECT all{0,0,width,height},top{0,0,width,topHeight},bottom{0,height-28,width,height};auto fill=CreateSolidBrush(RGB(224,224,224));FillRect(dc,&all,fill);DeleteObject(fill);fill=CreateSolidBrush(RGB(246,246,246));FillRect(dc,&top,fill);FillRect(dc,&bottom,fill);DeleteObject(fill);for(int id=201;id<=206;++id)paintControl(dc,id,controlRect(id,width));SelectObject(dc,systemFont());SetBkMode(dc,TRANSPARENT);SetTextColor(dc,RGB(70,70,70));bottom.left=12;DrawTextW(dc,metrics.c_str(),-1,&bottom,DT_LEFT|DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX|DT_END_ELLIPSIS);auto pen=CreatePen(PS_SOLID,1,RGB(150,150,150));auto old=SelectObject(dc,pen);MoveToEx(dc,0,topHeight,nullptr);LineTo(dc,width,topHeight);MoveToEx(dc,0,height-29,nullptr);LineTo(dc,width,height-29);SelectObject(dc,old);DeleteObject(pen);}
 void refreshControls(){for(int id=201;window&&id<=206;++id){auto h=GetDlgItem(window,id);SetWindowTextW(h,controlLabel(id).c_str());InvalidateRect(h,nullptr,FALSE);}}
 void saveChrome(const fs::path&path){
  HDC dc=CreateCompatibleDC(nullptr);BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=800;info.bmiHeader.biHeight=-556;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;void*bits=nullptr;HBITMAP bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,&bits,nullptr,0);auto old=SelectObject(dc,bitmap);paintChrome(dc);
  for(int id=201;id<=206;++id){SIZE size{};auto label=controlLabel(id);GetTextExtentPoint32W(dc,label.c_str(),int(label.size()),&size);auto r=controlRect(id);const int reserve=(id==202||id==203)?38:(id==201||id==204)?40:20;if(size.cx>r.right-r.left-reserve)throw std::runtime_error("Toolbar label does not fit");}
  auto*out=static_cast<uint32_t*>(bits);for(int y=0;y<480;++y)memcpy(out+(y+48)*800,pixels.data()+y*800,800*4);GdiFlush();BITMAPFILEHEADER file{};file.bfType=0x4d42;file.bfOffBits=sizeof(file)+sizeof(BITMAPINFOHEADER);file.bfSize=file.bfOffBits+800*556*4;std::ofstream f(path,std::ios::binary);f.write(reinterpret_cast<char*>(&file),sizeof(file));f.write(reinterpret_cast<char*>(&info.bmiHeader),sizeof(BITMAPINFOHEADER));f.write(static_cast<char*>(bits),800*556*4);SelectObject(dc,old);DeleteObject(bitmap);DeleteDC(dc);
 }
 uint32_t revision=0;int64_t second=-1;std::string name;fs::path project;
 void check(dt_result result,const char*operation){if(result!=DT_OK){failed=true;throw std::runtime_error(std::string(operation)+" failed: "+std::to_string(result));}}
 template<class T>void send(dt_ui_event e,const T&v){check(app->event(e,{reinterpret_cast<const uint8_t*>(&v),sizeof(v)}),"Application event");}
 void route(){ui::RoutedUiEvent e;while(host.takeUiEvent(owner,e)){
  if(e.event>=DT_EVENT_POINTER_DOWN&&e.event<=DT_EVENT_POINTER_CANCEL)send(e.event,e.pointer);
  else if(e.event==DT_EVENT_VALUE_CHANGED||e.event==DT_EVENT_APP_MENU){dt_value_event v{e.target,e.value};send(e.event,v);}
  else if(e.event==DT_EVENT_DATE_TIME_CHANGED)send(e.event,e.dateTime);
  else if(e.event==DT_EVENT_LANGUAGE_CHANGED)send(e.event,e.language);
  else {dt_component_event v{e.target};send(e.event,v);}
 }}
 void start(const fs::path&root,const fs::path&fonts,const std::string&locale,bool light){
  project=fs::canonical(root);resources.root=project;services.locale=locale;dark=!light;
  auto manifest=parse(loadFile(project/L"manifest.json"));if(!manifest)throw std::runtime_error("Invalid manifest.json");
  const bool native=!strcmp(str(manifest.get(),"runtime"),"native-module");nativeRuntime=native;if(!native&&strcmp(str(manifest.get(),"runtime"),"javascript"))throw std::runtime_error("Unsupported application runtime");
  name=str(manifest.get(),"id");auto*names=cJSON_GetObjectItemCaseSensitive(manifest.get(),"name");displayName=cJSON_IsObject(names)?str(names,locale.c_str(),str(names,"en",str(names,"en-US",name.c_str()))):str(manifest.get(),"name",name.c_str());security::PermissionSet declared=0;auto*permissions=cJSON_GetObjectItemCaseSensitive(manifest.get(),"permissions");cJSON *permission=nullptr;cJSON_ArrayForEach(permission,permissions){if(cJSON_IsString(permission)){auto*d=security::definition(permission->valuestring);if(d&&d->manifestDeclarable&&!d->systemOnly)declared|=security::bit(d->permission);}}
  if(!context.configure(name.c_str(),runtime::Trust::Development,declared,0))throw std::runtime_error("Invalid package identity");
  context.setLaunchOrigin(DT_LAUNCH_DESKTOP);check(host.registerContext(context,owner),"Register application");host.setLocale(owner,locale.c_str(),false);
  storage.root=project/L".desktile"/L"preview-data"/fs::u8path(name)/L"private";cache.root=storage.root.parent_path()/L"cache";
  services.bindShared(project/L".desktile"/L"preview-data"/L"system");
  host.bindResources(&resources);host.bindPrivateStorage(&storage);host.bindPrivateCache(&cache);host.bindSystemServices(&services);services.notificationHost=&host;
  auto*notification=cJSON_GetObjectItemCaseSensitive(cJSON_GetObjectItemCaseSensitive(manifest.get(),"icons"),"notification");notificationIcon=str(notification,"path");notificationSystemIcon=!strcmp(str(notification,"mode"),"system");
  host.bindTextMeasurer([](dt_bytes text,uint16_t size)->int32_t{std::string value(reinterpret_cast<const char*>(text.data),text.size);return ui::sizedTextWidth(value.c_str(),size,false);});
  fontPack=loadFile(fonts);if(fontPack.size()<native_ui::externalCodepointsOffset+native_ui::externalCodepointCount*4)throw std::runtime_error("Incomplete font pack");native_ui::glyphFinder=findGlyph;native_ui::glyphLoader=loadGlyph;
  ui::setTheme(light,0xff9900);host.setSurfaceViewport({0,32,800,448});host.setTextMeasure([](const char*s,int z){return ui::sizedTextWidth(s,z,false);});canvas.begin(&screen);
  package::AppManifest m{};auto*entry=cJSON_GetObjectItemCaseSensitive(manifest.get(),"entry");const auto*doc=str(entry,"document",str(entry,"ui"));const auto*script=str(entry,"script");
  if(strlen(doc)>=sizeof(m.document)||strlen(script)>=sizeof(m.entry))throw std::runtime_error("Entry path is too long");strcpy_s(m.document,doc);strcpy_s(m.entry,script);
  if(native)app=std::make_unique<DesktopNativeRunner>(host,owner,project/L".desktile"/L"preview-native"/L"app.dll");else app=std::make_unique<runtime::JavaScriptAppRunner>(host,owner);menuMotion.enable();check(app->enter(m),"Application start");route();render();
 }
 void render(){auto began=std::chrono::steady_clock::now();const bool cachedMenuFrame=menuMotion.moving();ui::motion::clock=uint32_t(host.api()->monotonic_ms(owner));host.setSurfaceViewport(host.surfaceFullscreen()?Rect{0,0,800,480}:Rect{0,32,800,448});canvas.beginFrame({0,0,800,480});if(!cachedMenuFrame){canvas.clear(ui::theme().surface);
  uint32_t fill=0,ink=0;host.statusBarColors(ui::CanvasComponentTarget::systemTheme(),fill,ink);canvas.fillRect(0,0,800,32,ui::schemeColor(fill));
  SYSTEMTIME time;GetLocalTime(&time);char clock[16];sprintf_s(clock,"%02u:%02u",time.wHour,time.wMinute);ui::sizedText(canvas,{16,0,120,32},clock,ui::schemeColor(ink),20);
  drawStatus(ui::schemeColor(ink),ui::schemeColor(fill));
  ui::CanvasComponentTarget target(canvas,&resources,host.context(owner));if(host.renderPresented(target,ui::CanvasComponentTarget::systemTheme(),host.api()->monotonic_ms(owner))!=ui::RenderError::None)throw std::runtime_error("Component rendering failed");
  if(bounds){auto*l=host.presentedLayout();for(size_t i=0;l&&i<l->count();++i){auto*b=l->at(i);const int x=std::max(b->bounds.x,b->clip.x),y=std::max(b->bounds.y,b->clip.y),right=std::min(b->bounds.x+b->bounds.w,b->clip.x+b->clip.w),bottom=std::min(b->bounds.y+b->bounds.h,b->clip.y+b->clip.h);if(right>x&&bottom>y)canvas.drawRect(x,y,right-x,bottom-y,Canvas::rgb(226,0,121));}}
  }const auto motionNow=uint32_t(host.api()->monotonic_ms(owner));
  if(menuMotion.moving())menuMotion.compose(screen.buffer,motionNow);
  else{menuMotion.begin({0,0,800,480});if(appMenuVisible){menuMotion.mark({{440,0,360,480},DialogMotion::Kind::Right,0},screen.buffer,{0,0,800,480});drawAppMenu();}menuMotion.prepare(screen.buffer,motionNow);}
  menuMotion.submitted(motionNow);
  notificationOverlay.step(services.notifications.queue,notificationBlocked(),motionNow);
  notificationOverlay.compose(screen.buffer,motionNow,[&](const NotificationQueue::Item&item){drawNotification(item);});
  if(performance){paintMs=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-began).count();++frameCount;}
  lastPaint=host.api()->monotonic_ms(owner);ui::motion::presented(uint32_t(lastPaint));
  for(size_t i=0;i<pixels.size();++i){auto p=screen.buffer[i];pixels[i]=((((p>>11)&31)*255/31)<<16)|((((p>>5)&63)*255/63)<<8)|((p&31)*255/31);}
  revision=host.surfaceRevision();changed=cachedMenuFrame;if(window){auto r=viewport();InvalidateRect(window,&r,FALSE);}
 }
 void tick(){if(failed||ticking)return;TickGuard tickGuard(ticking);const auto now=host.api()->monotonic_ms(owner);host.servicePointerRepeat(now);route();auto began=std::chrono::steady_clock::now();check(app->update(now),"Application update");if(performance)updateMs=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-began).count();route();
  if(frameProbe){const auto elapsed=std::chrono::duration<double,std::milli>(began-frameProbe->start).count();if(elapsed>=frameProbe->duration){if(window)PostMessageW(window,WM_CLOSE,0,0);return;}const bool show=int(elapsed/500)%2==0;if(!menuMotion.moving()&&show!=appMenuVisible)menu();}
  services.processData(host);
  services.network.process(host);
  runtime::NativeSdkHost::RequestCompletion complete;while(host.takeRequestCompletion(owner,complete))send(DT_EVENT_REQUEST_COMPLETE,complete.event);
  ui::motion::tick(uint32_t(now),[&](Rect){changed=true;});
  if(notificationOverlay.step(services.notifications.queue,notificationBlocked(),uint32_t(now)))changed=true;
  const auto frameNow=std::chrono::steady_clock::now();auto damage=host.animationDamage(now);
  if(frameNow>=nextFrame){const auto interval=std::chrono::nanoseconds(1000000000/std::clamp(frameLimit,1,60));nextFrame+=interval;if(nextFrame<=frameNow)nextFrame=frameNow+interval;
   if(changed||menuMotion.moving()||host.surfaceRevision()!=revision||damage.w>0||second!=int64_t(now/1000)){second=now/1000;render();}
  }
  if(performance&&now-metricsAt>=1000){wchar_t text[230];swprintf_s(text,L"Host: %.1f FPS    %s update: %.2f ms    Paint: %.2f ms    Scroll cache: %zu KiB%s",frameCount*1000.0/std::max<uint64_t>(1,now-metricsAt),nativeRuntime?L"Native":L"JS",updateMs,paintMs,host.scrollCacheBytes()/1024,nativeRuntime?L"":L"    JS limit: 512 KiB");metrics=text;frameCount=0;metricsAt=now;if(window){RECT r;GetClientRect(window,&r);r.top=r.bottom-int(28*dpi);InvalidateRect(window,&r,FALSE);}}
  if(host.takeExitRequest(owner)&&window)PostMessageW(window,WM_CLOSE,0,0);
  const bool panelOpen=keyboardWindow||settingsWindow||popupOpen;
  if(!scripted&&!panelOpen&&services.keyboard)openKeyboard();
  if(!panelOpen&&!keyboardWindow&&services.fileRequest&&(!scripted||services.fileOptions.find("files.pick")==std::string::npos))processFile();
  if(!scripted&&!panelOpen&&!keyboardWindow){runtime::NativeSdkHost::PermissionRequestView p;if(host.nextPermissionRequest(p)){auto text=wide(std::string("Allow ")+security::definition(p.permission)->name+" in this local preview?");const bool yes=MessageBoxW(window,text.c_str(),L"DeskTile Preview",MB_YESNO|MB_ICONQUESTION)==IDYES;check(host.resolvePermissionRequest(p.request,yes),"Permission response");dt_permission_result_event result;while(host.takePermissionResult(owner,result))send(DT_EVENT_PERMISSION_RESULT,result);}}
 }
 void pointer(int kind,int x,int y){if(notificationOverlay.pointer(services.notifications.queue,kind,x,y,uint32_t(host.api()->monotonic_ms(owner)),notificationBlocked(),[&](const NotificationQueue::Item&item){dt_notification_event_v1 event{};strcpy_s(event.id,item.id);strcpy_s(event.data,item.data);send(DT_EVENT_NOTIFICATION,event);})){host.cancelPointer();changed=true;tick();return;}if(keyboardWindow||settingsWindow||popupOpen||menuMotion.moving())return;if(appMenuVisible){appMenuPointer(kind,x,y);changed=true;tick();return;}if(kind==0)host.pointerDown(x,y);if(kind==1)host.pointerMove(x,y);if(kind==2)host.pointerUp(x,y);route();changed=true;tick();}
 void releasePointer(int x,int y,const std::function<void()>&releaseCapture){pointer(2,x,y);releaseCapture();}
 void wheel(int x,int y,int delta){if(appMenuVisible||menuMotion.moving()||popupOpen||keyboardWindow||settingsWindow)return;auto*l=host.presentedLayout();if(!l)return;auto h=l->scrollAncestor(x,y);if(h){host.viewScrollTo(h,std::max(0,host.viewScrollOffset(h)-delta));changed=true;tick();}}
 void keyboardReply(const std::string&text,bool accepted){auto id=services.keyboard;services.keyboard=0;services.keyboardOptions.clear();check(host.completeRequest(owner,id,accepted?DT_OK:DT_ERR_CANCELLED,text.data(),text.size()),"Keyboard completion");changed=true;}
 void openKeyboard();
 void drawStatus(uint16_t ink,uint16_t background);
 void setTheme(bool value){dark=value;ui::setTheme(!dark,0xff9900);check(app->lifecycle(DT_LIFECYCLE_THEME_CHANGED),"Theme change");changed=true;refreshControls();}
 void setLanguage(const std::string&value){
  if(value!="zh-CN"&&value!="zh-HK"&&value!="en-US")throw std::runtime_error("Unsupported preview language");
  if(services.locale==value)return;
  services.locale=value;host.cancelPointer();ui::motion::reset();host.refreshSystemLocale();route();
  auto manifest=parse(loadFile(project/L"manifest.json"));auto*names=cJSON_GetObjectItemCaseSensitive(manifest.get(),"name");
  displayName=cJSON_IsObject(names)?str(names,value.c_str(),str(names,"en",str(names,"en-US",name.c_str()))):str(manifest.get(),"name",name.c_str());
  changed=true;
 }
 void toolbar(){
  for(int id=201;id<=206;++id){auto r=controlRect(id);auto h=CreateWindowW(L"BUTTON",controlLabel(id).c_str(),WS_CHILD|WS_VISIBLE|WS_TABSTOP|BS_OWNERDRAW,int(r.left*dpi),int(r.top*dpi),int((r.right-r.left)*dpi),int((r.bottom-r.top)*dpi),window,(HMENU)(INT_PTR)id,GetModuleHandleW(nullptr),nullptr);auto original=SetWindowLongPtrW(h,GWLP_WNDPROC,(LONG_PTR)flatControlProc);SetPropW(h,L"DeskTileOriginalProc",(HANDLE)original);}
 }
 void toolbarCommand(int id){
  if(id==201||id==204){const int rates[]{60,30,15};const std::vector<std::wstring> items=id==201?std::vector<std::wstring>{L"Light",L"Dark"}:std::vector<std::wstring>{L"60 FPS",L"30 FPS",L"15 FPS"};const int selected=id==201?int(dark):frameLimit==60?0:frameLimit==30?1:2;const int choice=flatPopup(this,window,GetDlgItem(window,id),items,selected);if(choice>=0){if(id==201)setTheme(choice==1);else frameLimit=rates[choice];layoutToolbar();}}
  if(id==202){bounds=!bounds;changed=true;}if(id==203){performance=!performance;metrics=L"800 x 480";metricsAt=host.api()->monotonic_ms(owner);frameCount=0;changed=true;}if(id==205)menu(true);if(id==206)openSettings();if(id>=201&&id<=204&&!scripted)savePreferences();refreshControls();tick();
 }

 void menu(bool anchored=false){if(keyboardWindow||settingsWindow||popupOpen||menuMotion.moving())return;host.cancelPointer();appMenuVisible=!appMenuVisible;appMenuPressed=-1;changed=true;render();}
 void save(const fs::path&base){render();std::ofstream f(base.wstring()+L".rgb565",std::ios::binary);f.write(reinterpret_cast<char*>(screen.buffer),sizeof(screen.buffer));Json dump(cJSON_CreateArray(),cJSON_Delete);auto*l=host.presentedLayout();for(size_t i=0;l&&i<l->count();++i){auto*b=l->at(i);Json row(cJSON_CreateObject(),cJSON_Delete);cJSON_AddNumberToObject(row.get(),"handle",b->handle);cJSON_AddNumberToObject(row.get(),"x",b->bounds.x);cJSON_AddNumberToObject(row.get(),"y",b->bounds.y);cJSON_AddNumberToObject(row.get(),"width",b->bounds.w);cJSON_AddNumberToObject(row.get(),"height",b->bounds.h);ui::ComponentTree::PropertyView v{};if(host.components()->property(owner,b->handle,DT_PROPERTY_TEXT,v)){auto s=std::string(reinterpret_cast<const char*>(v.value.data),v.value.size);cJSON_AddStringToObject(row.get(),"text",s.c_str());}cJSON_AddItemToArray(dump.get(),row.release());}char*json=cJSON_Print(dump.get());std::ofstream(base.wstring()+L".json")<<json;cJSON_free(json);}
 ~Preview(){if(app)app->leave();if(owner)host.unregisterContext(owner);if(chromeFont)DeleteObject(chromeFont);if(formFont)DeleteObject(formFont);native_ui::glyphFinder=nullptr;native_ui::glyphLoader=nullptr;}
};
static Preview*active=nullptr;
#include "preview_desktop.h"
#include "preview_files.h"
static LRESULT CALLBACK keyboardProc(HWND w,UINT msg,WPARAM a,LPARAM b){if(msg==WM_CTLCOLORSTATIC||msg==WM_CTLCOLOREDIT)return panelColor(a);if(msg==WM_DRAWITEM){drawPanelButton(active,reinterpret_cast<DRAWITEMSTRUCT*>(b));return TRUE;}if(msg==WM_COMMAND&&(LOWORD(a)==IDOK||LOWORD(a)==IDCANCEL)||msg==WM_CLOSE){bool accept=msg==WM_COMMAND&&LOWORD(a)==IDOK;auto*p=active;int n=GetWindowTextLengthW(p->edit);std::wstring text(n+1,0);GetWindowTextW(p->edit,text.data(),n+1);text.resize(n);try{auto data=utf8(text);Json options(cJSON_Parse(p->services.keyboardOptions.c_str()),cJSON_Delete);int limit=num(options.get(),"maximum_length",4096);if(accept&&data.size()>size_t(limit)){MessageBoxW(w,L"The entered text exceeds this field's byte limit.",L"Text too long",MB_OK);return 0;}p->keyboardWindow=nullptr;p->edit=nullptr;EnableWindow(p->window,TRUE);DestroyWindow(w);p->keyboardReply(data,accept);SetForegroundWindow(p->window);p->tick();}catch(const std::exception&e){MessageBoxW(p->window,wide(e.what()).c_str(),L"Preview error",MB_OK);p->failed=true;}return 0;}return DefWindowProcW(w,msg,a,b);}
void Preview::openKeyboard(){
 Json options(cJSON_Parse(services.keyboardOptions.c_str()),cJSON_Delete);WNDCLASSW c{};c.lpfnWndProc=keyboardProc;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=L"DeskTilePreviewInput";c.hbrBackground=(HBRUSH)(COLOR_WINDOW+1);c.hCursor=LoadCursor(nullptr,IDC_ARROW);RegisterClassW(&c);
 const bool multiline=!strcmp(str(options.get(),"input_type"),"multiline");const int height=multiline?340:156;
 RECT owner;GetWindowRect(window,&owner);RECT r{0,0,int(640*dpi),int(height*dpi)};DWORD style=WS_CAPTION|WS_SYSMENU;AdjustWindowRectEx(&r,style,FALSE,WS_EX_DLGMODALFRAME);
 keyboardWindow=CreateWindowExW(WS_EX_DLGMODALFRAME,c.lpszClassName,wide(str(options.get(),"title","Text input")).c_str(),style|WS_VISIBLE,owner.left+int(50*dpi),owner.top+int(60*dpi),r.right-r.left,r.bottom-r.top,window,nullptr,c.hInstance,nullptr);
 edit=panelControl(this,keyboardWindow,L"EDIT",wide(str(options.get(),"initial")).c_str(),WS_TABSTOP|ES_AUTOVSCROLL|(multiline?ES_MULTILINE|ES_WANTRETURN|WS_VSCROLL:ES_AUTOHSCROLL),10,24,24,592,multiline?232:40);
 RECT text{int(10*dpi),int(8*dpi),int(568*dpi),int(220*dpi)};if(multiline)SendMessageW(edit,EM_SETRECT,0,(LPARAM)&text);else SendMessageW(edit,EM_SETMARGINS,EC_LEFTMARGIN|EC_RIGHTMARGIN,MAKELPARAM(int(10*dpi),int(10*dpi)));
 SendMessageW(edit,EM_SETLIMITTEXT,num(options.get(),"maximum_length",4096),0);
 panelControl(this,keyboardWindow,L"BUTTON",L"Cancel",WS_TABSTOP,IDCANCEL,392,height-60,104,36);panelControl(this,keyboardWindow,L"BUTTON",L"OK",WS_TABSTOP|BS_DEFPUSHBUTTON,IDOK,512,height-60,104,36);
 EnableWindow(window,FALSE);SetFocus(edit);
}
static LRESULT CALLBACK windowProc(HWND w,UINT msg,WPARAM a,LPARAM b){
 auto*p=active;
 try{if(popupMessage(p,msg,b))return TRUE;switch(msg){
 case WM_COMMAND:if(LOWORD(a)>=201&&LOWORD(a)<=206)p->toolbarCommand(LOWORD(a));return 0;
 case WM_DRAWITEM:{auto*d=reinterpret_cast<DRAWITEMSTRUCT*>(b);if(d->CtlID>=201&&d->CtlID<=206){auto saved=SaveDC(d->hDC);SetGraphicsMode(d->hDC,GM_ADVANCED);XFORM scale{FLOAT(p->dpi),0,0,FLOAT(p->dpi),0,0};SetWorldTransform(d->hDC,&scale);RECT r{0,0,LONG((d->rcItem.right-d->rcItem.left)/p->dpi),32};p->paintControl(d->hDC,d->CtlID,r,(d->itemState&ODS_SELECTED)!=0,(d->itemState&ODS_FOCUS)!=0);RestoreDC(d->hDC,saved);return TRUE;}break;}
 case WM_SIZE:p->layoutToolbar();return 0;
 case WM_GETMINMAXINFO:{auto*m=reinterpret_cast<MINMAXINFO*>(b);m->ptMinTrackSize={LONG(480*p->dpi),LONG(320*p->dpi)};return 0;}
 case WM_TIMER:if(std::chrono::steady_clock::now()>=p->nextFrame)p->tick();return 0;
 case WM_ERASEBKGND:return 1;
 case WM_LBUTTONDOWN:{POINT q{GET_X_LPARAM(b),GET_Y_LPARAM(b)};auto r=p->viewport();if(PtInRect(&r,q)){SetCapture(w);auto point=p->logicalPoint(q.x,q.y);p->pointer(0,point.x,point.y);}return 0;}
 case WM_MOUSEMOVE:if(GetCapture()==w&&(a&MK_LBUTTON)){auto point=p->logicalPoint(GET_X_LPARAM(b),GET_Y_LPARAM(b));p->pointer(1,point.x,point.y);}return 0;
 case WM_LBUTTONUP:if(GetCapture()==w){auto point=p->logicalPoint(GET_X_LPARAM(b),GET_Y_LPARAM(b));p->releasePointer(point.x,point.y,[]{ReleaseCapture();});}return 0;
 case WM_CAPTURECHANGED:p->host.cancelPointer();p->appMenuPressed=-1;p->changed=true;return 0;
 case WM_MOUSEWHEEL:{POINT q{GET_X_LPARAM(b),GET_Y_LPARAM(b)};ScreenToClient(w,&q);auto r=p->viewport();if(PtInRect(&r,q)){q=p->logicalPoint(q.x,q.y);p->wheel(q.x,q.y,GET_WHEEL_DELTA_WPARAM(a)/3);}return 0;}
 case WM_RBUTTONUP:p->menu();return 0;
 case WM_KEYDOWN:if(a==VK_ESCAPE){if(p->appMenuVisible)p->menu();else p->check(p->app->requestExit(),"Back");p->changed=true;}if(a==VK_F10)p->menu();return 0;
 case WM_PAINT:{
  PAINTSTRUCT paint;auto target=BeginPaint(w,&paint);
  RECT client;GetClientRect(w,&client);if(client.right<=0||client.bottom<=0){EndPaint(w,&paint);return 0;}auto dc=CreateCompatibleDC(target);auto bitmap=CreateCompatibleBitmap(target,client.right,client.bottom);auto original=SelectObject(dc,bitmap);
  auto saved=SaveDC(dc);SetGraphicsMode(dc,GM_ADVANCED);XFORM scale{FLOAT(p->dpi),0,0,FLOAT(p->dpi),0,0};SetWorldTransform(dc,&scale);p->paintChrome(dc,int(client.right/p->dpi),int(client.bottom/p->dpi));RestoreDC(dc,saved);
  BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=800;info.bmiHeader.biHeight=-480;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;info.bmiHeader.biCompression=BI_RGB;
  auto r=p->viewport();SetStretchBltMode(dc,HALFTONE);SetBrushOrgEx(dc,0,0,nullptr);StretchDIBits(dc,r.left,r.top,r.right-r.left,r.bottom-r.top,0,0,800,480,p->pixels.data(),&info,DIB_RGB_COLORS,SRCCOPY);auto border=CreateSolidBrush(RGB(150,150,150));InflateRect(&r,1,1);FrameRect(dc,&r,border);DeleteObject(border);
  BitBlt(target,paint.rcPaint.left,paint.rcPaint.top,paint.rcPaint.right-paint.rcPaint.left,paint.rcPaint.bottom-paint.rcPaint.top,dc,paint.rcPaint.left,paint.rcPaint.top,SRCCOPY);SelectObject(dc,original);DeleteObject(bitmap);DeleteDC(dc);EndPaint(w,&paint);
  if(p->frameProbe&&p->menuMotion.moving())p->frameProbe->frames.push_back(std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-p->frameProbe->start).count());return 0;
 }
 case WM_CLOSE:DestroyWindow(w);return 0;
 case WM_DESTROY:KillTimer(w,1);PostQuitMessage(0);return 0;
 }}catch(const std::exception&e){p->failed=true;KillTimer(w,1);MessageBoxW(w,wide(e.what()).c_str(),L"DeskTile Preview",MB_ICONERROR|MB_OK);}
 return DefWindowProcW(w,msg,a,b);
}
int wmain(int argc,wchar_t**argv){try{
 if(argc<3){std::cerr<<"Expected project directory and font pack [locale] [light|dark] [scenario.json]\n";return 2;}
 auto preview=std::make_unique<Preview>();active=preview.get();preview->scripted=argc>5;if(!preview->scripted||_wgetenv(L"DESKTILE_PREVIEW_CONFIG_DIR")||(argc>3&&!wcscmp(argv[3],L"auto")))preview->loadPreferences();
 const auto locale=argc>3&&wcscmp(argv[3],L"auto")?utf8(argv[3]):preview->services.locale;
 const bool light=argc>4&&wcscmp(argv[4],L"auto")?wcscmp(argv[4],L"dark")!=0:!preview->dark;
 preview->start(argv[1],argv[2],locale,light);
 if(argc>6&&!wcscmp(argv[5],L"--frame-probe")){preview->frameProbe=std::make_unique<Preview::FrameProbe>();preview->frameProbe->path=utf8(argv[6]);if(argc>7)preview->frameLimit=_wtoi(argv[7]);} if(argc>5&&!preview->frameProbe){auto scenario=parse(loadFile(argv[5]));if(!cJSON_IsArray(scenario.get()))throw std::runtime_error("Scenario must be an array");cJSON*s=nullptr;cJSON_ArrayForEach(s,scenario.get()){std::string action=str(s,"action");int x=num(s,"x"),y=num(s,"y");if(preview->desktopScenario(s)){}else if(action=="tap"){preview->pointer(0,x,y);std::this_thread::sleep_for(std::chrono::milliseconds(40));preview->releasePointer(x,y,[&]{preview->host.cancelPointer();});}else if(action=="down")preview->pointer(0,x,y);else if(action=="move")preview->pointer(1,x,y);else if(action=="up")preview->pointer(2,x,y);else if(action=="wheel")preview->wheel(x,y,num(s,"delta"));else if(action=="text"){if(!preview->services.keyboard)throw std::runtime_error("No pending keyboard input");preview->keyboardReply(str(s,"text"),true);}else if(action=="back")preview->check(preview->app->requestExit(),"Back");else if(action=="theme"){preview->setTheme(!strcmp(str(s,"value"),"dark"));}else if(action=="bounds"){preview->bounds=num(s,"value")!=0;preview->changed=true;}else if(action=="chrome"){preview->render();preview->saveChrome(fs::u8path(str(s,"path")));}else if(action=="tool")preview->toolbarCommand(num(s,"id"));else if(action=="save")preview->save(fs::u8path(str(s,"path")));else if(action=="menu"){preview->host.activateAppMenu(num(s,"index"),preview->owner);preview->route();}else if(action!="wait")throw std::runtime_error("Unknown scenario action");const auto until=GetTickCount64()+num(s,"ms",32);do{preview->tick();std::this_thread::sleep_for(std::chrono::milliseconds(16));}while(GetTickCount64()<until);}std::cout<<"Interactive scenario completed\n";return 0;}
 SetProcessDPIAware();HDC desktop=GetDC(nullptr);preview->dpi=GetDeviceCaps(desktop,LOGPIXELSX)/96.0;ReleaseDC(nullptr,desktop);
 WNDCLASSW c{};c.lpfnWndProc=windowProc;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=L"DeskTileLocalPreview";c.hIcon=LoadIconW(c.hInstance,MAKEINTRESOURCEW(1));c.hCursor=LoadCursor(nullptr,IDC_ARROW);RegisterClassW(&c);
 DWORD style=WS_OVERLAPPEDWINDOW|WS_CLIPCHILDREN;preview->window=CreateWindowW(c.lpszClassName,wide("DeskTile Preview - "+preview->name).c_str(),style,CW_USEDEFAULT,CW_USEDEFAULT,1000,720,nullptr,nullptr,c.hInstance,nullptr);if(!preview->window)throw std::runtime_error("Cannot create preview window");preview->resizePreview();preview->toolbar();if(preview->frameProbe)preview->frameProbe->start=std::chrono::steady_clock::now();ShowWindow(preview->window,preview->frameProbe?SW_SHOWNOACTIVATE:SW_SHOW);SetTimer(preview->window,1,50,nullptr);
 std::cout<<"Local application running. Use Settings for fonts, zoom and simulated status; Esc to go back.\n"<<std::flush;FrameWake wake;MSG msg;bool running=true;while(running){unsigned messages=0;while(messages++<128&&PeekMessageW(&msg,nullptr,0,0,PM_REMOVE)){if(msg.message==WM_QUIT){running=false;break;}if(preview->keyboardWindow&&IsDialogMessageW(preview->keyboardWindow,&msg))continue;if(preview->settingsWindow&&IsDialogMessageW(preview->settingsWindow,&msg))continue;TranslateMessage(&msg);DispatchMessageW(&msg);}if(!running)break;if(preview->failed){DestroyWindow(preview->window);break;}if(std::chrono::steady_clock::now()>=preview->nextFrame)preview->tick();UpdateWindow(preview->window);wake.wait(preview->nextFrame);}if(preview->frameProbe){Json data(cJSON_CreateArray(),cJSON_Delete);for(auto value:preview->frameProbe->frames)cJSON_AddItemToArray(data.get(),cJSON_CreateNumber(value));char*text=cJSON_PrintUnformatted(data.get());std::ofstream(fs::u8path(preview->frameProbe->path))<<text;cJSON_free(text);}return preview->failed?1:0;
 }catch(const std::exception&e){std::cerr<<e.what()<<"\n";return 1;}}

