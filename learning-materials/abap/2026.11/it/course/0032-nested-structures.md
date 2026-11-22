---
title: Strutture annidate e include
description: Strutture dentro strutture, e INCLUDE TYPE.
---

_Livello base_

Una prenotazione ha i suoi dati (compagnia, volo, data, numero di prenotazione) e i dati del cliente (numero, nome, città). Potresti mettere tutti questi campi uno accanto all'altro in una sola [struttura](./0031-structures.md), ma i dati del cliente formano un gruppo a sé, e vorrai riusarlo altrove.

ABAP ti offre due modi per costruire strutture più grandi a partire da quelle più piccole: l'**annidamento**, in cui un componente è a sua volta una struttura, e l'**inclusione**, in cui i componenti di una struttura vengono copiati in un'altra allo stesso livello.

## Le strutture annidate

Un componente di una struttura può avere un tipo struttura. Il risultato è una **struttura annidata**:

```abap
REPORT znested_demo.

TYPES: BEGIN OF ty_customer,
         id   TYPE scustom-id,
         name TYPE scustom-name,
         city TYPE scustom-city,
       END OF ty_customer.

TYPES: BEGIN OF ty_booking,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         bookid   TYPE s_book_id,
         customer TYPE ty_customer,      " una struttura dentro la struttura
       END OF ty_booking.

DATA ls_booking TYPE ty_booking.
```

Per raggiungere un componente della struttura interna, concatena i selettori:

```abap
ls_booking-carrid        = 'LH'.
ls_booking-connid        = '0400'.
ls_booking-customer-id   = '00000042'.
ls_booking-customer-name = 'Rossi'.
ls_booking-customer-city = 'ROMA'.

WRITE: / ls_booking-carrid, ls_booking-connid, ls_booking-customer-name.
```

Anche la struttura interna è un componente che puoi usare per intero, per esempio per copiarla o svuotarla:

```abap
DATA ls_customer TYPE ty_customer.

ls_customer = ls_booking-customer.      " copia la struttura interna
CLEAR ls_booking-customer.              " svuota solo la parte del cliente
```

Con `VALUE`, annida un `VALUE #( )` dentro l'altro; quello interno prende il tipo dal componente:

```abap
ls_booking = VALUE #( carrid   = 'AZ'
                      connid   = '0555'
                      customer = VALUE #( id = '00000007' name = 'Bianchi' ) ).
```

Puoi anche definire la struttura interna direttamente dentro quella esterna, con un secondo `BEGIN OF ... END OF`. Un tipo con un nome come `ty_customer` è meglio quando ti serve di nuovo.

> [!TIP]
> Una struttura annidata è una cartellina con dentro una busta più piccola. La cartellina ha le sue etichette (volo, data), e la busta con scritto "cliente" contiene i suoi fogli. Puoi tirare fuori la busta e consegnarla a qualcuno senza aprirla.

## Includere una struttura: INCLUDE TYPE

A volte non vuoi un gruppo: vuoi gli stessi campi **allo stesso livello**, per esempio una struttura volo più qualche campo in più. `INCLUDE TYPE` copia i componenti di un tipo struttura in quello che stai definendo.

`INCLUDE` è un'istruzione a sé, quindi non può far parte di una catena con i due punti. Scrivi ogni `TYPES` separatamente:

```abap
TYPES: BEGIN OF ty_route,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_route.

TYPES BEGIN OF ty_route_ext.
INCLUDE TYPE ty_route.
TYPES fltime TYPE s_fltime.
TYPES note   TYPE string.
TYPES END OF ty_route_ext.

DATA ls_route TYPE ty_route_ext.

ls_route-carrid = 'LH'.         " nessun livello in più: carrid è un componente diretto
ls_route-fltime = 444.
```

`ty_route_ext` ha sei componenti allo stesso livello: i quattro di `ty_route`, poi `fltime` e `note`. Se `ty_route` cambia, `ty_route_ext` cambia con lei. Per le strutture del Dizionario il codice vecchio usa spesso `INCLUDE STRUCTURE`, che funziona allo stesso modo.

### AS e RENAMING WITH SUFFIX

Due aggiunte rendono più comodi i componenti inclusi:

- `AS nome` dà ai componenti inclusi un nome di gruppo, così puoi anche usarli tutti insieme, come una struttura annidata.
- `RENAMING WITH SUFFIX suffisso` aggiunge un suffisso a ogni nome incluso. Ti serve quando includi due volte lo stesso tipo, perché due componenti non possono avere lo stesso nome.

