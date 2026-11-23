---
title: Visibilità e incapsulamento
description: PUBLIC, PROTECTED, PRIVATE, READ-ONLY e friend.
level: intermediate
---

**Incapsulamento** significa che un oggetto nasconde i suoi dati e lascia che il mondo esterno li modifichi solo tramite i suoi metodi. I metodi possono controllare ogni modifica, così l'oggetto non può finire in uno stato non valido, e puoi cambiare il funzionamento interno della classe senza rompere i programmi che la usano.

ABAP realizza l'incapsulamento con le **sezioni di visibilità**. Questa lezione mostra le tre sezioni, gli attributi di sola lettura, getter e setter, chi può creare oggetti e come dare accesso a classi specifiche con i **friend**.

## Le tre sezioni di visibilità

Ogni componente di una classe appartiene a una sezione. Nella definizione le sezioni devono comparire in quest'ordine:

| Sezione             | Chi può accedere ai suoi componenti                                           |
| ------------------- | ----------------------------------------------------------------------------- |
| `PUBLIC SECTION`    | tutti                                                                         |
| `PROTECTED SECTION` | la classe stessa, le sue [sottoclassi](./0082-inheritance.md) e i suoi friend |
| `PRIVATE SECTION`   | la classe stessa e i suoi friend                                              |

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_seatsmax TYPE s_seatsmax.
    METHODS book_seat
      RETURNING VALUE(rv_ok) TYPE abap_bool.
    METHODS get_free_seats
      RETURNING VALUE(rv_free) TYPE i.
  PROTECTED SECTION.
    METHODS log_change.                       " per le sottoclassi che vogliono registrare
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    mv_seatsmax = iv_seatsmax.
  ENDMETHOD.

  METHOD book_seat.
    IF mv_seatsocc < mv_seatsmax.
      mv_seatsocc = mv_seatsocc + 1.
      log_change( ).
      rv_ok = abap_true.
    ENDIF.
  ENDMETHOD.

  METHOD get_free_seats.
    rv_free = mv_seatsmax - mv_seatsocc.
  ENDMETHOD.

  METHOD log_change.
    WRITE / |Posto prenotato, ne restano { get_free_seats( ) }|.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_flight) = NEW lcl_flight( iv_seatsmax = 2 ).
  lo_flight->book_seat( ).
  " lo_flight->mv_seatsocc = 99.   " errore di sintassi: mv_seatsocc è privato
```

- Rendi privati gli attributi per default. Metti nella sezione pubblica solo ciò che serve davvero agli altri programmi: questa è l'**interfaccia pubblica** della classe.
- La visibilità è controllata a livello di **classe**, non di oggetto: un metodo di `lcl_flight` può leggere gli attributi privati di un altro oggetto `lcl_flight`, per esempio per confrontare due voli.

> [!TIP]
> Un conto in banca funziona allo stesso modo. Il saldo è privato: non puoi aprire il database della banca e scrivere un nuovo numero. Usi lo sportello pubblico (versa, preleva, mostra il saldo), e la banca controlla ogni operazione.

## Attributi READ-ONLY

A volte chi chiama deve leggere spesso un attributo, e un metodo solo per restituirlo sembra eccessivo. Dichiara l'attributo nella sezione pubblica con `READ-ONLY`: tutti possono leggerlo, ma solo la classe può modificarlo.

```abap
CLASS lcl_booking DEFINITION.
  PUBLIC SECTION.
    DATA mv_bookid TYPE s_book_id READ-ONLY.
    METHODS constructor IMPORTING iv_bookid TYPE s_book_id.
ENDCLASS.

CLASS lcl_booking IMPLEMENTATION.
  METHOD constructor.
    mv_bookid = iv_bookid.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_booking) = NEW lcl_booking( iv_bookid = '00000042' ).
  WRITE / lo_booking->mv_bookid.          " ammesso: lettura
  " lo_booking->mv_bookid = '1'.          " errore di sintassi: sola lettura
```

## Getter e setter

L'alternativa abituale è un attributo privato con un **getter** (un metodo che lo restituisce) e, se le modifiche sono ammesse, un **setter** (un metodo che lo controlla e lo imposta). Il setter è il posto delle regole:

```abap
CLASS lcl_customer DEFINITION.
  PUBLIC SECTION.
    METHODS get_discount RETURNING VALUE(rv_discount) TYPE s_discount.
    METHODS set_discount
      IMPORTING iv_discount  TYPE s_discount
      RETURNING VALUE(rv_ok) TYPE abap_bool.
  PRIVATE SECTION.
    DATA mv_discount TYPE s_discount.
ENDCLASS.

CLASS lcl_customer IMPLEMENTATION.
  METHOD get_discount.
    rv_discount = mv_discount.
  ENDMETHOD.

  METHOD set_discount.
    IF iv_discount BETWEEN 0 AND 50.       " regola di business: al massimo 50 %
      mv_discount = iv_discount.
      rv_ok = abap_true.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

