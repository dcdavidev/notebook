---
title: Scenari unmanaged e additional save
description: Riutilizzare codice e BAPI esistenti dentro RAP.
---

_Livello pro_

In un business object **managed** il framework RAP fa tutto: tiene le modifiche in memoria, blocca e scrive sul database. È perfetto per app nuove su tabelle nuove. Ma molti sistemi hanno già codice collaudato che crea e modifica documenti: moduli funzione, BAPI e classi che controllano tutto e scrivono più tabelle. RAP ti permette di riutilizzare quel codice invece di riscriverlo, con l'**additional save**, l'**unmanaged save** e il tipo di implementazione completamente **unmanaged**.

## Quattro modi di salvare

| Tipo di implementazione      | Buffer transazionale | Chi scrive sul database                 | Uso tipico                                                |
| ---------------------------- | -------------------- | --------------------------------------- | --------------------------------------------------------- |
| managed                      | framework            | framework                               | app nuove su tabelle nuove                                |
| managed with additional save | framework            | il framework, e poi anche il tuo codice | scrivere un log, un change document o chiamare un'API     |
| managed with unmanaged save  | framework            | solo il tuo codice                      | tabelle scritte da un'API esistente                       |
| unmanaged                    | il tuo codice        | il tuo codice                           | incapsulare codice legacy con un suo buffer e un suo save |

Il **buffer transazionale** è la memoria in cui le modifiche della transazione corrente aspettano fino al `COMMIT ENTITIES`. Con i tipi managed lo gestisce il framework; con unmanaged lo gestisci tu, di solito tramite il codice legacy che ne ha già uno.

## L'additional save

Con `with additional save`, il framework salva l'entità come al solito, e poi chiama il metodo `save_modified` della tua classe saver con tutto quello che è stato creato, modificato e cancellato. Aggiungi la parola chiave dopo `persistent table`:

```abap
managed implementation in class zbp_r_travel unique;
strict ( 2 );

define behavior for ZR_Travel alias Travel
persistent table ztravel
with additional save
lock master
authorization master ( instance )
etag master LocalLastChangedAt
{
  create;
  update;
  delete;
}
```

La saver è una classe locale del behavior pool, generata dal quick fix. Qui scrive un semplice log delle modifiche in una tabella `ztravel_log` (campi chiave `travel_uuid`, `changed_at`, `change_type`):

```abap
CLASS lsc_zr_travel DEFINITION INHERITING FROM cl_abap_behavior_saver.
  PROTECTED SECTION.
    METHODS save_modified REDEFINITION.
ENDCLASS.

CLASS lsc_zr_travel IMPLEMENTATION.
  METHOD save_modified.
    DATA lt_log TYPE STANDARD TABLE OF ztravel_log WITH EMPTY KEY.
    DATA lv_now TYPE timestampl.

    GET TIME STAMP FIELD lv_now.
    DATA(lv_user) = cl_abap_context_info=>get_user_technical_name( ).

    lt_log = VALUE #( BASE lt_log FOR ls_create IN create-travel
                      ( travel_uuid = ls_create-TravelUUID changed_at = lv_now
                        change_type = 'C' changed_by = lv_user ) ).
    lt_log = VALUE #( BASE lt_log FOR ls_update IN update-travel
                      ( travel_uuid = ls_update-TravelUUID changed_at = lv_now
                        change_type = 'U' changed_by = lv_user ) ).
    lt_log = VALUE #( BASE lt_log FOR ls_delete IN delete-travel
                      ( travel_uuid = ls_delete-TravelUUID changed_at = lv_now
                        change_type = 'D' changed_by = lv_user ) ).

    INSERT ztravel_log FROM TABLE @lt_log.
  ENDMETHOD.
ENDCLASS.
```

- `create-travel`, `update-travel` e `delete-travel` usano l'alias dell'entità. Le righe create contengono tutti i campi; quelle modificate solo i campi cambiati, segnati in `%control`; quelle cancellate solo la chiave.
- Se ti servono tutti i campi anche per le righe modificate, scrivi `with additional save with full data`.
- Con `with unmanaged save` al posto di `persistent table ... with additional save`, il framework non scrive niente, e `save_modified` è l'unico punto in cui i dati arrivano al database.

