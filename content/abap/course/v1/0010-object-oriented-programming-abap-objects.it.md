---
title: Programmazione a oggetti (ABAP Objects)
description: Classi, oggetti, metodi, ereditarietà, interfacce e polimorfismo.
---

_Settimana 2 · Livello intermedio · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| Ora 1  | Perché gli oggetti; classe e oggetto; attributi e metodi; visibilità                             |
| Ora 2  | Costruttori, metodi e attributi statici, parametri, metodi funzionali, classi globali (SE24/ADT) |
| Ora 3  | Ereditarietà, ridefinizione, classi astratte e finali, casting                                   |
| Ora 4  | Interfacce, polimorfismo, eventi, amicizia; riepilogo della settimana                            |

## Ora 1 – Classi e oggetti

### Perché programmare a oggetti

Finora hai scritto codice "procedurale": dati da una parte, procedure (`FORM`, FM) dall'altra. Nella **programmazione a oggetti** (OOP) dati e comportamenti stanno insieme in unità chiamate **oggetti**. Tutto l'ABAP moderno (RAP, ABAP Cloud, BAdI, ALV SALV) è a oggetti: è una competenza indispensabile.

> [!TIP]
> Una **classe** è il progetto di un'automobile: dice che ogni auto ha un colore, un serbatoio e una velocità (**attributi**) e che può accelerare, frenare e fare rifornimento (**metodi**). Un **oggetto** è un'auto vera, costruita da quel progetto: la tua Panda rossa con mezzo serbatoio. Dallo stesso progetto puoi costruire mille auto, ognuna con il suo colore e il suo serbatoio.

I quattro principi della OOP:

| Principio      | Significato semplice                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Incapsulamento | i dati interni sono nascosti: si accede solo tramite metodi (non tocchi il motore, usi il pedale) |
| Astrazione     | mostri solo ciò che serve a chi usa l'oggetto                                                     |
| Ereditarietà   | una classe può ereditare da un'altra e specializzarla (l'auto sportiva è un'auto)                 |
| Polimorfismo   | oggetti diversi rispondono allo stesso comando ognuno a modo suo                                  |

### La prima classe (locale)

Una classe ha due parti: la **DEFINITION** (che cosa c'è: l'elenco) e la **IMPLEMENTATION** (come funziona: il codice dei metodi).

```abap
REPORT zoo_conto.

CLASS lcl_conto DEFINITION.
  PUBLIC SECTION.
    METHODS deposita IMPORTING iv_importo TYPE p.
    METHODS preleva IMPORTING iv_importo TYPE p.
    METHODS get_saldo RETURNING VALUE(rv_saldo) TYPE p.
  PRIVATE SECTION.
    DATA mv_saldo TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_conto IMPLEMENTATION.
  METHOD deposita.
    mv_saldo = mv_saldo + iv_importo.
  ENDMETHOD.

  METHOD preleva.
    IF iv_importo > mv_saldo.
      MESSAGE 'Saldo insufficiente' TYPE 'I'.
      RETURN.
    ENDIF.
    mv_saldo = mv_saldo - iv_importo.
  ENDMETHOD.

  METHOD get_saldo.
    rv_saldo = mv_saldo.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_conto TYPE REF TO lcl_conto.   " una variabile riferimento (vuota)
  lo_conto = NEW #( ).                   " creo l'oggetto
  lo_conto->deposita( 100 ).
  lo_conto->preleva( 30 ).
  WRITE lo_conto->get_saldo( ).          " 70

  DATA(lo_conto2) = NEW lcl_conto( ).    " secondo oggetto, saldo indipendente
  lo_conto2->deposita( 500 ).
```

Elementi da notare:

- `TYPE REF TO`: la variabile non contiene l'oggetto, ma un **riferimento** (un indirizzo) all'oggetto.
- `NEW #( )` crea l'oggetto (forma vecchia: `CREATE OBJECT lo_conto.`).
- `->` chiama un metodo o accede a un attributo di un oggetto (istanza).
- `=>` accede a elementi statici della classe (vedi Ora 2).
- Convenzioni: `lcl_` classe locale, `zcl_` classe globale, `lif_`/`zif_` interfacce, `mv_` attributo (_member variable_), `lo_` riferimento a oggetto.

