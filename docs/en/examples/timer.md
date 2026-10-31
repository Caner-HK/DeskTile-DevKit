# Timer

[Documentation home](/en/) / [Application development](/en/guide/project.md) / [Examples](/en/examples/index.md)

A JavaScript application demonstrating duration selection, start/stop, countdown, overdue state and restoration after reopening.

[Download source](/downloads/timer-js.zip)

<!-- page-outline -->
[[toc]]

## Read the source

Read the manifest, `src/index.html` for pickers/display/buttons, `src/main.js` for time calculations, transitions, updates and persistence, and `locales/` for the three languages.

## State

Follow start, stop and restore, and how updates calculate remaining and overdue time. The duration component supplies a numeric value; the application owns the timer state. Restoring after exit uses saved data and recalculation. Independent continued work uses [tasks](../services/tasks.md); reminders use [notifications](../services/notifications.md).

## Build

The three shortcuts default to 1, 5 and 15 minutes. Starting a new timer moves its duration to the front of the three most recently started distinct durations. Selecting a duration or resuming a paused timer preserves the existing order. Shortcuts persist with timer state across restarts. The `timer-v1` private record reads older formats and migrates them when next saved.

```sh
desktile build .
desktile check dist/hk.caner.desktile.timer.dtapp
```

## Verify

Start a short timer, check zero and overdue states, exit/reopen during counting and check restoration, then stop and change duration. Confirm buttons, numbers and persistent state agree. Source and icon notices are included under Apache-2.0 and their respective asset licenses.
