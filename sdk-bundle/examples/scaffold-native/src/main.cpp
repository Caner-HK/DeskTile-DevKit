#include <desktile/scaffold_view.hpp>
#include <new>
#include <cstring>
using namespace desktile::sdk;
namespace {
struct Words {const char *title,*read,*settings,*heading,*article,*large,*saveError,*readError;};
const Words languages[]{
    {"阅读手册","阅读","设置","小小桌面，大有可能。","将喜欢的文字留在桌边。打开左上角菜单，可以在阅读与设置之间切换。","大号文字","暂时无法保存设置，请重试。","读取设置失败，请重新打开。"},
    {"閱讀手冊","閱讀","設定","諗得到，玩得到。","將喜歡的文字留在桌邊。開啟左上角選單，即可切換閱讀與設定。","大字體","暫時無法儲存設定，請再試。","讀取設定失敗，請重新開啟。"},
    {"Reading guide","Read","Settings","Small Tile. Big Style.","Keep your favourite words close. Open the menu at the top left to switch between reading and settings.","Large text","Couldn't save settings. Try again.","Couldn't load settings. Reopen the app."}
};
struct ReadingApplication {
    Host host;ScaffoldView shell;Component reading{},preferences{},article{},row{},toggle{},status{};
    const Words *words=&languages[0];unsigned section=0;bool large=false;dt_result result=DT_OK;
    void chooseLanguage(){dt_locale_info_v1 info{};host.localeInfo(info);words=&languages[!std::strcmp(info.application_locale,"zh-HK")||!std::strcmp(info.application_locale,"zh-Hant")?1:!std::strncmp(info.application_locale,"en",2)?2:0];}
    template<class T>void set(Component component,dt_property property,T value){if(result==DT_OK)result=host.set(component,property,value);}
    Component make(dt_component_kind kind,Component parent){Component value{};if(result==DT_OK)result=host.create(kind,value);if(result==DT_OK){result=host.append(parent,value);if(result!=DT_OK){host.destroy(value);value={};}}return value;}
    Component text(Component parent,const char *value,int size){auto node=make(DT_COMPONENT_TEXT,parent);if(result==DT_OK)result=host.setText(node,DT_PROPERTY_TEXT,value);set(node,DT_PROPERTY_FONT_SIZE,int32_t(size));return node;}
    dt_result show(unsigned index){section=index;result=host.set(reading,DT_PROPERTY_VISIBLE,index==0);set(preferences,DT_PROPERTY_VISIBLE,index==1);return result;}
    dt_result mount(){
        chooseLanguage();result=DT_OK;const NavigationEntry entries[]{{words->read,43},{words->settings,3}};ScaffoldOptions options;
        result=shell.create(host,options,words->title,entries,2,1);if(result!=DT_OK)return result;
        reading=make(DT_COMPONENT_SCROLL_VIEW,shell.content());auto column=make(DT_COMPONENT_COLUMN,reading);set(column,DT_PROPERTY_PADDING,dt_edge_insets{24,24,24,24});set(column,DT_PROPERTY_GAP,int32_t(24));
        auto heading=text(column,words->heading,32);set(heading,DT_PROPERTY_TEXT_WRAP,true);article=text(column,words->article,large?32:20);set(article,DT_PROPERTY_TEXT_WRAP,true);
        preferences=make(DT_COMPONENT_COLUMN,shell.content());set(preferences,DT_PROPERTY_GAP,int32_t(16));auto list=make(DT_COMPONENT_LIST,preferences);row=make(DT_COMPONENT_LIST_ROW,list);if(result==DT_OK)result=host.setText(row,DT_PROPERTY_TEXT,words->large);set(row,DT_PROPERTY_FONT_SIZE,int32_t(20));set(row,DT_PROPERTY_HEIGHT,int32_t(76));
        toggle=make(DT_COMPONENT_TOGGLE,row);set(toggle,DT_PROPERTY_WIDTH,int32_t(112));set(toggle,DT_PROPERTY_HEIGHT,int32_t(56));set(toggle,DT_PROPERTY_SLOT_POSITION,uint32_t(DT_SLOT_TRAILING));set(toggle,DT_PROPERTY_CHECKED,large);
        status=text(preferences,"",20);set(status,DT_PROPERTY_MARGIN,dt_edge_insets{0,24,0,24});set(status,DT_PROPERTY_TEXT_WRAP,true);set(status,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));
        if(result!=DT_OK){shell.destroy();return result;}result=show(section);if(result==DT_OK)result=shell.select(section);if(result==DT_OK)result=shell.present();if(result!=DT_OK)shell.destroy();return result;
    }
    dt_result enter(){uint8_t saved=0;dt_mutable_bytes data{&saved,1,0};const auto read=host.storageRead("large-text",data);if(read==DT_OK&&data.size==1)large=saved==1;auto created=mount();if(created==DT_OK&&read!=DT_OK&&read!=DT_ERR_NOT_FOUND)created=host.setText(status,DT_PROPERTY_TEXT,words->readError);return created;}
    dt_result event(uint16_t kind,dt_bytes payload){
        if(kind==DT_EVENT_EXIT_REQUEST)return host.requestExit();
        if(kind==DT_EVENT_LANGUAGE_CHANGED){shell.destroy();return mount();}
        const auto action=shell.event(dt_ui_event(kind),payload);if(action.result!=DT_OK)return action.result;
        if(action.action==ScaffoldAction::Original)return host.requestExit();if(action.action==ScaffoldAction::Selected)return show(action.index);
        if((kind==DT_EVENT_VALUE_CHANGED||kind==DT_EVENT_ACTIVATE)&&payload.data&&payload.size==(kind==DT_EVENT_ACTIVATE?sizeof(dt_component_event):sizeof(dt_value_event))){dt_value_event e{};std::memcpy(&e,payload.data,payload.size);if((kind==DT_EVENT_VALUE_CHANGED&&e.target==toggle.handle)||(kind==DT_EVENT_ACTIVATE&&e.target==row.handle)){const uint8_t next=kind==DT_EVENT_ACTIVATE?!large:e.value!=0;const auto saved=host.storageWrite("large-text",{&next,1});if(saved==DT_OK)large=next;result=host.setText(status,DT_PROPERTY_TEXT,saved==DT_OK?"":words->saveError);set(toggle,DT_PROPERTY_CHECKED,large);set(article,DT_PROPERTY_FONT_SIZE,int32_t(large?32:20));return result;}}
        return DT_OK;
    }
};
alignas(ReadingApplication) unsigned char state[sizeof(ReadingApplication)];ReadingApplication *app=nullptr;
dt_result lifecycle(void*,dt_lifecycle_event kind){if(kind==DT_LIFECYCLE_ENTER)return app->enter();if(kind==DT_LIFECYCLE_THEME_CHANGED)return app->shell.refresh();if(kind==DT_LIFECYCLE_LEAVE)return app->shell.destroy();return DT_OK;}
dt_result event(void*,uint16_t kind,dt_bytes payload){return app->event(kind,payload);}
void destroy(void*){if(app){app->shell.destroy();app->~ReadingApplication();app=nullptr;}}
}
extern "C" __attribute__((visibility("default"))) dt_result dt_app_entry(const dt_host_api_v1 *api,dt_app_context owner,dt_app_instance_v1 *instance){if(!api||!owner||!instance)return DT_ERR_INVALID_ARGUMENT;app=new(state)ReadingApplication;app->host=Host(api,owner);instance->abi_version=DT_SDK_ABI_VERSION;instance->user_data=app;instance->lifecycle=lifecycle;instance->event=event;instance->destroy=destroy;return DT_OK;}
