---
title: System field
description: System field, sy-subrc, sy-tabix.
---

## System field

A field of the `sy` structure that the runtime fills automatically: `sy-subrc`, `sy-tabix`, `sy-datum`, `sy-uname`, and others. Lesson [23](../course/0023-system-fields.md).

## `sy-subrc`

The return code of the last statement: `0` means success. Check it after `SELECT`, `READ TABLE`, and calls. Lesson [23](../course/0023-system-fields.md).

## `sy-tabix`

The system field with the index of the current row in a `LOOP AT`, or of the last row read with `READ TABLE`. Lessons [23](../course/0023-system-fields.md), [38](../course/0038-looping-internal-tables.md).
