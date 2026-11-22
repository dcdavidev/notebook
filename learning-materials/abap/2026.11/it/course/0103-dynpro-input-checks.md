---
title: I controlli di input sulle schermate
description: FIELD, CHAIN, messaggi di errore e comandi di uscita.
---

_Livello intermedio_

Una schermata non deve accettare dati sbagliati. I dynpro controllano l'input in due modi: alcuni controlli vengono eseguiti **automaticamente** prima del PAI, gli altri li scrivi tu nei moduli PAI con le istruzioni di flow logic `FIELD` e `CHAIN`. In entrambi i casi parte un messaggio di errore e l'utente resta sulla schermata finché l'input non è corretto, con aperti alla modifica solo i campi sbagliati.

Questa lezione parte dalla [flow logic](./0102-dynpro-flow-logic.md). Le stesse idee valgono per le selection screen, dove controlli l'input in `AT SELECTION-SCREEN` (vedi [gli eventi dei report](./0066-report-events.md)).

## I controlli automatici

Prima che venga eseguito il primo modulo PAI, il sistema controlla:

- **Campi obbligatori**: i campi con l'attributo Obbligatorio (mostrati con un segno di spunta) devono essere compilati.
- **Formato**: un campo data deve contenere una data valida, un campo numerico un numero.
- **Controlli del Dizionario** per i campi presi dal Dizionario ABAP: il valore deve esistere nella tabella di controllo della [chiave esterna](./0047-foreign-keys-and-check-tables.md) o nei valori fissi del dominio.

Per questi controlli non scrivi codice. Se uno fallisce, il sistema mostra un messaggio di errore e di nuovo la schermata, prima che venga eseguito qualsiasi tuo modulo.

## FIELD: controllare un campo

Senza `FIELD`, tutti i campi di schermata vengono copiati nel programma all'inizio del PAI. Con `FIELD`, un campo viene copiato solo quando la flow logic arriva alla sua istruzione `FIELD`, e il modulo che la segue può controllarlo:

```abap
PROCESS AFTER INPUT.
  FIELD scarr-carrid MODULE check_carrid.
  MODULE user_command_0100.
```

```abap
MODULE check_carrid INPUT.
  SELECT SINGLE carrname FROM scarr
    WHERE carrid = @scarr-carrid
    INTO @scarr-carrname.
  IF sy-subrc <> 0.
    MESSAGE |La compagnia { scarr-carrid } non esiste| TYPE 'E'.
  ENDIF.
ENDMODULE.
```

Un messaggio di errore (tipo `E`) in un modulo chiamato da `FIELD` ferma il PAI e mostra di nuovo la schermata: tutti i campi sono chiusi tranne `SCARR-CARRID`, con il cursore sopra. Quando l'utente corregge il valore e preme Invio, il PAI ricomincia dall'inizio.

| Tipo di messaggio | Effetto in un controllo PAI                                     |
| ----------------- | --------------------------------------------------------------- |
| `E` errore        | il PAI si ferma; solo i campi controllati sono aperti all'input |
| `W` warning       | come `E`, ma con Invio il valore è accettato e il PAI continua  |
| `I` informazione  | un popup; il PAI continua                                       |
| `S` successo      | un messaggio nella barra di stato; il PAI continua              |

Due aggiunte limitano quando il modulo viene eseguito:

- `FIELD f MODULE m ON INPUT.` esegue `m` solo se il campo non è iniziale.
- `FIELD f MODULE m ON REQUEST.` esegue `m` solo se in questo giro l'utente ha scritto qualcosa nel campo.

> [!WARNING]
> Non inviare mai un messaggio di errore da un modulo PAI che non sta sotto `FIELD` o `CHAIN`. La schermata torna con **tutti** i campi chiusi, e l'utente può solo uscire dalla transazione.

## CHAIN: controllare più campi insieme

Quando un controllo riguarda più di un campo, mettili in un blocco `CHAIN`. Se il modulo invia un errore, tutti i campi della catena tornano aperti.

