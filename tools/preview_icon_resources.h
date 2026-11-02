#pragma once
#include "src/runtime/PrivateStorageProvider.h"
#include "sdk/include/desktile/tile_icon.hpp"
#include <memory>
#include <atomic>
#include <mutex>
class PreviewIconResources final:public Resources{
 std::recursive_mutex mutex_;
 std::string application_,tile_,splash_,package_,default_,chosen_;std::vector<std::string> choices_;
 bool loaded_=false,chosenLoaded_=false,fromResources_=false,variants_=false,full_=false;
 static const char *text(cJSON *object,const char *key){auto *value=cJSON_GetObjectItemCaseSensitive(object,key);return cJSON_IsString(value)?value->valuestring:"";}
 static bool valid(const std::string &id){if(id.empty()||id.size()>16)return false;for(char c:id)if(!((c>='A'&&c<='Z')||(c>='a'&&c<='z')||(c>='0'&&c<='9')||c=='-'||c=='_'))return false;return true;}
 bool load(){
  if(loaded_)return !default_.empty();loaded_=true;
  try{auto data=loadFile(root/L"manifest.json");data.push_back(0);std::unique_ptr<cJSON,decltype(&cJSON_Delete)> json(cJSON_Parse(reinterpret_cast<char*>(data.data())),cJSON_Delete);if(!json)return false;
   package_=text(json.get(),"id");auto *icons=cJSON_GetObjectItemCaseSensitive(json.get(),"icons"),*appearance=cJSON_GetObjectItemCaseSensitive(icons,"appearances");application_=text(icons,"application");tile_=text(icons,"tile");splash_=text(icons,"splash");default_=text(appearance,"default");fromResources_=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(appearance,"from_resources"));variants_=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(icons,"tile_variants"));full_=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(cJSON_GetObjectItemCaseSensitive(json.get(),"tile"),"full_image"));
   auto *choices=cJSON_GetObjectItemCaseSensitive(appearance,"choices"),*value=static_cast<cJSON*>(nullptr);cJSON_ArrayForEach(value,choices)if(cJSON_IsString(value))choices_.emplace_back(value->valuestring);
  }catch(...){return false;}return valid(default_);
 }
 std::string variant(const std::string &base,const std::string &id)const{auto slash=base.rfind('/');return slash==std::string::npos?id+"/"+base:base.substr(0,slash+1)+id+base.substr(slash);}
 bool ready(const runtime::AppContext &caller,const std::string &id){
  if(!valid(id)||(!fromResources_&&std::find(choices_.begin(),choices_.end(),id)==choices_.end()))return false;
  for(const auto &base:{application_,tile_}){uint64_t size=0;const auto file=variant(base,id);if(Resources::size(caller,file.c_str(),size)!=DT_OK||size<12)return false;}
  if(variants_)for(int side:{40,64,80,128}){char base[128];if(!desktile::sdk::tile_icon::variantPath(tile_.c_str(),side,base,sizeof(base)))return false;uint64_t size=0;const auto file=variant(base,id);if(Resources::size(caller,file.c_str(),size)!=DT_OK||size<12)return false;}
  return true;
 }
 bool selected(const runtime::AppContext &caller){
  if(!load()||package_!=caller.packageId())return false;
  if(!chosenLoaded_){chosen_=default_;if(storage){char id[17]{};dt_mutable_bytes value{reinterpret_cast<uint8_t*>(id),16,0};if(storage->read(caller,"sdk-icon",value)==DT_OK&&value.size<=16){id[value.size]=0;if(ready(caller,id))chosen_=id;}}chosenLoaded_=true;}
  return true;
 }
 std::string resolved(const runtime::AppContext &caller,const char *path){
  if(!path)return {};std::string base=path;if(!selected(caller))return base;
  bool match=base==application_||base==tile_,splash=!splash_.empty()&&base==splash_;
  if(!match&&variants_)for(int side:{40,64,80,128}){char value[128];if(desktile::sdk::tile_icon::variantPath(tile_.c_str(),side,value,sizeof(value))&&base==value)match=true;if(full_)for(const char *locale:{"zh-HK","en"})if(desktile::sdk::tile_icon::localizedVariantPath(tile_.c_str(),side,locale,value,sizeof(value))&&base==value)match=true;}
  if(!match&&!splash)return base;const auto file=variant(base,chosen_);if(splash){uint64_t size=0;if(Resources::size(caller,file.c_str(),size)!=DT_OK||size<12)return base;}return file;
 }
public:
 std::atomic<uint32_t> revision{0};
 runtime::PrivateStorageProvider *storage=nullptr;
 dt_result iconAppearance(const runtime::AppContext &caller,dt_mutable_bytes &value)override{
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  value.size=0;if(!selected(caller))return DT_ERR_NOT_SUPPORTED;value.size=chosen_.size();if(value.capacity<value.size)return DT_ERR_BUFFER_TOO_SMALL;if(!value.data)return DT_ERR_INVALID_ARGUMENT;memcpy(value.data,chosen_.data(),value.size);return DT_OK;
 }
 dt_result setIconAppearance(const runtime::AppContext &caller,dt_bytes value)override{
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  if(value.size>16||(!value.data&&value.size))return DT_ERR_INVALID_ARGUMENT;if(!selected(caller))return DT_ERR_NOT_SUPPORTED;
  const std::string id=value.size?std::string(reinterpret_cast<const char*>(value.data),value.size):default_;if(!valid(id)||(!fromResources_&&std::find(choices_.begin(),choices_.end(),id)==choices_.end()))return DT_ERR_INVALID_ARGUMENT;if(!ready(caller,id))return DT_ERR_NOT_FOUND;
  if(storage){const auto result=storage->write(caller,"sdk-icon",{reinterpret_cast<const uint8_t*>(id.data()),id.size()});if(result!=DT_OK)return result;}chosen_=id;++revision;return DT_OK;
 }
 dt_result size(const runtime::AppContext &caller,const char *path,uint64_t &bytes)override{std::lock_guard<std::recursive_mutex> lock(mutex_);const auto file=resolved(caller,path);return Resources::size(caller,file.c_str(),bytes);}
 dt_result read(const runtime::AppContext &caller,const char *path,dt_mutable_bytes &value)override{std::lock_guard<std::recursive_mutex> lock(mutex_);const auto file=resolved(caller,path);return Resources::read(caller,file.c_str(),value);}
 dt_result readRange(const runtime::AppContext &caller,const char *path,uint64_t offset,dt_mutable_bytes &value)override{std::lock_guard<std::recursive_mutex> lock(mutex_);const auto file=resolved(caller,path);return Resources::readRange(caller,file.c_str(),offset,value);}
};
