---
title: I domini
description: Tipo tecnico, lunghezza, intervalli di valori e routine di conversione.
---

_Livello base_

Un **dominio** descrive il lato tecnico di un campo: il tipo del Dizionario, la lunghezza, il numero di decimali e, se serve, i valori che può assumere e come viene convertito per la visualizzazione. Non dice nulla sul significato del campo: quello è il compito dell'[elemento dati](./0045-data-elements.it.md).

I domini sono il livello più basso del [Dizionario ABAP](./0043-abap-dictionary-intro.it.md). Di solito un dominio è condiviso da molti elementi dati, quindi una regola tecnica definita una volta vale per tutti i campi costruiti su di esso.

## Gli attributi tecnici

La scheda **Definizione** di un dominio in `SE11` (o l'editor dei domini in ADT) contiene questi attributi:

| Attributo              | Significato                                                                                         | Esempio |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------- |
| tipo dati              | il tipo del Dizionario: `CHAR`, `NUMC`, `DEC`, `CURR`, `DATS`, `INT4`...                            | `CHAR`  |
| numero di caratteri    | la lunghezza                                                                                        | `3`     |
| decimali               | solo per i tipi numerici come `DEC`, `CURR`, `QUAN`                                                 | `2`     |
| lunghezza di output    | la larghezza usata su schermate e liste                                                             | `3`     |
| routine di conversione | la conversione fra formato interno e formato di visualizzazione                                     | `ALPHA` |
| segno                  | se sono ammessi valori negativi (tipi numerici)                                                     | no      |
| minuscole              | se le minuscole vengono mantenute (`CHAR`); altrimenti le schermate convertono l'input in maiuscolo | no      |

I tipi del Dizionario corrispondono a tipi ABAP:

| Tipo del Dizionario            | Tipo ABAP             | Uso                                 |
| ------------------------------ | --------------------- | ----------------------------------- |
| `CHAR`                         | `c`                   | testo a lunghezza fissa             |
| `NUMC`                         | `n`                   | solo cifre, con zeri iniziali       |
| `DEC`, `CURR`, `QUAN`          | `p`                   | numeri packed, importi, quantità    |
| `INT1`, `INT2`, `INT4`, `INT8` | `b`, `s`, `i`, `int8` | interi                              |
| `DATS`, `TIMS`                 | `d`, `t`              | data e ora                          |
| `CUKY`, `UNIT`                 | `c`                   | codice valuta, unità di misura      |
| `STRING`, `RAWSTRING`          | `string`, `xstring`   | testo e byte di qualsiasi lunghezza |

Per esempio, il dominio standard `S_CARR_ID` è `CHAR 3`, e `S_PRICE` è `CURR 15` con 2 decimali.

## Gli intervalli di valori

La scheda **Range di valori** limita i valori che un campo può assumere. Ci sono tre possibilità:

- **Valori fissi**: un breve elenco di valori singoli, ognuno con una descrizione. Adatti a codici che cambiano solo gli sviluppatori, come uno stato.
- **Intervalli**: intervalli di valori ammessi, per esempio da `1` a `9`.
- **Tabella valori**: una tabella che contiene i valori ammessi, per esempio `SCARR` per il dominio `S_CARR_ID`. È solo una proposta: il controllo vero arriva da una chiave esterna, vedi [chiavi esterne e tabelle di controllo](./0047-foreign-keys-and-check-tables.it.md).

Un dominio per lo stato di un volo potrebbe essere così:

```text
Dominio:            ZD_FLIGHT_STATUS
Descrizione breve:  Stato del volo
Tipo dati:          CHAR
N. caratteri:       1
Minuscole:          no

Valori fissi:
  S   Programmato
  D   In ritardo
  C   Cancellato
```

Le schermate e le schermate di selezione controllano l'input rispetto ai valori fissi e li mostrano come aiuto F4, senza scrivere codice. Le descrizioni sono salvate nelle tabelle `DD07L` e `DD07T` e si possono tradurre.

> [!WARNING]
> I valori fissi vengono controllati solo sulle schermate. Il codice ABAP può mettere qualsiasi valore nel campo, e un `INSERT` lo scrive nel database senza protestare. Se un valore arriva da un programma o da un'interfaccia, controllalo nel codice.

## Le routine di conversione

Una **routine di conversione** trasforma un valore dal formato interno (come viene salvato) al formato di visualizzazione (come lo vede l'utente), e viceversa. È una coppia di moduli funzione chiamati `CONVERSION_EXIT_xxxxx_INPUT` e `CONVERSION_EXIT_xxxxx_OUTPUT`, dove `xxxxx` è il nome di cinque caratteri indicato nel dominio.

La più comune è **`ALPHA`**: i numeri in un campo `CHAR` vengono salvati con gli zeri iniziali e mostrati senza. Il numero cliente `KUNNR` la usa: l'utente digita `4711`, il database contiene `0000004711`.

Quando riempi un campo di questo tipo nel codice, devi usare tu il formato interno. I template di stringa hanno un'opzione `ALPHA` per questo:

```abap
DATA lv_kunnr TYPE kunnr VALUE '4711'.

lv_kunnr = |{ lv_kunnr ALPHA = IN }|.     " formato interno: 0000004711
WRITE / lv_kunnr.                         " WRITE usa la routine di output: 4711

DATA(lv_display) = |{ lv_kunnr ALPHA = OUT }|.  " 4711 come testo
```

Puoi anche chiamare direttamente il modulo funzione (i moduli funzione sono spiegati in [i moduli funzione](./0070-function-modules.it.md)):

```abap
CALL FUNCTION 'CONVERSION_EXIT_ALPHA_INPUT'
  EXPORTING
    input  = lv_kunnr
  IMPORTING
    output = lv_kunnr.
```

> [!TIP]
> Una routine di conversione è come un numero di telefono. Tu componi `333 1234567`, ma la compagnia telefonica lo registra come `+39 333 1234567`. La persona e il sistema vedono due forme dello stesso numero.

> [!CAUTION]
> Cambiare il tipo o la lunghezza di un dominio già in uso cambia tutti i campi di tabella costruiti su di esso. Per le tabelle che contengono dati, la tabella del database va convertita: può richiedere molto tempo e, con una lunghezza minore, troncare i valori. Controlla prima la lista delle occorrenze e pianifica queste modifiche con attenzione.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea il dominio `ZD_FLIGHT_STATUS` (`CHAR 1`) con i valori fissi `S` Programmato, `D` In ritardo e `C` Cancellato, e attivalo.
> 2. Apri il dominio del campo `SPFLI-CARRID` e trova la sua tabella valori.
> 3. Scrivi qualche riga di ABAP che converte il numero cliente `123` nel formato interno con `ALPHA = IN` e lo stampa.

### Soluzione

1. In `SE11` scegli **Dominio**, inserisci `ZD_FLIGHT_STATUS`, imposta tipo dati `CHAR` e lunghezza 1, inserisci i tre valori fissi nella scheda **Range di valori**, salva nel tuo pacchetto e attiva.
2. `SPFLI-CARRID` usa il dominio `S_CARR_ID`, la cui tabella valori è `SCARR`.
3. Codice:

```abap
DATA lv_kunnr TYPE kunnr VALUE '123'.
lv_kunnr = |{ lv_kunnr ALPHA = IN }|.
WRITE / |Formato interno: { lv_kunnr ALPHA = RAW }|.   " 0000000123
```

> [!NOTE]
>
> - Un dominio definisce il tipo tecnico: tipo del Dizionario, lunghezza, decimali, lunghezza di output, segno e minuscole.
> - Gli intervalli di valori possono essere valori fissi, intervalli o una tabella valori; vengono controllati sulle schermate, non nel codice ABAP.
> - Una routine di conversione (`CONVERSION_EXIT_xxxxx_INPUT` / `_OUTPUT`) passa dal formato interno a quello di visualizzazione e viceversa.
> - `ALPHA` aggiunge gli zeri iniziali nel formato interno; usa `ALPHA = IN` nei template di stringa quando riempi questi campi nel codice.
> - Cambiare un dominio ha effetto su tutti i campi che lo usano: controlla prima la lista delle occorrenze.
