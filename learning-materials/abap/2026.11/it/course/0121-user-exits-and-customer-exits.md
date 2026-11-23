---
title: User exit e customer exit
description: Le tecniche di estensione più vecchie, presenti in ogni sistema.
level: pro
---

Molto prima delle BAdI, SAP lasciava nei suoi programmi dei punti vuoti dove i clienti potevano aggiungere codice. Ce ne sono di due tipi: le **user exit**, subroutine vuote negli include SAP, soprattutto nel modulo vendite; e le **customer exit**, chiamate a moduli funzione il cui corpo è un include del cliente. Il codice nuovo dovrebbe usare le [BAdI](./0122-badis.md) quando ce n'è una, ma queste exit sono ancora in ogni sistema ECC e S/4HANA, e in molti punti sono ancora l'unico aggancio disponibile.

Per il quadro generale, vedi [estendere lo standard SAP](./0120-extending-standard-sap.md).

## Le user exit

Una **user exit** è una routine `FORM` con un nome che inizia con `USEREXIT_`, che SAP mette in un include consegnato vuoto e che non sovrascrive mai. Le più note sono nel programma degli ordini di vendita `SAPMV45A`:

| Include    | Routine di esempio                                                                        |
| ---------- | ----------------------------------------------------------------------------------------- |
| `MV45AFZZ` | `USEREXIT_SAVE_DOCUMENT_PREPARE`, `USEREXIT_SAVE_DOCUMENT`, `USEREXIT_MOVE_FIELD_TO_VBAK` |
| `MV45AFZB` | `USEREXIT_CHECK_VBAP`, `USEREXIT_FILL_VBAP_FROM_HVBAP`                                    |
| `RV60AFZZ` | exit dei documenti di fatturazione (programma `SAPLV60A`)                                 |

L'include appartiene al namespace SAP, quindi la prima modifica chiede una **chiave oggetto**, come una modifica. Dopo, SAP non sovrascrive il tuo codice agli upgrade.

```abap
*---------------------------------------------------------------------*
*  Include MV45AFZZ
*---------------------------------------------------------------------*
FORM userexit_save_document_prepare.
  " Il tipo ordine cliente ZOR richiede un riferimento del cliente
  IF vbak-auart = 'ZOR' AND vbak-bstnk IS INITIAL.
    MESSAGE 'Inserisci il riferimento del cliente prima di salvare' TYPE 'E'.
  ENDIF.
ENDFORM.
```

Le user exit non hanno interfaccia: vedono i **dati globali** del programma principale (`VBAK`, `VBAP`, `XVBAP` e così via). È potente e pericoloso: puoi cambiare qualsiasi campo, anche quelli che SAP non si aspetta che tu tocchi.

> [!WARNING]
> Leggi la documentazione SAP di ogni user exit prima di usarla. Alcune vengono chiamate molte volte per transazione (`USEREXIT_MOVE_FIELD_TO_VBAP` gira per ogni posizione e a ogni cambio di schermata), quindi codice lento lì rallenta tutti gli utenti. `USEREXIT_SAVE_DOCUMENT` gira durante il salvataggio: un messaggio di errore lì lascia l'utente bloccato. Fai i controlli in `USEREXIT_SAVE_DOCUMENT_PREPARE`.

## Le customer exit

Una **customer exit** è un'estensione prevista, con un'interfaccia chiara. SAP raggruppa le exit in **enhancement** (transazione `SMOD`), ognuno con uno o più **componenti**:

- **function exit**: nel programma SAP, `CALL CUSTOMER-FUNCTION '001'` chiama il modulo funzione `EXIT_<programma>_001`, il cui corpo è una sola istruzione `INCLUDE ZX...`. Scrivi il codice in quell'include;
- **screen exit**: un'area di subscreen dove metti una tua subscreen;
- **menu exit**: voci di menu con codici funzione che iniziano con `+`.

Nel programma standard la chiamata ha questo aspetto, con un'interfaccia definita da SAP:

```abap
CALL CUSTOMER-FUNCTION '001'
  EXPORTING
    is_header = ls_header
  IMPORTING
    es_header = ls_header.
```

Il modulo funzione della exit fa parte di un gruppo funzione SAP (`XUSR`, `XM06`, ...), e il suo sorgente è:

```abap
FUNCTION exit_saplsusf_001.
*"  (interfaccia definita da SAP)
  INCLUDE zxusru01.
ENDFUNCTION.
```

