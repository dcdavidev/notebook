---
title: Le classi globali
description: Creare classi riutilizzabili in ADT e SE24, con classi locali di test e di supporto.
level: intermediate
---

Le classi che hai scritto finora erano **classi locali**: vivono dentro un report e nessun altro le può usare. Una **classe globale** è invece un oggetto del repository a sé stante, salvato in un **class pool**, visibile a tutti i programmi del sistema e trasportato come qualsiasi altro oggetto di sviluppo. Nell'ABAP moderno la logica riutilizzabile va nelle classi globali.

## Locale o globale

| Aspetto          | Classe locale                                   | Classe globale                                     |
| ---------------- | ----------------------------------------------- | -------------------------------------------------- |
| Dove vive        | dentro un programma, un include o un class pool | nel suo class pool                                 |
| Chi la può usare | solo il programma che la contiene               | qualsiasi programma, classe o modulo funzione      |
| Nome             | `lcl_...`, qualsiasi nome                       | `ZCL_...` (namespace cliente), fino a 30 caratteri |
| Definizione      | `CLASS lcl_x DEFINITION.`                       | `CLASS zcl_x DEFINITION PUBLIC.`                   |
| Strumento        | l'editor dei programmi                          | ADT o il Class Builder (`SE24`)                    |

La sintassi all'interno è la stessa: sezioni, attributi, metodi, interfacce, eventi. Tutto quello che hai imparato sulle classi locali vale anche qui.

> [!TIP]
> Una classe locale è una ricetta scritta sul retro di una busta per la cena di stasera. Una classe globale è una ricetta nel ricettario di famiglia: ha un titolo, un numero di pagina, e chiunque in casa la può trovare e cucinare.

## Creare una classe globale in ADT

In Eclipse con ADT:

```text
Tasto destro sul tuo package > New > ABAP Class
  Name:        ZCL_FLIGHT_SERVICE
  Description: Servizio voli
  Superclass:  (vuoto)
  Interfaces:  IF_OO_ADT_CLASSRUN   (facoltativa, per eseguire la classe da ADT)
Next > scegli o crea una richiesta di trasporto > Finish
```

ADT genera lo scheletro, e tu lo completi:

```abap
CLASS zcl_flight_service DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.

    METHODS get_carrier_name
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_name) TYPE s_carrname.
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.

CLASS zcl_flight_service IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    out->write( get_carrier_name( 'LH' ) ).
  ENDMETHOD.

  METHOD get_carrier_name.
    SELECT SINGLE carrname FROM scarr
      WHERE carrid = @iv_carrid
      INTO @rv_name.
  ENDMETHOD.
ENDCLASS.
```

- `PUBLIC` la rende una classe globale.
- `CREATE PUBLIC` significa che chiunque la può istanziare; `CREATE PROTECTED` e `CREATE PRIVATE` limitano la creazione alla classe stessa e alle sue sottoclassi, oppure alla sola classe.
- Attiva con `Ctrl+F3`. Con `IF_OO_ADT_CLASSRUN`, premi `F9` per eseguire la classe come applicazione console: gira `main` e `out->write( )` stampa nella console di ADT. Questa interfaccia è disponibile on premise da ABAP 7.52 e in tutti i sistemi ABAP Cloud.

Da qualsiasi programma usi la classe come useresti una classe locale:

```abap
DATA(lo_service) = NEW zcl_flight_service( ).
WRITE / lo_service->get_carrier_name( 'AA' ).
```

## Il Class Builder (SE24)

In SAP GUI la transazione `SE24` apre il **Class Builder**. La vista predefinita è **basata su moduli** (_form-based_): la classe è distribuita su schede come _Properties_, _Interfaces_, _Attributes_, _Methods_ ed _Events_, e i parametri di ogni metodo li inserisci in una tabella. Il pulsante _Source Code-Based_ passa alla stessa vista a editor di testo che mostra ADT.

I due strumenti modificano lo stesso oggetto, quindi puoi aprire in `SE24` una classe creata in ADT e viceversa. Per i nuovi sviluppi preferisci ADT: funzionalità come CDS e RAP esistono solo lì, e la vista del codice sorgente è più facile da leggere e da confrontare.

## Classi locali dentro una classe globale

Un class pool può contenere tipi e classi locali che usa solo la classe globale. In ADT li trovi nelle schede in fondo all'editor della classe:

