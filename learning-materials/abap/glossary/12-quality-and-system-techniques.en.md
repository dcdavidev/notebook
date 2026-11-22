---
title: Tests, quality, and system techniques
description: Tests, code checks, authorizations, logs, updates, and dynamic programming.
---

**ABAP Unit**: the framework for automated unit tests: local test classes marked `FOR TESTING` and assertions from `CL_ABAP_UNIT_ASSERT`. Lesson [105](../course/v2/0105-abap-unit-basics.en.md).

**Application log**: the standard log of a process's messages, stored in the database and viewed with SLG1. Lesson [112](../course/v2/0112-application-log.en.md).

**ATC (ABAP Test Cockpit)**: the tool that runs static checks on code: errors, performance, security, and style rules. Lesson [107](../course/v2/0107-code-quality.en.md).

**Authorization**: a user's permission on an authorization object; code checks it with `AUTHORITY-CHECK`. Lesson [110](../course/v2/0110-authorization-checks.en.md).

**Change document**: the record of who changed which fields of a business object, when, and with which old and new values. Lesson [118](../course/v2/0118-change-documents.en.md).

**Clean ABAP**: SAP's style guide for readable, maintainable ABAP code, based on _Clean Code_. Lesson [107](../course/v2/0107-code-quality.en.md).

**Dependency injection**: handing a class the objects it depends on instead of letting it create them, so tests can replace them with _test doubles_. Lesson [106](../course/v2/0106-test-doubles.en.md).

**Dynamic SQL**: a `SELECT` whose table, fields, or conditions are strings decided at runtime. Lesson [117](../course/v2/0117-dynamic-sql-and-calls.en.md).

**Number range**: the object that hands out unique sequential numbers, for example for document numbers (transaction SNRO). Lesson [111](../course/v2/0111-number-ranges.en.md).

**Parallel processing**: running parts of a job in several processes at the same time, with asynchronous RFCs or background jobs. Lesson [114](../course/v2/0114-parallel-processing.en.md).

**RTTS (Runtime Type Services)**: the classes that describe a type at runtime (RTTI) and create new ones (RTTC), such as `CL_ABAP_TYPEDESCR`. Lesson [115](../course/v2/0115-rtts.en.md).

**Test double**: a fake object that replaces a real dependency (database, API) during a test. Lesson [106](../course/v2/0106-test-doubles.en.md).

**Update function module**: a function module called `IN UPDATE TASK` that writes to the database only at `COMMIT WORK`, in a separate process. Lesson [113](../course/v2/0113-update-task.en.md).
