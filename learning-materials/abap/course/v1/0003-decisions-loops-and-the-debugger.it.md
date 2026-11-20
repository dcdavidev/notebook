---
title: Decisioni, cicli e debugger
description: Come il programma sceglie cosa fare e come ripete le operazioni.
---

_Settimana 1 · Livello base · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                          |
| ------ | ------------------------------------------------------------------ |
| Ora 1  | Condizioni: IF, ELSEIF, ELSE, operatori di confronto e logici      |
| Ora 2  | CASE, COND e SWITCH, predicati (IS INITIAL, BETWEEN, IN...)        |
| Ora 3  | Cicli: DO, WHILE, EXIT, CONTINUE, CHECK; i blocchi di elaborazione |
| Ora 4  | Il debugger: breakpoint, esecuzione passo passo, watchpoint        |

## Ora 1 – Prendere decisioni con IF

### La struttura IF

```abap
IF condizione.
  " istruzioni se la condizione è vera
ELSEIF altra_condizione.
  " istruzioni se la seconda è vera
ELSE.
  " istruzioni se nessuna è vera
ENDIF.
```

> [!TIP]
> `IF` funziona come un vigile all'incrocio: guarda la situazione (la condizione) e ti manda a destra o a sinistra. Viene valutata **la prima condizione vera**, poi si esce: gli altri rami vengono ignorati.

```abap
DATA(lv_voto) = 27.

IF lv_voto >= 30.
  WRITE 'Eccellente'.
ELSEIF lv_voto >= 24.
  WRITE 'Buono'.          " questo viene stampato
ELSEIF lv_voto >= 18.
  WRITE 'Sufficiente'.
ELSE.
  WRITE 'Insufficiente'.
ENDIF.
```

### Operatori di confronto

| Simbolo | Alternativa | Significato       |
| ------- | ----------- | ----------------- |
| `=`     | `EQ`        | uguale            |
| `<>`    | `NE`        | diverso           |
| `<`     | `LT`        | minore            |
| `>`     | `GT`        | maggiore          |
| `<=`    | `LE`        | minore o uguale   |
| `>=`    | `GE`        | maggiore o uguale |

Le forme in lettere (`EQ`, `NE`...) sono vecchie ma ancora valide; preferisci i simboli.

### Operatori logici: AND, OR, NOT

```abap
IF lv_eta >= 18 AND lv_patente = abap_true.
  WRITE 'Può guidare'.
ENDIF.

IF lv_giorno = 'SAB' OR lv_giorno = 'DOM'.
  WRITE 'Weekend'.
ENDIF.

IF NOT lv_nome IS INITIAL.      " meglio: IF lv_nome IS NOT INITIAL.
  WRITE lv_nome.
ENDIF.
```

Priorità: prima `NOT`, poi `AND`, poi `OR`. Usa le parentesi (con gli spazi!) per essere chiaro:

```abap
IF ( lv_a = 1 OR lv_b = 2 ) AND lv_c = 3.
```

### Vero e falso in ABAP

ABAP non ha un vero tipo booleano. Per convenzione si usa un carattere singolo:

- `abap_true` = `'X'`
- `abap_false` = `' '` (spazio)
- il tipo da usare è `abap_bool`.

```abap
DATA lv_trovato TYPE abap_bool VALUE abap_false.

lv_trovato = abap_true.
IF lv_trovato = abap_true.
  WRITE 'Trovato!'.
ENDIF.

* xsdbool( ) trasforma una condizione in abap_true/abap_false
DATA(lv_maggiorenne) = xsdbool( lv_eta >= 18 ).
```

> [!WARNING]
> Non scrivere mai `IF lv_trovato.` da solo: in ABAP non è valido. Devi sempre confrontare: `IF lv_trovato = abap_true.`

## Ora 2 – CASE, COND, SWITCH e i predicati

### CASE

Quando confronti la stessa variabile con tanti valori, `CASE` è più leggibile di tanti `ELSEIF`.

```abap
CASE lv_paese.
  WHEN 'IT'.
    WRITE 'Italia'.
  WHEN 'DE' OR 'AT'.
    WRITE 'Paese di lingua tedesca'.
  WHEN 'FR'.
    WRITE 'Francia'.
  WHEN OTHERS.
    WRITE 'Paese sconosciuto'.
ENDCASE.
```

> [!TIP]
> `CASE` è come il menu di un centralino telefonico: "premi 1 per l'assistenza, 2 per le vendite, qualsiasi altro tasto per l'operatore" (`WHEN OTHERS`).

Esiste anche `CASE TYPE OF` per gli oggetti (giorno 11).

