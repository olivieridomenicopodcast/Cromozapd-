# CROMOZAPD — Regolamento (versione playtest 0.1)

*Questo è il regolamento come è giocato nell'app. Riprende il Design Doc v2 e la bozza Carte Effetto e li completa dove erano ambigui o incompleti: le parti nuove o chiarite sono segnate con **[chiarito]** (deciso con te) o **[interpretazione]** (scelta mia, da confermare al playtest). I valori dei parametri sono in §12 e si cambiano dall'app (Varianti di regole).*

> *Concept: "un gioco a squadre che si gioca singoli, in coppie da tre".*

## 1. In breve
**Esattamente 3 giocatori**: A, B, C (nell'ordine in cui siedono, in senso orario). Ogni turno due giocatori sono **attivi** e formano una **coppia**; il terzo è l'**escluso**. Le coppie possibili sono **AB, BC, AC**.
La partita finisce quando esce l'ultima delle 12 carte **Zapd** (si gioca l'ultima mano, poi si conta).
Si vince **due volte**: **vincitore di coppia** (la coppia con più punti squadra) e **vincitore individuale** (punti personali × Fattore coppie).

## 2. Componenti
- **Mazzo principale: 92 carte** = 80 numeriche (4 colori × 2 scale da 1 a 10) + **12 carte Zapd** (3 per colore). I 4 colori sono Rosso, Blu, Verde, Giallo **[interpretazione: nomi provvisori]**.
- **Mazzetto Effetti**, separato, solo funzione (nessun valore numerico): vedi §8. Composizione di partenza **[interpretazione]**: 17 carte (§12).
- **Carta centrale**: la carta numerica scoperta che definisce il range del turno.
- **Gettone escluso** (uno solo) e **carte identità** con la freccia del verso di rotazione. Nell'app sono mostrati sul tavolo.
- **Colore dominante** (la "briscola"): indicato sul tavolo.

## 3. Preparazione
1. Si mescola il mazzo e si pesca finché esce la **prima Zapd**: il suo colore è il **colore dominante di partenza**. Poi si rimescola tutto (Zapd compresa).
2. Ognuno riceve 3 carte numeriche. L'**escluso iniziale è estratto a sorte** **[chiarito]** (nell'app dal seed, quindi riproducibile) e il verso di rotazione parte **orario** (A→B→C) **[interpretazione]**.
3. Il Mazzetto Effetti è mescolato; nessuno parte con carte-effetto.
4. Se durante la distribuzione esce una Zapd si risolve come sempre (§6) e si ripesca **[interpretazione]**.

