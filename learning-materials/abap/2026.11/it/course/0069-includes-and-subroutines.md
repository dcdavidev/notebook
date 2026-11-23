---
title: Include e subroutine
description: Dividere un programma in file, e leggere FORM e PERFORM nel codice legacy.
level: basic
---

Un report che arriva a migliaia di righe è difficile da navigare. L'ABAP classico ha due strumenti per dividerlo: gli **include** dividono il codice sorgente in più file, e le **subroutine** dividono la logica in blocchi con un nome che chiami con `PERFORM`.

Gli include si usano ancora, soprattutto nei gruppi funzione e nei programmi con schermate. Le subroutine sono **obsolete**: SAP raccomanda di usare i metodi. Però troverai `FORM` e `PERFORM` in quasi tutti i programmi vecchi, quindi devi saperli leggere.

## Gli include

Un **programma include** (tipo di programma `I`) è un pezzo di codice sorgente che non può girare da solo. L'istruzione `INCLUDE` ne copia il contenuto nel programma principale in quel punto, come se lo avessi scritto lì.

```abap
REPORT zflight_report.

INCLUDE zflight_report_top.   " dati globali e schermata di selezione
INCLUDE zflight_report_f01.   " subroutine

START-OF-SELECTION.
  PERFORM read_flights.
  PERFORM show_flights.
```

Per creare un include, fai doppio clic sul suo nome nell'istruzione `INCLUDE` e conferma: l'editor lo crea e lo collega al programma principale. Le convenzioni di nome più comuni:

| Suffisso | Contenuto                                                       |
| -------- | --------------------------------------------------------------- |
| `TOP`    | dichiarazioni globali (`DATA`, `TYPES`, schermata di selezione) |
| `SEL`    | schermata di selezione                                          |
| `F01`    | subroutine                                                      |
| `O01`    | moduli PBO delle schermate                                      |
| `I01`    | moduli PAI delle schermate                                      |
| `C01`    | classi locali                                                   |

- Un include non è un modulo separato: non ha dati propri né un'interfaccia. Tutto quello che contiene appartiene al programma che lo include.
- Il controllo di sintassi di un include gira nel contesto del suo programma principale. Se l'include è usato da più programmi, deve essere corretto in tutti.

> [!TIP]
> Gli include sono i capitoli di un libro rilegati in un solo volume. Dividere il testo in capitoli aiuta a trovare una pagina, ma resta un unico libro: una frase del capitolo 3 può parlare di un personaggio del capitolo 1.

## Le subroutine: FORM e PERFORM

Una **subroutine** è un blocco di codice tra `FORM` ed `ENDFORM`, richiamato con `PERFORM`. Può avere parametri e dati locali propri.

```abap
DATA gt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.

START-OF-SELECTION.
  DATA lv_carrid TYPE s_carr_id VALUE 'LH'.
  DATA lv_free   TYPE i.
  PERFORM read_flights USING lv_carrid.
  PERFORM count_free_seats CHANGING lv_free.
  WRITE: / 'Posti liberi:', lv_free.

FORM read_flights USING iv_carrid TYPE s_carr_id.
  SELECT * FROM sflight
    WHERE carrid = @iv_carrid
    INTO TABLE @gt_flights.
ENDFORM.

FORM count_free_seats CHANGING cv_free TYPE i.
  DATA ls_flight TYPE sflight.        " locale alla subroutine
  CLEAR cv_free.
  LOOP AT gt_flights INTO ls_flight.
    cv_free = cv_free + ls_flight-seatsmax - ls_flight-seatsocc.
  ENDLOOP.
ENDFORM.
```

- I blocchi `FORM` vanno alla fine del programma (o in un include `F01`), dopo tutti i blocchi evento.
- `DATA` dentro un `FORM` è locale; la subroutine può anche leggere e modificare tutti i dati globali del programma, come fa `count_free_seats` con `gt_flights`.
- I parametri sono posizionali: il primo parametro attuale dopo `USING` va al primo parametro formale, e così via.

