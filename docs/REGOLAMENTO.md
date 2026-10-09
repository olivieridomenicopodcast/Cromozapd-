# CROMOZAPD — Regolamento (versione playtest 0.2)

*Questo è il regolamento come è giocato nell'app. Riprende il Design Doc v2 e la bozza Carte Effetto e li completa dove erano ambigui o incompleti: le parti nuove o chiarite sono segnate con **[chiarito]** (deciso con te) o **[interpretazione]** (scelta mia, da confermare al playtest). I valori dei parametri sono in §13 e si cambiano dall'app (Varianti di regole).*

> *Concept: "un gioco a squadre che si gioca singoli, in coppie da tre".*

## 1. In breve
**Esattamente 3 giocatori**: A, B, C (nell'ordine in cui siedono, in senso orario). Ogni turno due giocatori sono **attivi** e formano una **coppia**; il terzo è l'**escluso**. Le coppie possibili sono **AB, BC, AC**.
La partita finisce quando esce l'ultima delle 13 carte **Zapd** (12 colorate + la **Cromozapd**): si gioca l'ultima mano, poi si conta.
Si vince **due volte**: **vincitore di coppia** (la coppia con più punti squadra) e **vincitore individuale** (punti personali × quota a podio).
**Il senso del gioco:** la carta per sé è sempre tua, ma ogni punto che togli alla coppia ti fa scendere sul podio e abbassa la tua quota; una coppia che sfora fa 0. Giocare sempre carte alte non conviene, e nemmeno pensare solo a sé stessi (§11).

## 2. Componenti
- **Mazzo principale: 93 carte** = 80 numeriche (4 colori × 2 scale da 1 a 10) + **12 carte Zapd** colorate (3 per colore) + **la Cromozapd** (in tutto 13 carte Zapd). I 4 colori sono Rosso, Blu, Verde, Giallo **[interpretazione: nomi provvisori]**. Il **colore della carta centrale** serve ad attivare la regola di colore (§7); per il resto il colore delle carte numeriche non conta.
- **Mazzetto Effetti**, separato, solo funzione (nessun valore numerico): vedi §9. **15 carte**.
- **Mazzetto Traditore**: 12 carte con un valore da 0 a 3 (0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3), vedi §5.
- **Carta centrale**: la carta numerica scoperta che definisce il range del turno.
- **Gettone escluso** (uno solo) e **carte identità** con la freccia del verso di rotazione. Nell'app sono mostrati sul tavolo.
- **Colore dominante**: il colore dell'ultima Zapd; dice **quale regola** è in vigore (§7), che si attiva solo quando la carta centrale è di quel colore.

## 3. Preparazione
1. Si mescola il mazzo e si pesca finché esce la **prima Zapd colorata**: il suo colore è il **colore dominante di partenza**. Poi si rimescola tutto (Zapd comprese).
2. Ognuno riceve 3 carte numeriche. L'**escluso iniziale è estratto a sorte** **[chiarito]** (nell'app dal seed, quindi riproducibile) e il verso di rotazione parte **orario** (A→B→C) **[interpretazione]**.
3. Il Mazzetto Effetti e il Mazzetto Traditore sono mescolati; nessuno parte con carte-effetto.
4. Se durante la distribuzione esce una Zapd si risolve come sempre (§6) e si ripesca **[interpretazione]**.

