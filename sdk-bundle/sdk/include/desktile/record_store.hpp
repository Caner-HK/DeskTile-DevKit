#pragma once

#include "sdk.hpp"
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <type_traits>

namespace desktile::sdk {

// Fixed-size, application-private record storage. The host owns path isolation,
// atomic replacement and the previous verified copy; this layer owns the
// record type/version check so firmware-built apps do not touch the filesystem.
template<class T> class RecordStore {
    static_assert(std::is_trivially_copyable<T>::value,
                  "Persistent SDK records require value types");
    static_assert(sizeof(T) <= UINT16_MAX,
                  "Persistent SDK records must fit the versioned record header");
    struct Record {
        uint32_t magic;
        uint16_t version;
        uint16_t bytes;
        T value;
        uint32_t crc;
    };

public:
    using Validator = bool (*)(const T &);

    bool bind(Host &host, const char *key, Validator validator)
    {
        host_ = &host;
        validator_ = validator;
        key_[0] = 0;
        if (!host || !key || !*key || std::strlen(key) >= sizeof(key_)) return false;
        for (const char *cursor = key; *cursor; ++cursor)
            if (!( (*cursor >= 'a' && *cursor <= 'z') ||
                   (*cursor >= '0' && *cursor <= '9') || *cursor == '_' || *cursor == '-'))
                return false;
        std::memcpy(key_, key, std::strlen(key) + 1);
        return true;
    }

    bool load(T &value) const
    {
        if (!ready()) return false;
        Record record{};
        dt_mutable_bytes bytes{reinterpret_cast<uint8_t *>(&record), sizeof(record), 0};
        if (host_->storageRead(key_, bytes) != DT_OK || bytes.size != sizeof(record) ||
            record.magic != kMagic || record.version != kVersion || record.bytes != sizeof(T) ||
            record.crc != checksum(record) || !validator_(record.value)) return false;
        value = record.value;
        return true;
    }

    bool save(const T &value) const
    {
        if (!ready() || !validator_(value)) return false;
        Record record{kMagic, kVersion, static_cast<uint16_t>(sizeof(T)), value, 0};
        record.crc = checksum(record);
        return host_->storageWrite(key_,
            {reinterpret_cast<const uint8_t *>(&record), sizeof(record)}) == DT_OK;
    }

    bool clear() const
    {
        if (!ready()) return false;
        const dt_result result = host_->storageRemove(key_);
        return result == DT_OK || result == DT_ERR_NOT_FOUND;
    }

private:
    static constexpr uint32_t kMagic = 0x44545352U; // DTSR
    static constexpr uint16_t kVersion = 1;

    bool ready() const { return host_ && *host_ && key_[0] && validator_; }

    static uint32_t checksum(const Record &record)
    {
        const auto *data = reinterpret_cast<const uint8_t *>(&record);
        const auto bytes = reinterpret_cast<const uint8_t *>(&record.crc) - data;
        uint32_t crc = 0xffffffffU;
        for (size_t index = 0; index < static_cast<size_t>(bytes); ++index) {
            crc ^= data[index];
            for (int bit = 0; bit < 8; ++bit)
                crc = (crc >> 1U) ^ (0xedb88320U & (0U - (crc & 1U)));
        }
        return ~crc;
    }

    Host *host_ = nullptr;
    Validator validator_ = nullptr;
    char key_[33]{};
};

}  // namespace desktile::sdk
