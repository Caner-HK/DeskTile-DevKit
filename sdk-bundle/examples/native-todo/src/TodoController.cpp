#include "TodoController.h"
using namespace desktile::sdk;
using namespace desktile::sample;
namespace todo {
Application app{};
namespace {
void identifier(JsonWriter &json,uint64_t value){char out[21];number(out,sizeof(out),value);json.string(out);}
void start(JsonWriter &json,const char *operation,bool lists){json.raw("{\"schema\":1,\"operation\":");json.string(operation);json.raw(",\"collection\":");json.string(lists?"lists":"tasks");}
bool validText(dt_bytes value,size_t limit){if(value.size>limit||(!value.data&&value.size))return false;if(!value.size)return true;const char *p=reinterpret_cast<const char*>(value.data),*end=p+value.size;while(p<end){uint32_t cp;if(!json_detail::utf8(p,end,cp)||!cp)return false;}return true;}
Text failure(dt_result result,bool writing){switch(result){case DT_ERR_PERMISSION_DENIED:return Text::Denied;case DT_ERR_BUSY:return Text::Conflict;case DT_ERR_NOT_FOUND:return Text::Missing;case DT_ERR_BUFFER_TOO_SMALL:return Text::Capacity;default:return writing?Text::WriteError:Text::ReadError;}}
}
void Application::refreshLocale(){
    dt_locale_info_v1 info{};
    if(host.localeInfo(info)==DT_OK){copy(locale,sizeof(locale),info.application_locale);const int64_t seconds=host.wallClockSeconds()+int64_t(info.utc_offset_minutes)*60;const int64_t day=seconds/86400-(seconds<0&&seconds%86400?1:0);if(day>=civilDay({1900,1,1})&&day<=civilDay({2100,12,31}))today=dateFromDay(int32_t(day));}
    if(!locale[0])copy(locale,sizeof(locale),"zh-CN");
}
void Application::errorMessage(Text value){backAfterWrite=exitAfterWrite=false;modal=Modal::Error;error=value;render();}
bool Application::cancelRead(){
    if(keyboardRequest||writing())return false;
    const auto previous=request,permission=permissionRequest;
    request=permissionRequest=0;operation=Operation::None;retryAt=retryDeadline=0;stagedCount=0;
    if(previous)host.cancelRequest(previous);
    if(permission)host.cancelRequest(permission);
    return true;
}
void Application::registerLocale(){JsonWriter json(command,sizeof(command));json.raw("{\"schema\":1,\"operation\":\"locale.register\",\"default\":\"zh-CN\",\"supported\":[\"zh-CN\",\"zh-HK\",\"en-US\"]}");send(Operation::Register,false);}
void Application::send(Operation value,bool writing){
    if(busy())return;
    operation=lastOperation=value;pendingWriting=writing;retryDeadline=host.monotonicMs()+5000;retryAt=0;request=0;
    if(value!=Operation::Register){
        const auto permission=writing?DT_PERMISSION_TASKS_WRITE:DT_PERMISSION_TASKS_READ;
        const auto state=host.permission(permission);
        if(state!=DT_PERMISSION_GRANTED){
            const auto result=state==DT_PERMISSION_UNKNOWN?host.requestPermission(permission,tr(writing?Text::WritePermission:Text::ReadPermission),permissionRequest):DT_ERR_PERMISSION_DENIED;
            if(result!=DT_OK){permissionRequest=0;operation=Operation::None;errorMessage(Text::Denied);}
            else render();
            return;
        }
    }
    submit();
}
void Application::submit(){
    const bool repaint=retryAt==0&&(operation!=Operation::List||pendingOffset==0);
    const auto result=host.platformRequest(command,request);
    if(result==DT_ERR_BUSY&&host.monotonicMs()<retryDeadline){request=0;retryAt=host.monotonicMs()+250;if(repaint)render();return;}
    retryAt=0;
    if(result!=DT_OK){request=0;operation=Operation::None;errorMessage(result==DT_ERR_BUSY?(pendingWriting?Text::WriteError:Text::ReadError):failure(result,pendingWriting));}
    else if(repaint)render();
}
void Application::readPage(){if(busy())return;stagedCount=0;readBatch(0);}
void Application::readBatch(uint32_t at){
    if(busy())return;const bool lists=page==Page::Lists;pendingOffset=at;
    JsonWriter json(command,sizeof(command));start(json,"data.list",lists);json.raw(",\"offset\":");json.number(at);json.raw(",\"limit\":");json.number(readBatchSize);json.raw(",\"include_completed\":true,\"include_notes\":true");if(!lists){json.raw(",\"parent\":");identifier(json,list.id);}json.raw("}");send(Operation::List,false);
}
void Application::getRecord(uint64_t id,bool lists){if(busy())return;requestTarget=id;pendingList=lists;JsonWriter json(command,sizeof(command));start(json,"data.get",lists);json.raw(",\"id\":");identifier(json,id);json.raw("}");send(Operation::Get,false);}
void Application::beginEdit(bool lists){
    if(busy())return;draft=Record{};original=Record{};if(lists){dt_color_scheme_v1 colors{};if(host.colorScheme(colors)==DT_OK)draft.color=colors.accent;page=Page::EditList;returnPage=Page::Lists;}else{draft.parent=list.id;draft.defaultDeadline(localNow());original=draft;page=Page::EditTask;returnPage=Page::Tasks;}
    clientKey[0]=0;exitAfterSave=false;modal=Modal::None;render();
}
void Application::save(){
    if(busy())return;
    if(!titled(draft)){errorMessage(Text::InvalidTitle);return;}
    if(draft.id&&draft.same(original)){back(exitAfterSave);return;}
    const bool lists=page==Page::EditList;
    JsonWriter json(command,sizeof(command));start(json,draft.id?"data.update":"data.create",lists);
    if(draft.id){json.raw(",\"id\":");identifier(json,draft.id);json.raw(",\"revision\":");json.number(draft.revision);}
    else{
        if(!clientKey[0]){dt_clock_info_v1 clock{};dt_mutable_bytes bytes{reinterpret_cast<uint8_t*>(&clock),sizeof(clock),0};host.resourceRead(DT_SYSTEM_CLOCK_INFO_RESOURCE,bytes);char a[21],b[21],c[21];number(a,sizeof(a),clock.boot_id);number(b,sizeof(b),host.monotonicMs());number(c,sizeof(c),++sequence);size_t at=0;const char *parts[]{a,"-",b,"-",c};for(const char *part:parts)for(const char *p=part;*p&&at+1<sizeof(clientKey);++p)clientKey[at++]=*p;clientKey[at]=0;}
        json.raw(",\"client_key\":");json.string(clientKey);
    }
    json.raw(",\"fields\":{\"title\":");json.string(draft.title);json.raw(",\"notes\":");json.string(draft.notes);
    if(lists){json.raw(",\"color\":");json.number(draft.color);json.raw(",\"icon\":");json.number(draft.icon);}else{json.raw(",\"parent\":");identifier(json,draft.parent);json.raw(",\"completed\":");json.boolean(draft.completed);json.raw(",\"due_date\":");if(draft.due==noDate)json.raw("null");else{char date[11];formatDate(dateFromDay(draft.due),date);json.string(date);}json.raw(",\"due_time\":");if(draft.due==noDate||draft.dueMinute<0)json.raw("null");else{char time[6];timeText(draft.dueMinute,time);json.string(time);}}
    json.raw("}}");if(!json.ok()){errorMessage(Text::WriteError);return;}send(Operation::Save,true);
}
void Application::remove(){if(busy())return;JsonWriter json(command,sizeof(command));start(json,"data.delete",isList());json.raw(",\"id\":");identifier(json,draft.id);json.raw(",\"revision\":");json.number(draft.revision);if(isList())json.raw(",\"cascade\":true");json.raw("}");send(Operation::Delete,true);}
void Application::toggle(unsigned index){if(busy()||index>=count||page!=Page::Tasks)return;const auto &item=records[index];JsonWriter json(command,sizeof(command));start(json,"data.update",false);json.raw(",\"id\":");identifier(json,item.id);json.raw(",\"revision\":");json.number(item.revision);json.raw(",\"fields\":{\"completed\":");json.boolean(!item.completed);json.raw("}}");send(Operation::Toggle,true);}
void Application::finish(const dt_request_complete_event &e){
    if(e.request!=request||!request)return;const auto completed=operation;request=0;operation=Operation::None;
    if(e.result!=DT_OK){errorMessage(failure(e.result,pendingWriting));return;}
    if(completed==Operation::Delete){const bool exit=exitAfterWrite;backAfterWrite=exitAfterWrite=false;page=isList()?Page::Lists:Page::Tasks;modal=Modal::None;if(page==Page::Lists){list=Record{};loaded=false;count=0;}if(exit){host.requestExit();return;}readPage();return;}
    const auto root=JsonView::parse(e.payload.data,e.payload.size);
    if(!root.object()){errorMessage(pendingWriting?Text::WriteError:Text::ReadError);return;}
    if(completed==Operation::Register){char selected[32];if(!root.get("locale").string(selected,sizeof(selected))){errorMessage(Text::ReadError);return;}copy(locale,sizeof(locale),selected);refreshLocale();readPage();return;}
    if(completed==Operation::List){
        auto items=root.get("items");bool nextMore=false;int64_t next=0;const size_t total=items.count();const bool lists=page==Page::Lists;
        const unsigned maximum=lists?16:64;
        bool valid=items.array()&&total<=readBatchSize&&stagedCount+total<=maximum&&root.get("more").boolean(nextMore)&&root.get("next_offset").integer(next)&&next>=0&&uint64_t(next)==uint64_t(pendingOffset)+total&&uint64_t(pendingOffset)==stagedCount&&next<=maximum&&(!nextMore||(total==readBatchSize&&next<maximum));
        for(unsigned i=0;valid&&i<total;++i){auto &record=staging[stagedCount+i];valid=parse(items.element(i),record,lists,true)&&titled(record)&&(lists||record.parent==list.id);for(unsigned j=0;j<stagedCount+i;++j)valid=valid&&staging[j].id!=record.id;}
        if(valid&&lists)for(unsigned i=0;i<total;++i){auto &preview=stagedPreviews[stagedCount+i];preview=ListPreview{};const auto item=items.element(i);int64_t totalTasks=0,done=0;
            if(item.get("task_count")){valid=item.get("task_count").integer(totalTasks)&&item.get("completed_count").integer(done)&&totalTasks>=0&&totalTasks<=64&&done>=0&&done<=totalTasks&&item.get("latest_title").string(preview.latest,sizeof(preview.latest));if(!valid)break;preview.count=uint8_t(totalTasks);preview.completed=uint8_t(done);}
        }
        if(!valid){errorMessage(Text::ReadError);return;}
        stagedCount+=unsigned(total);if(nextMore){readBatch(uint32_t(next));return;}
        for(unsigned i=0;i<stagedCount;++i){records[i]=staging[i];if(lists)listPreviews[i]=stagedPreviews[i];}count=stagedCount;loaded=true;readGranted=true;render();return;
    }
    if(completed==Operation::Get){if(!parse(root,staging[0],pendingList,true)||staging[0].id!=requestTarget||(!pendingList&&staging[0].parent!=list.id)||!titled(staging[0])){errorMessage(Text::ReadError);return;}draft=staging[0];original=draft;returnPage=page==Page::Lists?Page::Lists:Page::Tasks;page=pendingList?Page::EditList:Page::EditTask;clientKey[0]=0;exitAfterSave=false;render();return;}
    if(completed==Operation::Save){
        uint64_t saved=0;int64_t revision=0;if(!id(root.get("id"),saved)||!root.get("revision").integer(revision)||revision<1||revision>UINT32_MAX||(draft.id&&saved!=draft.id)){errorMessage(Text::WriteError);return;}
        requestTarget=saved;JsonWriter json(command,sizeof(command));start(json,"data.get",page==Page::EditList);json.raw(",\"id\":");identifier(json,saved);json.raw("}");send(Operation::Verify,false);return;
    }
    if(completed==Operation::Verify){
        if(!parse(root,staging[0],page==Page::EditList,true)||staging[0].id!=requestTarget||!titled(staging[0])){errorMessage(Text::WriteError);return;}
        const bool matches=draft.same(staging[0]);draft.id=staging[0].id;draft.revision=staging[0].revision;original=staging[0];
        if(!matches){errorMessage(Text::Conflict);return;}
        draft=original;
        if(page==Page::EditList&&returnPage==Page::Tasks)list=draft;
        const bool exit=exitAfterSave||exitAfterWrite;exitAfterSave=backAfterWrite=exitAfterWrite=false;
        if(exit){host.requestExit();return;}
        page=returnPage;modal=Modal::None;readPage();return;
    }
    if(completed==Operation::Toggle){const bool leave=backAfterWrite,exit=exitAfterWrite;backAfterWrite=exitAfterWrite=false;if(leave)back(exit);else readPage();return;}
}
void Application::keyboardOpen(unsigned field){
    if(busy()||!editing()||page==Page::Date)return;
    const bool notes=field==2,embedded=notes;const dt_handle editor=handles.notes;JsonWriter json(keyboard,sizeof(keyboard));json.raw("{\"title\":");json.string(tr(notes?Text::Notes:Text::Title));json.raw(",\"initial\":");json.string(notes?draft.notes:draft.title);json.raw(",\"maximum_length\":");json.number(notes?512:192);json.raw(",\"input_type\":");json.string(notes?"multiline":"text");if(embedded){json.raw(",\"presentation\":");json.string("embedded_plain_text");}
    if(embedded){int32_t cursor=0;host.get({editor},DT_PROPERTY_DOCUMENT_CURSOR,cursor);if(cursor<0||size_t(cursor)>length(notes?draft.notes:draft.title))cursor=0;json.raw(",\"editor_target\":");json.number(editor);json.raw(",\"cursor_byte\":");json.number(uint32_t(cursor));}json.raw("}");
    if(!json.ok()){errorMessage(Text::WriteError);return;}
    if(embedded){editingNotes=true;ui.set(handles.bar,DT_PROPERTY_VISIBLE,uint8_t(0));ui.set(handles.scroll,DT_PROPERTY_SCROLL_POSITION,int32_t(0));ui.set(handles.editBody,DT_PROPERTY_HEIGHT,int32_t(376));ui.set(handles.editBody,DT_PROPERTY_PADDING,dt_edge_insets{});for(const dt_handle child:{handles.title,handles.notes,handles.due,handles.after,handles.iconSection})if(child)ui.set(child,DT_PROPERTY_VISIBLE,uint8_t(child==editor));ui.set(editor,DT_PROPERTY_WIDTH,int32_t(800));ui.set(editor,DT_PROPERTY_HEIGHT,int32_t(140));ui.set(editor,DT_PROPERTY_DOCUMENT_FOCUSED,uint8_t(1));ui.set(editor,DT_PROPERTY_PADDING,dt_edge_insets{0,24,0,24});ui.present();}
    keyboardField=field;const auto result=host.showKeyboard(bytes(json.data()),keyboardRequest);if(result!=DT_OK){keyboardRequest=0;editingNotes=false;keyboardField=0;errorMessage(Text::WriteError);}
}
void Application::keyboardFinish(const dt_request_complete_event &e){
    if(e.request!=keyboardRequest||!keyboardRequest)return;const unsigned field=keyboardField;keyboardRequest=0;keyboardField=0;editingNotes=false;
    if(field==2){char live[513];if(host.getText({handles.notes},DT_PROPERTY_TEXT,live,sizeof(live))==DT_OK)copy(draft.notes,sizeof(draft.notes),live);}
    if(e.result==DT_OK){const size_t capacity=field==2?sizeof(draft.notes):sizeof(draft.title);if(!validText(e.payload,capacity-1)){errorMessage(Text::WriteError);return;}char *out=field==2?draft.notes:draft.title;if(e.payload.size)memcpy(out,e.payload.data,e.payload.size);out[e.payload.size]=0;}
    else if(e.result!=DT_ERR_CANCELLED){errorMessage(Text::WriteError);return;}
    render();
}
void Application::discard(){const bool exit=exitAfterSave;exitAfterSave=false;modal=Modal::None;draft=original;if(exit){host.requestExit();return;}page=returnPage;readPage();}
void Application::back(bool exit){
    if(writing()){backAfterWrite=true;exitAfterWrite=exitAfterWrite||exit;return;}
    if(busy()&&!cancelRead())return;
    if(page==Page::Date&&!exit){page=Page::EditTask;render();return;}
    if(dirty()){exitAfterSave=exit;modal=Modal::Leave;render();return;}
    if(exit||page==Page::Lists){host.requestExit();return;}
    if(page==Page::Tasks){page=Page::Lists;loaded=false;count=0;readPage();return;}
    page=returnPage;readPage();
}
void Application::activate(dt_handle target){
    if(!target)return;
    if(modal==Modal::None&&(target==handles.back||target==handles.pickerCancel)){back();return;}
    if(busy()){
        bool navigation=target==handles.add||target==handles.retry;
        if(page==Page::Lists)for(unsigned i=0;i<count;++i)navigation=navigation||target==handles.rows[i]||target==handles.listEdit[i]||target==handles.listDelete[i];
        if(page==Page::Tasks)for(unsigned i=0;i<8;++i)navigation=navigation||target==handles.rows[i];
        if(!navigation||operation==Operation::Register||!cancelRead())return;
    }
    if(modal!=Modal::None){
        if(target==handles.retry&&canRetryRead()){
            const auto retry=lastOperation;modal=Modal::None;
            if(retry==Operation::Register)registerLocale();
            else if(retry==Operation::Get)getRecord(requestTarget,pendingList);
            else readPage();
        }
        else if(target==handles.dialogCancel){modal=Modal::None;exitAfterSave=false;render();}
        else if(target==handles.dialogDiscard)discard();
        else if(target==handles.dialogSave){modal=Modal::None;save();}
        else if(target==handles.dialogDelete){modal=Modal::None;remove();}return;
    }
    if(target==handles.back||target==handles.pickerCancel){back();return;}
    if(page==Page::Lists)for(unsigned i=0;i<count;++i){
        if(target==handles.listEdit[i]){getRecord(records[i].id,true);return;}
        if(target==handles.listDelete[i]){draft=original=records[i];modal=Modal::Delete;render();return;}
        if(target==handles.rows[i]){int32_t position=0;if(host.get({handles.scroll},DT_PROPERTY_SCROLL_POSITION,position)==DT_OK)listsScroll=position;list=records[i];page=Page::Tasks;loaded=false;count=0;tasksScroll=0;readPage();return;}
    }
    if(page==Page::EditList)for(unsigned i=0;i<task_list::iconCount;++i)if(target==handles.iconChoices[i]){draft.icon=uint8_t(task_list::icons[i]);for(unsigned j=0;j<task_list::iconCount;++j){ui.set(handles.iconChoices[j],DT_PROPERTY_CHECKED,uint8_t(i==j));ui.set(handles.iconChoices[j],DT_PROPERTY_BUTTON_STYLE,uint32_t(i==j?DT_BUTTON_PRIMARY:DT_BUTTON_SECONDARY));}ui.present();return;}
    if(target==handles.add){beginEdit(page==Page::Lists);return;}
    if(target==handles.save){if(page==Page::Date){draft.due=picker.day;draft.dueMinute=picker.minute;page=Page::EditTask;render();}else save();return;}
    if(target==handles.remove){modal=Modal::Delete;render();return;}
    if(target==handles.title){keyboardOpen(1);return;}if(target==handles.notes){keyboardOpen(2);return;}
    if(target==handles.due){Record fallback;fallback.defaultDeadline(localNow());picker=dateTimePickerDefaults();picker.mode=DT_PICKER_DATE_TIME;picker.day=draft.due==noDate?fallback.due:draft.due;picker.minute=draft.dueMinute<0?fallback.dueMinute:draft.dueMinute;const bool en=!strncmp(locale,"en",2);copy(picker.date_label,sizeof(picker.date_label),en?"Date":"日期");copy(picker.time_label,sizeof(picker.time_label),en?"Time":!strcmp(locale,"zh-HK")?"時間":"时间");copy(picker.units[0],sizeof(picker.units[0]),en?"Y":"年");copy(picker.units[1],sizeof(picker.units[1]),en?"M":"月");copy(picker.units[2],sizeof(picker.units[2]),en?"D":"日");copy(picker.units[3],sizeof(picker.units[3]),en?"h":!strcmp(locale,"zh-HK")?"時":"时");copy(picker.units[4],sizeof(picker.units[4]),en?"min":"分");page=Page::Date;render();return;}
    if(target==handles.noDate){draft.due=noDate;draft.dueMinute=-1;page=Page::EditTask;render();return;}
    for(unsigned i=0;i<colors.size;++i)if(target==handles.color[i]){
        draft.color=colors.values[i];
        for(unsigned j=0;j<colors.size;++j)ui.set(handles.color[j],DT_PROPERTY_CHECKED,uint8_t(i==j));
        ui.present();return;
    }
    for(unsigned i=0;i<8&&windowStart+i<viewCount;++i)if(target==handles.rows[i]&&viewItems[windowStart+i].record<count){const unsigned index=viewItems[windowStart+i].record;int32_t position=0;if(host.get({handles.scroll},DT_PROPERTY_SCROLL_POSITION,position)==DT_OK)(page==Page::Lists?listsScroll:tasksScroll)=position;if(page==Page::Lists){list=records[index];page=Page::Tasks;loaded=false;count=0;tasksScroll=0;readPage();}else getRecord(records[index].id);return;}
}
dt_result Application::event(uint16_t kind,dt_bytes payload){
    if(kind==DT_EVENT_EXIT_REQUEST){back(true);return DT_OK;}
    if(kind==DT_EVENT_TICK){
        if(retryAt&&host.monotonicMs()>=retryAt)submit();
        if((page==Page::Lists||page==Page::Tasks)&&loaded&&count&&handles.scroll){int32_t scroll=0;if(host.get({handles.scroll},DT_PROPERTY_SCROLL_POSITION,scroll)==DT_OK){
            if(!writing()&&modal==Modal::None)(page==Page::Lists?listsScroll:tasksScroll)=scroll;
            if(page==Page::Lists&&!writing()&&modal==Modal::None&&windowStart!=firstListTile(count,listsScroll)){bindListWindow(firstListTile(count,listsScroll));ui.present();return DT_OK;}
            const auto now=localNow();bool changed=false;if(page==Page::Tasks&&!busy()&&modal==Modal::None){for(unsigned i=0;i<viewCount;++i)if(viewItems[i].record<count&&viewItems[i].group!=groupFor(records[viewItems[i].record],now)){changed=true;break;}if(changed){render();return DT_OK;}}
            unsigned first=0;while(first+1<viewCount&&viewItems[first+1].y<=scroll)++first;if(first)--first;first=std::min(first,viewCount>8?viewCount-8:0);
            if(page==Page::Tasks&&(first!=windowStart||(!busy()&&modal==Modal::None&&summaryMinute!=now/60))){summaryMinute=now/60;bindWindow(first);ui.present();}
        }}return DT_OK;
    }
    if(kind==DT_EVENT_LANGUAGE_CHANGED){refreshLocale();if(!keyboardRequest)render();return DT_OK;}
    if(kind==DT_EVENT_PERMISSION_RESULT&&payload.size==sizeof(dt_permission_result_event)){
        const auto &e=*reinterpret_cast<const dt_permission_result_event*>(payload.data);if(e.request==permissionRequest&&permissionRequest){permissionRequest=0;if(e.state==DT_PERMISSION_GRANTED)submit();else{operation=Operation::None;errorMessage(Text::Denied);}}return DT_OK;
    }
    if(kind==DT_EVENT_REQUEST_COMPLETE&&payload.size==sizeof(dt_request_complete_event)){const auto &e=*reinterpret_cast<const dt_request_complete_event*>(payload.data);if(e.request==keyboardRequest)keyboardFinish(e);else finish(e);return DT_OK;}
    if(kind==DT_EVENT_TEXT_CHANGED&&payload.size==sizeof(dt_component_event)&&keyboardRequest&&keyboardField==2){const auto target=reinterpret_cast<const dt_component_event*>(payload.data)->target;if(target==handles.notes){char live[513];if(host.getText({target},DT_PROPERTY_TEXT,live,sizeof(live))==DT_OK)copy(draft.notes,sizeof(draft.notes),live);}return DT_OK;}
    if(kind==DT_EVENT_DATE_TIME_CHANGED&&payload.size==sizeof(dt_date_time_event)){const auto &e=*reinterpret_cast<const dt_date_time_event*>(payload.data);if(page==Page::Date&&e.target==handles.picker&&e.day>=picker.minimum_day&&e.day<=picker.maximum_day&&e.minute>=0&&e.minute<1440){picker.day=e.day;picker.minute=e.minute;}return DT_OK;}
    if(kind==DT_EVENT_APP_MENU)return DT_OK;
    if(kind==DT_EVENT_VALUE_CHANGED&&payload.size==sizeof(dt_value_event)){
        const auto &e=*reinterpret_cast<const dt_value_event*>(payload.data);
        if(!writing()&&modal==Modal::None&&page==Page::Tasks)for(unsigned i=0;i<8&&windowStart+i<viewCount;++i)
            if(e.target==handles.checks[i]&&viewItems[windowStart+i].record<count){
                const auto index=viewItems[windowStart+i].record;
                if(!busy()||cancelRead())toggle(index);
                break;
            }
        return DT_OK;
    }
    if(kind==DT_EVENT_ACTIVATE&&payload.size==sizeof(dt_component_event))activate(reinterpret_cast<const dt_component_event*>(payload.data)->target);
    return ui.result;
}
}