> [!TIP]
> La variabile riferimento è come il numero di telefono di una persona: non è la persona, ma ti permette di parlarle. Due variabili possono avere lo stesso numero (puntare allo stesso oggetto). Se cancelli tutti i numeri, nessuno può più chiamarla e il "garbage collector" la porta via.

### Le sezioni di visibilità

| Sezione             | Chi può accedere                              |
| ------------------- | --------------------------------------------- |
| `PUBLIC SECTION`    | tutti                                         |
| `PROTECTED SECTION` | la classe stessa e le sue sottoclassi (eredi) |
| `PRIVATE SECTION`   | solo la classe stessa (e le classi "amiche")  |

Regola pratica: **attributi privati**, metodi pubblici solo se servono all'esterno. Così nessuno può mettere un saldo negativo "dall'esterno": deve passare da `preleva`, che controlla.

Un attributo pubblico può essere dichiarato `READ-ONLY`: leggibile da fuori, modificabile solo dentro.

```abap
PUBLIC SECTION.
  DATA mv_intestatario TYPE string READ-ONLY.
```

## Ora 2 – Costruttori, statici, parametri, classi globali

### Il costruttore

Il **costruttore** è un metodo speciale chiamato `constructor`, eseguito automaticamente quando l'oggetto viene creato. Serve a inizializzare l'oggetto.

```abap
CLASS lcl_conto DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_intestatario   TYPE string
                                  iv_saldo_iniziale TYPE p DEFAULT 0.
    DATA mv_intestatario TYPE string READ-ONLY.
  PRIVATE SECTION.
    DATA mv_saldo TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_conto IMPLEMENTATION.
  METHOD constructor.
    mv_intestatario = iv_intestatario.
    mv_saldo        = iv_saldo_iniziale.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_c) = NEW lcl_conto( iv_intestatario = `Mario Rossi` iv_saldo_iniziale = 1000 ).
  WRITE lo_c->mv_intestatario.
```

Il costruttore può avere solo parametri `IMPORTING` e può sollevare eccezioni.

### Elementi statici (di classe)

Gli elementi dichiarati con `CLASS-DATA` e `CLASS-METHODS` appartengono alla **classe**, non ai singoli oggetti: esistono una volta sola, condivisi da tutti. Si usano con `=>` senza creare oggetti.

```abap
CLASS lcl_conto DEFINITION.
  PUBLIC SECTION.
    CLASS-DATA gv_numero_conti TYPE i READ-ONLY.
    CLASS-METHODS class_constructor.   " eseguito una volta, al primo uso della classe
    METHODS constructor.
    CONSTANTS c_valuta TYPE waers VALUE 'EUR'.
ENDCLASS.

CLASS lcl_conto IMPLEMENTATION.
  METHOD class_constructor.
    gv_numero_conti = 0.
  ENDMETHOD.

  METHOD constructor.
    gv_numero_conti += 1.              " conta tutti i conti creati
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_1) = NEW lcl_conto( ).
  DATA(lo_2) = NEW lcl_conto( ).
  WRITE lcl_conto=>gv_numero_conti.    " 2
  WRITE lcl_conto=>c_valuta.
```

> [!TIP]
> Gli attributi di istanza sono il saldo di ogni singolo conto. L'attributo statico è il contatore all'ingresso della banca che conta quanti conti sono stati aperti in tutto: ce n'è uno solo, per tutti.

### I parametri dei metodi

| Tipo                 | Significato                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| `IMPORTING`          | in ingresso, sola lettura (per riferimento) o `VALUE( )`                         |
| `EXPORTING`          | in uscita                                                                        |
| `CHANGING`           | ingresso e uscita                                                                |
| `RETURNING VALUE( )` | un solo valore di ritorno: rende il metodo "funzionale" (usabile in espressioni) |
| `RAISING`            | eccezioni basate su classi (giorno 11)                                           |

Opzioni: `OPTIONAL`, `DEFAULT valore`, `PREFERRED PARAMETER`. Dentro il metodo `IS SUPPLIED` dice se un parametro opzionale è stato passato.

