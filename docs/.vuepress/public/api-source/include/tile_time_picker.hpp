#pragma once
#include "tile_time_model.hpp"
#include "geometry.hpp"
#include "date.hpp"
#include <algorithm>
#include <cstring>
#include <cstdio>
#include <limits>
namespace desktile::sdk {
inline Rect mergeTileDamage(Rect a,Rect b){
    if(a.w<=0||a.h<=0)return b;
    if(b.w<=0||b.h<=0)return a;
    const int x=std::min(a.x,b.x),y=std::min(a.y,b.y);
    return {x,y,std::max(a.x+a.w,b.x+b.w)-x,std::max(a.y+a.h,b.y+b.h)-y};
}
struct TilePickerCornerText {
    bool visible=false;
    char columns[3][12]{};
    // Copy the caller's strings; reject oversized text instead of truncating UTF-8.
    bool set(int column,const char *text){
        if(column<0||column>=3)return false;
        if(!text)text="";
        size_t size=0;while(size<sizeof(columns[0])&&text[size])++size;
        if(size==sizeof(columns[0]))return false;
        std::memcpy(columns[column],text,size+1);return true;
    }
};
struct TilePickerPairLayout {
    Rect first{},second{},separator{};
    static TilePickerPairLayout resolve(Rect area,int firstColumns,int secondColumns,int side=96){
        const int gap=48,inner=side==112?10:8;
        const int firstWidth=firstColumns?firstColumns*side+(firstColumns-1)*inner:0;
        const int secondWidth=secondColumns?secondColumns*side+(secondColumns-1)*inner:0;
        const int between=firstColumns&&secondColumns?gap:0;
        const int x=area.x+(area.w-firstWidth-secondWidth-between)/2,y=area.y+12,h=std::max(0,area.h-24);
        TilePickerPairLayout result;
        if(firstColumns)result.first={x,y,firstWidth,h};
        if(secondColumns)result.second={x+firstWidth+between,y,secondWidth,h};
        if(between)result.separator={x+firstWidth+gap/2,area.y+(area.h-side)/2,1,side};
        return result;
    }
};
// Allocation-free tile selector. Call update from the frame clock.
struct TileTimePicker {
    timepicker::Picker model{};
    Rect bounds{};
    int side=96,pitch=104;
    int minuteStep=1,minuteRemainder=0;
    bool initialized=false,dateMode=false,durationMode=false,numberMode=false;
    int minimumNumber=0,maximumNumber=0;
    int minimumSeconds=0,maximumSeconds=359999;
    int minimumDay=0,maximumDay=0,firstYear=1900;
    TilePickerCornerText cornerText{};
    void setStandardCornerText(bool english=false,bool traditional=false){
        const char *dateUnits[]{"年","月","日"},*englishDate[]{"Y","M","D"};
        const char *timeUnits[]{traditional?"時":"时","分",durationMode?"秒":""};
        const char *englishTime[]{"h","min",durationMode?"sec":""};
        const auto units=dateMode?(english?englishDate:dateUnits):(english?englishTime:timeUnits);
        cornerText.visible=true;
        for(int i=0;i<3;++i)cornerText.set(i,units[i]);
    }
    struct VisualState {struct Column {int value,count;float offset,reveal;};Column columns[3];};
    VisualState visualState()const{
        VisualState state{};
        for(int i=0;i<model.count();++i){const auto &c=model.columns[i];state.columns[i]={c.value,c.count,c.offset,c.reveal};}
        return state;
    }
    Rect damageSince(const VisualState &before)const{
        Rect damage{};
        for(int i=0;i<model.count();++i){const auto &a=before.columns[i];const auto &b=model.columns[i];
            if(a.value!=b.value||a.count!=b.count||a.offset!=b.offset||a.reveal!=b.reveal)
                damage=mergeTileDamage(damage,{left(i),bounds.y,side,bounds.h});
        }
        return damage;
    }
    void reset(int minute,bool twelve=false,int step=1){
        dateMode=durationMode=numberMode=false;
        minuteStep=std::clamp(step,1,60);minuteRemainder=minute%60%minuteStep;
        model.reset(minute,twelve);model.columns[1].value=(minute%60)/minuteStep;
        model.columns[1].count=(59-minuteRemainder)/minuteStep+1;initialized=true;
    }
    void sync(int minute,bool twelve=false,int step=1){
        if(!initialized||dateMode||durationMode||numberMode||this->minute()!=minute||model.twelve!=twelve||minuteStep!=step)reset(minute,twelve,step);
    }
    void resetDate(int day,int minimum,int maximum){
        dateMode=true;durationMode=numberMode=false;minimumDay=minimum;maximumDay=maximum;firstYear=dateFromDay(minimum).year;
        const auto d=dateFromDay(std::clamp(day,minimum,maximum));
        model.reset(0,true);
        model.columns[0].count=dateFromDay(maximum).year-firstYear+1;
        model.columns[0].value=d.year-firstYear;model.columns[0].bounded=true;
        model.columns[1].count=12;model.columns[1].value=d.month-1;
        model.columns[2].bounded=false;model.columns[2].count=monthDays(d.year,d.month);
        model.columns[2].value=d.day-1;initialized=true;
    }
    int day()const{return civilDay({firstYear+model.columns[0].value,model.columns[1].value+1,model.columns[2].value+1});}
    void normalizeDate(){
        if(!dateMode)return;
        auto &days=model.columns[2];
        const int count=monthDays(firstYear+model.columns[0].value,model.columns[1].value+1);
        if(days.count!=count){
            days.count=count;
            if(days.value>=count){days.value=count-1;days.offset=0;days.stop();}
        }
        const int current=day(),limited=std::clamp(current,minimumDay,maximumDay);
        if(current!=limited){
            const auto d=dateFromDay(limited);
            const int values[]{d.year-firstYear,d.month-1,d.day-1};
            for(int i=0;i<3;++i){model.columns[i].value=values[i];model.columns[i].offset=0;model.columns[i].stop();}
            days.count=monthDays(d.year,d.month);
        }
    }
    void syncDate(int day,int minimum,int maximum){
        if(!initialized||!dateMode||this->day()!=day||minimumDay!=minimum||maximumDay!=maximum)resetDate(day,minimum,maximum);
    }
    void resetDuration(int seconds,int minimum=0,int maximum=359999){
        dateMode=numberMode=false;durationMode=true;
        maximumSeconds=std::clamp(maximum,0,359999);minimumSeconds=std::clamp(minimum,0,maximumSeconds);
        seconds=std::clamp(seconds,minimumSeconds,maximumSeconds);
        model.reset(0,true);
        const int values[]{seconds/3600,seconds/60%60,seconds%60};
        for(int i=0;i<3;++i){auto &c=model.columns[i];c.value=values[i];c.count=i?60:maximumSeconds/3600+1;c.bounded=false;}
        initialized=true;
    }
    void resetNumber(int value,int minimum,int maximum){
        dateMode=durationMode=false;numberMode=true;model.reset(0,false);model.columnCount=1;
        minimumNumber=minimum;
        const int64_t span=std::max<int64_t>(1,int64_t(maximum)-minimum+1);
        auto &column=model.columns[0];column.count=int(std::min<int64_t>(span,std::numeric_limits<int>::max()));
        maximumNumber=int(int64_t(minimum)+column.count-1);
        column.value=int(int64_t(std::clamp(value,minimumNumber,maximumNumber))-minimumNumber);
        column.bounded=true;cornerText={};initialized=true;
    }
    int number()const{return int(int64_t(minimumNumber)+model.columns[0].value);}
    int seconds()const{return model.columns[0].value*3600+model.columns[1].value*60+model.columns[2].value;}
    void syncDuration(int value,int minimum=0,int maximum=359999){
        maximum=std::clamp(maximum,0,359999);minimum=std::clamp(minimum,0,maximum);
        value=std::clamp(value,minimum,maximum);
        if(!initialized||!durationMode||seconds()!=value||minimumSeconds!=minimum||maximumSeconds!=maximum)resetDuration(value,minimum,maximum);
    }
    void normalize(){
        normalizeDate();
        if(!durationMode)return;
        const int limited=std::clamp(seconds(),minimumSeconds,maximumSeconds);
        if(limited!=seconds()){
            const int values[]{limited/3600,limited/60%60,limited%60};
            for(int i=0;i<3;++i){auto &c=model.columns[i];c.value=values[i];c.offset=0;c.stop();}
        }
    }
    void place(Rect area,int tileSize=96){bounds=area;side=tileSize;pitch=side+(side==112?10:8);}
    int left(int col)const{return bounds.x+(bounds.w-model.count()*side-(model.count()-1)*(pitch-side))/2+col*pitch;}
    int center()const{return bounds.y+bounds.h/2;}
    int localX(int x)const{
        for(int i=0;i<model.count();++i)if(x>=left(i)&&x<left(i)+side)return model.left(i)+(x-left(i))*112/side;
        return -1;
    }
    int localY(int y)const{return timepicker::Picker::center+timepicker::nearest(float(y-center())*122/pitch);}
    bool pointer(int phase,int x,int y,uint64_t now){
        if(phase==0){
            if(!bounds.contains(x,y))return false;
            model.tick(now);normalize();return model.down(localX(x),localY(y),now);
        }
        if(!model.pointer)return false;
        if(phase==1)model.move(localX(x),localY(y),now);
        else model.up(localX(x),localY(y),now,phase==3);
        normalize();
        return true;
    }
    bool update(uint64_t now){if(!initialized)return false;const bool dirty=model.tick(now);normalize();return dirty;}
    void settle(){model.settle();normalize();}
    int minute()const{return model.columns[0].value*60+model.columns[1].value*minuteStep+minuteRemainder+(model.twelve?model.columns[2].value*720:0);}
    bool active()const{return model.pointer;}
};
inline uint32_t tileBlend(uint32_t from,uint32_t to,float amount){
    uint32_t result=0;amount=std::clamp(amount,0.0f,1.0f);
    for(int s=0;s<=16;s+=8){int a=(from>>s)&255,b=(to>>s)&255;result|=uint32_t(a+int((b-a)*amount))<<s;}return result;
}
template<class Target>
void paintTileTimePicker(Target &target,const TileTimePicker &picker,uint32_t background,uint32_t secondary,uint32_t accent,
                         Rect clip={0,0,800,480}){
    const auto &p=picker.model;
    const int clipLeft=std::max(clip.x,picker.bounds.x),clipRight=std::min(clip.x+clip.w,picker.bounds.x+picker.bounds.w);
    const int clipTop=std::max(clip.y,picker.bounds.y),clipBottom=std::min(clip.y+clip.h,picker.bounds.y+picker.bounds.h);
    if(clipRight<=clipLeft||clipBottom<=clipTop)return;
    const int font=picker.side==112?48:32,inset=picker.side==112?8:6;
    for(int col=0;col<p.count();++col){
        const int left=picker.left(col);
        if(left+picker.side<=clipLeft||left>=clipRight)continue;
        const auto &c=p.columns[col];
        // Fit/measure once per visible column, shared by all its moving tiles.
        char corner[12]{};int cornerWidth=0;
        if(picker.cornerText.visible){
            std::memcpy(corner,picker.cornerText.columns[col],sizeof(corner));
            int used=int(std::strlen(corner));
            if(used)cornerWidth=target.textWidth(corner,20);
            while(cornerWidth>picker.side-2*inset&&used>0){
                --used;
                while(used>0&&(static_cast<unsigned char>(corner[used])&0xc0)==0x80)--used;
                corner[used]=0;
                cornerWidth=used?target.textWidth(corner,20):0;
            }
        }
        const int first=c.reveal>0?-3:0,last=c.reveal>0?3:0;
        for(int row=first;row<=last;++row){
            if(c.bounded&&(c.value+row<0||c.value+row>=c.count))continue;
            const float distance=row*122.0f+c.offset;
            const int y=picker.center()-picker.side/2+timepicker::nearest(distance*picker.pitch/122);
            if(y+picker.side<=clipTop||y>=clipBottom)continue;
            const float selected=std::max(0.0f,1-timepicker::absf(distance)/61);
            const float visibility=row==0?1:c.reveal;
            if(visibility<=0)continue;
            const Rect tile{left,y,picker.side,picker.side};
            const auto outline=tileBlend(background,secondary,visibility);
            if(selected>0)target.fill(tile,tileBlend(background,accent,selected));
            else target.stroke(tile,outline,2);
            char text[16]{};
            const int value=timepicker::wrap(c.value+row,c.count);
            if(picker.numberMode)std::snprintf(text,sizeof(text),"%d",int(int64_t(picker.minimumNumber)+value));
            else if(picker.dateMode){
                const int shown=col==0?picker.firstYear+value:value+1;
                if(col==0){text[0]=char('0'+shown/1000);text[1]=char('0'+shown/100%10);text[2]=char('0'+shown/10%10);text[3]=char('0'+shown%10);}
                else{text[0]=char('0'+shown/10);text[1]=char('0'+shown%10);}
            }
            else if(picker.durationMode){text[0]=char('0'+value/10);text[1]=char('0'+value%10);}
            else if(col==2){text[0]=value?'P':'A';text[1]='M';}
            else{
                const int shown=col==1?value*picker.minuteStep+picker.minuteRemainder:col==0&&p.twelve?(value?value:12):value;
                if(col==1||shown>=10){text[0]=char('0'+shown/10);text[1]=char('0'+shown%10);}
                else text[0]=char('0'+shown);
            }
            target.text({tile.x+inset,tile.y+tile.h-inset-font-8,tile.w-2*inset,font+8},text,
                        tileBlend(outline,0xffffff,selected),font,400);
            if(cornerWidth)target.text({tile.x+tile.w-inset-cornerWidth,tile.y+inset,cornerWidth,20},corner,
                                     tileBlend(outline,0xffffff,selected),20,400);
        }
    }
}
}
