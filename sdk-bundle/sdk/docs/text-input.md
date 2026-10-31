# Text input capacity

`keyboard.show` accepts `maximum_length` from 1 to 8192 **UTF-8 bytes**. The default remains 64 bytes. Native and JavaScript applications use the same validation and completion result. Applications choose a smaller maximum for filenames, credentials or other constrained fields.

Initial text must fit the requested maximum and contain valid UTF-8. Cursor offsets are UTF-8 byte offsets at code-point boundaries. Invalid or oversized options return `DT_ERR_INVALID_ARGUMENT`; allocation failure returns `DT_ERR_OUT_OF_MEMORY`. The options JSON limit accommodates an escaped 8192-byte initial value.

Document editor text and the JavaScript document layout/editor helpers support 8192 bytes. Layout storage grows in PSRAM for longer documents and is released with the editing session. Text property storage remains subject to the component tree's aggregate 64 KiB budget.

The Files application reads UTF-8 text files up to 16384 bytes and edits files up to 8192 bytes. Files above the editing limit remain viewable up to the reading limit. Save uses the existing content-digest conflict check and transactional replacement. An external change is reported before replacement.

Example keyboard options:

```json
{"input_type":"multiline","presentation":"plain_text","maximum_length":8192,"initial":""}
```

The capacity constants are in `desktile/text_limits.hpp`. Byte limits include spaces and line breaks; the terminating zero byte is allocated separately.
