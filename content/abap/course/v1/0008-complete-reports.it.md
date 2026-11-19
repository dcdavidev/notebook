---
title: 'Report completi: selezione, eventi, messaggi, file'
description: Tutto ciò che serve per costruire un vero report SAP.
---

_Settimana 2 · Livello intermedio · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| Ora 1  | Schermata di selezione: `PARAMETERS`, `SELECT-OPTIONS`, range, blocchi, checkbox, radio button   |
| Ora 2  | Eventi del report e di selezione; validazioni; varianti; elementi di testo                       |
| Ora 3  | Messaggi (SE91, tipi), autorizzazioni (`AUTHORITY-CHECK`), creare una transazione                |
| Ora 4  | File: `GUI_UPLOAD`/`GUI_DOWNLOAD`, `OPEN DATASET` (server), job in background, liste interattive |

## Ora 1 – La schermata di selezione

Quasi ogni report inizia con una **schermata di selezione**: la finestra dove l'utente inserisce i filtri prima di eseguire. In ABAP classico non si disegna: si dichiara con poche istruzioni e SAP la genera da solo.

> [!TIP]
> La schermata di selezione è come il modulo che compili in biblioteca per chiedere un libro: autore, anno, argomento. Il bibliotecario (il programma) va in archivio (il database) a cercare solo quello che hai chiesto.

### PARAMETERS: un singolo valore

```abap
REPORT zvoli_report.

PARAMETERS p_carr  TYPE s_carr_id OBLIGATORY.          " obbligatorio
PARAMETERS p_data  TYPE d DEFAULT sy-datum.            " valore proposto
PARAMETERS p_max   TYPE i DEFAULT 100.
PARAMETERS p_citta TYPE s_from_cit LOWER CASE.         " accetta minuscole
PARAMETERS p_det   AS CHECKBOX DEFAULT 'X'.            " casella di spunta
PARAMETERS: p_lista RADIOBUTTON GROUP grp1 DEFAULT 'X', " pulsanti di scelta
            p_alv   RADIOBUTTON GROUP grp1.
PARAMETERS p_file  TYPE string LOWER CASE.
PARAMETERS p_bukrs TYPE bukrs MEMORY ID buk.           " propone il valore della memoria SAP
PARAMETERS p_mat   TYPE matnr MATCHCODE OBJECT mat1.   " aiuto di ricerca specifico
PARAMETERS p_list  TYPE c LENGTH 1 AS LISTBOX VISIBLE LENGTH 20. " menu a tendina
```

Il nome di un parametro può avere al massimo **8 caratteri**. Il tipo preso dal Dizionario Dati porta con sé etichetta, F1 e F4.

### SELECT-OPTIONS: intervalli e liste di valori

`SELECT-OPTIONS` crea due campi "da... a..." più un pulsante per selezioni multiple: l'utente può indicare singoli valori, intervalli, esclusioni, pattern.

```abap
DATA gv_carrid TYPE s_carr_id.                  " serve un campo di riferimento

SELECT-OPTIONS s_carr FOR gv_carrid.
SELECT-OPTIONS s_data FOR sy-datum NO-EXTENSION. " niente selezione multipla
SELECT-OPTIONS s_conn FOR gv_carrid NO INTERVALS. " solo valori singoli
```

Una `SELECT-OPTION` è in realtà una **tabella interna** (un "range") con 4 colonne:

| Colonna  | Significato                     | Valori                                                                         |
| -------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `SIGN`   | includi o escludi               | `I` (include), `E` (exclude)                                                   |
| `OPTION` | operatore                       | `EQ`, `NE`, `BT` (between), `NB`, `GT`, `GE`, `LT`, `LE`, `CP` (pattern), `NP` |
| `LOW`    | valore "da"                     |                                                                                |
| `HIGH`   | valore "a" (solo per `BT`/`NB`) |                                                                                |

Si usa direttamente nelle query con `IN`:

```abap
SELECT * FROM sflight
  WHERE carrid IN @s_carr AND fldate IN @s_data
  INTO TABLE @DATA(lt_voli).
```

> [!WARNING]
> Se la `SELECT-OPTION` è vuota, `IN` è **sempre vero**: vengono letti tutti i record. È voluto (nessun filtro = tutto), ma attenzione su tabelle enormi.

### Range creati nel codice

