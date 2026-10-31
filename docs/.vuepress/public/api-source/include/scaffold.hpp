#pragma once
#include "navigation.hpp"
#include "ui_metrics.h"
namespace desktile::sdk {
struct ScaffoldLayout {
    Rect statusBar{},appBar{},body{},content{};
    NavigationLayout navigation{};
    static ScaffoldLayout resolve(Rect viewport,const NavigationState &state,bool statusVisible=true,
                                  bool appBarVisible=true,int iconWidth=96,int labelWidth=320){
        viewport.w=std::max(0,viewport.w);viewport.h=std::max(0,viewport.h);
        ScaffoldLayout out;const int status=statusVisible?std::min(32,viewport.h):0;
        const int bar=appBarVisible?std::min(ui_metrics::appBarHeight,viewport.h-status):0;
        out.statusBar={viewport.x,viewport.y,viewport.w,status};
        out.appBar={viewport.x,viewport.y+status,viewport.w,bar};
        out.body={viewport.x,viewport.y+status+bar,viewport.w,viewport.h-status-bar};
        out.navigation=NavigationLayout::resolve(out.body,state,iconWidth,labelWidth,bar);
        out.content=out.navigation.content;return out;
    }
};
}
