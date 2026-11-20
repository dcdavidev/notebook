---
title: Gli shared object
description: Condividere dati fra programmi tramite la memoria condivisa.
---

_Livello pro_

Ogni programma ABAP ha la sua memoria: se cento utenti lanciano lo stesso report, ognuno legge dal database le stesse tabelle di customizing cento volte. Gli **shared object** ti permettono di tenere oggetti nella **memoria condivisa** (shared memory) dell'application server, dove ogni programma di quel server può leggerli senza accedere al database. Servono per dati che si leggono molto spesso e cambiano di rado: un catalogo di compagnie aeree, un insieme di regole, un file di configurazione già interpretato.

## Aree, root class e handle

Gli shared object usano tre elementi:

| Elemento      | Che cos'è                                                                                                   | Dove lo crei                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Area          | una zona della memoria condivisa con un nome e le sue impostazioni (mandante, durata, dimensione)           | transazione `SHMA`            |
| Root class    | una normale classe globale marcata `SHARED MEMORY ENABLED`; la sua istanza è il punto di ingresso dell'area | `SE24` o ADT                  |
| Classe d'area | una classe generata da `SHMA`, con lo stesso nome dell'area; ti dà gli **handle d'area**                    | generata, non si modifica mai |

Un programma non accede mai direttamente alla memoria condivisa. Chiede alla classe d'area un **handle**, con `attach_for_read`, `attach_for_write` o `attach_for_update`, lavora con l'oggetto root tramite l'handle, e poi lo rilascia con `detach` o `detach_commit`.

La root class contiene i dati. Qui tiene le compagnie aeree di `SCARR`:

```abap
CLASS zcl_carrier_root DEFINITION PUBLIC FINAL CREATE PUBLIC SHARED MEMORY ENABLED.
  PUBLIC SECTION.
    TYPES tt_carriers TYPE SORTED TABLE OF scarr WITH UNIQUE KEY carrid.
    DATA mt_carriers TYPE tt_carriers READ-ONLY.
    METHODS load.
    METHODS get_name IMPORTING iv_carrid      TYPE s_carr_id
                     RETURNING VALUE(rv_name) TYPE s_carrname.
ENDCLASS.

CLASS zcl_carrier_root IMPLEMENTATION.
  METHOD load.
    SELECT * FROM scarr INTO TABLE @mt_carriers.
  ENDMETHOD.

  METHOD get_name.
    rv_name = VALUE #( mt_carriers[ carrid = iv_carrid ]-carrname OPTIONAL ).
  ENDMETHOD.
ENDCLASS.
```

Poi, in `SHMA`, crea l'area `ZCL_CARRIER_AREA`, inserisci `ZCL_CARRIER_ROOT` come root class e salva. `SHMA` genera la classe d'area `ZCL_CARRIER_AREA`, con l'attributo `root` di tipo `REF TO zcl_carrier_root`.

## Scrivere e leggere un'area

Chi scrive si aggancia in scrittura, crea l'oggetto root **dentro** l'area con `CREATE OBJECT ... AREA HANDLE`, lo riempie, lo imposta come root e fa il commit:

```abap
REPORT zshm_carrier_write.

DATA lo_root TYPE REF TO zcl_carrier_root.

START-OF-SELECTION.
  TRY.
      DATA(lo_handle) = zcl_carrier_area=>attach_for_write( ).
      CREATE OBJECT lo_root AREA HANDLE lo_handle.   " l'oggetto vive nella memoria condivisa
      lo_root->load( ).
      lo_handle->set_root( lo_root ).
      lo_handle->detach_commit( ).                   " la nuova versione diventa attiva
      WRITE / 'Area scritta'.
    CATCH cx_shm_attach_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).
  ENDTRY.
```

Chi legge si aggancia in lettura e usa l'oggetto root tramite l'handle:

```abap
REPORT zshm_carrier_read.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  TRY.
      DATA(lo_handle) = zcl_carrier_area=>attach_for_read( ).
      DATA(lv_name) = lo_handle->root->get_name( p_carrid ).
      lo_handle->detach( ).
      WRITE / lv_name.
    CATCH cx_shm_no_active_version.
      WRITE / 'Nessuna versione attiva: esegui prima ZSHM_CARRIER_WRITE'.
    CATCH cx_shm_attach_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).
  ENDTRY.
```

La classe d'area ha anche metodi statici per l'area intera, come `invalidate_area` (segna i dati come superati) e `free_area` (li elimina).

