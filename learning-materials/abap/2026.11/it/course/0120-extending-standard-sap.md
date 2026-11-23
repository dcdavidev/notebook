---
title: Estendere lo standard SAP
description: Modifiche, exit, BAdI e l'enhancement framework in sintesi.
level: pro
---

Ogni azienda ha bisogno che SAP faccia qualcosa di leggermente diverso dallo standard: un controllo in più quando si salva un ordine di vendita, un campo aggiuntivo su una schermata, una regola di arrotondamento diversa. SAP offre molti modi per agganciare il tuo codice ai programmi standard, dalle vecchie user exit fino all'enhancement framework e all'estensibilità di SAP S/4HANA Cloud. Questa lezione ti dà la mappa; le lezioni successive trattano ogni tecnica nel dettaglio.

## Dalla meno alla più invasiva

Prima di scrivere codice, verifica se il codice serve davvero:

1. **Customizing** (`SPRO`): molte "modifiche" sono impostazioni. Chiedi prima a un consulente funzionale.
2. **Personalizzazione**: varianti di schermata, layout e parametri utente cambiano ciò che gli utenti vedono, senza sviluppo.
3. **Enhancement**: punti di aggancio previsti da SAP o supportati dal framework, dove aggiungi il tuo codice. Sopravvivono agli upgrade.
4. **Modifiche**: cambiamenti al codice sorgente di SAP. Sono l'ultima risorsa.

> [!TIP]
> Pensa a un appartamento in affitto. Il Customizing è spostare i mobili. Gli enhancement sono i ganci e le prese che il proprietario ha già messo nei muri. Una modifica è abbattere un muro: si può fare, ma devi chiedere il permesso, e a ogni ristrutturazione (upgrade) il proprietario potrebbe ricostruirlo e dovrai abbatterlo di nuovo.

## Le tecniche in sintesi

| Tecnica                 | Da        | Dove scrivi il codice                                  | Come la trovi                     | Lezione                                                              |
| ----------------------- | --------- | ------------------------------------------------------ | --------------------------------- | -------------------------------------------------------------------- |
| user exit               | R/2, R/3  | `FORM USEREXIT_...` negli include SAP (soprattutto SD) | l'include, per esempio `MV45AFZZ` | [user exit e customer exit](./0121-user-exits-and-customer-exits.md) |
| customer exit           | R/3 3.0   | include `ZX...` dei moduli funzione, tramite `CMOD`    | `SMOD`, `CALL CUSTOMER-FUNCTION`  | [user exit e customer exit](./0121-user-exits-and-customer-exits.md) |
| BAdI classica           | 4.6       | una classe che implementa `IF_EX_...`, tramite `SE19`  | `SE18`, `CL_EXITHANDLER`          | [le BAdI](./0122-badis.md)                                           |
| BAdI nuova (kernel)     | 7.0       | una classe in un'enhancement implementation            | `SE18`, `GET BADI`, `CALL BADI`   | [le BAdI](./0122-badis.md)                                           |
| enhancement esplicito   | 7.0       | `ENHANCEMENT-POINT` / `ENHANCEMENT-SECTION`            | il codice sorgente, `SE84`        | [enhancement impliciti ed espliciti](./0123-enhancement-points.md)   |
| enhancement implicito   | 7.0       | inizio e fine di quasi ogni routine                    | il codice sorgente                | [enhancement impliciti ed espliciti](./0123-enhancement-points.md)   |
| modifica                | da sempre | il codice sorgente di SAP stesso                       | il Modification Assistant         | questa lezione                                                       |
| developer extensibility | S/4HANA   | BAdI e API rilasciate, in ABAP Cloud                   | gli oggetti rilasciati in ADT     | [ABAP Cloud e clean core](./0148-abap-cloud.md)                      |

BAdI, enhancement point ed enhancement section fanno tutti parte dell'**enhancement framework**, introdotto con SAP NetWeaver 7.0. Sono raggruppati in **enhancement spot**, e il tuo codice va nelle **enhancement implementation**, che sono oggetti trasportabili del tuo package.

## Come scegliere

Scegli la prima opzione che risolve il problema:

