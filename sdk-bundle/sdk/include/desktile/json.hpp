#pragma once
#include <climits>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <initializer_list>
namespace desktile::sdk {
namespace json_detail {
inline bool unicode(const char *&at, const char *end, uint32_t &value) {
    if (end - at < 4)
        return false;
    value = 0;
    for (int i = 0; i < 4; i++) {
        const unsigned char c = *at++;
        const int digit = c >= '0' && c <= '9'   ? c - '0'
                          : c >= 'a' && c <= 'f' ? c - 'a' + 10
                          : c >= 'A' && c <= 'F' ? c - 'A' + 10
                                                 : -1;
        if (digit < 0)
            return false;
        value = (value << 4) | digit;
    }
    return true;
}
inline bool utf8(const char *&at, const char *end, uint32_t &value) {
    if (at == end)
        return false;
    const auto first = static_cast<unsigned char>(*at++);
    int count = 0;
    uint32_t minimum = 0;
    if (first < 0x80) {
        value = first;
        return true;
    }
    if (first >= 0xc2 && first <= 0xdf) {
        count = 1;
        minimum = 0x80;
        value = first & 31;
    } else if (first >= 0xe0 && first <= 0xef) {
        count = 2;
        minimum = 0x800;
        value = first & 15;
    } else if (first >= 0xf0 && first <= 0xf4) {
        count = 3;
        minimum = 0x10000;
        value = first & 7;
    } else
        return false;
    if (end - at < count)
        return false;
    while (count--) {
        const auto next = static_cast<unsigned char>(*at++);
        if ((next & 0xc0) != 0x80)
            return false;
        value = (value << 6) | (next & 63);
    }
    return value >= minimum && value <= 0x10ffff && (value < 0xd800 || value > 0xdfff);
}
inline bool string(const char *&at, const char *end, char *out, size_t capacity, size_t *length = nullptr) {
    size_t used = 0;
    if (at == end || *at++ != '"')
        return false;
    const auto emit = [&](uint32_t cp) {
        unsigned char bytes[4];
        int n = 1;
        if (cp < 0x80)
            bytes[0] = cp;
        else if (cp < 0x800) {
            n = 2;
            bytes[0] = 0xc0 | (cp >> 6);
            bytes[1] = 0x80 | (cp & 63);
        } else if (cp < 0x10000) {
            n = 3;
            bytes[0] = 0xe0 | (cp >> 12);
            bytes[1] = 0x80 | ((cp >> 6) & 63);
            bytes[2] = 0x80 | (cp & 63);
        } else {
            n = 4;
            bytes[0] = 0xf0 | (cp >> 18);
            bytes[1] = 0x80 | ((cp >> 12) & 63);
            bytes[2] = 0x80 | ((cp >> 6) & 63);
            bytes[3] = 0x80 | (cp & 63);
        }
        if (out && used + n >= capacity)
            return false;
        for (int i = 0; i < n; i++) {
            if (out)
                out[used] = char(bytes[i]);
            ++used;
        }
        return true;
    };
    while (at < end) {
        if (*at == '"') {
            ++at;
            if (out) {
                if (used >= capacity)
                    return false;
                out[used] = 0;
            }
            if (length)
                *length = used;
            return true;
        }
        uint32_t cp = 0;
        if (*at == '\\') {
            if (++at == end)
                return false;
            switch (*at++) {
            case '"':
                cp = '"';
                break;
            case '\\':
                cp = '\\';
                break;
            case '/':
                cp = '/';
                break;
            case 'b':
                cp = '\b';
                break;
            case 'f':
                cp = '\f';
                break;
            case 'n':
                cp = '\n';
                break;
            case 'r':
                cp = '\r';
                break;
            case 't':
                cp = '\t';
                break;
            case 'u': {
                if (!unicode(at, end, cp))
                    return false;
                if (cp >= 0xd800 && cp <= 0xdbff) {
                    uint32_t low;
                    if (end - at < 2 || *at++ != '\\' || *at++ != 'u' || !unicode(at, end, low) ||
                        low < 0xdc00 || low > 0xdfff)
                        return false;
                    cp = 0x10000 + ((cp - 0xd800) << 10) + (low - 0xdc00);
                } else if (cp >= 0xdc00 && cp <= 0xdfff)
                    return false;
                break;
            }
            default:
                return false;
            }
        } else {
            if (static_cast<unsigned char>(*at) < 0x20 || !utf8(at, end, cp))
                return false;
        }
        if (!cp || !emit(cp))
            return false;
    }
    return false;
}
struct Reader {
    const char *at, *end;
    void spaces() {
        while (at < end && (*at == ' ' || *at == '\t' || *at == '\r' || *at == '\n'))
            ++at;
    }
    bool value(int depth = 0) {
        spaces();
        if (at == end)
            return false;
        if (*at == '"')
            return string(at, end, nullptr, 0);
        if (*at == '{' || *at == '[') {
            if (depth >= 8)
                return false;
            const bool object = *at++ == '{';
            const char close = object ? '}' : ']';
            spaces();
            if (at < end && *at == close) {
                ++at;
                return true;
            }
            const char *keys[64]{};
            int count = 0;
            for (;;) {
                if (object) {
                    if (count == 64)
                        return false;
                    keys[count] = at;
                    char key[64];
                    if (!string(at, end, key, sizeof(key)))
                        return false;
                    for (int i = 0; i < count; i++) {
                        const char *previous = keys[i];
                        char other[64];
                        if (!string(previous, end, other, sizeof(other)) || !strcmp(key, other))
                            return false;
                    }
                    ++count;
                    spaces();
                    if (at == end || *at++ != ':')
                        return false;
                }
                if (!value(depth + 1))
                    return false;
                spaces();
                if (at == end)
                    return false;
                if (*at == close) {
                    ++at;
                    return true;
                }
                if (*at++ != ',')
                    return false;
                spaces();
            }
        }
        for (const char *literal : {"true", "false", "null"}) {
            const size_t n = strlen(literal);
            if (size_t(end - at) >= n && !memcmp(at, literal, n)) {
                at += n;
                return true;
            }
        }
        if (*at == '-')
            ++at;
        if (at == end)
            return false;
        if (*at == '0')
            ++at;
        else {
            if (*at < '1' || *at > '9')
                return false;
            while (at < end && *at >= '0' && *at <= '9')
                ++at;
        }
        if (at < end && *at == '.') {
            ++at;
            const char *begin = at;
            while (at < end && *at >= '0' && *at <= '9')
                ++at;
            if (at == begin)
                return false;
        }
        if (at < end && (*at == 'e' || *at == 'E')) {
            ++at;
            if (at < end && (*at == '+' || *at == '-'))
                ++at;
            const char *begin = at;
            while (at < end && *at >= '0' && *at <= '9')
                ++at;
            if (at == begin)
                return false;
        }
        return true;
    }
};
} // namespace json_detail
// Borrowed, validated JSON. Profile: 32 KiB, 8 containers, 64 members/object,
// 63 decoded UTF-8 bytes/key; duplicate keys and embedded NUL are rejected.
class JsonView {
    const char *data_ = nullptr;
    size_t bytes_ = 0;
    JsonView(const char *data, size_t bytes) : data_(data), bytes_(bytes) {}