### COND e SWITCH: decisioni che restituiscono un valore

Sono **espressioni**: invece di eseguire istruzioni, producono un valore da assegnare.

```abap
* COND: come IF, ma restituisce un valore
DATA(lv_giudizio) = COND string(
  WHEN lv_voto >= 30 THEN `Eccellente`
  WHEN lv_voto >= 24 THEN `Buono`
  WHEN lv_voto >= 18 THEN `Sufficiente`
  ELSE `Insufficiente` ).

* SWITCH: come CASE, ma restituisce un valore
DATA(lv_nome_paese) = SWITCH string( lv_paese
  WHEN 'IT' THEN `Italia`
  WHEN 'FR' THEN `Francia`
  ELSE `Altro` ).
```

`COND string(...)` significa "il risultato è di tipo string". Con `#` il tipo viene dedotto dalla variabile di destinazione: `lv_x = COND #( ... ).`

### I predicati (condizioni speciali)

| Predicato                    | Significato                                          |
| ---------------------------- | ---------------------------------------------------- |
| `x IS INITIAL`               | `x` ha il valore iniziale (0, vuoto...)              |
| `x IS NOT INITIAL`           | `x` è valorizzato                                    |
| `x BETWEEN a AND b`          | `a <= x <= b`                                        |
| `x IN range`                 | `x` è contenuto in un range/select-option (giorno 8) |
| `ref IS BOUND`               | un riferimento punta a qualcosa (giorno 10)          |
| `<fs> IS ASSIGNED`           | un field-symbol è assegnato (giorno 5)               |
| `obj IS INSTANCE OF cl`      | un oggetto è di una certa classe                     |
| `param IS SUPPLIED`          | un parametro opzionale è stato passato               |
| `line_exists( itab[ ... ] )` | una riga esiste in una tabella interna               |

```abap
IF lv_importo BETWEEN 100 AND 500.
  WRITE 'Importo medio'.
ENDIF.

IF lv_cliente IS INITIAL.
  WRITE 'Cliente obbligatorio!'.
  RETURN.                       " esce dal blocco corrente
ENDIF.
```

## Ora 3 – Ripetere: i cicli

### DO: ripeti un numero di volte

```abap
DO 5 TIMES.
  WRITE / |Giro numero { sy-index }|.
ENDDO.
```

`sy-index` contiene il numero del giro corrente (1, 2, 3...).

Senza `TIMES`, `DO` ripete all'infinito finché non esci con `EXIT`:

```abap
DATA(lv_n) = 1.
DO.
  lv_n = lv_n * 2.
  IF lv_n > 1000.
    EXIT.              " esce dal ciclo
  ENDIF.
ENDDO.
WRITE lv_n.            " 1024
```

> [!WARNING]
> Un `DO` senza `TIMES` e senza `EXIT` è un **ciclo infinito**: il programma si blocca finché non scade il tempo massimo (di solito 10 minuti in dialogo, poi un dump `TIME_OUT`). Puoi interromperlo da SM50 o dal menu della SAP GUI.

### WHILE: ripeti finché la condizione è vera

```abap
DATA(lv_saldo) = 1000.
DATA(lv_anni)  = 0.

WHILE lv_saldo < 2000.
  lv_saldo = lv_saldo * '1.05'.   " interesse del 5% l'anno
  lv_anni += 1.
ENDWHILE.

WRITE |Raddoppio in { lv_anni } anni|.
```

> [!TIP]
> `DO 5 TIMES` è come "fai 5 vasche in piscina". `WHILE` è come "nuota finché non sei stanco": non sai in anticipo quante vasche farai.

### Controllare il ciclo: EXIT, CONTINUE, CHECK

| Istruzione   | Effetto dentro un ciclo                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `EXIT`       | esce completamente dal ciclo                                                |
| `CONTINUE`   | salta al giro successivo                                                    |
| `CHECK cond` | se `cond` è falsa, salta al giro successivo (come `IF NOT cond. CONTINUE.`) |

```abap
DO 10 TIMES.
  IF sy-index MOD 2 = 0.   " salta i numeri pari
    CONTINUE.
  ENDIF.
  WRITE / sy-index.        " stampa 1 3 5 7 9
ENDDO.

DO 10 TIMES.
  CHECK sy-index > 7.
  WRITE / sy-index.        " solo 8, 9, 10
ENDDO.
```

> [!WARNING]
> Fuori da un ciclo, `EXIT` e `CHECK` escono dall'intero blocco di elaborazione (metodo, evento...). Nel codice moderno usa `RETURN` per uscire da un metodo: è più chiaro.

