#pragma once
#include "geometry.hpp"
#include <algorithm>
namespace desktile::sdk {
enum class StepperSymbols { PlusMinus, Arrows };
struct StepperStyle {
    int buttonHeight=52,valueHeight=52,verticalGap=8;
    int numberSize=32,unitSize=20,unitGap=8;
    StepperSymbols symbols=StepperSymbols::PlusMinus;
    constexpr int height()const{return buttonHeight*2+valueHeight+verticalGap*2;}
    constexpr bool valid()const{return buttonHeight>=24&&buttonHeight<=128&&valueHeight>=numberSize&&valueHeight>=unitSize&&valueHeight<=256&&verticalGap>=0&&verticalGap<=64&&numberSize>=8&&numberSize<=96&&unitSize>=8&&unitSize<=96&&unitGap>=0&&unitGap<=64;}
};
struct StepperLayout {
    Rect increment,value,decrement;
    static constexpr StepperLayout resolve(Rect field,StepperStyle style={}){
        return {{field.x,field.y,field.w,style.buttonHeight},
            {field.x,field.y+style.buttonHeight+style.verticalGap,field.w,style.valueHeight},
            {field.x,field.y+style.buttonHeight+style.verticalGap*2+style.valueHeight,field.w,style.buttonHeight}};
    }
};
struct StepperGroupStyle {
    int titleHeight=48,titleGap=20,columnGap=16,dividerInset=0;
    bool centeredTitle=false,showDivider=true;
    StepperStyle stepper{};
    int titleInset=8,titleOffset=8;
};
struct StepperGroupLayout {
    Rect title,fields;
    static constexpr StepperGroupLayout resolve(Rect group,StepperGroupStyle style={}){
        const int inset=std::clamp(style.titleInset,0,std::max(0,group.w/2));
        const int offset=std::clamp(style.titleOffset,0,std::max(0,style.titleGap));
        return {{group.x+inset,group.y+offset,std::max(0,group.w-2*inset),style.titleHeight},
            {group.x,group.y+style.titleHeight+style.titleGap,group.w,style.stepper.height()}};
    }
    constexpr Rect column(int count,int index,StepperGroupStyle style={})const{
        const int usable=fields.w-style.columnGap*(count-1);
        const int start=usable*index/count,end=usable*(index+1)/count;
        return {fields.x+start+style.columnGap*index,fields.y,std::max(0,end-start),fields.h};
    }
    static constexpr Rect divider(Rect left,Rect right,StepperGroupStyle style={}){
        const int top=std::max(left.y,right.y)+style.dividerInset;
        const int bottom=std::min(left.y+left.h,right.y+right.h)-style.dividerInset;
        return {(left.x+left.w+right.x-1)/2,top,style.showDivider?1:0,std::max(0,bottom-top)};
    }
};
}
