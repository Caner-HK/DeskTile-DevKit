#pragma once
#include "color_palette.hpp"
#include "color_scheme.hpp"
namespace desktile::sdk::color_palette {
template<class Fill,class Stroke,class Check>
void paint(Rect r,uint32_t value,uint32_t outline,bool selected,bool pressed,Fill fill,Stroke stroke,Check check){
    const auto ink=contrastForeground(value);
    fill(r,value);
    if(pressed)stroke({r.x+3,r.y+3,r.w-6,r.h-6},ink,2);
    if(selected){stroke(r,outline,2);check({r.x+(r.w-checkSize)/2,r.y+(r.h-checkSize)/2,checkSize,checkSize},ink);}
}
}
