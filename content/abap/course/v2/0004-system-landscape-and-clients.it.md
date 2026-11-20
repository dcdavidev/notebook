---
title: Landscape di sistema e mandanti
description: Sistemi di sviluppo, qualità e produzione, e che cos'è un mandante.
---

_Livello principiante_

Un'azienda non ha mai un solo sistema SAP. Ha una catena di sistemi, e il codice si sposta lungo questa catena dal punto in cui lo scrivi a quello in cui le persone lo usano. Dentro ogni sistema, poi, i dati sono divisi in **mandanti** separati.

Queste due idee decidono dove lavori, dove fai i test e quali dati vedono i tuoi programmi.

## Il landscape a tre sistemi

L'insieme dei sistemi SAP che lavorano insieme è il **landscape di sistema**. Il landscape classico ha tre sistemi:

| Sistema    | ID tipico | Chi lo usa                | Che cosa succede                                 |
| ---------- | --------- | ------------------------- | ------------------------------------------------ |
| Sviluppo   | `DEV`     | sviluppatori e consulenti | scrivi il codice e imposti il customizing        |
| Qualità    | `QAS`     | tester e key user         | le modifiche vengono provate con dati realistici |
| Produzione | `PRD`     | tutta l'azienda           | il business vero: ordini veri, soldi veri        |

Ogni sistema ha un **ID di sistema** (SID): tre caratteri, come `DEV` o `S4D`. Le modifiche viaggiano dallo sviluppo alla qualità e poi alla produzione tramite le **richieste di trasporto**, come vedrai in [Pacchetti e richieste di trasporto](./0007-packages-and-transport-requests.it.md).

Alcune aziende aggiungono altri sistemi, per esempio una sandbox per fare prove, un sistema di formazione o un sistema di pre-produzione che è una copia della produzione.

> [!CAUTION]
> Non sviluppare e non fare test in produzione. Nella maggior parte dei landscape la produzione è bloccata contro le modifiche, ed è voluto: un `DELETE` sbagliato o un ciclo infinito lì colpiscono dati di business reali e utenti reali. Scrivi e prova in sviluppo, riprova in qualità e lascia che sia il trasporto a portare il tuo codice in produzione.

## Che cos'è un mandante

Un **mandante** (in inglese _client_, in tedesco _Mandant_) è un'unità autonoma dentro un sistema SAP, con i propri dati di business, i propri utenti e il proprio customizing. Il mandante è identificato da un numero di tre cifre, come `100`. Lo scegli nella schermata di accesso, insieme a utente e password.

Un sistema può avere più mandanti. In sviluppo, per esempio, il mandante `100` può contenere il customizing e il mandante `200` dei dati di prova. Gli utenti di un mandante non vedono i dati di business di un altro mandante.

Alcuni mandanti esistono in ogni sistema:

| Mandante | Scopo                                                                         |
| -------- | ----------------------------------------------------------------------------- |
| `000`    | il mandante di riferimento di SAP, consegnato con il sistema                  |
| `001`    | una copia di `000`, nei sistemi più vecchi spesso un punto di partenza        |
| `066`    | il mandante EarlyWatch per il supporto SAP (non più usato, spesso cancellato) |

La transazione `SCC4` elenca i mandanti di un sistema e le loro impostazioni, per esempio se le modifiche sono permesse.

> [!TIP]
> Un sistema è un condominio e i mandanti sono gli appartamenti. Tutti condividono la stessa struttura, gli stessi tubi e lo stesso ascensore (i programmi e le definizioni delle tabelle). Ma ogni appartamento ha i suoi mobili e i suoi inquilini (i dati e gli utenti), e per entrare ti serve la chiave della porta giusta.

## Dipendente e indipendente dal mandante

Non tutto è separato per mandante. Ogni oggetto è:

- **dipendente dal mandante**: esiste separatamente in ogni mandante. I dati di business (ordini, clienti, voli) e la maggior parte del customizing dipendono dal mandante.
- **indipendente dal mandante** (_cross-client_): è uguale in tutti i mandanti del sistema. Tutti gli **oggetti del repository** sono indipendenti dal mandante: programmi, classi, definizioni di tabelle, moduli funzione.

Per questo un programma che scrivi nel mandante `100` è subito disponibile nel mandante `200` dello stesso sistema, mentre i dati che crei nel mandante `100` no.

Tecnicamente, una tabella di database dipende dal mandante quando il suo primo campo chiave è il mandante, un campo che di solito si chiama `MANDT` ed è di tipo `CLNT`. La tabella dei voli `SCARR`, per esempio, inizia con `MANDT`.

```abap
SELECT carrid, carrname
  FROM scarr
  INTO TABLE @DATA(lt_carriers).   " legge solo le righe del mandante di accesso
```

Nella query non scrivi `MANDT`: ABAP SQL aggiunge per te la condizione sul mandante corrente. Questa **gestione automatica del mandante** tiene separati i dati di ogni mandante.

> [!WARNING]
> ABAP SQL ha un'aggiunta per leggere altri mandanti (`USING CLIENT`, o l'obsoleta `CLIENT SPECIFIED`), ma ti servirà di rado. Se pensi di averne bisogno, chiedi prima: leggere o modificare i dati di un altro mandante è quasi sempre un errore.

## Esercizio

> [!IMPORTANT]
>
> 1. Nella schermata di accesso del tuo sistema, annota il mandante con cui accedi.
> 2. Apri la transazione `SE11`, visualizza la tabella di database `SCARR` e controlla il suo primo campo.
> 3. Se hai le autorizzazioni, apri `SCC4` ed elenca i mandanti del tuo sistema.

### Soluzione

1. Il mandante è il numero di tre cifre sopra il campo utente, per esempio `001` o `100`.
2. Il primo campo di `SCARR` è `MANDT`, un campo chiave di tipo `CLNT`: la tabella dipende dal mandante.
3. `SCC4` mostra una riga per mandante, con il nome, la città e il ruolo (per esempio customizing, test o produzione).

> [!NOTE]
>
> - Un landscape ha di solito un sistema di sviluppo, uno di qualità e uno di produzione, ognuno con un ID di tre caratteri.
> - Il codice passa dallo sviluppo alla produzione con le richieste di trasporto; non si sviluppa mai in produzione.
> - Un mandante è un'unità separata dentro un sistema, con i propri dati, utenti e customizing.
> - Gli oggetti del repository sono indipendenti dal mandante; i dati di business dipendono dal mandante, con `MANDT` come primo campo chiave.
> - ABAP SQL filtra automaticamente sul mandante di accesso.