```abap
DATA lr_citta TYPE RANGE OF s_from_cit.
lr_citta = VALUE #( sign = 'I' option = 'EQ' ( low = 'ROME' ) ( low = 'FRANKFURT' ) ).
APPEND VALUE #( sign = 'I' option = 'CP' low = 'NEW*' ) TO lr_citta.

SELECT * FROM spfli WHERE cityfrom IN @lr_citta INTO TABLE @DATA(lt_spfli).

IF 'ROME' IN lr_citta.               " si usa anche negli IF
ENDIF.
```

### Organizzare la schermata

```abap
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.   " riquadro con titolo
  PARAMETERS p_carr2 TYPE s_carr_id.
  SELECT-OPTIONS s_fld FOR sy-datum.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE TEXT-002.
  SELECTION-SCREEN BEGIN OF LINE.                               " più elementi sulla stessa riga
    SELECTION-SCREEN COMMENT 1(20) TEXT-003.
    PARAMETERS p_x AS CHECKBOX USER-COMMAND chk.                " USER-COMMAND: reagisce al clic
  SELECTION-SCREEN END OF LINE.
SELECTION-SCREEN END OF BLOCK b2.

SELECTION-SCREEN SKIP 1.
SELECTION-SCREEN ULINE.
SELECTION-SCREEN PUSHBUTTON /1(20) TEXT-004 USER-COMMAND puls.

* Schede (tabstrip) e schermate aggiuntive
SELECTION-SCREEN BEGIN OF SCREEN 1100 AS SUBSCREEN.
  PARAMETERS p_a TYPE c LENGTH 10.
SELECTION-SCREEN END OF SCREEN 1100.
```

### Elementi di testo

Ogni programma ha tre tipi di testi (menu Vai a → Elementi di testo), traducibili in tutte le lingue (transazione SE63):

| Tipo                  | A cosa serve                                 | Uso                                                        |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Simboli di testo      | testi usati nel codice                       | `TEXT-001` oppure `'Testo di default'(001)`                |
| Testi di selezione    | etichette dei parametri sulla schermata      | spunta "Riferimento dizionario" per usare l'etichetta DDIC |
| Titoli e intestazioni | titolo del programma e intestazioni di lista |                                                            |

> [!WARNING]
> Non scrivere testi visibili all'utente direttamente nel codice (`'Errore!'`): usa simboli di testo o classi di messaggi, così il programma può essere tradotto.

## Ora 2 – Gli eventi del report

Un report classico è **guidato dagli eventi**: SAP chiama i tuoi blocchi in un ordine preciso.

| Evento                                           | Quando viene eseguito                           | Uso tipico                                  |
| ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------- |
| `LOAD-OF-PROGRAM`                                | al caricamento del programma                    | rarissimo                                   |
| `INITIALIZATION`                                 | prima di mostrare la schermata di selezione     | proporre valori di default calcolati        |
| `AT SELECTION-SCREEN OUTPUT`                     | ogni volta prima di mostrare la schermata (PBO) | nascondere/disattivare campi dinamicamente  |
| `AT SELECTION-SCREEN ON campo`                   | dopo l'input, per un campo                      | validare un campo                           |
| `AT SELECTION-SCREEN ON VALUE-REQUEST FOR campo` | quando l'utente preme F4                        | aiuto di ricerca personalizzato             |
| `AT SELECTION-SCREEN ON HELP-REQUEST FOR campo`  | quando l'utente preme F1                        | aiuto personalizzato                        |
| `AT SELECTION-SCREEN`                            | dopo l'input, per tutta la schermata (PAI)      | validazioni incrociate                      |
| `START-OF-SELECTION`                             | dopo F8                                         | lettura ed elaborazione dei dati            |
| `END-OF-SELECTION`                               | dopo `START-OF-SELECTION`                       | output (storico, legato ai database logici) |
| `TOP-OF-PAGE`                                    | all'inizio di ogni pagina di lista              | intestazioni                                |
| `END-OF-PAGE`                                    | alla fine di ogni pagina                        | piè di pagina                               |
| `AT LINE-SELECTION`                              | doppio clic su una riga della lista             | liste interattive                           |
| `AT USER-COMMAND`                                | pulsante premuto sulla lista                    | liste interattive                           |

