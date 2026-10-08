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
13. **Il Fattore coppie è costante in media (33,3% per costruzione), ma la strategia lo sposta molto** (correzione di una mia lettura precedente, che lo dava per poco importante). Un giocatore "egoista" semplice (carta più alta per sé, carta-coppia più bassa possibile) fa **più punti personali (62,8 contro 54,0) ma un Fattore molto più basso (27,3% contro 36,3%)** e perde: punteggio 17,3 contro 19,7, vince il 20,9% delle partite contro due AI Difficili (attese 33,3%). Il dilemma "sacrificio contro egoismo" voluto dal design esiste, e l'ottimo è intermedio. Il vincitore individuale coincide con chi ha più punti personali solo nel 57% delle partite.
14. **Poco margine per l'abilità** (tornei con posti alternati, Base 7): Difficile batte Media nel 39,7% delle partite (attesi 33,3%; 36,5–42,9%), +1,2 punti; Media batte Facile nel 47,4% (44,2–50,7%), +2,5.
15. **Sforo (Base 7)**: le AI Difficili sforano nel 28,6% dei turni (2,5 a partita in basso, 1,2 in alto), perché giocano carte basse per la coppia: lo sforo non toglie nulla ai loro punti personali. **Per gli umani che parlano e cooperano** (modello a coppia che si coordina): ~4% in basso e ~2% in alto, cioè circa 6% (con Base 10 era 4% e 0,2%: il massimo non contava mai). Senza coordinazione (ognuno tiene la carta più alta per sé): 32% in basso e 9% in alto. Dato vero solo dal playtest: contare le righe "SFORO" nella cronaca esportata.
16. **Carte per sé alte e per la coppia basse** nelle AI (10 la più giocata per sé, 1 per la coppia).
17. **Carte-effetto provate con le AI (Base 7).**
    - *Analisi forzata* (250 coppie di partite per carta): nessuna dà un vantaggio misurabile (Δ punteggio tra −0,11 e +0,46 con intervalli che includono 0; il più vicino è Reverse, +0,46 [−0,09 ; 1,01]).
    - *Uso reale* (400 partite, Difficile contro Difficile, a partita): i modificatori ±n si giocano 1,4 volte; di queste **0,40 salvano il range**, 0,60 erano inutili (la somma era già nel range: assicurazione) e 0,21 non bastano. Reverse 1,04, Prossima carta 1,05, Sincero 0,96, Scambio forzato 0,70. **Annulla: 1,45 pescate e solo 0,13 giocate (9%)**: è la carta morta.
    - *Con 0, 2 o 4 effetti in mano al massimo* (600 partite Difficile contro Media): sforo 32,2% → 30,1% → 29,9%; punti squadra 129 → 133 → 134; vantaggio del Difficile 0,51 → 0,89 → 0,87 punti. Gli effetti tolgono circa 2 punti percentuali di sforo e aggiungono pochissimo "abilità"; quattro slot non valgono più di due.
    - Conclusione: gli effetti spostano poco (circa un turno ogni tre partite viene salvato da un modificatore). Annulla manca di incentivo (già noto al punto 2).
18. **Le AI tradiscono pochissimo** (circa 1% delle dichiarazioni): il tradimento è una cosa da umani.
