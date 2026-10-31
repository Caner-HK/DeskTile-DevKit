#pragma once
#include "sdk.hpp"
#include "json.hpp"

namespace desktile::sdk {
// Bounded local banners. The host resolves the application identity and icon.
class Notifications {
public:
    explicit Notifications(const Host &host):host_(host){}
    dt_result post(const char *id,const char *title,const char *body,const char *data,dt_request_id &request,int64_t eventTime=0)const{
        return send("post",id,title,body,data,request,eventTime);
    }
    dt_result update(const char *id,const char *title,const char *body,const char *data,dt_request_id &request,int64_t eventTime=0)const{
        return send("update",id,title,body,data,request,eventTime);
    }
    dt_result cancel(const char *id,dt_request_id &request)const{
        return send("cancel",id,nullptr,nullptr,nullptr,request);
    }
private:
    dt_result send(const char *action,const char *id,const char *title,const char *body,const char *data,dt_request_id &request,int64_t eventTime=0)const{
        request=0;if(!id||!*id||strlen(id)>64||
            (strcmp(action,"cancel")&&(!title||!*title||strlen(title)>128))||
            (body&&strlen(body)>320)||(data&&strlen(data)>256)||eventTime<0||eventTime>253402300799LL)return DT_ERR_INVALID_ARGUMENT;
        char buffer[2049];JsonWriter json(buffer,sizeof(buffer));
        json.raw("{\"action\":");json.string(action);json.raw(",\"id\":");json.string(id);
        if(title){json.raw(",\"title\":");json.string(title);}
        if(body){json.raw(",\"body\":");json.string(body);}
        if(data){json.raw(",\"data\":");json.string(data);}
        if(eventTime){json.raw(",\"eventTime\":");json.number(static_cast<uint64_t>(eventTime));}
        json.raw("}");
        const auto bytes=strlen(buffer);if(!json.ok()||!bytes)return DT_ERR_INVALID_ARGUMENT;
        return host_.postNotification({reinterpret_cast<const uint8_t *>(buffer),bytes},request);
    }
    Host host_;
};
}
