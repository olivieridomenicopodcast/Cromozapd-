# Da ricordare — punti di bilanciamento aperti

*Da NON decidere ora: li riprendiamo col simulatore e coi playtest. Ricordarli a Niky a ogni tappa importante.*

1. **Modificatori ±1/2/3**: sono solo vantaggi (allargano il range), senza costo d'uso a parte occupare uno dei 2 posti in mano. Misurare se vengono giocati sempre.
2. **Annulla**: manca ancora un incentivo chiaro a usarlo (soprattutto contro il compagno). Analizzarlo con l'analisi "forzata" degli effetti.
3. **Immunità del colore dominante**: con carte scelte a caso vale circa il 6% dei turni. Misurare quanto la cercano le AI e quanto pesa.
4. **Base**: ora **12** con la carta dell'escluso nella somma (caso 1, deciso da Niky; prima era 7 senza l'escluso). Da riverificare nei playtest: con umani che cooperano lo sforo era ~6% (4% in basso, 2% in alto); controllare che la tensione sia quella voluta.
5. **Escluso "sempre a metà"**: possibile correttivo (peso diverso dei contributi da escluso, bonus sopra soglia).
6. **Ruolo dei colori** oltre al colore dominante (e della carta centrale): non esplorato.
7. **Numero di copie** di ogni carta-effetto: valori di partenza provvisori (20 carte).
8. **Rapporto punti personali / Fattore coppie**: validare che la "campana" regga davvero.
9. **Margine del mazzo**: con "Prossima carta" si consumano carte in più; il fuzz controlla che il mazzo regga (finora sì).
10. **Zapd quasi ogni turno** (circa 0,78 a turno): l'escluso cambia spesso e a volte di due posti; è voluto?

## Cosa hanno mostrato le simulazioni (**regole precedenti al caso 1**: **Base 7**, l'escluso avanza a ogni turno, ogni Zapd inverte il verso; Difficile contro Difficile, 400 partite)
*Dati misurati. Da discutere prima di decidere qualsiasi cosa.*
11. **Vantaggio di posto (risolto): l'escluso iniziale ora è a sorte.** Con A fisso, C vinceva il 42,8% delle partite (A 28,0%, B 29,3%; attesi 33,3%), anche con AI Facili (39,0%): C passava meno turni da escluso (3,85 contro 4,13 e 4,22). Con l'escluso iniziale a sorte, 900 partite: vittorie 34,0% / 32,8% / 33,2% e turni da escluso 4,05 / 4,05 / 4,09. Verificato con il default a sorte: AI Difficili 30,2% / 34,8% / 35,0% (900 partite, errore ±3%), AI Facili 34,2% / 32,8% / 33,0%.
12. **La fortuna dell'esclusione è molto calata con la rotazione a ogni turno**: lo stesso escluso due turni di fila nello 0,4% dei turni (prima 43,9%); correlazione punti personali ↔ turni da escluso −0,40 (prima −0,75). Resta una componente di fortuna (le Zapd fanno saltare il gettone).
13. **Il Fattore coppie è costante in media (33,3% per costruzione), ma la strategia lo sposta molto** (correzione di una mia lettura precedente, che lo dava per poco importante). Un giocatore "egoista" semplice (carta più alta per sé, carta-coppia più bassa possibile) fa **più punti personali (62,8 contro 54,0) ma un Fattore molto più basso (27,3% contro 36,3%)** e perde: punteggio 17,3 contro 19,7, vince il 20,9% delle partite contro due AI Difficili (attese 33,3%). Il dilemma "sacrificio contro egoismo" voluto dal design esiste, e l'ottimo è intermedio. Il vincitore individuale coincide con chi ha più punti personali nel 76% delle partite tra AI Difficili (57% quando al tavolo c'è un egoista semplice, che accumula personali ma perde).
14. **Poco margine per l'abilità** (tornei con posti alternati, Base 7): Difficile batte Media nel 39,7% delle partite (attesi 33,3%; 36,5–42,9%), +1,2 punti; Media batte Facile nel 47,4% (44,2–50,7%), +2,5.
15. **Sforo (Base 7)**: le AI Difficili sforano nel 28,6% dei turni (2,5 a partita in basso, 1,2 in alto), perché giocano carte basse per la coppia: lo sforo non toglie nulla ai loro punti personali. **Per gli umani che parlano e cooperano** (modello a coppia che si coordina): ~4% in basso e ~2% in alto, cioè circa 6% (con Base 10 era 4% e 0,2%: il massimo non contava mai). Senza coordinazione (ognuno tiene la carta più alta per sé): 32% in basso e 9% in alto. Dato vero solo dal playtest: contare le righe "SFORO" nella cronaca esportata.
16. **Carte per sé alte e per la coppia basse** nelle AI (10 la più giocata per sé, 1 per la coppia).
17. **Carte-effetto provate con le AI (Base 7).**
    - *Analisi forzata* (250 coppie di partite per carta): nessuna dà un vantaggio misurabile (Δ punteggio tra −0,11 e +0,46 con intervalli che includono 0; il più vicino è Reverse, +0,46 [−0,09 ; 1,01]).
    - *Uso reale* (400 partite, Difficile contro Difficile, a partita): i modificatori ±n si giocano 1,4 volte; di queste **0,40 salvano il range**, 0,60 erano inutili (la somma era già nel range: assicurazione) e 0,21 non bastano. Reverse 1,04, Prossima carta 1,05, Sincero 0,96, Scambio forzato 0,70. **Annulla: 1,45 pescate e solo 0,13 giocate (9%)**: è la carta morta.
    - *Con 0, 2 o 4 effetti in mano al massimo* (600 partite Difficile contro Media): sforo 32,2% → 30,1% → 29,9%; punti squadra 129 → 133 → 134; vantaggio del Difficile 0,51 → 0,89 → 0,87 punti. Gli effetti tolgono circa 2 punti percentuali di sforo e aggiungono pochissimo "abilità"; quattro slot non valgono più di due.
    - Conclusione: gli effetti spostano poco (circa un turno ogni tre partite viene salvato da un modificatore). Annulla manca di incentivo (già noto al punto 2).
