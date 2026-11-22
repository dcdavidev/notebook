---
title: Authorization
description: Authorization, Authorization object, AUTHORITY-CHECK.
---

## Authorization

A user's permission on an authorization object; code checks it with `AUTHORITY-CHECK`. Lesson [110](../course/0110-authorization-checks.md).

## Authorization object

The object that groups the fields checked for a permission, for example the airline and the activity; it is given to users through roles in PFCG. Lesson [110](../course/0110-authorization-checks.md).

## `AUTHORITY-CHECK`

The statement that checks whether the user has an authorization object with the given values; the result is in `sy-subrc`. Lesson [110](../course/0110-authorization-checks.md).
