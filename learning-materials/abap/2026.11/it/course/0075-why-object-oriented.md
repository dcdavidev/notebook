---
title: Perché la programmazione a oggetti
description: 'Dalle procedure agli oggetti: che cosa cambia e perché aiuta.'
---

_Livello intermedio_

Finora hai diviso i programmi in [subroutine](./0069-includes-and-subroutines.md) e [moduli funzione](./0070-function-modules.md): blocchi di codice che lavorano sui dati che ricevono o che stanno in variabili globali. Questa è la **programmazione procedurale**. Funziona, ma quando i programmi crescono si perde il legame tra i dati e il codice che li modifica.

La **programmazione orientata agli oggetti** (OOP) tiene insieme dati e codice negli **oggetti**. La parte a oggetti di ABAP si chiama **ABAP Objects**, e quasi tutto ciò che è moderno in SAP si basa su di essa: ALV, RAP, BAdI, ABAP Unit e ABAP Cloud. Questa lezione spiega le idee; le lezioni successive mostrano la sintassi.

## Il problema delle procedure e dei dati globali

Immagina un programma che gestisce i posti dei voli. In modo procedurale, tieni i dati in variabili globali e scrivi subroutine che li modificano:

```abap
DATA gv_seatsmax TYPE s_seatsmax.
DATA gv_seatsocc TYPE s_seatsocc.

FORM book_seat.
  IF gv_seatsocc < gv_seatsmax.
    gv_seatsocc = gv_seatsocc + 1.
  ENDIF.
ENDFORM.
```

Questo crea alcuni problemi:

- **Chiunque può modificare i dati.** Qualsiasi riga del programma può scrivere `gv_seatsocc = 500`, saltando il controllo di `book_seat`. Quando il valore è sbagliato, devi cercare in tutto il programma chi l'ha cambiato.
- **Una sola copia.** Le variabili contengono i posti di un solo volo. Per due voli ti servono due gruppi di variabili, oppure una tabella e un indice da passare ovunque.
- **Riutilizzare significa copiare.** Un gruppo funzione condivide i suoi dati globali tra tutti i chiamanti della stessa sessione, quindi si comporta come un unico oggetto che non puoi duplicare.

## Gli oggetti: dati e comportamento insieme

Una **classe** descrive un tipo di cosa: quali dati contiene (**attributi**) e che cosa sa fare (**metodi**). Un **oggetto** è un'istanza concreta di una classe, con i suoi valori. Ecco un'anteprima dello stesso esempio con una classe; la sintassi arriva in [classi e oggetti](./0076-classes-and-objects.md):

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    METHODS book_seat.
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax VALUE 200.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD book_seat.
    IF mv_seatsocc < mv_seatsmax.
      mv_seatsocc = mv_seatsocc + 1.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_flight_rome)  = NEW lcl_flight( ).   " un oggetto
  DATA(lo_flight_tokyo) = NEW lcl_flight( ).   " un altro oggetto, con i suoi posti
  lo_flight_rome->book_seat( ).
```

- I contatori dei posti sono **privati**: solo i metodi della classe possono modificarli, quindi il controllo di `book_seat` non si può saltare.
- Ogni oggetto ha i suoi contatori. Puoi creare tutti i voli che ti servono.

> [!TIP]
> Una classe è il progetto di una casa; gli oggetti sono le case costruite da quel progetto. Ogni casa ha le stesse stanze, ma ognuna ha i suoi mobili, e non puoi spostare i mobili in casa d'altri senza passare dalla porta d'ingresso, cioè dai metodi.

## Le quattro grandi idee

| Idea               | Che cosa significa                                           | Lezione                                                               |
| ------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Incapsulamento** | un oggetto nasconde i suoi dati ed espone solo i metodi      | [Visibilità e incapsulamento](./0080-visibility-and-encapsulation.md) |
| **Ereditarietà**   | una classe può estenderne un'altra e riutilizzarne il codice | [L'ereditarietà](./0082-inheritance.md)                               |
| **Interfacce**     | classi non correlate promettono di offrire gli stessi metodi | [Le interfacce](./0084-interfaces.md)                                 |
| **Polimorfismo**   | la stessa chiamata fa cose diverse a seconda dell'oggetto    | [Polimorfismo e casting](./0085-polymorphism-and-casting.md)          |

Insieme ti permettono di cambiare una parte di un programma senza rompere le altre, di testare le classi in isolamento con [ABAP Unit](./0105-abap-unit-basics.md) e di estendere lo standard SAP con le [BAdI](./0122-badis.md), che sono interfacce che implementi tu.

## Che cosa cambia in pratica

| ABAP procedurale                      | ABAP Objects                                                            |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `FORM`, `PERFORM`, moduli funzione    | metodi delle classi                                                     |
| variabili globali condivise da tutti  | attributi che appartengono a un oggetto                                 |
| una sola copia dei dati per programma | tanti oggetti quanti ne crei                                            |
| `sy-subrc` ed eccezioni classiche     | [eccezioni basate su classi](./0089-class-based-exceptions.md)          |
| sintassi obsoleta ancora ammessa      | sintassi più rigida: niente header line, niente `TABLES`, niente `FORM` |

> [!WARNING]
> Le classi da sole non producono buon codice. Una classe con un unico metodo enorme e tanti attributi pubblici ha tutti i problemi del codice procedurale, solo con parole chiave diverse. Tieni le classi piccole, con un compito chiaro, e tieni privati i loro dati.

Non devi riscrivere i programmi vecchi. Codice procedurale e codice a oggetti lavorano insieme: un report può creare oggetti in `START-OF-SELECTION`, e un metodo può chiamare un modulo funzione o una BAPI.

## Esercizio

> [!IMPORTANT]
>
> 1. Prendi un tuo report che usa variabili globali e subroutine (oppure quello di [include e subroutine](./0069-includes-and-subroutines.md)).
> 2. Elenca le sue variabili globali e, per ognuna, scrivi quali subroutine la leggono o la modificano.
> 3. Raggruppa le variabili e le subroutine che stanno insieme: ogni gruppo è una classe candidata. Dai un nome a ogni gruppo e indica quali dati dovrebbero essere privati.

### Soluzione

Per l'esempio delle subroutine, l'analisi potrebbe essere questa:

| Dati globali       | Usati da                           | Classe candidata        |
| ------------------ | ---------------------------------- | ----------------------- |
| `gt_flights`       | `read_flights`, `count_free_seats` | `lcl_flight_list`       |
| `lv_free` (locale) | il chiamante                       | restituito da un metodo |

`lcl_flight_list` avrebbe un attributo privato con i voli, un metodo per leggerli per una compagnia e un metodo che restituisce il numero di posti liberi. Nessun altro codice potrebbe modificare direttamente la tabella.

> [!NOTE]
>
> - Il codice procedurale tiene separati dati e logica; con i dati globali, chiunque può cambiare qualsiasi cosa.
> - Una classe definisce attributi (dati) e metodi (comportamento); un oggetto è un'istanza con i suoi valori.
> - Incapsulamento, ereditarietà, interfacce e polimorfismo sono le idee principali della OOP.
> - Le tecnologie SAP moderne (ALV, RAP, BAdI, ABAP Unit, ABAP Cloud) si basano tutte su ABAP Objects.
> - Codice procedurale e codice a oggetti si possono mescolare, quindi puoi adottare le classi un passo alla volta.