  public:
    JsonView() = default;
    static JsonView parse(const void *data, size_t bytes) {
        if (!data || !bytes || bytes > 32768)
            return {};
        json_detail::Reader reader{static_cast<const char *>(data), static_cast<const char *>(data) + bytes};
        reader.spaces();
        const char *begin = reader.at;
        if (!reader.value())
            return {};
        const char *end = reader.at;
        reader.spaces();
        return reader.at == reader.end ? JsonView(begin, size_t(end - begin)) : JsonView{};
    }
    explicit operator bool() const { return data_ != nullptr; }
    bool object() const { return data_ && *data_ == '{'; }
    bool array() const { return data_ && *data_ == '['; }
    bool null() const { return data_ && bytes_ == 4 && !memcmp(data_, "null", 4); }
    bool boolean(bool &value) const {
        if (data_ && bytes_ == 4 && !memcmp(data_, "true", 4)) {
            value = true;
            return true;
        }
        if (data_ && bytes_ == 5 && !memcmp(data_, "false", 5)) {
            value = false;
            return true;
        }
        return false;
    }
    bool string(char *out, size_t capacity) const {
        if (out && capacity)
            out[0] = 0;
        if (!out || !capacity || !data_)
            return false;
        const char *at = data_;
        const bool ok = json_detail::string(at, data_ + bytes_, out, capacity) && at == data_ + bytes_;
        if (!ok)
            out[0] = 0;
        return ok;
    }
    bool integer(int64_t &value) const {
        if (!data_ || !bytes_)
            return false;
        const bool negative = *data_ == '-';
        size_t at = negative ? 1 : 0;
        uint64_t result = 0;
        const uint64_t limit = negative ? uint64_t(INT64_MAX) + 1 : uint64_t(INT64_MAX);
        if (at == bytes_)
            return false;
        for (; at < bytes_; at++) {
            const unsigned char c = data_[at];
            if (c < '0' || c > '9' || result > (limit - (c - '0')) / 10)
                return false;
            result = result * 10 + c - '0';
        }
        value =
            negative ? (result == uint64_t(INT64_MAX) + 1 ? INT64_MIN : -int64_t(result)) : int64_t(result);
        return true;
    }
    JsonView get(const char *key) const {
        if (!object() || !key)
            return {};
        json_detail::Reader reader{data_ + 1, data_ + bytes_};
        reader.spaces();
        while (reader.at < reader.end && *reader.at != '}') {
            char name[64];
            if (!json_detail::string(reader.at, reader.end, name, sizeof(name)))
                return {};
            reader.spaces();
            ++reader.at;
            reader.spaces();
            const char *begin = reader.at;
            if (!reader.value())
                return {};
            const char *end = reader.at;
            if (!strcmp(key, name))
                return {begin, size_t(end - begin)};
            reader.spaces();
            if (reader.at < reader.end && *reader.at == ',') {
                ++reader.at;
                reader.spaces();
            } else
                break;
        }
        return {};
    }
    JsonView element(size_t index) const {
        if (!array())
            return {};
        json_detail::Reader reader{data_ + 1, data_ + bytes_};
        reader.spaces();
        while (reader.at < reader.end && *reader.at != ']') {
            const char *begin = reader.at;
            if (!reader.value())
                return {};
            if (index-- == 0)
                return {begin, size_t(reader.at - begin)};
            reader.spaces();
            if (reader.at < reader.end && *reader.at == ',') {
                ++reader.at;
                reader.spaces();
            } else
                break;
        }
        return {};
    }
    size_t count() const {
        if (!array())
            return 0;
        size_t count = 0;
        json_detail::Reader reader{data_ + 1, data_ + bytes_};
        reader.spaces();
        while (reader.at < reader.end && *reader.at != ']') {
            if (!reader.value())
                return 0;
            ++count;
            reader.spaces();
            if (reader.at < reader.end && *reader.at == ',') {
                ++reader.at;
                reader.spaces();
            } else
                break;
        }
        return count;
    }
};
class JsonWriter {
    char *data_;
    size_t capacity_, used_ = 0;
    bool ok_ = true;
    bool append(const char *value, size_t bytes) {
        if (!ok_ || !data_ || !capacity_ || bytes >= capacity_ - used_) {
            ok_ = false;
            if (data_ && capacity_)
                data_[0] = 0;
            return false;
        }
        memcpy(data_ + used_, value, bytes);
        used_ += bytes;
        data_[used_] = 0;
        return true;
    }

