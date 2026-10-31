#pragma once
#include "../sdk.h"
#include "../text_limits.hpp"
#include <cstdint>
#include <memory>
namespace desktile::sdk::internal {
enum class UserFileCommand:uint8_t {Read,CreateFile,CreateDirectory,Replace,Delete,Rename,DeleteDirectory};
struct UserFileResult {
 dt_result result=DT_ERR_STORAGE;
 uint32_t bytes=0;
 int64_t modifiedSeconds=0;
 uint8_t digest[32]{};
 char text[text_limits::fileReadBytes+1]{};
};
struct PackageIconResult {
 dt_result result=DT_ERR_STORAGE;
 char resource[128]{};
 std::unique_ptr<uint8_t[]> data;
 size_t bytes=0;
};
struct ImagePixelsDeleter {void (*release)(void*)=nullptr;void operator()(uint16_t *p)const{if(release)release(p);}};
struct UserImageResult {
 dt_result result=DT_ERR_STORAGE;
 uint32_t originalWidth=0,originalHeight=0,width=0,height=0;
 std::unique_ptr<uint16_t,ImagePixelsDeleter> pixels{nullptr,ImagePixelsDeleter{}};
 size_t bytes()const{return size_t(width)*height*sizeof(uint16_t);}
};
}
