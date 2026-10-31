#pragma once
#include <cstdint>
#include <cmath>

namespace desktile::sdk {
// Opaque RGB888 semantic colors. Alpha is reserved for motion and overlays.
struct ColorScheme {
    uint32_t background, surface, header, raised, alternate, sidebar;
    uint32_t primaryText, bodyText, supportingText, disabledText, border;
    uint32_t success, warning, danger, dangerFill, onDanger;
    uint32_t keyboard, key, input, inputText, pressed, onPressed;
    uint32_t selectionBorder, switchTrack, switchInk, iconInk;
};
inline constexpr ColorScheme lightColorScheme{
    0xffffff,0xffffff,0xf2f2f2,0xe6e6e6,0xf5f5f5,0xeeeeee,
    0x181818,0x303030,0x606060,0x787878,0xc6c6c6,
    0x21834b,0xac4200,0xc42b1c,0xc42b1c,0xffffff,
    0xe1e1e1,0xfafafa,0xffffff,0x181818,0xc3c3c3,0x141414,
    0x505050,0xffffff,0x2a2a2a,0x2a2a2a
};
inline constexpr ColorScheme darkColorScheme{
    0x000000,0x000000,0x121212,0x303030,0x2d2d2d,0x202020,
    0xffffff,0xe0e0e0,0xacacac,0x808080,0x525252,
    0x5ec98b,0xca5010,0xff7366,0xc42b1c,0xffffff,
    0x141414,0x373737,0xffffff,0x181818,0x525252,0xffffff,
    0xacacac,0x000000,0xffffff,0xffffff
};
inline constexpr const ColorScheme &colorScheme(bool light){return light?lightColorScheme:darkColorScheme;}
inline float relativeLuminance(uint32_t color){
    const auto channel=[](unsigned c){const float v=c/255.0f;return v<=0.04045f?v/12.92f:std::pow((v+0.055f)/1.055f,2.4f);};
    return channel(color>>16&255)*0.2126f+channel(color>>8&255)*0.7152f+channel(color&255)*0.0722f;
}
inline constexpr uint32_t rgb565DisplayColor(uint32_t color){
    return (((color>>19)&31)*255/31<<16)|(((color>>10)&63)*255/63<<8)|((color>>3)&31)*255/31;
}
inline uint32_t contrastForeground(uint32_t background){
    const float luminance=relativeLuminance(rgb565DisplayColor(background));
    const float blackContrast=(luminance+0.05f)/0.05f;
    const float whiteContrast=1.05f/(luminance+0.05f);
    return blackContrast>=whiteContrast?0x000000:0xffffff;
}
}
