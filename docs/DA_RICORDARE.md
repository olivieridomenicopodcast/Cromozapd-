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

## Cosa hanno mostrato le simulazioni (Difficile contro Difficile, 400 partite, Base 10, AI corretta)
*Dati misurati, nessuna regola cambiata. Da discutere prima di decidere qualsiasi cosa.*
11. **Il punteggio dipende soprattutto dalla fortuna dell'esclusione.** Correlazione punteggio finale ↔ punti personali: 0,93. Punti personali ↔ turni passati da escluso: **−0,75**; punteggio ↔ turni da escluso: **−0,67**. Chi viene escluso più volte (dalle Zapd) quasi sempre perde.
12. **Il Fattore coppie è quasi costante**: media 33,3% per costruzione (in ogni coppia le quote dei tre giocatori sommano 100%), deviazione standard 4,4% (da 20% a 48%). Quindi punteggio ≈ punti personali ÷ 3: la "campana" del bilanciamento oggi pesa poco.
13. **Poco margine per l'abilità**: Difficile batte Media nel 40,4% delle partite (attesi 33,3%) e Facile nel 47,7%; in punti: +1,4 e +2,9 su ~18 di punteggio medio.
14. **Sforo ≈ 22% dei turni, ma dipende molto dalla carta centrale**: 5–10% con centro 1–4, 24% con centro 7, **38–54% con centro 8–10** (le AI giocano carte basse per la coppia). L'immunità del colore dominante salva solo ~1% dei turni.
15. **Carte per sé alte e per la coppia basse** (10 è la più giocata per sé, 1 la più giocata per la coppia): conviene "bruciare" la carta peggiore come carta-coppia finché la somma resta nel range.
16. **Nessuna carta-effetto dà un vantaggio misurabile** (analisi forzata, 250 coppie di partite per carta): tutti i Δ di punteggio sono tra −0,33 e +0,22 con intervalli che includono 0. Reverse mostra −9,6 punti percentuali di vittorie [−17 ; −2], ma il suo Δ di punteggio è nullo ed è l'unico su 11 confronti: probabilmente una fluttuazione. **Annulla viene giocata solo nel 7,6% dei casi**; le altre carte quasi sempre. Gli effetti, così come sono, spostano poco: o sono troppo deboli, o l'AI non li sfrutta.
17. **Le AI tradiscono pochissimo** (circa 1% delle dichiarazioni): la discussione a voce tra umani è l'unica parte del gioco in cui il tradimento è davvero in gioco.
