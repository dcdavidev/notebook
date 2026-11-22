---
title: Enhancement impliciti ed espliciti
description: Aggiungere codice negli enhancement point e nelle section dei programmi standard.
---

_Livello pro_

Quando nel punto che ti serve non c'è una [BAdI](./0122-badis.md) o una exit, l'enhancement framework ti permette comunque di aggiungere codice ai programmi standard senza modificarli. Gli **enhancement espliciti** sono punti che SAP ha marcato apposta nel codice. Gli **enhancement impliciti** esistono automaticamente all'inizio e alla fine di quasi ogni routine. Il tuo codice vive in un'**enhancement implementation**, un oggetto separato del tuo package, quindi il sorgente di SAP resta intatto.

## Enhancement point e section espliciti

SAP mette nel suo codice due istruzioni, ognuna appartenente a un **enhancement spot**:

```abap
" Un enhancement point: il tuo codice viene AGGIUNTO qui
ENHANCEMENT-POINT ep_check_item SPOTS es_sapmzflight.

" Un'enhancement section: il tuo codice SOSTITUISCE quello fra le due istruzioni
ENHANCEMENT-SECTION es_price_calc SPOTS es_sapmzflight.
  lv_price = ls_flight-price.
END-ENHANCEMENT-SECTION.
```

- In un **enhancement point**, la tua implementazione gira in aggiunta al codice standard. Per lo stesso punto possono esistere più implementazioni.
- In un'**enhancement section**, la tua implementazione gira **al posto** del codice standard fra `ENHANCEMENT-SECTION` ed `END-ENHANCEMENT-SECTION`. Può essere attiva una sola implementazione.
- I punti `STATIC` servono per le dichiarazioni (`DATA`, `TYPES`) e sono sempre attivi; i punti dinamici (il default) possono essere disattivati dallo Switch Framework.

> [!TIP]
> Gli enhancement espliciti sono le righe tratteggiate su un modulo stampato: "aggiungi qui le tue note". Un'enhancement section è un riquadro con scritto "cancella e riscrivi se serve". Gli enhancement impliciti sono i margini in alto e in basso di ogni pagina: ci sono sempre, anche se nessuno aveva previsto di scriverci.

## Le opzioni di enhancement implicito

Senza nessuna marcatura da parte di SAP, esiste un'opzione di enhancement implicito:

- all'**inizio e alla fine** di ogni `FORM`, modulo funzione e metodo (nei moduli funzione e nei metodi: subito dopo la firma e prima dell'istruzione di chiusura);
- alla **fine** di ogni include e del programma principale;
- alla **fine della parte dichiarativa** delle strutture definite con `BEGIN OF ... END OF`, per aggiungere componenti;
- per i moduli funzione, come **parametri aggiuntivi** nell'interfaccia;
- per i metodi delle classi globali, come **pre-metodi**, **post-metodi** e **metodi di overwrite**, e come attributi e metodi aggiuntivi della classe.

Le opzioni implicite non sono disponibili nel codice che SAP ha marcato come non estendibile, e in alcuni programmi centrali del basis.

## Creare un'implementazione nel codice sorgente

In SAP GUI (`SE38`, `SE37` o `SE80`):