> [!WARNING]
> Non scrivere un getter e un setter per ogni attributo per abitudine. Una classe i cui setter accettano qualsiasi cosa non è incapsulata: è una struttura con qualche passaggio in più. Offri metodi che esprimono che cosa fa l'oggetto, come `book_seat` o `cancel`, e aggiungi setter solo dove un valore può davvero cambiare.

## Chi può creare oggetti: CREATE

L'aggiunta `CREATE` nella definizione della classe decide dove è ammesso `NEW`:

| Aggiunta           | Chi può creare oggetti                  |
| ------------------ | --------------------------------------- |
| `CREATE PUBLIC`    | tutti (il default)                      |
| `CREATE PROTECTED` | la classe stessa e le sue sottoclassi   |
| `CREATE PRIVATE`   | solo la classe stessa (e i suoi friend) |

`CREATE PRIVATE` è la base dei pattern singleton e factory: la classe offre un metodo statico che crea o restituisce l'oggetto. Vedi [i design pattern](./0088-design-patterns.md).

## I friend

Una classe può dare a un'altra classe accesso ai suoi componenti protetti e privati con `FRIENDS`. Il friend deve essere già noto, quindi se serve dichiaralo con `DEFINITION DEFERRED`:

```abap
CLASS lcl_flight_test DEFINITION DEFERRED.

CLASS lcl_flight DEFINITION FRIENDS lcl_flight_test.
  PUBLIC SECTION.
    METHODS get_free_seats RETURNING VALUE(rv_free) TYPE i.
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.
```

Ora i metodi di `lcl_flight_test` possono leggere e impostare direttamente `mv_seatsocc`. L'amicizia va in una sola direzione: `lcl_flight` non ottiene accesso ai componenti privati di `lcl_flight_test`. L'uso più comune sono le classi di test che devono preparare lo stato interno di un oggetto: nelle classi globali scriverai `CLASS zcl_flight DEFINITION LOCAL FRIENDS ltc_flight.` nell'include di test (vedi [ABAP Unit](./0105-abap-unit-basics.md)).

Usa i friend con parsimonia: ogni friend è una classe che può rompere il tuo incapsulamento.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi una classe `lcl_seat_plan` con attributi privati per i posti massimi e occupati, un costruttore che imposta il massimo e un attributo pubblico di sola lettura `mv_status` (`'O'` aperto, `'F'` pieno).
> 2. Aggiungi un metodo pubblico `book( iv_seats )` che restituisce `abap_false` se non ci sono abbastanza posti liberi, e altrimenti li prenota e aggiorna `mv_status`.
> 3. In `START-OF-SELECTION`, prova a modificare direttamente `mv_status` e un attributo privato, leggi gli errori di sintassi, poi togli quelle righe.

### Soluzione

```abap
REPORT zflight_seat_plan.

CLASS lcl_seat_plan DEFINITION.
  PUBLIC SECTION.
    DATA mv_status TYPE c LENGTH 1 VALUE 'O' READ-ONLY.
    METHODS constructor IMPORTING iv_seatsmax TYPE s_seatsmax.
    METHODS book
      IMPORTING iv_seats     TYPE i
      RETURNING VALUE(rv_ok) TYPE abap_bool.
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_seat_plan IMPLEMENTATION.
  METHOD constructor.
    mv_seatsmax = iv_seatsmax.
  ENDMETHOD.

  METHOD book.
    IF iv_seats <= 0 OR mv_seatsocc + iv_seats > mv_seatsmax.
      RETURN.                                " rv_ok resta abap_false
    ENDIF.
    mv_seatsocc = mv_seatsocc + iv_seats.
    IF mv_seatsocc = mv_seatsmax.
      mv_status = 'F'.
    ENDIF.
    rv_ok = abap_true.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_plan) = NEW lcl_seat_plan( iv_seatsmax = 5 ).
  IF lo_plan->book( 3 ) = abap_true.
    WRITE / 'Prenotati 3 posti'.
  ENDIF.
  IF lo_plan->book( 3 ) = abap_false.
    WRITE / 'Posti insufficienti'.
  ENDIF.
  lo_plan->book( 2 ).
  WRITE / |Stato: { lo_plan->mv_status }|.     " F
  " lo_plan->mv_status = 'O'.                " errore: l'attributo è di sola lettura
  " lo_plan->mv_seatsocc = 0.                " errore: l'attributo è privato
```

> [!NOTE]
>
> - I componenti `PUBLIC` sono visibili a tutti, quelli `PROTECTED` alla classe e alle sue sottoclassi, quelli `PRIVATE` solo alla classe; i friend vedono tutto.
> - Tieni privati gli attributi ed esponi metodi che controllano ogni modifica: questo è l'incapsulamento.
> - `READ-ONLY` permette a tutti di leggere un attributo pubblico che solo la classe può modificare.
> - `CREATE PUBLIC`, `PROTECTED` o `PRIVATE` decide chi può istanziare la classe.
> - `FRIENDS` dà un accesso unidirezionale ai componenti protetti e privati; usalo soprattutto per le classi di test.