## Come si passano i parametri

| Definizione         | Passaggio              | Significato                                                |
| ------------------- | ---------------------- | ---------------------------------------------------------- |
| `USING p`           | per riferimento        | input; tecnicamente si può ancora modificare (non farlo)   |
| `USING VALUE(p)`    | per valore             | input; la subroutine lavora su una copia                   |
| `CHANGING p`        | per riferimento        | input e output; le modifiche sono visibili subito          |
| `CHANGING VALUE(p)` | per valore e risultato | input e output; il valore viene ricopiato solo a `ENDFORM` |
| `TABLES t`          | per riferimento        | una tabella interna con header line (obsoleto)             |

> [!WARNING]
> I parametri senza tipo, come in `FORM calc USING p1 p2`, sono ammessi e molto comuni nel codice vecchio. Accettano qualsiasi tipo di dato e nascondono gli errori fino al runtime. Quando devi modificare una subroutine così, aggiungi `TYPE` ai suoi parametri.

Puoi trovare anche `PERFORM read_flights IN PROGRAM zother_program` oppure `PERFORM read_flights(zother_program)`, che chiamano una subroutine di un altro programma. Questo lega strettamente i due programmi ed è una fonte frequente di errori. `PERFORM ... ON COMMIT` rimanda la chiamata al prossimo `COMMIT WORK`: vedi [i moduli funzione di aggiornamento](./0113-update-task.md).

## Che cosa usare al loro posto

Nel codice nuovo metti la logica riutilizzabile nei [moduli funzione](./0070-function-modules.md) quando ti servono (RFC, update task), e altrimenti in [classi e metodi](./0076-classes-and-objects.md). I metodi hanno parametri tipizzati, si possono testare con ABAP Unit e non condividono dati globali nascosti. Dentro le classi, `FORM`, `PERFORM` e i parametri `TABLES` sono un errore di sintassi.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea un report `ZFLIGHT_INCL` con un include `TOP` per i dati globali e un include `F01` per le subroutine.
> 2. Scrivi una subroutine `read_connections` con un parametro `USING` tipizzato per la compagnia, che riempie una tabella globale da `SPFLI`.
> 3. Scrivi una subroutine `show_connections` che stampa la tabella, e chiamale entrambe da `START-OF-SELECTION`.

### Soluzione

```abap
REPORT zflight_incl.

INCLUDE zflight_incl_top.
INCLUDE zflight_incl_f01.

START-OF-SELECTION.
  PERFORM read_connections USING p_carrid.
  PERFORM show_connections.
```

Include `ZFLIGHT_INCL_TOP`:

```abap
DATA gt_connections TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.
```

Include `ZFLIGHT_INCL_F01`:

```abap
FORM read_connections USING iv_carrid TYPE s_carr_id.
  SELECT * FROM spfli
    WHERE carrid = @iv_carrid
    INTO TABLE @gt_connections.
ENDFORM.

FORM show_connections.
  DATA ls_connection TYPE spfli.
  LOOP AT gt_connections INTO ls_connection.
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
ENDFORM.
```

> [!NOTE]
>
> - Un include (tipo `I`) è codice sorgente copiato nel programma principale da `INCLUDE`; non può girare da solo e non ha dati propri.
> - Suffissi comuni degli include: `TOP` per le dichiarazioni, `F01` per le subroutine, `O01`/`I01` per i moduli delle schermate.
> - `FORM ... ENDFORM` definisce una subroutine e `PERFORM` la chiama; i parametri sono `USING`, `CHANGING` e l'obsoleto `TABLES`.
> - `VALUE(...)` passa per valore; senza, i parametri passano per riferimento.
> - Le subroutine sono obsolete: leggile nel codice vecchio, ma nel codice nuovo scrivi metodi.
