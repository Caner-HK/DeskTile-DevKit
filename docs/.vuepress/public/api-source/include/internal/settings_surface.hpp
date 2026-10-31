#pragma once

namespace desktile::sdk::internal {

// Settings is a privileged system application. Its visual lifecycle is owned
// by the App Manager while protected system mutations remain implemented by
// the Shell behind this internal SDK port.
class SettingsSurface {
public:
    virtual ~SettingsSurface() = default;
    virtual void renderSettingsApplication() = 0;
    virtual void touchSettingsApplication(int x, int y) = 0;
    virtual void leaveSettingsApplication() = 0;
};

}  // namespace desktile::sdk::internal
