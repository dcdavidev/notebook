---
title: Il Dizionario Dati (SE11)
description: Domini, elementi dati, tabelle, strutture, viste e aiuti di ricerca.
---

_Settimana 1 · Livello base · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Ora 1  | Che cos'è il Dizionario Dati; domini ed elementi dati                                                 |
| Ora 2  | Tabelle trasparenti: campi, chiavi, impostazioni tecniche, campi valuta e quantità                    |
| Ora 3  | Strutture, tipi tabella, chiavi esterne, tabelle di controllo, aiuti di ricerca                       |
| Ora 4  | Viste, indici, oggetti di blocco (cenni), tabelle standard importanti, tabelle di manutenzione (SM30) |

## Ora 1 – Che cos'è il Dizionario Dati

Il **Dizionario Dati ABAP** (_ABAP Dictionary_, DDIC) è il luogo centrale dove si descrivono tutti i dati di SAP: tabelle del database, tipi di dato condivisi, strutture. Si apre con la transazione **SE11** (o in ADT).

> [!TIP]
> Il Dizionario Dati è come il catasto di una città. Non contiene le case (i dati), ma descrive ogni edificio: quanti piani ha, di che materiale è fatto, a chi è collegato. Se vuoi costruire qualcosa, prima lo registri al catasto, e tutti sanno com'è fatto.

Perché è così importante:

