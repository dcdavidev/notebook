---
title: Authorization
description: Authorization, Authorization object, AUTHORITY-CHECK.
---

## Authorization

Il permesso di un utente su un oggetto di autorizzazione; il codice lo verifica con `AUTHORITY-CHECK`. Lezione [110](../course/0110-authorization-checks.md).

## Authorization object

L'oggetto che raggruppa i campi da controllare per un permesso, per esempio la compagnia aerea e l'attività; si assegna agli utenti con i ruoli in PFCG. Lezione [110](../course/0110-authorization-checks.md).

## `AUTHORITY-CHECK`

L'istruzione che verifica se l'utente ha un oggetto di autorizzazione con i valori richiesti; il risultato è in `sy-subrc`. Lezione [110](../course/0110-authorization-checks.md).
