#pragma once
#include <cstdint>

namespace desktile::sdk::timepicker {
inline float absf(float x) { return x < 0 ? -x : x; }
inline float clamp(float x, float a, float b) { return x < a ? a : x > b ? b : x; }
inline int nearest(float x) { return int(x >= 0 ? x + .5f : x - .5f); }
inline int wrap(int n, int count) { return (n % count + count) % count; }

// Values are rebased after every drag/frame: work and storage stay bounded
// regardless of how many complete revolutions the user makes.
struct Column {
    int value = 0, count = 60;
    float offset = 0, velocity = 0, reveal = 0;
    float snapFrom = 0, snapElapsed = 0;
    bool expanded = false, snapping = false, flicking = false, bounded = false;
    static constexpr int side = 112, gap = 10, pitch = side + gap;
    void rebase() {
        const int delta = nearest(offset / pitch);
        if (delta) { value = wrap(value - delta, count); offset -= delta * pitch; }
    }
    void move(float dy) {
        if (bounded) {
            float position = clamp(float(value) - (offset + dy) / pitch, 0, float(count - 1));
            value = nearest(position); offset = (value - position) * pitch;
        } else { offset += dy; rebase(); }
    }
    void stop() { flicking = snapping = false; velocity = 0; }
    void snap() {
        flicking = false; velocity = 0; rebase();
        snapFrom = offset; snapElapsed = 0;
        snapping = absf(offset) > .1f;
        if (!snapping) offset = 0;
    }
    void choose(int relative) {
        value = bounded ? int(clamp(float(value + relative), 0, float(count - 1)))
                        : wrap(value + relative, count);
        offset += relative * pitch;
        snapFrom = offset; snapElapsed = 0; snapping = true; flicking = false;
    }
    bool moving() const { return flicking || snapping; }
    bool tick(float seconds) {
        const float oldReveal = reveal;
        reveal = clamp(reveal + (expanded ? 1 : -1) * seconds / .16f, 0, 1);
        bool dirty = oldReveal != reveal;
        if (flicking) {
            const float speed = absf(velocity), deceleration = 2300;
            const float duration = seconds < speed / deceleration ? seconds : speed / deceleration;
            const float next = speed - deceleration * duration;
            move((velocity < 0 ? -1 : 1) * (speed + next) * .5f * duration);
            velocity = (velocity < 0 ? -1 : 1) * next;
            if (next < 60 || (bounded && offset == 0)) snap();
            dirty = true;
        } else if (snapping) {
            snapElapsed += seconds;
            const float t = clamp(snapElapsed / .22f, 0, 1), ease = 1 - (1 - t) * (1 - t) * (1 - t);
            offset = snapFrom * (1 - ease);
            if (t == 1) { offset = 0; snapping = false; }
            dirty = true;
        }
        return dirty;
    }
};

struct Picker {
    static constexpr int width = 800, height = 380, center = height / 2;
    static constexpr int padding = 12;
    Column columns[3]{};
    bool twelve = false, pointer = false, dragging = false, horizontal = false, interrupted = false;
    int captured = -1, active = -1, startX = 0, startY = 0, lastY = 0;
    uint64_t lastMove = 0, lastTick = 0;
    float velocity = 0;
    int columnCount = 0;
    int count() const { return columnCount ? columnCount : twelve ? 3 : 2; }
    int left(int col) const { return (width - count() * Column::side - (count() - 1) * Column::gap) / 2 + col * Column::pitch; }
    void reset(int minute, bool useTwelve) {
        *this = Picker{}; twelve = useTwelve;
        columns[0].count = twelve ? 12 : 24;
        columns[0].value = (minute / 60) % columns[0].count;
        columns[1].value = minute % 60;
        columns[2].count = 2; columns[2].value = minute / 720; columns[2].bounded = true;
    }
    int minute() const {
        return columns[0].value * 60 + columns[1].value + (twelve ? columns[2].value * 720 : 0);
    }
    void expand(int col) {
        active = col;
        for (int i = 0; i < count(); ++i) {
            columns[i].expanded = i == col;
            if (i != col) columns[i].snap();
        }
    }
    int hit(int x, int y) const {
        if (y < padding || y >= height - padding) return -1;
        for (int i = 0; i < count(); ++i) {
            if (x < left(i) || x >= left(i) + Column::side) continue;
            if (columns[i].expanded || (y >= center - Column::side / 2 && y < center + Column::side / 2)) return i;
        }
        return -1;
    }
    bool down(int x, int y, uint64_t now) {
        if (pointer) return false;
        captured = hit(x,y);
        if (captured < 0) return false;
        auto &c = columns[captured];
        interrupted = c.moving(); c.stop();
        pointer = true; dragging = horizontal = false;
        startX = x; startY = lastY = y; lastMove = now; velocity = 0;
        return true;
    }
    bool move(int x, int y, uint64_t now) {
        if (!pointer || horizontal) return false;
        if (!dragging) {
            if (absf(float(x - startX)) > 12 && absf(float(x - startX)) > absf(float(y - startY))) {
                horizontal = true; return false;
            }
            if (absf(float(y - startY)) <= 12) return false;
            dragging = true; expand(captured);
        }
        const int dy = y - lastY;
        const uint64_t elapsed = now > lastMove ? now - lastMove : 1;
        if (dy) {
            const float instant = clamp(dy * 1000.0f / float(elapsed), -2400, 2400);
            velocity = elapsed > 100 ? instant : velocity * .35f + instant * .65f;
            columns[captured].move(float(dy));
            lastY = y; lastMove = now;
        }
        return true;
    }
    bool up(int x, int y, uint64_t now, bool cancel = false) {
        if (!pointer) return false;
        auto &c = columns[captured];
        if (cancel || horizontal) c.snap();
        else if (dragging) {
            if (now > lastMove + 90) velocity = 0;
            c.velocity = velocity;
            if (absf(velocity) >= 180) c.flicking = true;
            else c.snap();
        } else if (interrupted) c.snap();
        else if (hit(x,y) == captured) {
            if (!c.expanded) expand(captured);
            else {
                const float relative = (y - center - c.offset) / Column::pitch;
                const int row = nearest(relative);
                if (absf((relative - row) * Column::pitch) <= Column::side / 2) {
                    if (row == 0) expand(-1);
                    else if (!c.bounded || (c.value + row >= 0 && c.value + row < c.count)) c.choose(row);
                }
            }
        }
        pointer = dragging = false; captured = -1;
        return true;
    }
    bool tick(uint64_t now) {
        if (!lastTick) { lastTick = now; return false; }
        if (now <= lastTick) return false;
        float dt = float(now - lastTick) / 1000; lastTick = now;
        bool activeMotion=false;
        for(int i=0;i<count();++i)
            activeMotion=activeMotion||columns[i].moving()||columns[i].reveal!=(columns[i].expanded?1.0f:0.0f);
        if(!activeMotion)return false;
        // A suspension must never turn into minutes of accumulated motion.
        if (dt > .25f) { settle(); return true; }
        bool dirty = false;
        for (int i = 0; i < count(); ++i) dirty = columns[i].tick(dt) || dirty;
        return dirty;
    }
    void settle() {
        pointer = dragging = false; captured = -1;
        for (auto &c : columns) { c.rebase(); c.stop(); c.offset = 0; }
        lastTick = 0;
    }
};
}
