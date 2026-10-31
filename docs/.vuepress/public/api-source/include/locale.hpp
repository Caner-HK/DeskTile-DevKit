#pragma once
#include "date.hpp"
#include <algorithm>
#include <cstdio>
#include <cstring>

namespace desktile::sdk {
inline constexpr unsigned localeLimit = 8, localeTagBytes = 32;
inline bool localeAlpha(char c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'); }
inline bool localeDigit(char c) { return c >= '0' && c <= '9'; }
inline char localeLower(char c) { return c >= 'A' && c <= 'Z' ? char(c + 32) : c; }
inline char localeUpper(char c) { return c >= 'a' && c <= 'z' ? char(c - 32) : c; }
// BCP 47 application profile: language, optional script/region, variants.
// Extension and private-use subtags require a later profile version.
inline bool normalizeLocale(const char *source, char (&output)[localeTagBytes]) {
    if (!source) {
        memset(output, 0, sizeof(output));
        return false;
    }
    size_t bytes = 0;
    while (source[bytes] && bytes < localeTagBytes)
        ++bytes;
    if (bytes < 2 || bytes >= localeTagBytes) {
        memset(output, 0, sizeof(output));
        return false;
    }
    char input[localeTagBytes]{};
    memcpy(input, source, bytes);
    source = input;
    memset(output, 0, sizeof(output));
    bool script = false, region = false, variants = false;
    size_t at = 0;
    while (at < bytes) {
        const size_t begin = at;
        bool alpha = true, digit = true;
        while (at < bytes && source[at] != '-') {
            if (!localeAlpha(source[at]) && !localeDigit(source[at]))
                return false;
            alpha &= localeAlpha(source[at]);
            digit &= localeDigit(source[at]);
            ++at;
        }
        const size_t length = at - begin;
        if (!length || length > 8)
            return false;
        int casing = 0;
        if (!begin) {
            if (length < 2 || !alpha)
                return false;
        } else if (!variants && !script && !region && length == 4 && alpha) {
            script = true;
            casing = 1;
        } else if (!variants && !region && ((length == 2 && alpha) || (length == 3 && digit))) {
            region = true;
            casing = 2;
        } else {
            if (length < 5 && !(length == 4 && localeDigit(source[begin])))
                return false;
            variants = true;
        }
        for (size_t i = begin; i < at; ++i)
            output[i] = casing == 2                 ? localeUpper(source[i])
                        : casing == 1 && i == begin ? localeUpper(source[i])
                                                    : localeLower(source[i]);
        if (at < bytes) {
            output[at] = '-';
            ++at;
            if (at == bytes)
                return false;
        }
    }
    output[bytes] = 0;
    // Duplicate variants are not well formed.
    for (size_t begin = 0; begin < bytes;) {
        size_t end = begin;
        while (end < bytes && output[end] != '-')
            ++end;
        if (begin)
            for (size_t prior = 0; prior < begin;) {
                size_t stop = prior;
                while (stop < begin && output[stop] != '-')
                    ++stop;
                if (stop - prior == end - begin) {
                    bool same = true;
                    for (size_t i = 0; i < end - begin; ++i)
                        same &= localeLower(output[prior + i]) == localeLower(output[begin + i]);
                    if (same)
                        return false;
                }
                prior = stop + 1;
            }
        begin = end + 1;
    }
    return true;
}
struct LocaleSet {
    char tags[localeLimit][localeTagBytes]{};
    char defaultTag[localeTagBytes]{};
    unsigned count = 0;
    bool contains(const char *tag) const {
        for (unsigned i = 0; i < count; ++i)
            if (!strcmp(tag, tags[i]))
                return true;
        return false;
    }
};
inline bool localeSetValid(const LocaleSet &set) {
    if (!set.count || set.count > localeLimit)
        return false;
    char normalized[localeTagBytes];
    if (!normalizeLocale(set.defaultTag, normalized) || strcmp(normalized, set.defaultTag) ||
        !set.contains(set.defaultTag))
        return false;
    for (unsigned i = 0; i < set.count; ++i) {
        if (!normalizeLocale(set.tags[i], normalized) || strcmp(normalized, set.tags[i]))
            return false;
        for (unsigned j = 0; j < i; ++j)
            if (!strcmp(set.tags[i], set.tags[j]))
                return false;
    }
    return true;
}
inline const char *lookupLocale(const LocaleSet &set, const char *requested) {
    char candidate[localeTagBytes];
    if (!localeSetValid(set))
        return nullptr;
    if (!normalizeLocale(requested, candidate))
        return set.defaultTag;
    for (;;) {
        if (set.contains(candidate))
            for (unsigned i = 0; i < set.count; ++i)
                if (!strcmp(candidate, set.tags[i]))
                    return set.tags[i];
        const size_t length = strlen(candidate);
        if (!strncmp(set.defaultTag, candidate, length) && set.defaultTag[length] == '-')
            return set.defaultTag;
        for (unsigned i = 0; i < set.count; ++i)
            if (!strncmp(set.tags[i], candidate, length) && set.tags[i][length] == '-')
                return set.tags[i];
        char *hyphen = strrchr(candidate, '-');
        if (!hyphen)
            break;
        *hyphen = 0;
    }
    return set.defaultTag;
}
inline bool localeEnglish(const char *tag) {
    return tag && tag[0] == 'e' && tag[1] == 'n' && (tag[2] == 0 || tag[2] == '-');
}
struct LocaleTextWriter {
    char buffer[32]{};
    size_t length = 0;
    bool valid = true;
    void text(const char *value) {
        if (!value) {
            valid = false;
            return;
        }
        while (*value && length + 1 < sizeof(buffer))
            buffer[length++] = *value++;
        if (*value)
            valid = false;
    }
    void number(unsigned value, unsigned width = 1) {
        if (width > 10) {
            valid = false;
            return;
        }
        char reversed[11];
        unsigned count = 0;
        do {
            reversed[count++] = char('0' + value % 10);
            value /= 10;
        } while (value && count < sizeof(reversed));
        while (count < width)
            reversed[count++] = '0';
        if (length + count >= sizeof(buffer)) {
            valid = false;
            return;
        }
        while (count)
            buffer[length++] = reversed[--count];
    }
    bool copy(char *out, size_t bytes) const {
        if (!out || !bytes)
            return false;
        out[0] = 0;
        if (!valid || length >= bytes)
            return false;
        memcpy(out, buffer, length);
        out[length] = 0;
        return true;
    }
};
inline bool formatLocalDate(char *out, size_t bytes, CivilDate date, const char *locale) {
    if (!out || !bytes || !validDate(date))
        return false;
    LocaleTextWriter result;
    if (localeEnglish(locale)) {
        constexpr const char *months[]{"Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        const bool american = locale && (!strcmp(locale, "en-US") || !strcmp(locale, "en"));
        if (american) {
            result.text(months[date.month - 1]);
            result.text(" ");
            result.number(date.day);
            result.text(", ");
        } else {
            result.number(date.day);
            result.text(" ");
            result.text(months[date.month - 1]);
            result.text(" ");
        }
        result.number(date.year);
    } else {
        result.number(date.year, 4);
        result.text("/");
        result.number(date.month, 2);
        result.text("/");
        result.number(date.day, 2);
    }
    return result.copy(out, bytes);
}
inline bool formatLocalTime(char *out, size_t bytes, int minute, bool use24Hour) {
    if (!out || !bytes || minute < 0 || minute >= 1440)
        return false;
    const int hour = minute / 60;
    LocaleTextWriter result;
    result.number(use24Hour ? hour : hour % 12 ? hour % 12 : 12, use24Hour ? 2 : 1);
    result.text(":");
    result.number(minute % 60, 2);
    if (!use24Hour)
        result.text(hour < 12 ? " AM" : " PM");
    return result.copy(out, bytes);
}
} // namespace desktile::sdk