## 4. Il turno
0. **Rotazione.** Dal 2° turno il gettone escluso avanza di un posto (§6).
1. **Pesca.** Chi ha meno di 3 carte numeriche pesca fino a 3 (di norma attivo +2, escluso +1; in ordine A, B, C). Poi si rivela la **carta centrale** (la prossima numerica; se c'è una "Prossima carta" giocata il turno prima, è quella). **[chiarito]** Se esce una Zapd la si risolve subito (§6) e si **ripesca** finché la mano è di 3 carte (o finché esce una numerica, per la centrale). Se esce la Cromozapd, a pesca finita se ne applica l'effetto (§6). I ruoli del turno e la **regola attiva** (§7: serve che la carta centrale abbia il colore dominante) si fissano a pesca finita.
2. **L'escluso fa la sua mossa** **[chiarito: idea di Niky]**. La carta che gioca, la **X**, decide il range del turno (§5). Di norma **dichiara un numero esatto** (può mentire, §5) e mette la X **coperta**; se è attiva la regola **Luce** la gioca per prima, **scoperta**; se è attiva **Silenzio** non dichiara nulla.
3. **Effetti istantanei**: chi ha un **Baratto** può giocarlo ora (§9).
4. **Discussione di coppia.** Solo i due attivi; l'escluso non partecipa. Nell'app ogni attivo può fare una **dichiarazione** al compagno: un numero (la carta che dice di giocare per la coppia) oppure "Niente"; ed eventualmente un'indicazione **vaga** sul proprio modificatore (§9). Il tradimento tra attivi è libero e senza penalità: puoi giocare altro da ciò che hai dichiarato. Tutto finisce nella cronaca. Con **Silenzio** attivo nessuno dichiara. Nell'hotseat si parla anche a voce.
5. **Gioco coperto.** Ogni attivo gioca, in quest'ordine: **carta per la coppia**, **carta per sé**, ed eventualmente una **carta-effetto in fila** (3ª; con **Effetti vietati** attivo solo i modificatori).
6. **Reveal.** Si scoprono le carte coperte degli attivi **e la X dell'escluso**.
7. **Risoluzione**: effetti in fila (Reverse, Prossima carta, modificatori), range e punti (§5), eventuale carta Traditore, poi, solo per l'escluso, la scelta di **pescare una carta-effetto** (§9).

Il turno in cui esce la **13ª Zapd** (l'ultima, qualunque sia) è l'ultimo: si gioca per intero e si conta.

## 5. Range, punti e carte Traditore
- **Range = carta centrale + carta dell'escluso** **[chiarito: idea di Niky, scelta dopo le simulazioni]**: va da *V* a *V + X*, dove *V* è il valore della carta centrale e *X* il valore della carta giocata dall'escluso. Esempio: centrale 6, l'escluso gioca 7 → range **6–13**. Gli estremi **sono inclusi**.
- Si controlla la **somma delle due carte-per-la-coppia degli attivi**. Si può sforare **sia sopra sia sotto**.
- **L'escluso decide la difficoltà**: una carta alta allarga il range (aiuta la coppia), una carta bassa lo stringe (le mette i bastoni tra le ruote). Ha solo le carte che ha in mano, quindi a volte è costretto ad aiutare (o a ostacolare) contro la sua volontà.
- **Nel range** → la coppia incassa **la somma delle due carte-coppia + la carta dell'escluso**; la carta dell'escluso conta nei punti che lui mette in quella coppia, cioè nel suo podio (non nei suoi punti personali).
- **Fuori range (sforo, sopra o sotto)** → la coppia incassa **0**. La carta dell'escluso vale 0 per la coppia e **non conta nei punti che nessuno mette in quella coppia**. Nessun vantaggio dallo sforo per l'escluso.
- **Niente immunità di colore** **[chiarito]**: il colore delle carte non salva dallo sforo.
- La **carta per sé** vale sempre il suo valore, anche se la coppia sfora.
- **L'escluso dichiara e può tradire** **[chiarito]**: prima di mettere la X coperta dichiara un **numero esatto**. Al reveal, se la carta giocata ha un **valore diverso** da quello dichiarato (sforo o no), **pesca una carta Traditore** (nessuna con **Carnevale** attivo): il suo valore (0–3) si **toglie ai punti personali grezzi**, e la carta resta scoperta davanti a lui per tutta la partita. Se la coppia sfora per colpa degli attivi e l'escluso era stato onesto, non succede nulla. Finito il mazzetto Traditore (12 carte), **ogni nuovo tradimento costa 3** punti personali.

## 6. Escluso, verso, Zapd e Cromozapd
- **Rotazione a ogni turno [chiarito]**: il gettone escluso **avanza di un posto a ogni nuovo turno** (dal 2° turno; nel 1° l'escluso è quello estratto a sorte), nel verso di rotazione. **Poi**, se durante la pesca escono Zapd, avanza **ancora** di un posto per ogni Zapd. Quindi nello stesso turno può avanzare di 1, 2, 3… posti.
- Quando una Zapd colorata viene **pescata** (da rimpiazzo, carta centrale o distribuzione) si **risolve subito**: il suo colore diventa il **nuovo colore dominante** (e quindi cambia la regola in vigore) e il **gettone escluso avanza di un altro posto nel verso di rotazione** (oltre alla rotazione del turno) **e poi il verso di rotazione si inverte** [chiarito]; l'ordine "prima avanza, poi inverte" è un'**[interpretazione]**. La Zapd va da parte, scoperta (serve a stimare quanto manca).
- Se in un turno escono più Zapd, ognuna si risolve in ordine, ognuna con il verso che c'è in quel momento.
- **Zapd da "Prossima carta"** **[chiarito]**: si risolve subito ma colore ed escluso valgono **dal turno dopo**; la partita finisce comunque se era l'ultima.
- **Cromozapd** (la 13ª Zapd, una sola) **[chiarito: idea di Niky]**: sposta il gettone e inverte il verso come le altre Zapd, **non cambia il colore da sola**. A pesca finita **tutti passano la propria mano di carte numeriche al giocatore successivo** (nel verso di rotazione già invertito; le carte-effetto restano a chi le ha) e **chi l'ha pescata sceglie il colore dominante**, cioè quale regola è in vigore. Se esce come **carta centrale** sceglie chi la scopre (chi era escluso nel turno precedente); se esce da "Prossima carta" sceglie chi ha giocato l'effetto, dal turno dopo.
- **Fine partita**: finisce al termine del turno in cui è uscita l'**ultima Zapd** (tutte e 13 sono nel mazzo).
- Se il mazzo finisse, si rimescolano gli scarti numerici **[interpretazione]**.

## 7. Le regole di colore
- Il **colore dominante** (quello dell'ultima Zapd, o scelto con la Cromozapd) dice **quale regola è in vigore** fino alla prossima Zapd **[chiarito: era l'idea di Niky fin dall'inizio]**.
- La regola però **si attiva solo nei turni in cui la carta centrale è di quel colore**. Negli altri turni non c'è nessuna regola e si gioca il turno normale (l'escluso dichiara, gioca coperta, ecc.). Con 4 colori succede circa 1 turno su 4.
- Il colore delle carte serve anche a ricordare, a colpo d'occhio, quale Zapd è in vigore.

| Colore | Regola | Cosa cambia (quando è attiva) |
|---|---|---|
| Rosso | **Silenzio** | L'escluso non dichiara e gli attivi non fanno dichiarazioni. La X resta coperta fino al reveal: nessuno può tradire, nessuno può fidarsi. |
| Blu | **Carnevale** | Come il turno normale, ma **mentire è gratis**: l'escluso può giocare un numero diverso da quello dichiarato senza pescare carte Traditore. La dichiarazione non vale niente. |
| Verde | **Luce** | L'escluso gioca per primo la sua X, **scoperta**: il range è noto prima della discussione e nessuno può mentire. |
| Giallo | **Effetti vietati** | In questo turno nessuno gioca **Reverse, Prossima carta e Baratto**; i **modificatori ±n si possono giocare**. L'escluso pesca comunque a fine turno. |

## 8. Punteggio finale
- **Punti squadra** di ogni coppia = somma dei punti incassati (§5). **Vincitore di coppia**: la coppia con più punti squadra.
- **Punti personali grezzi** = somma delle **carte per sé** giocate da attivo, **meno le carte Traditore** pescate.
- **Il podio di ogni coppia** **[chiarito: idea di Niky, provata in simulazione]**: nelle carte messe in una coppia (le carte-coppia dei due attivi e la carta dell'escluso, solo nei turni in cui la coppia ha incassato) si somma il **valore** delle carte di ciascun giocatore. Chi ha messo di più prende **3** punti di podio, il secondo **2**, l'ultimo **1**. A **pari merito** si divide (due primi a pari prendono 2,5 ciascuno e l'ultimo 1; tutti e tre pari prendono 2 a testa). Se una coppia non ha mai incassato, vale **2 a testa**.
- **Quota** = somma dei tre podi (le tre coppie: AB, BC, AC), da 3 a 9; la media è 6.
- **Punteggio individuale = punti personali grezzi × quota.** Non servono divisioni: solo somme, confronti tra tre mucchietti e una moltiplicazione.
- **Vincitore individuale**: chi ha il punteggio più alto. In caso di parità si dichiara **pareggio** **[interpretazione]**.
- *Vecchia regola (ancora nel codice, parametro "Punteggio")*: Fattore coppie = media delle quote % nei punti delle tre coppie; punteggio = personali × Fattore.

### Conta al tavolo, passo per passo
1. Ogni coppia ha una zona con 3 posti (A, B, C): quando la coppia incassa, ognuno mette le sue carte nel proprio posto. Se sfora, le carte vanno negli scarti.
2. A fine partita, in ogni zona sommi i **valori** delle carte di ogni posto.
3. In ogni zona assegni il podio: 3 al posto con più punti, 2 al secondo, 1 all'ultimo (pari merito: si divide).
4. Sommi i tre podi di ciascuno: è la tua quota.
5. Sommi le tue carte per sé, togli le carte Traditore e moltiplichi per la quota.

## 9. Mazzetto Effetti (15 carte)
Solo l'**escluso** può pescare una carta-effetto, **per scelta**, a fine del suo turno da escluso. Non può giocarne in quel turno. **Massimo 2 carte-effetto in mano.** Gli effetti in fila si giocano da **attivo**, in 3ª posizione; il Baratto è istantaneo. Si gioca **al massimo una carta-effetto in fila per turno** **[interpretazione]**. Tutti gli effetti sono rivelati nel reveal; gli scarti non tornano in gioco. Con **Effetti vietati** attivo non si giocano Reverse, Prossima carta e Baratto (i modificatori sì).

| Carta | Quando | Cosa fa |
|---|---|---|
| **Reverse** (3) | in fila | Inverte il verso di rotazione: da quel momento l'escluso avanza nell'altra direzione (a ogni turno e a ogni Zapd; ogni Zapd lo inverte di nuovo). Due Reverse nello stesso turno si annullano. |
| **Prossima carta** (3) | in fila | La carta in cima al mazzo viene scoperta e messa da parte: sarà la **carta centrale del turno dopo**. Una seconda "Prossima carta" nello stesso turno non ha effetto **[interpretazione]**. |
| **±1 / ±2 / ±3** (6 carte: 2 per ogni valore) | in fila | **Allargano** il range di questo turno di **n × 2** da entrambi i lati (±1 → minimo −2 e massimo +2; ±2 → ±4; ±3 → ±6) **[chiarito]**. Si giocano coperti, prima del reveal. Più modificatori nello stesso turno si sommano. |
| **Baratto** (3) | istantanea, dopo la mossa dell'escluso | L'escluso ti **mostra la mano che gli è rimasta** (solo a te): scegli una carta da prendere e gli dai in cambio una carta a tua scelta, coperta **[chiarito]**. |

**Vaghezza.** Sui **modificatori** non si dicono numeri precisi nelle dichiarazioni: solo "poco / medio / tanto" (la direzione non conta, perché il modificatore allarga da entrambi i lati). Sulla carta-per-la-coppia numerica si possono invece dire numeri precisi.

*Carte tolte nei playtest* **[chiarito]**: Sincero, Scambio forzato, Annulla (quasi mai giocata), Cambio centrale e Lente (provate in simulazione e scartate). Restano nel codice a 0 copie.

## 10. Cosa vede l'app e modalità
Sempre sul tavolo: carta centrale e range del turno, colore dominante e regola in vigore, escluso e verso, Zapd uscite (su 13), punti squadra delle 3 coppie, punti personali, podio nelle 3 coppie e quota di ognuno, carte Traditore, effetti in mano propri. Ogni evento ha un messaggio che spiega **cosa fa e perché**.
Ogni posto (A, B, C) è un **umano** o un'**AI** (facile, media, difficile). Si può giocare tu + 2 AI, 2 umani + 1 AI (hotseat con schermata di passaggio), 3 umani (hotseat) o 3 AI da guardare. Nel simulatore il profilo A occupa un posto che ruota e gli altri due hanno il profilo B.

## 11. Non tirare la corda (il senso del gioco)
Il punteggio è **personali × quota a podio**: due numeri che si muovono in direzioni opposte.
- **Spremere la coppia** (carte alte per la coppia) fa sforare: una coppia che sfora fa 0 e butta le tue carte migliori.
- **Spremere sé stessi** (carte basse per la coppia, alte per sé) alza i personali ma ti fa scendere sul podio delle coppie, quindi fa crollare la tua quota.

*Esempio.* Carta centrale 4, l'escluso gioca un 3: range 4–7. A ha in mano 9, 8, 3 e B ha 7, 6, 2.
- Se A gioca il 9 per la coppia e l'8 per sé e B il 7: somma 16 > 7, **sforo**. A ha fatto 8 punti personali, ma la coppia fa 0 e la sua quota non cresce.
- Se invece A gioca il 3 per la coppia e il 9 per sé, B il 2 per la coppia e il 7 per sé: somma 5, **nel range**. La coppia incassa 3 + 2 + 3 (la carta dell'escluso) = 8, e A ha comunque +9 personali.

*Misure* (3 IA difficili, 200 partite, punteggio a podio): vedi §14 e docs/DA_RICORDARE.md.

## 12. Non ancora definito
- Quanto spesso si attiva una regola di colore (circa 1 turno su 4) e se le 4 regole sono equilibrate: da vedere al playtest.
- Sforo ~30% con le AI, posti equilibrati; da riverificare con i playtest umani. Le AI da escluso giocano per lo più carte alte e mentono poco con questo mazzetto Traditore (circa 1 turno da escluso su 6): da vedere se gli umani ostacolano o mentono di più.
- I modificatori ±n (allargano ×2) sono decisivi circa 1,3 volte a partita: da osservare al playtest.
- Numero definitivo di copie di ogni effetto e valori del mazzetto Traditore.

## 13. Parametri (valori di partenza)
| Parametro | Valore |
|---|---|
| Range | **da V a V + X** |
| Modificatori ±n: allargano il range di n × | **2** |
| Escluso iniziale | **a sorte** |
| Carte in mano | **3** |
| Effetti in mano al massimo | **2** |
| Zapd per colore | **3** |
| Punteggio | **podio** (3/2/1 per coppia, quota = somma dei tre podi) |
| Cromozapd (13ª Zapd) | **sì** |
| Colore dominante = regola in vigore | **sì** |
| La regola si attiva solo se la carta centrale ha il colore dominante | **sì** |
| Immunità del colore dominante | **no** |
| Carte nel mazzetto Traditore | **12** |
| Valore di ogni Traditore dopo il mazzetto | **3** |
| Baratto: chi lo gioca vede la mano dell'escluso | **sì** |
| Copie di Reverse | **3** |
| Copie di Prossima carta | **3** |
| Copie di Baratto | **3** |
| Copie di ogni ±1/2/3 | **2** |
| L'escluso avanza a ogni turno | **sì** |
| Ogni Zapd inverte il verso | **sì** |

## Appendice: cosa è cambiato rispetto al Design Doc v2 e alla bozza Carte Effetto
| Punto | Originale | Qui |
|---|---|---|
| Modificatore-base (#1) | Carta a sé, in conflitto con la famiglia ±1/2/3 | Assorbito nella famiglia ±1/2/3; niente numeriche con effetto, niente "base = 13" sulla centrale |
| Zapd da rimpiazzo | Non specificato | Si risolve e si ripesca fino a 3 carte |
| Zapd da "Prossima carta" | Non specificato | Effetti dal turno dopo |
| Verso di rotazione | Cambiava solo con Reverse | **Cambia anche a ogni Zapd** (voluto da Niky) |
| Rotazione dell'escluso | Solo alle Zapd (lettura letterale del Design Doc) | **A ogni turno e a ogni Zapd** (voluto da Niky) |
| Carta dell'escluso | Ambigua con lo sforo | **Decide il range** (X): dichiarata e giocata coperta, scoperta al reveal; conta per i punti della coppia e per il suo podio; 0 se la coppia sfora (voluto da Niky) |
| Range | V … V + Base | **V … V + X** (X = carta dell'escluso) |
| Tradimento | Libero e senza effetti | L'escluso che gioca un numero diverso da quello dichiarato pesca una **carta Traditore** (toglie 0–3 punti personali) |
| Colore dominante | Immunità allo sforo | **Regola in vigore** (Silenzio, Carnevale, Luce, Effetti vietati), attiva solo se la carta centrale è di quel colore; niente immunità |
| Zapd | 12 | **13**: la Cromozapd fa passare le mani e fa scegliere il colore |
| Modificatori −n / +n | Abbassano il minimo / alzano il massimo | **±n allargano il range di 2n per lato** |
| Mazzetto Effetti | 20 carte (con Sincero, Scambio forzato, Annulla) | **15 carte** (Reverse, Prossima carta, ±n, Baratto) |
| Pesca | "Attivo 2, escluso 1" | Si pesca fino a 3 |
| Discussione | A voce | Dichiarazione strutturata (numero o "Niente"), tradimento libero tra attivi, tutto in cronaca |
| Escluso iniziale | Non specificato (io avevo messo A) | **A sorte**: con A fisso il posto C vinceva il 43% delle partite |
| Fine del mazzo | Non specificato | Si rimescolano gli scarti (non dovrebbe servire) |
| Parità | Non specificato | Pareggio |

## 14. Le AI (solo per il playtest)
Le AI non fanno parte delle regole, ma conviene saperlo quando si legge la cronaca.
- **Non vedono** le carte degli altri né l'ordine del mazzo: usano solo la propria mano, gli scarti, le Zapd uscite e le dichiarazioni. Per decidere simulano il turno sul motore di gioco su mani possibili.
- **Facile**: gioca spesso a caso e può mentire a caso nelle dichiarazioni.
- **Media**: simula poche mani possibili, qualche errore; è sempre sincera con il compagno e con gli attivi.
- **Difficile**: simula molte mani possibili, si fida delle dichiarazioni, usa gli effetti quando servono. Da escluso può **mentire** quando il guadagno atteso supera il costo della carta Traditore.
- **Quanto sono diversi** (regole attuali, posti alternati, intervallo di confidenza 95%): Difficile contro due Medie vince il 44,7% delle partite (attesi 33,3%; 40,1–49,3%, +1,9 punti), Media contro due Facili il 53,3% (48,7–57,9%, +4,0 punti). Tre Difficili: sforo ~32%, posti A/B/C 28,0/38,3/33,7% su 300 partite.
- **Il dilemma c'è**: un giocatore che pensa solo a sé (carta più alta per sé, più bassa per la coppia) contro due Difficili vince il 10,3% delle partite (attesi 33,3%): più punti personali ma Fattore 25,9% contro 37,1%.