Il codice nell'include `Z` gira **solo** se l'enhancement è assegnato a un **progetto attivo** in `CMOD`.

> [!TIP]
> Una customer exit è una presa di corrente con il tappo di plastica. SAP ha già fatto l'impianto (la chiamata e l'interfaccia). Tu colleghi il tuo apparecchio (l'include) e alzi l'interruttore nel quadro elettrico (attivi il progetto `CMOD`). Senza interruttore la presa resta spenta, anche se c'è qualcosa collegato.

## Implementare una customer exit con CMOD

Come esempio, l'enhancement `SUSR0001` viene chiamato dopo ogni logon di dialogo (modulo funzione `EXIT_SAPLSUSF_001`, include `ZXUSRU01`).

1. `CMOD` > crea il progetto `ZLOGON`, con un testo breve.
2. **Assegnazione enhancement**: aggiungi `SUSR0001`.
3. **Componenti**: doppio clic su `EXIT_SAPLSUSF_001`, poi doppio clic sull'include `ZXUSRU01`. Conferma che vuoi crearlo e assegnalo al tuo package e alla tua richiesta di trasporto.
4. Scrivi il codice e attiva l'include.
5. Torna in `CMOD` e scegli **Attiva progetto**.

```abap
*---------------------------------------------------------------------*
*  Include ZXUSRU01   (EXIT_SAPLSUSF_001, enhancement SUSR0001)
*---------------------------------------------------------------------*
IF sy-sysid = 'PRD' AND sy-uname CP 'TEST*'.
  MESSAGE 'Gli utenti di test non dovrebbero lavorare in produzione' TYPE 'I'.
ENDIF.
```

Dentro l'include puoi usare solo i parametri del modulo funzione della exit e i dati globali del suo gruppo funzione. Per vedere l'interfaccia, apri `EXIT_SAPLSUSF_001` in `SE37`.

> [!CAUTION]
> Un enhancement può essere assegnato a un solo progetto `CMOD`. Se il progetto di un collega lo usa già, devi aggiungere il tuo codice allo stesso include, quindi coordinatevi. E un errore in una exit di logon può impedire a tutti gli utenti di entrare: prova exit come questa in sviluppo, con una seconda sessione aperta.

## Trovare le exit di una transazione

- Cerca nel programma principale `CALL CUSTOMER-FUNCTION` (customer exit) e `PERFORM userexit` (user exit).
- In `SE80` o `SE84`, guarda sotto **Enhancement > Customer exit** e filtra per package. Il package della transazione (lo vedi in `SE93`) è un buon punto di partenza.
- La tabella `MODSAP` elenca i componenti di ogni enhancement, e `MODACT` mostra quale progetto contiene quale enhancement.
- `SPRO` spesso documenta le exit sotto **Modifiche di sistema** o **Business Add-In** di ogni area applicativa.

## Esercizio

> [!IMPORTANT]
>
> 1. In `SMOD` visualizza l'enhancement `SUSR0001` e il suo componente.
> 2. Crea il progetto `CMOD` `ZLOGON`, implementa `ZXUSRU01` con un messaggio informativo solo per il tuo utente e attiva il progetto.
> 3. Rifai il logon e controlla che il messaggio compaia. Poi disattiva il progetto.

### Soluzione

```abap
* Include ZXUSRU01
IF sy-uname = 'DEVELOPER01'.          " il tuo utente
  MESSAGE 'La customer exit SUSR0001 è attiva' TYPE 'I'.
ENDIF.
```

Il messaggio compare subito dopo il logon. Quando disattivi il progetto in `CMOD`, l'include resta, ma la exit non viene più chiamata.

> [!NOTE]
>
> - Le user exit sono routine `FORM USEREXIT_...` in include SAP come `MV45AFZZ`; vedono tutti i dati globali del programma.
> - Le customer exit sono moduli funzione `EXIT_<programma>_<nnn>` chiamati con `CALL CUSTOMER-FUNCTION`; scrivi il codice in un include `ZX...`.
> - `SMOD` mostra gli enhancement e i loro componenti; i progetti `CMOD` li assegnano e li attivano.
> - Un enhancement appartiene a un solo progetto, e il suo codice gira solo mentre il progetto è attivo.
> - Controlla quante volte gira una exit, e non fare mai commit né bloccare l'utente al suo interno.