> [!WARNING]
> `NEW` non può creare un oggetto nella memoria condivisa: serve `CREATE OBJECT ... AREA HANDLE`. Gli oggetti nell'area possono fare riferimento solo ad altri oggetti della stessa area, mai a oggetti o dati nella memoria del tuo programma. Chiama sempre `detach` o `detach_commit` quando hai finito, anche in caso di errore: un blocco in scrittura rimasto aperto ferma ogni altro programma che vuole scrivere.

## Versioni e blocchi

Gli shared object seguono regole semplici che proteggono chi legge:

- Molti programmi possono leggere un'area nello stesso momento, ma uno solo può scriverla.
- Con la **gestione delle versioni** attiva in `SHMA`, chi scrive costruisce una nuova versione mentre i lettori continuano a leggere la vecchia **versione attiva**. Al `detach_commit`, la nuova versione diventa attiva; i lettori ancora agganciati alla vecchia finiscono indisturbati, e la vecchia versione sparisce quando l'ultimo di loro si sgancia.
- Senza gestione delle versioni c'è una sola versione, e chi scrive non può agganciarsi finché ci sono lettori agganciati.

Invece di scrivere l'area da un report, puoi lasciare che il sistema la costruisca quando serve. Crea una classe che implementa `if_shm_build_instance`, inseriscila in `SHMA` come **area constructor class** e attiva la **costruzione automatica dell'area**. Quando un lettore non trova una versione attiva, il sistema chiama il metodo `build`:

```abap
CLASS zcl_carrier_loader DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_shm_build_instance.
ENDCLASS.

CLASS zcl_carrier_loader IMPLEMENTATION.
  METHOD if_shm_build_instance~build.
    DATA lo_root TYPE REF TO zcl_carrier_root.
    TRY.
        DATA(lo_handle) = zcl_carrier_area=>attach_for_write( inst_name = inst_name ).
        CREATE OBJECT lo_root AREA HANDLE lo_handle.
        lo_root->load( ).
        lo_handle->set_root( lo_root ).
        lo_handle->detach_commit( ).
      CATCH cx_shm_error INTO DATA(lx_error).
        RAISE EXCEPTION TYPE cx_shm_build_failed EXPORTING previous = lx_error.
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
```

Nella transazione `SHMM` vedi ogni istanza d'area, le sue versioni, la dimensione e i lettori agganciati, e puoi invalidare o cancellare un'area a mano.

> [!TIP]
> Un'area di shared object è come la bacheca di un ufficio. Una persona alla volta appende un foglio nuovo, tutti gli altri lo leggono senza staccarlo, e mentre qualcuno prepara il foglio nuovo la gente continua a leggere quello vecchio.

> [!CAUTION]
> La memoria condivisa appartiene a una sola istanza di application server: ogni server del sistema ha la sua copia, e va tutta persa quando il server riparte. Non tenere mai lì l'unica copia di dati di business. Gli shared object non sono disponibili in ABAP Cloud.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la root class `ZCL_CARRIER_ROOT` e l'area `ZCL_CARRIER_AREA` in `SHMA`.
> 2. Esegui `ZSHM_CARRIER_READ` prima e dopo `ZSHM_CARRIER_WRITE`, e confronta i risultati.
> 3. Apri `SHMM` e trova l'istanza dell'area e la sua dimensione.

### Soluzione

Usa le classi e i report qui sopra. Prima della scrittura, il lettore stampa "Nessuna versione attiva": `attach_for_read` solleva `cx_shm_no_active_version`. Dopo la scrittura, stampa il nome della compagnia, per esempio `Lufthansa`. In `SHMM`, l'area `ZCL_CARRIER_AREA` mostra l'istanza `$DEFAULT_INSTANCE$` con una versione attiva.

> [!NOTE]
>
> - Gli shared object tengono oggetti nella memoria condivisa dell'application server, per dati letti spesso e modificati di rado.
> - Un'area (`SHMA`) ha una root class marcata `SHARED MEMORY ENABLED` e una classe d'area generata.
> - Usa `attach_for_read` o `attach_for_write`, crea gli oggetti con `CREATE OBJECT ... AREA HANDLE`, e chiudi sempre con `detach` o `detach_commit`.
> - Uno scrittore e molti lettori; i lettori tengono la versione attiva mentre se ne costruisce una nuova.
> - La memoria condivisa è per server e si perde al riavvio; la controlli in `SHMM`.