> [!TIP]
> Gli eventi sono come le fasi di una cena al ristorante: accoglienza (`INITIALIZATION`), il cameriere ti dà il menu (`OUTPUT`), controlla che il piatto ordinato esista (`AT SELECTION-SCREEN`), la cucina cucina (`START-OF-SELECTION`), il piatto arriva in tavola (output). Tu scrivi cosa fare in ogni fase; l'ordine lo decide il ristorante.

### Un report completo

```abap
REPORT zvoli_completo.

DATA gv_carrid TYPE s_carr_id.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS s_carr FOR gv_carrid.
  PARAMETERS p_da    TYPE d.
  PARAMETERS p_a     TYPE d.
  PARAMETERS p_pieni AS CHECKBOX USER-COMMAND pie.
  PARAMETERS p_min   TYPE i MODIF ID min.
SELECTION-SCREEN END OF BLOCK b1.

INITIALIZATION.
  p_da = sy-datum - 30.
  p_a  = sy-datum + 365.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN.
    IF screen-group1 = 'MIN'.
      screen-active = COND #( WHEN p_pieni = abap_true THEN '0' ELSE '1' ).
      MODIFY SCREEN.
    ENDIF.
  ENDLOOP.

AT SELECTION-SCREEN.
  IF p_da > p_a.
    MESSAGE 'La data iniziale è successiva a quella finale' TYPE 'E'.
  ENDIF.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid IN @s_carr
      AND fldate BETWEEN @p_da AND @p_a
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(gt_voli).

  IF gt_voli IS INITIAL.
    MESSAGE 'Nessun volo trovato' TYPE 'S' DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  LOOP AT gt_voli INTO DATA(gs_volo).
    IF p_pieni = abap_true AND gs_volo-seatsocc < gs_volo-seatsmax.
      CONTINUE.
    ENDIF.
    IF p_pieni = abap_false AND gs_volo-seatsmax - gs_volo-seatsocc < p_min.
      CONTINUE.
    ENDIF.
    WRITE: / gs_volo-carrid, gs_volo-connid, gs_volo-fldate,
             gs_volo-seatsocc, '/', gs_volo-seatsmax.
  ENDLOOP.

TOP-OF-PAGE.
  WRITE: / 'Elenco voli', sy-datum.
  ULINE.
```

`MODIF ID` assegna un gruppo ai campi, così puoi nasconderli o mostrarli insieme con `LOOP AT SCREEN`. Campi di `screen`: `active`, `input` (0 = solo lettura), `invisible`, `required`, `intensified`.

### Varianti

Una **variante** salva i valori della schermata di selezione con un nome, per riusarli (pulsante "Salva" sulla schermata). Sono indispensabili per i job in background. Si possono creare varianti protette e con valori dinamici (es. "data di oggi - 1" tramite variabili di selezione, tabella TVARVC).

## Ora 3 – Messaggi, autorizzazioni, transazioni

### I messaggi

I messaggi comunicano informazioni o errori all'utente. Si definiscono in una **classe di messaggi** (SE91), es. `ZCORSO`, con numeri da 000 a 999 e segnaposto `&1 &2 &3 &4`:

| N.  | Testo                           |
| --- | ------------------------------- |
| 001 | Volo &1 &2 non trovato          |
| 002 | &1 voli elaborati correttamente |
| 003 | Data &1 non valida              |

```abap
MESSAGE e001(zcorso) WITH lv_carrid lv_connid.        " errore con classe e numero
MESSAGE s002(zcorso) WITH lines( lt_voli ).           " successo
MESSAGE ID 'ZCORSO' TYPE 'I' NUMBER '003' WITH lv_data.
MESSAGE 'Testo diretto' TYPE 'I'.                     " sconsigliato (non traducibile)
MESSAGE TEXT-005 TYPE 'W'.

* Mettere il testo in una variabile invece di mostrarlo
MESSAGE e001(zcorso) WITH lv_carrid lv_connid INTO DATA(lv_testo).
```

I tipi di messaggio e il loro comportamento:

