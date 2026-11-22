---
title: Reports, messages, and selection screens
description: Messages, texts, selection screens, events, lists, and jobs.
---

**Background job**: a program that runs without user interaction, scheduled with SM36 and monitored with SM37. Lesson [68](../course/v2/0068-variants-and-background-jobs.en.md).

**Interactive list**: a classic list where the user double-clicks a line to open a detail list (`AT LINE-SELECTION`). Lesson [67](../course/v2/0067-interactive-lists.en.md).

**Message**: a text shown to the user with `MESSAGE`, of type information, success, warning, error, or abort. Lesson [61](../course/v2/0061-messages.en.md).

**Message class**: the container of message texts, each identified by a three-digit number (transaction SE91). Lesson [61](../course/v2/0061-messages.en.md).

**`PARAMETERS`**: the statement that creates a single input field on a report's selection screen. Lesson [63](../course/v2/0063-parameters.en.md).

**Range table**: a table with the columns `SIGN`, `OPTION`, `LOW`, and `HIGH` that describes a set of values, like the one behind `SELECT-OPTIONS`. Lesson [64](../course/v2/0064-select-options-and-ranges.en.md).

**Report**: an executable program (`REPORT`), usually with a selection screen and a list or ALV output. Lessons [8](../course/v2/0008-hello-world.en.md), [66](../course/v2/0066-report-events.en.md).

**Report event**: a block the runtime executes at a precise moment of a report: `INITIALIZATION`, `AT SELECTION-SCREEN`, `START-OF-SELECTION`, and others. Lesson [66](../course/v2/0066-report-events.en.md).

**`SELECT-OPTIONS`**: the statement that creates a selection screen field for intervals and lists of values, backed by a range table. Lesson [64](../course/v2/0064-select-options-and-ranges.en.md).

**Selection screen**: a report's input screen, built with `PARAMETERS`, `SELECT-OPTIONS`, and `SELECTION-SCREEN`. Lessons [63](../course/v2/0063-parameters.en.md), [65](../course/v2/0065-selection-screen-layout.en.md).

**Text symbol**: a program text (`TEXT-001`) stored separately and translatable into other languages. Lesson [62](../course/v2/0062-text-symbols-and-translation.en.md).

**Variant**: a saved set of values for a selection screen, to reuse or to use in a background job. Lesson [68](../course/v2/0068-variants-and-background-jobs.en.md).
