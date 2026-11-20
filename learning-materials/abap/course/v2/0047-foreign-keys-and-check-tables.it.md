---
title: Chiavi esterne e tabelle di controllo
description: Collegare le tabelle e controllare i valori inseriti.
---

_Livello base_

Una **chiave esterna** collega un campo di una tabella alla chiave primaria di un'altra tabella, la **tabella di controllo**. Dice: "un valore in questo campo è valido solo se esiste nella tabella di controllo". Il Dizionario usa le chiavi esterne per controllare l'input dell'utente sulle schermate, per offrire l'aiuto F4 e per descrivere come le tabelle sono collegate fra loro.

Nel modello dei voli, ogni codice compagnia in `SPFLI` e `SFLIGHT` deve esistere in `SCARR`, e ogni volo in `SFLIGHT` deve appartenere a un collegamento di `SPFLI`. Queste regole sono chiavi esterne.

## Le parti di una chiave esterna

| Termine                      | Significato                                                                                               | Esempio                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| tabella della chiave esterna | la tabella che contiene il campo da controllare                                                           | `SFLIGHT`                                              |
| campo di controllo           | il campo i cui valori vengono controllati                                                                 | `SFLIGHT-CARRID`                                       |
| tabella di controllo         | la tabella che contiene i valori validi                                                                   | `SCARR`                                                |
| assegnazione dei campi       | quale campo della tabella della chiave esterna corrisponde a ogni campo chiave della tabella di controllo | `MANDT` = `SFLIGHT-MANDT`, `CARRID` = `SFLIGHT-CARRID` |

A ogni campo chiave della tabella di controllo va assegnato un campo della tabella della chiave esterna (o, più di rado, una costante). Per `SFLIGHT-CONNID` la tabella di controllo è `SPFLI`, la cui chiave è `MANDT`, `CARRID`, `CONNID`: tutti e tre i campi sono assegnati, quindi un numero di collegamento è valido solo per la sua compagnia.

> [!TIP]
> Una chiave esterna è come la lista degli invitati all'ingresso di una festa. Il campo di controllo è il nome che dai alla porta, la tabella di controllo è la lista. Se il tuo nome non è sulla lista, non entri.

## Definire una chiave esterna

In ADT la chiave esterna fa parte del sorgente della tabella. Qui `ZFLIGHT_STATUS` della lezione sulle [tabelle del database](./0046-database-tables.it.md) riceve chiavi esterne verso `SCARR` e `SFLIGHT`:

```abap
define table zflight_status {

  key client : mandt not null;
  @AbapCatalog.foreignKey.keyType : #KEY
  @AbapCatalog.foreignKey.screenCheck : true
  key carrid : s_carr_id not null
    with foreign key [0..*,1] scarr
      where mandt = zflight_status.client
        and carrid = zflight_status.carrid;
  @AbapCatalog.foreignKey.keyType : #KEY
  @AbapCatalog.foreignKey.screenCheck : true
  key connid : s_conn_id not null
    with foreign key [0..*,1] sflight
      where mandt = zflight_status.client
        and carrid = zflight_status.carrid
        and connid = zflight_status.connid
        and fldate = zflight_status.fldate;
  key fldate : s_date not null;
  status     : ze_flight_status;
  changed_by : syuname;
  changed_on : sydatum;

}
```

Le annotazioni in testa alla tabella qui sono omesse; restano come prima.

