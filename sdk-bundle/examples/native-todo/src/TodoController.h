#pragma once
#include "TodoModel.h"
#include "TodoTexts.h"
#include <desktile/native_sample.hpp>
#include <desktile/sdk.hpp>
#include <desktile/date_time_picker.hpp>
#include <desktile/locale.hpp>
#include <desktile/color_palette.hpp>
namespace todo {
inline constexpr unsigned readBatchSize=4;
inline constexpr unsigned listColumns=2,listWindowSize=listColumns*3;
inline constexpr int listTileWidth=(752-int(listColumns-1)*16)/int(listColumns);
inline unsigned firstListTile(unsigned count,int32_t scroll){return std::min(unsigned(std::max<int32_t>(0,scroll)/176)*listColumns,count>listWindowSize?((count-listColumns*2-1)/listColumns)*listColumns:0);}
enum class Page { Lists, Tasks, EditList, EditTask, Date };
enum class Operation { None, Register, List, Get, Save, Verify, Delete, Toggle };
enum class Modal { None, Error, Leave, Delete };
struct Handles {
    dt_handle bar=0,back=0,add=0,save=0,remove=0,retry=0;
    dt_handle scroll=0,title=0,due=0,notes=0,color[desktile::sdk::color_palette::capacity]{},rows[16]{},checks[8]{},names[8]{},details[8]{},words[8]{},marks[8]{};
    dt_handle listEdit[16]{},listDelete[16]{},iconChoices[desktile::sdk::task_list::iconCount]{};
    dt_handle listGrid=0,tile[listWindowSize]{},tileButton[listWindowSize]{},tileEdit[listWindowSize]{},tileDelete[listWindowSize]{};
    dt_handle tileName[listWindowSize]{},tileMark[listWindowSize]{},tileProgress[listWindowSize]{},tileRecent[listWindowSize]{};
    dt_handle before=0,after=0,iconSection=0,editBody=0;
    dt_handle slots[8]{},groupTitles[8]{};
    dt_handle detailRows[8]{},times[8]{};
    dt_handle picker=0,noDate=0,pickerCancel=0,dialogCancel=0,dialogDiscard=0,dialogSave=0,dialogDelete=0;
};
struct Application {
    desktile::sample::Ui ui{};
    desktile::sdk::Host host{};
    Handles handles{};
    desktile::sdk::color_palette::Selection colors;
    Page page=Page::Lists,returnPage=Page::Lists;
    Modal modal=Modal::None;
    Text error=Text::ReadError;
    Record records[64]{},staging[64]{},draft{},original{},list{};
    struct ListPreview {char latest[193]{};uint8_t count=0,completed=0;};
    ListPreview listPreviews[16]{},stagedPreviews[16]{};
    unsigned count=0,stagedCount=0,windowStart=0;
    struct ViewItem {unsigned record=UINT32_MAX,group=0;int y=0,height=0;};
    ViewItem viewItems[67]{};
    unsigned viewCount=0;
    int viewHeight=0;
    int64_t summaryMinute=INT64_MIN;
    uint32_t pendingOffset=0;
    int32_t listsScroll=0,tasksScroll=0;
    bool loaded=false,supported=false,readGranted=false,exitAfterSave=false;
    bool pendingWriting=false,pendingList=false,editingNotes=false;
    bool backAfterWrite=false,exitAfterWrite=false;
    Operation operation=Operation::None,lastOperation=Operation::None;
    dt_request_id request=0,permissionRequest=0,keyboardRequest=0;
    unsigned keyboardField=0;
    uint64_t retryAt=0,retryDeadline=0,sequence=0,requestTarget=0;
    char locale[32]{},command[8192]{},keyboard[4096]{},clientKey[64]{};
    desktile::sdk::CivilDate today{2000,1,1};
    dt_date_time_picker_v1 picker{};
    const char *tr(Text id)const{return text(id,locale);}
    bool busy()const{return operation!=Operation::None||permissionRequest||keyboardRequest;}
    bool writing()const{return operation==Operation::Save||operation==Operation::Verify||operation==Operation::Delete||operation==Operation::Toggle;}
    bool cancelRead();
    bool canRetryRead()const{return modal==Modal::Error&&error==Text::ReadError&&(page==Page::Lists||page==Page::Tasks)&&(lastOperation==Operation::Register||lastOperation==Operation::List||lastOperation==Operation::Get);}
    bool editing()const{return page==Page::EditList||page==Page::EditTask||page==Page::Date;}
    bool dirty()const{return editing()&&!draft.same(original);}
    bool isList()const{return page==Page::Lists||page==Page::EditList;}
    void render();
    void errorMessage(Text value);
    void readPage();
    void readBatch(uint32_t at);
    void bindWindow(unsigned start=0);
    void groupRecords();
    unsigned groupFor(const Record &)const;
    unsigned groupFor(const Record &,int64_t now)const;
    int64_t localNow()const;
    int64_t remaining(const Record &)const;
    void summary(const Record &,char *,size_t)const;
    void timeSummary(const Record &,char *,size_t)const;
    void noteSummary(const Record &,char *,size_t)const;
    void getRecord(uint64_t id,bool lists=false);
    void beginEdit(bool lists);
    void save();
    void remove();
    void toggle(unsigned index);
    void send(Operation value,bool writing);
    void submit();
    void finish(const dt_request_complete_event &event);
    void keyboardOpen(unsigned field);
    void bindListWindow(unsigned start);
    void keyboardFinish(const dt_request_complete_event &event);
    void back(bool exit=false);
    void discard();
    void activate(dt_handle target);
    dt_result event(uint16_t kind,dt_bytes payload);
    void registerLocale();
    void refreshLocale();
};
extern Application app;
}
