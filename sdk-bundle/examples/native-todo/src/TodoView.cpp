#include "TodoController.h"
#include <desktile/wrap.hpp>
#include <desktile/ui_metrics.h>
#include <desktile/confirmation_dialog.hpp>
using namespace desktile::sample;
using namespace desktile::sdk;
namespace todo {
namespace {
constexpr int fabClearance=desktile::ui_metrics::fabSize+2*desktile::ui_metrics::fabEdgeInset;
constexpr int listGridBottomPadding=24;
template<size_t N>void message(char (&out)[N],const char *pattern,const char *first,const char *second=""){
    size_t used=0;const char *values[]{first,second};unsigned parameter=0;
    while(*pattern&&used+1<N){if(pattern[0]=='%'&&(pattern[1]=='u'||pattern[1]=='s')&&parameter<2){const auto *value=values[parameter++];while(*value&&used+1<N)out[used++]=*value++;pattern+=2;}else out[used++]=*pattern++;}out[used]=0;
}
void truncate(Application &a,const char *source,char *out,size_t capacity,int width,int font){
    copy(out,capacity,source);int32_t measured=0;if(a.host.textWidth(out,uint16_t(font),measured)!=DT_OK||measured<=width)return;
    size_t n=length(out);while(n){do{--n;}while(n&&(uint8_t(out[n])&0xc0)==0x80);out[n]=0;char candidate[768];copy(candidate,sizeof(candidate),out);size_t at=length(candidate);const char dots[]="…";if(at+sizeof(dots)>sizeof(candidate))continue;memcpy(candidate+at,dots,sizeof(dots));if(a.host.textWidth(candidate,uint16_t(font),measured)==DT_OK&&measured<=width){copy(out,capacity,candidate);return;}}copy(out,capacity,"…");
}
dt_handle icon(Ui &u,dt_handle parent,uint32_t value,int size=32){auto node=u.create(DT_COMPONENT_ICON,parent);u.size(node,size,size);u.set(node,DT_PROPERTY_ICON,value);return node;}
void emptyState(Application &a,dt_handle parent){
    auto &u=a.ui;auto panel=u.create(DT_COMPONENT_STACK,parent);u.size(panel,800,376);
    constexpr auto bounds=desktile::ui_metrics::EmptyStateLayout::resolve({0,0,800,376});
    auto mark=icon(u,panel,94,80);u.set(mark,DT_PROPERTY_MARGIN,dt_edge_insets{bounds.icon.y,0,0,bounds.icon.x});u.set(mark,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));
    const bool lists=a.page==Page::Lists;
    auto title=u.label(panel,a.tr(lists?Text::NoLists:Text::NoTasks),32,40);u.size(title,bounds.title.w,bounds.title.h);u.set(title,DT_PROPERTY_MARGIN,dt_edge_insets{bounds.title.y,0,0,bounds.title.x});u.set(title,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));
    auto body=u.label(panel,a.tr(lists?Text::EmptyLists:Text::EmptyTasks),20,28);u.size(body,bounds.body.w,bounds.body.h);u.set(body,DT_PROPERTY_MARGIN,dt_edge_insets{bounds.body.y,0,0,bounds.body.x});u.set(body,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));u.set(body,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_BODY));
}
dt_handle action(Ui &u,dt_handle parent,uint32_t value,const char *label,int width=72){auto node=u.create(DT_COMPONENT_BUTTON,parent);u.set(node,DT_PROPERTY_BUTTON_STYLE,uint32_t(width==96?DT_BUTTON_NAVIGATION:DT_BUTTON_TEXT));u.size(node,width,72);u.set(node,DT_PROPERTY_PADDING,dt_edge_insets{});u.set(node,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));u.set(node,DT_PROPERTY_JUSTIFICATION,uint32_t(DT_JUSTIFICATION_CENTER));u.text(node,label,DT_PROPERTY_ACCESSIBILITY_LABEL);auto glyph=icon(u,node,value,32);if(value==41){u.set(node,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_DANGER));u.set(glyph,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_DANGER));}return node;}
dt_handle field(Application &a,dt_handle parent,Text title,const char *value){auto &u=a.ui;auto row=u.create(DT_COMPONENT_LIST_ROW,parent);u.size(row,800,76);u.set(row,DT_PROPERTY_FONT_SIZE,int32_t(20));u.text(row,a.tr(title));int32_t width=348;if(a.host.textWidth(value,20,width)!=DT_OK)width=348;width=std::min(int32_t(348),width);auto trailing=u.create(DT_COMPONENT_ROW,row);u.set(trailing,DT_PROPERTY_SLOT_POSITION,uint32_t(DT_SLOT_TRAILING));u.size(trailing,width+40,32);u.set(trailing,DT_PROPERTY_GAP,int32_t(16));u.set(trailing,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));auto end=u.label(trailing,value,20,32);u.set(end,DT_PROPERTY_WIDTH,width);icon(u,trailing,10,24);return row;}
void dueText(Application &a,const Record &record,char (&out)[64]){char date[32];if(record.due==noDate){copy(out,sizeof(out),a.tr(Text::NoDate));return;}formatLocalDate(date,sizeof(date),dateFromDay(record.due),a.locale);copy(out,sizeof(out),date);if(record.dueMinute>=0){dt_locale_info_v1 locale{};const bool hour24=a.host.localeInfo(locale)!=DT_OK||locale.use_24_hour;char time[16];formatLocalTime(time,sizeof(time),record.dueMinute,hour24);size_t at=length(out);if(at+1+length(time)<sizeof(out)){out[at++]=' ';copy(out+at,sizeof(out)-at,time);}}}
int notesHeight(Application &a,const char *text){
    int lines=1,used=0;bool hasGlyph=false;
    const char *at=text,*end=text+length(text);
    while(at<end){
        if(*at=='\n'){++lines;used=0;hasGlyph=false;++at;continue;}
        const char *start=at;uint32_t cp=0;json_detail::utf8(at,end,cp);
        char glyph[5]{};memcpy(glyph,start,size_t(at-start));
        int32_t width=desktile::ui_metrics::documentBodySize;
        a.host.textWidth(glyph,desktile::ui_metrics::documentBodySize,width);
        if(hasGlyph&&used+width>752){++lines;used=0;}
        used+=width;hasGlyph=true;
    }
    return std::max(224,16+lines*desktile::ui_metrics::documentBodyLineHeight);
}
int bodyHeight(Application &a,const char *text){const char *end=text+length(text);WrapState state{text,false,end};WrappedLine line{};int count=0;const auto decode=[end](const char *&at){uint32_t cp=0;json_detail::utf8(at,end,cp);return cp;};const auto advance=[&a](uint32_t cp){char glyph[5]{};if(cp<128)glyph[0]=char(cp);else if(cp<2048){glyph[0]=char(192|(cp>>6));glyph[1]=char(128|(cp&63));}else{glyph[0]=char(224|(cp>>12));glyph[1]=char(128|((cp>>6)&63));glyph[2]=char(128|(cp&63));}int32_t width=20;a.host.textWidth(glyph,20,width);return int(width);};while(nextWrappedLine(state,544,decode,advance,line))++count;return std::max(28,count*28);}
void dialog(Application &a){
    auto &u=a.ui;auto &h=a.handles;
    const bool deletion=a.modal==Modal::Delete,readError=a.canRetryRead();
    const char *message=a.tr(a.modal==Modal::Leave?Text::LeaveBody:deletion?(a.isList()?Text::DeleteListBody:Text::DeleteBody):a.error);
    ConfirmationDialogStyle style;style.actions=a.modal==Modal::Leave?3:deletion||readError?2:1;
    const auto g=ConfirmationDialogLayout::resolve(bodyHeight(a,message),style);
    auto box=u.create(DT_COMPONENT_DIALOG,u.root);u.size(box,g.panel.w,g.panel.h);
    u.set(box,DT_PROPERTY_DIALOG_PRESENTATION,uint32_t(DT_DIALOG_CENTERED));
    u.set(box,DT_PROPERTY_PADDING,dt_edge_insets{24,24,24,24});u.set(box,DT_PROPERTY_GAP,int32_t(style.gap));
    u.set(box,DT_PROPERTY_DIALOG_TITLE_DIVIDER,uint8_t(1));u.set(box,DT_PROPERTY_DIALOG_DESTRUCTIVE,uint8_t(deletion));
    auto title=u.label(box,a.tr(a.modal==Modal::Leave?Text::LeaveTitle:deletion?(a.isList()?Text::DeleteList:Text::DeleteTask):readError?Text::ReadFailed:Text::App),32,style.titleHeight);
    u.set(title,DT_PROPERTY_MARGIN,dt_edge_insets{0,0,int16_t(style.titleMargin),0});
    auto scroll=u.create(DT_COMPONENT_SCROLL_VIEW,box);u.size(scroll,g.body.w,g.body.h);u.set(scroll,DT_PROPERTY_SCROLL_AXIS,uint32_t(DT_AXIS_VERTICAL));
    auto body=u.label(scroll,message,20,g.bodyContentHeight);u.set(body,DT_PROPERTY_TEXT_WRAP,uint8_t(1));u.set(body,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_BODY));
    auto buttons=u.create(DT_COMPONENT_ROW,box);u.size(buttons,g.actions.w,g.actions.h);u.set(buttons,DT_PROPERTY_GAP,int32_t(style.buttonGap));
    int index=0;
    const auto button=[&](Text text,uint32_t icon,uint32_t kind){
        auto node=u.create(DT_COMPONENT_BUTTON,buttons);const auto r=g.action(index++);u.size(node,r.w,r.h);
        u.text(node,a.tr(text));u.set(node,DT_PROPERTY_FONT_SIZE,int32_t(20));u.set(node,DT_PROPERTY_BUTTON_STYLE,kind);
        if(icon){auto glyph=u.create(DT_COMPONENT_ICON,node);u.size(glyph,28,28);u.set(glyph,DT_PROPERTY_ICON,icon);}return node;
    };
    h.dialogCancel=button(readError?Text::Close:Text::Cancel,readError?48:0,DT_BUTTON_CANCEL);
    if(a.modal==Modal::Leave){h.dialogDiscard=button(Text::Discard,0,DT_BUTTON_CANCEL);h.dialogSave=button(Text::Save,85,DT_BUTTON_PRIMARY);}
    else if(deletion)h.dialogDelete=button(Text::Delete,41,DT_BUTTON_DESTRUCTIVE);
    else if(readError)h.retry=button(Text::Retry,14,DT_BUTTON_PRIMARY);
}
}
void Application::render(){
    if(supported&&!host.supports(DT_CAPABILITY_COLOR_SWATCH|DT_CAPABILITY_TASK_LIST_TILES))supported=false;
    if(keyboardRequest)return;
    auto &u=ui;u.begin();handles=Handles{};auto &h=handles;
    h.bar=u.create(DT_COMPONENT_SYSTEM_BAR,u.root);u.size(h.bar,800,72);u.set(h.bar,DT_PROPERTY_PADDING,dt_edge_insets{0,12,0,0});u.set(h.bar,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));h.back=action(u,h.bar,page==Page::Lists?u.exitIcon():11,tr(Text::Cancel),96);
    const bool listContext=page==Page::Tasks||page==Page::EditTask;
    auto appIcon=icon(u,h.bar,listContext?list.icon:94,40);
    if(listContext)u.set(appIcon,DT_PROPERTY_FOREGROUND,list.color);
    else u.set(appIcon,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_ACCENT));
    u.set(appIcon,DT_PROPERTY_MARGIN,dt_edge_insets{0,18,0,22});
    const auto title=page==Page::Lists?tr(Text::App):page==Page::Tasks?list.title:page==Page::EditList?tr(draft.id?Text::EditList:Text::NewList):page==Page::Date?tr(Text::SetDate):tr(draft.id?Text::EditTask:Text::NewTask);
    char shortened[256];truncate(*this,title,shortened,sizeof(shortened),page==Page::Tasks?460:532,32);auto label=u.label(h.bar,shortened,32,72);u.set(label,DT_PROPERTY_FLEX_GROW,1.0f);
    if(supported&&page!=Page::Tasks&&page!=Page::Lists&&page!=Page::Date){h.save=action(u,h.bar,85,tr(Text::Save));if(draft.id)h.remove=action(u,h.bar,41,tr(Text::Delete));}
    auto content=u.create(page==Page::Lists||page==Page::Tasks?DT_COMPONENT_STACK:DT_COMPONENT_COLUMN,u.root);u.size(content,800,376);u.set(content,DT_PROPERTY_GAP,int32_t(0));
    if(!supported){auto note=u.listNote(content,tr(Text::Unsupported));u.set(note,DT_PROPERTY_HEIGHT,int32_t(80));u.present();return;}
    if(page==Page::Lists||page==Page::Tasks){
        h.scroll=u.create(DT_COMPONENT_SCROLL_VIEW,content);u.size(h.scroll,800,376);u.set(h.scroll,DT_PROPERTY_SCROLL_AXIS,uint32_t(DT_AXIS_VERTICAL));u.set(h.scroll,DT_PROPERTY_GAP,int32_t(0));
        if(!loaded){}
        else if(!count)emptyState(*this,h.scroll);
        else if(page==Page::Lists){
            windowStart=firstListTile(count,listsScroll);
            const unsigned end=std::min(count,windowStart+listWindowSize);
            auto before=u.column(h.scroll,int(windowStart/listColumns)*176);h.before=before;u.size(before,800,int(windowStart/listColumns)*176);
            auto grid=u.create(DT_COMPONENT_GRID,h.scroll);h.listGrid=grid;u.size(grid,800,int((end-windowStart+listColumns-1)/listColumns)*176+32);u.set(grid,DT_PROPERTY_GRID_COLUMNS,uint32_t(listColumns));u.set(grid,DT_PROPERTY_GAP,int32_t(16));u.set(grid,DT_PROPERTY_PADDING,dt_edge_insets{24,24,24,24});
            for(unsigned slot=0;slot<std::min(count,listWindowSize);++slot){
                const unsigned i=std::min(windowStart+slot,count-1);
                const auto &record=records[i];const auto &preview=listPreviews[i];
                auto tile=u.create(DT_COMPONENT_STACK,grid);u.size(tile,listTileWidth,160);
                const auto place=[&](dt_handle node,int x,int y,int w,int height){u.size(node,w,height);u.set(node,DT_PROPERTY_MARGIN,dt_edge_insets{int16_t(y),0,0,int16_t(x)});};
                h.rows[i]=u.create(DT_COMPONENT_BUTTON,tile);u.size(h.rows[i],listTileWidth,160);u.set(h.rows[i],DT_PROPERTY_BUTTON_STYLE,uint32_t(DT_BUTTON_OUTLINED));u.set(h.rows[i],DT_PROPERTY_ACCENT,record.color);u.set(h.rows[i],DT_PROPERTY_PADDING,dt_edge_insets{});u.set(h.rows[i],DT_PROPERTY_ENABLED,uint8_t(!writing()));u.text(h.rows[i],record.title,DT_PROPERTY_ACCESSIBILITY_LABEL);
                auto body=u.create(DT_COMPONENT_STACK,h.rows[i]);u.size(body,listTileWidth,160);
                char name[193];truncate(*this,record.title,name,sizeof(name),listTileWidth-76,32);auto nameLabel=u.label(body,name,32,40);place(nameLabel,16,10,listTileWidth-76,40);
                auto mark=icon(u,body,record.icon,32);place(mark,listTileWidth-48,14,32,32);u.set(mark,DT_PROPERTY_FOREGROUND,record.color);
                char summary[256],done[21],total[21];number(done,sizeof(done),preview.completed);number(total,sizeof(total),preview.count);message(summary,tr(Text::Progress),done,total);auto progress=u.label(body,summary,20,24);place(progress,16,52,listTileWidth-32,24);u.set(progress,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));
                char recent[256],shortened[256];if(preview.latest[0])message(recent,tr(Text::Latest),preview.latest);else copy(recent,sizeof(recent),tr(Text::NoTasks));truncate(*this,recent,shortened,sizeof(shortened),listTileWidth-32,20);auto latest=u.label(body,shortened,20,24);place(latest,16,76,listTileWidth-32,24);u.set(latest,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));
                const auto control=[&](int x,uint32_t glyph,Text label,bool danger){auto b=u.create(DT_COMPONENT_BUTTON,body);place(b,x,100,52,52);u.set(b,DT_PROPERTY_BUTTON_STYLE,uint32_t(DT_BUTTON_TEXT));u.set(b,DT_PROPERTY_PADDING,dt_edge_insets{});u.set(b,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));u.set(b,DT_PROPERTY_JUSTIFICATION,uint32_t(DT_JUSTIFICATION_CENTER));u.set(b,DT_PROPERTY_ENABLED,uint8_t(!writing()));u.text(b,tr(label),DT_PROPERTY_ACCESSIBILITY_LABEL);auto mark=icon(u,b,glyph,32);if(danger)u.set(mark,DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_DANGER));return b;};
                h.listEdit[i]=control(8,68,Text::EditList,false);h.listDelete[i]=control(listTileWidth-60,41,Text::DeleteList,true);
                h.tile[slot]=tile;h.tileButton[slot]=h.rows[i];h.tileEdit[slot]=h.listEdit[i];h.tileDelete[slot]=h.listDelete[i];h.tileName[slot]=nameLabel;h.tileMark[slot]=mark;h.tileProgress[slot]=progress;h.tileRecent[slot]=latest;
            }
            const int remaining=int((count-end+listColumns-1)/listColumns)*176+fabClearance-listGridBottomPadding;auto spacer=u.column(h.scroll,remaining);h.after=spacer;u.size(spacer,800,remaining);bindListWindow(windowStart);u.set(h.scroll,DT_PROPERTY_SCROLL_POSITION,listsScroll);
        }else{
            groupRecords();
            h.before=u.create(DT_COMPONENT_COLUMN,h.scroll);u.size(h.before,800,0);
            for(unsigned i=0;i<8;++i){h.slots[i]=u.create(DT_COMPONENT_COLUMN,h.scroll);u.size(h.slots[i],800,76);u.set(h.slots[i],DT_PROPERTY_GAP,int32_t(0));h.groupTitles[i]=u.label(h.slots[i],"",20,40);u.set(h.groupTitles[i],DT_PROPERTY_PADDING,dt_edge_insets{0,24,0,24});u.set(h.groupTitles[i],DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_ACCENT));auto row=u.create(DT_COMPONENT_LIST_ROW,h.slots[i]);u.size(row,800,76);h.rows[i]=row;auto inner=u.create(DT_COMPONENT_ROW,row);u.size(inner,800,76);u.set(inner,DT_PROPERTY_PADDING,dt_edge_insets{0,24,0,24});u.set(inner,DT_PROPERTY_GAP,int32_t(16));u.set(inner,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));
                if(page==Page::Lists)h.marks[i]=icon(u,inner,94);else{u.set(inner,DT_PROPERTY_PADDING,dt_edge_insets{0,24,0,0});u.set(inner,DT_PROPERTY_GAP,int32_t(0));h.checks[i]=u.create(DT_COMPONENT_CHECKBOX,inner);u.size(h.checks[i],84,76);}
                h.words[i]=u.create(DT_COMPONENT_COLUMN,inner);u.set(h.words[i],DT_PROPERTY_WIDTH,int32_t(0));u.set(h.words[i],DT_PROPERTY_FLEX_GROW,1.0f);u.set(h.words[i],DT_PROPERTY_HEIGHT,int32_t(56));u.set(h.words[i],DT_PROPERTY_GAP,int32_t(0));h.names[i]=u.label(h.words[i],"",20,28);h.detailRows[i]=u.create(DT_COMPONENT_ROW,h.words[i]);u.set(h.detailRows[i],DT_PROPERTY_HEIGHT,int32_t(28));u.set(h.detailRows[i],DT_PROPERTY_GAP,int32_t(20));h.times[i]=u.label(h.detailRows[i],"",20,28);u.set(h.times[i],DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));h.details[i]=u.label(h.detailRows[i],"",20,28);u.set(h.details[i],DT_PROPERTY_WIDTH,int32_t(0));u.set(h.details[i],DT_PROPERTY_FLEX_GROW,1.0f);u.set(h.details[i],DT_PROPERTY_FOREGROUND_ROLE,uint32_t(DT_FOREGROUND_SECONDARY));
                icon(u,inner,10,24);
            }
            h.after=u.create(DT_COMPONENT_COLUMN,h.scroll);u.size(h.after,800,0);const int32_t position=std::min<int32_t>(tasksScroll,std::max(0,viewHeight+fabClearance-376));unsigned start=0;while(start+1<viewCount&&viewItems[start+1].y<=position)++start;if(start)--start;start=std::min(start,viewCount>8?viewCount-8:0);bindWindow(start);u.set(h.scroll,DT_PROPERTY_SCROLL_POSITION,position);
        }
        {constexpr auto fab=desktile::ui_metrics::FabLayout::resolve({0,0,800,376});h.add=u.create(DT_COMPONENT_BUTTON,content);u.size(h.add,fab.button.w,fab.button.h);u.set(h.add,DT_PROPERTY_MARGIN,dt_edge_insets{int16_t(fab.button.y),0,0,int16_t(fab.button.x)});u.set(h.add,DT_PROPERTY_PADDING,dt_edge_insets{});u.set(h.add,DT_PROPERTY_BUTTON_STYLE,uint32_t(DT_BUTTON_CIRCULAR));u.set(h.add,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));u.set(h.add,DT_PROPERTY_JUSTIFICATION,uint32_t(DT_JUSTIFICATION_CENTER));u.set(h.add,DT_PROPERTY_ENABLED,uint8_t(!writing()));u.text(h.add,tr(page==Page::Lists?Text::NewList:Text::NewTask),DT_PROPERTY_ACCESSIBILITY_LABEL);icon(u,h.add,39,desktile::ui_metrics::fabIconSize);}
    }else if(page==Page::Date){
        auto body=u.create(DT_COMPONENT_STACK,content);u.size(body,800,376);
        h.picker=u.create(DT_COMPONENT_DATE_TIME_PICKER,body);u.size(h.picker,752,DateTimePickerLayout::height(picker));u.set(h.picker,DT_PROPERTY_MARGIN,dt_edge_insets{0,0,0,24});u.set(h.picker,DT_PROPERTY_DATE_TIME_CONFIG,picker);
        auto corners=dateTimeCornerTextDefaults();corners.enabled=1;
        for(int i=0;i<3;++i)copy(corners.date[i],sizeof(corners.date[i]),picker.units[i]);
        for(int i=0;i<2;++i)copy(corners.time[i],sizeof(corners.time[i]),picker.units[i+3]);
        u.set(h.picker,DT_PROPERTY_DATE_TIME_CORNER_TEXT,corners);
        const auto place=[&](dt_handle handle,desktile::Rect bounds){u.size(handle,bounds.w,bounds.h);u.set(handle,DT_PROPERTY_MARGIN,dt_edge_insets{int16_t(bounds.y-104),0,0,int16_t(bounds.x)});};
        h.noDate=u.button(body,tr(Text::NoDate),48,DT_BUTTON_SECONDARY);place(h.noDate,{24,412,208,52});
        h.pickerCancel=u.button(body,tr(Text::Cancel),48,DT_BUTTON_CANCEL);place(h.pickerCancel,desktile::ui_metrics::stepperCancel);
        h.save=u.button(body,tr(Text::Save),85,DT_BUTTON_PRIMARY);place(h.save,desktile::ui_metrics::stepperConfirm);
    }else{
        h.scroll=u.create(DT_COMPONENT_SCROLL_VIEW,content);u.size(h.scroll,800,376);u.set(h.scroll,DT_PROPERTY_SCROLL_AXIS,uint32_t(DT_AXIS_VERTICAL));u.set(h.scroll,DT_PROPERTY_GAP,int32_t(0));
        if(page==Page::EditTask){
            const int height=notesHeight(*this,draft.notes);
            h.editBody=u.create(DT_COMPONENT_COLUMN,h.scroll);u.size(h.editBody,800,152+height);u.set(h.editBody,DT_PROPERTY_GAP,int32_t(0));char title[256];truncate(*this,draft.title,title,sizeof(title),348,20);h.title=field(*this,h.editBody,Text::Title,title);char due[64];dueText(*this,draft,due);h.due=field(*this,h.editBody,Text::Due,due);h.notes=u.create(DT_COMPONENT_DOCUMENT_EDITOR,h.editBody);u.size(h.notes,800,height);u.text(h.notes,draft.notes);u.text(h.notes,tr(Text::OptionalNotes),DT_PROPERTY_PLACEHOLDER);u.set(h.notes,DT_PROPERTY_DOCUMENT_HEADINGS,uint8_t(0));u.set(h.notes,DT_PROPERTY_DOCUMENT_CURSOR,int32_t(0));u.set(h.notes,DT_PROPERTY_PADDING,dt_edge_insets{16,24,0,24});
        }
        else{
            h.editBody=h.scroll;char titleValue[256];truncate(*this,draft.title,titleValue,sizeof(titleValue),348,20);h.title=field(*this,h.scroll,Text::Title,titleValue);
            this->colors.load(host);const int paletteHeight=color_palette::height(this->colors.size);
            auto colors=u.create(DT_COMPONENT_COLUMN,h.scroll);h.after=colors;u.size(colors,800,72+paletteHeight);u.set(colors,DT_PROPERTY_PADDING,dt_edge_insets{8,24,16,24});u.set(colors,DT_PROPERTY_GAP,int32_t(8));u.label(colors,tr(Text::ListColor),20,32);
            auto choices=u.create(DT_COMPONENT_GRID,colors);u.size(choices,752,paletteHeight);u.set(choices,DT_PROPERTY_GRID_COLUMNS,uint32_t(color_palette::columns));u.set(choices,DT_PROPERTY_GAP,int32_t(color_palette::gap));
            for(unsigned i=0;i<this->colors.size;++i){const auto value=this->colors.values[i];h.color[i]=u.create(DT_COMPONENT_BUTTON,choices);u.set(h.color[i],DT_PROPERTY_BUTTON_STYLE,uint32_t(DT_BUTTON_COLOR_SWATCH));u.size(h.color[i],color_palette::side,color_palette::side);u.set(h.color[i],DT_PROPERTY_BACKGROUND,value);u.set(h.color[i],DT_PROPERTY_CHECKED,uint8_t(draft.color==value));char hex[8]={'#',0,0,0,0,0,0,0};for(unsigned n=0;n<6;++n)hex[n+1]="0123456789ABCDEF"[(value>>(20-n*4))&15];u.text(h.color[i],hex,DT_PROPERTY_ACCESSIBILITY_LABEL);}
            constexpr int iconRows=(task_list::iconCount+7)/8,iconGridHeight=iconRows*80+(iconRows-1)*16;
            dt_color_scheme_v1 scheme{};if(host.colorScheme(scheme)==DT_OK){auto line=u.column(h.scroll,1);u.size(line,800,1);u.set(line,DT_PROPERTY_BACKGROUND,scheme.border);}
            auto icons=u.column(h.scroll,68+iconGridHeight);h.iconSection=icons;u.set(icons,DT_PROPERTY_PADDING,dt_edge_insets{8,24,16,24});u.set(icons,DT_PROPERTY_GAP,int32_t(12));
            u.label(icons,tr(Text::ListIcon),20,32);
            auto iconGrid=u.create(DT_COMPONENT_GRID,icons);u.size(iconGrid,752,iconGridHeight);u.set(iconGrid,DT_PROPERTY_GRID_COLUMNS,uint32_t(8));u.set(iconGrid,DT_PROPERTY_GAP,int32_t(16));
            for(unsigned i=0;i<task_list::iconCount;++i){const auto glyph=task_list::icons[i];auto b=u.create(DT_COMPONENT_BUTTON,iconGrid);h.iconChoices[i]=b;u.size(b,80,80);u.set(b,DT_PROPERTY_BUTTON_STYLE,uint32_t(draft.icon==glyph?DT_BUTTON_PRIMARY:DT_BUTTON_SECONDARY));u.set(b,DT_PROPERTY_CHECKED,uint8_t(draft.icon==glyph));u.set(b,DT_PROPERTY_ALIGNMENT,uint32_t(DT_ALIGNMENT_CENTER));u.set(b,DT_PROPERTY_JUSTIFICATION,uint32_t(DT_JUSTIFICATION_CENTER));u.text(b,tr(Text::ListIcon),DT_PROPERTY_ACCESSIBILITY_LABEL);icon(u,b,glyph,40);}
        }
    }
    if(writing()){if(h.save)u.set(h.save,DT_PROPERTY_ENABLED,uint8_t(0));if(h.remove)u.set(h.remove,DT_PROPERTY_ENABLED,uint8_t(0));}
    if(modal!=Modal::None)dialog(*this);
    u.present();
    desktile::sample::menu(u.api,u.owner,nullptr,0);
}
void Application::bindListWindow(unsigned start){
    windowStart=start;auto &u=ui;auto &h=handles;const unsigned visible=std::min(listWindowSize,count-start),end=start+visible;
    u.set(h.before,DT_PROPERTY_HEIGHT,int32_t(start/listColumns*176));
    u.set(h.listGrid,DT_PROPERTY_HEIGHT,int32_t((visible+listColumns-1)/listColumns*176+32));
    u.set(h.after,DT_PROPERTY_HEIGHT,int32_t((count-end+listColumns-1)/listColumns*176+fabClearance-listGridBottomPadding));
    for(unsigned i=0;i<16;++i)h.rows[i]=h.listEdit[i]=h.listDelete[i]=0;
    for(unsigned slot=0;slot<std::min(count,listWindowSize);++slot){
        u.set(h.tile[slot],DT_PROPERTY_VISIBLE,uint8_t(slot<visible));if(slot>=visible)continue;
        const unsigned i=start+slot;const auto &record=records[i];const auto &preview=listPreviews[i];
        h.rows[i]=h.tileButton[slot];h.listEdit[i]=h.tileEdit[slot];h.listDelete[i]=h.tileDelete[slot];u.text(h.rows[i],record.title,DT_PROPERTY_ACCESSIBILITY_LABEL);
        char name[193];truncate(*this,record.title,name,sizeof(name),listTileWidth-76,32);u.text(h.tileName[slot],name);
        u.set(h.tileMark[slot],DT_PROPERTY_ICON,uint32_t(record.icon));u.set(h.tileMark[slot],DT_PROPERTY_FOREGROUND,record.color);
        u.set(h.tileButton[slot],DT_PROPERTY_ACCENT,record.color);
        char summary[256],done[21],total[21];number(done,sizeof(done),preview.completed);number(total,sizeof(total),preview.count);message(summary,tr(Text::Progress),done,total);u.text(h.tileProgress[slot],summary);
        char recent[256],shortened[256];if(preview.latest[0])message(recent,tr(Text::Latest),preview.latest);else copy(recent,sizeof(recent),tr(Text::NoTasks));truncate(*this,recent,shortened,sizeof(shortened),listTileWidth-32,20);u.text(h.tileRecent[slot],shortened);
    }
}
void Application::bindWindow(unsigned start){
    windowStart=start;auto &u=ui;auto &h=handles;u.set(h.before,DT_PROPERTY_HEIGHT,int32_t(viewItems[start].y));
    const unsigned visible=std::min(8u,viewCount-start),end=start+visible;u.set(h.after,DT_PROPERTY_HEIGHT,int32_t((end<viewCount?viewHeight-viewItems[end].y:0)+fabClearance));
    for(unsigned i=0;i<8;++i){u.set(h.slots[i],DT_PROPERTY_VISIBLE,uint8_t(i<visible));if(i>=visible)continue;const auto &item=viewItems[start+i];const bool header=item.record==UINT32_MAX;u.set(h.slots[i],DT_PROPERTY_HEIGHT,int32_t(item.height));u.set(h.groupTitles[i],DT_PROPERTY_VISIBLE,uint8_t(header));u.set(h.rows[i],DT_PROPERTY_VISIBLE,uint8_t(!header));if(header){const Text groups[]{Text::Overdue,Text::Pending,Text::Completed};u.text(h.groupTitles[i],tr(groups[item.group]));continue;}const auto &record=records[item.record];char name[256];truncate(*this,record.title,name,sizeof(name),648,20);u.text(h.names[i],name);u.set(h.rows[i],DT_PROPERTY_ENABLED,uint8_t(!writing()));u.set(h.rows[i],DT_PROPERTY_LIST_HAS_FOLLOWING_CONTENT,uint8_t(start+i+1<viewCount));
        if(page==Page::Tasks)for(auto label:{h.times[i],h.details[i]})u.set(label,DT_PROPERTY_TEXT_STRIKETHROUGH,uint8_t(record.completed));
        if(page==Page::Lists){u.set(h.marks[i],DT_PROPERTY_FOREGROUND,record.color);u.set(h.words[i],DT_PROPERTY_HEIGHT,int32_t(32));u.set(h.detailRows[i],DT_PROPERTY_VISIBLE,uint8_t(0));}
        else{u.set(h.checks[i],DT_PROPERTY_CHECKED,uint8_t(record.completed));u.set(h.checks[i],DT_PROPERTY_ENABLED,uint8_t(!writing()));char time[128],note[513],shortNote[768];timeSummary(record,time,sizeof(time));noteSummary(record,note,sizeof(note));const bool hasTime=time[0],hasNote=note[0],hasDetail=hasTime||hasNote;int32_t width=0;if(hasTime&&host.textWidth(time,20,width)!=DT_OK)width=320;width=std::min(int32_t(400),width);truncate(*this,note,shortNote,sizeof(shortNote),648-width-(hasTime&&hasNote?20:0),20);u.set(h.words[i],DT_PROPERTY_HEIGHT,int32_t(hasDetail?56:32));u.set(h.detailRows[i],DT_PROPERTY_VISIBLE,uint8_t(hasDetail));u.set(h.times[i],DT_PROPERTY_VISIBLE,uint8_t(hasTime));u.set(h.times[i],DT_PROPERTY_WIDTH,width);u.text(h.times[i],time);u.set(h.details[i],DT_PROPERTY_VISIBLE,uint8_t(hasNote));u.text(h.details[i],shortNote);u.set(h.names[i],DT_PROPERTY_FOREGROUND_ROLE,uint32_t(record.completed?DT_FOREGROUND_SECONDARY:DT_FOREGROUND_DEFAULT));u.set(h.names[i],DT_PROPERTY_TEXT_STRIKETHROUGH,uint8_t(record.completed));}
    }
}
}