| Tipo | Nome                 | Dove appare                     | Che cosa succede                                                                             |
| ---- | -------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `S`  | Successo             | barra di stato in basso (verde) | il programma continua                                                                        |
| `I`  | Informazione         | popup                           | continua dopo che l'utente preme Invio                                                       |
| `W`  | Avviso (warning)     | barra di stato (giallo)         | sulla selezione: l'utente può correggere o premere Invio per continuare                      |
| `E`  | Errore               | barra di stato (rosso)          | sulla selezione: blocca e richiede correzione. In `START-OF-SELECTION`: termina il programma |
| `A`  | Abort (interruzione) | popup                           | il programma termina                                                                         |
| `X`  | Exit                 | dump                            | dump `MESSAGE_TYPE_X` (per errori "impossibili")                                             |

> [!TIP]
> I tipi di messaggio sono come i cartelli stradali: S è "benvenuti" (informa e basta), W è "attenzione curva pericolosa" (puoi proseguire), E è "strada chiusa" (devi tornare indietro), A è "fine della strada": il viaggio termina.

> [!WARNING]
> Il comportamento dei messaggi dipende dal contesto (evento, schermata, background, metodo). Un messaggio di tipo E dentro un metodo o in un FM chiamato da RFC si comporta diversamente. Nel codice moderno, dentro le classi, si preferiscono le **eccezioni** (giorno 11) e si mostrano i messaggi solo a livello di interfaccia utente.

### Autorizzazioni: AUTHORITY-CHECK

SAP controlla gli accessi con **oggetti di autorizzazione** (SU21). Ogni oggetto ha dei campi (es. società, attività). I ruoli degli utenti (PFCG) contengono le autorizzazioni. **Il tuo codice deve controllarle**: SAP non lo fa al tuo posto per i dati letti in un report.

```abap
AUTHORITY-CHECK OBJECT 'S_CARRID'
  ID 'CARRID' FIELD p_carr
  ID 'ACTVT'  FIELD '03'.     " 01 = crea, 02 = modifica, 03 = visualizza, 06 = cancella

IF sy-subrc <> 0.
  MESSAGE e004(zcorso) WITH p_carr.   " "Nessuna autorizzazione per la compagnia &1"
ENDIF.
```

- **SU53**: mostra l'ultimo controllo di autorizzazione fallito per l'utente (utile per il supporto).
- **ST01** / **STAUTHTRACE**: traccia delle autorizzazioni.
- Puoi creare oggetti di autorizzazione Z in SU21 per proteggere funzioni tue.

> [!TIP]
> L'oggetto di autorizzazione è il badge aziendale: la porta (`AUTHORITY-CHECK`) controlla se il tuo badge apre quel reparto (campo) per quell'attività (entrare, modificare, solo guardare).

### Creare una transazione (SE93)

Per dare agli utenti un codice comodo come `ZVOLI`:

1. SE93 → codice `ZVOLI` → Crea.
2. Tipo: _Programma e schermata di selezione_ (transazione di report).
3. Programma: `ZVOLI_COMPLETO`, schermata 1000.
4. Spunta le opzioni GUI (SAP GUI per Windows/HTML/Java).
5. Indica un oggetto di autorizzazione se serve (es. `S_TCODE` è controllato automaticamente).

Altri tipi: transazione di dialogo (module pool, giorno 9), transazione OO (metodo di classe), transazione con variante, transazione di parametri (es. SM30 su una tabella specifica).

## Ora 4 – File, job in background, liste interattive

### File sul PC dell'utente (frontend)

```abap
PARAMETERS p_file TYPE string LOWER CASE.

AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_file.
  DATA lt_files TYPE filetable.
  DATA lv_rc    TYPE i.
  cl_gui_frontend_services=>file_open_dialog(
    EXPORTING file_filter = '*.csv'
    CHANGING  file_table  = lt_files
              rc          = lv_rc ).
  IF lt_files IS NOT INITIAL.
    p_file = lt_files[ 1 ]-filename.
  ENDIF.

START-OF-SELECTION.
  DATA lt_righe TYPE string_table.
  cl_gui_frontend_services=>gui_upload(
    EXPORTING  filename = p_file
               filetype = 'ASC'
               codepage = '4110'          " UTF-8
    CHANGING   data_tab = lt_righe
    EXCEPTIONS OTHERS   = 1 ).
  IF sy-subrc <> 0.
    MESSAGE 'Errore di lettura del file' TYPE 'E'.
  ENDIF.

  LOOP AT lt_righe INTO DATA(lv_riga) FROM 2.   " salta l'intestazione
    SPLIT lv_riga AT ';' INTO DATA(lv_cod) DATA(lv_descr) DATA(lv_prezzo).
    " ... converti e salva
  ENDLOOP.

* Scrivere un file
  cl_gui_frontend_services=>gui_download(
    EXPORTING filename = 'C:\temp\export.csv'
              filetype = 'ASC'
    CHANGING  data_tab = lt_righe ).
```

