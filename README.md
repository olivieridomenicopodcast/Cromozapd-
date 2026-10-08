# CROMOZAPD — Playtest

Versione digitale per il playtest del gioco di carte **Cromozapd** (3 giocatori, coppie a rotazione, doppio punteggio).
Nessuna build: apri `index.html` (o `npm run serve` → http://localhost:8080). PWA installabile, funziona offline.

**Stato: tappa 3 — interfaccia giocabile.** AI vere e simulatore arrivano nelle tappe successive: per ora le AI giocano **a caso** (provvisorio) e la voce "Simulazione" è disattivata.

## Modalità
- 🤖 **Contro l'AI** — tu e due AI (livelli da scegliere per ogni posto).
- 👥 **Passa il telefono** — 2 o 3 umani sullo stesso dispositivo: schermata di passaggio prima di ogni scelta privata, mani nascoste fuori dal proprio turno.
- 🍿 **AI contro AI** — da guardare, con velocità regolabile (manuale, lento, normale, veloce, istantaneo).
- Salvataggio automatico con ripresa, cronaca esportabile (.txt/.json), note di playtest, "Rivedi" a fine partita, seed per rigiocare la stessa partita.

## Comandi
```
npm test                                  # test sulle regole e sugli sprite (node:test)
node tools/build-rules.js                 # rigenera js/rulebook.js dopo ogni modifica a docs/REGOLAMENTO.md
node tools/export-sprites.js              # esporta gli sprite in assets/sprites/*.svg e sprites.html
NODE_PATH=/opt/node-tools/node_modules node tools/e2e.js --mode ai|hotseat|watch [--mobile]   # prova nel browser (Playwright)
NODE_PATH=/opt/node-tools/node_modules node tools/make-icons.js      # icone PWA
```

| File | Ruolo |
|---|---|
| `docs/REGOLAMENTO.md` | regolamento unico (fonte), con interpretazioni segnate e parametri (§12) |
| `docs/DA_RICORDARE.md` | punti di bilanciamento aperti da riprendere |
| `js/data.js` | colori, carte, effetti, parametri di regola (`DEFAULT_RULES`) |
| `js/engine.js` | motore: partita come generatore di decisioni, RNG con seed, stato clonabile, replay |
| `js/ai.js` | AI (provvisoria: casuale) |
| `js/ui/*` | sprite SVG, tavolo, sessione di gioco e pannelli, regole, avvio |
| `tests/` | regole, determinismo/replay, fuzz con invarianti, sprite |
