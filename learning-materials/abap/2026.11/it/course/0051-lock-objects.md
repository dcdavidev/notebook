---
title: Gli oggetti di blocco
description: Il concetto di blocco SAP, ENQUEUE e DEQUEUE.
level: basic
---

Quando due utenti modificano lo stesso record nello stesso momento, il secondo salvataggio può sovrascrivere il primo senza che nessuno se ne accorga. Il database blocca le righe solo per il brevissimo tempo di una transazione di database, mentre una transazione di business SAP ne comprende molte, distribuite su più schermate. Per questo SAP ha un suo meccanismo di blocco: il **concetto di blocco SAP**.

Definisci un **oggetto di blocco** nel Dizionario e il sistema genera due moduli funzione: uno per impostare il blocco (**enqueue**) e uno per rilasciarlo (**dequeue**). Ogni programma che modifica i dati chiede prima il blocco.

## Come funzionano i blocchi SAP

I blocchi vivono in una **tabella dei blocchi**, nella memoria principale dell'**enqueue server**, una parte centrale del sistema. Un programma chiede all'enqueue server un blocco su una chiave, per esempio la compagnia aerea `LH`. Se nessun altro ha un blocco in conflitto, il server lo registra; altrimenti lo rifiuta.

Il punto chiave: i blocchi SAP sono **logici**. Non impediscono a nessuno di scrivere nella tabella. Funzionano solo perché tutti i programmi che modificano i dati seguono la regola "prima blocco, poi modifico". Un programma che salta l'enqueue ignora qualsiasi blocco.

> [!TIP]
> I blocchi SAP sono come il cartello "occupato" sulla porta di una sala riunioni. Il cartello non chiude la porta a chiave: funziona perché tutti si sono messi d'accordo di guardarlo prima di entrare. Chi lo ignora può entrare lo stesso.

## Creare un oggetto di blocco

In `SE11` crea un oggetto di blocco. Il nome deve cominciare con `E`, quindi uno custom comincia con `EZ` o `EY`. Per la tabella `ZSCARR` (una copia di `SCARR`) chiamalo `EZSCARR`:

```text
SE11 > Oggetto di blocco EZSCARR > Crea
  Scheda Tabelle:
    Tabella primaria:  ZSCARR
    Modo di blocco:    Blocco in scrittura
  Scheda Parametri di blocco (proposti dalla chiave):
    MANDT
    CARRID
```

Puoi aggiungere tabelle secondarie legate da chiavi esterne, per esempio una tabella di testata e le sue posizioni. Quando lo attivi, il sistema genera:

- `ENQUEUE_EZSCARR`: imposta il blocco;
- `DEQUEUE_EZSCARR`: lo rilascia.

I parametri di blocco diventano parametri di importazione di questi moduli funzione.

### I modi di blocco

| Modo | Nome                      | Significato                                                                                   |
| ---- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `E`  | esclusivo, cumulativo     | blocco in scrittura; lo stesso programma può richiederlo di nuovo; gli altri non lo ottengono |
| `S`  | condiviso                 | blocco in lettura; più utenti possono averlo; intanto nessuno ottiene un blocco `E` o `X`     |
| `X`  | esclusivo, non cumulativo | come `E`, ma nemmeno lo stesso programma può richiederlo una seconda volta                    |

Usa `E` per modificare i dati e `S` quando leggi dati che non devono cambiare mentre ci lavori.

## Impostare e rilasciare un blocco

I moduli funzione generati li chiami con `CALL FUNCTION`. I moduli funzione li vedrai nel dettaglio in [I moduli funzione](./0070-function-modules.md); qui ti basta la chiamata.

```abap
REPORT zlock_demo.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  CALL FUNCTION 'ENQUEUE_EZSCARR'
    EXPORTING
      mode_zscarr    = 'E'           " blocco in scrittura
      carrid         = p_carr
    EXCEPTIONS
      foreign_lock   = 1             " il blocco ce l'ha qualcun altro
      system_failure = 2
      OTHERS         = 3.

  IF sy-subrc <> 0.
    WRITE: / 'La compagnia', p_carr, 'è bloccata dall''utente', sy-msgv1.
    RETURN.
  ENDIF.

  WRITE: / 'Blocco impostato. Qui modifichi i dati.'.

  CALL FUNCTION 'DEQUEUE_EZSCARR'
    EXPORTING
      mode_zscarr = 'E'
      carrid      = p_carr.

  WRITE: / 'Blocco rilasciato.'.
```

- `MANDT` viene riempito automaticamente con il mandante corrente.
- Se lasci vuoto un parametro di chiave, il blocco copre **tutti** i valori di quel campo: un `CARRID` vuoto blocca tutte le compagnie.
- Dopo `FOREIGN_LOCK`, `sy-msgv1` contiene l'utente che ha il blocco.
- Il parametro `_WAIT` fa ritentare l'enqueue per qualche secondo prima di arrendersi.
- Il parametro `_SCOPE` decide quando finisce il blocco. Con il valore di default `2` viene rilasciato al `COMMIT WORK` o al `ROLLBACK WORK` (vedi [La LUW](./0060-luw-commit-and-rollback.md)) oppure alla fine del programma.

> [!WARNING]
> Controlla sempre `sy-subrc` dopo l'enqueue e modifica i dati solo se vale `0`. Un programma che ignora un enqueue fallito sovrascrive il lavoro di qualcun altro, e il blocco non è servito a niente.

## Controllare i blocchi con SM12

La transazione `SM12` elenca i blocchi attuali: utente, tabella, argomento di blocco e modo. Esegui il tuo report, fermalo nel debugger dopo l'enqueue e vedrai il tuo blocco in `SM12`. Prova a eseguire il report in una seconda sessione nello stesso momento: riceve `FOREIGN_LOCK`.

> [!CAUTION]
> `SM12` permette a un amministratore di cancellare un blocco. Fallo solo se la sessione del proprietario non esiste davvero più: se il programma è ancora in esecuzione, cancellare il suo blocco permette a un altro utente di modificare gli stessi dati nello stesso momento.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea l'oggetto di blocco `EZSCARR` sulla tua tabella `ZSCARR`.
> 2. Esegui `ZLOCK_DEMO` con un breakpoint dopo l'enqueue e guarda il blocco in `SM12`.
> 3. Mentre la prima sessione è ferma, esegui il report in una seconda sessione con la stessa compagnia e leggi il messaggio.

### Soluzione

L'oggetto di blocco e il report sono quelli di questa lezione. La seconda sessione non ottiene il blocco, quindi `ENQUEUE_EZSCARR` restituisce `sy-subrc = 1` e il report scrive "La compagnia LH è bloccata dall'utente" seguito dal tuo nome utente, perché il blocco ce l'hai tu nella prima sessione.

> [!NOTE]
>
> - I blocchi SAP proteggono i dati per un'intera transazione di business, non solo per una transazione di database.
> - Un oggetto di blocco (nome che comincia con `EZ`) genera i moduli funzione `ENQUEUE_...` e `DEQUEUE_...`.
> - I blocchi sono logici: funzionano solo se ogni programma li chiede prima di modificare i dati.
> - Usa il modo `E` per scrivere e `S` per leggere; controlla `sy-subrc` dopo ogni enqueue.
> - `SM12` mostra i blocchi attuali.
