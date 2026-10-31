#pragma once
#include <cstddef>
namespace desktile::sdk {
struct AdaptiveChoice {
    size_t count;
    constexpr bool opensPicker() const{return count>=4;}
    constexpr size_t next(size_t selected) const{return count?(selected+1)%count:0;}
    constexpr bool valid(size_t selected) const{return selected<count;}
};
}
