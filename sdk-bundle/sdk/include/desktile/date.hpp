#pragma once
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <initializer_list>
namespace desktile::sdk {
struct CivilDate {
    int year = 1970, month = 1, day = 1;
};
inline constexpr bool leapYear(int year) { return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0); }
inline constexpr int monthDays(int year, int month) {
    constexpr int days[]{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    return month >= 1 && month <= 12 ? days[month - 1] + (month == 2 && leapYear(year)) : 0;
}
inline constexpr bool validDate(CivilDate d) {
    return d.year >= 1900 && d.year <= 2100 && d.month >= 1 && d.month <= 12 && d.day >= 1 &&
           d.day <= monthDays(d.year, d.month);
}
inline constexpr int32_t civilDay(CivilDate d) {
    int year = d.year - (d.month <= 2);
    const int era = (year >= 0 ? year : year - 399) / 400;
    const unsigned y = unsigned(year - era * 400), m = unsigned(d.month + (d.month > 2 ? -3 : 9));
    const unsigned doy = (153 * m + 2) / 5 + unsigned(d.day) - 1, doe = y * 365 + y / 4 - y / 100 + doy;
    return era * 146097 + int(doe) - 719468;
}
inline constexpr CivilDate dateFromDay(int32_t day) {
    int64_t z = int64_t(day) + 719468;
    const int era = (z >= 0 ? z : z - 146096) / 146097;
    const unsigned doe = unsigned(z - era * 146097),
                   yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    int year = int(yoe) + era * 400;
    const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100), mp = (5 * doy + 2) / 153;
    const int d = int(doy - (153 * mp + 2) / 5 + 1), m = int(mp) + (mp < 10 ? 3 : -9);
    return {year + (m <= 2), m, d};
}
inline constexpr int weekdaySunday(int32_t day) {
    const int value = (day + 4) % 7;
    return value < 0 ? value + 7 : value;
}
inline bool parseDate(const char *text, CivilDate &date) {
    if (!text || strlen(text) != 10 || text[4] != '-' || text[7] != '-')
        return false;
    for (int i = 0; i < 10; ++i)
        if (i != 4 && i != 7 && (text[i] < '0' || text[i] > '9'))
            return false;
    date = {(text[0] - '0') * 1000 + (text[1] - '0') * 100 + (text[2] - '0') * 10 + text[3] - '0',
            (text[5] - '0') * 10 + text[6] - '0', (text[8] - '0') * 10 + text[9] - '0'};
    return validDate(date);
}
inline void formatDate(CivilDate date, char (&out)[11]) {
    if(!validDate(date)){out[0]=0;return;}
    out[0]=char('0'+date.year/1000);out[1]=char('0'+date.year/100%10);out[2]=char('0'+date.year/10%10);out[3]=char('0'+date.year%10);out[4]='-';out[5]=char('0'+date.month/10);out[6]=char('0'+date.month%10);out[7]='-';out[8]=char('0'+date.day/10);out[9]=char('0'+date.day%10);out[10]=0;
}
inline bool parseDateTime(const char *text, CivilDate &date, int &minute) {
    if (!text || strlen(text) != 16 || text[10] != 'T' || text[13] != ':')
        return false;
    char day[11];
    memcpy(day, text, 10);
    day[10] = 0;
    if (!parseDate(day, date))
        return false;
    for (int i : {11, 12, 14, 15})
        if (text[i] < '0' || text[i] > '9')
            return false;
    const int hour = (text[11] - '0') * 10 + text[12] - '0', m = (text[14] - '0') * 10 + text[15] - '0';
    if (hour > 23 || m > 59)
        return false;
    minute = hour * 60 + m;
    return true;
}
} // namespace desktile::sdk
