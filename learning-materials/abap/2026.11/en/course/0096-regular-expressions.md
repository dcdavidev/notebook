---
title: FIND, REPLACE, and regular expressions
description: Search and change text with patterns.
level: intermediate
---

[Working with strings](./0021-working-with-strings.md) covered concatenating, splitting, and changing the case of text. This lesson is about searching inside it: finding a word, replacing every occurrence of it, and, with **regular expressions**, finding text that matches a pattern, such as "two letters followed by four digits". You'll use this to validate input, clean up uploaded files, and pull values out of free text.

## FIND

`FIND` searches for a substring. `sy-subrc` is `0` if it's found and `4` if not:

```abap
REPORT zfind_replace.

DATA(lv_text) = `Flight LH 0400 from Frankfurt to New York, LH 0402 back`.

FIND `LH` IN lv_text MATCH OFFSET DATA(lv_offset).
IF sy-subrc = 0.
  WRITE: / 'First LH at offset', lv_offset.            " 7
ENDIF.

FIND ALL OCCURRENCES OF `lh` IN lv_text
     IGNORING CASE
     MATCH COUNT DATA(lv_count).
WRITE: / 'Occurrences:', lv_count.                     " 2
```

| Addition                       | Effect                                             |
| ------------------------------ | -------------------------------------------------- |
| `FIRST OCCURRENCE OF`          | the default: stop at the first match               |
| `ALL OCCURRENCES OF`           | find every match                                   |
| `IGNORING CASE`                | uppercase and lowercase are the same               |
| `MATCH OFFSET`, `MATCH LENGTH` | position and length of the (last) match            |
| `MATCH COUNT`                  | number of matches                                  |
| `RESULTS`                      | every match, in a table of type `match_result_tab` |
| `IN TABLE`                     | search all rows of an internal table of strings    |

## REPLACE

`REPLACE` changes the first occurrence, or all of them, and sets `sy-subrc` to `0` if it replaced something:

```abap
DATA(lv_route) = `ROME - FRANKFURT - NEW YORK`.

REPLACE ` - ` IN lv_route WITH ` > `.                   " only the first
REPLACE ALL OCCURRENCES OF ` - ` IN lv_route WITH ` > `
        REPLACEMENT COUNT DATA(lv_replaced).
WRITE: / lv_route, lv_replaced.                         " ROME > FRANKFURT > NEW YORK 1
```

The search text and the replacement are operands of any character type. Use string literals with backquotes when blanks matter: in a `c` literal like `' - '` trailing blanks are ignored.

## Regular expressions

A **regular expression** (regex) describes a pattern instead of a fixed text. Since ABAP 7.55 the recommended regex engine is **PCRE** (Perl Compatible Regular Expressions), used with the addition `PCRE`. The older `REGEX` addition uses POSIX syntax; it's obsolete, but you'll still find it in existing code.

The most common elements:

| Pattern          | Matches                                    |
| ---------------- | ------------------------------------------ |
| `.`              | any character                              |
| `\d`, `\w`, `\s` | a digit, a word character, a blank         |
| `[A-Z]`          | one character in the range                 |
| `[^0-9]`         | one character that is **not** in the range |
| `x*`, `x+`, `x?` | zero or more, one or more, zero or one `x` |
| `x{4}`, `x{2,3}` | exactly 4, between 2 and 3 `x`             |
| `^`, `$`         | start and end of the text                  |
| `( ... )`        | a group, which you can read as a submatch  |
| `a\|b`           | `a` or `b`                                 |

> [!TIP]
> A plain search is like looking for a specific name in a phone book. A regular expression is like asking for "every surname that starts with M and has five letters": you describe the shape of what you want, and the engine finds everything that fits.

## FIND and REPLACE with PCRE

With `SUBMATCHES` you get the text of each group:

```abap
DATA(lv_flight_code) = `LH0400`.

FIND PCRE `^([A-Z0-9]{2})(\d{4})$` IN lv_flight_code
     SUBMATCHES DATA(lv_carrid) DATA(lv_connid).
IF sy-subrc = 0.
  WRITE: / 'Carrier', lv_carrid, 'connection', lv_connid.
ELSE.
  WRITE: / 'Not a flight code'.
ENDIF.
```

In the replacement text, `$1`, `$2`, ... insert the groups. This turns ISO dates into the European format:

