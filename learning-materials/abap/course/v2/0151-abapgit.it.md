---
title: abapGit e il controllo di versione
description: Tenere il codice ABAP in repository Git.
---

_Livello pro_

Il codice ABAP vive nel database del sistema SAP, non in file. Il sistema tiene una cronologia delle versioni di ogni oggetto, e il [sistema di trasporto](./0007-packages-and-transport-requests.it.md) porta gli oggetti dallo sviluppo alla produzione. Però non ci sono branch, né pull request, né un modo semplice di condividere il codice fuori dal landscape. **abapGit** colma questo vuoto: è un **client Git scritto in ABAP**, open source, che trasforma gli oggetti di un package in file e li invia a un repository Git su GitHub, GitLab, Bitbucket o qualunque altro server Git, e viceversa.

## Come funziona abapGit

abapGit **serializza** ogni oggetto in uno o più file di testo: il codice sorgente come file `.abap`, i metadati come XML. Il repository di una piccola app dei voli ha questo aspetto:

```text
zflight-app/
├── .abapgit.xml
├── README.md
└── src/
    ├── package.devc.xml
    ├── ztravel.tabl.xml
    ├── zr_travel.ddls.asddls
    ├── zr_travel.ddls.xml
    ├── zr_travel.bdef.asbdef
    ├── zcl_flight_service.clas.abap
    ├── zcl_flight_service.clas.testclasses.abap
    ├── zcl_flight_service.clas.xml
    ├── zflight_report.prog.abap
    └── zflight_report.prog.xml
```

Il nome del file è il nome dell'oggetto più il tipo di oggetto (`clas`, `prog`, `tabl`, `ddls`, `bdef`, ...). Quando fai **pull**, abapGit legge i file e crea o aggiorna gli oggetti nel sistema. Il file `.abapgit.xml` contiene le impostazioni del repository:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
 <asx:values>
  <DATA>
   <MASTER_LANGUAGE>E</MASTER_LANGUAGE>
   <STARTING_FOLDER>/src/</STARTING_FOLDER>
   <FOLDER_LOGIC>PREFIX</FOLDER_LOGIC>
   <IGNORE>
    <item>/README.md</item>
   </IGNORE>
  </DATA>
 </asx:values>
</asx:abap>
```

- `MASTER_LANGUAGE` è la lingua originale degli oggetti.
- `FOLDER_LOGIC` fa corrispondere i package figli alle cartelle: con `PREFIX`, un package figlio `ZFLIGHT_UI` di `ZFLIGHT` diventa la cartella `src/ui/`; con `FULL`, la cartella ha il nome completo del package.

## Installare e collegare

Ci sono due modi di usare abapGit:

| Dove                                    | Come                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| SAP GUI, on premise                     | crea il report `ZABAPGIT_STANDALONE`, incolla l'unico file sorgente del progetto abapGit, attivalo ed eseguilo |
| ADT, ambiente ABAP di SAP BTP e S/4HANA | installa il plugin abapGit per Eclipse e usa la vista **abapGit Repositories**                                 |

Per lavorare con un server remoto da SAP GUI, il sistema ha bisogno dei certificati SSL del server Git in `STRUST`, e spesso di una configurazione del proxy. Se non è possibile, usa i **repository offline**: abapGit esporta e importa il package come file ZIP.

Per collegare un package:

1. In abapGit, scegli **New Online**, inserisci l'URL di un repository Git vuoto e il package, per esempio `ZFLIGHT`.
2. abapGit confronta il package con il repository e mostra le differenze.
3. Scegli **Stage**, seleziona i file da includere nel commit, inserisci un messaggio e un autore, e scegli **Commit**. abapGit invia il commit al server remoto.

Da lì in poi vale il solito flusso di Git: modifichi gli oggetti nel sistema, fai stage, commit e push; crei branch, apri pull request e rivedi il codice sul server Git.

> [!TIP]
> abapGit è come uno scanner e una stampante per il tuo package. Il push scansiona ogni oggetto in documenti che puoi conservare e spedire ovunque; il pull ristampa i documenti dentro un sistema, anche un sistema che non li ha mai visti.

## Il pull in un altro sistema

Per installare il codice in un altro sistema, crea lì un repository online con lo stesso URL e un package, e scegli **Pull**. abapGit crea gli oggetti nell'ordine giusto, chiede una richiesta di trasporto se il package è trasportabile, e li attiva. È così che si installano i progetti ABAP open source, ed è così che puoi spostare codice fra sistemi che non sono nello stesso landscape di trasporto, per esempio da un sistema on premise all'ambiente ABAP di SAP BTP.

> [!CAUTION]
> Un pull sovrascrive gli oggetti del sistema con la versione del repository. Le modifiche che hai fatto nel sistema e non hai inviato con un push vanno perse. Prima del pull, guarda le differenze che abapGit ti mostra, e fai prima il push o salva le tue modifiche.

## abapGit, trasporti e gCTS

On premise abapGit non sostituisce il sistema di trasporto: le modifiche arrivano in qualità e in produzione sempre con le richieste di trasporto. Usa abapGit per quello che i trasporti non sanno fare: condividere codice e riusare librerie, tenere una cronologia fuori dal sistema, rivedere il codice con le pull request, eseguire controlli come `abaplint` in una pipeline di CI a ogni push, e spostare codice fra sistemi non collegati.

SAP offre anche **gCTS** (Git-enabled Change and Transport System), che lega i trasporti a un repository Git, e nell'ambiente ABAP di SAP BTP l'app **Manage Software Components** usa Git dietro le quinte per spostare i software component fra sistemi.

> [!WARNING]
> abapGit serializza solo gli oggetti attivi. Attiva tutto prima dello stage, altrimenti il repository riceve una versione vecchia, o nessun file, per gli oggetti inattivi.

## Esercizio

> [!IMPORTANT]
>
> 1. Installa `ZABAPGIT_STANDALONE` (o il plugin ADT) e crea un repository vuoto su GitHub.
> 2. Collega il tuo package `ZFLIGHT` al repository e invia tutti i suoi oggetti con un push.
> 3. Cambia un commento in una classe direttamente su GitHub, poi fai il pull nel sistema e controlla la modifica nella classe.

### Soluzione

Dopo il passo 2, il repository contiene una cartella `src` con uno o più file per oggetto e il file `.abapgit.xml`. Dopo il passo 3, abapGit mostra la classe come modificata sul lato remoto; **Pull** la aggiorna nel sistema, e la cronologia delle versioni della classe (in ADT o in `SE24`) mostra una nuova versione.

> [!NOTE]
>
> - abapGit è un client Git open source scritto in ABAP: serializza gli oggetti di un package in file, e viceversa.
> - Ogni oggetto diventa file con il nome dell'oggetto e il suo tipo, come `zcl_flight_service.clas.abap`; `.abapgit.xml` contiene le impostazioni.
> - Usa il report standalone in SAP GUI, o il plugin ADT; i repository offline funzionano con file ZIP.
> - Un pull sovrascrive gli oggetti nel sistema: controlla prima le differenze.
> - On premise abapGit affianca i trasporti; gCTS e Manage Software Components portano Git dentro il processo di trasporto.
