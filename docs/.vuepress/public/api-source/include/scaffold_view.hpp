#pragma once
#include "sdk.hpp"
#include "scaffold.hpp"
#include <climits>
#include <cstdlib>

namespace desktile::sdk {
struct NavigationEntry { const char *label = ""; uint32_t icon = 0; bool enabled = true; };
struct ScaffoldOptions {
    Rect viewport{0,0,800,480};
    NavigationPolicy navigation{};
    bool statusVisible = true, appBarVisible = true, animateNavigation = true;
    int iconWidth = 96, labelWidth = 320;
    uint32_t originalIcon = UINT_MAX;
    uint64_t originalHoldMs = 300;
};
enum class ScaffoldAction { None, Selected, Original };
struct ScaffoldEvent {
    ScaffoldAction action = ScaffoldAction::None;
    int index = -1;
    bool consumed = false;
    dt_result result = DT_OK;
};

// Compound components use the existing ABI primitives and keep their child handles stable.
class ScaffoldView {
public:
    static constexpr unsigned maximumItems = 8;
    ScaffoldView() = default;
    ScaffoldView(const ScaffoldView &) = delete;
    ScaffoldView &operator=(const ScaffoldView &) = delete;
    Component root() const { return root_; }
    Component content() const { return content_; }
    Component actions() const { return actions_; }
    Component primary() const { return primary_; }
    Component item(unsigned index) const { return index<count_?items_[index].button:Component{}; }
    const NavigationState &navigation() const { return state_; }
    ScaffoldLayout layout() const {
        auto result=targetLayout();
        if(options_.animateNavigation&&!bufferedNavigation_){result.navigation=motion_.apply(result.navigation);result.content=result.navigation.content;}
        return result;
    }
    dt_result create(Host &host, const ScaffoldOptions &options, const char *title,
                     const NavigationEntry *entries, unsigned count, unsigned bottomCount=0) {
        if(root_ || !host || !title || count>maximumItems || (count&&!entries) || bottomCount>count ||
           (options.originalIcon!=UINT_MAX&&options.originalIcon>DT_APP_MENU_MAX_ICON) || options.originalHoldMs<100 || options.originalHoldMs>10000 ||
           options.viewport.w<1 || options.viewport.h<1 || options.viewport.w>4096 || options.viewport.h>4096 ||
           options.viewport.x< -4096 || options.viewport.x>4096 || options.viewport.y< -4096 || options.viewport.y>4096 ||
           options.iconWidth<64 || options.iconWidth>4096 || options.labelWidth<64 || options.labelWidth>4096)
            return DT_ERR_INVALID_ARGUMENT;
        for(unsigned i=0;i<count;++i)if(!entries[i].label || entries[i].icon>DT_APP_MENU_MAX_ICON)return DT_ERR_INVALID_ARGUMENT;
        if(!host.supports(DT_CAPABILITY_POINTER_INPUT))return DT_ERR_NOT_SUPPORTED;
        host_=&host;options_=options;state_.reset(options.navigation);count_=count;bottomCount_=bottomCount;
        clock_=0;motion_.reset(targetLayout().navigation);
        if(options_.originalIcon==UINT_MAX){dt_launch_info_v1 launch{};options_.originalIcon=host.launchInfo(launch)==DT_OK&&launch.exit_icon<=DT_APP_MENU_MAX_ICON?launch.exit_icon:11;}
        selected_=count?0:UINT_MAX;error_=DT_OK;
        make(DT_COMPONENT_PAGE,{},root_);
        bufferedNavigation_=options_.animateNavigation&&error_==DT_OK&&host_->set(root_,DT_PROPERTY_NAVIGATION_PRESENTATION,navigationPresentation())==DT_OK;
        make(DT_COMPONENT_SYSTEM_BAR,root_,bar_);
        make(DT_COMPONENT_BUTTON,bar_,primary_);
        make(DT_COMPONENT_TEXT,bar_,title_);
        make(DT_COMPONENT_ROW,bar_,actions_);
        make(DT_COMPONENT_STACK,root_,body_);
        make(DT_COMPONENT_STACK,body_,content_);
        make(DT_COMPONENT_STACK,body_,backdrop_);
        make(DT_COMPONENT_STACK,body_,panel_);
        make(DT_COMPONENT_STACK,panel_,topDivider_);
        text(title_,DT_PROPERTY_TEXT,title);
        for(unsigned i=0;i<count;++i){
            auto &entry=items_[i];entry.enabled=entries[i].enabled;
            make(DT_COMPONENT_BUTTON,panel_,entry.button);
            make(DT_COMPONENT_STACK,entry.button,entry.contents);
            make(DT_COMPONENT_STACK,entry.contents,entry.indicator);
            make(DT_COMPONENT_ICON,entry.contents,entry.icon);
            make(DT_COMPONENT_TEXT,entry.contents,entry.label);
            text(entry.button,DT_PROPERTY_ACCESSIBILITY_LABEL,entries[i].label);
            text(entry.label,DT_PROPERTY_TEXT,entries[i].label);
            set(entry.icon,DT_PROPERTY_ICON,entries[i].icon);
            set(entry.button,DT_PROPERTY_BUTTON_STYLE,uint32_t(DT_BUTTON_TEXT));
            set(entry.label,DT_PROPERTY_FONT_SIZE,int32_t(20));
        }
        make(DT_COMPONENT_STACK,panel_,bottomDivider_);
        set(primary_,DT_PROPERTY_POINTER_INPUT,true);
        set(primary_,DT_PROPERTY_BUTTON_STYLE,uint32_t(DT_BUTTON_NAVIGATION));
        set(backdrop_,DT_PROPERTY_POINTER_INPUT,true);
        set(panel_,DT_PROPERTY_POINTER_INPUT,true);
        set(title_,DT_PROPERTY_FONT_SIZE,int32_t(32));
        set(title_,DT_PROPERTY_FLEX_GROW,1.0f);
        set(title_,DT_PROPERTY_MARGIN,dt_edge_insets{0,0,0,16});
        if(error_!=DT_OK){const auto result=error_;destroy();return result;}
        const auto result=refresh();if(result!=DT_OK)destroy();return result;
    }
    dt_result destroy() {
        const auto result=root_&&host_?host_->destroy(root_):DT_OK;
        root_={};bar_={};primary_={};title_={};actions_={};body_={};content_={};backdrop_={};panel_={};
        topDivider_={};bottomDivider_={};for(auto &entry:items_)entry=Item{};
        host_=nullptr;count_=bottomCount_=0;held_=false;return result;
    }
    dt_result appendContent(Component child) {return host_&&content_?host_->append(content_,child):DT_ERR_INVALID_ARGUMENT;}
    dt_result appendAction(Component child) {return host_&&actions_?host_->append(actions_,child):DT_ERR_INVALID_ARGUMENT;}
    dt_result present() {return host_&&root_?host_->present(root_):DT_ERR_INVALID_ARGUMENT;}
    dt_result title(const char *value) {return host_&&title_?host_->setText(title_,DT_PROPERTY_TEXT,value):DT_ERR_INVALID_ARGUMENT;}
    dt_result select(unsigned index) {
        if(index>=count_ || !items_[index].enabled)return DT_ERR_INVALID_ARGUMENT;
        selected_=index;return refresh();
    }
    dt_result setEntry(unsigned index,const NavigationEntry &value) {
        if(!host_||index>=count_||!value.label||value.icon>DT_APP_MENU_MAX_ICON)return DT_ERR_INVALID_ARGUMENT;
        error_=DT_OK;items_[index].enabled=value.enabled;
        text(items_[index].button,DT_PROPERTY_ACCESSIBILITY_LABEL,value.label);
        text(items_[index].label,DT_PROPERTY_TEXT,value.label);
        set(items_[index].icon,DT_PROPERTY_ICON,value.icon);
        return error_==DT_OK?refresh():error_;
    }
    dt_result refresh() {
        if(!host_||!root_)return DT_ERR_INVALID_ARGUMENT;
        error_=DT_OK;
        dt_color_scheme_v1 colors{};
        if(host_->colorScheme(colors)==DT_OK)colors_=colors;
        if(options_.animateNavigation&&!bufferedNavigation_)motion_.advance(targetLayout().navigation,clock_);
        const auto g=layout();
        if(bufferedNavigation_)set(root_,DT_PROPERTY_NAVIGATION_PRESENTATION,navigationPresentation());
        set(root_,DT_PROPERTY_SURFACE_STYLE,uint32_t(options_.statusVisible?DT_SURFACE_DEFAULT:DT_SURFACE_FULLSCREEN));
        set(bar_,DT_PROPERTY_VISIBLE,options_.appBarVisible);
        set(bar_,DT_PROPERTY_HEIGHT,int32_t(g.appBar.h));
        set(bar_,DT_PROPERTY_BACKGROUND,colors_.header);
        set(primary_,DT_PROPERTY_WIDTH,int32_t(g.navigation.primary.w));
        set(primary_,DT_PROPERTY_HEIGHT,int32_t(g.appBar.h));
        set(primary_,DT_PROPERTY_BACKGROUND,held_&&!cancelled_?colors_.pressed:colors_.header);
        set(primary_,DT_PROPERTY_FOREGROUND,held_&&!cancelled_?colors_.on_pressed:colors_.primary_text);
        const auto primaryKind=state_.primary(held_&&fired_);
        set(primary_,DT_PROPERTY_ICON,primaryKind==NavigationPrimary::Original||!count_?options_.originalIcon:
                                        primaryKind==NavigationPrimary::MenuOpen?uint32_t(93):uint32_t(92));
        set(title_,DT_PROPERTY_FOREGROUND,colors_.primary_text);
        set(actions_,DT_PROPERTY_HEIGHT,int32_t(g.appBar.h));
        set(actions_,DT_PROPERTY_PADDING,dt_edge_insets{0,12,0,0});
        set(body_,DT_PROPERTY_HEIGHT,int32_t(g.body.h));
        set(body_,DT_PROPERTY_FLEX_GROW,1.0f);
        set(content_,DT_PROPERTY_MARGIN,dt_edge_insets{0,0,0,int16_t(g.content.x-g.body.x)});
        set(backdrop_,DT_PROPERTY_VISIBLE,state_.mode()==NavigationMode::Labels||motion_.moving());
        set(panel_,DT_PROPERTY_VISIBLE,g.navigation.panel.w>0);
        set(panel_,DT_PROPERTY_WIDTH,int32_t(g.navigation.panel.w));
        set(panel_,DT_PROPERTY_BACKGROUND,colors_.header);
        place(topDivider_,{g.navigation.divider.x-g.body.x,0,g.navigation.divider.w,1});
        set(topDivider_,DT_PROPERTY_BACKGROUND,colors_.border);
        const auto bottom=g.navigation.bottomDivider(count_,bottomCount_);
        set(bottomDivider_,DT_PROPERTY_VISIBLE,bottom.w>0);
        place(bottomDivider_,{bottom.x-g.body.x,bottom.y-g.body.y,bottom.w,bottom.h});
        set(bottomDivider_,DT_PROPERTY_BACKGROUND,colors_.border);
        for(unsigned i=0;i<count_;++i){
            auto &entry=items_[i];const auto row=g.navigation.item(i,count_,bottomCount_);
            set(entry.button,DT_PROPERTY_VISIBLE,row.h>0);
            set(entry.button,DT_PROPERTY_ENABLED,entry.enabled);
            set(entry.button,DT_PROPERTY_BACKGROUND,colors_.header);
            place(entry.button,{0,row.y-g.body.y,row.w,row.h});
            set(entry.contents,DT_PROPERTY_WIDTH,int32_t(row.w));
            set(entry.contents,DT_PROPERTY_HEIGHT,int32_t(row.h));
            place(entry.indicator,{0,16,4,32});
            set(entry.indicator,DT_PROPERTY_VISIBLE,selected_==i);
            set(entry.indicator,DT_PROPERTY_BACKGROUND,colors_.accent);
            place(entry.icon,{32,16,32,32});
            set(entry.icon,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_PRIMARY));
            set(entry.label,DT_PROPERTY_MARGIN,dt_edge_insets{0,16,0,96});
            set(entry.label,DT_PROPERTY_HEIGHT,int32_t(64));
            set(entry.label,DT_PROPERTY_WIDTH,int32_t(std::max(0,options_.labelWidth-112)));
            set(entry.label,DT_PROPERTY_VISIBLE,g.navigation.panel.w>options_.iconWidth);
            set(entry.label,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_PRIMARY));
        }
        return error_;
    }
    ScaffoldEvent event(dt_ui_event type,dt_bytes payload) {
        ScaffoldEvent out;
        if(!host_||!root_)return out;
        if(motion_.moving()&&(type==DT_EVENT_ACTIVATE||(type>=DT_EVENT_POINTER_DOWN&&type<=DT_EVENT_POINTER_CANCEL))){out.consumed=true;return out;}
        if(type==DT_EVENT_ACTIVATE&&payload.data&&payload.size==sizeof(dt_component_event)){
            dt_component_event e{};memcpy(&e,payload.data,sizeof(e));
            for(unsigned i=0;i<count_;++i)if(e.target==items_[i].button.handle){
                out.consumed=true;if(!state_.visible()||!items_[i].enabled||!layout().navigation.item(i,count_,bottomCount_).h)return out;
                selected_=i;state_.selected();out.action=ScaffoldAction::Selected;out.index=int(i);out.result=refresh();return out;
            }
        }
        if(type==DT_EVENT_TICK&&payload.data&&payload.size==sizeof(dt_tick_event)){
            dt_tick_event e{};memcpy(&e,payload.data,sizeof(e));return tick(e.monotonic_ms);
        }
        if(type<DT_EVENT_POINTER_DOWN||type>DT_EVENT_POINTER_CANCEL||!payload.data||payload.size!=sizeof(dt_pointer_event))return out;
        dt_pointer_event e{};memcpy(&e,payload.data,sizeof(e));
        clock_=e.monotonic_ms;
        if(e.target==backdrop_.handle){out.consumed=true;if(type==DT_EVENT_POINTER_UP){state_.dismiss();out.result=refresh();}return out;}
        if(e.target==panel_.handle){out.consumed=true;return out;}
        if(e.target!=primary_.handle||!options_.appBarVisible)return out;
        out.consumed=true;
        if(type==DT_EVENT_POINTER_DOWN){held_=true;cancelled_=fired_=false;downAt_=e.monotonic_ms;downX_=e.x;downY_=e.y;}
        else if(type==DT_EVENT_POINTER_CANCEL){held_=false;cancelled_=true;}
        else if(type==DT_EVENT_POINTER_MOVE&&held_){const int64_t dx=int64_t(e.x)-downX_,dy=int64_t(e.y)-downY_;if(dx>12||dx< -12||dy>12||dy< -12)cancelled_=true;}
        else if(type==DT_EVENT_POINTER_UP&&held_){
            held_=false;
            if(!cancelled_&&!fired_&&e.monotonic_ms>=downAt_&&layout().navigation.primary.contains(e.x,e.y)){
                if(e.monotonic_ms-downAt_>=options_.originalHoldMs||!count_||!state_.policy().primaryOpens)out.action=ScaffoldAction::Original;
                else state_.toggle();
            }
        }
        out.result=refresh();return out;
    }
    ScaffoldEvent tick(uint64_t now) {
        ScaffoldEvent out;
        clock_=now;
        if(options_.animateNavigation&&!bufferedNavigation_&&motion_.advance(targetLayout().navigation,now)){out.consumed=true;out.result=refresh();}
        if(held_&&!cancelled_&&!fired_&&now>=downAt_&&now-downAt_>=options_.originalHoldMs){
            fired_=true;out.consumed=true;out.action=ScaffoldAction::Original;out.result=refresh();
        }
        return out;
    }
