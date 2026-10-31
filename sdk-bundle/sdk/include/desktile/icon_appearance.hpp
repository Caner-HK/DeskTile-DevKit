#pragma once
#include "sdk.hpp"
#include <cstring>
namespace desktile::sdk {
// The host validates this ID against the calling package's manifest.
// Empty selection restores the default. Existing ABI tables remain unchanged.
inline dt_result iconAppearance(const Host &host,char (&id)[17]) {
    std::memset(id,0,sizeof(id));dt_mutable_bytes bytes{reinterpret_cast<uint8_t*>(id),16,0};
    const auto result=host.storageRead(DT_SYSTEM_ICON_APPEARANCE_COMMAND,bytes);
    if(result!=DT_OK||bytes.size>16){id[0]=0;return result==DT_OK?DT_ERR_INVALID_ARGUMENT:result;}
    id[bytes.size]=0;return DT_OK;
}
inline dt_result setIconAppearance(const Host &host,const char *id) {
    if(!id)return DT_ERR_INVALID_ARGUMENT;
    size_t length=0;while(length<=16&&id[length])++length;
    if(length>16)return DT_ERR_INVALID_ARGUMENT;
    return host.storageWrite(DT_SYSTEM_ICON_APPEARANCE_COMMAND,{reinterpret_cast<const uint8_t*>(id),length});
}
}
