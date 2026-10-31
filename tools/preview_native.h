// Desktop module loading; lifecycle and dispatch use the firmware runner.
#include "src/runtime/NativeAppRunner.h"
class DesktopNativeRunner final:public desktile::runtime::DynamicAppRunner{
 desktile::runtime::NativeAppRunner runner_;std::filesystem::path path_;HMODULE image_=nullptr;
public:
 DesktopNativeRunner(desktile::runtime::NativeSdkHost&host,dt_app_context owner,std::filesystem::path path):runner_(host,owner),path_(std::move(path)){}
 ~DesktopNativeRunner()override{leave();}
 dt_result enter(const desktile::package::AppManifest&)override{
  image_=LoadLibraryExW(path_.c_str(),nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);if(!image_)return DT_ERR_NOT_FOUND;
  auto entry=reinterpret_cast<dt_app_entry_v1>(GetProcAddress(image_,"dt_app_entry"));if(!entry){leave();return DT_ERR_INVALID_ARGUMENT;}auto result=runner_.enter(entry);if(result!=DT_OK)leave();return result;
 }
 dt_result event(dt_ui_event kind,dt_bytes payload={})override{return runner_.event(kind,payload);}
 dt_result lifecycle(dt_lifecycle_event kind)override{switch(kind){case DT_LIFECYCLE_SUSPEND:return runner_.suspend();case DT_LIFECYCLE_RESUME:return runner_.resume();case DT_LIFECYCLE_THEME_CHANGED:return runner_.themeChanged();case DT_LIFECYCLE_MEMORY_PRESSURE:return runner_.memoryPressure();default:return DT_OK;}}
 dt_result update(uint64_t now)override{dt_tick_event tick{now};auto result=event(DT_EVENT_TICK,{reinterpret_cast<const uint8_t*>(&tick),sizeof(tick)});return result==DT_ERR_NOT_SUPPORTED?DT_OK:result;}
 dt_result requestExit()override{return event(DT_EVENT_EXIT_REQUEST);}
 void leave()override{if(active())runner_.leave();if(image_){FreeLibrary(image_);image_=nullptr;}}
 bool active()const override{return runner_.state()!=desktile::runtime::NativeAppRunner::State::Closed;}
};
