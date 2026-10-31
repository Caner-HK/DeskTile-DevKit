#pragma once
#include <cstdint>
namespace desktile::sdk::task_list {
inline constexpr uint32_t icons[]{94,105,106,5,107,64,108,26,
    13,112,111,113,114,115,118,120,
    109,110,116,117,119,63,54,34};
inline constexpr unsigned iconCount=sizeof(icons)/sizeof(icons[0]);
inline bool validIcon(uint32_t icon){
    for(auto value:icons)if(icon==value)return true;
    // Existing records retain their selected artwork; these are not picker choices.
    constexpr uint32_t storedIcons[]{28,65,66,16,27,44,56,59,61,62,76,36,49,71,96,91};
    for(auto value:storedIcons)if(icon==value)return true;
    return false;
}
inline uint32_t iconOrDefault(uint32_t icon){return validIcon(icon)?icon:icons[0];}
}