## Unmanaged: incapsulare codice legacy

In un business object **unmanaged** implementi tu ogni operazione. Lo scenario di riferimento dei voli contiene un'API legacy nel gruppo funzioni `/DMO/FLIGHT_TRAVEL_API`, con un suo buffer: `/DMO/FLIGHT_TRAVEL_CREATE` e `/DMO/FLIGHT_TRAVEL_UPDATE` modificano il buffer, `/DMO/FLIGHT_TRAVEL_SAVE` lo scrive e `/DMO/FLIGHT_TRAVEL_INITIALIZE` lo svuota. È esattamente la forma che RAP si aspetta.

```abap
unmanaged implementation in class zbp_r_travel_u unique;
strict ( 2 );

define behavior for ZR_Travel_U alias Travel
lock master
authorization master ( instance )
etag master LastChangedAt
{
  create;
  update;
  delete;
  field ( readonly ) TravelID, LastChangedAt;
  field ( mandatory ) AgencyID, CustomerID, BeginDate, EndDate;

  mapping for /dmo/travel control /dmo/s_travel_inx
  {
    TravelID      = travel_id;
    AgencyID      = agency_id;
    CustomerID    = customer_id;
    BeginDate     = begin_date;
    EndDate       = end_date;
    BookingFee    = booking_fee;
    TotalPrice    = total_price;
    CurrencyCode  = currency_code;
    Description   = description;
    Status        = status;
    LastChangedAt = lastchangedat;
  }
}
```

La classe handler ha bisogno di un metodo per ogni operazione, più `read` e `lock`. Ecco `create`; `update`, `delete` e `read` seguono lo stesso schema con gli altri moduli funzione:

```abap
CLASS lhc_travel DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS create FOR MODIFY IMPORTING entities FOR CREATE Travel.
    METHODS update FOR MODIFY IMPORTING entities FOR UPDATE Travel.
    METHODS delete FOR MODIFY IMPORTING keys FOR DELETE Travel.
    METHODS read FOR READ IMPORTING keys FOR READ Travel RESULT result.
    METHODS lock FOR LOCK IMPORTING keys FOR LOCK Travel.
    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION
      IMPORTING keys REQUEST requested_authorizations FOR Travel RESULT result.
ENDCLASS.

CLASS lhc_travel IMPLEMENTATION.
  METHOD create.
    DATA ls_travel   TYPE /dmo/travel.
    DATA lt_messages TYPE /dmo/t_message.

    LOOP AT entities INTO DATA(ls_entity).
      CALL FUNCTION '/DMO/FLIGHT_TRAVEL_CREATE'
        EXPORTING
          is_travel   = CORRESPONDING /dmo/s_travel_in( ls_entity MAPPING FROM ENTITY USING CONTROL )
        IMPORTING
          es_travel   = ls_travel
          et_messages = lt_messages.

      IF lt_messages IS INITIAL.
        INSERT VALUE #( %cid = ls_entity-%cid TravelID = ls_travel-travel_id ) INTO TABLE mapped-travel.
      ELSE.
        INSERT VALUE #( %cid = ls_entity-%cid ) INTO TABLE failed-travel.
        LOOP AT lt_messages INTO DATA(ls_message).
          INSERT VALUE #( %cid = ls_entity-%cid
                          %msg = new_message( id       = ls_message-msgid
                                              number   = ls_message-msgno
                                              severity = if_abap_behv_message=>severity-error
                                              v1       = ls_message-msgv1
                                              v2       = ls_message-msgv2 ) )
                 INTO TABLE reported-travel.
        ENDLOOP.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD lock.
    TRY.
        DATA(lo_lock) = cl_abap_lock_object_factory=>get_instance( iv_name = '/DMO/ETRAVEL' ).
      CATCH cx_abap_lock_failure.
        RETURN.
    ENDTRY.
    LOOP AT keys INTO DATA(ls_key).
      TRY.
          lo_lock->enqueue( it_parameter = VALUE #( ( name = 'TRAVEL_ID' value = REF #( ls_key-TravelID ) ) ) ).
        CATCH cx_abap_foreign_lock cx_abap_lock_failure.
          APPEND VALUE #( TravelID = ls_key-TravelID ) TO failed-travel.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  " update, delete, read e get_instance_authorizations omessi
ENDCLASS.
```

