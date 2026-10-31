#pragma once
#include "geometry.hpp"
#include <cstdint>
#include <algorithm>
namespace desktile::ui_metrics {
inline constexpr int documentBodySize=22,documentBodyLineHeight=30;
inline constexpr int documentHeadingSize=32,documentHeadingLineHeight=40,documentHeadingGap=12;
inline constexpr int buttonHeight=52,buttonMinimumWidth=128,buttonHorizontalPadding=24;
inline constexpr int buttonIconSize=28,buttonIconGap=8;
inline constexpr int textFieldIconSize=24,textFieldIconGap=12;
inline constexpr Rect textFieldIconBounds(Rect content){
    const int side=std::max(0,std::min(textFieldIconSize,std::min(content.w,content.h)));
    return {content.x,content.y+(content.h-side)/2,side,side};
}
inline constexpr Rect textFieldTextBounds(Rect content,bool hasIcon){
    const int inset=hasIcon?std::min(content.w,textFieldIconBounds(content).w+textFieldIconGap):0;
    return {content.x+inset,content.y,std::max(0,content.w-inset),content.h};
}
inline constexpr int fabSize=80,fabIconSize=40,fabEdgeInset=24;
struct FabLayout {
    Rect button,icon;
    static constexpr FabLayout resolve(Rect viewport){
        const int x=viewport.x+std::max(0,viewport.w-fabEdgeInset-fabSize);
        const int y=viewport.y+std::max(0,viewport.h-fabEdgeInset-fabSize);
        return {{x,y,fabSize,fabSize},{x+(fabSize-fabIconSize)/2,y+(fabSize-fabIconSize)/2,fabIconSize,fabIconSize}};
    }
};
inline constexpr int emptyIconSize=80,emptyTitleSize=32,emptyBodySize=20,emptyGap=16;
inline constexpr int listNoteInset=24,listNoteGap=16,listNoteFontSize=20,listNoteLineHeight=28;
inline constexpr Rect listNoteBounds(Rect viewport,int contentBottom,int height,int scroll=0){return {viewport.x+listNoteInset,contentBottom+listNoteGap-scroll,std::max(0,viewport.w-2*listNoteInset),height};}
struct EmptyStateLayout {
    Rect icon,title,body;
    static constexpr EmptyStateLayout resolve(Rect viewport){
        const int top=viewport.y+std::max(0,(viewport.h-180)/2);
        return {{viewport.x+(viewport.w-emptyIconSize)/2,top,emptyIconSize,emptyIconSize},
            {viewport.x+24,top+96,std::max(0,viewport.w-48),40},
            {viewport.x+24,top+152,std::max(0,viewport.w-48),28}};
    }
};
inline constexpr Rect buttonIconBounds(Rect r,int textWidth,bool trailing=false){return {r.x+(r.w-textWidth-buttonIconSize-buttonIconGap)/2+(trailing?textWidth+buttonIconGap:0),r.y+(r.h-buttonIconSize)/2,buttonIconSize,buttonIconSize};}
inline constexpr Rect buttonLabelBounds(Rect r,int textWidth,bool trailing=false){const auto i=buttonIconBounds(r,textWidth,trailing);return {trailing?i.x-textWidth-buttonIconGap:i.x+i.w+buttonIconGap,r.y,textWidth,r.h};}
inline constexpr int appBarHeight=72,navigationWidth=96,actionSize=appBarHeight;
inline constexpr Rect stepperCancel{456,412,152,52},stepperConfirm{624,412,152,52};
inline constexpr int spinnerButtonHeight=40,spinnerValueHeight=60,spinnerHeight=148;
inline constexpr int scheduleButtonWidth=112,scheduleButtonHeight=52,scheduleValueHeight=52,scheduleHeight=172;
inline constexpr uint32_t repeatDelayMs=400,repeatIntervalMs=100;
inline constexpr Rect spinnerButton(Rect field,bool up){return {field.x,field.y+(up?4:104),field.w,spinnerButtonHeight};}
inline constexpr Rect spinnerValue(Rect field){return {field.x,field.y+44,field.w,spinnerValueHeight};}
inline constexpr Rect scheduleButton(Rect field,bool up){return {field.x,field.y+(up?0:120),field.w,scheduleButtonHeight};}
inline constexpr Rect scheduleValue(Rect field){return {field.x,field.y+60,field.w,scheduleValueHeight};}
inline constexpr Rect buttonGroupItem(Rect group,int count,int index,int gap=16){
    const int usable=group.w-gap*(count-1),left=usable*index/count,right=usable*(index+1)/count;
    return {group.x+left+gap*index,group.y,right-left,group.h};
}
}
