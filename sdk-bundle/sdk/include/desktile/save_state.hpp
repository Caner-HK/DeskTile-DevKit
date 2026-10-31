#pragma once

#include <cstdint>

namespace desktile::sdk {

// Tracks coalesced asynchronous saves without retaining a second copy of the
// application record. Revisions prevent stale worker completions from
// overwriting newer state.
class SaveState {
public:
    void request(uint32_t now, uint32_t delay)
    { ++revision_; pending_ = true; due_ = now + delay; }
    bool pending() const { return pending_; }
    bool due(uint32_t now) const
    { return pending_ && static_cast<int32_t>(now - due_) >= 0; }
    uint64_t revision() const { return revision_; }
    uint64_t persistedRevision() const { return persisted_; }
    void queued(uint64_t revision)
    { if (revision == revision_) pending_ = false; }
    void complete(uint64_t revision, bool success, uint32_t now, uint32_t retryDelay)
    {
        if (success) {
            if (revision > persisted_) persisted_ = revision;
            return;
        }
        if (revision < persisted_) return;
        if (!pending_) { pending_ = true; due_ = now + retryDelay; }
    }

private:
    uint64_t revision_ = 0;
    uint64_t persisted_ = 0;
    uint32_t due_ = 0;
    bool pending_ = false;
};

}  // namespace desktile::sdk
