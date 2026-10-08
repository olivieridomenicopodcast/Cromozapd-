# Da ricordare — punti di bilanciamento aperti

*Da NON decidere ora: li riprendiamo col simulatore e coi playtest. Ricordarli a Niky a ogni tappa importante.*

1. **Modificatori ±1/2/3**: sono solo vantaggi (allargano il range), senza costo d'uso a parte occupare uno dei 2 posti in mano. Misurare se vengono giocati sempre.
2. **Annulla**: manca ancora un incentivo chiaro a usarlo (soprattutto contro il compagno). Analizzarlo con l'analisi "forzata" degli effetti.
3. **Immunità del colore dominante**: con carte scelte a caso vale circa il 6% dei turni. Misurare quanto la cercano le AI e quanto pesa.
4. **Base**: ora **7** (deciso da Niky). Da riverificare nei playtest: con umani che cooperano lo sforo era ~6% (4% in basso, 2% in alto); controllare che la tensione sia quella voluta.
5. **Escluso "sempre a metà"**: possibile correttivo (peso diverso dei contributi da escluso, bonus sopra soglia).
6. **Ruolo dei colori** oltre al colore dominante (e della carta centrale): non esplorato.
7. **Numero di copie** di ogni carta-effetto: valori di partenza provvisori (20 carte).
8. **Rapporto punti personali / Fattore coppie**: validare che la "campana" regga davvero.
9. **Margine del mazzo**: con "Prossima carta" si consumano carte in più; il fuzz controlla che il mazzo regga (finora sì).
10. **Zapd quasi ogni turno** (circa 0,78 a turno): l'escluso cambia spesso e a volte di due posti; è voluto?

## Cosa hanno mostrato le simulazioni (regole attuali: **Base 7**, l'escluso avanza a ogni turno, ogni Zapd inverte il verso; Difficile contro Difficile, 400 partite)
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
