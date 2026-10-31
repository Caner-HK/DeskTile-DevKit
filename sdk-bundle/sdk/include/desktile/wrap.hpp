#pragma once
#include <cstdint>
namespace desktile::sdk {
struct WrapState { const char *next=nullptr; bool trailingBlank=false; const char *end=nullptr; };
struct WrappedLine { const char *begin=nullptr,*end=nullptr; int width=0; };
inline bool ideograph(uint32_t cp){return (cp>=0x2e80&&cp<=0x9fff)||(cp>=0xac00&&cp<=0xd7af)||(cp>=0x20000&&cp<=0x323ff);}
inline bool closingPunctuation(uint32_t cp){return cp==0x3002||cp==0x3001||cp==0xff0c||cp==0xff1b||cp==0xff1a||cp==0xff01||cp==0xff1f||cp==0xff09||cp==0x300d||cp==0x3011;}
template<class Decode,class Advance>
bool nextWrappedLine(WrapState &state,int limit,Decode decode,Advance advance,WrappedLine &line){
    if(!state.next||limit<=0)return false;
    const auto ended=[&](const char *value){return state.end?value>=state.end:!*value;};
    const auto skipSpaces=[&](const char *&value){while(!ended(value)&&(*value==' '||*value=='\t'))++value;};
    const char *begin=state.next;
    if(ended(begin)){if(!state.trailingBlank)return false;state.trailingBlank=false;line={begin,begin,0};return true;}
    const char *scan=begin,*breakEnd=nullptr,*afterBreak=nullptr,*previous=begin;
    int used=0,breakWidth=0,previousWidth=0;
    while(!ended(scan)){
        const char *start=scan;const auto cp=decode(scan);
        if(cp=='\n'){line={begin,start,used};state.next=scan;state.trailingBlank=ended(scan);return true;}
        const int width=advance(cp);
        if(used&&used+width>limit){
            if(cp==' '||cp=='\t'){line={begin,start,used};state.next=scan;skipSpaces(state.next);return true;}
            if(closingPunctuation(cp)&&previous>begin){line={begin,previous,previousWidth};state.next=previous;return true;}
            if(breakEnd&&breakEnd>begin){line={begin,breakEnd,breakWidth};state.next=afterBreak;skipSpaces(state.next);return true;}
            line={begin,start,used};state.next=start;return true;
        }
        previous=start;previousWidth=used;used+=width;
        if(cp==' '||cp=='\t'){
            breakEnd=start;afterBreak=scan;breakWidth=previousWidth;
        }else if(cp=='-'||ideograph(cp)||closingPunctuation(cp)){
            breakEnd=scan;afterBreak=scan;breakWidth=used;
        }
    }
    line={begin,scan,used};state.next=scan;return true;
}
}
