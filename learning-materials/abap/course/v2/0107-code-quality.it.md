---
title: 'Qualità del codice: ATC e Clean ABAP'
description: Controlli statici, l'ABAP Test Cockpit e la guida di stile Clean ABAP.
---

_Livello intermedio_

Un codice che compila non è per forza un buon codice. Può avere variabili inutilizzate, una `SELECT` dentro un ciclo, un controllo di autorizzazione mancante o un metodo così lungo che nessuno osa toccarlo. I **controlli statici** trovano molti di questi problemi leggendo il codice sorgente, senza eseguirlo. L'**ABAP Test Cockpit** (ATC) li esegue tutti insieme, e la guida di stile **Clean ABAP** copre quello che gli strumenti non possono controllare: nomi leggibili e un design semplice.

## I controlli statici

SAP offre diversi livelli di controllo, ognuno più ampio del precedente:

| Controllo                      | Transazione | Che cosa trova                                                                                 |
| ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------- |
| Controllo di sintassi          | `Ctrl+F2`   | errori che impediscono l'attivazione, e warning                                                |
| Controllo esteso del programma | `SLIN`      | variabili inutilizzate, codice irraggiungibile, messaggi chiamati male, testi mancanti         |
| Code Inspector                 | `SCI`       | problemi di prestazioni, sicurezza e nomenclatura, configurabili in varianti di controllo      |
| ABAP Test Cockpit              | `ATC`       | esegue i controlli del Code Inspector e gli unit test, con regole centrali, esenzioni e report |

In pratica usi l'ATC: include gli altri ed è quello che guardano il tuo team e il processo di trasporto.

## Eseguire l'ATC

In ADT, fai clic destro su un programma, una classe o un package e scegli **Run As > ABAP Test Cockpit** (`Ctrl+Shift+F2`). In SAP GUI, apri l'oggetto in `SE80` e scegli **Controllo > ABAP Test Cockpit (ATC)**.

La vista ATC Problems elenca i **risultati** (_finding_), ognuno con una priorità:

| Priorità | Significato                          | Esempio tipico                    |
| -------- | ------------------------------------ | --------------------------------- |
| 1        | errore: va corretto                  | SQL dinamico esposto a injection  |
| 2        | warning: andrebbe corretto           | `SELECT` dentro un ciclo          |
| 3        | informazione: correggilo quando puoi | variabile dichiarata ma mai usata |

Un doppio clic su un finding apre la riga di codice; i dettagli spiegano il problema e spesso suggeriscono una correzione. Molti sistemi eseguono l'ATC automaticamente quando rilasci una richiesta di trasporto e la bloccano se ci sono finding di priorità 1 o 2.

La **variante di controllo** decide quali controlli vengono eseguiti. La mantiene a livello centrale il team qualità (transazione `ATC`, amministrazione ATC), così tutti vengono misurati con le stesse regole.

> [!TIP]
> L'ATC è il collaudo a fine linea in una fabbrica di auto. L'auto si muove (il codice compila), ma il collaudatore controlla comunque freni, luci e vernice prima che esca dallo stabilimento.

## Falsi positivi: pseudo commenti, pragma ed esenzioni

A volte un finding è sbagliato per il tuo caso. Puoi silenziare un singolo finding nel codice:

```abap
" Pragma: nasconde un warning del controllo di sintassi o di SLIN
DATA lv_unused TYPE i ##NEEDED.

" Pseudo commento: nasconde un finding del Code Inspector (forma più vecchia, ancora diffusa)
SELECT * FROM sflight INTO TABLE @DATA(lt_all).   "#EC CI_NOWHERE
```

I pragma iniziano con `##` e stanno prima del punto; gli pseudo commenti iniziano con `"#EC` e stanno alla fine della riga. Ogni controllo documenta quale dei due accetta.

Per i finding che non puoi silenziare nel codice, chiedi un'**esenzione** nel risultato dell'ATC. Un responsabile della qualità la approva o la rifiuta.

> [!WARNING]
> Silenziare un finding non significa correggerlo. Usa pragma ed esenzioni solo quando sai spiegare perché il finding non si applica, e aggiungi un commento con il motivo. Un programma pieno di `##NEEDED` è un programma che nessuno controlla più.

## Clean ABAP

**Clean ABAP** è la guida di stile di SAP per ABAP, pubblicata come open source su GitHub (`SAP/styleguides`). Adatta ad ABAP le idee del libro _Clean Code_. Alcune delle sue regole:

- Usa nomi descrittivi: `calculate_free_seats` invece di `calc_fs`.
- Preferisci l'orientamento agli oggetti al codice procedurale, e le chiamate funzionali a `CALL METHOD`.
- Tieni i metodi piccoli, che fanno una cosa sola, con pochi parametri; dividi un metodo invece di aggiungere parametri `OPTIONAL`.
- Preferisci `RETURNING` a `EXPORTING`, e le eccezioni ai codici di ritorno.
- Usa la sintassi moderna: dichiarazioni inline, espressioni costruttore, `xsdbool( )`.
- Non commentare che cosa fa il codice; fallo dire al codice, e commenta il perché.

```abap
" Non clean
CALL METHOD lo_calc->calc_fs
  EXPORTING is_f = ls_f
  IMPORTING ev_r = lv_r.

" Clean
DATA(lv_free_seats) = lo_calculator->calculate_free_seats( ls_flight ).
```

Clean ABAP sconsiglia prefissi come `lv_` e `lt_`, mentre molti team e questo corso li usano. Segui le convenzioni del tuo team e sii coerente: un misto di stili è peggio di ciascuno dei due. Gli strumenti open source **abaplint** (per i repository Git) e **code pal for ABAP** (controlli ATC aggiuntivi) possono verificare automaticamente molte regole di Clean ABAP.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un piccolo report con una variabile inutilizzata, una `SELECT` su `SFLIGHT` senza `WHERE` e una `SELECT SINGLE` su `SCARR` dentro un `LOOP`.
> 2. Esegui l'ATC e leggi i finding.
> 3. Correggi il codice finché l'ATC non segnala più finding di priorità 1 o 2.

### Soluzione

```abap
REPORT zatc_demo.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  " Una sola SELECT con join e WHERE invece di SELECT nel LOOP
  SELECT FROM sflight AS f
    INNER JOIN scarr AS c ON c~carrid = f~carrid
    FIELDS f~carrid, c~carrname, f~connid, f~fldate
    WHERE f~carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).

  cl_demo_output=>display( lt_flights ).
```

> [!NOTE]
>
> - I controlli statici leggono il codice senza eseguirlo: controllo di sintassi, `SLIN`, Code Inspector (`SCI`) e ATC.
> - Esegui l'ATC con `Ctrl+Shift+F2` in ADT; i finding hanno priorità 1 (errore), 2 (warning) o 3 (informazione).
> - La variante di controllo è definita a livello centrale, e l'ATC può bloccare il rilascio dei trasporti.
> - Pragma (`##`), pseudo commenti (`"#EC`) ed esenzioni silenziano i falsi positivi: spiega sempre il perché.
> - Clean ABAP è la guida di stile di SAP: nomi chiari, metodi piccoli, sintassi moderna e convenzioni coerenti.
