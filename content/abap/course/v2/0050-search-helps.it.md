---
title: Gli aiuti di ricerca
description: "L'aiuto F4: aiuti di ricerca elementari e collettivi."
---

_Livello base_

Quando un utente preme F4 su un campo di input, SAP mostra un elenco di valori possibili. Un **aiuto di ricerca** (_search help_) è l'oggetto del Dizionario che definisce quell'elenco: da dove arrivano i valori, quali colonne vede l'utente e quale valore torna nel campo.

Un buon aiuto di ricerca evita agli utenti di ricordare i codici. Lo crei una volta nel Dizionario, lo colleghi a un elemento dati o a un campo di tabella, e ogni schermata che usa quel campo ottiene l'aiuto senza altro lavoro.

## Da dove arriva l'aiuto F4

Il sistema cerca un aiuto valori in quest'ordine e usa il primo che trova:

1. Un aiuto programmato nella schermata stessa (`PROCESS ON VALUE-REQUEST`, che vedrai con la [logica di flusso delle Dynpro](./0102-dynpro-flow-logic.it.md)).
2. Un aiuto di ricerca collegato al campo della schermata (per esempio `MATCHCODE OBJECT` su una schermata di selezione).
3. Un aiuto di ricerca collegato al campo della tabella o della struttura.
4. La tabella di controllo del campo (vedi [Chiavi esterne e tabelle di controllo](./0047-foreign-keys-and-check-tables.it.md)), con il suo aiuto di ricerca se ne ha uno.
5. Un aiuto di ricerca collegato all'elemento dati.
6. I valori fissi del dominio.
7. Un calendario per le date e un orologio per gli orari.

Quindi, anche senza nessun aiuto di ricerca, un campo con una tabella di controllo o con valori fissi nel dominio mostra già qualcosa con F4.

> [!TIP]
> Un aiuto di ricerca è l'indice in fondo a un libro di cucina. Non ricordi a che pagina sta la ricetta delle lasagne, quindi cerchi "lasagne" e l'indice ti dà il numero di pagina. L'utente non ricorda il codice della compagnia aerea, quindi F4 mostra "Lufthansa" e mette `LH` nel campo.

## Gli aiuti di ricerca elementari

Un **aiuto di ricerca elementare** legge una sola tabella o vista. Lo crei in `SE11` alla voce **Aiuto di ricerca**. Ha tre impostazioni principali:

| Impostazione        | Significato                                                                             |
| ------------------- | --------------------------------------------------------------------------------------- |
| Metodo di selezione | la tabella o la vista che fornisce i valori, per esempio `SCARR`                        |
| Tipo di dialogo     | mostrare subito i valori, chiedere prima delle restrizioni o decidere in base al numero |
| Parametri           | i campi dell'aiuto, con i loro flag                                                     |

Ogni parametro ha questi flag:

- **IMP** (import): il valore già presente nel campo della schermata serve a filtrare l'elenco.
- **EXP** (export): il valore torna nel campo della schermata quando l'utente sceglie una riga.
- **LPos**: la posizione della colonna nell'elenco dei risultati.
- **SPos**: la posizione del campo nel dialogo delle restrizioni.

Ecco il disegno di `ZSH_CARRID`, un aiuto di ricerca per i codici delle compagnie aeree:

```text
Aiuto di ricerca:     ZSH_CARRID
Metodo di selezione:  SCARR
Tipo di dialogo:      Visualizzare subito i valori

Parametro   IMP  EXP  LPos  SPos
CARRID       X    X     1     1
CARRNAME                2     2
CURRCODE                3     0
```

L'utente vede codice, nome e valuta, può filtrare per codice o per nome e riceve il codice nel campo.

## Gli aiuti di ricerca collettivi

Un **aiuto di ricerca collettivo** raggruppa più aiuti elementari. Con F4 l'utente vede una scheda per ogni aiuto elementare e può cercare in modi diversi: per esempio trovare un cliente per nome, per città o per area di vendita.

In `SE11` crea un aiuto di ricerca, scegli **Aiuto di ricerca collettivo**, definisci i parametri che scambia con il campo ed elenca gli aiuti elementari nella scheda **Aiuti di ricerca inclusi**. Con **Assegnazione parametri** collega ogni parametro dell'aiuto collettivo a un parametro di quello incluso.

Lo standard SAP ha molti aiuti di ricerca collettivi, come `DEBI` per i clienti. Puoi aggiungere un tuo aiuto elementare a uno collettivo standard con un **append di aiuto di ricerca**, senza modificarlo.

## Collegare un aiuto di ricerca

Un aiuto di ricerca non fa nulla finché non lo colleghi. Hai tre possibilità principali:

- **A un elemento dati**: in `SE11`, nella scheda **Ulteriori caratteristiche** dell'elemento dati. Ogni campo di quel tipo riceve l'aiuto.
- **A un campo di tabella o struttura**: nella tabella, seleziona il campo e scegli **Aiuto ricerca**. È più specifico e vince sull'elemento dati.
- **A un parametro di una schermata di selezione**, direttamente nel programma:

```abap
REPORT zsearch_help_demo.

PARAMETERS p_carr TYPE s_carr_id MATCHCODE OBJECT zsh_carrid.

WRITE: / 'Compagnia scelta:', p_carr.
```

`PARAMETERS` lo vedrai nel dettaglio in [Schermate di selezione: PARAMETERS](./0063-parameters.it.md).

> [!WARNING]
> Un aiuto di ricerca propone soltanto i valori: non li controlla. L'utente può comunque scrivere un valore che non è nell'elenco. Per rifiutare i valori non validi usa una tabella di controllo con una chiave esterna, oppure controlla l'input nel programma.

Per esigenze particolari, come filtrare l'elenco in base alle autorizzazioni dell'utente, una **search help exit** è un modulo funzione che cambia il comportamento dell'aiuto a runtime. Quando te ne serve una, copia il modello `F4IF_SHLP_EXIT_EXAMPLE`.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea l'aiuto di ricerca elementare `ZSH_CARRID` su `SCARR` come mostrato, e provalo con **F8** in `SE11`.
> 2. Scrivi un report con un parametro che lo usa tramite `MATCHCODE OBJECT` e verifica che F4 restituisca il codice della compagnia.

### Soluzione

L'aiuto di ricerca è quello della sezione sugli aiuti elementari. Il report:

```abap
REPORT zsearch_help_demo.

PARAMETERS p_carr TYPE s_carr_id MATCHCODE OBJECT zsh_carrid.

WRITE: / 'Compagnia scelta:', p_carr.
```

Premi F4 su `P_CARR`, scegli una riga e il codice compare nel campo.

> [!NOTE]
>
> - Un aiuto di ricerca definisce l'elenco F4: origine, colonne e valore restituito.
> - Un aiuto di ricerca elementare legge una tabella o una vista; uno collettivo raggruppa più aiuti elementari.
> - I parametri IMP filtrano l'elenco con il valore del campo; i parametri EXP restituiscono il valore scelto.
> - Collega l'aiuto a un elemento dati, a un campo di tabella o a un campo di schermata; vince il più specifico.
> - Un aiuto di ricerca non convalida l'input: per quello usa le tabelle di controllo.
