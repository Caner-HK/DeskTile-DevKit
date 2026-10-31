# Interface design

[Documentation home](/en/) / [Design and components](/en/components/)

DeskTile applications use system-rendered components. Start with the user task, navigation and information order, then choose components and states for the 800 × 480 screen.

<!-- page-outline -->
[[toc]]

## Page structure

The normal status bar occupies 32 px; the application uses the remaining 800 × 448 px. The standard app bar is 72 px high. Scaffold manages the shared title, back behavior and navigation. Full-screen pages and dialogs have their own presentation rules. Check root status-bar properties against real theme renders.

## Lists

Comfortable settings rows are 76 px high; compact PIDS settings rows are 54 px. `ui.listRow` defaults to comfortable and accepts `density: "compact"`. Summaries align right and toggles occupy the trailing slot. Lists fill the content width and native rows provide 24 px horizontal text padding.

Show arrows for navigation and buttons for actions. Use toggles for binary settings and selection controls for exclusive choices. Show a final divider for a fully visible short list or when a note follows it; preserve clipping when the last row is outside the viewport.

## Text and color

Use native font tiers; app-bar titles are 32 px. Check Simplified Chinese, Hong Kong Traditional Chinese and English, including long names and wrapping. System-colored icons follow theme semantics and custom-colored icons retain their supplied colors. Destructive actions use the warning color. Inspect actual icon bounds and optical centering at native size.

## Input and verification

Provide pressed, disabled and current-value states, with independent touch areas for adjacent controls. Use component scrolling and modal behavior. Check both themes, all languages, empty/error states, quick taps, long presses, scrolling, exit/reopen and notification/dialog overlays. Local preview verifies interaction and geometry; device tests establish hardware, touch and memory behavior.
