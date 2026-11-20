---
title: Gli elementi dati
description: Significato di business, etichette e documentazione di un campo.
---

_Livello base_

Un **elemento dati** dà a un campo il suo significato di business. Dice che cos'è il campo ("codice compagnia aerea", "stato del volo"), quali etichette vede l'utente e quale documentazione compare con F1. Per il tipo tecnico, di solito fa riferimento a un [dominio](./0044-domains.it.md).

Gli elementi dati sono i tipi che usi di più in ABAP: quasi ogni campo di una tabella del database e quasi ogni variabile che contiene dati di business ha come tipo un elemento dati.

## Il tipo di un elemento dati

In `SE11` (**Tipo dati** > **Elemento dati**) o in ADT, la scheda **Tipo dati** offre tre scelte:

| Scelta           | Significato                                                                  | Esempio                                |
| ---------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| dominio          | tipo, lunghezza e intervallo di valori vengono da un dominio                 | `S_CARR_ID` usa il dominio `S_CARR_ID` |
| tipo predefinito | un tipo del Dizionario e una lunghezza, inseriti direttamente, senza dominio | `CHAR 30`                              |
| tipo riferimento | un riferimento a una classe, a un'interfaccia o a un tipo                    | `REF TO cl_abap_typedescr`             |

Il dominio è la scelta migliore quando le stesse regole tecniche valgono per molti campi, o quando ti servono valori fissi o una routine di conversione. Un tipo predefinito va bene per un campo isolato, senza regole.

## Le etichette

La scheda **Denominazione campo** contiene i testi che schermate, schermate di selezione e liste ALV mostrano per ogni campo che ha come tipo l'elemento dati:

| Etichetta    | Lunghezza max. | Usata per                           |
| ------------ | -------------- | ----------------------------------- |
| breve        | 10             | colonne strette                     |
| media        | 20             | etichette dei campi sulle schermate |
| lunga        | 40             | etichette più larghe                |
| intestazione | 55             | intestazioni di colonna nelle liste |

Per l'elemento dati `ZE_FLIGHT_STATUS` le etichette potrebbero essere:

```text
Elemento dati:       ZE_FLIGHT_STATUS
Descrizione breve:   Stato del volo
Dominio:             ZD_FLIGHT_STATUS

Denominazioni:  Lungh.  Testo
  Breve         10      Stato
  Media         20      Stato del volo
  Lunga         40      Stato del volo
  Intestazione  15      Stato volo
```

Le etichette si traducono insieme agli altri testi del sistema (transazione `SE63`), quindi un utente che accede in inglese vede le etichette in inglese senza modificare il programma.

> [!TIP]
> Un dominio è la misura e la forma di un barattolo; un elemento dati è l'etichetta che ci attacchi sopra: "zucchero", "sale". Due barattoli possono essere identici e avere significati molto diversi, ed è l'etichetta che dice al cuoco quale usare.

## La documentazione e gli altri attributi

Oltre alle etichette, un elemento dati può avere:

- **Documentazione**: il testo che l'utente vede premendo F1 sul campo. La scrivi con il pulsante **Documentazione** dell'elemento dati.
- **Aiuto di ricerca**: l'aiuto F4 da proporre per il campo, vedi [gli aiuti di ricerca](./0050-search-helps.it.md).
- **ID parametro**: una chiave nella memoria SAP usata per proporre il valore del campo fra una transazione e l'altra, come `MAT` per il numero materiale. Vedi [chiamare programmi, memoria SAP e memoria ABAP](./0072-calling-programs-and-memory.it.md).
- **Nome componente di default**: un nome di campo suggerito per le tabelle e le strutture che usano l'elemento dati.
- **Documento di modifica**: un flag che fa comparire le modifiche al campo nei [documenti di modifica](./0118-change-documents.it.md).

## Usare gli elementi dati in ABAP

Usi un elemento dati dopo `TYPE` come qualsiasi altro tipo. La variabile ha così esattamente il tipo di tutti i campi del database costruiti sullo stesso elemento dati:

```abap
REPORT zflight_status_demo.

PARAMETERS p_carrid TYPE s_carr_id.          " etichetta e F4 dal Dizionario
PARAMETERS p_status TYPE ze_flight_status VALUE CHECK. " valori fissi dal dominio

START-OF-SELECTION.
  DATA lv_status TYPE ze_flight_status.
  lv_status = p_status.
  WRITE: / p_carrid, lv_status.
```

Sulla schermata di selezione, il campo di input di `p_status` propone con F4 i valori fissi del dominio, e `VALUE CHECK` rifiuta tutti gli altri valori (le schermate di selezione sono spiegate in [schermate di selezione: PARAMETERS](./0063-parameters.it.md)). Per mostrare l'etichetta del Dizionario invece del nome del parametro, imposta il flag **Riferimento al Dizionario** nei testi di selezione del programma (vedi [simboli di testo e traduzione](./0062-text-symbols-and-translation.it.md)).

> [!WARNING]
> Non creare un nuovo elemento dati per ogni campo "per sicurezza". Controlla prima se ne esiste uno standard con il significato giusto (`S_CARR_ID`, `S_DATE`, `SYUNAME`...). Riusare l'elemento dati giusto ti dà gratis etichette, aiuto e F4. Riusarne uno con un significato sbagliato dà all'utente etichette sbagliate.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea l'elemento dati `ZE_FLIGHT_STATUS` con il dominio `ZD_FLIGHT_STATUS` della lezione sui [domini](./0044-domains.it.md), compila le quattro etichette e attivalo.
> 2. Scrivi un report con `PARAMETERS p_status TYPE ze_flight_status VALUE CHECK`, eseguilo e premi F4 sul campo. Poi prova a inserire `X`.

### Soluzione

1. In `SE11` scegli **Tipo dati**, inserisci `ZE_FLIGHT_STATUS`, scegli **Elemento dati**, inserisci il dominio `ZD_FLIGHT_STATUS` nella scheda **Tipo dati**, compila le etichette nella scheda **Denominazione campo**, salva e attiva.
2. F4 mostra i tre valori fissi con le loro descrizioni. Con `X` la schermata mostra un errore e non ti fa proseguire, perché `X` non è un valore fisso del dominio.

> [!NOTE]
>
> - Un elemento dati dà a un campo il suo significato; il tipo tecnico di solito viene da un dominio.
> - Le etichette (breve, media, lunga, intestazione) compaiono su schermate e liste e si possono tradurre.
> - Un elemento dati può avere anche documentazione F1, un aiuto di ricerca e un ID parametro.
> - Dai alle variabili e ai parametri il tipo di un elemento dati per avere lo stesso tipo dei campi del database.
> - Riusa un elemento dati standard solo se il suo significato è davvero quello giusto.
