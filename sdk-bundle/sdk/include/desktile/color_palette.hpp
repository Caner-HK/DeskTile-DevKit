#pragma once
#include <cstdint>
#include "geometry.hpp"
#include "sdk.h"
namespace desktile::sdk::color_palette {
inline constexpr uint32_t presets[]{0xd43b45,0xe45d2a,0xff9900,0xf2b134,
    0x788c3e,0x388749,0x689d65,0x168471,0x138b9b,0x1678ba,0x4f91c7,0x3765ff,
    0x6758b5,0x8b52a6,0xa56cc1,0xb53e6e,0xdb6b88,0x92705d,0x526a86,0x69797e};
inline constexpr unsigned count=sizeof(presets)/sizeof(presets[0]);
inline constexpr int columns=8,side=80,gap=16,inset=24,checkSize=36;
inline constexpr unsigned capacity=count+DT_MAX_CUSTOM_COLORS;
inline constexpr int height(unsigned size){return size?int((size+columns-1)/columns)*(side+gap)-gap:0;}
struct Selection {
    uint32_t values[capacity]{};unsigned size=count;
    template<class Host> void load(const Host &host){
        dt_color_palette_v1 custom{};size=count;
        for(unsigned i=0;i<count;++i)values[i]=presets[i];
        if(host.colorPalette(custom)!=DT_OK)return;
        for(unsigned i=0;i<custom.count;++i)values[size++]=custom.colors[i];
    }
};
inline constexpr Rect bounds(unsigned i,int top){return {inset+int(i%columns)*(side+gap),top+int(i/columns)*(side+gap),side,side};}
}
