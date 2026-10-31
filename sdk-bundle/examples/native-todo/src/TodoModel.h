#pragma once
#include <desktile/json.hpp>
#include <desktile/date.hpp>
#include <desktile/task_list.hpp>
namespace todo {
inline constexpr int32_t noDate=INT32_MIN;
struct Record {
    uint64_t id=0,parent=0;
    uint32_t revision=0,color=0xff9900;
    bool completed=false;
    uint8_t icon=94;
    int32_t due=noDate;
    int dueMinute=-1;
    char title[193]{},notes[513]{};
    void defaultDeadline(int64_t localSeconds){
        const int64_t first=int64_t(desktile::sdk::civilDay({1900,1,1}))*86400;
        const int64_t last=int64_t(desktile::sdk::civilDay({2100,12,31}))*86400+86399;
        const int64_t bounded=localSeconds<first?first:localSeconds>last?last:localSeconds;
        const int64_t hour=bounded/3600-(bounded<0&&bounded%3600?1:0);
        const int64_t nextHour=(hour+1)*3600;
        const int64_t dueSeconds=localSeconds<first?first:nextHour>last?last:nextHour;
        due=int32_t(dueSeconds/86400-(dueSeconds<0&&dueSeconds%86400?1:0));
        dueMinute=int((dueSeconds-int64_t(due)*86400)/60);
    }
    bool same(const Record &other)const{return parent==other.parent&&color==other.color&&icon==other.icon&&completed==other.completed&&due==other.due&&dueMinute==other.dueMinute&&!strcmp(title,other.title)&&!strcmp(notes,other.notes);}
};
inline bool id(desktile::sdk::JsonView value,uint64_t &out){char text[21];if(!value.string(text,sizeof(text))||!text[0]||text[0]=='0')return false;out=0;for(const char *p=text;*p;p++){if(*p<'0'||*p>'9'||out>(UINT64_MAX-unsigned(*p-'0'))/10)return false;out=out*10+(*p-'0');}return true;}
inline bool parse(desktile::sdk::JsonView value,Record &record,bool list,bool notes=false){
    record=Record{};
    int64_t revision=0;if(!id(value.get("id"),record.id)||!value.get("revision").integer(revision)||revision<1||revision>UINT32_MAX||!value.get("title").string(record.title,sizeof(record.title)))return false;record.revision=uint32_t(revision);
    if(list){int64_t color=0,icon=94;if(!value.get("color").integer(color)||color<0||color>0xffffff)return false;record.color=uint32_t(color);if(value.get("icon")&&(!value.get("icon").integer(icon)||icon<0||icon>UINT8_MAX||!desktile::sdk::task_list::validIcon(uint32_t(icon))))return false;record.icon=uint8_t(icon);}
    else{if(!id(value.get("parent"),record.parent)||!value.get("completed").boolean(record.completed))return false;auto due=value.get("due_date");record.due=noDate;if(!due.null()){char text[11];desktile::sdk::CivilDate date;if(!due.string(text,sizeof(text))||!desktile::sdk::parseDate(text,date))return false;record.due=desktile::sdk::civilDay(date);}}
    const auto time=value.get("due_time");if(!list&&time&&!time.null()){char text[6];if(record.due==noDate||!time.string(text,sizeof(text))||strlen(text)!=5||text[2]!=':'||text[0]<'0'||text[0]>'2'||text[1]<'0'||text[1]>'9'||text[3]<'0'||text[3]>'5'||text[4]<'0'||text[4]>'9')return false;record.dueMinute=((text[0]-'0')*10+text[1]-'0')*60+(text[3]-'0')*10+text[4]-'0';if(record.dueMinute>=1440)return false;}
    return !notes||value.get("notes").string(record.notes,sizeof(record.notes));
}
inline void timeText(int minute,char (&out)[6]){out[0]=char('0'+minute/60/10);out[1]=char('0'+minute/60%10);out[2]=':';out[3]=char('0'+minute%60/10);out[4]=char('0'+minute%60%10);out[5]=0;}
inline bool titled(const Record &record){return strspn(record.title," \t\r\n")!=strlen(record.title);}
}
