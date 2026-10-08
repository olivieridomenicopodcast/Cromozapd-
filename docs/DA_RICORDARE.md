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

## Cosa hanno mostrato le simulazioni (regole attuali: l'escluso avanza a ogni turno, ogni Zapd inverte il verso; Difficile contro Difficile, 400 partite)
*Dati misurati, nessuna regola cambiata dopo di essi. Da discutere prima di decidere qualsiasi cosa.*
11. **La fortuna dell'esclusione è molto calata con la rotazione a ogni turno.** Lo stesso escluso due turni di fila: 0,4% dei turni (prima 43,9%). Correlazione punti personali ↔ turni da escluso: −0,40 (prima −0,75); punteggio ↔ turni da escluso: −0,32 (prima −0,67). Resta una componente di fortuna (le Zapd fanno saltare il gettone).
12. **Vantaggio di posto probabile**: vittorie individuali A 30,8%, B 30,0%, **C 39,3%** (attesi 33,3%; con 400 partite l'errore è ±4,7%). Ipotesi: A è escluso per primo e, quando la partita dura 13 o 10 turni (la durata più frequente), subisce un'esclusione in più. Possibile rimedio da provare: escluso iniziale a sorte (parametro `startExcluded`). Da confermare con più partite.
13. **Il Fattore coppie è quasi costante**: media 33,3% per costruzione, deviazione standard 4,0% (da 20% a 51%). Quindi punteggio ≈ punti personali ÷ 3: la "campana" del bilanciamento oggi pesa poco (correlazione punteggio ↔ personali 0,90).
14. **Poco margine per l'abilità** (tornei con posti alternati): Difficile batte Facile nel 45,8% delle partite (attesi 33,3%; 41,9–49,8%), Media nel 37,3% (34,2–40,5%); Media batte Facile nel 45,3% (42,1–48,6%). In punti: +2,0, +0,8 e +1,8 su ~18.
15. **Sforo ≈ 22% dei turni, ma dipende molto dalla carta centrale**: 4–7% con centro 1–4, 26% con centro 7, **35–56% con centro 8–10** (le AI giocano carte basse per la coppia). L'immunità del colore dominante salva meno dell'1% dei turni.
16. **Carte per sé alte e per la coppia basse** (10 è la più giocata per sé, 1 la più giocata per la coppia): conviene "bruciare" la carta peggiore come carta-coppia finché la somma resta nel range.
17. **Nessuna carta-effetto dà un vantaggio misurabile** (analisi forzata, 250 coppie di partite per carta): tutti i Δ di punteggio sono tra −0,14 e +0,29 con intervalli che includono 0, e le vittorie di A restano tra 30,0% e 33,2% (senza carta 31,6%). **Annulla viene giocata solo nel 10% dei casi**; le altre quasi sempre. Gli effetti spostano poco: o sono troppo deboli, o l'AI non li sfrutta.
18. **Le AI tradiscono pochissimo** (circa 1% delle dichiarazioni): il tradimento è una cosa da umani.
