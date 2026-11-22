---
title: Le BAdI
description: Trovare, implementare e filtrare i Business Add-In.
---

_Livello pro_

Una **BAdI** (Business Add-In) è un punto di estensione orientato agli oggetti. SAP definisce un'[interfaccia](./0084-interfaces.md) e chiama i suoi metodi in un punto previsto del codice standard; tu scrivi una classe che implementa l'interfaccia, e SAP chiama la tua classe. Le BAdI sono il modo preferito per estendere lo standard SAP: l'interfaccia ti dice esattamente che cosa ricevi e che cosa puoi cambiare, e il tuo codice sopravvive agli upgrade.

Ci sono due generazioni: le **BAdI classiche** (dal rilascio 4.6) e le **BAdI nuove**, dette anche BAdI kernel, parte dell'enhancement framework dalla 7.0. Le implementi entrambe, ma ne definirai solo di nuove.

## Le parti di una BAdI

| Parte                      | Che cos'è                                                                   |
| -------------------------- | --------------------------------------------------------------------------- |
| enhancement spot           | contenitore di una o più definizioni di BAdI (solo BAdI nuove)              |
| definizione della BAdI     | la BAdI stessa: interfaccia, impostazioni, filtri (`SE18`)                  |
| interfaccia della BAdI     | i metodi che SAP chiama, per esempio `IF_EX_BADI_MATERIAL_CHECK`            |
| enhancement implementation | il tuo contenitore, con una o più implementazioni di BAdI (`SE19`)          |
| implementazione della BAdI | la tua classe più i valori di filtro; può essere attiva o inattiva          |
| classe di fallback         | la classe che gira quando nessuna implementazione corrisponde (facoltativa) |

Impostazioni importanti di una definizione di BAdI:

- **uso multiplo**: girano tutte le implementazioni attive, una dopo l'altra. I loro metodi possono avere solo parametri importing e changing, perché più implementazioni non possono restituire tutte un risultato. Una BAdI a **uso singolo** esegue esattamente un'implementazione, quindi i suoi metodi possono avere anche parametri exporting e returning.
- **filtro**: le implementazioni dichiarano i valori per cui valgono (una società, un paese, un tipo ordine), e SAP chiama solo quelle che corrispondono.

