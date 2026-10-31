#pragma once
#include "src/system/NotificationQueue.h"
#include "src/graphics/NotificationMotion.h"
#include "src/graphics/NotificationBanner.h"
#include "sdk/include/desktile/json.hpp"

namespace preview_notifications {
class Service {
public:
 desktile::NotificationQueue queue;
 dt_result post(desktile::runtime::NativeSdkHost &host,dt_app_context owner,const desktile::runtime::AppContext &caller,dt_bytes value,dt_request_id request){
  using Queue=desktile::NotificationQueue;
  if(!value.data||!value.size||value.size>2048||!desktile::sdk::JsonView::parse(value.data,value.size).object())return DT_ERR_INVALID_ARGUMENT;
  std::unique_ptr<cJSON,decltype(&cJSON_Delete)> root(cJSON_ParseWithLength(reinterpret_cast<const char*>(value.data),value.size),cJSON_Delete);
  if(!root||!cJSON_IsObject(root.get()))return DT_ERR_INVALID_ARGUMENT;
  Queue::Item item{};char action[12]{};
  auto copy=[&](const char*key,char*to,size_t capacity,bool required){auto*f=cJSON_GetObjectItemCaseSensitive(root.get(),key);if(!f)return !required;if(!cJSON_IsString(f)||!f->valuestring)return false;const auto size=strlen(f->valuestring);if(size>=capacity||(required&&!size))return false;memcpy(to,f->valuestring,size+1);return true;};
  bool valid=copy("action",action,sizeof(action),false)&&copy("id",item.id,sizeof(item.id),true);
  const auto operation=!strcmp(action,"update")?Queue::Operation::Update:!strcmp(action,"cancel")?Queue::Operation::Cancel:Queue::Operation::Post;
  if(*action&&strcmp(action,"post")&&strcmp(action,"update")&&strcmp(action,"cancel"))valid=false;
  for(auto*f=root->child;f;f=f->next){
   if(!f->string||(strcmp(f->string,"action")&&strcmp(f->string,"id")&&strcmp(f->string,"title")&&strcmp(f->string,"body")&&strcmp(f->string,"data")&&strcmp(f->string,"eventTime")))valid=false;
   for(auto*p=root->child;p!=f;p=p->next)if(p->string&&f->string&&!strcmp(p->string,f->string))valid=false;
  }
  if(operation!=Queue::Operation::Cancel)valid=valid&&copy("title",item.title,sizeof(item.title),true)&&copy("body",item.body,sizeof(item.body),false)&&copy("data",item.data,sizeof(item.data),false);
  item.postedAt=time(nullptr);item.eventTime=item.postedAt;
  if(auto*f=cJSON_GetObjectItemCaseSensitive(root.get(),"eventTime")){if(!cJSON_IsNumber(f)||!(f->valuedouble>=1&&f->valuedouble<=253402300799.0))valid=false;else{item.eventTime=int64_t(f->valuedouble);if(double(item.eventTime)!=f->valuedouble)valid=false;}}
  for(const auto*text:{item.id,item.title,item.body,item.data})for(auto*p=reinterpret_cast<const unsigned char*>(text);*p;++p)if(*p<32||*p==127)valid=false;
  if(!valid)return DT_ERR_INVALID_ARGUMENT;
  strncpy_s(item.owner,caller.packageId(),_TRUNCATE);
  const auto result=queue.check(operation,item.owner,item.id);if(result!=DT_OK)return result;
  const auto completed=host.completeRequest(owner,request,DT_OK);if(completed!=DT_OK)return completed;
  return queue.apply(operation,item,uint32_t(host.api()->monotonic_ms(owner)));
 }
};

// The queue, geometry and motion come from the device. Only the scanout adapter is desktop-specific.
class Overlay {
 using Queue=desktile::NotificationQueue;
 desktile::NotificationMotion motion;
 Queue::Item visible{};
 std::vector<uint16_t> raster,saved;
 uint32_t rasterToken=0;int64_t rasterSecond=-1;uint16_t rasterInk=0,rasterAccent=0;
 int presentedY=-88;uint32_t presentedToken=0;int64_t presentedSecond=-1;
 bool shown=false,pressed=false,dragged=false;int pressX=0,pressY=0;
public:
 bool step(Queue&q,bool blocked,uint32_t now){
  q.hold(blocked||pressed||motion.moving(now),now);q.tick(now);
  auto*next=q.front();const bool wanted=next&&!blocked;
  if(visible.token&&(!wanted||visible.deliveryToken!=next->deliveryToken)){motion.show(false,now);shown=false;}
  if(visible.token&&!shown&&!motion.moving(now)&&motion.position(now)==-88){visible={};rasterToken=0;}
  if(!visible.token&&wanted){visible=*next;shown=true;motion.show(true,now);}
  else if(visible.token&&wanted&&shown&&visible.deliveryToken==next->deliveryToken)visible=*next;
  if(!visible.token&&!wanted){std::vector<uint16_t>().swap(raster);std::vector<uint16_t>().swap(saved);}
  const int y=visible.token?motion.position(now):-88;
  const auto second=int64_t(time(nullptr));
  const bool dirty=y!=presentedY||visible.token!=presentedToken||(visible.token&&second!=presentedSecond);
  return dirty;
 }
 template<class Draw>void compose(uint16_t*screen,uint32_t now,Draw draw){
  presentedY=visible.token?motion.position(now):-88;presentedToken=visible.token;presentedSecond=int64_t(time(nullptr));
  if(!visible.token||motion.position(now)<=-88)return;
  const auto second=int64_t(time(nullptr));const auto ink=desktile::ui::theme().onAccent;
  const auto accent=desktile::ui::theme().accent;
  if(rasterToken!=visible.token||rasterSecond!=second||rasterInk!=ink||rasterAccent!=accent){
   saved.assign(screen,screen+800*88);draw(visible);raster.assign(screen,screen+800*88);std::copy(saved.begin(),saved.end(),screen);
   rasterToken=visible.token;rasterSecond=second;rasterInk=ink;rasterAccent=accent;
  }
  const int y=motion.position(now),source=std::max(0,-y),height=88-source;
  if(height>0)memcpy(screen,raster.data()+source*800,size_t(height)*800*sizeof(uint16_t));
 }
 template<class Activate>bool pointer(Queue&q,int kind,int x,int y,uint32_t now,bool blocked,Activate activate){
  if(kind==0){if(blocked||!visible.token||y<0||y>=88+motion.position(now)||x<0||x>=800)return false;pressed=true;dragged=false;pressX=x;pressY=y;q.hold(true,now);return true;}
  if(!pressed)return false;
  if(abs(x-pressX)>16||abs(y-pressY)>16)dragged=true;
  if(kind==2){pressed=false;const auto*head=q.front();if(!blocked&&head&&head->token==visible.token){const auto item=visible;q.dismiss(item.token,now);if(!dragged)activate(item);}q.hold(false,now);}
  return true;
 }
};
}
