#pragma once
#include "sdk.h"
namespace desktile::sdk {
inline uint32_t fileModifiedSeconds(const dt_user_file_v1 &file){if(!(file.reserved[4]&1))return 0;uint32_t value=0;for(int i=0;i<4;++i)value|=uint32_t(file.reserved[i])<<(i*8);return value;}
inline void setFileModifiedSeconds(dt_user_file_v1 &file,int64_t seconds){
 for(int i=0;i<5;++i)file.reserved[i]=0;
 if(seconds<=0||uint64_t(seconds)>UINT32_MAX)return;
 for(int i=0;i<4;++i)file.reserved[i]=uint8_t(uint64_t(seconds)>>(i*8));
 file.reserved[4]=1;
}
}
