#include "TodoController.h"
using namespace desktile::sample;
using namespace desktile::sdk;
namespace todo {
namespace {
struct Line {
    char *out; size_t capacity,used=0;
    Line(char *target,size_t size):out(target),capacity(size){if(capacity)out[0]=0;}
    bool append(const char *text,size_t size){if(!capacity||used+size>=capacity)return false;memcpy(out+used,text,size);used+=size;out[used]=0;return true;}
    bool append(const char *text){return append(text,strlen(text));}
    void quantity(uint64_t value,const char *unit){char digits[21];number(digits,sizeof(digits),value);append(digits);append(unit);}
};
void duration(Line &line,int64_t seconds,const char *locale){
    const bool en=!strncmp(locale,"en",2),hk=!strcmp(locale,"zh-HK");
    const bool overdue=seconds<0;
    line.append(en?(overdue?"Overdue by ":"Due in "):hk?(overdue?"逾時 ":"剩餘 "):(overdue?"逾时 ":"剩余 "));
    const uint64_t magnitude=uint64_t(overdue?-seconds:seconds);
    if(magnitude<60){line.append(en?"less than 1m":hk?"不足 1 分鐘":"不足 1 分钟");return;}
    const uint64_t minutes=magnitude/60,days=minutes/1440,hours=minutes/60%24,rest=minutes%60;
    if(days){line.quantity(days,en?"d":" 天");if(hours){line.append(" ");line.quantity(hours,en?"h":hk?" 小時":" 小时");}}
    else{if(hours){line.quantity(hours,en?"h":hk?" 小時":" 小时");if(rest)line.append(" ");}if(rest||!hours)line.quantity(rest,en?"m":hk?" 分鐘":" 分钟");}
}
}
int64_t Application::localNow()const{
    dt_locale_info_v1 info{};const int offset=host.localeInfo(info)==DT_OK?info.utc_offset_minutes:0;
    return host.wallClockSeconds()+int64_t(offset)*60;
}
int64_t Application::remaining(const Record &record)const{
    return int64_t(record.due)*86400+(record.dueMinute<0?86399:int64_t(record.dueMinute)*60)-localNow();
}
unsigned Application::groupFor(const Record &record)const{
    return groupFor(record,localNow());
}
unsigned Application::groupFor(const Record &record,int64_t now)const{
    if(record.completed)return 2;
    const auto deadline=int64_t(record.due)*86400+(record.dueMinute<0?86399:int64_t(record.dueMinute)*60);
    return record.due!=noDate&&deadline<now?0:1;
}
void Application::groupRecords(){
    const auto now=localNow();viewCount=0;viewHeight=0;summaryMinute=now/60;
    if(page==Page::Lists){for(unsigned i=0;i<count;++i){viewItems[viewCount++]={i,0,viewHeight,76};viewHeight+=76;}return;}
    for(unsigned group=0;group<3;++group){bool added=false;for(unsigned i=0;i<count;++i)if(groupFor(records[i],now)==group){
        if(!added){viewItems[viewCount++]={UINT32_MAX,group,viewHeight,40};viewHeight+=40;added=true;}
        viewItems[viewCount++]={i,group,viewHeight,76};viewHeight+=76;
    }}
}
void Application::timeSummary(const Record &record,char *out,size_t capacity)const{
    Line line(out,capacity);
    if(!record.completed&&record.due!=noDate)duration(line,remaining(record),locale);
}
void Application::noteSummary(const Record &record,char *out,size_t capacity)const{
    Line line(out,capacity);
    const char *at=record.notes,*end=at+strlen(at);bool hasNote=false,space=false;
    while(at<end){const char *begin=at;uint32_t cp=0;if(!json_detail::utf8(at,end,cp))break;
        if(cp==' '||cp=='\t'||cp=='\r'||cp=='\n'||cp==0xa0||cp==0x3000){space=hasNote;continue;}
        if(!hasNote)hasNote=true;else if(space)line.append(" ");
        space=false;if(!line.append(begin,size_t(at-begin)))break;
    }
}
void Application::summary(const Record &record,char *out,size_t capacity)const{
    char time[128],note[513];timeSummary(record,time,sizeof(time));noteSummary(record,note,sizeof(note));Line line(out,capacity);line.append(time);if(time[0]&&note[0])line.append("    ");line.append(note);
}
}
