#pragma once
#include <cstddef>
namespace desktile::sdk::text_limits {
inline constexpr size_t keyboardBytes=8*1024;
inline constexpr size_t fileEditBytes=keyboardBytes;
inline constexpr size_t fileReadBytes=16*1024;
inline constexpr size_t keyboardOptionsBytes=6*keyboardBytes+2048;
}
