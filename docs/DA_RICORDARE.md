# Da ricordare — punti di bilanciamento aperti

*Da NON decidere ora: li riprendiamo col simulatore e coi playtest. Ricordarli a Niky a ogni tappa importante.*

1. **Modificatori ±1/2/3**: sono solo vantaggi (allargano il range), senza costo d'uso a parte occupare uno dei 2 posti in mano. Misurare se vengono giocati sempre.
2. **Annulla**: manca ancora un incentivo chiaro a usarlo (soprattutto contro il compagno). Analizzarlo con l'analisi "forzata" degli effetti.
3. **Immunità del colore dominante**: con carte scelte a caso vale circa il 6% dei turni. Misurare quanto la cercano le AI e quanto pesa.
4. **Base 10**: sospetta troppo larga (sforo troppo raro). Testare 5–7 con "Esperimento sulle regole".
5. **Escluso "sempre a metà"**: possibile correttivo (peso diverso dei contributi da escluso, bonus sopra soglia).
6. **Ruolo dei colori** oltre al colore dominante (e della carta centrale): non esplorato.
7. **Numero di copie** di ogni carta-effetto: valori di partenza provvisori (20 carte).
8. **Rapporto punti personali / Fattore coppie**: validare che la "campana" regga davvero.
9. **Margine del mazzo**: con "Prossima carta" si consumano carte in più; il fuzz controlla che il mazzo regga (finora sì).
10. **Zapd quasi ogni turno** (circa 0,78 a turno): l'escluso cambia spesso e a volte di due posti; è voluto?

## Cosa hanno mostrato le simulazioni (hard contro hard, 300 partite, Base 10)
*Dati misurati, nessuna regola cambiata. Da discutere prima di decidere qualsiasi cosa.*
11. **Il punteggio dipende soprattutto dalla fortuna dell'esclusione.** Correlazione punteggio finale ↔ punti personali: 0,90. Correlazione punti personali ↔ turni passati da escluso: **−0,70** (punteggio ↔ turni da escluso: −0,60). Chi è escluso più volte (Zapd) quasi sempre perde.
12. **Il Fattore coppie è quasi costante** (media 33,3% per costruzione: le quote dei tre giocatori in ogni coppia sommano 100%; deviazione standard 4,8%, da 17% a 53%) e **non dipende dai turni da escluso** (correlazione 0,02). Quindi punteggio ≈ punti personali ÷ 3: la "campana" del bilanciamento oggi è debole.
13. **Poco margine per l'abilità**: tra un giocatore a caso e il migliore c'è circa 2,5 punti di punteggio su 17,5. Facile < Media < Difficile si distinguono, ma la differenza tra Media e Difficile è dell'ordine di 0,6 punti.
14. **Sforo** ≈ 22% dei turni, ma dipende molto dalla carta centrale: ~10% con centro 1–5, 35% con centro 9, **47% con centro 10**. Le AI giocano carte basse per la coppia e alte per sé.
15. **Le carte per sé sono alte** (10 è la più giocata) e **quelle per la coppia basse** (1 è la più giocata): conviene "bruciare" la carta peggiore come carta-coppia finché la somma resta nel range.
16. **Gli effetti rendono poco** finora (vedi "Analisi delle carte-effetto" nel simulatore). Annulla viene quasi mai giocata.
