#pragma once

namespace desktile::sdk {

// An application edits a draft and publishes the complete value only after
// validation. Readers never observe a partially updated configuration.
template<class T> class ConfigState {
public:
    const T &get() const { return value_; }
    T &edit() { return value_; }

    template<class Validator> bool commit(const T &candidate, Validator validate)
    {
        if (!validate(candidate)) return false;
        value_ = candidate;
        return true;
    }

private:
    T value_{};
};

}  // namespace desktile::sdk
