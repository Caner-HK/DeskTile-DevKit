#pragma once
#include "geometry.hpp"
#include <algorithm>
#include <cmath>
#include <cstdint>
namespace desktile::sdk {
enum class ProgressMotion:uint32_t { Determinate=0, TravellingSquares=1, PulsingBars=2 };
struct ProgressStyle {
    ProgressMotion motion=ProgressMotion::TravellingSquares;
    uint32_t duration=2800,delay=120;
    int itemSize=8,itemGap=4;
};
struct ProgressMark { Rect bounds{};uint8_t opacity=0; };
struct ProgressFrame { ProgressMark marks[5]{};unsigned count=0; };
struct LoadingTransition {
    static constexpr uint32_t duration=180;
    uint32_t finished=0;
    bool pending=false,painted=false,fading=false;
    void begin(){*this={};pending=true;}
    void finish(uint32_t now){pending=false;finished=now;fading=painted;}
    bool visible(uint32_t now)const{return pending||(fading&&uint32_t(now-finished)<duration);}
    static uint8_t fadeOpacity(uint32_t elapsed){
        if(elapsed>=duration)return 0;
        const double remaining=1.0-double(elapsed)/duration;
        return uint8_t(255*remaining*remaining);
    }
    uint8_t opacity(uint32_t now)const{return pending?255:fading?fadeOpacity(now-finished):0;}
};
// Presentation only: callers retain their authoritative value and completion state.
// A small visual model, advanced by the UI frame loop independently of painting.
// A blocked frame contributes at most40ms; ordinary frames retain180ms ease-out.
struct ProgressAnimation {
    static constexpr uint32_t duration=180;
    static constexpr uint32_t maximumFrameStep=40;
    double current=0,target=0;
    uint32_t updated=0;
    uint16_t remaining=0;
    bool initialized=false;
    static double bounded(double value){return std::isfinite(value)?std::max(0.0,std::min(1.0,value)):0;}
    void advance(uint32_t now){
        const auto step=std::min({maximumFrameStep,uint32_t(now-updated),uint32_t(remaining)});
        updated=now;
        if(!step)return;
        const double ratio=double(remaining-step)/remaining;
        remaining-=step;
        current=remaining?target-(target-current)*ratio*ratio*ratio:target;
    }
    void set(double next,uint32_t now){
        next=bounded(next);
        if(!initialized){current=target=next;updated=now;initialized=true;return;}
        advance(now);
        if(next==target)return;
        target=next;remaining=current==target?0:duration;
    }
    double value()const{return current;}
    bool active()const{return remaining!=0;}
};
inline Rect progressFillBounds(Rect bounds,double fraction){
    if(bounds.w<=0||bounds.h<=0)return {bounds.x,bounds.y,0,0};
    if(!std::isfinite(fraction))fraction=0;
    fraction=std::max(0.0,std::min(1.0,fraction));
    return {bounds.x,bounds.y,static_cast<int>(bounds.w*fraction),bounds.h};
}
inline Rect progressIntersection(Rect a,Rect b){
    const int x=std::max(a.x,b.x),y=std::max(a.y,b.y);
    return {x,y,std::max(0,std::min(a.x+a.w,b.x+b.w)-x),std::max(0,std::min(a.y+a.h,b.y+b.h)-y)};
}
inline int progressEase(int from,int to,uint32_t elapsed,uint32_t duration){
    const int64_t t=std::min<uint32_t>(duration,elapsed)*int64_t(1024)/std::max<uint32_t>(1,duration);
    const int64_t smooth=t*t*(3072-2*t)/(1024*1024);
    return from+int((to-from)*smooth/1024);
}
inline ProgressFrame progressFrame(Rect bounds,uint64_t elapsed,ProgressStyle style={}){
    ProgressFrame frame;if(bounds.w<=0||bounds.h<=0||style.motion==ProgressMotion::Determinate)return frame;
    const unsigned count=style.motion==ProgressMotion::PulsingBars?3:5;
    const int side=std::max(1,std::min({style.itemSize,bounds.w/int(count),bounds.h}));
    const int gap=std::max(0,std::min(style.itemGap,(bounds.w-int(count)*side)/int(count-1)));
    const int cluster=int(count)*side+int(count-1)*gap,left=bounds.x+(bounds.w-cluster)/2;
    const uint32_t duration=std::max<uint32_t>(4,style.duration),quarter=duration/4;
    frame.count=count;
    for(unsigned i=0;i<count;++i){
        auto &mark=frame.marks[i];
        const uint64_t delay=uint64_t(i)*style.delay;
        if(style.motion==ProgressMotion::PulsingBars){
            const uint32_t phase=uint32_t((elapsed%duration+duration-(delay%duration))%duration);
            const uint32_t distance=std::min(phase,duration-phase);
            const uint8_t alpha=uint8_t(255-progressEase(0,204,distance,duration/2));
            const int height=std::min(side*4,bounds.h);
            mark={progressIntersection({left+int(i)*(side+gap),bounds.y+(bounds.h-height)/2,side,height},bounds),alpha};
            if(mark.bounds.w<=0||mark.bounds.h<=0)mark.opacity=0;
        }else{
            if(elapsed<delay)continue;
            const uint32_t phase=uint32_t((elapsed-delay)%duration);
            const int target=left+int(count-1-i)*(side+gap);
            int x=bounds.x-side;
            if(phase<quarter)x=progressEase(x,target,phase,quarter);
            else if(phase<quarter*2)x=target;
            else if(phase<quarter*3)x=progressEase(target,bounds.x+bounds.w,phase-quarter*2,quarter);
            else continue;
            const uint8_t opacity=phase<quarter?uint8_t(progressEase(0,255,phase,quarter)):
                phase<quarter*2?255:uint8_t(progressEase(255,0,phase-quarter*2,quarter));
            mark={progressIntersection({x,bounds.y+(bounds.h-side)/2,side,side},bounds),opacity};
            if(mark.bounds.w<=0)mark.opacity=0;
        }
    }
    return frame;
}
}