  public:
    JsonWriter(char *data, size_t capacity) : data_(data), capacity_(capacity) {
        if (data && capacity)
            data[0] = 0;
        else
            ok_ = false;
    }
    bool raw(const char *literal) {
        if (!literal) {
            ok_ = false;
            if (data_ && capacity_)
                data_[0] = 0;
            return false;
        }
        return append(literal, strlen(literal));
    }
    bool string(const char *value) {
        if (!value) {
            ok_ = false;
            if (data_ && capacity_)
                data_[0] = 0;
            return false;
        }
        if (!append("\"", 1))
            return false;
        const char *at = value, *end = value + strlen(value);
        while (at < end) {
            const char *begin = at;
            uint32_t cp;
            if (!json_detail::utf8(at, end, cp)) {
                ok_ = false;
                data_[0] = 0;
                return false;
            }
            if (cp == '"' || cp == '\\') {
                const char escape[]{'\\', char(cp)};
                if (!append(escape, 2))
                    return false;
            } else if (cp < 0x20) {
                constexpr char hex[] = "0123456789abcdef";
                const char escape[]{'\\', 'u', '0', '0', hex[cp >> 4], hex[cp & 15]};
                if (!append(escape, 6))
                    return false;
            } else if (!append(begin, size_t(at - begin)))
                return false;
        }
        return append("\"", 1);
    }
    bool number(uint64_t value) {
        char reverse[20], out[20];
        int count = 0;
        do {
            reverse[count++] = char('0' + value % 10);
            value /= 10;
        } while (value);
        for (int i = 0; i < count; i++)
            out[i] = reverse[count - i - 1];
        return append(out, count);
    }
    bool boolean(bool value) { return raw(value ? "true" : "false"); }
    bool ok() const { return ok_; }
    size_t size() const { return ok_ ? used_ : 0; }
    const char *data() const { return ok_ ? data_ : ""; }
};
} // namespace desktile::sdk