1. Una **BAdI** nel punto giusto. Le BAdI sono interfacce progettate: SAP ti dice che cosa ricevi e che cosa puoi cambiare, e continuano a funzionare dopo gli upgrade.
2. Una **customer exit** o una **user exit**, se il processo (spesso SD, MM o FI) ne offre una in quel punto.
3. Un **enhancement point o section esplicito** messo da SAP.
4. Un **enhancement implicito** all'inizio o alla fine di una routine.
5. Una **modifica**, solo se nient'altro funziona.

In SAP S/4HANA chiediti anche se il codice debba stare nello standard. Con l'approccio **clean core** preferisci le BAdI e le API rilasciate, e costruisci le aggiunte più grandi come app separate (on-stack in ABAP Cloud, oppure side-by-side su SAP BTP).

> [!WARNING]
> Exit ed enhancement girano dentro la LUW di SAP. Non chiamare lì `COMMIT WORK`, `ROLLBACK WORK`, `CALL TRANSACTION` o `SUBMIT ... AND RETURN`, e non mostrare popup in codice che può girare anche in background o tramite un'API. Una sola istruzione sbagliata blocca la transazione standard per tutti gli utenti.

## Le modifiche

Una **modifica** è un cambiamento a un oggetto SAP: codice sorgente, schermate, oggetti del Dizionario. Per farne una ti servono:

- una **chiave sviluppatore** per il tuo utente e una **chiave oggetto** (chiave di accesso) per l'oggetto, entrambe registrate in SAP for Me (prima `SSCR`);
- il **Modification Assistant**, che registra la tua modifica come blocco di inserimento, sostituzione o cancellazione, così può essere confrontata e riapplicata in seguito.

A ogni upgrade o support package, le transazioni `SPDD` (oggetti del Dizionario) e `SPAU` (programmi e altri oggetti del repository) mostrano gli oggetti modificati. Per ognuno qualcuno deve decidere se mantenere la modifica, adattarla o tornare allo standard. `SPAU_ENH` fa lo stesso per gli enhancement.

```text
SE38 > programma SAPMV45A > Modifica
  -> popup "Inserire chiave di accesso"   (chiave oggetto registrata in SAP for Me)
  -> Modification Assistant attivo         (Modifica > Operazioni di modifica > Inserisci)
```

> [!CAUTION]
> Ogni modifica è un debito tecnico che paghi a ogni upgrade. Il supporto SAP può anche chiederti di riprodurre un problema senza la modifica. Documenta ogni modifica (perché, chi, quale ticket o requisito) e rivedi l'elenco con regolarità: molte si possono sostituire con una BAdI comparsa in un rilascio successivo.

## Esercizio

> [!IMPORTANT]
> Scegli una transazione standard che conosci, per esempio `VA01` (creare un ordine di vendita) o `ME21N` (creare un ordine d'acquisto).
>
> 1. In `SE93` trova il programma dietro la transazione.
> 2. In quel programma cerca `CALL CUSTOMER-FUNCTION`, `CL_EXITHANDLER`, `GET BADI` ed `ENHANCEMENT-POINT`.
> 3. Per ogni risultato, annota di quale tecnica si tratta.

### Soluzione

Per `VA01`, `SE93` mostra il programma `SAPMV45A`. Nel programma principale e nei suoi include trovi gli include delle user exit `MV45AFZZ`, `MV45AFZB` e altri; chiamate `CALL CUSTOMER-FUNCTION` per le customer exit; chiamate `GET BADI` e `CL_EXITHANDLER=>GET_INSTANCE` per le BAdI nuove e classiche; e molte istruzioni `ENHANCEMENT-POINT`. Usa la ricerca nel programma principale (`Ctrl+F` e l'opzione "Nel programma principale") per cercare in tutti gli include in una volta.

> [!NOTE]
>
> - Prova prima Customizing e personalizzazione; scrivi codice solo quando le impostazioni non bastano.
> - Le tecniche, dalla più vecchia alla più nuova: user exit, customer exit, BAdI classiche, enhancement framework (BAdI nuove, enhancement espliciti e impliciti).
> - Preferisci le BAdI, poi le exit, poi gli enhancement espliciti, poi quelli impliciti; modifica solo come ultima risorsa.
> - Non fare mai commit, rollback o popup dentro exit ed enhancement.
> - Le modifiche richiedono una chiave oggetto e il Modification Assistant, e vanno riviste in `SPDD` e `SPAU` a ogni upgrade.