18. **Le AI tradiscono pochissimo** (circa 1% delle dichiarazioni): il tradimento è una cosa da umani.

## Varianti provate solo in simulazione (non nell'app; motore: `xInSum`, `rangeOutside`, spenti di default)
*Prove chieste da Niky. Comando: `node tools/sim.js --rule xInSum=true --rule base=12` (e `--rule rangeOutside=true --rule base=3`).*
**Modelli di umano** = "coppia che parla" (il primo dichiara la carta che dà più possibilità al compagno, il secondo la sceglie per entrare nel range, anche sacrificando la sua carta migliore; l'escluso gioca alla cieca). 300 partite. **AI** = Difficile contro Difficile, 300 partite. Base 7 normale come riferimento: umani 6%, AI 28%.

**Caso 1 — la carta dell'escluso conta nella somma controllata dal range** (`xInSum`):
| Base | Sforo umani che parlano | di cui sopra / sotto | Escluso salva / rovina (a partita) | Sforo AI Difficili |
|---|---|---|---|---|
| 7 | 44% | 38% / 6% | 3,8 / 4,0 | 60% |
| 10 | 24% | 19% / 6% | 4,0 / 2,2 | 40% |
| 11 | 19% | 13% / 6% | 4,0 / 1,6 | 33% |
| 12 | 15% | 9% / 6% | 4,0 / 1,1 | 26% |
| 13 | 12% | 6% / 6% | 4,0 / 0,7 | 22% |
- Il fallimento si sposta da "in basso" a "in alto" (le tre carte superano il massimo). L'escluso diventa decisivo in circa metà dei turni (salva o rovina 5–6 volte a partita con Base 10).
- Con l'escluso alla cieca la sua carta è quasi un dado: serve decidere se sente la discussione.

**Caso 2 — la somma deve stare FUORI dal range [V, V+Base]** (`rangeOutside`):
| Base | Sforo umani che parlano | Sforo umani che NON coordinano | Sforo AI Difficili |
|---|---|---|---|
| 2 | 1,4% | 26% | 20% |
| 3 | 3,1% | 35% | 27% |
| 5 | 8,8% | 49% | 38% |
- Con la discussione la coppia sbaglia quasi mai (Base 3: 3%); senza coordinazione sbaglia moltissimo. Anche un compagno che gioca a caso rompe la coppia di rado (5% con Base 3, contro 21% del caso normale con Base 7): i tradimenti pesano poco.
- Con anche l'escluso nella somma (Base 3 / 5): umani 19% / 30%, l'escluso salva 5,0 / 6,6 volte a partita e rovina 1,3 / 0,4.

**Altro dato:** con Base 10 e range normale un primo giocatore con la carta giusta rende irrilevante la carta del compagno (sforo 0% se si coordinano e il compagno gioca a caso): la Base 10 normale è praticamente sempre soddisfacibile.

**Caso 1 con Base 12 — valutazione completa** (`node tools/eval-variant.js '{"xInSum":true,"base":12}' 400 "etichetta"`; AI Difficili, 400 partite; riferimento = regole attuali, Base 7):
| | Riferimento (Base 7) | Caso 1, Base 12 |
|---|---|---|
| Sforo AI Difficili | 29,8% (sotto 2,5 / sopra 1,3 a partita) | 26,6% (sotto 0,1 / **sopra 3,4**) |
| Sforo "umani che parlano" (modello) | 6% | 15% |
| Punti squadra a partita | 138 | 130 |
| Escluso salva / rovina la coppia | – | 2,3 / **3,35** a partita |
| Modificatori decisivi / inutili / non bastano | 0,43 / 0,57 / 0,28 | **0,13** / 0,74 / 0,47 |
| Dilemma: egoista semplice contro 2 Difficili | vince 17,7% (Fattore 27,4% contro 36,3%) | vince 18,6% (Fattore 27,4% contro 36,3%) |
| Livelli: Difficile contro Media / Media contro Facile | 40,8% / 47,5% | 40,8% / 45,8% |
| Vittorie per posto A/B/C | 31,5 / 36,8 / 31,8 | 36,5 / 35,0 / 28,5 (rumore: ±4,7%) |
- Il dilemma sacrificio contro egoismo **resta intatto** (stessi numeri). I livelli restano distinti.
- I modificatori **−n diventano quasi carte morte**: il fallimento è quasi sempre per eccesso e abbassare il minimo non serve.
- L'escluso AI **rovina più di quanto salvi** (3,35 contro 2,3 a partita): senza informazioni sulla somma delle due carte-coppia gioca per la sua quota. Con umani alla cieca (modello) salva 4,0 e rovina 1,1.

## Stato attuale delle regole (dopo il caso 1)
Base 12, la carta dell'escluso conta nella somma del range, escluso iniziale a sorte, l'escluso avanza a ogni turno e a ogni Zapd, ogni Zapd inverte il verso. Con queste regole (AI Difficili, 300 partite): sforo 27,8%, la carta dell'escluso salva 2,3 e rovina 3,5 turni a partita. Aperti: modificatori −n quasi inutili, escluso che ascolta ma non parla (da confermare), Annulla.

## Modificatori −n/+n: varianti provate solo in simulazione (regole attuali: Base 12, escluso nella somma)
*Parametri del motore, spenti di default: `modMode` (range | shift | widen), `modScale`, `modTiming` (blind | after), `modFlex`. AI Difficili, 400 partite.*
**Problema:** lo sforo è quasi sempre per eccesso (sopra 3,4 a partita, sotto 0,1); di quanto si supera il massimo: 1 punto 24%, 2 punti 23%, 3 punti 19%, 4 punti 14%, 5 punti 8%, 6 o più 12% (un −3 rimedia al 66%, un −4 al 79%, un −6 al 93%). I modificatori si giocano coperti, quindi chi li gioca non sa di quanto sfora: li usa come assicurazione.
| Versione | Modificatori giocati | Salvano la coppia | Dannosi | Sforo finale |
|---|---|---|---|---|
| Attuale (−n abbassa il minimo, +n alza il massimo; coperti) | 1,45 | 0,16 | – | 27,0% |
| Coperti, spostano la somma (±n) | 1,74 | 0,16 | 0,14 | 27,9% |
| Coperti, spostano la somma, valori ×2 | 1,98 | 0,27 | 0,37 | 29,7% |
| Coperti, allargano il range da entrambi i lati | 1,79 | 0,30 | – | 26,5% |
| **Dopo il reveal** (a somma nota), verso fisso | 0,31 | 0,32 | – | 25,2% |
| Dopo il reveal, verso fisso, valori ×2 | 0,46 | 0,45 | – | 24,0% |
| **Dopo il reveal, verso a scelta (±n)** | 0,60 | 0,59 | – | 22,9% |
| Dopo il reveal, ±n a scelta, ×1,5 (±1,5/3/4,5) | 0,70 | 0,69 | – | 21,8% |
| Dopo il reveal, ±n a scelta, ×2 (±2/4/6) | 0,86 | 0,87 | – | 20,3% |
- Giocati dopo il reveal, i modificatori diventano **decisivi ogni volta che si giocano** (con meno carte spese): è l'informazione che mancava. Il limite che resta è la disponibilità (si pescano solo da escluso e servono il verso e la taglia giusti): il verso a scelta quasi raddoppia i salvataggi.
- Se i modificatori si giocano dopo il reveal, **Sincero perde il suo scopo** (dichiarare un modificatore esatto) e va ripensato; Annulla non ha come bersaglio una carta giocata dopo.

## Variante range a perno (solo simulazione, `rangeMode:'pivot'`, `pivot`)

Idea di Niky: range = [perno−V, perno+V] invece di [V, V+Base]. Misure con 3 IA difficili, 400 partite.

| Variante | Sforo | Sotto / sopra per partita | Note |
|---|---|---|---|
| 2 carte, perno 9 | 14,4% | 1,39 / 0,43 | |
| 2 carte, perno 10 | ~17,5% | 1,95 / 0,30 | dilemma intatto (egoista 19,8% di vittorie), scala IA intatta |
| 2 carte, perno 11 | 21,6% | 2,6 / – | |
| 3 carte (escluso nella somma), perno 10 | 42,3% | sopra 5,4 | troppo duro |
| 3 carte, perno 14 | 22,7% | 0,94 / 1,99 | |
| 3 carte, perno 15 | 21,9% | 1,38 / 1,48 | equilibrato, scala IA intatta (difficile vs media 41%) |

- Gli sfori diventano a due lati: risolve il problema "non si sfora mai sotto".
- Difficoltà molto variabile con la carta centrale (2 carte, perno 10, coppia a caso): V1 27%, V2 43%, V3 57%, V4 69%, V5 79%, V6 87%, V7 93%, V8 97%, V9-10 ~100%. Con V≥8 (~30% dei turni) il range è quasi gratis.
- Modificatori ±n giocati alla cieca: con il perno diventano utili in entrambe le direzioni (decisivi 0,23/partita ×1, 0,34 ×2; "allarga ×2" 0,56), comunque modesti.

## Regole adottate (scelta di Niky): range a perno 15 + modificatori "allarga ×2"
- Range = [15−V, 15+V], con la carta dell'escluso nella somma. Modificatori ±1/±2/±3 (6 carte): allargano di 2n per lato, coperti, prima del reveal.
- Valutazione (hard×3, 300 partite): sforo 18,1% (sotto 1,11 / sopra 1,26 a partita), escluso salva 4,55 / rovina 0,68, modificatori decisivi 0,51 / inutili 0,88 / non bastano 0,12, posti 31,7/38,0/30,3%, egoista vince 19,1%, difficile vs media 38,9%, media vs facile 45,8%.
- Da osservare al playtest: turni con carta centrale 9–10 (range quasi sempre rispettato: 93–96%); Annulla ancora quasi mai giocata (0,08/partita); la direzione dei modificatori non esiste più (dichiarazioni "poco/medio/tanto").

## Annulla tolta dal mazzo (decisione di Niky)
Mazzo effetti ora 17 carte (copie di Annulla = 0; il codice resta, si può riattivare dal parametro).

## Turni a carta centrale alta (3 IA difficili, 300 partite, range perno 15)
| Carta centrale | Turni | In range | Margine medio sotto il massimo | Somma al limite (≤3 dal max) | Carta-coppia media | Carta-escluso media | Carta per sé media |
|---|---|---|---|---|---|---|---|
| 1–3 | 1076 | 58,1% | 3,1 | 35% | 4,04 | 7,05 | 6,82 |
| 4–7 | 1492 | 86,7% | 5,4 | 27% | 4,27 | 7,12 | 6,49 |
| 8–10 | 1115 | 98,2% | 8,5 | 11% | 4,31 | 7,28 | 6,38 |
Le IA giocano la stessa carta-coppia (~4,3) anche nei turni "gratis": non sfruttano il margine; resta da capire se è una debolezza dell'IA o se conviene davvero (i punti di coppia contano solo come quota nel Fattore).

## Variante "la carta dell'escluso decide il range" (solo simulazione, `rangeMode:'xcard'`)
Idea di Niky: dopo la carta centrale V, l'escluso gioca per primo (scoperta) la carta X; range = [V−X, V+X] (minimo 1); gli attivi giocano dopo; la carta dell'escluso conta ancora per i punti della coppia e per il suo Fattore; il range controlla la somma delle 2 carte-coppia.
Misure (hard×3, 200 partite): sforo 12,2% (sotto 0,15 / sopra 1,52 a partita), punti coppia 161, posti 29,0/35,5/35,5%, egoista vince 18,2%, difficile vs media 41,0%, media vs facile 50,7%, modificatori decisivi 0,96/partita.
Comportamento delle IA da escluso: giocano quasi sempre carte alte (X=8–10 in ~49% dei turni; X=1 solo ~7%); con X=1 la coppia sta comunque nel range il 62% delle volte (mano di 3 carte + coordinazione). La sabotatura quindi quasi non conviene (l'escluso guadagna quota con carte alte). Sotto si sfora quasi mai (1,2% dei turni).

## Variante "range = carta centrale + carta dell'escluso" (solo simulazione, `rangeMode:'xsum'`)
Range = [V, V+X], con X la carta giocata per prima (scoperta) dall'escluso; somma controllata = 2 carte-coppia; la carta dell'escluso conta come ora per punti coppia e Fattore.
Misure (hard×3, 200 partite): sforo 27,9% (sotto 2,10 / sopra 1,55 per partita: bilanciato), punti coppia 138, posti 25,0/38,0/37,0% (A basso: da ricontrollare con più partite), egoista vince 19,1%, difficile vs media 43,3%, media vs facile 52,0%, modificatori decisivi 1,43/partita.
L'escluso gioca ancora per lo più carte alte (X=8–10 ~37% dei turni, X=1 ~7%); con X=1 la coppia sta nel range il 48%.
- Controllo del posto A con 1000 partite (hard×3, seed sx0–sx999): xsum A 33,0% / B 32,6% / C 34,4%; perno 15 (regola attuale) A 35,9% / B 33,6% / C 30,5%. Il 25% visto con 200 partite era rumore.

## Variante "escluso dichiara e può tradire" (solo simulazione: `rangeMode:'xsum'`, `xHidden:true`, `traitor:true`)
Regole simulate: l'escluso DICHIARA un numero esatto, poi gioca coperto la carta X (si scopre al reveal; range V..V+X). (Prima versione, SBAGLIATA rispetto all'intenzione di Niky: la penalità scattava solo se mentiva E la coppia sforava; ora scatta sempre se gioca un numero diverso dal dichiarato.) Se la coppia sfora: il suo X vale 0 come oggi; se aveva mentito pesca una carta Traditore (mazzetto 1,2,2,3,3,4,5,6, senza reinserimento) e il valore si toglie ai suoi punti personali grezzi.
Misure (hard×3, 240 partite per riga; il posto A in "nolie" non mente mai, le IA mentono con una loro euristica di valore atteso):
| Penalità | Chi | Bugie/partita (totale) | Scoperte | Vittorie A/B/C | Punteggio A/B/C |
|---|---|---|---|---|---|
| 1–6 | tutti mentono | 7,67 | 1,56 | 34,2/30,4/35,4% | 17,60/17,74/18,37 |
| 1–6 | A onesto | 5,09 | 1,02 | 35,0/31,7/33,4% | 17,98/18,06/18,04 |
| ×2 (2–12) | A onesto | 4,48 | 0,90 | 38,8/32,5/28,7% | 18,20/17,43/17,52 |
Lettura: con la penalità 1–6 mentire è quasi neutro (circa 80% delle bugie non ha conseguenze perché la coppia resta nel range); con il doppio essere onesti inizia a convenire (+0,7 punti). Sforo ~30% (sotto 2,2 / sopra 1,7), poco diverso da X scoperta (27,9%). Limite: le IA hanno fiducia fissa (0,85), gli umani imparano a non fidarsi.

Correzione (penalità SEMPRE quando gioca un numero diverso dal dichiarato, sforo o no; mazzetto 1,2,2,3,3,4,5,6; hard×3, 240 partite): le bugie crollano a 0,18 a partita (circa 1,5% dei turni da escluso, 12 dichiarazioni oneste a partita); sforo 30,5% (sotto 2,0 / sopra 2,0); vittorie A/B/C 32,9/34,1/32,9%; con A onesto 35,8/32,5/31,6%. Con questa penalità nessuno mente: la dichiarazione dell'escluso diventa praticamente una dichiarazione vera.

### Ricerca del valore delle carte Traditore (hard×3, 200 partite per riga, tutti possono mentire; penalità sempre se il numero giocato ≠ dichiarato)
| Mazzetto Traditore | Media | Bugie a partita (su ~12 turni da escluso) | Penalità totale a partita | Sforo |
|---|---|---|---|---|
| 0,0,0,1,1,1,1,2 | 0,75 | 6,13 (circa 1 turno su 2) | 4,17 | 29,9% |
| **0,1,1,1,2,2,2,3** | **1,5** | **2,14 (circa 1 turno su 6)** | 3,32 | 30,9% |
| 1,1,2,2,2,3,3,4 | 2,25 | 0,63 (circa 1 turno su 19) | 1,48 | 30,2% |
| 1,2,2,3,3,4,5,6 | 3,4 | 0,18 (circa 1 turno su 67) | 0,65 | 30,5% |
Per far mentire ogni tanto (1 turno su 5–6) il mazzetto 0,1,1,1,2,2,2,3 è il candidato. Lo 0 dà il caso "ti è andata bene" voluto da Niky.

## Decisioni di Niky sul mazzetto Traditore (non ancora nell'app)
Mazzetto da 12 carte (0,0,1,1,1,1,2,2,2,2,3,3), penalità sempre quando il numero giocato ≠ dichiarato; finito il mazzetto, ogni nuovo tradimento costa 3.

## Il principio "non tirare la corda" è vero? (hard ×2 contro un giocatore A estremo, 200 partite, regole attuali)
| A gioca | Vince | Personali | Fattore | Punteggio |
|---|---|---|---|---|
| sempre le carte più alte (coppia = la più alta, sé = la seconda) | 10,0% | 31,6 | 38% | 12,27 |
| coppia = la più bassa, sé = la più alta (egoista) | 14,5% | 67,0 | 25% | 16,65 |
| equilibrato (IA difficile) | ~33% | ~58 | ~33% | ~18 |
Entrambi gli estremi perdono molto: il gioco punisce sia chi spreme la coppia sia chi spreme sé stesso.

## Carta "Cambio centrale" (simulazione; `effectCopies.cambio`, 0 di default)
Istantanea, dopo che l'escluso ha giocato la sua carta: un attivo mette una carta della sua mano al posto della centrale e PRENDE IN MANO la vecchia centrale (la mano resta di 3). Il range diventa [V nuova, V nuova + X].
Misure (hard×3, mazzo effetti senza Sincero/Scambio forzato; 3 copie di Cambio contro 0):
| Versione | Copie | Sforo | Sotto / sopra | Punti coppia | Cambi a partita | Sforo nei turni con cambio vs senza |
|---|---|---|---|---|---|---|
| X scoperta (200 partite) | 0 | 26,4% | 2,03 / 1,38 | 142,4 | – | – |
| X scoperta | 3 | 28,5% | 1,57 / 2,09 | 139,1 | 1,79 | 36% vs 28% |
| X coperta + Traditore (160 partite) | 0 | 28,4% | 1,84 / 1,87 | 139,2 | – | – |
| X coperta + Traditore | 3 | 32,4% | 1,60 / 2,60 | 132,6 | 1,83 | 39% vs 31% |
Lettura: l'IA usa il Cambio soprattutto per prendersi una centrale alta e mettere una carta bassa (la finestra scende, si sfora più spesso verso l'alto): peggiora la coppia e fa un favore a chi lo gioca. Non aiuta a "centrare" il range.
Variante "la vecchia centrale si SCARTA" (`cambioDiscard:true`; la mano di chi gioca la carta scende a 2): X scoperta (200 partite): sforo 25,6% (sotto 1,47 / sopra 1,77), punti coppia 141,9, 1,72 cambi/partita, sforo nei turni con cambio 23% vs 26% senza. X coperta + Traditore (160 partite): sforo 29,9% (sotto 1,51 / sopra 2,30), punti coppia 134,0, 1,81 cambi/partita, sforo 30% con cambio vs 30% senza. Quindi con scarto la carta è quasi neutra (aiuta un po' a X scoperta, nulla a X coperta), a differenza della versione "in mano" che peggiora lo sforo di 2–4 punti.

## Carta "Baratto" (simulazione; `effectCopies.baratto`, 0 di default)
Istantanea, dopo che l'escluso ha giocato: un attivo pesca alla cieca una delle carte rimaste in mano all'escluso e gliene dà una sua a scelta (coperta). 3 copie (mazzo effetti senza Sincero/Scambio forzato/Cambio):
| Versione | Sforo | Sotto / sopra | Punti coppia | Usi a partita | Punteggio di chi lo gioca − media degli altri |
|---|---|---|---|---|---|
| X scoperta, 200 partite (senza carta: 26,4%, 142,4) | 27,7% | 2,06 / 1,55 | 139,6 | 1,82 | +0,41 |
| X coperta + Traditore, 160 partite (senza carta: 28,4%, 139,2) | 31,5% | 2,08 / 1,93 | 132,8 | 1,93 | +0,20 |
Lettura: l'effetto è quasi neutro per chi lo gioca (+0,2/+0,4 su ~18 punti, nel rumore) e peggiora un po' i risultati della coppia (sforo +1/+3 punti): rimescolare le mani disturba la coordinazione. Come "riparare una mano scarsa" funziona poco con le IA.
Baratto CON VISTA (`barattoSee:true`: l'escluso mostra le carte rimaste e chi gioca la carta sceglie quale prendere): X scoperta (200 partite): sforo 27,6%, punti coppia 139,3, 1,78 usi/partita, chi lo gioca fa +1,08 rispetto alla media degli altri; X coperta + Traditore (160 partite): sforo 30,4%, punti coppia 134,7, 1,83 usi/partita, vantaggio +0,88. (Alla cieca: +0,41 / +0,20.) Quindi vedere la mano rende la carta chiaramente utile (circa +5% di punteggio per chi la gioca) senza peggiorare lo sforo rispetto alla versione alla cieca.

## Carta "Lente" (simulazione, solo X coperta; `effectCopies.lente`, 0 di default)
Istantanea, dopo che l'escluso ha messo la sua carta coperta: chi la gioca la guarda di nascosto ma in quel turno non fa dichiarazioni. hard×3, 160 partite, traitor 0,1,1,1,2,2,2,3 (senza carta: sforo 28,4%, punti coppia 139,2):
| Mazzo effetti (oltre a Reverse 3, Prossima 3, ±n 6) | Sforo | Sotto / sopra | Punti coppia | Lente a partita | Bugie smascherate | Vantaggio di chi la gioca |
|---|---|---|---|---|---|---|
| Lente 3 | 31,6% | 2,03 / 2,06 | 132,2 | 1,00 | 0,33 a partita | −0,10 |
| Lente 3 + Baratto 2 (vista) | 30,7% | 1,88 / 2,08 | 135,8 | 1,03 | 0,40 a partita | −0,21 |
Lettura: vedere la carta dell'escluso non compensa il costo di non poter parlare (la coppia si coordina peggio: sforo +2/+3 punti); un uso su tre smaschera davvero una bugia. Vantaggio personale nullo o leggermente negativo.

## Valutazione finale delle regole implementate (regolamento v0.2; hard×3, 300 partite)
Sforo 32,1% (sotto 1,96 / sopra 1,98), punti coppia 133,5, posti A/B/C 30,3/32,3/37,3%, modificatori decisivi 1,13 / inutili 0,97 / non bastano 0,19 a partita, tradimenti dichiarati 1,3%. Dilemma: egoista semplice vince il 9,7% (Fattore 25,8% contro 37,1%). Livelli: difficile vs 2 medie 44,4% (39,9–49,1%, +2,18 punti), media vs 2 facili 55,3% (50,7–59,9%, +3,86). Da rivedere al playtest: equilibrio fra le 4 regole di colore (Luce toglie il bluff all'escluso), colore delle carte numeriche senza ruolo, posto C leggermente avvantaggiato (37%).

## Regole di colore con attivazione (la regola vale solo se la carta centrale ha il colore dominante) — hard×3, 300 partite
Sforo 31,7% (sotto 1,91 / sopra 1,98), punti coppia 133,6, posti A/B/C 28,0/38,3/33,7% (rumore: 300 partite), modificatori decisivi 1,30 / inutili 1,43 / non bastano 0,25, egoista vince 10,3% (Fattore 25,9% contro 37,1%), difficile vs 2 medie 44,7% (40,1–49,3%, +1,90), media vs 2 facili 53,3% (48,7–57,9%, +4,00). La regola attiva circa 1 turno su 4 (parametro `colorTrigger`, true di default).

## Le 4 regole di colore, una per una (regola SEMPRE attiva, hard×3, 200 partite; "abilità" = vittorie di un Difficile contro 2 Medie, 200 partite, atteso 33,3%)
| Regola | Sforo | Sotto / sopra | Punti coppia | Bugie dell'escluso a partita | Punti Traditore persi | Effetti giocati | Modificatori decisivi | Abilità |
|---|---|---|---|---|---|---|---|---|
| Nessuna (turno normale) | 30,9% | 1,74 / 2,08 | 136 | 2,36 | 3,50 | 8,09 | 1,32 | 48,5% |
| Silenzio | 33,4% | 2,28 / 1,83 | 134 | 0 | 0 | 8,07 | 0,93 | 42,0% |
| Giuramento | 30,0% | 1,89 / 1,80 | 138 | 0,21 | 0,60 | 7,95 | 1,42 | 49,5% |
| Luce | 27,2% | 1,94 / 1,42 | 143 | 0 | 0 | 7,33 | 1,79 | 48,0% |
| Effetti vietati | 45,3% | 2,06 / 3,54 | 106 | 2,07 | 2,94 | 0 | 0 | 44,8% |
Lettura: Effetti vietati è di gran lunga la più pesante (sforo +14 punti, punti coppia −30: i modificatori sono la rete di sicurezza); Luce è la più facile; Silenzio peggiora la coordinazione e premia meno l'abilità; Giuramento per le IA è quasi invisibile (non mentono più: 0,21 bugie a partita). Con la regola attiva circa 1 turno su 4 gli effetti si diluiscono.
Correzione (deciso da Niky): **Effetti vietati lascia giocare i modificatori ±n** (vieta solo Reverse, Prossima carta e Baratto). Misura (sempre attiva, hard×3, 200 partite): sforo 33,2% (era 45,3%), sotto/sopra 1,94 / 2,17, punti coppia 132 (erano 106), bugie 2,44, modificatori decisivi 1,09, abilità 47,5%. Ora è paragonabile a Silenzio.

## Giuramento tolto, al suo posto CARNEVALE (Blu) — mentire è gratis (nessuna carta Traditore in quel turno)
Misura (sempre attiva, hard×3, 200 partite; stesso formato della tabella delle 4 regole): sforo 30,5% (sotto 1,72 / sopra 2,04), punti coppia 138, bugie dell'escluso 10,45 a partita (quasi ogni turno da escluso: gratis conviene), nessun punto Traditore, modificatori decisivi 1,23, abilità (difficile vs 2 medie) 42,5%. Gli attivi (IA) si fidano di meno della dichiarazione (fiducia ×0,35). Come il Silenzio, premia meno l'abilità, ma la dichiarazione c'è e si può leggere.
Regole di colore ora: Rosso Silenzio, Blu Carnevale, Verde Luce, Giallo Effetti vietati (solo Reverse, Prossima carta e Baratto).

## Punteggio a PODIO (scoring:'podio', default): 3/2/1 per coppia, quota = somma dei tre podi, punteggio = personali × quota
Misure (hard×3, 300 partite): sforo 31,2%, punti coppia 133,9, modificatori decisivi 1,31; difficile vs 2 medie 45,6% (41,0–50,2), media vs 2 facili 56,0% (51,4–60,5); egoista semplice 15,2%; estremi (200 partite, un giocatore estremo contro 2 difficili): sempre le carte più alte 12,5%, coppia bassa + sé alto 5,8%. Stesso vincitore della formula a % nel 78% delle partite (prova su 200). Posti A/B/C 25,2/41,6/33,2% su 300 partite: da ricontrollare con più partite.
Controllo dei posti con il podio su 1000 partite (hard×3): A 31,3% / B 33,1% / C 35,6%: il 41,6% di B su 300 partite era rumore.

## Podio: pari merito = vince chi ha messo MENO CARTE (deciso da Niky); foglio punti stampabile
Il motore conta anche il numero di carte messe in ogni coppia (contribN); a pari punti vale chi ne ha messe meno; se anche le carte sono uguali si divide. `foglio-punti.html` (2 facciate A4 da compilare + 2 di esempio già compilato, link dalla schermata iniziale) guida la conta passo per passo.

## 1 Zapd per colore + Cromozapd (5 Zapd in tutto, deciso da Niky dopo aver visto che con 13 ne usciva ~1 a turno)
Frequenza (100 partite, media): 13 Zapd → 0,94 a turno, 50% delle partite con almeno 4 turni di fila con Zapd; 9 Zapd → 0,67, 29%; 5 Zapd → 0,41, 1%. La durata resta ~11–12 turni (la partita finisce quando esce l'ultima Zapd, sempre verso la fine del mazzo): con 5 Zapd la durata media è 11,1 turni ma più variabile (5%: ≤7 turni; minimo 3; massimo 13).
Misure (hard×3, 300 partite): sforo 31,5%, punti coppia 121,7, posti A/B/C 36,1/32,1/31,8%, modificatori decisivi 1,22, egoista semplice 10,9%, difficile vs 2 medie 39,1% (34,7–43,7), media vs 2 facili 50,9% (46,3–55,5). L'IA stima i turni che restano dalle carte rimaste nel mazzo (non più dalle Zapd mancanti).