```abap
DATA(lv_dates) = `Departures: 2026-12-15, 2026-12-22`.
REPLACE ALL OCCURRENCES OF PCRE `(\d{4})-(\d{2})-(\d{2})` IN lv_dates WITH `$3.$2.$1`.
WRITE / lv_dates.                                       " Departures: 15.12.2026, 22.12.2026
```

To list every match, use `RESULTS`:

```abap
FIND ALL OCCURRENCES OF PCRE `[A-Z]{2} \d{4}` IN lv_text RESULTS DATA(lt_results).
LOOP AT lt_results INTO DATA(ls_result).
  WRITE / substring( val = lv_text off = ls_result-offset len = ls_result-length ).
ENDLOOP.                                                " LH 0400, LH 0402
```

## Built-in functions with patterns

The string functions accept a `pcre` parameter too (or `regex` for POSIX, or `sub` for a plain text), so you can use patterns inside expressions:

```abap
DATA(lv_email) = `mario.rossi@example.com`.

IF matches( val = lv_email pcre = `^[\w.+-]+@[\w-]+(\.[\w-]+)+$` ).
  WRITE / 'Valid email'.
ENDIF.

DATA(lv_numbers) = count( val = lv_text pcre = `\d+` ).                 " 2
DATA(lv_first)   = match( val = lv_text pcre = `\d{4}` occ = 1 ).        " 0400
DATA(lv_clean)   = replace( val = lv_text pcre = `\s+` with = ` ` occ = 0 ).
DATA(lv_pos)     = find( val = lv_text pcre = `New\s+York` ).           " offset, or -1
```

`occ = 0` in `replace( )` means all occurrences. `contains( val = ... pcre = ... )` is a predicate like `matches( )`, but true if the pattern occurs anywhere in the text. For repeated use of the same complex pattern, the classes `CL_ABAP_REGEX` and `CL_ABAP_MATCHER` let you compile it once and reuse it.

> [!WARNING]
> Regular expressions are easy to get almost right. A pattern without `^` and `$` also matches inside longer text, so `\d{4}` accepts `12345`. Test patterns with real data, including wrong input, and keep them short: a regex nobody can read is a bug waiting to happen. For simple fixed texts, plain `FIND` and `REPLACE` are faster and clearer.

## Exercise

> [!IMPORTANT]
>
> 1. Fill a `string_table` with these lines: `LH0400 ok`, `AA17 bad`, `AZ0555 ok`, `XX12345 bad`.
> 2. For each line, use `FIND PCRE` with `SUBMATCHES` to check whether it starts with a valid flight code (two letters or digits followed by exactly four digits and a blank) and print carrier and connection.
> 3. Use `replace( )` to mask all the digits of the line `Card 4111 1111 1111 1111` with `*`.

### Solution

```abap
DATA(lt_lines) = VALUE string_table( ( `LH0400 ok` ) ( `AA17 bad` )
                                     ( `AZ0555 ok` ) ( `XX12345 bad` ) ).

LOOP AT lt_lines INTO DATA(lv_line).
  FIND PCRE `^([A-Z0-9]{2})(\d{4})\s` IN lv_line
       SUBMATCHES DATA(lv_carr) DATA(lv_conn).
  IF sy-subrc = 0.
    WRITE: / lv_carr, lv_conn.
  ELSE.
    WRITE: / 'Invalid:', lv_line.
  ENDIF.
ENDLOOP.

DATA(lv_masked) = replace( val = `Card 4111 1111 1111 1111` pcre = `\d` with = `*` occ = 0 ).
WRITE / lv_masked.                                      " Card **** **** **** ****
```

> [!NOTE]
>
> - `FIND` and `REPLACE` search and change substrings; `sy-subrc` is `0` on success.
> - `ALL OCCURRENCES`, `IGNORING CASE`, `MATCH COUNT`, `MATCH OFFSET`, and `RESULTS` control and report the search.
> - The `PCRE` addition (ABAP 7.55 and later) uses regular expressions; `REGEX` (POSIX) is obsolete.
> - `SUBMATCHES` reads the groups of a match, and `$1`, `$2` insert them in a replacement.
> - The functions `matches`, `contains`, `find`, `count`, `match`, and `replace` accept a `pcre` parameter for use inside expressions.
