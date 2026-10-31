#pragma once
#include "locale.hpp"
#include <cstddef>
#include <cstdint>
#include <cstring>

namespace desktile::sdk {
struct Message {
    const char *key, *one, *other;
    bool plural;
};
struct MessageLanguage {
    const char *locale;
    const Message *messages;
    size_t count;
};
struct MessageCatalog {
    const char *defaultLocale;
    const MessageLanguage *languages;
    size_t count;
    const char *message(const char *key, const char *locale, int64_t pluralCount = -1) const {
        if (!key || !defaultLocale || !languages || !count || count > localeLimit)
            return nullptr;
        LocaleSet set;
        set.count = unsigned(count);
        if (!normalizeLocale(defaultLocale, set.defaultTag))
            return nullptr;
        for (size_t i = 0; i < count; ++i)
            if (!normalizeLocale(languages[i].locale, set.tags[i]))
                return nullptr;
        const char *selected = lookupLocale(set, locale);
        if (!selected)
            return nullptr;
        const char *candidates[]{selected,set.defaultTag};
        for (const char *candidate : candidates) {
            for (size_t language = 0; language < count; ++language) {
                const auto &map = languages[language];
                if (strcmp(set.tags[language], candidate) || !map.messages || map.count > 256)
                    continue;
                for (size_t i = 0; i < map.count; ++i) {
                    const auto &item = map.messages[i];
                    if (!item.key || strcmp(item.key, key))
                        continue;
                    if (item.plural && pluralCount < 0)
                        return nullptr;
                    return item.plural && localeEnglish(selected) && pluralCount == 1 && item.one
                               ? item.one
                               : item.other;
                }
            }
        }
        return nullptr;
    }
};
struct MessageArgument {
    const char *name, *value;
};
inline bool formatMessage(char *out, size_t bytes, const char *pattern,
                          const MessageArgument *arguments = nullptr, size_t count = 0) {
    if (!out || !bytes)
        return false;
    out[0] = 0;
    if (!pattern || count > 16 || (count && !arguments))
        return false;
    char result[1025]{};
    size_t used = 0, at = 0;
    auto append = [&](char c) {
        if (used + 1 >= bytes || used >= 1024)
            return false;
        result[used++] = c;
        return true;
    };
    while (pattern[at] && at < 4096) {
        const char c = pattern[at++];
        if (c != '{' && c != '}') {
            if (!append(c))
                return false;
            continue;
        }
        if (pattern[at] == c) {
            ++at;
            if (!append(c))
                return false;
            continue;
        }
        if (c == '}')
            return false;
        const size_t begin = at;
        while (pattern[at] && pattern[at] != '}' && at - begin <= 32)
            ++at;
        const size_t length = at - begin;
        if (!length || length > 32 || pattern[at] != '}' || !localeAlpha(pattern[begin]))
            return false;
        for (size_t i = begin; i < at; ++i)
            if (!localeAlpha(pattern[i]) && !localeDigit(pattern[i]) && pattern[i] != '_')
                return false;
        ++at;
        const char *value = nullptr;
        for (size_t i = 0; i < count; ++i) {
            if (!arguments[i].name || !arguments[i].value)
                return false;
            size_t nameBytes = 0;
            while (arguments[i].name[nameBytes] && nameBytes <= 32)
                ++nameBytes;
            if (nameBytes == length && !strncmp(arguments[i].name, pattern + begin, length)) {
                if (value)
                    return false;
                value = arguments[i].value;
            }
        }
        if (!value)
            return false;
        size_t valueBytes = 0;
        while (value[valueBytes]) {
            if (valueBytes >= 1024 || !append(value[valueBytes++]))
                return false;
        }
    }
    if (pattern[at])
        return false;
    // Validate the complete UTF-8 result before exposing any partial text.
    for (size_t i = 0; i < used;) {
        const auto first = uint8_t(result[i++]);
        if (first < 128)
            continue;
        unsigned remaining = 0;
        uint32_t code = 0, minimum = 0;
        if (first >= 194 && first <= 223) {
            remaining = 1;
            code = first & 31;
            minimum = 128;
        } else if (first >= 224 && first <= 239) {
            remaining = 2;
            code = first & 15;
            minimum = 2048;
        } else if (first >= 240 && first <= 244) {
            remaining = 3;
            code = first & 7;
            minimum = 65536;
        } else
            return false;
        while (remaining--) {
            if (i >= used || (uint8_t(result[i]) & 192) != 128)
                return false;
            code = (code << 6) | (uint8_t(result[i++]) & 63);
        }
        if (code < minimum || code > 1114111 || (code >= 55296 && code <= 57343))
            return false;
    }
    memcpy(out, result, used + 1);
    return true;
}
} // namespace desktile::sdk
