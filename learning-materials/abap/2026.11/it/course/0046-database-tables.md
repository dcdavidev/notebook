---
title: Le tabelle del database
description: Creare una tabella trasparente con campi, chiavi e impostazioni tecniche.
level: basic
---

Una **tabella trasparente** è una tabella del Dizionario che corrisponde esattamente a una tabella del database, con lo stesso nome e gli stessi campi. Quando la attivi, il sistema crea la tabella nel database; da quel momento i tuoi programmi la leggono e la scrivono con ABAP SQL.

Qui costruisci la tabella `ZFLIGHT_STATUS`, che memorizza uno stato per ogni volo di `SFLIGHT`. Usa il dominio della lezione sui [domini](./0044-domains.md) e l'elemento dati della lezione sugli [elementi dati](./0045-data-elements.md).

## Campi e chiave

| Campo        | Chiave | Elemento dati      | Significato                       |
| ------------ | ------ | ------------------ | --------------------------------- |
| `CLIENT`     | sì     | `MANDT`            | il mandante                       |
| `CARRID`     | sì     | `S_CARR_ID`        | compagnia aerea                   |
| `CONNID`     | sì     | `S_CONN_ID`        | numero del collegamento           |
| `FLDATE`     | sì     | `S_DATE`           | data del volo                     |
| `STATUS`     |        | `ZE_FLIGHT_STATUS` | stato del volo                    |
| `CHANGED_BY` |        | `SYUNAME`          | utente che ha modificato lo stato |
| `CHANGED_ON` |        | `SYDATUM`          | data della modifica               |

I campi segnati come chiave formano la **chiave primaria**: due righe non possono avere gli stessi valori in tutti questi campi. Regole per la chiave:

- I campi chiave vengono per primi, uno dopo l'altro.
- Una tabella **dipendente dal mandante** ha come primo campo chiave un campo mandante di tipo `MANDT` (o `CLNT`). La maggior parte delle tabelle dipende dal mandante: ogni mandante vede solo le proprie righe, e ABAP SQL aggiunge per te la condizione sul mandante.
- Senza campo mandante, la tabella è **indipendente dal mandante**: le stesse righe in tutti i mandanti. È raro, soprattutto per dati tecnici.

> [!TIP]
> La chiave primaria è come il posto su un volo: compagnia, numero del volo, data e numero del posto insieme indicano un solo sedile. Due passeggeri non possono avere la stessa combinazione.

## Crearla in ADT

In ADT scegli **New** > **Other ABAP Repository Object** > **Database Table**, inserisci il nome e una descrizione e scrivi la definizione come codice sorgente:

```abap
@EndUserText.label : 'Stato di un volo'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zflight_status {

  key client : mandt not null;
  key carrid : s_carr_id not null;
  key connid : s_conn_id not null;
  key fldate : s_date not null;
  status     : ze_flight_status;
  changed_by : syuname;
  changed_on : sydatum;

}
```

In `SE11` inserisci le stesse informazioni in schede: **Consegna e manutenzione**, **Campi** e **Impostazioni tecniche**. I due editor creano lo stesso oggetto.

## Gli attributi della tabella

Le annotazioni in alto corrispondono agli attributi che trovi in `SE11`:

| Attributo                | Valori comuni                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| classe di consegna       | `A` dati applicativi (dati anagrafici e di movimento), `C` customizing, `L` dati temporanei |
| manutenzione dati        | se gli utenti possono vedere e modificare le righe con `SE16N` o una vista di manutenzione  |
| categoria di ampliamento | se la tabella si potrà estendere in seguito con append structure                            |

I campi importo e quantità richiedono un **campo di riferimento**. Un campo di tipo `CURR` deve puntare a un campo `CUKY` con la valuta, e un campo `QUAN` a un campo `UNIT`. In `SFLIGHT`, `PRICE` fa riferimento a `CURRENCY`, perché 100 significa cose molto diverse in EUR e in JPY. In ADT scrivi il riferimento come annotazione sul campo importo. Per una tabella `ZFLIGHT_PRICE` con un prezzo e la sua valuta:

```abap
  @Semantics.amount.currencyCode : 'zflight_price.currency'
  price    : s_price;
  currency : s_currcode;
```

## Le impostazioni tecniche

Le **impostazioni tecniche** dicono al database come gestire la tabella. In `SE11` stanno dietro il pulsante **Impostazioni tecniche**; in ADT hanno un editor proprio, che apri dalla tabella.

| Impostazione         | Significato                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| classe dati          | il tipo di dati: `APPL0` dati anagrafici, `APPL1` dati di movimento, `APPL2` customizing                                   |
| categoria dimensioni | il numero di righe previsto, da 0 (poche) in su                                                                            |
| buffering            | tenere una copia della tabella nella memoria del server applicativo, per tabelle piccole lette spesso e modificate di rado |
| log delle modifiche  | registrare ogni modifica alle righe nella tabella `DBTABLOG`                                                               |

Per `ZFLIGHT_STATUS` scegli classe dati `APPL1`, categoria dimensioni 0 e buffering non ammesso: lo stato cambia spesso.

Dopo aver salvato, **attiva** la tabella. Il sistema la crea nel database e puoi vederne il contenuto con `SE16N`. Leggere e scrivere righe da ABAP è l'argomento di [leggere dati con SELECT](./0052-select-basics.md) e di [scrivere dati](./0059-writing-to-the-database.md).

> [!CAUTION]
> Aggiungere un campo a una tabella è sicuro. Cambiare tipo o lunghezza di un campo, togliere un campo o cambiare la chiave di una tabella che contiene già dati richiede una **conversione** nel database (`SE14`), che può essere lenta sulle tabelle grandi e può far perdere dati se i valori non entrano nel nuovo tipo. Cancellare una tabella cancella tutte le sue righe. Fai queste modifiche solo dopo aver controllato la lista delle occorrenze e i dati.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea e attiva la tabella `ZFLIGHT_STATUS` come descritto, con classe di consegna `A` e classe dati `APPL1`.
> 2. Aprila in `SE16N` e controlla che esista e sia vuota.
> 3. Apri `SFLIGHT` in `SE11` o in ADT e trova il campo di riferimento di `PAYMENTSUM`.

### Soluzione

1. Usa il sorgente ADT qui sopra, oppure inserisci gli stessi campi in `SE11`, poi imposta le impostazioni tecniche e attiva.
2. `SE16N` con la tabella `ZFLIGHT_STATUS` mostra i campi e il messaggio che non ci sono valori.
3. `PAYMENTSUM` è un campo `CURR` che fa riferimento a `SFLIGHT-CURRENCY`.

> [!NOTE]
>
> - Una tabella trasparente è una tabella del Dizionario con esattamente una tabella corrispondente nel database.
> - I campi chiave vengono per primi; le tabelle dipendenti dal mandante cominciano con un campo `MANDT`.
> - Classe di consegna, manutenzione dati e categoria di ampliamento descrivono come la tabella viene usata ed estesa.
> - I campi `CURR` e `QUAN` richiedono un campo di riferimento con la valuta o l'unità.
> - Le impostazioni tecniche (classe dati, categoria dimensioni, buffering, log) servono per l'attivazione; modificare una tabella con dati può richiedere una conversione.
