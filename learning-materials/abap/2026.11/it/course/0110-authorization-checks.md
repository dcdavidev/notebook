---
title: I controlli di autorizzazione
description: Oggetti di autorizzazione, AUTHORITY-CHECK e ruoli.
level: intermediate
---

In un sistema SAP, fare il logon non significa poter fare tutto. Ogni utente ha delle **autorizzazioni** che dicono quali dati può visualizzare, modificare o cancellare: un impiegato di Roma può modificare le prenotazioni di Alitalia ma solo visualizzare quelle di Lufthansa. Le transazioni standard controllano queste autorizzazioni ovunque.

I tuoi programmi devono fare lo stesso. ABAP SQL non controlla le autorizzazioni: una `SELECT` legge ogni riga, chiunque la esegua. Il controllo è compito tuo, con l'istruzione `AUTHORITY-CHECK`.

## Gli oggetti di autorizzazione

Un **oggetto di autorizzazione** descrive un tipo di azione protetta. Ha fino a 10 **campi**, di solito uno o più campi organizzativi e il campo `ACTVT` (attività). Trovi gli oggetti nella transazione `SU21`, raggruppati in classi di oggetti.

Il modello dei voli ha un suo oggetto, `S_CARRID`:

| Campo    | Significato     | Valori di esempio                                                |
| -------- | --------------- | ---------------------------------------------------------------- |
| `CARRID` | compagnia aerea | `LH`, `AZ`, `*`                                                  |
| `ACTVT`  | attività        | `01` creare, `02` modificare, `03` visualizzare, `06` cancellare |

Un'**autorizzazione** è un'istanza dell'oggetto con dei valori per i suoi campi, per esempio "`CARRID` = `AZ`, `ACTVT` = `01`, `02`, `03`". Le autorizzazioni sono raccolte in **ruoli**, mantenuti con la transazione `PFCG`, e i ruoli vengono assegnati agli utenti in `SU01`. Tu scrivi il controllo; il team di sicurezza decide chi riceve quale ruolo.

> [!TIP]
> Un oggetto di autorizzazione è il tipo di chiave, come "chiave delle porte degli uffici". Un'autorizzazione è una chiave precisa, tagliata per alcune porte. Il ruolo è il mazzo di chiavi consegnato a un dipendente, e `AUTHORITY-CHECK` è la serratura della porta.

## AUTHORITY-CHECK

`AUTHORITY-CHECK` chiede: l'utente corrente ha un'autorizzazione per questo oggetto con questi valori?

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  AUTHORITY-CHECK OBJECT 'S_CARRID'
    ID 'CARRID' FIELD p_carrid
    ID 'ACTVT'  FIELD '03'.                " visualizzare

  IF sy-subrc <> 0.
    MESSAGE |Non sei autorizzato a visualizzare la compagnia { p_carrid }| TYPE 'E'.
  ENDIF.

  SELECT FROM sflight
    FIELDS carrid, connid, fldate, price
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).
```

Il risultato è in `sy-subrc`:

| `sy-subrc` | Significato                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| 0          | autorizzato                                                                  |
| 4          | l'utente ha l'oggetto, ma non con questi valori                              |
| 12         | l'utente non ha nessuna autorizzazione per questo oggetto                    |
| altro      | il controllo stesso è sbagliato, per esempio un nome di campo che non esiste |

Indica tutti i campi dell'oggetto. Per un campo che non vuoi controllare, scrivi `ID 'campo' DUMMY`: significa "qualsiasi valore". Omettere un campo non è permesso.

> [!WARNING]
> Controlla sempre `sy-subrc` subito dopo `AUTHORITY-CHECK`. Un controllo di cui ignori il risultato non protegge niente, ed è uno dei finding che segnalano i controlli di sicurezza dell'[ATC](./0107-code-quality.md).

## Controllare ogni riga

Quando un report legge dati per molti valori organizzativi, controlla ogni valore, non solo l'input. Togli le righe che l'utente non può vedere:

```abap
SELECT FROM sflight
  FIELDS carrid, connid, fldate, price
  INTO TABLE @DATA(lt_flights).

