---
title: Il Dizionario ABAP
description: Il catalogo centrale dei tipi e degli oggetti del database.
---

_Livello base_

Il **Dizionario ABAP** (spesso chiamato **DDIC**) è il catalogo centrale di un sistema SAP. Descrive le tabelle del database, i tipi che tutti i programmi possono condividere e molti altri oggetti, come viste, aiuti di ricerca e oggetti di blocco. Quando crei una tabella nel Dizionario, il sistema la crea per te nel database.

Finora hai definito i tipi con `TYPES` dentro un programma. I tipi del Dizionario sono **globali**: ogni programma, classe e modulo funzione del sistema li può usare, e una modifica in un punto raggiunge tutti.

## Che cosa contiene il Dizionario

| Oggetto              | Che cosa descrive                                                                    | Lezione                                                                     |
| -------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| dominio              | tipo tecnico, lunghezza e valori ammessi                                             | [i domini](./0044-domains.md)                                               |
| elemento dati        | il significato di business di un campo: etichette e documentazione                   | [gli elementi dati](./0045-data-elements.md)                                |
| tabella del database | una tabella nel database, con campi, chiavi e impostazioni tecniche                  | [le tabelle del database](./0046-database-tables.md)                        |
| struttura            | un gruppo di campi, usato come tipo; non contiene dati                               | [strutture e tipi tabella](./0048-ddic-structures-and-table-types.md)       |
| tipo tabella         | il tipo di una tabella interna                                                       | [strutture e tipi tabella](./0048-ddic-structures-and-table-types.md)       |
| vista                | una combinazione di campi di una o più tabelle                                       | [viste e manutenzione delle tabelle](./0049-views-and-table-maintenance.md) |
| aiuto di ricerca     | l'elenco di valori che compare con F4                                                | [gli aiuti di ricerca](./0050-search-helps.md)                              |
| oggetto di blocco    | un blocco logico sulle righe, per evitare che due utenti modifichino gli stessi dati | [gli oggetti di blocco](./0051-lock-objects.md)                             |

In SAP S/4HANA le viste nuove sono di solito CDS view entity, che incontrerai in [le CDS view entity](./0132-cds-view-entities.md). Si definiscono in ADT, ma fanno parte dello stesso Dizionario.

## Dal dominio al campo

Il Dizionario descrive un campo di tabella su tre livelli. Prendi il campo `CARRID` della tabella `SFLIGHT`:

| Livello          | Oggetto          | Che cosa dice                                                |
| ---------------- | ---------------- | ------------------------------------------------------------ |
| dominio          | `S_CARR_ID`      | 3 caratteri (`CHAR 3`)                                       |
| elemento dati    | `S_CARR_ID`      | "Codice compagnia aerea", con etichette breve, media e lunga |
| campo di tabella | `SFLIGHT-CARRID` | la compagnia di questo volo, un campo chiave di `SFLIGHT`    |

Il dominio è il lato tecnico, l'elemento dati è il significato e il campo è il punto in cui vengono usati. Molti elementi dati possono condividere un dominio, e molti campi possono condividere un elemento dati.

> [!TIP]
> Pensa al progetto di un edificio. Il dominio è il tipo di mattone: misure e materiale. L'elemento dati è il ruolo del mattone: "muro della cucina". Il campo di tabella è il muro vero di una certa casa. Lo stesso mattone si usa in tanti ruoli, e lo stesso ruolo compare in tante case.

## Usare i tipi del Dizionario in ABAP

Qualsiasi tipo del Dizionario si usa dopo `TYPE`, esattamente come un tipo locale:

```abap
DATA lv_carrid  TYPE s_carr_id.                 " elemento dati
DATA ls_flight  TYPE sflight.                   " una tabella usata come tipo struttura
DATA lt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA lv_city    TYPE spfli-cityfrom.            " il tipo di un campo di tabella
DATA lt_texts   TYPE string_table.              " un tipo tabella del Dizionario
```

Usare i tipi del Dizionario invece di `c LENGTH 3` ha vantaggi concreti:

- la variabile ha esattamente lo stesso tipo del campo del database, quindi non ci sono problemi di conversione;
- se il dominio cambia, il programma si adegua alla successiva attivazione;
- schermate, schermate di selezione e liste ALV prendono in automatico etichette, aiuto F4 e controlli dall'elemento dati.

## Dove lavori con il Dizionario

| Strumento        | Uso                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `SE11`           | la transazione classica del Dizionario ABAP in SAP GUI: visualizzare, creare e modificare oggetti |
| ADT (Eclipse)    | l'editor moderno; tabelle e strutture si modificano come codice sorgente, le entità CDS solo qui  |
| `SE16N` / `SE16` | visualizzare il contenuto di una tabella                                                          |
| `SE14`           | utility del database: adeguare una tabella nel database dopo una modifica                         |

Ogni oggetto del Dizionario, come un programma, va **attivato** prima di poterlo usare. L'attivazione controlla l'oggetto e crea la versione di runtime; per una tabella, crea o modifica anche la tabella nel database. Prima di modificare un oggetto usa la **lista delle occorrenze** (where-used list: `Ctrl+Shift+G` in ADT, il pulsante apposito in `SE11`) per vedere chi dipende da esso.

> [!WARNING]
> Non modificare mai un oggetto standard SAP del Dizionario, come `SFLIGHT` o un dominio standard. Crea i tuoi oggetti nello spazio dei nomi del cliente (che inizia con `Z` o `Y`) ed estendi le tabelle standard solo con le tecniche previste da SAP, come le append structure.

## Esercizio

> [!IMPORTANT]
>
> 1. Apri la tabella `SFLIGHT` in `SE11` o in ADT. Trova i suoi campi chiave, e l'elemento dati e il dominio del campo `PRICE`.
> 2. Scrivi un piccolo report che dichiara una variabile con il tipo di `SFLIGHT-PLANETYPE` e una tabella di righe di `SCARR`, e stampa la lunghezza della variabile con `strlen( )` dopo averla riempita.

### Soluzione

1. La chiave di `SFLIGHT` è `MANDT`, `CARRID`, `CONNID`, `FLDATE`. Il campo `PRICE` ha l'elemento dati `S_PRICE` e il dominio `S_PRICE` (tipo `CURR`, lunghezza 15, 2 decimali).
2. Un report possibile:

```abap
REPORT zddic_types.

DATA lv_planetype TYPE sflight-planetype.
DATA lt_airlines  TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.

lv_planetype = 'A320-200'.
DATA(lv_len) = strlen( lv_planetype ).
WRITE: / lv_planetype, lv_len.
```

> [!NOTE]
>
> - Il Dizionario ABAP è il catalogo centrale dei tipi globali e degli oggetti del database di un sistema SAP.
> - Un campo è descritto da un dominio (tipo tecnico), da un elemento dati (significato) e dalla tabella che lo usa.
> - I tipi del Dizionario si usano in ABAP con `TYPE`, come i tipi locali, e mantengono i programmi coerenti con il database.
> - Lavori con il Dizionario in `SE11` o in ADT; ogni oggetto va attivato prima dell'uso.
> - Crea i tuoi oggetti nello spazio dei nomi `Z` o `Y` e non modificare gli oggetti standard.
