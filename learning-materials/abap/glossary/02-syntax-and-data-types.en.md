---
title: Syntax and data types
description: The language rules, variables, types, conversions, and strings.
---

**`abap_bool`, `abap_true`, `abap_false`**: the type and the constants for Boolean values: in ABAP true is `'X'` and false is a blank. Lesson [16](../course/v2/0016-boolean-values.en.md).

**Character types**: the types for text: `c` with fixed length, `n` for numeric text, `string` with variable length. Lesson [13](../course/v2/0013-character-types.en.md).

**Constant**: a data object with a fixed value, declared with `CONSTANTS`, that cannot change at runtime. Lesson [12](../course/v2/0012-variables-and-constants.en.md).

**Date and time types**: the types `d` (date, `YYYYMMDD`), `t` (time, `HHMMSS`), `utclong`, and time stamps, which support calculations. Lesson [15](../course/v2/0015-date-and-time-types.en.md).

**Inline declaration**: declaring a variable where it is first used, with `DATA(...)` or `FIELD-SYMBOL(...)`, with the type inferred from the context. Lesson [18](../course/v2/0018-inline-declarations.en.md).

**`LIKE`**: the addition that declares a data object with the same type as another existing data object. Lesson [17](../course/v2/0017-types-and-like.en.md).

**Numeric types**: the types for numbers: `i` and `int8` integers, `p` packed with fixed decimals, `decfloat16` and `decfloat34`, `f` binary floating point. Lesson [14](../course/v2/0014-numeric-types.en.md).

**Pretty printer**: the editor feature that reformats code: indentation and upper or lower case for keywords. Lesson [10](../course/v2/0010-comments-and-formatting.en.md).

**String template**: a string between vertical bars (`|...|`) with expressions in curly braces `{ }` and formatting options. Lesson [22](../course/v2/0022-string-templates.en.md).

**`sy-subrc`**: the return code of the last statement: `0` means success. Check it after `SELECT`, `READ TABLE`, and calls. Lesson [23](../course/v2/0023-system-fields.en.md).

**System field**: a field of the `sy` structure that the runtime fills automatically: `sy-subrc`, `sy-tabix`, `sy-datum`, `sy-uname`, and others. Lesson [23](../course/v2/0023-system-fields.en.md).

**Type conversion**: turning a value of one type into another, either automatically by the conversion rules or explicitly with `CONV` and `EXACT`. Lesson [19](../course/v2/0019-type-conversions.en.md).

**`TYPES`**: the statement that defines a local data type, to use later with `TYPE`. Lesson [17](../course/v2/0017-types-and-like.en.md).

**Variable**: a named data object, declared with `DATA`, whose value can change at runtime. Lesson [12](../course/v2/0012-variables-and-constants.en.md).

**`WRITE`**: the statement that prints text and values on a classic list. Lesson [11](../course/v2/0011-output-with-write.en.md).

**`xsdbool`**: the function that turns a logical expression into `abap_true` or `abap_false`. Lesson [16](../course/v2/0016-boolean-values.en.md).