```abap
TYPES: BEGIN OF ty_address,
         city    TYPE s_city,
         country TYPE s_country,
       END OF ty_address.

TYPES BEGIN OF ty_trip.
INCLUDE TYPE ty_address AS origin RENAMING WITH SUFFIX _from.
INCLUDE TYPE ty_address AS dest   RENAMING WITH SUFFIX _to.
TYPES END OF ty_trip.

DATA ls_trip TYPE ty_trip.

ls_trip-city_from = 'ROMA'.         " il nome del componente con il suffisso
ls_trip-dest-city = 'NEW YORK'.     " come ls_trip-city_to, tramite il nome del gruppo
```

## Annidare o includere?

| Domanda                                                                    | Scegli      |
| -------------------------------------------------------------------------- | ----------- |
| Il gruppo è una cosa a sé che passi da una parte all'altra?                | annidamento |
| Vuoi solo gli stessi campi più qualcuno in più, tutti allo stesso livello? | `INCLUDE`   |
| La struttura deve corrispondere a una tabella di database o a un file?     | `INCLUDE`   |

Le tabelle di database non possono contenere strutture annidate, quindi il Dizionario usa gli include: molte tabelle standard contengono righe `.INCLUDE`, e i clienti aggiungono i propri campi alle tabelle standard con le **append structure**, che funzionano come gli include. Le vedrai in [Le tabelle del database](./0046-database-tables.md) e in [Strutture e tipi tabella nel Dizionario](./0048-ddic-structures-and-table-types.md).

> [!WARNING]
> Una struttura che contiene una `string`, una tabella interna o un riferimento è **deep** (profonda); una che ha solo campi a lunghezza fissa è **flat** (piatta). Le strutture deep non si possono usare ovunque si usano quelle flat, per esempio per intero in alcune operazioni sui testi o nelle vecchie interfacce verso file. Tieni flat le strutture che scrivi su file o che passi a codice legacy.

## Esercizio

> [!IMPORTANT]
>
> 1. Definisci un tipo `ty_price` con `price` (`s_price`) e `currency` (`s_currcode`), e un tipo `ty_flight` con `carrid`, `connid`, `fldate` e un componente annidato `fare` di tipo `ty_price`.
> 2. Riempi con `VALUE` una struttura di tipo `ty_flight` per LH 0400 del 15 dicembre 2026, 650.00 EUR, e stampa prezzo e valuta.
> 3. Definisci `ty_flight_flat` con `INCLUDE TYPE ty_price AS fare` più `carrid` e `connid`, e imposta la valuta in due modi: direttamente e tramite il nome del gruppo.

### Soluzione

```abap
REPORT znested_exercise.

TYPES: BEGIN OF ty_price,
         price    TYPE s_price,
         currency TYPE s_currcode,
       END OF ty_price.

TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         fldate TYPE s_date,
         fare   TYPE ty_price,
       END OF ty_flight.

TYPES BEGIN OF ty_flight_flat.
TYPES carrid TYPE s_carr_id.
TYPES connid TYPE s_conn_id.
INCLUDE TYPE ty_price AS fare.
TYPES END OF ty_flight_flat.

DATA(ls_flight) = VALUE ty_flight( carrid = 'LH' connid = '0400' fldate = '20261215'
                                   fare   = VALUE #( price = '650.00' currency = 'EUR' ) ).

WRITE: / ls_flight-fare-price, ls_flight-fare-currency.

DATA ls_flat TYPE ty_flight_flat.
ls_flat-currency      = 'EUR'.      " direttamente
ls_flat-fare-currency = 'USD'.      " tramite il nome del gruppo: è lo stesso campo
```

> [!NOTE]
>
> - Un componente con un tipo struttura crea una struttura annidata; raggiungi i campi interni concatenando i selettori, come `ls_booking-customer-name`.
> - Le espressioni `VALUE #( )` annidate riempiono le strutture annidate con una sola istruzione.
> - `INCLUDE TYPE` copia i componenti di una struttura in un'altra allo stesso livello; non può far parte di un `TYPES` concatenato.
> - `AS nome` aggiunge un nome di gruppo; `RENAMING WITH SUFFIX` evita i conflitti di nome quando includi due volte un tipo.
> - Le tabelle di database usano include e append structure, mai strutture annidate.
