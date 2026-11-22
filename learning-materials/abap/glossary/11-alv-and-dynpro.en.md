---
title: ALV and Dynpro
description: ALV lists and the classic SAP GUI screens.
---

**ALV (ABAP List Viewer)**: the standard tool for displaying data tables with sorting, filters, totals, and export; used through `CL_SALV_TABLE` or `CL_GUI_ALV_GRID`. Lessons [99](../course/v2/0099-alv-with-salv.en.md), [100](../course/v2/0100-alv-grid-control.en.md).

**Dynpro**: a classic SAP GUI screen, with its layout and flow logic (transaction SE51). Lesson [101](../course/v2/0101-dynpro-basics.en.md).

**Flow logic**: the code of a Dynpro that connects the screen to ABAP modules, split into PBO and PAI. Lesson [102](../course/v2/0102-dynpro-flow-logic.en.md).

**GUI status**: the set of menus, buttons, and function keys of a screen, set with `SET PF-STATUS`. Lesson [104](../course/v2/0104-gui-status-and-popups.en.md).

**PAI, PBO**: the two phases of a Dynpro's flow logic: _Process Before Output_, before the screen is shown, and _Process After Input_, after the user acts. Lesson [102](../course/v2/0102-dynpro-flow-logic.en.md).
