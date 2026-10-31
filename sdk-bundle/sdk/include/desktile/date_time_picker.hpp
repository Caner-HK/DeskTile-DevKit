#pragma once
#include "date.hpp"
#include "sdk.h"
#include "stepper.hpp"
#include "tile_time_picker.hpp"
#include <cstring>

namespace desktile::sdk {
inline dt_date_time_corner_text_v1 dateTimeCornerTextDefaults(){
    dt_date_time_corner_text_v1 c{};c.structure_size=sizeof(c);return c;
}
inline dt_date_time_picker_v1 dateTimePickerDefaults() {
    dt_date_time_picker_v1 c{};
    c.structure_size = sizeof(c);
    c.minute_step = 1;
    c.day = civilDay({2000, 1, 1});
    c.minimum_day = civilDay({1900, 1, 1});
    c.maximum_day = civilDay({2100, 12, 31});
    c.maximum_minute = 1439;
    c.button_height = 52;
    c.value_height = 52;
    c.vertical_gap = 8;
    c.column_gap = 16;
    c.group_gap = 56;
    c.number_size = 32;
    c.unit_size = 20;
    c.unit_gap = 8;
    c.title_height = 40;
    c.title_gap = 20;
    std::strcpy(c.date_label, "Date");
    std::strcpy(c.time_label, "Time");
    const char *units[]{"Y", "M", "D", "h", "min"};
    for (int i = 0; i < 5; ++i)
        std::strcpy(c.units[i], units[i]);
    return c;
}
inline StepperStyle pickerStepperStyle(const dt_date_time_picker_v1 &c) {
    StepperStyle s;
    s.buttonHeight = c.button_height;
    s.valueHeight = c.value_height;
    s.verticalGap = c.vertical_gap;
    s.numberSize = c.number_size;
    s.unitSize = c.unit_size;
    s.unitGap = c.unit_gap;
    s.symbols = c.symbols ? StepperSymbols::Arrows : StepperSymbols::PlusMinus;
    return s;
}
inline bool validDateTimePicker(const dt_date_time_picker_v1 &c) {
    if (c.structure_size != sizeof(c) || c.mode > DT_PICKER_TIME || c.symbols > 1 || c.minute_step < 1 ||
        c.minute_step > 60)
        return false;
    if (c.minimum_day < civilDay({1900, 1, 1}) || c.maximum_day > civilDay({2100, 12, 31}) ||
        c.minimum_day > c.maximum_day || c.day < c.minimum_day || c.day > c.maximum_day)
        return false;
    if (c.minimum_minute < 0 || c.maximum_minute > 1439 || c.minimum_minute > c.maximum_minute ||
        c.minute < c.minimum_minute || c.minute > c.maximum_minute)
        return false;
    if (!pickerStepperStyle(c).valid() || c.column_gap < 0 || c.column_gap > 64 || c.group_gap < 16 ||
        c.group_gap > 96 || c.title_height < 24 || c.title_height > 96 || c.title_gap < 8 || c.title_gap > 64)
        return false;
    if (!std::memchr(c.date_label, 0, sizeof(c.date_label)) ||
        !std::memchr(c.time_label, 0, sizeof(c.time_label)))
        return false;
    for (const auto &unit : c.units)
        if (!std::memchr(unit, 0, sizeof(unit)))
            return false;
    return true;
}
struct DateTimePickerLayout {
    Rect dateTitle{}, timeTitle{}, divider{}, fields[5]{}, timeTiles{}, dateTiles{};
    int count = 0;
    static int height(const dt_date_time_picker_v1 &c) {
        return 308;
    }
    static DateTimePickerLayout resolve(Rect area, const dt_date_time_picker_v1 &c,bool twelve=false) {
        DateTimePickerLayout r;
        const int dates=c.mode==DT_PICKER_TIME?0:3,times=c.mode==DT_PICKER_DATE?0:twelve?3:2;
        const auto pair=TilePickerPairLayout::resolve(area,dates,times);
        r.dateTiles=pair.first;r.timeTiles=pair.second;r.divider=pair.separator;r.count=dates+times;
        return r;
    }
    int hit(int x, int y, const dt_date_time_picker_v1 &c) const {
        return 0;
    }
};
inline bool stepDateTimePicker(dt_date_time_picker_v1 &c, int control) {
    if (!validDateTimePicker(c) || control == 0 || control < -5 || control > 5)
        return false;
    const int direction = control > 0 ? 1 : -1, field = (control > 0 ? control : -control) - 1;
    if ((c.mode == DT_PICKER_DATE && field >= 3) || (c.mode == DT_PICKER_TIME && field < 3))
        return false;
    if (field < 3) {
        auto d = dateFromDay(c.day);
        if (field == 0) {
            d.year = std::clamp(d.year + direction, 1900, 2100);
            d.day = std::min(d.day, monthDays(d.year, d.month));
        } else if (field == 1) {
            int month = d.year * 12 + d.month - 1 + direction;
            month = std::clamp(month, 1900 * 12, 2100 * 12 + 11);
            d.year = month / 12;
            d.month = month % 12 + 1;
            d.day = std::min(d.day, monthDays(d.year, d.month));
        } else {
            const int next = std::clamp(c.day + direction, c.minimum_day, c.maximum_day);
            if (next == c.day)
                return false;
            c.day = next;
            return true;
        }
        const int next = std::clamp(civilDay(d), c.minimum_day, c.maximum_day);
        if (next == c.day)
            return false;
        c.day = next;
        return true;
    }
    const int next = std::clamp(c.minute + direction * (field == 3 ? 60 : int(c.minute_step)),
                                c.minimum_minute, c.maximum_minute);
    if (next == c.minute)
        return false;
    c.minute = next;
    return true;
}
} // namespace desktile::sdk
