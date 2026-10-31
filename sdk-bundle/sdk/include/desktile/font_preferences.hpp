#pragma once
#include <cstdint>

namespace desktile::sdk {
enum class WesternFont : uint8_t { MiSans=0, GdsTransport=1, Cabin=2, NotoSans=3, SourceSerif=4 };
inline constexpr int westernFontCount=5;
inline constexpr WesternFont westernFontChoices[]{WesternFont::GdsTransport,WesternFont::Cabin,WesternFont::MiSans,WesternFont::NotoSans,WesternFont::SourceSerif};
inline constexpr bool validWesternFont(WesternFont family){return static_cast<unsigned>(family)<westernFontCount;}
inline constexpr const char *westernFontName(WesternFont family){
    switch(family){case WesternFont::GdsTransport:return "Transport Sans";case WesternFont::Cabin:return "Cabin";case WesternFont::NotoSans:return "Noto Sans";case WesternFont::SourceSerif:return "Source Serif";default:return "MiSans";}
}
inline constexpr bool personalizableCharacter(uint32_t cp){
    return cp>=32 && !(cp>=0x2e80&&cp<=0x9fff) && !(cp>=0xf900&&cp<=0xfaff) && !(cp>=0x20000&&cp<=0x323ff);
}
}