> [!WARNING]
> I file sul PC funzionano solo in dialogo (con la SAP GUI aperta). In un job in background non c'è nessun PC collegato: usa i file sul server.

Per Excel vero (.xlsx) esistono librerie open source (abap2xlsx) e, nei sistemi recenti, la classe `XCO_CP_XLSX` (ABAP Cloud).

### File sul server di applicazione

```abap
DATA(lv_path) = `/usr/sap/trans/tmp/voli.txt`.

* Scrivere
OPEN DATASET lv_path FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
IF sy-subrc = 0.
  LOOP AT gt_voli INTO DATA(ls_v).
    TRANSFER |{ ls_v-carrid };{ ls_v-connid };{ ls_v-fldate }| TO lv_path.
  ENDLOOP.
  CLOSE DATASET lv_path.
ENDIF.

* Leggere
OPEN DATASET lv_path FOR INPUT IN TEXT MODE ENCODING UTF-8.
DO.
  READ DATASET lv_path INTO DATA(lv_line).
  IF sy-subrc <> 0. EXIT. ENDIF.
  WRITE / lv_line.
ENDDO.
CLOSE DATASET lv_path.

DELETE DATASET lv_path.  " cancellare
```

Transazioni utili: **AL11** (sfogliare le directory del server), **CG3Y**/**CG3Z** (scaricare/caricare file tra server e PC), **FILE** (percorsi logici, da preferire ai percorsi fissi, letti con il FM `FILE_GET_NAME`). Controlla l'accesso con l'oggetto `S_DATASET`.

### Job in background

Un report può girare in background, senza utente collegato: per elaborazioni lunghe o notturne.

- **SM36**: definire un job (programma + variante + orario/periodicità).
- **SM37**: monitorare i job (stato, log, spool).
- Dal menu della schermata di selezione: Programma → Esegui in background.
- `sy-batch = abap_true` indica che il programma gira in background.
- L'output (`WRITE` o ALV) finisce nello spool (SP01).

```abap
IF sy-batch = abap_true.
  " niente popup, niente file su PC, messaggi nel log del job
ENDIF.
```

Da programma si può schedulare un job con `JOB_OPEN`, `SUBMIT ... VIA JOB ... NUMBER ... AND RETURN`, `JOB_CLOSE`. Nei sistemi moderni esiste anche l'Application Job framework.

### Le liste interattive (classiche)

```abap
START-OF-SELECTION.
  SELECT carrid, carrname FROM scarr INTO TABLE @DATA(lt_carr).
  LOOP AT lt_carr INTO DATA(ls_carr).
    WRITE / ls_carr-carrid HOTSPOT ON.   " cliccabile
    WRITE ls_carr-carrname.
    HIDE ls_carr-carrid.                 " memorizza il valore per la riga
  ENDLOOP.

AT LINE-SELECTION.
  " ls_carr-carrid contiene il valore della riga cliccata (grazie a HIDE)
  SELECT connid, cityfrom, cityto FROM spfli
    WHERE carrid = @ls_carr-carrid INTO TABLE @DATA(lt_conn).
  WRITE: / 'Voli di', ls_carr-carrid, '- livello lista', sy-lsind.
  LOOP AT lt_conn INTO DATA(ls_conn).
    WRITE: / ls_conn-connid, ls_conn-cityfrom, ls_conn-cityto.
  ENDLOOP.
```

`sy-lsind` è il livello di lista (0 = base, fino a 20 livelli). Oggi le liste `WRITE` sono sostituite dall'ALV (domani), ma le troverai nei programmi esistenti.

## Esercizi

> [!IMPORTANT]
>
> 1. Crea il report `ZES08_VOLI` con un blocco di selezione con titolo: `SELECT-OPTIONS` per compagnia e data volo, un parametro obbligatorio per il numero massimo di righe, due radio button "Solo voli con posti liberi" / "Tutti".
> 2. In `INITIALIZATION` proponi le date dal primo all'ultimo giorno del mese corrente.
> 3. In `AT SELECTION-SCREEN` controlla che le compagnie inserite esistano in `SCARR`, altrimenti messaggio di errore dalla tua classe `ZCORSO`.
> 4. Aggiungi un `AUTHORITY-CHECK` su `S_CARRID` per ogni compagnia letta ed escludi quelle non autorizzate.
> 5. Aggiungi un checkbox "Esporta su file" che, se spuntato, mostra un campo per il percorso (`MODIF ID`) e scarica il risultato in CSV.
> 6. Crea la transazione `ZES08` e una variante `MESE_CORRENTE`. Esegui il report in background e guarda il risultato in SM37 / spool.

## Quiz

1. Differenza tra `PARAMETERS` e `SELECT-OPTIONS`?
2. Quali sono le 4 colonne di un range?
3. Che cosa succede con `WHERE campo IN s_opt` se `s_opt` è vuota?
4. In quale evento validi i dati della schermata di selezione?
5. Che cosa succede con un messaggio di tipo E su `AT SELECTION-SCREEN`?
6. Perché devi scrivere `AUTHORITY-CHECK` nei tuoi report?
7. Perché `GUI_UPLOAD` non funziona in background?
8. In quale transazione si monitorano i job?

## Soluzioni

```abap
REPORT zes08_voli.

DATA gv_carr TYPE s_carr_id.
DATA gv_data TYPE s_date.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS: s_carr FOR gv_carr,
                  s_data FOR gv_data.
  PARAMETERS p_max TYPE i OBLIGATORY DEFAULT 200.
  PARAMETERS: p_liberi RADIOBUTTON GROUP g1 DEFAULT 'X',
              p_tutti  RADIOBUTTON GROUP g1.
SELECTION-SCREEN END OF BLOCK b1.

INITIALIZATION.
  DATA(lv_primo) = sy-datum.
  lv_primo+6(2) = '01'.
  DATA(lv_prox) = lv_primo + 31.
  lv_prox+6(2) = '01'.
  s_data[] = VALUE #( ( sign = 'I' option = 'BT' low = lv_primo high = lv_prox - 1 ) ).

AT SELECTION-SCREEN ON s_carr.
  SELECT carrid FROM scarr WHERE carrid IN @s_carr INTO TABLE @DATA(lt_ok).
  IF lt_ok IS INITIAL.
    MESSAGE e001(zcorso) WITH 'Compagnia' 'inesistente'.
  ENDIF.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid IN @s_carr AND fldate IN @s_data
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(lt_voli) UP TO @p_max ROWS.

  LOOP AT lt_voli INTO DATA(ls_v).
    AUTHORITY-CHECK OBJECT 'S_CARRID' ID 'CARRID' FIELD ls_v-carrid ID 'ACTVT' FIELD '03'.
    CHECK sy-subrc = 0.
    CHECK p_tutti = abap_true OR ls_v-seatsocc < ls_v-seatsmax.
    WRITE: / ls_v-carrid, ls_v-connid, ls_v-fldate, ls_v-seatsocc, ls_v-seatsmax.
  ENDLOOP.
```

Nota: in `INITIALIZATION`, `s_data[]` indica la tabella del range (le `SELECT-OPTIONS` hanno una riga di intestazione, `s_data` da solo è la riga). Aggiungere 31 giorni al primo del mese porta sempre nel mese successivo; rimettendo il giorno a 01 e togliendo 1 si ottiene l'ultimo giorno del mese corrente.

Quiz:

1. `PARAMETERS` accetta un singolo valore; `SELECT-OPTIONS` intervalli, liste, esclusioni e pattern (è un range).
2. `SIGN`, `OPTION`, `LOW`, `HIGH`.
3. La condizione è sempre vera: nessun filtro.
4. In `AT SELECTION-SCREEN` (o `ON campo`).
5. La schermata resta aperta, il messaggio appare in rosso e l'utente deve correggere.
6. Perché SAP non controlla automaticamente i dati letti dal tuo codice: senza controllo chiunque possa eseguire il report vedrebbe tutto.
7. Perché in background non c'è una SAP GUI né un PC collegato.
8. SM37.

> [!NOTE]
> Oggi hai imparato: schermate di selezione, range, eventi, validazioni, varianti, elementi di testo, messaggi, autorizzazioni, transazioni, file su PC e server, job in background e liste interattive. Domani: l'ALV e le schermate classiche (Dynpro).
