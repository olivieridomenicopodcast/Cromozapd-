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

## 3. Colori come regole momentanee (da decidere)
- Il colore dominante (quello dell'ultima Zapd) diventa la REGOLA IN VIGORE del turno; le regole saranno scelte dopo.
- Da decidere: quali 4 regole; se l'immunità del colore dominante resta; se la regola vale dal turno in cui esce la Zapd.

## 4. Carta Cromozapd (deciso: 13 Zapd totali = 12 colorate (3 per colore) + 1 Cromozapd)
- La partita finisce alla fine del turno in cui esce l'ULTIMA Zapd (la 13ª, qualunque sia).
- Effetto (deciso): **PASSA LE MANI** — tutti passano la propria mano di carte numeriche al giocatore successivo, nel verso di rotazione (le carte-effetto restano a chi le ha) — **e l'escluso del turno sceglie il colore dominante (cioè la regola di colore in vigore)**: «rispettiamo il cromo».
- Da definire: ordine (proposta: prima si passano le mani, poi l'escluso sceglie guardando la mano nuova); direzione del passaggio = verso dopo l'inversione della Zapd; se esce durante la pesca l'effetto si risolve a pesca finita con l'escluso definitivo del turno; se è la prima Zapd della partita il colore di partenza è quello della prima Zapd colorata; sposta il gettone e inverte il verso come le altre Zapd.
- Le 4 regole di colore devono essere di forza simile (l'escluso sceglie).