### Cicli annidati

```abap
DO 3 TIMES.                       " tabellina
  DATA(lv_riga) = sy-index.
  NEW-LINE.
  DO 3 TIMES.
    WRITE |{ lv_riga * sy-index WIDTH = 4 }|.
  ENDDO.
ENDDO.
```

Attenzione: dentro il ciclo interno, `sy-index` si riferisce al ciclo interno. Per questo salviamo il valore esterno in `lv_riga`.

Per le tabelle esiste un ciclo dedicato, `LOOP AT`, che vediamo nel giorno 5.

### I blocchi di elaborazione di un report

Un report ABAP non viene eseguito "dall'alto in basso" come un testo qualsiasi: è diviso in **blocchi** che SAP chiama in un certo ordine (eventi). Il più importante è `START-OF-SELECTION`: se non lo scrivi, tutto il codice "libero" ci finisce dentro implicitamente.

```abap
REPORT zesempio_eventi.

DATA gv_contatore TYPE i.        " dichiarazioni globali

INITIALIZATION.                  " prima che si apra la schermata
  gv_contatore = 0.

START-OF-SELECTION.              " il corpo principale
  gv_contatore += 1.
  WRITE gv_contatore.
```

Gli eventi completi li vedremo nel giorno 8. Da oggi in poi scrivi sempre `START-OF-SELECTION.` nei tuoi report: è una buona abitudine.

## Ora 4 – Il debugger

Il **debugger** ti permette di fermare il programma in un punto, eseguirlo una riga alla volta e guardare il contenuto delle variabili. È lo strumento che userai di più nella tua carriera.

> [!TIP]
> Il debugger è come il replay al rallentatore di una partita: puoi fermare l'azione, guardare la posizione di ogni giocatore (variabile) e capire esattamente dove è nato l'errore.

### Come avviarlo

| Metodo                         | Come                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Breakpoint di sessione         | nell'editor clicca sul bordo sinistro della riga (o Ctrl+Shift+F12). Vale finché sei collegato |
| Breakpoint esterno (utente)    | per programmi chiamati da fuori (es. Fiori, RFC). In ADT è il tipo predefinito                 |
| `/h` nel campo comandi         | attiva il debug: la prossima azione sullo schermo parte in debug                               |
| Istruzione `BREAK-POINT.`      | ferma sempre, per tutti. Mai lasciarla nel codice!                                             |
| Istruzione `BREAK nomeutente.` | ferma solo per quell'utente. Comunque da rimuovere prima del trasporto                         |

### I comandi principali

| Tasto (SAP GUI) | Tasto (ADT) | Azione                                                 |
| --------------- | ----------- | ------------------------------------------------------ |
| F5              | F5          | _Single step_: esegue la riga ed entra nelle chiamate  |
| F6              | F6          | _Execute_: esegue la riga senza entrare nelle chiamate |
| F7              | F7          | _Return_: esce dalla routine corrente                  |
| F8              | F8          | Continua fino al prossimo breakpoint                   |
| Shift+F12       | Ctrl+R      | Vai alla riga (salta direttamente)                     |

### Cosa puoi fare

- **Guardare le variabili**: doppio clic sul nome (SAP GUI) o passa il mouse (ADT).
- **Cambiare il valore** di una variabile al volo (icona matita), per provare altri scenari.
- **Guardare le tabelle interne** riga per riga.
- **Watchpoint**: ferma il programma quando una variabile cambia valore o assume un certo valore. Utilissimo quando non sai dove una variabile viene modificata.
- **Breakpoint su istruzione**: ferma a ogni `SELECT`, a ogni `MESSAGE`, a ogni `CALL FUNCTION`... Utilissimo per capire programmi standard.
- **Pila delle chiamate** (_call stack_): mostra il percorso che ha portato fin lì.

### Un esempio da debuggare

```abap
REPORT zdebug_test.

START-OF-SELECTION.
  DATA(lv_somma) = 0.
  DO 10 TIMES.
    lv_somma = lv_somma + sy-index * 2.
  ENDDO.
  " Mi aspetto 110: è vero? Metti un breakpoint qui sopra e controlla
  WRITE lv_somma.
```

Metti un breakpoint sulla riga `DO`, esegui con F8 e premi F5 più volte osservando `lv_somma` e `sy-index`. Poi imposta un watchpoint su `lv_somma` con condizione `lv_somma > 50`.

> [!WARNING]
> In produzione di solito non puoi modificare variabili in debug (e non dovresti: altereresti dati reali). Ogni modifica in debug viene registrata nel log di sistema.

## Esercizi

