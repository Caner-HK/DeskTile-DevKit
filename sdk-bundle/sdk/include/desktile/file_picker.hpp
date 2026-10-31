#pragma once
#include "sdk.h"
#include <cstddef>
#include <cstdint>
#include <cstring>
namespace desktile::sdk {
inline constexpr size_t filePickerExtensionLimit=8;
struct FilePickerOptions {
    bool save=false;
    char directory[1001]{},name[256]{},extensions[filePickerExtensionLimit][13]{};
    unsigned extensionCount=0;
    uint32_t maximumBytes=32U*1024U*1024U;
};
inline bool filePickerAllows(const FilePickerOptions &options,const char *name){
    if(!name||!*name)return false;
    if(options.extensionCount>filePickerExtensionLimit)return false;
    if(!options.extensionCount)return true;
    const auto *dot=std::strrchr(name,'.');if(!dot||!dot[1])return false;
    for(unsigned i=0;i<options.extensionCount;++i){
        const char *left=dot+1,*right=options.extensions[i];
        while(*left&&*right){const auto a=*left>='A'&&*left<='Z'?*left+32:*left;const auto b=*right>='A'&&*right<='Z'?*right+32:*right;if(a!=b)break;++left;++right;}
        if(!*left&&!*right)return true;
    }
    return false;
}
}
