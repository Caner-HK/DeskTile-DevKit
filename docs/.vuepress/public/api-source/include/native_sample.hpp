#pragma once
#include "sdk.h"
#include "stepper.hpp"
namespace desktile::sample {
inline size_t length(const char *value){size_t n=0;while(value&&value[n])++n;return n;}
inline dt_bytes bytes(const char *value){return {reinterpret_cast<const uint8_t*>(value),length(value)};}
inline void copy(char *out,size_t capacity,const char *value){size_t i=0;if(!capacity)return;while(value&&value[i]&&i+1<capacity){out[i]=value[i];++i;}out[i]=0;}
inline void number(char *out,size_t capacity,uint64_t value){char reverse[24];size_t count=0;do{uint64_t quotient=0;uint32_t remainder=0;for(int bit=63;bit>=0;--bit){remainder=(remainder<<1)|uint32_t(value>>bit&1);if(remainder>=10){remainder-=10;quotient|=uint64_t(1)<<bit;}}reverse[count++]=char('0'+remainder);value=quotient;}while(value&&count<24);size_t i=0;while(count&&i+1<capacity)out[i++]=reverse[--count];if(capacity)out[i]=0;}
struct Ui {
    const dt_host_api_v1 *api;dt_app_context owner;dt_handle root;
    dt_result result;
    dt_handle create(dt_component_kind kind,dt_handle parent=0){dt_handle node=0;if(result!=DT_OK)return 0;result=api->ui_create(owner,kind,&node);if(result==DT_OK&&parent)result=api->ui_append(owner,parent,node);return node;}
    template<class T>void set(dt_handle node,dt_property property,T value){if(result==DT_OK)result=api->ui_set(owner,node,property,{reinterpret_cast<const uint8_t*>(&value),sizeof(value)});}
    void text(dt_handle node,const char *value,dt_property property=DT_PROPERTY_TEXT){if(result==DT_OK)result=api->ui_set(owner,node,property,bytes(value));}
    void size(dt_handle node,int width,int height){set(node,DT_PROPERTY_WIDTH,int32_t(width));set(node,DT_PROPERTY_HEIGHT,int32_t(height));}
    void begin(){if(root)api->ui_destroy(owner,root);result=DT_OK;root=create(DT_COMPONENT_PAGE);}
    dt_handle column(dt_handle parent,int height){auto node=create(DT_COMPONENT_COLUMN,parent);set(node,DT_PROPERTY_HEIGHT,int32_t(height));set(node,DT_PROPERTY_GAP,int32_t(12));return node;}
    dt_handle label(dt_handle parent,const char *value,int font=20,int height=32){auto node=create(DT_COMPONENT_TEXT,parent);text(node,value);set(node,DT_PROPERTY_FONT_SIZE,int32_t(font));if(height>0)set(node,DT_PROPERTY_HEIGHT,int32_t(height));return node;}
    dt_handle button(dt_handle parent,const char *value,uint32_t icon,uint32_t style=DT_BUTTON_PRIMARY){auto node=create(DT_COMPONENT_BUTTON,parent);text(node,value);size(node,152,52);set(node,DT_PROPERTY_FONT_SIZE,int32_t(20));set(node,DT_PROPERTY_BUTTON_STYLE,style);auto glyph=create(DT_COMPONENT_ICON,node);size(glyph,28,28);set(glyph,DT_PROPERTY_ICON,icon);return node;}
    uint32_t exitIcon(){dt_launch_info_v1 info{};dt_mutable_bytes value{reinterpret_cast<uint8_t*>(&info),sizeof(info),0};return api->resource_read(owner,DT_SYSTEM_LAUNCH_INFO_RESOURCE,&value)==DT_OK&&value.size==sizeof(info)?info.exit_icon:11;}
    dt_handle header(const char *title,uint32_t exitIcon){auto bar=create(DT_COMPONENT_SYSTEM_BAR,root);size(bar,800,72);auto back=button(bar,"",exitIcon,DT_BUTTON_NAVIGATION);size(back,96,72);auto titleNode=label(bar,title,32,72);set(titleNode,DT_PROPERTY_MARGIN,dt_edge_insets{0,0,0,24});return back;}
    dt_handle body(){auto node=create(DT_COMPONENT_COLUMN,root);set(node,DT_PROPERTY_PADDING,dt_edge_insets{24,24,24,24});set(node,DT_PROPERTY_GAP,int32_t(16));return node;}
    dt_handle listNote(dt_handle parent,const char *value){auto node=create(DT_COMPONENT_LIST_NOTE,parent);text(node,value);return node;}
    struct StepperHandles{dt_handle increment,value,decrement;};
    StepperHandles numberStepper(dt_handle parent,const char *value,const char *unit,int width=128,sdk::StepperStyle style={}){
        if(!style.valid()||width<64||width>704){result=DT_ERR_INVALID_ARGUMENT;return {};}
        auto group=create(DT_COMPONENT_COLUMN,parent);size(group,width,style.height());set(group,DT_PROPERTY_GAP,int32_t(style.verticalGap));
        auto up=button(group,"",style.symbols==sdk::StepperSymbols::Arrows?20:39,DT_BUTTON_TIME_STEPPER);size(up,width,style.buttonHeight);set(up,DT_PROPERTY_REPEAT_INTERVAL,uint32_t(100));
        set(up,DT_PROPERTY_PADDING,dt_edge_insets{});
        auto row=create(DT_COMPONENT_ROW,group);size(row,width,style.valueHeight);set(row,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));set(row,DT_PROPERTY_JUSTIFICATION,uint32_t(DT_JUSTIFICATION_CENTER));set(row,DT_PROPERTY_GAP,int32_t(style.unitGap));
        auto number=label(row,value,style.numberSize,style.valueHeight);if(unit&&*unit){auto suffix=label(row,unit,style.unitSize,style.valueHeight);set(suffix,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));}
        auto down=button(group,"",style.symbols==sdk::StepperSymbols::Arrows?21:40,DT_BUTTON_TIME_STEPPER);size(down,width,style.buttonHeight);set(down,DT_PROPERTY_REPEAT_INTERVAL,uint32_t(100));
        set(down,DT_PROPERTY_PADDING,dt_edge_insets{});
        return {up,number,down};
    }
    dt_result present(){if(result==DT_OK)result=api->ui_present(owner,root);return result;}
};
inline dt_result menu(const dt_host_api_v1 *api,dt_app_context owner,const dt_app_menu_item_v1 *items,size_t count){return api->storage_write(owner,"@system/app-menu",{reinterpret_cast<const uint8_t*>(items),count*sizeof(*items)});}
}
