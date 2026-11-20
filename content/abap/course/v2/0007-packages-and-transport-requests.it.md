---
title: Pacchetti e richieste di trasporto
description: Dove vivono i tuoi oggetti e come viaggiano dallo sviluppo alla produzione.
---

_Livello principiante_

Ogni oggetto che crei in un sistema SAP (un programma, una classe, una tabella) appartiene a un **pacchetto**, e ogni modifica che ci fai in un progetto reale viene registrata in una **richiesta di trasporto**. Il pacchetto dice dove vive l'oggetto; la richiesta di trasporto porta la modifica dallo sviluppo alla qualità e alla produzione, lungo il landscape che hai visto in [Landscape di sistema e mandanti](./0004-system-landscape-and-clients.it.md).

Il sistema ti chiede entrambi la prima volta che salvi un nuovo oggetto, quindi devi sapere che cosa rispondere.

## I pacchetti

Un **pacchetto** (_package_) raggruppa oggetti di sviluppo che stanno insieme, per esempio tutto ciò che serve a un'applicazione o a un'interfaccia. Nei sistemi e nei documenti più vecchi si chiama **classe di sviluppo** (_development class_).

Un pacchetto ha alcune proprietà importanti:

- **Componente software**: l'unità più grande a cui appartiene il pacchetto. I pacchetti personalizzati di solito stanno in `HOME` (o in un componente dell'azienda).
- **Layer di trasporto**: decide dove vengono trasportati gli oggetti del pacchetto, per esempio da `DEV` a `QAS` e `PRD`.
- **Pacchetto superiore**: i pacchetti formano un albero. Un'applicazione grande ha un pacchetto principale con sottopacchetti per le sue parti.

Crei i pacchetti in ADT (**File > New > Other > ABAP Package**) oppure in `SE80` / `SE21`.

## I nomi: Z, Y e $

SAP riserva la maggior parte dei nomi ai propri oggetti. I tuoi oggetti devono usare il **namespace del cliente**:

| Prefisso  | Significato                                                                     |
| --------- | ------------------------------------------------------------------------------- |
| `Z` o `Y` | oggetti del cliente: `ZFLIGHT_REPORT`, `ZCL_FLIGHT_SERVICE`                     |
| `/ABC/`   | un namespace riservato registrato presso SAP, usato da partner e grandi aziende |
| `$`       | pacchetti locali: `$TMP` e pacchetti come `$ZTRAINING`                          |

Gli oggetti di un pacchetto che inizia con `$` sono **oggetti locali**. Esistono solo nel sistema in cui li hai creati e non vengono mai trasportati. `$TMP` è il pacchetto locale personale che ogni sviluppatore ha.

> [!TIP]
> `$TMP` è la tua carta da brutta copia. Usalo per esperimenti ed esercizi; quando un pezzo di codice è destinato a utenti veri, spostalo in un pacchetto vero e proprio, così può viaggiare con un trasporto.

## Le richieste di trasporto

Una **richiesta di trasporto** è un elenco di oggetti modificati che viaggiano insieme da un sistema al successivo. Il suo numero inizia con l'ID del sistema di origine, poi `K`, poi sei cifre: per esempio `DEVK900123`.

Ci sono due tipi principali:

| Tipo        | Che cosa trasporta                                                             | Dove la vedi |
| ----------- | ------------------------------------------------------------------------------ | ------------ |
| Workbench   | oggetti del repository: programmi, classi, tabelle (indipendenti dal mandante) | `SE09`       |
| Customizing | impostazioni di configurazione (dipendenti dal mandante)                       | `SE10`       |

Una richiesta contiene un **task** per ogni sviluppatore che ci lavora. Quando modifichi un oggetto, il sistema lo registra nel tuo task e **blocca** l'oggetto per quella richiesta, così nessuno può modificarlo contemporaneamente in un'altra richiesta.

## La vita di una modifica

1. Crei o modifichi un oggetto. Il sistema ti chiede una richiesta; ne scegli una esistente o ne crei una nuova.
2. Lavori e attivi. Ogni oggetto modificato viene registrato nel tuo task.
3. Quando hai finito, **rilasci il tuo task** in `SE09` (o nella vista Transport Organizer di ADT).
4. Quando tutti i task sono rilasciati, il proprietario della richiesta **rilascia la richiesta**. Il sistema esporta gli oggetti in file nella directory di trasporto.
5. Il team basis, o un processo automatico, **importa** la richiesta nel sistema di qualità con `STMS`. Dopo i test, la stessa richiesta viene importata in produzione.

> [!WARNING]
> Rilasciare una richiesta è un punto di non ritorno: non puoi aggiungere oggetti a una richiesta rilasciata né tornare indietro. Prima di rilasciare, controlla che tutti i tuoi oggetti siano attivati e che non manchi niente. Se dimentichi qualcosa, ti serve una nuova richiesta.

> [!CAUTION]
> I trasporti vengono importati in ordine. Se la richiesta B dipende da un oggetto che sta nella richiesta A, e B arriva in produzione per prima, l'import può fallire o lasciare la produzione con codice incoerente. Quando puoi, tieni le modifiche collegate nella stessa richiesta, e avvisa chi fa gli import di quali richieste vanno insieme.

## Esercizio

> [!IMPORTANT]
>
> 1. In ADT crea un pacchetto locale `$ZTRAINING` con la descrizione "Esercizi del corso".
> 2. Apri `SE09`, mostra le tue richieste e guarda la struttura di una di esse (richiesta, task, oggetti).

### Soluzione

1. **File > New > Other > ABAP Package**, nome `$ZTRAINING`, descrizione "Esercizi del corso", tipo di pacchetto **Development**. Poiché il nome inizia con `$`, ADT non chiede né il componente software né la richiesta di trasporto. Aggiungilo ai pacchetti preferiti.
2. In `SE09` seleziona **Richieste Workbench** e sia **Modificabili** sia **Rilasciate**, poi premi **Visualizza**. L'albero mostra ogni richiesta, sotto di essa i task con i nomi utente degli sviluppatori e sotto ogni task gli oggetti, per esempio `R3TR PROG ZFLIGHT_REPORT`.

> [!NOTE]
>
> - Ogni oggetto appartiene a un pacchetto; un pacchetto ha un componente software e un layer di trasporto.
> - Gli oggetti del cliente iniziano con `Z` o `Y`; i pacchetti che iniziano con `$` sono locali e non vengono mai trasportati.
> - Una richiesta di trasporto ha un task per sviluppatore e registra ogni oggetto modificato.
> - Le richieste Workbench trasportano oggetti del repository; le richieste di customizing trasportano impostazioni.
> - Rilascia il tuo task, poi la richiesta; gli import in qualità e produzione avvengono con `STMS`.