- Quando crei una tabella in SE11, SAP crea automaticamente la tabella vera nel database.
- I tipi definiti nel DDIC si possono usare in tutti i programmi.
- Le descrizioni dei campi (le etichette che l'utente vede a video) e gli aiuti di ricerca (F4) vengono dal DDIC: definiti una volta, funzionano ovunque.
- Se cambi un tipo nel DDIC, tutti i programmi che lo usano si adeguano.

### La catena: dominio → elemento dati → campo

SAP descrive ogni campo su due livelli:

| Oggetto          | Che cosa descrive                                            | Esempio          |
| ---------------- | ------------------------------------------------------------ | ---------------- |
| Dominio          | l'aspetto tecnico: tipo, lunghezza, decimali, valori ammessi | CHAR 10          |
| Elemento dati    | il significato: etichette, documentazione, aiuto di ricerca  | "Numero cliente" |
| Campo di tabella | l'uso concreto in una tabella                                | `KNA1-KUNNR`     |

> [!TIP]
> Il dominio è il materiale ("mattone di 20 cm"), l'elemento dati è il ruolo ("mattone del muro portante della cucina"). Lo stesso tipo di mattone (dominio) può avere tanti ruoli diversi (elementi dati): "codice cliente" e "codice fornitore" possono avere lo stesso dominio CHAR 10, ma etichette e significati diversi.

### Creare un dominio

In SE11 scegli "Dominio", nome `ZD_STATO_ORDINE`:

- **Definizione**: tipo dati CHAR, lunghezza 1.
- **Range di valori** (valori fissi): `N` = Nuovo, `L` = In lavorazione, `C` = Chiuso.
- Salva e attiva.

I valori fissi vengono controllati automaticamente sulle schermate e proposti con F4.

### I tipi di dato del Dizionario

Il DDIC ha tipi propri, che vengono mappati sui tipi ABAP:

| Tipo DDIC                 | Significato                            | Tipo ABAP                |
| ------------------------- | -------------------------------------- | ------------------------ |
| CHAR                      | testo fisso                            | `c`                      |
| NUMC                      | testo numerico                         | `n`                      |
| INT1 / INT2 / INT4 / INT8 | interi                                 | `b` / `s` / `i` / `int8` |
| DEC                       | decimale impaccato                     | `p`                      |
| CURR                      | importo (legato a una valuta)          | `p`                      |
| QUAN                      | quantità (legata a un'unità di misura) | `p`                      |
| CUKY                      | codice valuta (EUR, USD)               | `c LENGTH 5`             |
| UNIT                      | unità di misura (KG, PZ)               | `c LENGTH 3`             |
| DATS                      | data                                   | `d`                      |
| TIMS                      | ora                                    | `t`                      |
| LANG                      | lingua                                 | `c LENGTH 1`             |
| CLNT                      | mandante                               | `c LENGTH 3`             |
| STRING / RAWSTRING        | testo / binario variabile              | `string` / `xstring`     |
| RAW                       | binario fisso                          | `x`                      |
| FLTP                      | virgola mobile                         | `f`                      |
| DATN / TIMN / UTCLONG     | nuovi tipi data/ora (HANA)             | `d` / `t` / `utclong`    |

### Creare un elemento dati

In SE11 scegli "Tipo dati" → "Elemento dati", nome `ZE_STATO_ORDINE`:

- Scheda **Tipo dati**: dominio `ZD_STATO_ORDINE`.
- Scheda **Denominazione campo**: testi breve (10), medio (20), lungo (40) e intestazione. Sono le etichette che appariranno a video e negli ALV.
- Opzionale: documentazione (F1) e ID parametro (SET/GET, per proporre valori tra transazioni).

Puoi anche creare un elemento dati con **tipo predefinito** (senza dominio): comodo ma meno riutilizzabile.

## Ora 2 – Le tabelle trasparenti

Una **tabella trasparente** nel DDIC corrisponde esattamente a una tabella nel database ("trasparente" perché c'è una relazione 1 a 1). È il tipo di tabella che userai quasi sempre.

### Creiamo una tabella: ZORDINI_CORSO

In SE11 → Tabella database → `ZORDINI_CORSO` → Crea.

Scheda **Proprietà** (_Delivery and Maintenance_):

- Descrizione breve: "Ordini di esempio del corso".
- **Classe di consegna** (_Delivery class_): `A` = tabella applicativa (dati master e di movimento). Altre: `C` = customizing, `L` = temporanea, `G`, `E`, `S`, `W` = di sistema.
- **Visualizzazione/manutenzione dati**: "Consentita" se vuoi poterla modificare con SE16/SM30.

Scheda **Campi**:

| Campo      | Chiave | Elemento dati             | Note                    |
| ---------- | ------ | ------------------------- | ----------------------- |
| `MANDT`    | sì     | `MANDT`                   | mandante, sempre primo  |
| `ORDINE`   | sì     | `ZE_NUM_ORDINE` (NUMC 10) | numero ordine           |
| `CLIENTE`  |        | `KUNNR`                   | cliente standard SAP    |
| `DATA_ORD` |        | `DATUM`                   | data ordine             |
| `IMPORTO`  |        | `ZE_IMPORTO` (CURR 15,2)  | importo                 |
| `VALUTA`   |        | `WAERS`                   | valuta (CUKY)           |
| `QUANTITA` |        | `ZE_QTA` (QUAN 13,3)      | quantità                |
| `UM`       |        | `MEINS`                   | unità di misura (UNIT)  |
| `STATO`    |        | `ZE_STATO_ORDINE`         | il nostro elemento dati |

### La chiave primaria

I campi con la spunta **Chiave** formano la **chiave primaria**: la combinazione dei loro valori identifica una e una sola riga. Due righe non possono avere la stessa chiave.

> [!TIP]
> La chiave primaria è come il codice fiscale: non esistono due persone con lo stesso. Se provi a inserire una seconda riga con la stessa chiave, il database la rifiuta.

Regole:

- I campi chiave devono stare all'inizio della tabella, uno dopo l'altro.
- Il primo campo di una tabella dipendente dal mandante è `MANDT`.
- Se manca `MANDT`, la tabella è **indipendente dal mandante** (stessi dati in tutti i mandanti): raro, usato per dati tecnici.

### Campi importo e quantità: il campo di riferimento

Un campo **CURR** (importo) deve avere un **campo di riferimento** di tipo CUKY (valuta), e un campo **QUAN** deve avere un riferimento UNIT. Si imposta nella scheda **Campi valuta/quantità**: per `IMPORTO` tabella di riferimento `ZORDINI_CORSO`, campo `VALUTA`.

Perché? Perché 100 non vuol dire niente da solo: 100 EUR o 100 JPY sono cifre molto diverse, e alcune valute non hanno decimali. SAP usa il riferimento per visualizzare correttamente l'importo.

### Impostazioni tecniche

Pulsante **Impostazioni tecniche** (obbligatorie per attivare):

- **Classe dati** (_Data class_): `APPL0` = dati master (cambiano poco), `APPL1` = dati di movimento (cambiano spesso), `APPL2` = customizing.
- **Categoria dimensioni** (_Size category_): stima del numero di righe (0 = poche).
- **Buffering**: SAP può tenere una copia della tabella in memoria sul server di applicazione, per leggere più veloce. Si usa per tabelle **piccole, lette spesso e modificate raramente** (es. tabelle di configurazione). Tipi: completo, generico, singolo record.
- **Log delle modifiche**: registra chi cambia cosa (tabella `DBTABLOG`).

Infine, nel menu Extra → **Categoria di miglioramento** (_Enhancement category_) indichi se la tabella potrà essere estesa (scegli per esempio "Può essere migliorata (carattere o numerica)"). Poi attiva.

### Vedere e inserire dati

- **SE16 / SE16N**: visualizzare (e, se consentito, inserire) dati.
- **SE16H**: come SE16N con raggruppamenti e somme (sistemi recenti).
- Da programma: con l'Open SQL (giorno 6).

### Tipi di tabella del DDIC

| Tipo                             | Descrizione                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Tabella trasparente              | 1:1 col database, la normalità                                                                                                  |
| Tabella pool / cluster           | vecchi tipi di ECC: più tabelle logiche in una fisica (es. `BSEG` era cluster). In S/4HANA sono state convertite in trasparenti |
| Tabella globale temporanea (GTT) | dati che vivono solo fino al `COMMIT`, per elaborazioni intermedie                                                              |

### Modificare una tabella esistente

Aggiungere un campo a una tabella che contiene già dati è normale: alla attivazione SAP adegua il database. Cambiare il tipo o togliere campi chiave invece può richiedere una **conversione** (transazione **SE14**, _Database Utility_), che può essere lunga e rischiosa per tabelle grandi.

> [!WARNING]
> Non si modificano mai le tabelle standard SAP. Per aggiungere campi a una tabella standard si usano **append structure** o include personalizzati (`CI_` include) che vedremo nel giorno 13.

## Ora 3 – Strutture, tipi tabella, chiavi esterne, aiuti di ricerca

### Strutture

Una **struttura** nel DDIC ha campi come una tabella, ma **non contiene dati** e non esiste nel database. Serve come tipo per variabili, parametri e schermate.

```abap
DATA ls_indirizzo TYPE zs_indirizzo.   " struttura DDIC creata in SE11
DATA ls_ordine    TYPE zordini_corso.  " una tabella si può usare come struttura!
```

> [!TIP]
> Una tabella DDIC è un armadio con i cassetti pieni; una struttura è il disegno dell'armadio. Con il disegno puoi costruire armadi (variabili) nei tuoi programmi, ma il disegno in sé non contiene vestiti.

Le strutture possono includere altre strutture (`.INCLUDE`) e contenere campi che sono a loro volta strutture o tabelle (strutture "profonde").

### Tipi tabella (Table Types)

Un **tipo tabella** descrive una tabella interna (giorno 5): di che righe è fatta, che tipo di accesso (standard, ordinata, hashed) e che chiave ha. Serve soprattutto per i parametri di funzioni e metodi globali.

```abap
DATA lt_ordini TYPE ztt_ordini.   " tipo tabella creato in SE11 con riga ZORDINI_CORSO
```

### Chiavi esterne e tabelle di controllo

Una **chiave esterna** (_foreign key_) collega un campo a una **tabella di controllo**: i valori ammessi sono solo quelli presenti in quella tabella.

Esempio: il campo `CLIENTE` di `ZORDINI_CORSO` ha come tabella di controllo `KNA1` (anagrafica clienti). Sulle schermate SAP controlla in automatico che il cliente esista, e F4 propone i clienti.

Si crea selezionando il campo e premendo il pulsante con la chiave (_Foreign Keys_). SAP propone la tabella di controllo se il dominio ha una "tabella valori".

> [!TIP]
> La chiave esterna è come il buttafuori di un locale con la lista degli invitati (la tabella di controllo): entra solo chi è sulla lista.

> [!WARNING]
> Il controllo della chiave esterna avviene **sulle schermate**, non nel database. Un programma ABAP che scrive con `INSERT` può inserire valori non validi: tocca a te controllarli nel codice.

### Valori fissi vs tabella di controllo

| Strumento                | Quando usarlo                                                           |
| ------------------------ | ----------------------------------------------------------------------- |
| Valori fissi nel dominio | pochi valori, stabili, decisi dallo sviluppatore (es. stato N/L/C)      |
| Tabella di controllo     | valori che crescono o vengono gestiti dagli utenti (es. clienti, paesi) |

### Tabelle di testo

Per gestire le descrizioni in più lingue si crea una **tabella di testo** separata, con chiave = chiave della tabella principale + campo lingua (`SPRAS`). Esempio standard: `T005` (paesi) e `T005T` (nomi dei paesi in ogni lingua). `MARA` (materiali) e `MAKT` (descrizioni dei materiali).

### Aiuti di ricerca (Search Help, F4)

Un **aiuto di ricerca** definisce la finestra che appare premendo F4: da quale tabella leggere, quali campi mostrare, quali usare come filtro.

- **Elementare**: una sola fonte dati (tabella o vista).
- **Collettivo**: raggruppa più aiuti elementari in schede (es. cerca cliente per nome, per città, per partita IVA).

Si può assegnare a un elemento dati, a un campo di tabella, a una struttura o direttamente a un parametro di schermata (`MATCHCODE OBJECT`).

## Ora 4 – Viste, indici e tabelle standard

### Viste

Una **vista** combina campi di una o più tabelle, senza duplicare i dati.

| Tipo di vista         | A cosa serve                                                          |
| --------------------- | --------------------------------------------------------------------- |
| Vista database        | join di tabelle, leggibile con `SELECT` (nel database esiste davvero) |
| Vista di proiezione   | mostra solo alcuni campi di una tabella                               |
| Vista di manutenzione | per creare dialoghi di manutenzione (SM30) su più tabelle collegate   |
| Vista di aiuto        | per gli aiuti di ricerca con outer join                               |

Oggi, al posto delle viste database classiche, si usano le **CDS view** (giorno 14), molto più potenti.

### Indici

Un **indice** è una copia ordinata di alcuni campi che permette al database di trovare le righe in fretta. L'indice primario sulla chiave esiste sempre. Puoi creare **indici secondari** su campi che usi spesso nelle `WHERE`.

> [!TIP]
> L'indice è come l'indice analitico in fondo a un libro: invece di sfogliare tutte le pagine, vai alla parola e trovi subito il numero di pagina.

Non esagerare: ogni indice rallenta gli inserimenti e occupa spazio. Su SAP HANA (database colonnare in memoria) gli indici secondari servono molto meno.

### Oggetti di blocco (Lock Objects)

Quando due utenti modificano lo stesso dato contemporaneamente, si rischia di perdere modifiche. SAP usa **blocchi logici**: si definiscono in SE11 come oggetti di blocco (nome che inizia con `EZ`), e SAP genera due moduli funzione `ENQUEUE_EZ...` (blocca) e `DEQUEUE_EZ...` (sblocca). I blocchi attivi si vedono in **SM12**. Li useremo nel giorno 13.

### Manutenzione tabelle: SM30

Per permettere agli utenti di inserire/modificare righe di una tabella Z (tipicamente di configurazione), si genera un **dialogo di manutenzione**: in SE11 → Utilità → Generatore aggiornamento tabelle (transazione **SE54**). Si sceglie gruppo funzioni e tipo di schermata (una o due fasi). Poi l'utente usa **SM30** con il nome della tabella. Si può creare anche una transazione dedicata (SE93, transazione di parametri che chiama SM30).

### Tabelle standard SAP da conoscere

| Tabella                                 | Contenuto                                                         |
| --------------------------------------- | ----------------------------------------------------------------- |
| `T001`                                  | Società (_company code_)                                          |
| `T001W`                                 | Divisioni / stabilimenti (_plant_)                                |
| `KNA1` / `KNB1` / `KNVV`                | Clienti: dati generali / di società / di vendita                  |
| `LFA1` / `LFB1`                         | Fornitori: dati generali / di società                             |
| `MARA` / `MARC` / `MARD` / `MAKT`       | Materiali: generali / per divisione / per magazzino / descrizioni |
| `VBAK` / `VBAP`                         | Ordini di vendita: testata / posizioni                            |
| `LIKP` / `LIPS`                         | Consegne: testata / posizioni                                     |
| `VBRK` / `VBRP`                         | Fatture: testata / posizioni                                      |
| `EKKO` / `EKPO`                         | Ordini d'acquisto: testata / posizioni                            |
| `BKPF` / `BSEG`                         | Documenti contabili: testata / righe                              |
| `ACDOCA`                                | Universal Journal (S/4HANA): tutte le righe contabili             |
| `MATDOC`                                | Documenti materiale (S/4HANA)                                     |
| `BUT000`                                | Business Partner (S/4HANA)                                        |
| `USR02`                                 | Utenti                                                            |
| `TSTC`                                  | Transazioni                                                       |
| `DD02L` / `DD03L`                       | Tabelle e campi del dizionario stesso                             |
| `SCARR` / `SPFLI` / `SFLIGHT` / `SBOOK` | Modello didattico dei voli (per esercitarsi)                      |

Il modello dei voli (_flight model_) è presente in quasi tutti i sistemi: se le tabelle sono vuote, esegui il report `SAPBC_DATA_GENERATOR` per riempirle. Nei sistemi ABAP Cloud esistono le tabelle equivalenti `/DMO/FLIGHT`, `/DMO/CARRIER`, `/DMO/CONNECTION`, `/DMO/BOOKING`, ecc. (pacchetto `/DMO/FLIGHT_LEGACY`, generabile con la classe `/DMO/CL_FLIGHT_DATA_GENERATOR`).

> [!WARNING]
> Trucco per scoprire in quale tabella è salvato un campo che vedi a video: posizionati sul campo, premi F1 e poi "Informazioni tecniche". Attenzione però: spesso la schermata mostra una **struttura**, non la tabella del database. In quel caso usa la traccia SQL (ST05, giorno 14) o cerca nei forum la tabella giusta.

## Esercizi

> [!IMPORTANT]
>
> 1. Crea il dominio `ZD_STATO_ORDINE` con 3 valori fissi e l'elemento dati `ZE_STATO_ORDINE` con le etichette.
> 2. Crea la tabella `ZORDINI_CORSO` come descritto, con i campi importo/valuta e quantità/unità correttamente collegati. Attivala.
> 3. Aggiungi una chiave esterna sul campo `CLIENTE` verso `KNA1`.
> 4. Genera il dialogo di manutenzione e inserisci 5 ordini con SM30. Verifica con SE16N.
> 5. Crea la struttura `ZS_INDIRIZZO` (via, città, CAP, paese) e il tipo tabella `ZTT_ORDINI` con riga `ZORDINI_CORSO`.
> 6. In SE11 apri la tabella `VBAK` e individua: chiave primaria, classe di consegna, campo importo e suo campo di riferimento valuta.
> 7. Usa F1 → Informazioni tecniche su un campo della transazione VA03 (visualizza ordine) e annota il nome tecnico.

## Quiz

1. Differenza tra dominio ed elemento dati?
2. Perché `MANDT` è il primo campo delle tabelle?
3. Che cosa succede se un campo CURR non ha un campo di riferimento valuta?
4. Differenza tra tabella e struttura nel DDIC?
5. A che cosa serve una tabella di controllo?
6. Quando conviene attivare il buffering?
7. In quale transazione l'utente modifica una tabella con dialogo di manutenzione?
8. Dove si vedono i blocchi attivi?

## Soluzioni

Esercizio 6: chiave di `VBAK` = `MANDT` + `VBELN` (numero documento di vendita); classe di consegna A; il campo importo `NETWR` (valore netto) fa riferimento alla valuta `WAERK`.

Quiz:

1. Il dominio descrive l'aspetto tecnico (tipo, lunghezza, valori); l'elemento dati il significato (etichette, documentazione).
2. Perché i dati sono separati per mandante e Open SQL filtra automaticamente su quel campo.
3. La tabella non si attiva: è un errore.
4. La tabella esiste nel database e contiene dati, la struttura è solo una descrizione usata come tipo.
5. A limitare i valori ammessi di un campo a quelli presenti in un'altra tabella (controllo e F4 sulle schermate).
6. Per tabelle piccole, lette molto spesso e modificate raramente.
7. SM30.
8. SM12.

> [!NOTE]
> Oggi hai imparato: il Dizionario Dati, domini, elementi dati, tabelle trasparenti con chiavi e impostazioni tecniche, strutture, tipi tabella, chiavi esterne, aiuti di ricerca, viste, indici, SM30 e le principali tabelle SAP. Domani: le tabelle interne, lo strumento più usato in ABAP.