`MAPPING FROM ENTITY` usa il `mapping` della behavior definition per trasformare i nomi degli elementi CDS nei nomi delle colonne della struttura legacy, e `USING CONTROL` copia solo i campi che il chiamante ha valorizzato.

La classe saver collega il buffer legacy alla sequenza di salvataggio di RAP:

```abap
CLASS lsc_zr_travel_u DEFINITION INHERITING FROM cl_abap_behavior_saver.
  PROTECTED SECTION.
    METHODS save REDEFINITION.
    METHODS cleanup REDEFINITION.
ENDCLASS.

CLASS lsc_zr_travel_u IMPLEMENTATION.
  METHOD save.
    CALL FUNCTION '/DMO/FLIGHT_TRAVEL_SAVE'.         " dal buffer legacy al database
  ENDMETHOD.

  METHOD cleanup.
    CALL FUNCTION '/DMO/FLIGHT_TRAVEL_INITIALIZE'.   " svuota il buffer legacy
  ENDMETHOD.
ENDCLASS.
```

Gli altri metodi della saver sono `finalize` (ultime modifiche prima del salvataggio), `check_before_save` (ultimi controlli; un errore qui ferma il salvataggio), `adjust_numbers` (late numbering) e `cleanup_finalize` (svuota il buffer dopo un controllo fallito).

> [!CAUTION]
> Nella fase di salvataggio non chiamare mai `COMMIT WORK` o `ROLLBACK WORK`, e non chiamare BAPI che fanno commit al loro interno: è il framework RAP a fare il commit dell'intera transazione, e un commit in più rompe la LUW. Chiama BAPI che scrivono solo nell'update task (vedi i [moduli funzione di aggiornamento](./0113-update-task.it.md)), e fai tutti i controlli in `check_before_save`: dopo, `save` non deve fallire.

> [!TIP]
> RAP unmanaged è come mettere una vetrina nuova davanti a una vecchia bottega. I clienti vedono lo stesso bancone moderno di tutti gli altri negozi, ma dietro la porta gli stessi artigiani continuano a lavorare a modo loro.

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi `with additional save` al tuo business object dei viaggi e scrivi un log delle modifiche nella tabella `ztravel_log` in `save_modified`.
> 2. Modifica un viaggio nell'anteprima Fiori e controlla la nuova riga in `ztravel_log` con la data preview di ADT.
> 3. Spiega in una frase perché `save_modified` non deve chiamare `COMMIT WORK`.

### Soluzione

1. Usa la behavior definition e la classe saver qui sopra, dopo aver creato `ztravel_log` con i campi `travel_uuid`, `changed_at`, `change_type` e `changed_by`.
2. Dopo il **Save**, il log ha una riga con `change_type = 'U'`.
3. Il framework fa il commit dell'intera transazione RAP alla fine della sequenza di salvataggio: un commit al suo interno scriverebbe una parte dei dati prima che il resto sia salvato.

> [!NOTE]
>
> - RAP ha quattro tipi di implementazione: managed, managed with additional save, managed with unmanaged save e unmanaged.
> - `with additional save` lascia salvare prima il framework e poi chiama il tuo `save_modified` con `create`, `update` e `delete`.
> - Unmanaged significa che implementi tu create, update, delete, read e lock, e che il buffer transazionale è tuo.
> - Incapsula API legacy che separano già "modifica il buffer" da "salva il buffer"; mappa i campi con `mapping for` e `MAPPING FROM ENTITY`.
> - Non fare mai commit nella fase di salvataggio, e fai tutti i controlli in `check_before_save`.
