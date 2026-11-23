---
title: I messaggi
description: Classi di messaggi, tipi di messaggio e l'istruzione MESSAGE.
level: basic
---

I programmi parlano agli utenti con i **messaggi**: "Compagnia LH non trovata", "Prenotazione salvata", "Inserisci una data futura". In SAP questi testi non stanno nel codice. Sono memorizzati in una **classe di messaggi**, con un numero, e vengono tradotti come ogni altro testo.

L'istruzione `MESSAGE` mostra un messaggio. Il suo **tipo di messaggio** decide che cosa vede l'utente e che cosa succede poi al programma.

## Le classi di messaggi

Una classe di messaggi è un contenitore di al massimo 1.000 messaggi, numerati da `000` a `999`. La crei in `SE91` o in ADT (**New > Other ABAP Repository Object > Message Class**). Una classe custom comincia con `Z` o `Y`, per esempio `ZFLIGHT`:

```text
Classe di messaggi ZFLIGHT
  000  &1 &2 &3 &4
  001  Compagnia &1 non trovata
  002  Prenotazione &1 salvata
  003  Il volo &1 &2 del &3 è al completo
  004  Inserisci una data futura
```

I segnaposto da `&1` a `&4` vengono riempiti a runtime. Funziona anche un `&` singolo, riempito in ordine, ma i segnaposto numerati permettono ai traduttori di cambiare l'ordine delle parole. Ogni messaggio può avere anche un **testo esteso** con più spiegazioni, che l'utente apre facendo clic sul messaggio.

> [!TIP]
> Una classe di messaggi è come il frasario di una guida turistica. Invece di improvvisare ogni volta, la guida indica la frase numero 1, "il museo è chiuso il &1", e completa il giorno. Un frasario tradotto funziona per i turisti di ogni lingua.

## L'istruzione MESSAGE

Ci sono più modi di scriverla:

```abap
REPORT zmessage_demo MESSAGE-ID zflight.     " classe di default per questo programma

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  " 1. Forma breve: tipo, numero e classe in un solo token
  MESSAGE i001(zflight) WITH p_carr.

  " 2. Senza la classe: si usa quella di REPORT ... MESSAGE-ID
  MESSAGE s002 WITH '4711'.

  " 3. Completamente dinamica: ID, tipo e numero possono essere variabili
  MESSAGE ID 'ZFLIGHT' TYPE 'I' NUMBER '001' WITH p_carr.

  " 4. Un testo senza classe di messaggi (solo per prove veloci)
  MESSAGE 'Messaggio di prova' TYPE 'I'.
```

`WITH` passa fino a quattro valori per i segnaposto da `&1` a `&4`. Preferisci i messaggi di una classe ai letterali di testo: si possono tradurre, hanno un testo esteso e con la lista d'uso trovi ogni punto in cui vengono usati.

## I tipi di messaggio

| Tipo | Nome         | Che cosa succede di solito                                                                                                           |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `S`  | successo     | mostrato nella barra di stato della schermata successiva; il programma continua                                                      |
| `I`  | informazione | mostrato in una finestra di dialogo; il programma continua dopo la conferma dell'utente                                              |
| `W`  | avvertimento | mostrato nella barra di stato; in un controllo di input l'utente può confermare e proseguire                                         |
| `E`  | errore       | mostrato nella barra di stato; in un controllo di input la schermata resta pronta per la correzione, altrove l'elaborazione si ferma |
| `A`  | interruzione | mostrato in una finestra di dialogo; il programma termina e l'utente torna al menu                                                   |
| `X`  | uscita       | il programma termina con l'errore a runtime `MESSAGE_TYPE_X`                                                                         |

Il comportamento esatto di `W` ed `E` dipende da dove viene inviato il messaggio: in un controllo di input di una schermata di selezione (vedi [Gli eventi dei report](./0066-report-events.md)), in una schermata di dialogo, in una lista, in un job in background. In un job in background ogni messaggio finisce nel log del job, e un messaggio `E` o `A` termina il job.

> [!WARNING]
> Un messaggio `E` in `START-OF-SELECTION` termina il report: l'utente non torna alla schermata di selezione per correggere l'input. Per mostrare un errore e tornare alla schermata di selezione, invia un messaggio di successo che sembra un errore, poi esci dall'elaborazione della lista.

```abap
IF lt_flights IS INITIAL.
  MESSAGE s001(zflight) WITH p_carr DISPLAY LIKE 'E'.
  LEAVE LIST-PROCESSING.
ENDIF.
```

`DISPLAY LIKE` cambia solo l'icona e il colore, non il comportamento del tipo.

## I messaggi in una variabile

Con `INTO` il messaggio non viene mostrato: il suo testo finisce in una variabile e i campi di sistema vengono riempiti. È così che costruisci i log e i messaggi di ritorno:

```abap
DATA lv_text TYPE string.

MESSAGE e001(zflight) WITH p_carr INTO lv_text.

WRITE: / lv_text.                                  " Compagnia LH non trovata
WRITE: / sy-msgid, sy-msgty, sy-msgno, sy-msgv1.   " ZFLIGHT E 001 LH
```

I campi `sy-msgid`, `sy-msgty`, `sy-msgno` e da `sy-msgv1` a `sy-msgv4` descrivono l'ultimo messaggio. Molti moduli funzione li riempiono quando sollevano un'eccezione, così puoi ripetere il messaggio all'utente con `MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4`.

Per raccogliere molti messaggi e mostrarli insieme usa il [log applicativo](./0112-application-log.md). Nelle classi gli errori si segnalano con le [eccezioni basate su classi](./0089-class-based-exceptions.md), che possono portare con sé un messaggio di una classe di messaggi.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la classe di messaggi `ZFLIGHT` con i messaggi `001` e `002` come mostrato.
> 2. Scrivi un report con un parametro per la compagnia aerea che legge `SCARR`. Se la compagnia non esiste, mostra il messaggio `001` come errore e torna alla schermata di selezione. Altrimenti mostra un messaggio di successo con il nome della compagnia: aggiungi alla classe il messaggio `005`, `Compagnia &1 (&2) trovata`.

### Soluzione

```abap
REPORT zmessage_exercise MESSAGE-ID zflight.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT SINGLE carrname
    FROM scarr
    WHERE carrid = @p_carr
    INTO @DATA(lv_name).

  IF sy-subrc <> 0.
    MESSAGE s001 WITH p_carr DISPLAY LIKE 'E'.
    LEAVE LIST-PROCESSING.
  ENDIF.

  MESSAGE s005 WITH p_carr lv_name.
  WRITE: / p_carr, lv_name.
```

> [!NOTE]
>
> - I testi dei messaggi stanno in una classe di messaggi (`SE91`), numerati da `000` a `999`, con i segnaposto da `&1` a `&4`.
> - `MESSAGE e001(zflight) WITH ...` mostra un messaggio; `REPORT ... MESSAGE-ID` imposta la classe di default.
> - Il tipo (`S`, `I`, `W`, `E`, `A`, `X`) decide che cosa succede dopo, e l'effetto dipende dal contesto.
> - `DISPLAY LIKE` cambia solo l'aspetto; `INTO` mette il testo in una variabile senza mostrarlo.
> - `sy-msgid`, `sy-msgty`, `sy-msgno` e da `sy-msgv1` a `sy-msgv4` descrivono l'ultimo messaggio.
