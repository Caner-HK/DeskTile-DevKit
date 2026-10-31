#pragma once

namespace desktile {

struct Rect {
    int x, y, w, h;
    bool contains(int px, int py) const
    {
        return px >= x && py >= y && px < x + w && py < y + h;
    }
};

}  // namespace desktile
