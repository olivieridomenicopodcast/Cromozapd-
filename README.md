# CROMOZAPD — Playtest

Versione digitale per il playtest del gioco di carte **Cromozapd** (3 giocatori, coppie a rotazione, doppio punteggio).
Stato: **tappa 2 — regolamento e motore di gioco con test** (interfaccia, AI e simulatore arrivano nelle tappe successive).

```
npm test            # test sulle regole (node:test)
node tools/build-rules.js   # rigenera js/rulebook.js dopo ogni modifica a docs/REGOLAMENTO.md
```

| File | Ruolo |
|---|---|
| `docs/REGOLAMENTO.md` | regolamento unico (fonte), con interpretazioni segnate e parametri (§12) |
| `docs/DA_RICORDARE.md` | punti di bilanciamento aperti da riprendere |
| `js/data.js` | colori, carte, effetti, parametri di regola (`DEFAULT_RULES`) |
| `js/engine.js` | motore: partita come generatore di decisioni, RNG con seed, stato JSON clonabile, replay |
| `tests/` | test sulle regole, determinismo/replay, fuzz con invarianti |