1. Apri il programma standard in visualizzazione.
2. Scegli **Enhancement** (`Shift+F4`, l'icona a spirale).
3. Per le opzioni implicite scegli **Modifica > Operazioni di enhancement > Mostra opzioni di enhancement implicito**. Compaiono come righe marcate con `"""""""""`.
4. Fai clic destro sul punto o sull'opzione e scegli **Enhancement implementation > Crea implementazione**.
5. Inserisci il nome di un'enhancement implementation (per esempio `ZEI_FLIGHT_BOOKING`), un testo breve, il tuo package e una richiesta di trasporto.
6. Scrivi il codice fra `ENHANCEMENT` ed `ENDENHANCEMENT`, poi attiva (**Enhancement > Attiva**).

Anche i rilasci recenti di ADT supportano gli enhancement nel codice sorgente, ma i percorsi di menu dipendono dal rilascio, quindi i passi qui sopra usano SAP GUI.

Il risultato nel sorgente ha questo aspetto. Per esempio, alla fine di un modulo funzione standard:

```abap
  " ... ultime istruzioni del modulo funzione standard ...

ENHANCEMENT 1  ZEI_FLIGHT_BOOKING.    "active version
  " Blocca le prenotazioni in prima classe per un cliente di test
  IF is_booking-class = 'F' AND is_booking-customid = '00004711'.
    RAISE booking_not_allowed.        " eccezione dell'interfaccia del modulo funzione
  ENDIF.
ENDENHANCEMENT.
ENDFUNCTION.
```

L'enhancement vede tutti i dati visibili in quel punto: parametri, variabili locali e dati globali del programma.

## Gli enhancement dei metodi

Per i metodi delle classi globali, apri la classe in `SE24` o `SE80` e scegli **Classe > Enhancement**. Poi, sul metodo:

| Opzione             | Gira                                     | Può accedere a                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------ |
| pre-metodo          | prima del metodo originale               | i parametri importing e changing del metodo            |
| post-metodo         | dopo il metodo originale                 | i parametri importing, exporting, changing e returning |
| metodo di overwrite | al posto del metodo originale (uno solo) | tutti i parametri                                      |

Il framework genera una classe locale (`LCL_<enhancement>`) con i metodi `IPR_<metodo>` (pre), `IPO_<metodo>` (post) o `IOW_<metodo>` (overwrite). L'attributo `core_object` fa riferimento all'oggetto esteso; tramite esso raggiungi gli attributi pubblici, e quelli privati se l'enhancement è dichiarato con accesso a essi.

> [!WARNING]
> Gli enhancement impliciti dipendono da codice che non controlli. Un support package può spostare, rinominare o eliminare la variabile che il tuo enhancement legge, e il tuo codice smette di compilare o, peggio, continua a compilare con un significato diverso. Dopo ogni upgrade, `SPAU_ENH` elenca gli enhancement da controllare: provali tutti di nuovo.

> [!CAUTION]
> Un errore di sintassi in un enhancement blocca il programma standard per tutti gli utenti, perché il tuo codice viene compilato insieme a esso. Esegui sempre il controllo di sintassi prima di attivare, e trasporta gli enhancement insieme a tutti gli oggetti che usano.

## Trovare gli enhancement esistenti

- `SE84` > **Enhancement > Enhancement implementation**, filtrando per i tuoi package.
- Nel sorgente standard, le implementazioni attive compaiono in linea fra `ENHANCEMENT` ed `ENDENHANCEMENT`. Usa **Modifica > Operazioni di enhancement > Mostra implementazioni** per vederne i nomi.
- La tabella `ENHINCINX` collega le enhancement implementation ai programmi e agli include in cui si trovano.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea un modulo funzione `Z_FLIGHT_GET_PRICE` (importing `IV_CARRID`, `IV_CONNID`, `IV_FLDATE`, exporting `EV_PRICE`) che legge il prezzo da `SFLIGHT`. Fai finta che sia un oggetto standard che non puoi cambiare.
> 2. Aggiungi un enhancement implicito alla sua fine, nell'enhancement implementation `ZEI_FLIGHT_PRICE_ROUND`, che arrotonda `EV_PRICE` per eccesso a un numero intero.
> 3. Chiama il modulo funzione da un report e controlla il risultato. Poi disattiva l'enhancement e richiamalo.

### Soluzione

```abap
ENHANCEMENT 1  ZEI_FLIGHT_PRICE_ROUND.    "active version
  ev_price = ceil( ev_price ).
ENDENHANCEMENT.
```

Con l'enhancement attivo, un prezzo di `488.53` diventa `489.00`. Quando disattivi l'enhancement implementation, il modulo funzione restituisce di nuovo `488.53`, e il suo sorgente non è mai cambiato.

> [!NOTE]
>
> - Gli enhancement espliciti sono `ENHANCEMENT-POINT` (aggiunge codice) ed `ENHANCEMENT-SECTION` (sostituisce codice), messi da SAP negli enhancement spot.
> - Le opzioni di enhancement implicito esistono all'inizio e alla fine delle routine, alla fine di include e strutture, e come metodi pre, post e overwrite.
> - Il tuo codice vive fra `ENHANCEMENT` ed `ENDENHANCEMENT` in un'enhancement implementation del tuo package.
> - Gli enhancement vedono i dati visibili in quel punto, quindi si rompono facilmente quando SAP cambia il codice attorno.
> - Controlla ogni enhancement in `SPAU_ENH` dopo gli upgrade, e preferisci BAdI ed exit quando esistono.
