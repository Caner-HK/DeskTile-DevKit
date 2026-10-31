#pragma once
#include <cstddef>
#include <cstdint>
namespace desktile::sdk {
inline size_t base64Size(size_t bytes) { return (bytes + 2) / 3 * 4; }
inline bool base64Encode(const uint8_t *data, size_t bytes, char *out, size_t capacity) {
    if ((bytes && !data) || !out || capacity < base64Size(bytes) + 1)
        return false;
    constexpr char alphabet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    size_t written = 0;
    for (size_t i = 0; i < bytes; i += 3) {
        const unsigned value = (unsigned(data[i]) << 16) | (i + 1 < bytes ? unsigned(data[i + 1]) << 8 : 0) |
                               (i + 2 < bytes ? data[i + 2] : 0);
        out[written++] = alphabet[value >> 18];
        out[written++] = alphabet[(value >> 12) & 63];
        out[written++] = i + 1 < bytes ? alphabet[(value >> 6) & 63] : '=';
        out[written++] = i + 2 < bytes ? alphabet[value & 63] : '=';
    }
    out[written] = 0;
    return true;
}
inline bool base64Decode(const char *text, size_t bytes, uint8_t *out, size_t capacity, size_t &written) {
    written = 0;
    if ((bytes && !text) || bytes % 4)
        return false;
    auto value = [](char c) {
        return c >= 'A' && c <= 'Z'   ? c - 'A'
               : c >= 'a' && c <= 'z' ? c - 'a' + 26
               : c >= '0' && c <= '9' ? c - '0' + 52
               : c == '+'             ? 62
               : c == '/'             ? 63
                                      : -1;
    };
    for (size_t i = 0; i < bytes; i += 4) {
        const int a = value(text[i]), b = value(text[i + 1]), c = text[i + 2] == '=' ? 0 : value(text[i + 2]),
                  d = text[i + 3] == '=' ? 0 : value(text[i + 3]);
        const size_t count = text[i + 2] == '=' ? 1 : text[i + 3] == '=' ? 2 : 3;
        if (a < 0 || b < 0 || c < 0 || d < 0 || (count < 3 && i + 4 != bytes) ||
            (count == 1 && (text[i + 3] != '=' || (b & 15))) || (count == 2 && (c & 3)) ||
            written + count > capacity || (!out && count))
            return false;
        const unsigned packed = unsigned(a * 262144 + b * 4096 + c * 64 + d);
        out[written++] = uint8_t(packed >> 16);
        if (count > 1)
            out[written++] = uint8_t(packed >> 8);
        if (count > 2)
            out[written++] = uint8_t(packed);
    }
    return true;
}
} // namespace desktile::sdk
