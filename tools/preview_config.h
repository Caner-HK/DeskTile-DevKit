#pragma once

// Host preferences are separate from the application's sandbox storage.
namespace preview_config {
struct Values {
 bool dark=false,fit=false,bounds=false,performance=false,charging=false;
 double zoom=1;
 int font=0,wifi=2,battery=78,fps=60;
 std::string locale="zh-HK";
};
inline fs::path directory(){
 const wchar_t *overridePath=_wgetenv(L"DESKTILE_PREVIEW_CONFIG_DIR");
 if(overridePath&&*overridePath)return fs::path(overridePath);
 const wchar_t *local=_wgetenv(L"LOCALAPPDATA");
 if(!local||!*local)throw std::runtime_error("Local application data directory is unavailable");
 return fs::path(local)/L"DeskTile"/L"Preview";
}
inline bool boolean(cJSON*j,const char*key,bool fallback){auto*v=cJSON_GetObjectItemCaseSensitive(j,key);return cJSON_IsBool(v)?cJSON_IsTrue(v):fallback;}
inline int integer(cJSON*j,const char*key,int fallback,int low,int high){auto*v=cJSON_GetObjectItemCaseSensitive(j,key);return cJSON_IsNumber(v)&&v->valuedouble==v->valueint&&v->valueint>=low&&v->valueint<=high?v->valueint:fallback;}
inline Values read(const fs::path&dir){
 Values v;
 try{
  auto file=dir/L"settings.json";if(!fs::is_regular_file(file)||fs::file_size(file)>8192)return v;
  auto bytes=loadFile(file);Json json(cJSON_ParseWithLength(reinterpret_cast<const char*>(bytes.data()),bytes.size()),cJSON_Delete);auto*j=json.get();
  if(!cJSON_IsObject(j)||integer(j,"version",0,1,1)!=1)return v;
  v.dark=boolean(j,"dark",v.dark);v.fit=boolean(j,"fit",v.fit);v.bounds=boolean(j,"bounds",v.bounds);v.performance=boolean(j,"performance",v.performance);v.charging=boolean(j,"charging",v.charging);
  v.battery=integer(j,"battery",v.battery,0,100);v.wifi=integer(j,"wifi",v.wifi,0,5);v.font=integer(j,"font",v.font,0,4);if(v.font==1)v.font=0;
  int rate=integer(j,"fps",60,15,60);v.fps=rate==15||rate==30?rate:60;
  auto*z=cJSON_GetObjectItemCaseSensitive(j,"zoom");if(cJSON_IsNumber(z))for(double scale:{0.75,1.0,1.25,1.5,2.0})if(z->valuedouble==scale)v.zoom=scale;
  std::string language=str(j,"locale");if(language=="zh-CN"||language=="zh-HK"||language=="en-US")v.locale=language;
 }catch(...){/* Invalid or unavailable preferences use defaults. */}
 return v;
}
inline void write(const fs::path&dir,const Values&v){
 Json j(cJSON_CreateObject(),cJSON_Delete);if(!j)throw std::bad_alloc();
 cJSON_AddNumberToObject(j.get(),"version",1);cJSON_AddBoolToObject(j.get(),"dark",v.dark);cJSON_AddBoolToObject(j.get(),"fit",v.fit);cJSON_AddBoolToObject(j.get(),"bounds",v.bounds);cJSON_AddBoolToObject(j.get(),"performance",v.performance);cJSON_AddBoolToObject(j.get(),"charging",v.charging);
 cJSON_AddNumberToObject(j.get(),"zoom",v.zoom);cJSON_AddNumberToObject(j.get(),"font",v.font);cJSON_AddNumberToObject(j.get(),"wifi",v.wifi);cJSON_AddNumberToObject(j.get(),"battery",v.battery);cJSON_AddNumberToObject(j.get(),"fps",v.fps);cJSON_AddStringToObject(j.get(),"locale",v.locale.c_str());
 std::unique_ptr<char,decltype(&cJSON_free)> text(cJSON_Print(j.get()),cJSON_free);if(!text)throw std::bad_alloc();
 fs::create_directories(dir);const auto target=dir/L"settings.json";
 const auto temp=dir/(L"settings."+std::to_wstring(GetCurrentProcessId())+L".tmp");
 try{
  {std::ofstream out(temp,std::ios::binary|std::ios::trunc);out<<text.get();out.flush();if(!out)throw std::runtime_error("Cannot save preview preferences");}
  if(!MoveFileExW(temp.c_str(),target.c_str(),MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH))throw std::runtime_error("Cannot replace preview preferences");
 }catch(...){std::error_code error;fs::remove(temp,error);throw;}
}
}