```abap
METHODS calcola_interessi
  IMPORTING iv_tasso      TYPE p
            iv_anni       TYPE i DEFAULT 1
  RETURNING VALUE(rv_int) TYPE p.

" Chiamate equivalenti
DATA(lv_i) = lo_c->calcola_interessi( iv_tasso = '0.02' iv_anni = 3 ).
lv_i = lo_c->calcola_interessi( '0.02' ).   " un solo parametro obbligatorio: nome omesso

CALL METHOD lo_c->calcola_interessi         " forma vecchia
  EXPORTING iv_tasso = '0.02'
  RECEIVING rv_int   = lv_i.

" Metodi funzionali in espressioni e catene
IF lo_c->get_saldo( ) > 1000.
ENDIF.
WRITE lo_c->get_cliente( )->get_nome( ).    " concatenazione di chiamate
```

### Il riferimento a sé stesso: me

Dentro un metodo, `me` indica l'oggetto corrente: `me->mv_saldo`. Serve soprattutto quando un parametro ha lo stesso nome di un attributo o per passare l'oggetto stesso ad altri.

### Classi globali

Una classe locale vive dentro un programma. Una **classe globale** (`ZCL_...`) vive nel Repository e può essere usata ovunque. Si crea in **SE24** (Class Builder) o in **ADT** (File → New → ABAP Class, consigliato).

```abap
CLASS zcl_conto DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_intestatario TYPE string.
    METHODS deposita IMPORTING iv_importo TYPE wrbtr.
    METHODS get_saldo RETURNING VALUE(rv_saldo) TYPE wrbtr.
  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA mv_intestatario TYPE string.
    DATA mv_saldo        TYPE wrbtr.
ENDCLASS.

CLASS zcl_conto IMPLEMENTATION.
  METHOD constructor.
    mv_intestatario = iv_intestatario.
  ENDMETHOD.

  METHOD deposita.
    mv_saldo += iv_importo.
  ENDMETHOD.

  METHOD get_saldo.
    rv_saldo = mv_saldo.
  ENDMETHOD.
ENDCLASS.
```

Una classe globale ha anche: tipi locali, classi di test (giorno 12), classi locali di aiuto, macro. `CREATE PUBLIC`/`PROTECTED`/`PRIVATE` stabilisce chi può creare oggetti: con `CREATE PRIVATE` solo la classe stessa (utile per il pattern singleton/factory, giorno 11).

## Ora 3 – Ereditarietà

Con l'**ereditarietà** una classe (**sottoclasse**) riceve tutto da un'altra (**superclasse**) e può aggiungere cose nuove o ridefinire il comportamento dei metodi.

> [!TIP]
> Il progetto "Veicolo" ha ruote e un metodo "muoviti". Il progetto "Bicicletta" eredita da Veicolo e aggiunge "pedala"; il progetto "Auto" eredita da Veicolo e ridefinisce "muoviti" usando il motore. Non riscrivi da zero ciò che hanno in comune.

```abap
CLASS lcl_dipendente DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_nome TYPE string iv_stipendio TYPE p.
    METHODS calcola_bonus RETURNING VALUE(rv_bonus) TYPE decfloat34.
    METHODS descrivi RETURNING VALUE(rv_txt) TYPE string.
  PROTECTED SECTION.
    DATA mv_nome      TYPE string.
    DATA mv_stipendio TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_dipendente IMPLEMENTATION.
  METHOD constructor.
    mv_nome      = iv_nome.
    mv_stipendio = iv_stipendio.
  ENDMETHOD.

  METHOD calcola_bonus.
    rv_bonus = mv_stipendio * '0.05'.
  ENDMETHOD.

  METHOD descrivi.
    rv_txt = |{ mv_nome }: bonus { calcola_bonus( ) }|.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_manager DEFINITION INHERITING FROM lcl_dipendente.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_nome      TYPE string
                                  iv_stipendio TYPE p
                                  iv_team      TYPE i.
    METHODS calcola_bonus REDEFINITION.
  PRIVATE SECTION.
    DATA mv_team TYPE i.
ENDCLASS.

CLASS lcl_manager IMPLEMENTATION.
  METHOD constructor.
    super->constructor( iv_nome = iv_nome iv_stipendio = iv_stipendio ).   " obbligatorio
    mv_team = iv_team.
  ENDMETHOD.

  METHOD calcola_bonus.
    rv_bonus = super->calcola_bonus( ) + mv_team * 100.   " usa il calcolo della superclasse e aggiunge
  ENDMETHOD.
ENDCLASS.
```

