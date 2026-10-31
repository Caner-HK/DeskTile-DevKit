#pragma once

#include "sdk.hpp"
#include "geometry.hpp"
#include <cstddef>
#include <cstdint>
#include <string>

namespace desktile::sdk {

// Lifecycle shared by firmware-built system applications. The application
// receives the same public SDK host/context pair as every other Native app.
// Specialised render accelerators are separate from this lifecycle boundary.
struct SystemFrame {
    uint32_t now = 0;
    bool visible = true;
    bool buildingFrame = false;
};

enum class SystemTouchKind : uint8_t { Tap, PointerDown, PointerMove, PointerUp, PointerCancel };
struct SystemTouch {
    SystemTouchKind kind = SystemTouchKind::Tap;
    int x = 0;
    int y = 0;
    uint32_t now = 0;
};

struct SystemResourceUsage {
    size_t residentBytes = 0;
    size_t retainedBytes = 0;
};

struct SystemScrollView {
    Rect viewport{};
    int *offset = nullptr;
    int contentHeight = 0;
    uint32_t revision = 0;
    bool cacheable = true;
    // Optional resident raster band in global content coordinates. Zero height
    // preserves full-list caching. Logical scroll bounds remain contentHeight.
    int cacheOrigin = 0;
    int cacheHeight = 0;
    bool valid() const {return offset && viewport.w>0 && viewport.h>0 && contentHeight>=viewport.h;}
};

// Synchronous system-native network capability used by firmware-built apps
// whose existing worker owns parsing and retry state. The Shell supplies a
// caller-scoped implementation, so the application never receives Wi-Fi,
// HTTP-client or permission-broker objects.
class SystemNetwork {
public:
    virtual ~SystemNetwork() = default;
    virtual bool available() const = 0;
    virtual int get(const char *url, std::string &body) = 0;
    virtual uint64_t monotonicMs() const = 0;
    virtual uint64_t monotonicSeconds() const = 0;
    virtual void delayMs(uint32_t milliseconds) = 0;
};

class SystemApplication {
public:
    virtual ~SystemApplication() = default;
    virtual void attach(Host host) { host_ = host; }
    virtual void enter() = 0;
    virtual void leave() = 0;
    virtual void suspend() {}
    virtual void resume() {}
    virtual void themeChanged() {}
    virtual void memoryPressure() {}
    virtual void event(dt_ui_event, dt_bytes) {}
    virtual Rect controlAt(int, int) const { return {}; }
    virtual bool update(const SystemFrame &) = 0;
    virtual void render() = 0;
    virtual void touch(const SystemTouch &) = 0;
    virtual bool pointer(const SystemTouch &) {return false;}
    virtual SystemResourceUsage resources() const = 0;
    virtual void useSystemScrolling() {}
    virtual SystemScrollView scrollView() const {return {};}
    virtual bool longPress(const SystemTouch &) {return false;}
    // Called on the UI thread after successful package-data erasure, while
    // the application is closed and its pending writes have been drained.
    // Persistent instances reset in-memory preferences here; defaults are
    // normally reloaded by enter(). Filesystem erasure belongs to the host.
    virtual void resetAfterDataClear() { memoryPressure(); }
    // Called while closed, after submitted storage work has completed.
    // Cancel deferred writes before the host removes this package's data.
    virtual void prepareDataClear(bool) { memoryPressure(); }

protected:
    Host &sdkHost() { return host_; }
    const Host &sdkHost() const { return host_; }

private:
    Host host_{};
};

}  // namespace desktile::sdk
