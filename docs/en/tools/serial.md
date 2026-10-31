# Serial debugging commands

[Documentation home](/en/) / [Development tools](/en/tools/)

System firmware handles these through USB debugging input. They are development and device-test commands; applications normally call SDK services.

<!-- page-outline -->
[[toc]]

## Connect and send

Enable USB debugging input in Settings → System → Developer options and confirm on the device. Enable output when reading diagnostics. With input disabled, the system returns before reading RX or parsing commands. Error, fatal and system-boot output follow the system logging policy.

Use 115200 baud, 8 data bits, no parity and one stop bit. End each command with LF; CR is ignored. Lines are limited to 63 bytes and overlong lines are discarded. Enabling input clears previously buffered bytes. Serial Monitor receives logs; release it before using another tool to send commands:

```python
import serial
import time

command = "diag app-state"
port = serial.Serial(port=None, baudrate=115200, timeout=0.1, write_timeout=2)
port.dtr = False
port.rts = False
port.port = "COM4"
port.open()
with port:
    port.write((command + "\n").encode("ascii"))
    port.flush()
    until = time.monotonic() + 3
    while time.monotonic() < until:
        print(port.read(4096).decode("utf-8", errors="replace"), end="")
```

Keep DTR and RTS false because the device auto-reset circuit uses these signals.

## Applications and pages

| Command | Meaning and conditions |
| --- | --- |
| `diag open-app <package-id>` | Launch an installed application; the whole command must fit in 63 bytes |
| `diag app-menu` | Open the current supported App Menu while touch is idle |
| `diag settings <page>` | Open `home`, `battery`, `system`, `developer` or `install` |
| `diag files-path <path>` | Open a directory while Files is foreground |
| `diag scroll <offset>` | Set an absolute, clamped pixel offset on supported settings lists, pickers, Timeline, PIDS/Mosaic settings, SDK scroll views or desktop editing |

`desktile run . --port COM4` obtains the project ID and sends `diag open-app`. Confirm the actual launch through device output and display.

## Touch injection

Coordinates cover the actual 800 × 480 screen including the status bar: x=0–799, y=0–479.

| Command | Meaning and conditions |
| --- | --- |
| `diag input-tap <x> <y> [duration]` | Inject down/up through system touch processing, default 60 ms, range 20–700 ms; touch must be idle |
| `diag input-drag <x> <from-y> <to-y>` | Inject vertical dragging/release on supported lists; y=104–479, keyboard and App Menu closed, touch idle |
| `diag tap <x> <y>` | Direct click dispatch; SDK apps receive pointerDown/pointerUp, other pages their click handler. Use input-tap for full feedback tests |
| `diag long-press <x> <y>` | Invoke a supported long-press action or desktop editing; modal permissions/App Menu restrict it. It invokes the action directly rather than measuring physical hold recognition |
| `diag app-pointer <phase> <x> <y>` | Calligraphy only; phase 0 down, 1 move, 2 up, 3 cancel |

These execute actual actions. Check the current page and target before injection.

## State and performance

Diagnostic output requires USB debugging output.

| Command | Result |
| --- | --- |
| `diag app-state` | App/input state, internal RAM, PSRAM, fonts, lists, desktop cache, dialog and app-specific diagnostics |
| `diag app-ui` | Page, keyboard and runtime state; SDK component tree/layout or calendar state |
| `diag app-names` | Installed built-in names in Simplified Chinese, Traditional Chinese and English |
| `diag profile` | Time the next page draw; Mosaic includes rendering phases |
| `diag progress` | Progress components, installer and task state |
| `diag motion` | Scene, menu, construction and transition state |
| `diag scan-reset` | Read and reset display-scan diagnostics |
| `diag desktop-layout` | Tile IDs, coordinates, sizes, checksum and editing state |
| `diag desktop-trace-start` | Start desktop performance tracing |
| `diag desktop-trace-stop` | Stop and print desktop tracing samples |
| `diag desktop-status` | Redraw desktop-edit status region when cached editing and idle touch permit |

## DevKit protocol

Both debug switches are required. Replies start with `[DevKit] ` followed by one JSON line. `desktile install` manages the transfer and installer flow.

| Command | Purpose |
| --- | --- |
| `dev hello` | Protocol version, chunk size and package limit |
| `dev begin <bytes> <crc32>` | Start staging; CRC32 is hexadecimal |
| `dev put <offset> <base64>` | Send up to 32 bytes; wait for the next-offset acknowledgment |
| `dev commit` | Verify transmission and enter installation |
| `dev status` | Transfer/install state |
| `dev abort` | Cancel uncommitted transfer or confirmation wait; active commit completes in the system |
| `dev metrics` | Read compact metrics and renew the three-second collection lease |
| `dev metrics-stop` | Stop additional rendering timing |

## Flash preparation

`diag prepare-flash` ends storage access and reboots into download mode. It interrupts the current device session and belongs to a prepared firmware-maintenance workflow.

## Troubleshooting

Check exclusive port ownership, baud rate, debug switches, LF termination, length and command-specific page requirements. Release touch before idle-only commands. `dev` has structured replies; `diag` effects appear in the display or diagnostic output. This reference follows System `runUploadCommand`.