Regole:

- `INHERITING FROM` indica la superclasse. In ABAP si eredita da **una sola** classe.
- `REDEFINITION` ridefinisce un metodo (stessa firma, nuovo codice). Il costruttore non si ridefinisce: si riscrive e **deve** chiamare `super->constructor( )`.
- `super->metodo( )` chiama la versione della superclasse.
- La sottoclasse vede `PUBLIC` e `PROTECTED` della superclasse, non `PRIVATE`.
- Tutte le classi ereditano implicitamente da `OBJECT`.

### Classi e metodi astratti e finali

- `ABSTRACT` (classe): non si possono creare oggetti, serve solo come base. Un metodo astratto non ha implementazione: le sottoclassi sono obbligate a implementarlo.
- `FINAL` (classe): nessuno può ereditare da essa. Metodo `FINAL`: non può essere ridefinito.

```abap
CLASS lcl_forma DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS area ABSTRACT RETURNING VALUE(rv_area) TYPE decfloat34.
ENDCLASS.

CLASS lcl_cerchio DEFINITION INHERITING FROM lcl_forma FINAL.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_raggio TYPE decfloat34.
    METHODS area REDEFINITION.
  PRIVATE SECTION.
    DATA mv_r TYPE decfloat34.
ENDCLASS.

CLASS lcl_cerchio IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_r = iv_raggio.
  ENDMETHOD.

  METHOD area.
    rv_area = '3.14159' * mv_r * mv_r.
  ENDMETHOD.
ENDCLASS.
```

### Casting: up-cast e down-cast

Una variabile di tipo superclasse può contenere un oggetto di una sottoclasse (**up-cast**, sempre sicuro e automatico). Il contrario (**down-cast**) richiede `CAST` e può fallire.

```abap
DATA lo_dip TYPE REF TO lcl_dipendente.
lo_dip = NEW lcl_manager( iv_nome = `Sara` iv_stipendio = 5000 iv_team = 8 ).   " up-cast

DATA(lv_bonus) = lo_dip->calcola_bonus( ).   " chiama la versione del MANAGER (polimorfismo!)

* Down-cast
IF lo_dip IS INSTANCE OF lcl_manager.
  DATA(lo_man) = CAST lcl_manager( lo_dip ).
ENDIF.
" Se l'oggetto non è un manager, CAST solleva CX_SY_MOVE_CAST_ERROR
" Forma vecchia: lo_man ?= lo_dip.
```

> [!TIP]
> Up-cast: ogni manager è un dipendente, quindi puoi metterlo nella lista dei dipendenti. Down-cast: non ogni dipendente è un manager, quindi prima di trattarlo come tale devi controllare.

## Ora 4 – Interfacce e polimorfismo

### Le interfacce

Un'**interfaccia** è un contratto: elenca metodi (senza codice) che una classe promette di implementare. Una classe può implementare **più** interfacce.

> [!TIP]
> Un'interfaccia è come la presa elettrica standard. Non importa se colleghi una lampada, un frigorifero o un computer: se hanno la spina giusta (implementano l'interfaccia), funzionano. La presa non sa e non le interessa cosa c'è dall'altra parte.