private:
    struct Item {Component button{},contents{},indicator{},icon{},label{};bool enabled=true;};
    Host *host_=nullptr;
    ScaffoldOptions options_{};
    NavigationState state_{};
    NavigationMotion motion_{};
    bool bufferedNavigation_=false;
    dt_navigation_presentation_v1 navigationPresentation()const{
        const auto g=targetLayout();return {sizeof(dt_navigation_presentation_v1),g.body.x,g.body.y,g.body.w,g.body.h,g.navigation.panel.w,g.content.x-g.body.x};
    }
    uint64_t clock_=0;
    ScaffoldLayout targetLayout()const{return ScaffoldLayout::resolve(options_.viewport,state_,options_.statusVisible,options_.appBarVisible,options_.iconWidth,options_.labelWidth);}
    dt_result error_=DT_OK;
    Component root_{},bar_{},primary_{},title_{},actions_{},body_{},content_{},backdrop_{},panel_{},topDivider_{},bottomDivider_{};
    Item items_[maximumItems]{};
    unsigned count_=0,bottomCount_=0,selected_=UINT_MAX;
    bool held_=false,cancelled_=false,fired_=false;
    uint64_t downAt_=0;int downX_=0,downY_=0;
    dt_color_scheme_v1 colors_=[](){dt_color_scheme_v1 p{};p.header=0xf2f2f2;p.primary_text=0x181818;p.border=0xc6c6c6;p.accent=0xff9900;p.pressed=0xc3c3c3;p.on_pressed=0x141414;return p;}();
    void make(dt_component_kind kind,Component parent,Component &out){
        if(error_!=DT_OK)return;
        error_=host_->create(kind,out);
        if(error_==DT_OK&&parent){error_=host_->append(parent,out);if(error_!=DT_OK){host_->destroy(out);out={};}}
    }
    template<class T>void set(Component component,dt_property key,const T &value){if(error_==DT_OK)error_=host_->set(component,key,value);}
    void text(Component component,dt_property key,const char *value){if(error_==DT_OK)error_=host_->setText(component,key,value);}
    void place(Component component,Rect r){
        set(component,DT_PROPERTY_MARGIN,dt_edge_insets{int16_t(std::max(0,r.y)),0,0,int16_t(std::max(0,r.x))});
        set(component,DT_PROPERTY_WIDTH,int32_t(std::max(0,r.w)));set(component,DT_PROPERTY_HEIGHT,int32_t(std::max(0,r.h)));
    }
};
}