## 4. Il turno
0. **Rotazione.** Dal 2° turno il gettone escluso avanza di un posto (§6).
1. **Pesca.** Chi ha meno di 3 carte numeriche pesca fino a 3 (di norma attivo +2, escluso +1; in ordine A, B, C). Poi si rivela la **carta centrale** (la prossima numerica; se c'è una "Prossima carta" giocata il turno prima, è quella). **[chiarito]** Se esce una Zapd la si risolve subito (§6) e si **ripesca** finché la mano è di 3 carte (o finché esce una numerica, per la centrale). I ruoli del turno si fissano a pesca finita.
2. **L'escluso gioca per primo** **[chiarito: idea di Niky]**: vista la carta centrale, l'escluso gioca **scoperta** 1 carta, la sua carta **X**: decide il range del turno (§5). Poi, sempre prima della discussione, un attivo può giocare **Sincero** (opzionale, §8).
3. **Discussione di coppia.** Solo i due attivi; l'escluso non partecipa. Nell'app ogni attivo può fare una **dichiarazione** al compagno: un numero (la carta che dice di giocare per la coppia) oppure "Niente"; ed eventualmente un'indicazione **vaga** sul proprio modificatore (§8). **[chiarito]** Il tradimento è libero e senza penalità: puoi giocare altro da ciò che hai dichiarato. Tutto finisce nella cronaca. Nell'hotseat si parla anche a voce.
4. **Gioco coperto.** Ogni attivo gioca, in quest'ordine: **carta per la coppia**, **carta per sé**, ed eventualmente una **carta-effetto** (3ª). L'escluso ha già giocato la sua carta (passo 2): non gioca altro in questo turno.
5. **Reveal** simultaneo delle carte coperte degli attivi (la carta dell'escluso è già sul tavolo).
6. **Risoluzione**: effetti (Reverse, Prossima carta, Scambio forzato), range e punti (§5), poi, solo per l'escluso, la scelta di **pescare una carta-effetto** (§8).

Il turno in cui esce la **12ª Zapd** è l'ultimo: si gioca per intero e si conta.

## 5. Range e punti
- **Range = carta centrale + carta dell'escluso** **[chiarito: idea di Niky, scelta dopo le simulazioni]**: il range va da *V* a *V + X*, dove *V* è il valore della carta centrale e *X* il valore della carta che l'escluso ha giocato per prima, scoperta. Esempio: centrale 6, l'escluso gioca 7 → range **6–13**. Gli estremi **sono inclusi**.
- Si controlla la **somma delle due carte-per-la-coppia degli attivi**. Si può sforare **sia sopra sia sotto**.
- **L'escluso decide la difficoltà**: una carta alta allarga il range (aiuta la coppia), una carta bassa lo stringe (le mette i bastoni tra le ruote). Ha solo le carte che ha in mano, quindi a volte è costretto ad aiutare (o a ostacolare) contro la sua volontà.
- **Nel range** → la coppia incassa **la somma delle due carte-coppia + la carta dell'escluso**; la carta dell'escluso conta nel suo contributo % in quella coppia (non nei suoi punti personali).
- **Fuori range (sforo, sopra o sotto)** → la coppia incassa **0**. La carta dell'escluso vale 0 per la coppia e **non conta nel contributo % di nessuno**.
- Varianti rimaste nel codice solo per le simulazioni (non sono regole): range da *Perno−V* a *Perno+V*, da *V* a *2V*, da *V−X* a *V+X*, da *V* a *V+Base*; la carta dell'escluso nella somma controllata (`xInSum`).
- **Colore dominante** **[chiarito]**: se **entrambe** le carte-per-la-coppia degli attivi sono del colore dominante, la coppia non perde mai per sforo (incassa come se fosse nel range). **Il colore della carta dell'escluso non conta.**
- La **carta per sé** vale sempre il suo valore, anche se la coppia sfora.
- Il **colore della carta centrale** non ha alcun ruolo **[interpretazione: resta aperto, vedi §11]**.

## 6. Escluso, verso e Zapd
- **Rotazione a ogni turno [chiarito]**: il gettone escluso **avanza di un posto a ogni nuovo turno** (dal 2° turno; nel 1° l'escluso è quello estratto a sorte), nel verso di rotazione. **Poi**, se durante la pesca escono Zapd, avanza **ancora** di un posto per ogni Zapd. Quindi nello stesso turno può avanzare di 1, 2, 3… posti.
- Quando una Zapd viene **pescata** (da rimpiazzo, carta centrale o distribuzione) si **risolve subito**: il suo colore diventa il **nuovo colore dominante** e il **gettone escluso avanza di un altro posto nel verso di rotazione** (oltre alla rotazione del turno) **e poi il verso di rotazione si inverte** (da orario ad antiorario o viceversa) **[chiarito]**; l'ordine "prima avanza, poi inverte" è un'**[interpretazione]**. La Zapd va da parte, scoperta (serve a stimare quanto manca).
- Se in un turno escono più Zapd, ognuna si risolve in ordine, ognuna con il verso che c'è in quel momento (due Zapd di fila: il gettone avanza e poi torna indietro, e il verso torna com'era).
- **Zapd da "Prossima carta"** **[chiarito]**: si risolve subito ma colore ed escluso valgono **dal turno dopo**; la partita finisce comunque se era la 12ª.
- **Fine partita**: finisce al termine del turno in cui è uscita la **12ª Zapd** (tutte e 12 sono nel mazzo).
- Se il mazzo finisse, si rimescolano gli scarti numerici **[interpretazione]**. Con 92 carte e circa 13 turni non dovrebbe succedere (verificato in simulazione).

## 7. Punteggio finale
- **Punti squadra** di ogni coppia = somma dei punti incassati (§5).
- **Punti personali grezzi** = somma delle **carte per sé** giocate da attivo.
- **Contributo % in una coppia** = punti versati dal giocatore a quella coppia ÷ punti totali di quella coppia. Contano la carta-per-la-coppia (da attivo) e la carta da escluso, solo nei turni in cui la coppia ha incassato.
- **Fattore coppie** = media (non pesata) dei contributi % nelle **3 coppie**, compresa quella a cui contribuisci da escluso. Una coppia con totale 0 si salta nella media; se sono tutte 0, il fattore è 0 **[interpretazione]**.
- **Punteggio individuale = punti personali grezzi × Fattore coppie.**
- **Vincitore di coppia**: la coppia con più punti squadra. **Vincitore individuale**: chi ha il punteggio più alto. In caso di parità si dichiara **pareggio** **[interpretazione]**.

## 8. Mazzetto Effetti
Solo l'**escluso** può pescare una carta-effetto, **per scelta**, a fine del suo turno da escluso. Non può giocarne in quel turno. **Massimo 2 carte-effetto in mano.** Gli effetti si giocano da **attivo**, in 3ª posizione (salvo Sincero). Si gioca **al massimo una carta-effetto in fila per turno** **[interpretazione]**. Tutti gli effetti sono rivelati nel reveal; gli scarti non tornano in gioco.

| Carta | Quando | Cosa fa |
|---|---|---|
| **Reverse** | in fila | Inverte il verso di rotazione: da quel momento l'escluso avanza nell'altra direzione (a ogni turno e a ogni Zapd; ogni Zapd lo inverte di nuovo). Due Reverse nello stesso turno si annullano. |
| **Prossima carta** | in fila | La carta in cima al mazzo viene scoperta e messa da parte: sarà la **carta centrale del turno dopo**. Una seconda "Prossima carta" nello stesso turno non ha effetto **[interpretazione]**. |
| **±1 / ±2 / ±3** (6 carte: 2 per ogni valore) | in fila | **Allargano** il range di questo turno di **n × 2** da entrambi i lati (±1 → minimo −2 e massimo +2; ±2 → ±4; ±3 → ±6) **[chiarito: scelto da Niky dopo le simulazioni]**. Si giocano coperti, prima del reveal. Più modificatori nello stesso turno si sommano. |
| **Sincero** | istantanea, prima della discussione | Per il turno **entrambi** gli attivi devono dichiarare un **numero esatto** sul proprio modificatore (o "nessuno"). Se al reveal quello giocato non corrisponde a quello dichiarato, **quel modificatore vale 0**. Non si applica alla carta-per-la-coppia. Non si può annullare **[interpretazione]**. |
| **Cambio centrale** *(scartata da Niky: resta solo nel codice di simulazione, 0 copie)* | istantanea, dopo che l'escluso ha giocato la sua carta | Un attivo mette scoperta una carta della sua mano al posto della carta centrale e **prende in mano la vecchia centrale**: il range si sposta. |
| **Scambio forzato** | in fila | Scambi **tutte le tue carte numeriche in mano** con quelle dell'escluso. Gli effetti in mano non si scambiano. Non si può rifiutare. |

**Vaghezza.** Senza Sincero, sui **modificatori** non si dicono numeri precisi: solo "poco / medio / tanto" (la direzione non conta, perché il modificatore allarga da entrambi i lati). Sulla carta-per-la-coppia numerica si possono invece dire numeri precisi.

## 9. Cosa vede l'app
Sempre sul tavolo: carta centrale e range del turno, colore dominante, escluso e verso, Zapd uscite (su 12), punti squadra delle 3 coppie, punti personali e Fattore coppie di ognuno, effetti in mano propri. Ogni evento ha un messaggio che spiega **cosa fa e perché**.

## 10. Modalità
Ogni posto (A, B, C) è un **umano** o un'**AI** (facile, media, difficile). Si può giocare tu + 2 AI, 2 umani + 1 AI (hotseat con schermata di passaggio), 3 umani (hotseat) o 3 AI da guardare. Nel simulatore il profilo A occupa un posto che ruota e gli altri due hanno il profilo B.

## 11. Non ancora definito
- Ruolo dei **colori** oltre al colore dominante (e della carta centrale).
- **Annulla** è stata **tolta dal mazzo** (decisione di Niky: quasi mai giocata nelle simulazioni, ~0,1 a partita). Il codice c'è ancora (parametro `Copie di Annulla` = 0). **Modificatore-base** assorbito nella famiglia ±1/2/3 **[chiarito]**.
- Range da V a V+X: sforo ~28% con le AI (sotto 2,1 / sopra 1,6 a partita), posti equilibrati (33/33/34% su 1000 partite); da riverificare con i playtest umani. Le AI da escluso giocano per lo più carte alte (conviene alla loro quota nel Fattore): da vedere se gli umani ostacolano di più.
- I modificatori ±n (allargano ×2) sono decisivi circa 1,4 volte a partita con la regola attuale: da osservare al playtest.
- L'escluso **ascolta** la discussione ma non parla: da confermare al playtest.
- Escluso "sempre a metà": possibile correttivo dopo i playtest.
- Numero definitivo di copie di ogni effetto.

## 12. Parametri (valori di partenza)
| Parametro | Valore |
|---|---|
| Range | **da V a V + X** (X = carta dell'escluso, giocata per prima) |
| Modificatori ±n: allargano il range di n × | **2** |
| Escluso iniziale | **a sorte** |
| Carte in mano | **3** |
| Effetti in mano al massimo | **2** |
| Zapd per colore | **3** |
| Copie di Reverse | **3** |
| Copie di Prossima carta | **3** |
| Copie di Sincero | **3** |
| Copie di Scambio forzato | **2** |
| Copie di Annulla | **0** |
| Copie di ogni ±1/2/3 | **1** |
| Sincero: modificatore sbagliato vale 0 | **sì** |
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
| Carta dell'escluso | Ambigua con lo sforo | **Giocata per prima, scoperta, e decide il range** (voluto da Niky); conta per i punti della coppia e per il suo Fattore; il colore non conta; 0 se la coppia sfora |
| Pesca | "Attivo 2, escluso 1" | Si pesca fino a 3 |
| Discussione | A voce | Dichiarazione strutturata (numero o "Niente"), tradimento libero, tutto in cronaca |
| Base del range | 10 | **Range da V a V + X**: lo decide la carta dell'escluso, giocata per prima e scoperta (idea di Niky) |
| Modificatori −n / +n | Abbassano il minimo / alzano il massimo | **±n allargano il range di 2n per lato** (sotto la regola della somma a 3 carte, −n serviva pochissimo) |
| Escluso iniziale | Non specificato (io avevo messo A) | **A sorte**: con A fisso il posto C vinceva il 43% delle partite |
| Fine del mazzo | Non specificato | Si rimescolano gli scarti (non dovrebbe servire) |
| Parità | Non specificato | Pareggio |

## 13. Le AI (solo per il playtest)
Le AI non fanno parte delle regole, ma conviene saperlo quando si legge la cronaca.
- **Non vedono** le carte degli altri né l'ordine del mazzo: usano solo la propria mano, gli scarti, le Zapd uscite e le dichiarazioni. Per decidere simulano il turno sul motore di gioco su mani possibili.
- **Facile**: gioca spesso a caso e può mentire a caso nelle dichiarazioni.
- **Media**: simula poche mani possibili, qualche errore; è sempre sincera con il compagno.
- **Difficile**: simula molte mani possibili, si fida delle dichiarazioni, usa gli effetti quando servono e **tradisce solo quando è quasi gratis**: se la carta dichiarata non serve alla coppia (la somma resta nel range anche così) e tenerla in mano le conviene.
- **Quanto sono diversi** (tornei di 600–900 partite, posti alternati, intervallo di confidenza 95%): Difficile batte Facile nel 45,8% delle partite (attesi 33,3%; 41,9–49,8%) e Media nel 37,3% (34,2–40,5%); Media batte Facile nel 45,3% (42,1–48,6%). In punti di punteggio: Difficile +0,8 su Media e +2,0 su Facile; Media +1,8 su Facile. Le differenze sono piccole perché il gioco lascia poco margine alla scelta delle carte (vedi `docs/DA_RICORDARE.md`).
