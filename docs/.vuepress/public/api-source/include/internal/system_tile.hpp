#pragma once
#include "system_ui.hpp"
namespace desktile::sdk {class SystemApplication;}
namespace desktile::sdk::internal {
// The shell owns placement, clipping, normal/pressed backgrounds and input.
// A complete-tile renderer owns all content, including its title.
struct SystemTile {
    SystemUiHost &host;
    Rect bounds;
    uint16_t background,foreground;
    const char *title;
    void *iconContext;
    void (*drawIcon)(void *,Rect);
    const char *appearance="";
    bool pressed=false;
    SystemApplication *application=nullptr;
};
using SystemTilePainter=void (*)(const SystemTile &);
}