| Scheda di ADT              | Contenuto                                                                      |
| -------------------------- | ------------------------------------------------------------------------------ |
| Global Class               | la classe globale stessa                                                       |
| Class-relevant Local Types | tipi locali che ti servono nelle sezioni di dichiarazione della classe globale |
| Local Types                | classi e tipi locali di supporto usati solo nell'implementazione               |
| Test Classes               | classi di test locali per ABAP Unit                                            |
| Macros                     | macro locali (servono di rado)                                                 |

In `SE24` raggiungi le stesse parti dal menu _Goto > Class-Local Types_.

Una classe di supporto in _Local Types_:

```abap
CLASS lcl_formatter DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS format_route
      IMPORTING is_connection   TYPE spfli
      RETURNING VALUE(rv_route) TYPE string.
ENDCLASS.

CLASS lcl_formatter IMPLEMENTATION.
  METHOD format_route.
    rv_route = |{ is_connection-cityfrom } -> { is_connection-cityto }|.
  ENDMETHOD.
ENDCLASS.
```

I metodi di `zcl_flight_service` possono chiamare `lcl_formatter=>format_route( )`; nessun altro programma può farlo. Una classe di test in _Test Classes_ ha questo aspetto, e ne scriverai di vere nella lezione su [ABAP Unit](./0105-abap-unit-basics.md):

```abap
CLASS ltc_flight_service DEFINITION FINAL FOR TESTING
  DURATION SHORT RISK LEVEL HARMLESS.
  PRIVATE SECTION.
    METHODS carrier_name_is_found FOR TESTING.
ENDCLASS.

CLASS ltc_flight_service IMPLEMENTATION.
  METHOD carrier_name_is_found.
    DATA(lo_cut) = NEW zcl_flight_service( ).
    cl_abap_unit_assert=>assert_not_initial( lo_cut->get_carrier_name( 'LH' ) ).
  ENDMETHOD.
ENDCLASS.
```

> [!WARNING]
> Quando altri programmi usano la tua classe globale, i suoi metodi pubblici sono una promessa. Rinominare un metodo o cambiare un parametro rompe tutti i chiamanti, spesso in oggetti che appartengono a qualcun altro. Prima di cambiare una firma pubblica, controlla i chiamanti con la lista di utilizzo (_where-used list_, `Ctrl+Shift+G` in ADT), e preferisci aggiungere un parametro facoltativo o un nuovo metodo.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea in ADT la classe globale `ZCL_FLIGHT_SERVICE`, nel tuo package, con l'interfaccia `IF_OO_ADT_CLASSRUN`.
> 2. Aggiungi un metodo pubblico `get_route` che riceve un `carrid` e un `connid`, legge la riga da `SPFLI` e restituisce la tratta come stringa chiamando la classe locale di supporto `lcl_formatter`.
> 3. Chiama `get_route( iv_carrid = 'LH' iv_connid = '0400' )` in `main`, esegui la classe con `F9`, poi aprila in `SE24` e guarda la vista basata su moduli.

### Soluzione

```abap
" Sezione pubblica di ZCL_FLIGHT_SERVICE
    METHODS get_route
      IMPORTING iv_carrid       TYPE s_carr_id
                iv_connid       TYPE s_conn_id
      RETURNING VALUE(rv_route) TYPE string.

" Implementazione
  METHOD get_route.
    SELECT SINGLE * FROM spfli
      WHERE carrid = @iv_carrid
        AND connid = @iv_connid
      INTO @DATA(ls_connection).
    IF sy-subrc = 0.
      rv_route = lcl_formatter=>format_route( ls_connection ).
    ENDIF.
  ENDMETHOD.

  METHOD if_oo_adt_classrun~main.
    out->write( get_route( iv_carrid = 'LH' iv_connid = '0400' ) ).
  ENDMETHOD.
```

> [!NOTE]
>
> - Una classe globale è un oggetto del repository (`CLASS ... DEFINITION PUBLIC`) che ogni programma può usare; nel namespace cliente il suo nome inizia con `ZCL_`.
> - La crei e la modifichi in ADT (`New > ABAP Class`) o nel Class Builder `SE24`; i due strumenti modificano lo stesso oggetto.
> - `IF_OO_ADT_CLASSRUN` ti permette di eseguire una classe con `F9` e di stampare con `out->write( )`.
> - Un class pool può contenere classi locali di supporto (_Local Types_), tipi per le dichiarazioni (_Class-relevant Local Types_) e classi di test (_Test Classes_).
> - Le firme pubbliche sono un contratto: controlla la lista di utilizzo prima di cambiarle.
