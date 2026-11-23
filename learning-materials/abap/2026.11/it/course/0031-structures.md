---
title: Le strutture
description: Raggruppare campi correlati in un solo oggetto dati.
level: basic
---

Un volo non è un solo valore: ha una compagnia, un numero, una data, un prezzo, dei posti liberi. Con le variabili che conosci finora te ne servirebbero cinque separate, e dovresti passarle sempre tutte e cinque insieme. Una **struttura** raggruppa campi correlati in un solo oggetto dati, così puoi trattare "il volo" come una cosa sola.

Le strutture sono ovunque in ABAP: una riga di una tabella di database è una struttura, una riga di una tabella interna è una struttura, e la maggior parte dei parametri dei metodi sono strutture.

## Definire un tipo struttura

Usa `TYPES` con `BEGIN OF` ed `END OF`. Ogni campo all'interno è un **componente**:

```abap
REPORT zstructures_demo.

TYPES: BEGIN OF ty_flight,
         carrid    TYPE s_carr_id,       " compagnia
         connid    TYPE s_conn_id,       " numero del volo
         fldate    TYPE s_date,          " data del volo
         price     TYPE s_price,         " prezzo del biglietto
         seatsfree TYPE i,               " posti liberi
       END OF ty_flight.

DATA ls_flight TYPE ty_flight.
```

I due punti e le virgole concatenano le istruzioni, come hai visto in [Le regole della sintassi ABAP](./0009-syntax-rules.md): `END OF ty_flight` chiude l'elenco. Per convenzione, le variabili struttura iniziano con `ls_` (struttura locale).

Puoi anche dichiarare direttamente una variabile struttura con `DATA BEGIN OF`, senza un tipo, ma un tipo con un nome è riusabile e di solito è la scelta migliore.

> [!TIP]
> Una struttura è un modulo di carta: un solo foglio con diverse caselle etichettate (compagnia, volo, data, prezzo). Compili ogni casella separatamente, ma archivi, copi e consegni il foglio intero in un colpo solo.

## Le strutture del Dizionario

Ogni tabella di database del Dizionario ABAP è anche un tipo struttura. Per avere una struttura con tutti i campi di una tabella, scrivi il suo nome dopo `TYPE`:

```abap
DATA ls_carrier TYPE scarr.     " MANDT, CARRID, CARRNAME, CURRCODE, URL
DATA ls_conn    TYPE spfli.     " tutti i campi di un collegamento
```

È il modo più comune di ottenere una struttura: coincide sempre con la tabella, come hai visto per i singoli campi in [Definire tipi con TYPES e LIKE](./0017-types-and-like.md). Il Dizionario contiene anche strutture che non sono tabelle; le vedrai in [Strutture e tipi tabella nel Dizionario](./0048-ddic-structures-and-table-types.md).

## Leggere e scrivere i componenti

Raggiungi un componente con il **selettore di componente** `-`: nome della struttura, trattino, nome del componente, senza spazi.

```abap
ls_flight-carrid    = 'LH'.
ls_flight-connid    = '0400'.
ls_flight-fldate    = '20261215'.
ls_flight-price     = '650.00'.
ls_flight-seatsfree = 12.

WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-fldate,
         ls_flight-price, ls_flight-seatsfree.

IF ls_flight-seatsfree < 20.
  WRITE / 'Quasi pieno'.
ENDIF.
```

Ogni componente è una variabile normale del suo tipo: lo usi nei calcoli, nelle condizioni e nei template di stringa come qualsiasi altra.

Con l'espressione costruttore `VALUE` riempi tutta la struttura con una sola istruzione. I componenti che non elenchi ricevono il loro valore iniziale:

```abap
ls_flight = VALUE #( carrid = 'AZ' connid = '0555' fldate = '20261220'
                     price = '180.00' seatsfree = 40 ).
```

Imparerai `VALUE` e le altre espressioni costruttore in [Le espressioni costruttore](./0091-constructor-expressions.md).

## Lavorare con tutta la struttura

Molte istruzioni lavorano su tutta la struttura in una volta:

```abap
DATA ls_copy TYPE ty_flight.

ls_copy = ls_flight.                 " copia tutti i componenti

IF ls_copy = ls_flight.              " confronta tutti i componenti
  WRITE / 'Stesso volo'.
ENDIF.

CLEAR ls_copy.                       " ogni componente torna al valore iniziale
IF ls_copy IS INITIAL.
  WRITE / 'Struttura vuota'.
ENDIF.
```

Per copiare fra due strutture **diverse**, usa `MOVE-CORRESPONDING`: copia solo i componenti che hanno lo **stesso nome** in entrambe, e lascia stare gli altri.

```abap
TYPES: BEGIN OF ty_offer,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
         note   TYPE string,
       END OF ty_offer.

DATA ls_offer TYPE ty_offer.

MOVE-CORRESPONDING ls_flight TO ls_offer.   " carrid, connid, price
ls_offer-note = `Saldi invernali`.
```

> [!WARNING]
> Non assegnare con `=` strutture di tipo diverso. ABAP non controlla i nomi: per le strutture flat copia i byte da sinistra a destra, quindi i valori possono finire nei componenti sbagliati, spesso senza alcun errore. Usa `MOVE-CORRESPONDING` o l'espressione `CORRESPONDING`, che vedrai in [FILTER e CORRESPONDING](./0094-filter-and-corresponding.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Dichiara una struttura `ls_conn` di tipo `spfli` e riempi `carrid`, `connid`, `cityfrom`, `cityto` e `fltime` (durata del volo in minuti) per il collegamento LH 0400 da FRANKFURT a NEW YORK, 444 minuti.
> 2. Stampa la tratta con un template di stringa, e la durata del volo in ore e minuti.
> 3. Definisci un tipo `ty_route` con solo `carrid`, `connid`, `cityfrom` e `cityto`, e copia i campi corrispondenti da `ls_conn` in una struttura di quel tipo.

### Soluzione

```abap
REPORT zstructures_exercise.

TYPES: BEGIN OF ty_route,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_route.

DATA ls_conn  TYPE spfli.
DATA ls_route TYPE ty_route.

ls_conn-carrid   = 'LH'.
ls_conn-connid   = '0400'.
ls_conn-cityfrom = 'FRANKFURT'.
ls_conn-cityto   = 'NEW YORK'.
ls_conn-fltime   = 444.

DATA(lv_hours)   = ls_conn-fltime DIV 60.     " 7
DATA(lv_minutes) = ls_conn-fltime MOD 60.     " 24

WRITE: / |{ ls_conn-carrid } { ls_conn-connid }: { ls_conn-cityfrom } -> { ls_conn-cityto }|,
       / |Durata del volo: { lv_hours } h { lv_minutes } min|.

MOVE-CORRESPONDING ls_conn TO ls_route.
```

> [!NOTE]
>
> - Una struttura raggruppa componenti correlati in un solo oggetto dati; si definisce con `TYPES BEGIN OF ... END OF`.
> - `TYPE scarr` ti dà una struttura con tutti i campi di una tabella del Dizionario.
> - Accedi a un componente con il selettore `-`, per esempio `ls_flight-price`.
> - `=`, il confronto, `CLEAR` e `IS INITIAL` funzionano su tutta la struttura.
> - Usa `MOVE-CORRESPONDING` per copiare fra strutture diverse in base al nome dei componenti.
