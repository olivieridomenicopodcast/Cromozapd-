# Da implementare nell'app e nel regolamento (deciso da Niky, in attesa della decisione sui colori)

Questo elenco è il lavoro **già deciso ma non ancora fatto**. Si implementa tutto insieme dopo aver deciso le regole dei colori.

## Stato attuale nell'app (ultimo commit)
- Range da V a V+X, con X = carta dell'escluso giocata PER PRIMA e SCOPERTA (nessuna bugia possibile).
- Modificatori ±1/±2/±3 che allargano il range di 2n per lato; Annulla tolta; mazzo effetti 17 carte.
- Colori: solo il colore dominante (immunità alla coppia con entrambe le carte dominanti).

## 1. L'escluso dichiara e può tradire (simulato, solo nel codice di simulazione)
- L'escluso DICHIARA un numero esatto, poi gioca coperta la carta X; X si scopre al reveal; range V..V+X.
- Se il numero giocato è diverso dal dichiarato (sforo o no): pesca una carta TRADITORE; il valore si toglie ai suoi punti personali grezzi.
- Se la coppia sfora, il suo X vale 0 come adesso (nessun vantaggio dallo sforo per l'escluso onesto).
- Mazzetto Traditore da **12 carte** (0,0,1,1,1,1,2,2,2,2,3,3), pescate senza reinserimento, tenute scoperte davanti al giocatore; finito il mazzetto **ogni nuovo tradimento costa 3**.
- Da fare: motore (già in `xHidden`/`traitor`, da portare tra le regole predefinite), pannelli UI (dichiarazione dell'escluso, tradimento al reveal, carte Traditore visibili, 12 carte + costo 3 a mazzetto finito), regolamento, legenda, test, IA (livelli).

## 2. Far capire il "non tirare la corda"
- Due frasi sul riepilogo: «la carta per sé è sempre tua, ma ogni punto che togli alla coppia abbassa la tua quota»; «una coppia che sfora fa 0: una carta alta in coppia è un rischio, non un regalo».
- Foglio punti con colonne "Personali" e "Quota" affiancate.
- Esempio di due turni nel regolamento (uno che spreme la coppia, uno che spreme sé stesso).
- Nell'app: anteprima prima di confermare con "con questa carta rischi X% di sforare" e "tenere per te: +Y, ma la tua quota cala".
- Misure di riferimento: sempre carte alte → vince 10%; egoista → 14,5%; equilibrato → ~33%.

## 3. Colori come regole momentanee (set deciso: Silenzio, Giuramento, Luce, Effetti vietati; da assegnare ai 4 colori)
- Il colore dominante (quello dell'ultima Zapd) diventa la REGOLA IN VIGORE del turno; le regole saranno scelte dopo.
- Da decidere: quali 4 regole; se l'immunità del colore dominante resta; se la regola vale dal turno in cui esce la Zapd.

## 4. Carta Cromozapd (deciso: 13 Zapd totali = 12 colorate (3 per colore) + 1 Cromozapd)
- La partita finisce alla fine del turno in cui esce l'ULTIMA Zapd (la 13ª, qualunque sia).
- Effetto (deciso): **PASSA LE MANI** — tutti passano la propria mano di carte numeriche al giocatore successivo, nel verso di rotazione (le carte-effetto restano a chi le ha) — **e **chi ha pescato la Cromozapd** sceglie il colore dominante (cioè la regola di colore in vigore)**: «rispettiamo il cromo». (Corretto da Niky: non l'escluso, altrimenti Luce non verrebbe mai scelta.)
- Da definire: ordine (proposta: prima si passano le mani, poi l'escluso sceglie guardando la mano nuova); direzione del passaggio = verso dopo l'inversione della Zapd; se esce durante la pesca l'effetto si risolve a pesca finita con l'escluso definitivo del turno; se è la prima Zapd della partita il colore di partenza è quello della prima Zapd colorata; sposta il gettone e inverte il verso come le altre Zapd.
- Le 4 regole di colore devono essere di forza simile (l'escluso sceglie).

### Regole di colore decise (il colore dominante = regola in vigore; l'immunità del colore dominante è TOLTA)
- **Silenzio**: l'escluso non dichiara e gli attivi non parlano.
- **Giuramento**: l'escluso non può mentire (se tradisce pesca 2 carte Traditore).
- **Luce**: X si gioca scoperta prima della discussione.
- **Effetti vietati**: nessuna carta-effetto in fila in quel turno (Sincero non conta come effetto; l'escluso pesca come sempre).
- Da definire: chi sceglie quando la Cromozapd esce come carta centrale / da "Prossima carta" (nessuno l'ha "pescata"); associazione colore→regola.

## 5. Carte effetto: da rivedere sulle regole nuove (in discussione)
- DECISO: **Sincero e Scambio forzato sono TOLTI** dal mazzo effetti (5 carte da sostituire: 3 + 2). Restano Reverse (3), Prossima carta (3) e i 6 modificatori ±n.
- DECISO: se la Cromozapd esce come carta centrale, **sceglie la regola chi scopre la carta centrale** (da definire chi scopre la carta centrale in ogni turno).
- Sostituti in discussione: Lente (guardi la carta coperta dell'escluso prima di giocare), Ripesca (scarti una carta e ne pesci un'altra), altre.
- DECISO: **Cambio centrale scartata** (misure in DA_RICORDARE). Da ripensare: Lente (guardi la carta coperta dell'escluso, non puoi parlare) e un nuovo effetto di scambio con l'escluso (in discussione).
- DECISO: **Baratto** = 3 copie (corretto: prima 2). Dopo che l'escluso ha giocato la sua carta, chi lo gioca vede la mano rimasta all'escluso (solo lui la vede), sceglie una carta da prendere e gliene dà una sua (coperta). Misura: chi lo gioca +0,9/+1,1 punti.
- In discussione: **Lente** (misure negative così com'è: chi guarda non parla). Mazzo effetti attuale: Reverse 3, Prossima carta 3, ±n 6, Baratto 2 = 14 carte; mancano carte per arrivare a 17 (o si riduce il mazzo).
- DECISO: **Lente tolta** (misure negative). **Mazzo effetti finale: 15 carte** = Reverse 3, Prossima carta 3, ±1/±2/±3 (6 carte: 2 per valore), Baratto 3. (Sincero, Scambio forzato, Annulla, Cambio centrale e Lente non ci sono.)
- Misure con questo mazzo (hard×3, 120 partite, X coperta + Traditore): modificatori pescati 4,4/partita su 6, giocati 3,4/partita (decisivi 1,3, inutili 1,6, non bastano 0,3); Baratto giocato 1,95/partita; Reverse e Prossima ~1,5 ciascuna; a fine partita restano in media 4,1 carte nel mazzo effetti, nessuna partita a mazzo vuoto.
