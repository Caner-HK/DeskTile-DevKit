#pragma once
#include "geometry.hpp"
#include "ui_metrics.h"
#include <algorithm>
namespace desktile::sdk {
enum class ConfirmationChoice { Cancel, Discard, Confirm };
struct ConfirmationDialogStyle {
    int width=592,maximumHeight=400,padding=24,titleHeight=48,titleMargin=12;
    int gap=24,buttonHeight=52,buttonGap=12,actions=3;
};
struct ConfirmationDialogLayout {
    Rect panel,title,body,actions;
    int dividerY=0,bodyContentHeight=0;
    ConfirmationDialogStyle style{};
    static ConfirmationDialogLayout resolve(int contentHeight,ConfirmationDialogStyle style={},Rect viewport={0,0,800,480}) {
        style.width=std::clamp(style.width,240,std::max(240,viewport.w-48));
        style.padding=std::clamp(style.padding,12,32);style.actions=std::clamp(style.actions,1,3);
        const int fixed=2*style.padding+style.titleHeight+style.titleMargin+2*style.gap+style.buttonHeight;
        const int height=std::min(std::max(fixed+28,fixed+contentHeight),std::min(style.maximumHeight,viewport.h-48));
        ConfirmationDialogLayout out;out.style=style;out.bodyContentHeight=std::max(0,contentHeight);
        out.panel={viewport.x+(viewport.w-style.width)/2,viewport.y+(viewport.h-height)/2,style.width,height};
        const int x=out.panel.x+style.padding,width=out.panel.w-2*style.padding;
        out.title={x,out.panel.y+style.padding,width,style.titleHeight};out.dividerY=out.title.y+style.titleHeight+12;
        out.actions={x,out.panel.y+height-style.padding-style.buttonHeight,width,style.buttonHeight};
        const int top=out.title.y+style.titleHeight+style.titleMargin+style.gap;
        out.body={x,top,width,std::max(0,out.actions.y-style.gap-top)};return out;
    }
    Rect action(int index) const {return ui_metrics::buttonGroupItem(actions,style.actions,index,style.buttonGap);}
    int scrollLimit() const {return std::max(0,bodyContentHeight-body.h);}
};
}
