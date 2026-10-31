#pragma once
#include <cstdint>
#include <cstring>

namespace desktile::sdk {
class SplashPolicy {
public:
    static constexpr uint32_t slowLaunchMs=200;
    bool shouldShow(const char *id,uint32_t version,bool required=false)const{
        if(!id||!id[0])return false;
        if(required)return true;
        for(const auto &sample:samples_)if(sample.valid&&sample.version==version&&!std::strcmp(sample.id,id))
            return sample.duration>=slowLaunchMs;
        return true;
    }
    void record(const char *id,uint32_t version,uint32_t duration){
        if(!id||!id[0]||std::strlen(id)>96)return;
        Sample *entry=nullptr;
        for(auto &sample:samples_)if(sample.valid&&!std::strcmp(sample.id,id)){entry=&sample;break;}
        if(!entry)entry=&samples_[next_++%8];
        std::strcpy(entry->id,id);entry->version=version;entry->duration=duration;entry->valid=true;
    }
private:
    struct Sample {char id[97]{};bool valid=false;uint32_t version=0,duration=0;};
    Sample samples_[8]{};uint32_t next_=0;
};
}
