#pragma once
#include <cstddef>
#include <cstring>

namespace desktile::sdk::tile_icon {
// Shell-painted tiles use square, offline-rasterized icons at these sizes.
inline const char *key(int side){return side==40?"1x1":side==64?"2x2":side==80?"4x2":side==128?"4x4":nullptr;}
inline int side(int columns,int rows){return columns==1?40:columns==2?64:rows==4?128:80;}
inline int fittingSide(int desired,int width,int height,bool iconOnly){
    const int room=width-32<height-(iconOnly?32:64)?width-32:height-(iconOnly?32:64);
    const int sizes[]{128,80,64,40};for(int candidate:sizes)if(candidate<=desired&&candidate<=room)return candidate;
    return 40;
}
// tile.dti -> tile-1x1.dti etc. Fixed convention keeps four extra paths out
// of each resident manifest. The destination is caller-owned and short-lived.
inline bool variantPath(const char *base,int side,char *destination,size_t capacity){
    const char *size=key(side);const size_t length=base?std::strlen(base):0;
    if(!size||length<5||std::strcmp(base+length-4,".dti")||length+5>capacity)return false;
    std::memcpy(destination,base,length-4);destination[length-4]='-';
    std::memcpy(destination+length-3,size,3);std::memcpy(destination+length,".dti",5);return true;
}
}
