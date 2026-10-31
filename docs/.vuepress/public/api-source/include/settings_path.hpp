#pragma once
#include <cstddef>
#include <cstring>

#define DT_SETTINGS_PATH_SEPARATOR " → "
namespace desktile::sdk {
inline constexpr const char *settingsPathSeparator=DT_SETTINGS_PATH_SEPARATOR;
inline bool settingsPath(char *output,size_t capacity,const char *const *levels,size_t count){
    if(!output||!capacity)return false;
    output[0]=0;if(!levels||!count||count>8)return false;
    size_t used=0;const size_t separatorBytes=std::strlen(settingsPathSeparator);
    for(size_t index=0;index<count;++index){
        if(!levels[index]||!*levels[index]){output[0]=0;return false;}
        for(const auto *at=levels[index];*at;++at)if(static_cast<unsigned char>(*at)<32){output[0]=0;return false;}
        const size_t bytes=std::strlen(levels[index]),prefix=index?separatorBytes:0;
        if(prefix>=capacity-used||bytes>=capacity-used-prefix){output[0]=0;return false;}
        if(prefix){std::memcpy(output+used,settingsPathSeparator,prefix);used+=prefix;}
        std::memcpy(output+used,levels[index],bytes);used+=bytes;
    }
    output[used]=0;return true;
}
}
