#pragma once
#include "geometry.hpp"
#include <algorithm>
#include <cstdint>
#include <cmath>

namespace desktile::sdk {
enum class NavigationMode : uint8_t { Hidden, Icons, Labels };
enum class NavigationPrimary : uint8_t { Original, Menu, MenuOpen };
struct NavigationPolicy {
    NavigationMode initial = NavigationMode::Hidden;
    NavigationMode opened = NavigationMode::Labels;
    NavigationMode dismissed = NavigationMode::Hidden;
    bool permanentIcons = false;
    bool primaryOpens = true;
    bool allowHideIcons = true;
    bool dismissIconsOnSelection = true;
};

class NavigationState {
public:
    explicit NavigationState(NavigationPolicy policy = {}) { reset(policy); }
    void reset(NavigationPolicy policy = {}) {
        policy_ = policy;
        if (policy_.opened == NavigationMode::Hidden) policy_.opened = NavigationMode::Icons;
        if (policy_.dismissed == NavigationMode::Labels) policy_.dismissed = NavigationMode::Icons;
        if (policy_.permanentIcons) {
            policy_.allowHideIcons = false;
            policy_.dismissed = NavigationMode::Icons;
            if (policy_.initial == NavigationMode::Hidden) policy_.initial = NavigationMode::Icons;
            if (policy_.opened == NavigationMode::Icons) policy_.primaryOpens = false;
        }
        mode_ = policy_.initial;
        userOpened_ = collapsedToIcons_ = false;
    }
    NavigationMode mode() const { return mode_; }
    const NavigationPolicy &policy() const { return policy_; }
    bool visible() const { return mode_ != NavigationMode::Hidden; }
    bool canClose() const {
        return mode_ == NavigationMode::Labels ||
               (mode_ == NavigationMode::Icons && policy_.allowHideIcons && !policy_.permanentIcons);
    }
    NavigationPrimary primary(bool heldOriginal = false) const {
        if (heldOriginal || !policy_.primaryOpens) return NavigationPrimary::Original;
        return userOpened_ && canClose() ? NavigationPrimary::MenuOpen : NavigationPrimary::Menu;
    }
    bool toggle() {
        if (!policy_.primaryOpens) return false;
        const auto old = mode_;
        if (mode_ == NavigationMode::Hidden) { mode_ = policy_.opened; userOpened_ = true; }
        else if (mode_ == NavigationMode::Labels) dismiss();
        else if (collapsedToIcons_ && policy_.allowHideIcons && !policy_.permanentIcons) {
            mode_ = NavigationMode::Hidden; userOpened_ = false; collapsedToIcons_ = false;
        } else if (policy_.opened == NavigationMode::Labels) {
            mode_ = NavigationMode::Labels; userOpened_ = true; collapsedToIcons_ = false;
        } else if (canClose()) { mode_ = NavigationMode::Hidden; userOpened_ = false; }
        return old != mode_;
    }
    bool dismiss() {
        const auto old = mode_;
        if (mode_ == NavigationMode::Labels) {
            mode_ = policy_.dismissed;
            if (mode_ == NavigationMode::Icons) collapsedToIcons_ = true;
        } else if (canClose()) mode_ = NavigationMode::Hidden;
        if (mode_ == NavigationMode::Hidden) userOpened_ = collapsedToIcons_ = false;
        return old != mode_;
    }
    bool selected() {
        return mode_ == NavigationMode::Labels || policy_.dismissIconsOnSelection ? dismiss() : false;
    }
    int occupiedWidth(int iconWidth = 96) const {
        return mode_ == NavigationMode::Icons ||
               (mode_ == NavigationMode::Labels && (policy_.permanentIcons || policy_.dismissed == NavigationMode::Icons))
                   ? iconWidth : 0;
    }
private:
    NavigationPolicy policy_{};
    NavigationMode mode_ = NavigationMode::Hidden;
    bool userOpened_ = false, collapsedToIcons_ = false;
};

struct NavigationLayout {
    Rect primary{}, panel{}, content{}, divider{};
    int rowHeight = 64, padding = 8;
    static NavigationLayout resolve(Rect body, const NavigationState &state, int iconWidth = 96,
                                    int labelWidth = 320, int appBarHeight = 72) {
        NavigationLayout result;
        body.w=std::max(0,body.w);body.h=std::max(0,body.h);
        iconWidth = std::min(body.w,std::max(64,iconWidth));
        labelWidth = std::max(iconWidth, std::min(labelWidth, body.w));
        result.primary = {body.x, body.y - appBarHeight, iconWidth, appBarHeight};
        result.panel = {body.x, body.y, state.visible() ? state.mode() == NavigationMode::Labels ? labelWidth : iconWidth : 0, body.h};
        const int occupied = std::min(body.w, state.occupiedWidth(iconWidth));
        result.content = {body.x + occupied, body.y, body.w - occupied, body.h};
        const int inset=iconWidth/6;
        result.divider = {body.x + inset, body.y, std::max(0,result.panel.w-inset*2), 1};
        return result;
    }
    Rect item(unsigned index, unsigned count, unsigned bottomCount = 0) const {
        if (!panel.w || index >= count || bottomCount > count) return {};
        const unsigned topCount = count - bottomCount;
        const int y = index < topCount ? panel.y + padding + int(index) * rowHeight
                                      : panel.y + panel.h - padding - int(count - index) * rowHeight;
        if (y < panel.y || y + rowHeight > panel.y + panel.h ||
            (index >= topCount && y < panel.y + padding + int(topCount) * rowHeight)) return {};
        return {panel.x, y, panel.w, rowHeight};
    }
    Rect indicator(Rect item) const { return {item.x, item.y + (item.h - 32) / 2, 4, 32}; }
    Rect bottomDivider(unsigned count,unsigned bottomCount)const {
        if(!bottomCount||bottomCount>count)return {};
        const auto first=item(count-bottomCount,count,bottomCount);
        return first.h?Rect{divider.x,first.y,divider.w,1}:Rect{};
    }
};

// WinUI 2 SplitView pane timing. Solve x(t) before evaluating y(t).
inline float navigationProgress(float time) {
    if(time<=0.0f)return 0.0f;
    if(time>=1.0f)return 1.0f;
    float low=0.0f,high=1.0f;
    for(unsigned i=0;i<16;++i){
        const float t=(low+high)*0.5f,s=1.0f-t;
        const float x=3.0f*s*s*t*0.1f+3.0f*s*t*t*0.2f+t*t*t;
        if(x<time)low=t;else high=t;
    }
    const float t=(low+high)*0.5f,s=1.0f-t;
    return 3.0f*s*s*t*0.9f+3.0f*s*t*t+t*t*t;
}
inline constexpr uint32_t navigationDuration(bool expanding){return expanding?350:120;}

// Presentation state is separate from navigation policy and allocates no raster buffers.
class NavigationMotion {
public:
    void reset(const NavigationLayout &layout) {
        width_=targetWidth_=layout.panel.w;
        inset_=targetInset_=layout.content.x-layout.panel.x;
        ready_=true;moving_=false;
    }
    bool advance(const NavigationLayout &target,uint64_t now) {
        if(!ready_){reset(target);return false;}
        const int beforeWidth=width_,beforeInset=inset_;
        const bool beforeMoving=moving_;
        if(moving_){
            const float t=now>=started_?std::min(1.0f,float(now-started_)/duration_):0.0f;
            const float amount=navigationProgress(t);
            width_=fromWidth_+int(std::lround((targetWidth_-fromWidth_)*amount));
            inset_=fromInset_+int(std::lround((targetInset_-fromInset_)*amount));
            if(t>=1.0f){width_=targetWidth_;inset_=targetInset_;moving_=false;}
        }
        const int nextInset=target.content.x-target.panel.x;
        if(targetWidth_!=target.panel.w||targetInset_!=nextInset){
            fromWidth_=width_;fromInset_=inset_;targetWidth_=target.panel.w;targetInset_=nextInset;
            expanding_=targetWidth_>fromWidth_;duration_=navigationDuration(expanding_);started_=now;
            moving_=width_!=targetWidth_||inset_!=targetInset_;
        }
        return moving_||beforeMoving!=moving_||beforeWidth!=width_||beforeInset!=inset_;
    }
    bool moving()const{return moving_;}
    NavigationLayout apply(NavigationLayout layout)const{
        if(!ready_)return layout;
        const int total=layout.content.w+layout.content.x-layout.panel.x;
        layout.panel.w=std::clamp(width_,0,total);
        layout.content.x=layout.panel.x+std::clamp(inset_,0,total);
        layout.content.w=total-(layout.content.x-layout.panel.x);
        layout.divider.w=std::max(0,layout.panel.w-2*(layout.divider.x-layout.panel.x));
        return layout;
    }
private:
    int width_=0,inset_=0,targetWidth_=0,targetInset_=0,fromWidth_=0,fromInset_=0;
    uint64_t started_=0;
    uint32_t duration_=0;
    bool ready_=false,moving_=false,expanding_=false;
};
} // namespace desktile::sdk