In `SE11` selezioni il campo nella scheda **Campi** e premi il pulsante **Chiavi esterne** (l'icona con la chiave). Se il dominio del campo ha una **tabella valori**, il sistema la propone come tabella di controllo e compila per te l'assegnazione dei campi. Per questo `S_CARR_ID` ha `SCARR` come tabella valori: vedi [i domini](./0044-domains.it.md).

## Cardinalità e tipo di campo della chiave esterna

Altri due attributi descrivono la relazione:

- **Cardinalità** (`[0..*,1]` in ADT, `1:CN` in `SE11`): per ogni riga della tabella di controllo ci possono essere quante righe vuoi nella tabella della chiave esterna, e ogni riga della tabella della chiave esterna punta a esattamente una riga della tabella di controllo.
- **Tipo di campo della chiave esterna**: se il campo di controllo è un campo chiave della sua tabella (`#KEY`), un campo non chiave (`#NON_KEY`) o la chiave di una tabella di testo (`#TEXT_KEY`).

Una **tabella di testo** è un caso particolare: contiene i testi dipendenti dalla lingua di un'altra tabella, con la stessa chiave più un campo lingua. Per esempio, `T005T` contiene i nomi dei paesi di `T005`. Una tabella di testo è collegata alla sua tabella principale con una chiave esterna di tipo "campi chiave di una tabella di testo", e l'aiuto F4 mostra così i testi nella lingua di logon.

## Dove avviene il controllo

Il controllo avviene **sulle schermate**: le schermate Dynpro classiche, le schermate di selezione con `VALUE CHECK` e la manutenzione delle tabelle con `SM30`. Se l'utente inserisce una compagnia che non è in `SCARR`, la schermata mostra un errore e F4 propone i valori validi.

> [!WARNING]
> Il database non applica le chiavi esterne del Dizionario. Un `INSERT` o un `UPDATE` di ABAP SQL scrive qualsiasi valore, valido o no. Quando il tuo programma scrive dati che non arrivano da una schermata controllata, controllali prima tu.

Un controllo semplice nel codice usa una `SELECT SINGLE` sulla tabella di controllo (imparerai la `SELECT` in [leggere dati con SELECT](./0052-select-basics.it.md)):

```abap
DATA lv_carrid TYPE s_carr_id VALUE 'XX'.

SELECT SINGLE @abap_true
  FROM scarr
  WHERE carrid = @lv_carrid
  INTO @DATA(lv_exists).

IF lv_exists = abap_false.
  WRITE / |La compagnia { lv_carrid } non esiste|.
ENDIF.
```

| Strumento                             | Quando usarlo                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| valori fissi di un dominio            | pochi valori stabili decisi dagli sviluppatori, come uno stato                  |
| tabella di controllo (chiave esterna) | valori che gli utenti gestiscono e che crescono, come compagnie aeree o clienti |

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi una chiave esterna da `ZFLIGHT_STATUS-CARRID` verso `SCARR` e attiva la tabella.
> 2. Apri `SFLIGHT` e guarda la chiave esterna del campo `CONNID`: quale tabella di controllo e quale assegnazione dei campi usa?
> 3. Scrivi un report con `PARAMETERS p_carrid TYPE zflight_status-carrid VALUE CHECK`, eseguilo e inserisci un codice compagnia che non esiste.

### Soluzione

1. Usa il sorgente ADT qui sopra per `carrid`, oppure il pulsante **Chiavi esterne** in `SE11`, accetta la proposta con `SCARR` e attiva.
2. `SFLIGHT-CONNID` ha la tabella di controllo `SPFLI`, con `MANDT` = `SFLIGHT-MANDT`, `CARRID` = `SFLIGHT-CARRID` e `CONNID` = `SFLIGHT-CONNID`.
3. La schermata di selezione mostra un messaggio di errore per una compagnia che non è in `SCARR`, e F4 elenca le compagnie che ci sono.

> [!NOTE]
>
> - Una chiave esterna collega un campo di controllo alla chiave primaria di una tabella di controllo.
> - A ogni campo chiave della tabella di controllo corrisponde un campo (o una costante) della tabella della chiave esterna.
> - La tabella valori di un dominio è la tabella di controllo proposta.
> - Cardinalità e tipo di campo della chiave esterna descrivono la relazione; le tabelle di testo contengono i testi tradotti.
> - Il controllo avviene sulle schermate, non nel database: controlla i valori nel codice prima di scriverli.