DATA lt_denied TYPE RANGE OF s_carr_id.

LOOP AT lt_flights INTO DATA(ls_flight)
     GROUP BY ls_flight-carrid INTO DATA(lv_carrid).
  AUTHORITY-CHECK OBJECT 'S_CARRID'
    ID 'CARRID' FIELD lv_carrid
    ID 'ACTVT'  FIELD '03'.
  IF sy-subrc <> 0.
    lt_denied = VALUE #( BASE lt_denied ( sign = 'I' option = 'EQ' low = lv_carrid ) ).
  ENDIF.
ENDLOOP.

IF lt_denied IS NOT INITIAL.                 " un range vuoto corrisponderebbe a tutte le righe
  DELETE lt_flights WHERE carrid IN lt_denied.
ENDIF.
```

Il [raggruppamento](./0095-grouping-internal-tables.md) esegue il controllo una volta per compagnia invece che una volta per riga. Nelle viste CDS, la stessa protezione a livello di riga si dichiara con il [controllo accessi](./0136-cds-access-control.md) e viene applicata automaticamente.

## Oggetti tuoi e altri controlli

Per i tuoi dati, crea un oggetto in `SU21`, per esempio `ZFLIGHT` con i campi `CARRID` e `ACTVT`, e controllalo come uno standard. Alcuni altri controlli che userai spesso:

- **Transazioni**: l'avvio di una transazione controlla l'oggetto `S_TCODE`. Se il tuo programma chiama un'altra transazione, usa `CALL TRANSACTION 'ZFLIGHT' WITH AUTHORITY-CHECK` o il modulo funzione `AUTHORITY_CHECK_TCODE`.
- **Report**: assegna al programma un gruppo di autorizzazioni nei suoi attributi; lo protegge l'oggetto `S_PROGRAM`.
- **Tabelle in SM30**: l'oggetto `S_TABU_DIS` controlla il gruppo di autorizzazioni della tabella.

Per trovare un'autorizzazione mancante, l'utente esegue `SU53` subito dopo l'errore: mostra l'ultimo controllo fallito. Per un quadro completo, registra tutti i controlli di una sessione con la traccia delle autorizzazioni (`STAUTHTRACE`).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report con un parametro per la compagnia che controlla `S_CARRID` in visualizzazione prima di leggere `SFLIGHT`.
> 2. Aggiungi una checkbox "Modalità modifica" che controlla l'attività `02` invece di `03`.
> 3. Eseguilo con una compagnia per cui non sei autorizzato, poi guarda l'autorizzazione fallita in `SU53`.

### Soluzione

```abap
REPORT zflight_auth.

PARAMETERS: p_carrid TYPE s_carr_id DEFAULT 'LH',
            p_change AS CHECKBOX.

START-OF-SELECTION.
  DATA(lv_actvt) = COND activ_auth( WHEN p_change = abap_true THEN '02' ELSE '03' ).

  AUTHORITY-CHECK OBJECT 'S_CARRID'
    ID 'CARRID' FIELD p_carrid
    ID 'ACTVT'  FIELD lv_actvt.
  IF sy-subrc <> 0.
    MESSAGE |Nessuna autorizzazione per la compagnia { p_carrid }, attività { lv_actvt }| TYPE 'E'.
  ENDIF.

  SELECT FROM sflight FIELDS * WHERE carrid = @p_carrid INTO TABLE @DATA(lt_flights).
  cl_demo_output=>display( lt_flights ).
```

> [!NOTE]
>
> - ABAP SQL non controlla le autorizzazioni: il tuo programma deve chiamare `AUTHORITY-CHECK`.
> - Un oggetto di autorizzazione (`SU21`) ha campi come `CARRID` e `ACTVT`; i ruoli (`PFCG`) danno agli utenti le autorizzazioni su di esso.
> - Indica tutti i campi dell'oggetto, con `DUMMY` per quelli che non controlli, e verifica sempre `sy-subrc`.
> - Controlla ogni valore organizzativo che leggi, non solo l'input dell'utente.
> - `SU53` mostra l'ultimo controllo fallito; `STAUTHTRACE` li registra tutti.