```abap
PROCESS AFTER INPUT.
  FIELD scarr-carrid MODULE check_carrid.

  CHAIN.
    FIELD: gv_date_from, gv_date_to.
    MODULE check_dates ON CHAIN-REQUEST.
  ENDCHAIN.

  MODULE user_command_0100.
```

```abap
MODULE check_dates INPUT.
  IF gv_date_to < gv_date_from.
    MESSAGE 'La data di fine è precedente alla data di inizio' TYPE 'E'.
  ENDIF.
ENDMODULE.
```

`ON CHAIN-REQUEST` esegue il modulo se l'utente ha cambiato almeno un campo della catena; `ON CHAIN-INPUT` se almeno uno non è iniziale. Senza aggiunte, il modulo viene sempre eseguito.

> [!TIP]
> `CHAIN` è come il cassiere che controlla insieme la data e l'importo di un assegno. Se non tornano, ti restituisce l'intero assegno da correggere, non una sola casella.

## I comandi di uscita

I controlli automatici hanno un difetto: se un campo obbligatorio è vuoto, l'utente non può nemmeno annullare. Per farlo uscire, dai alle funzioni di annullamento il **tipo funzione** `E` (comando di uscita), nel GUI status o negli attributi di un pulsante, e gestiscile in un modulo con `AT EXIT-COMMAND`:

```abap
PROCESS AFTER INPUT.
  MODULE exit_0100 AT EXIT-COMMAND.        " sempre per primo
  FIELD scarr-carrid MODULE check_carrid.
  MODULE user_command_0100.
```

```abap
MODULE exit_0100 INPUT.
  CASE ok_code.
    WHEN 'CANCEL' OR 'EXIT'.
      CLEAR ok_code.
      LEAVE TO SCREEN 0.
  ENDCASE.
ENDMODULE.
```

Il modulo `AT EXIT-COMMAND` viene eseguito **prima** dei controlli automatici e prima del trasporto dei dati: al programma arriva solo l'OK code, e gli altri campi hanno ancora i loro vecchi valori. Se il modulo non lascia la schermata, il PAI continua normalmente con i controlli.

## Esercizio

> [!IMPORTANT]
>
> 1. Sulla schermata `0100` di `SAPMZFLIGHT`, aggiungi il campo obbligatorio `SCARR-CARRID` e due campi data `GV_DATE_FROM` e `GV_DATE_TO` (dichiarati nell'include TOP con tipo `d`).
> 2. Controlla la compagnia con `FIELD` e le date con `CHAIN`.
> 3. Aggiungi un pulsante "Annulla" con codice funzione `CANCEL` e tipo funzione `E` che lascia la schermata anche quando i campi sono vuoti.

### Soluzione

```abap
PROCESS BEFORE OUTPUT.
  MODULE fill_fields_0100.

PROCESS AFTER INPUT.
  MODULE exit_0100 AT EXIT-COMMAND.

  FIELD scarr-carrid MODULE check_carrid.

  CHAIN.
    FIELD: gv_date_from, gv_date_to.
    MODULE check_dates ON CHAIN-REQUEST.
  ENDCHAIN.

  MODULE user_command_0100.
```

I moduli `exit_0100`, `check_carrid` e `check_dates` sono quelli della lezione.

> [!NOTE]
>
> - Campi obbligatori, formati, tabelle di controllo e valori fissi vengono controllati automaticamente prima del PAI.
> - `FIELD f MODULE m` copia il campo in ritardo e lo controlla; un errore riapre solo quel campo.
> - `CHAIN ... ENDCHAIN` raggruppa campi per un controllo comune; un errore li riapre tutti.
> - Invia messaggi `E` e `W` solo da moduli sotto `FIELD` o `CHAIN`.
> - I comandi di uscita (tipo funzione `E`) con `MODULE ... AT EXIT-COMMAND` fanno uscire l'utente prima di qualsiasi controllo.