```abap
INTERFACE lif_stampabile.
  METHODS stampa RETURNING VALUE(rv_txt) TYPE string.
ENDINTERFACE.

CLASS lcl_fattura DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_stampabile.
    METHODS constructor IMPORTING iv_numero TYPE string.
  PRIVATE SECTION.
    DATA mv_numero TYPE string.
ENDCLASS.

CLASS lcl_fattura IMPLEMENTATION.
  METHOD constructor.
    mv_numero = iv_numero.
  ENDMETHOD.

  METHOD lif_stampabile~stampa.            " nome interfaccia ~ metodo
    rv_txt = |Fattura n. { mv_numero }|.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_bolla DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_stampabile.
ENDCLASS.

CLASS lcl_bolla IMPLEMENTATION.
  METHOD lif_stampabile~stampa.
    rv_txt = `Documento di trasporto`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_documenti TYPE STANDARD TABLE OF REF TO lif_stampabile WITH EMPTY KEY.
  lt_documenti = VALUE #( ( NEW lcl_fattura( `2026/001` ) )
                          ( NEW lcl_bolla( ) )
                          ( NEW lcl_fattura( `2026/002` ) ) ).

  LOOP AT lt_documenti INTO DATA(lo_doc).
    WRITE / lo_doc->stampa( ).             " ognuno risponde a modo suo: polimorfismo
  ENDLOOP.
```

- `ALIASES stampa FOR lif_stampabile~stampa.` crea un nome breve.
- Le interfacce possono contenere costanti, tipi, attributi ed eventi, e includere altre interfacce.
- Dalla 7.40 i metodi di interfaccia possono essere `DEFAULT IGNORE` o `DEFAULT FAIL` (implementazione facoltativa).

### Polimorfismo: perché è così utile

Il codice del `LOOP` non sa quali classi esistono: conosce solo l'interfaccia. Se domani crei `lcl_ordine` che implementa `lif_stampabile`, il `LOOP` funziona senza modifiche. È esattamente il meccanismo dei **BAdI** (giorno 13): SAP definisce un'interfaccia e tu fornisci un'implementazione.

Regola di buona progettazione: **programma verso le interfacce, non verso le classi concrete**.

### Gli eventi degli oggetti

Un oggetto può sollevare un evento; altri oggetti si registrano e reagiscono.

```abap
CLASS lcl_conto DEFINITION.
  PUBLIC SECTION.
    EVENTS saldo_basso EXPORTING VALUE(ev_saldo) TYPE p.
    METHODS preleva IMPORTING iv_imp TYPE p.
  PRIVATE SECTION.
    DATA mv_saldo TYPE p LENGTH 10 DECIMALS 2 VALUE 100.
ENDCLASS.

CLASS lcl_conto IMPLEMENTATION.
  METHOD preleva.
    mv_saldo -= iv_imp.
    IF mv_saldo < 50.
      RAISE EVENT saldo_basso EXPORTING ev_saldo = mv_saldo.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_allarme DEFINITION.
  PUBLIC SECTION.
    METHODS on_saldo_basso FOR EVENT saldo_basso OF lcl_conto
      IMPORTING ev_saldo sender.
ENDCLASS.

CLASS lcl_allarme IMPLEMENTATION.
  METHOD on_saldo_basso.
    WRITE / |Attenzione: saldo sceso a { ev_saldo }|.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_conto)   = NEW lcl_conto( ).
  DATA(lo_allarme) = NEW lcl_allarme( ).
  SET HANDLER lo_allarme->on_saldo_basso FOR lo_conto.   " (o FOR ALL INSTANCES)
  lo_conto->preleva( 70 ).
```

> [!TIP]
> Gli eventi sono come un campanello: il conto suona (`RAISE EVENT`) senza sapere chi ascolta; chiunque si sia registrato (`SET HANDLER`) accorre. Lo hai già usato ieri con il doppio clic dell'ALV.

### Amicizia (FRIENDS)

`CLASS lcl_a DEFINITION FRIENDS lcl_b.` permette a `lcl_b` di accedere alle parti private di `lcl_a`. Si usa raramente, soprattutto per le classi di test (giorno 12).

### Classi locali in classi globali e definizione differita

- `CLASS lcl_x DEFINITION DEFERRED.` annuncia una classe definita più avanti (quando due classi si citano a vicenda).
- In una classe globale le classi di aiuto si mettono nella scheda "Local Types" / "Class-relevant local types".

## Esercizi

