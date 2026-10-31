#pragma once

#include "../geometry.hpp"
#include "user_file.hpp"
#include <cstdint>

namespace desktile {
class Canvas;
enum class Screen : uint8_t;
enum class DragMode : uint8_t;
namespace ui_icons { enum class Id : uint8_t; }

namespace sdk::internal {
struct EmbeddedDocumentView {const char *text="";size_t cursor=0;int scroll=0;bool caret=false;};

// Trusted firmware-built applications may use the accelerated native Canvas
// through this single internal SDK boundary. Storage, resources, permissions,
// network and device services remain on the public caller-scoped SDK Host.
class SystemUiHost {
public:
    virtual ~SystemUiHost() = default;
    virtual Canvas &canvas() = 0;
    virtual Screen activeScreen() const = 0;
    virtual bool appMenuVisible() const = 0;
    virtual bool networkConnected() const = 0;
    virtual bool use24HourClock() const = 0;
    virtual bool calendarLunarEnabled() const { return false; }
    virtual uint32_t displayVsync() const = 0;
    virtual void switchScreen(Screen) = 0;
    virtual int scrollLimit(DragMode) const = 0;
    virtual bool listScrolling() const { return false; }
    virtual void invalidate(const Rect &bounds = {0,0,800,480}) = 0;
    virtual void clearDamage() = 0;
    virtual bool isPressed(const Rect &) const = 0;
    virtual bool pointerHeld(const Rect &bounds) const { return isPressed(bounds); }
    virtual void drawUiIcon(ui_icons::Id,const Rect &,uint16_t) = 0;
    virtual void drawScrollBar(const Rect &,int,int) = 0;
    virtual void drawSettingsHeader(const char *,ui_icons::Id) = 0;
    virtual void drawSwitch(const Rect &,bool,uint16_t) = 0;
    virtual void fillAntialiasedCapsule(const Rect &,uint16_t,uint16_t) = 0;
    virtual void fillAntialiasedCircle(int,int,int,uint16_t,uint16_t) = 0;
    virtual bool openAppInstaller(const char *) {return false;}
    virtual dt_result submitUserFile(dt_app_context,UserFileCommand,const char *,const char *,const uint8_t *) {return DT_ERR_NOT_SUPPORTED;}
    virtual bool takeUserFile(dt_app_context,UserFileResult &) {return false;}
    virtual void cancelUserFile(dt_app_context) {}
    virtual dt_result requestPackageIcon(dt_app_context,const char *) {return DT_ERR_NOT_SUPPORTED;}
    virtual bool takePackageIcon(dt_app_context,PackageIconResult &) {return false;}
    virtual void cancelPackageIcon(dt_app_context) {}
    virtual dt_result requestUserImage(dt_app_context,const char *,uint16_t) {return DT_ERR_NOT_SUPPORTED;}
    virtual bool takeUserImage(dt_app_context,UserImageResult &) {return false;}
    virtual void cancelUserImage(dt_app_context) {}
    virtual bool drawPackageIcon(dt_app_context,const PackageIconResult &,const Rect &) {return false;}
    virtual bool embeddedDocument(dt_app_context,EmbeddedDocumentView &) const {return false;}
};

}  // namespace sdk::internal
}  // namespace desktile