> [!IMPORTANT]
>
> 1. Scrivi un programma che, dato un numero, dica se è pari o dispari (usa `MOD`).
> 2. Data un'età, stampa "Bambino" (0-12), "Ragazzo" (13-17), "Adulto" (18-64), "Senior" (65+) prima con `IF`/`ELSEIF`, poi con `COND`.
> 3. Dato un codice giorno da 1 a 7, stampa il nome del giorno con `CASE` e poi con `SWITCH`.
> 4. Stampa la tabellina del 7 con `DO`. Poi stampa solo i multipli di 3 compresi tra 1 e 50 usando `CONTINUE`.
> 5. FizzBuzz: per i numeri da 1 a 30 stampa "Fizz" se divisibile per 3, "Buzz" se per 5, "FizzBuzz" se per entrambi, altrimenti il numero.
> 6. Con `WHILE` calcola il fattoriale di 10. Poi debugga il programma con un watchpoint che si fermi quando il risultato supera 100000.

## Quiz

1. Che cosa stampa un `IF` con più `ELSEIF` veri contemporaneamente?
2. Come si rappresenta "vero" in ABAP?
3. Differenza tra `DO` e `WHILE`?
4. Differenza tra `EXIT` e `CONTINUE` in un ciclo?
5. Che cosa contiene `sy-index`?
6. Quale tasto del debugger esegue una riga senza entrare nelle subroutine?
7. Perché non si devono lasciare `BREAK-POINT` nel codice?

## Soluzioni

```abap
REPORT zes03_soluzioni.

PARAMETERS p_num TYPE i DEFAULT 17.   " campo di input (giorno 8)

START-OF-SELECTION.
* Es. 1
  WRITE / COND string( WHEN p_num MOD 2 = 0 THEN `Pari` ELSE `Dispari` ).

* Es. 2
  DATA(lv_eta) = 40.
  WRITE / COND string( WHEN lv_eta <= 12 THEN `Bambino`
                       WHEN lv_eta <= 17 THEN `Ragazzo`
                       WHEN lv_eta <= 64 THEN `Adulto`
                       ELSE `Senior` ).

* Es. 3
  DATA(lv_g) = 3.
  WRITE / SWITCH string( lv_g WHEN 1 THEN `Lunedì`    WHEN 2 THEN `Martedì`
                              WHEN 3 THEN `Mercoledì` WHEN 4 THEN `Giovedì`
                              WHEN 5 THEN `Venerdì`   WHEN 6 THEN `Sabato`
                              WHEN 7 THEN `Domenica`  ELSE `Errore` ).

* Es. 4
  DO 10 TIMES.
    WRITE / |7 x { sy-index } = { 7 * sy-index }|.
  ENDDO.
  DO 50 TIMES.
    IF sy-index MOD 3 <> 0.
      CONTINUE.
    ENDIF.
    WRITE sy-index.
  ENDDO.

* Es. 5
  DO 30 TIMES.
    DATA(lv_out) = COND string(
      WHEN sy-index MOD 15 = 0 THEN `FizzBuzz`
      WHEN sy-index MOD 3 = 0  THEN `Fizz`
      WHEN sy-index MOD 5 = 0  THEN `Buzz`
      ELSE |{ sy-index }| ).
    WRITE / lv_out.
  ENDDO.

* Es. 6
  DATA lv_fatt TYPE int8 VALUE 1.
  DATA lv_i    TYPE i VALUE 1.
  WHILE lv_i <= 10.
    lv_fatt = lv_fatt * lv_i.
    lv_i += 1.
  ENDWHILE.
  WRITE / |10! = { lv_fatt }|.   " 3628800
```

Quiz:

1. Solo il ramo della **prima** condizione vera.
2. Con `abap_true` (`'X'`), tipo `abap_bool`.
3. `DO` ripete un numero fisso di volte (o all'infinito fino a `EXIT`); `WHILE` ripete finché una condizione è vera, controllata a ogni inizio giro.
4. `EXIT` esce dal ciclo; `CONTINUE` salta al giro successivo.
5. Il numero del giro corrente di `DO`/`WHILE`.
6. F6.
7. Fermerebbero il programma per tutti gli utenti, anche in produzione (e i job in background andrebbero in errore).

> [!NOTE]
> Oggi hai imparato: `IF`, `CASE`, `COND`, `SWITCH`, operatori logici e predicati, i cicli `DO` e `WHILE` con `EXIT`/`CONTINUE`/`CHECK`, i blocchi di un report e l'uso del debugger. Domani: il Dizionario Dati, il cuore dei dati SAP.