> [!TIP]
> Una BAdI è un annuncio di lavoro. SAP scrive la descrizione del ruolo (l'interfaccia) e dice dove si siederà la persona (la chiamata). Tu presenti il tuo candidato (la classe di implementazione). Con un filtro, l'annuncio dice "solo per la sede di Milano", e il candidato dichiara quali sedi copre.

## Trovare una BAdI

- **Nel codice**: cerca nel programma `GET BADI` (BAdI nuove) e `CL_EXITHANDLER=>GET_INSTANCE` (BAdI classiche). Il tipo della variabile, o il parametro `exit_name`, ti dà il nome della BAdI.
- **Con il debugger**: imposta un breakpoint per l'**istruzione** `GET BADI` (e uno sul metodo `CL_EXITHANDLER=>GET_INSTANCE`), esegui la transazione e annota ogni BAdI su cui il debugger si ferma.
- **In `SPRO`**: molte aree applicative hanno un nodo **Business Add-In (BAdI)** con la documentazione.
- **Per package**: in `SE84`, **Enhancement > Business Add-In > Definizioni**, filtrando per il package della transazione.

Leggi sempre la documentazione in `SE18` prima di implementare: dice quando la BAdI viene chiamata e che cosa puoi fare al suo interno.

## Implementare una BAdI nuova

1. In `SE19` (o in ADT: **New > BAdI Implementation**) crea un'enhancement implementation per l'enhancement spot, per esempio `ZEI_FLIGHT_PRICE`.
2. Al suo interno crea l'implementazione della BAdI e la sua classe, per esempio `ZCL_FLIGHT_PRICE_LH`.
3. Inserisci i valori di filtro, se la BAdI ha filtri.
4. Implementa i metodi, attiva la classe e attiva l'enhancement implementation.

La tua classe implementa l'interfaccia della BAdI, che a sua volta include l'interfaccia marcatore `IF_BADI_INTERFACE`:

```abap
CLASS zcl_flight_price_lh DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES zif_badi_flight_price.
ENDCLASS.

CLASS zcl_flight_price_lh IMPLEMENTATION.
  METHOD zif_badi_flight_price~adjust_price.
    " sconto del 10% sui voli Lufthansa in classe economy
    IF iv_class = 'Y'.
      cv_price = cv_price * '0.9'.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

## Chiamare una BAdI: GET BADI e CALL BADI

Questo è il codice dal lato del chiamante, come SAP lo scrive nello standard, o come lo scrivi tu per una tua BAdI (`ZBADI_FLIGHT_PRICE` nello spot `ZES_FLIGHT`, con un filtro `CARRID`):

```abap
DATA lo_badi  TYPE REF TO zbadi_flight_price.   " il nome della BAdI è il tipo
DATA lv_price TYPE s_price VALUE '500.00'.

TRY.
    GET BADI lo_badi
      FILTERS
        carrid = 'LH'.

    CALL BADI lo_badi->adjust_price
      EXPORTING
        iv_class = 'Y'
      CHANGING
        cv_price = lv_price.

  CATCH cx_badi_not_implemented.
    " BAdI a uso singolo senza implementazione attiva e senza classe di fallback
ENDTRY.

WRITE / lv_price.          " 450.00 con l'implementazione qui sopra
```

- `GET BADI` seleziona le implementazioni attive che corrispondono al filtro. Per una BAdI a uso multiplo senza implementazioni non succede niente, e `CALL BADI` non fa nulla.
- `cl_badi_query=>number_of_implementations( lo_badi )` ti dice quante ne sono state trovate.
- L'oggetto BAdI costa poco: quando non c'è niente di implementato, la chiamata non costa quasi nulla.

## Le BAdI classiche

Le BAdI classiche non hanno enhancement spot né `GET BADI`. Le riconosci da questo schema:

```abap
DATA lo_exit TYPE REF TO if_ex_badi_material_check.

CALL METHOD cl_exithandler=>get_instance
  EXPORTING
    exit_name = 'BADI_MATERIAL_CHECK'
  CHANGING
    instance  = lo_exit.

IF lo_exit IS BOUND.
  " qui chiami i metodi dell'interfaccia, come lo_exit->check_data( ),
  " con i parametri che l'interfaccia definisce
ENDIF.
```

Anche queste si implementano in `SE19` (**BAdI classica**, nome dell'implementazione, classe `ZCL_IM_...`). Una BAdI classica dipendente da filtro ha un parametro `flt_val` in più in ogni metodo.

> [!WARNING]
> I metodi delle BAdI girano dentro la LUW standard. Non fare `COMMIT WORK`, non inviare `MESSAGE ... TYPE 'E'` se la documentazione non lo consente, e restituisci gli errori nel modo previsto dall'interfaccia (un parametro changing, una tabella di ritorno o un'eccezione dichiarata nel metodo).

> [!CAUTION]
> Un'implementazione disattivata esiste ancora in ogni sistema in cui è stata trasportata. Capita che enhancement implementation inattive vengano attivate per errore in un trasporto successivo. Cancella le implementazioni che non ti servono più, e tieni i valori di filtro stretti, così il tuo codice gira solo dove deve.

## Esercizio

> [!IMPORTANT]
>
> 1. In ADT crea l'enhancement spot `ZES_FLIGHT` con la BAdI `ZBADI_FLIGHT_PRICE` (uso multiplo, filtro `CARRID` di tipo `S_CARR_ID`) e l'interfaccia `ZIF_BADI_FLIGHT_PRICE` con il metodo `ADJUST_PRICE` (importing `IV_CLASS TYPE S_CLASS`, changing `CV_PRICE TYPE S_PRICE`).
> 2. Crea un'implementazione per `CARRID = 'LH'` con lo sconto qui sopra.
> 3. Scrivi un report che chiama la BAdI per `LH` e per `AZ` e stampa i due prezzi.

### Soluzione

```abap
REPORT zbadi_flight_price_test.

START-OF-SELECTION.
  DATA lo_badi TYPE REF TO zbadi_flight_price.
  DATA lt_carriers TYPE STANDARD TABLE OF s_carr_id WITH EMPTY KEY.

  lt_carriers = VALUE #( ( 'LH' ) ( 'AZ' ) ).
  LOOP AT lt_carriers INTO DATA(lv_carrid).
    DATA(lv_price) = CONV s_price( '500.00' ).
    GET BADI lo_badi FILTERS carrid = lv_carrid.
    CALL BADI lo_badi->adjust_price
      EXPORTING iv_class = 'Y'
      CHANGING  cv_price = lv_price.
    WRITE: / lv_carrid, lv_price.
  ENDLOOP.
```

`LH` stampa 450.00 e `AZ` stampa 500.00: per `AZ` nessuna implementazione corrisponde al filtro, e una BAdI a uso multiplo semplicemente non fa niente.

> [!NOTE]
>
> - Una BAdI è un'interfaccia che SAP chiama; la implementi con una classe in un'enhancement implementation.
> - BAdI nuove: `GET BADI` e `CALL BADI`, organizzate in enhancement spot; BAdI classiche: `CL_EXITHANDLER=>GET_INSTANCE`.
> - Trovi le BAdI nel codice, con un breakpoint sull'istruzione `GET BADI`, in `SPRO` o in `SE18`.
> - Le BAdI a uso multiplo eseguono tutte le implementazioni che corrispondono; i filtri scelgono quali implementazioni valgono.
> - Leggi la documentazione della BAdI, restituisci gli errori come prevede l'interfaccia e non fare mai commit dentro una BAdI.