> [!IMPORTANT]
>
> 1. Crea la classe locale `lcl_rettangolo` con base e altezza private, costruttore, metodi `area` e `perimetro` funzionali (`RETURNING`). Crea 3 rettangoli e stampa aree e perimetri.
> 2. Aggiungi un attributo statico che conta i rettangoli creati.
> 3. Crea la classe astratta `lcl_forma` con il metodo astratto `area`, e le sottoclassi `lcl_cerchio`, `lcl_quadrato`, `lcl_triangolo`. Metti 5 forme in una tabella di riferimenti a `lcl_forma` e stampa le aree con un unico `LOOP`.
> 4. Crea l'interfaccia `lif_veicolo` con i metodi `accelera` e `descrivi`; implementala in `lcl_auto` e `lcl_bici`. Mostra il polimorfismo.
> 5. Trasforma la classe del conto corrente in classe globale `ZCL_CONTO` in ADT. Aggiungi un evento `saldo_negativo` e un gestore.
> 6. Riscrivi il report ALV di ieri come classe locale `lcl_report` con i metodi `get_data`, `prepare` e `display`, chiamati da `START-OF-SELECTION`.

## Quiz

1. Differenza tra classe e oggetto?
2. Differenza tra `->` e `=>`?
3. Che cosa sono `PUBLIC`, `PROTECTED`, `PRIVATE`?
4. Quando viene eseguito il costruttore? E il costruttore di classe?
5. Che cosa fa `super->`?
6. Si possono creare oggetti di una classe astratta?
7. Che differenza c'è tra ereditarietà e interfaccia?
8. Che cos'è il polimorfismo, in una frase?

## Soluzioni

```abap
REPORT zes10_forme.

CLASS lcl_forma DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS area ABSTRACT RETURNING VALUE(rv) TYPE decfloat34.
    METHODS nome ABSTRACT RETURNING VALUE(rv) TYPE string.
ENDCLASS.

CLASS lcl_quadrato DEFINITION INHERITING FROM lcl_forma.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_lato TYPE decfloat34.
    METHODS area REDEFINITION.
    METHODS nome REDEFINITION.
  PRIVATE SECTION.
    DATA mv_lato TYPE decfloat34.
ENDCLASS.

CLASS lcl_quadrato IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_lato = iv_lato.
  ENDMETHOD.

  METHOD area.
    rv = mv_lato * mv_lato.
  ENDMETHOD.

  METHOD nome.
    rv = `Quadrato`.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_cerchio DEFINITION INHERITING FROM lcl_forma.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_r TYPE decfloat34.
    METHODS area REDEFINITION.
    METHODS nome REDEFINITION.
  PRIVATE SECTION.
    DATA mv_r TYPE decfloat34.
ENDCLASS.

CLASS lcl_cerchio IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_r = iv_r.
  ENDMETHOD.

  METHOD area.
    rv = '3.14159' * mv_r * mv_r.
  ENDMETHOD.

  METHOD nome.
    rv = `Cerchio`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_forme TYPE STANDARD TABLE OF REF TO lcl_forma WITH EMPTY KEY.
  lt_forme = VALUE #( ( NEW lcl_quadrato( 2 ) ) ( NEW lcl_cerchio( 1 ) )
                      ( NEW lcl_quadrato( 5 ) ) ).

  LOOP AT lt_forme INTO DATA(lo_f).
    WRITE / |{ lo_f->nome( ) }: area { lo_f->area( ) DECIMALS = 2 }|.
  ENDLOOP.
```

Quiz:

1. La classe è il progetto, l'oggetto un esemplare concreto creato da quel progetto.
2. `->` per elementi di istanza (di un oggetto), `=>` per elementi statici (della classe).
3. Livelli di visibilità: tutti / classe e sottoclassi / solo la classe.
4. Il costruttore a ogni `NEW`; il costruttore di classe una volta sola, al primo utilizzo della classe.
5. Chiama il metodo (o costruttore) della superclasse.
6. No.
7. Con l'ereditarietà la sottoclasse riceve codice e dati (una sola superclasse); l'interfaccia è solo un contratto senza codice e una classe ne può implementare molte.
8. Lo stesso comando, inviato a oggetti diversi, produce comportamenti diversi secondo l'oggetto.

> [!NOTE]
> Settimana 2 completata! Sai leggere e scrivere nel database, modularizzare, creare report completi con ALV e schermate, e programmare a oggetti. La prossima settimana: livello avanzato, con eccezioni, ABAP moderno, test, enhancement, interfacce, CDS, HANA e RAP.
