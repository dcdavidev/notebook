---
title: Text symbols and translation
description: Keep texts out of the code and translate them.
---

_Basic level_

An SAP system is used in many languages at once: a user in Milan logs on in Italian, a colleague in Munich in German. A text literal such as `'Total'` in the code is shown in English to everyone. To show each user their own language, the texts must live outside the code, where translators can reach them.

Every program has a **text pool** with its **text elements**: text symbols, selection texts, the title, and list headings. They're stored per language, and the program shows the version in the user's logon language.

## Text symbols

A **text symbol** is a text with a three-character ID, such as `001` or `A01`. You maintain them in SAP GUI with **Goto > Text Elements > Text Symbols**, or in ADT by opening the program's text elements (from the program's context menu, **Open Others > Text Elements**).

```text
Text symbols of ZTEXT_DEMO
  Sym  Text                      Max. length
  001  Airline                   20
  002  Number of connections     30
  003  No data found             30
```

In the code you use a text symbol in two ways:

```abap
REPORT ztext_demo.

" 1. TEXT-nnn: the text symbol on its own
WRITE: / TEXT-001.

" 2. A literal with the symbol ID: the literal is the fallback
WRITE: / 'Number of connections'(002).
```

With the second form, the program shows text symbol `002` if it exists in the logon language, and the literal otherwise. That keeps the code readable, because you see the text where it's used.

> [!TIP]
> Text symbols work like the numbered signs in an airport. The sign says "Gate 12" in the language of each passenger's boarding pass, but the airport plan only says "sign 12". Change the language, and every sign changes without moving a single one.

In SAP GUI, double-click the symbol ID in the editor to create or open it. In ADT, the quick fix (`Ctrl+1`) on a literal like `'Airline'(001)` offers to create the text symbol.

> [!WARNING]
> `TEXT-001` on its own is empty if the symbol doesn't exist in the logon language and no fallback is configured. A missing translation then shows a blank where the text should be. Prefer the form `'Airline'(001)`, which falls back to the literal.

Text symbols also work in string templates, as normal data objects:

```abap
DATA(lv_count) = 42.
WRITE: / |{ TEXT-002 }: { lv_count }|.
```

## Selection texts and other text elements

The other text elements of a program:

| Text element    | What it is                                                              |
| --------------- | ----------------------------------------------------------------------- |
| Selection texts | the labels of `PARAMETERS` and `SELECT-OPTIONS` on the selection screen |
| Title           | the program title, shown in the title bar                               |
| List headings   | the header and column headings of a classic list                        |

Without a selection text, the selection screen shows the technical name, such as `P_CARR`. For a parameter typed with a data element, select **Dictionary Ref.** on the selection texts: the label comes from the data element, which is already translated. You'll see `PARAMETERS` in [Selection screens: PARAMETERS](./0063-parameters.md).

## Translating texts

You maintain texts in the program's **original language**, the logon language you used when you created it. Translators translate them into the other languages with transaction `SE63`, or directly from the editor with **Goto > Translation**.

In `SE63`, choose **Translation > ABAP Objects > Short Texts**, pick the object type for program texts (the text pool), and enter the program name, the source language, and the target language.

Translations are part of the program and travel in the same transport request. The same mechanism covers everything that has a text in SAP: [messages](./0061-messages.md), data element labels, domain fixed values, and the texts of Dictionary objects.

> [!CAUTION]
> Text elements must be **activated** after you change them. A program with inactive text elements shows the old texts, or none, and the change isn't transported.

## Things not to translate

Not every text belongs in the text pool. Keep these as literals:

- technical values the program compares with, such as `'X'` or `'LH'`;
- names of tables, fields, and transactions;
- texts that are never shown to users, such as keys in a log.

For texts of global classes, used for example in web services or Fiori apps, you use the text symbols of the class (in ADT: **Text Elements** of the class) in the same way.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that lists the airlines in `SCARR` with a heading line made of text symbols `001` (Airline) and `002` (Name), and a message from text symbol `003` when nothing is found.
> 2. Log on in a second language, translate the three symbols with `SE63` or **Goto > Translation**, and run the report again.

### Solution

```abap
REPORT ztext_exercise.

SELECT carrid, carrname
  FROM scarr
  INTO TABLE @DATA(lt_carriers).

IF lt_carriers IS INITIAL.
  WRITE: / 'No data found'(003).
  RETURN.
ENDIF.

WRITE: / 'Airline'(001), 20 'Name'(002).
ULINE.
LOOP AT lt_carriers INTO DATA(ls_carrier).
  WRITE: / ls_carrier-carrid, 20 ls_carrier-carrname.
ENDLOOP.
```

After the translation, the headings appear in the language you log on with. The airline names come from the database and don't change.

> [!NOTE]
>
> - Text elements (text symbols, selection texts, title, list headings) keep user texts out of the code.
> - Use `'literal'(nnn)`: it shows the text symbol and falls back to the literal.
> - Select **Dictionary Ref.** for selection texts to reuse the data element's translated label.
> - Translate with `SE63` or **Goto > Translation**; translations travel with the program.
> - Activate text elements after every change.
