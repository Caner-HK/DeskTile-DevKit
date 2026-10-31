#pragma once

#include "config_state.hpp"
#include "save_state.hpp"

namespace desktile::sdk {

// Single-owner application settings with immutable worker snapshots and
// revision-aware persistence scheduling.
template<class T> class SettingsState : public ConfigState<T> {
public:
    T snapshot() const { return this->get(); }
    void requestSave(uint32_t now, uint32_t delay) { save_.request(now, delay); }
    SaveState &saveState() { return save_; }
    const SaveState &saveState() const { return save_; }

private:
    SaveState save_;
};

}  // namespace desktile::sdk
