#pragma once
#include <cstring>
namespace desktile::sdk {
// Canonical UUIDs also make 16/32-bit Bluetooth aliases compare consistently.
inline bool bluetoothUuid(const char *input,char (&output)[37]){
    output[0]=0;if(!input)return false;
    const size_t length=std::strlen(input);if(length!=4&&length!=8&&length!=36)return false;
    char value[37]="00000000-0000-1000-8000-00805f9b34fb";
    for(size_t i=0;i<length;++i){char c=input[i];
        if(length==36&&(i==8||i==13||i==18||i==23)){if(c!='-')return false;value[i]=c;continue;}
        if(c>='A'&&c<='F')c=char(c-'A'+'a');
        if(!((c>='0'&&c<='9')||(c>='a'&&c<='f')))return false;
        value[length==4?i+4:i]=c;
    }
    std::memcpy(output,value,sizeof(value));return true;
}
}
