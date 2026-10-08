/* CROMOZAPD — simulazione di partite AI vs AI in blocco e statistiche per il playtest.
   Tre posti: il profilo A siede a rotazione in A, B, C (posti alternati) e gli altri due posti hanno il profilo B.
   Con due profili uguali ci si aspetta che A vinca 1 partita su 3. */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const Sim = (FF.Sim = {});
  const tick = () => new Promise((r) => setTimeout(r, 0));

  function wilson(k, n) { // intervallo di confidenza 95% di una proporzione
    if (!n) return [0, 0];
    const z = 1.96, p = k / n, d = 1 + z * z / n;
    const c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }
  Sim.wilson = wilson;
  // media ± intervallo di confidenza 95% da somme (n, Σx, Σx²)
  function meanCI(n, s1, s2) {
    if (!n) return { m: 0, lo: 0, hi: 0 };
    const m = s1 / n, v = n > 1 ? Math.max(0, (s2 - s1 * s1 / n) / (n - 1)) : 0, h = 1.96 * Math.sqrt(v / n);
    return { m, lo: m - h, hi: m + h };
  }
  Sim.meanCI = meanCI;
  const addInto = (dst, src) => { for (const k in src) dst[k] = (dst[k] || 0) + src[k]; };
  const pct = (x) => (100 * x).toFixed(1) + '%';

  // regole con parametri annidati: "effectCopies.reverse"
  Sim.setRule = function (rules, key, value) {
    const r = JSON.parse(JSON.stringify(rules || {}));
    if (key.includes('.')) { const [a, b] = key.split('.'); r[a] = r[a] || {}; r[a][b] = value; } else r[key] = value;
    return r;
  };

  /* opts: { games, seed, rules, a:'hard', b:'medium', aParams, bParams, swap:true, keepLogs:0, forced:null|'reverse'… } */
  Sim.playOne = function (i, opts) {
    const swap = opts.swap !== false;
    const aSeat = swap ? i % 3 : 0;
    const seed = opts.seed + '#' + i;
    const keepLog = i < (opts.keepLogs || 0) || !!opts.log;
    const levels = [opts.b, opts.b, opts.b]; levels[aSeat] = opts.a;
    const names = [0, 1, 2].map((p) => (p === aSeat ? 'A·' : 'B·') + FF.SEATS[p] + ' ' + levels[p]);
    const players = [0, 1, 2].map((p) => ({ name: names[p], kind: 'ai', level: levels[p] }));
    const g = new FF.Game({ seed, rules: opts.rules, log: keepLog, stats: true, players });
    if (opts.forced) { // analisi forzata: il profilo A parte con questa carta-effetto in mano
      const orig = g.setupGen.bind(g);
      g.setupGen = function* () { yield* orig(); g.s.players[aSeat].eff.push({ id: 900, k: opts.forced }); };
    }
    const ai = [0, 1, 2].map((p) => FF.AI.create(levels[p], seed + 'ai' + p, p === aSeat ? opts.aParams : opts.bParams));
    const traj = []; let lastT = 0;
    const res = FF.drive(g, g.run(), (game, d) => {
      if (game.s.turn !== lastT && d.type === 'declare') { lastT = game.s.turn; traj[lastT] = [0, 1, 2].map((p) => game.score(p)); }
      return ai[d.player].decide(game, d);
    });
    traj[res.turns + 1] = res.scores.slice();
    return { g, res, aSeat, seed, traj, levels, players };
  };

  Sim.run = async function (opts, onProgress, cancel) {
    const n = opts.games;
    const agg = {
      opts: { games: n, seed: opts.seed, rules: Object.assign({}, FF.DEFAULT_RULES, opts.rules || {}), a: opts.a, b: opts.b, aParams: opts.aParams || null, bParams: opts.bParams || null, swap: opts.swap !== false, forced: opts.forced || null },
      n: 0,
      aWins: 0, bWins: 0, draws: 0, aInPairWin: 0, pairDraws: 0,
      seatWins: [0, 0, 0], seatN: [0, 0, 0], pairWins: [0, 0, 0],          // vittorie per posto A/B/C; coppie vincenti (per escluso)
      diff: { n: 0, s1: 0, s2: 0 },                                          // punteggio di A − media dei due B
      score: { A: 0, B: 0, seat: [0, 0, 0] }, personal: { A: 0, B: 0 }, factor: { A: 0, B: 0 }, pairPts: { A: 0, B: 0, tot: 0 },
      turns: {}, margins: {},                                                 // istogrammi: durata e distacco tra 1° e 2°
      stats: { A: {}, B: {}, game: {} },
      traj: { A: [], B: [], cnt: [] },
      vals: { coppia: {}, se: {}, escluso: {} },
      games: [], logs: [], ms: 0,
    };
    const t0 = Date.now(); let last = Date.now();
    for (let i = 0; i < n; i++) {
      if (cancel && cancel.cancelled) break;
      const { g, res, aSeat, seed, traj } = Sim.playOne(i, opts);
      const bs = [0, 1, 2].filter((p) => p !== aSeat);
      agg.n++;
      const w = res.winner;
      if (w == null) agg.draws++; else if (w === aSeat) agg.aWins++; else agg.bWins++;
      if (w != null) { agg.seatWins[w]++; }
      agg.seatN[aSeat]++;
      if (res.pairWinner == null) agg.pairDraws++; else { agg.pairWins[res.pairWinner]++; if (res.pairWinner !== aSeat) agg.aInPairWin++; }
      const dA = res.scores[aSeat] - (res.scores[bs[0]] + res.scores[bs[1]]) / 2;
      agg.diff.n++; agg.diff.s1 += dA; agg.diff.s2 += dA * dA;
      agg.score.A += res.scores[aSeat]; agg.score.B += (res.scores[bs[0]] + res.scores[bs[1]]) / 2;
      res.scores.forEach((x, p) => { agg.score.seat[p] += x; });
      agg.personal.A += res.personal[aSeat]; agg.personal.B += (res.personal[bs[0]] + res.personal[bs[1]]) / 2;
      agg.factor.A += res.factor[aSeat]; agg.factor.B += (res.factor[bs[0]] + res.factor[bs[1]]) / 2;
      agg.pairPts.tot += res.pairPts[0] + res.pairPts[1] + res.pairPts[2];
      agg.turns[res.turns] = (agg.turns[res.turns] || 0) + 1;
      const sorted = res.scores.slice().sort((x, y) => y - x); const mg = Math.min(20, Math.floor(sorted[0] - sorted[1]));
      agg.margins[mg] = (agg.margins[mg] || 0) + 1;
      addInto(agg.stats.A, g.stats.p[aSeat]); addInto(agg.stats.B, g.stats.p[bs[0]]); addInto(agg.stats.B, g.stats.p[bs[1]]); addInto(agg.stats.game, g.stats.g);
      for (let t = 1; t < traj.length; t++) if (traj[t]) {
        agg.traj.A[t] = (agg.traj.A[t] || 0) + traj[t][aSeat]; agg.traj.B[t] = (agg.traj.B[t] || 0) + (traj[t][bs[0]] + traj[t][bs[1]]) / 2; agg.traj.cnt[t] = (agg.traj.cnt[t] || 0) + 1;
      }
      for (const [kind, pre] of [['coppia', 'v_coppia_'], ['se', 'v_se_'], ['escluso', 'v_escluso_']]) {
        for (let p = 0; p < 3; p++) for (const k in g.stats.p[p]) if (k.startsWith(pre)) { const v = Number(k.slice(pre.length)); agg.vals[kind][v] = (agg.vals[kind][v] || 0) + g.stats.p[p][k]; }
      }
      agg.games.push({ i, seed, aSeat, scores: res.scores.map((x) => +x.toFixed(2)), winner: w, pairWinner: res.pairWinner, turns: res.turns, pairPts: res.pairPts });
      if (i < (opts.keepLogs || 0)) agg.logs.push({ i, seed, aSeat, scores: res.scores, lines: g.events.slice() });
      if (onProgress && Date.now() - last > 80) { last = Date.now(); onProgress(i + 1, n); await tick(); }
    }
    agg.ms = Date.now() - t0;
    if (onProgress) onProgress(agg.n, n);
    return agg;
  };

  // riassunto numerico di un aggregato (usato da report, esperimenti, analisi)
  Sim.summary = function (agg) {
    const n = agg.n || 1;
    const per = (k) => ((agg.stats.A[k] || 0) + (agg.stats.B[k] || 0) + (agg.stats.game[k] || 0)) / n;
    const sfora = per('coppia_sfora'), ok = per('coppia_nel_range'), imm = per('coppia_salvata_dal_colore'), tot = sfora + ok + imm || 1;
    const dec = per('dichiarazioni_con_numero') || 1;
    return {
      n: agg.n, aWin: agg.aWins / n, aWinCI: wilson(agg.aWins, agg.n), bWinEach: agg.bWins / n / 2, draws: agg.draws / n,
      aPairWin: agg.aInPairWin / n, aPairWinCI: wilson(agg.aInPairWin, agg.n),
      diff: meanCI(agg.diff.n, agg.diff.s1, agg.diff.s2),
      scoreA: agg.score.A / n, scoreB: agg.score.B / n, personalA: agg.personal.A / n, personalB: agg.personal.B / n, factorA: agg.factor.A / n, factorB: agg.factor.B / n,
      turns: Object.entries(agg.turns).reduce((a, [t, c]) => a + t * c, 0) / n,
      sforoRate: sfora / tot, rangeRate: ok / tot, immuneRate: imm / tot, betrayRate: (per('tradimenti') * 1) / dec,
      pairPtsPerGame: agg.pairPts.tot / n,
      msPerGame: agg.ms / n,
    };
  };

  /* Esperimento sulle regole: ripete la simulazione cambiando un parametro (es. 'base' = 5,7,10 oppure 'effectCopies.reverse' = 0,3).
     Restituisce una riga di riassunto per valore. */
  Sim.experiment = async function (opts, param, values, onProgress, cancel) {
    const rows = []; const total = values.length * opts.games; let done = 0;
    for (const v of values) {
      if (cancel && cancel.cancelled) break;
      const o = Object.assign({}, opts, { rules: Sim.setRule(opts.rules, param, v), keepLogs: 0 });
      const agg = await Sim.run(o, (i) => onProgress && onProgress(done + i, total), cancel);
      done += opts.games;
      rows.push({ value: v, agg, s: Sim.summary(agg) });
    }
    return rows;
  };

  /* Analisi di OGNI carta-effetto "forzata": il profilo A parte con quella carta in mano. Stesso seed con e senza carta → confronto a coppie.
     Serve a tarare le carte anche quando l'AI non le sceglierebbe mai da sola. */
  Sim.analyzeEffects = async function (opts, perEffect, onProgress, cancel) {
    const ids = FF.EFFECT_IDS.filter((k) => (opts.rules && opts.rules.effectCopies && opts.rules.effectCopies[k] === 0 ? false : true));
    const total = perEffect * (ids.length + 1); let done = 0, last = Date.now();
    const control = [];
    const base = Object.assign({}, opts, { keepLogs: 0, forced: null });
    for (let i = 0; i < perEffect; i++) {
      if (cancel && cancel.cancelled) break;
      const r = Sim.playOne(i, base); control.push({ sc: r.res.scores[r.aSeat], win: r.res.winner === r.aSeat ? 1 : 0 });
      done++; if (onProgress && Date.now() - last > 80) { last = Date.now(); onProgress(done, total); await tick(); }
    }
    const rows = [];
    for (const k of ids) {
      let n = 0, dS1 = 0, dS2 = 0, dW1 = 0, dW2 = 0, played = 0, forcedWin = 0, controlWin = 0;
      for (let i = 0; i < control.length; i++) {
        if (cancel && cancel.cancelled) break;
        const r = Sim.playOne(i, Object.assign({}, base, { forced: k }));
        const ds = r.res.scores[r.aSeat] - control[i].sc, w = r.res.winner === r.aSeat ? 1 : 0, dw = w - control[i].win;
        n++; dS1 += ds; dS2 += ds * ds; dW1 += dw; dW2 += dw * dw; forcedWin += w; controlWin += control[i].win;
        played += (r.g.stats.p[r.aSeat]['effetto_giocato:' + k] || 0) > 0 ? 1 : 0;
        done++; if (onProgress && Date.now() - last > 80) { last = Date.now(); onProgress(done, total); await tick(); }
      }
      rows.push({ k, name: FF.EFFECTS[k].n, n, dScore: meanCI(n, dS1, dS2), dWin: meanCI(n, dW1, dW2), playedRate: n ? played / n : 0, forcedWin: n ? forcedWin / n : 0, controlWin: n ? controlWin / n : 0 });
    }
    if (onProgress) onProgress(total, total);
    return rows;
  };

  // ───────────────────────── report ─────────────────────────
  const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2);
  const ci = (c) => `${f2(c.m)} [${f2(c.lo)} ; ${f2(c.hi)}]`;
  Sim.report = function (agg) {
    const s = Sim.summary(agg), o = agg.opts, n = agg.n;
    const L = [];
    L.push(`# Simulazione Cromozapd — ${n} partite`, '',
      `Profilo **A = ${o.a}** (a rotazione sui posti A/B/C) contro due **B = ${o.b}**. Seed \`${o.seed}\`, posti ${o.swap ? 'alternati' : 'fissi'}${o.forced ? `, carta forzata: **${FF.EFFECTS[o.forced].n}**` : ''}. ${f2(s.msPerGame)} ms/partita.`);
    const diffRules = Object.keys(o.rules).filter((k) => JSON.stringify(o.rules[k]) !== JSON.stringify(FF.DEFAULT_RULES[k]));
    L.push(`Regole diverse dal default: ${diffRules.length ? diffRules.map((k) => `${k}=${JSON.stringify(o.rules[k])}`).join(', ') : 'nessuna'}.`, '');
    L.push('## Vittorie', '', '| | Valore | Intervallo 95% |', '|---|---|---|',
      `| A vince l'individuale (se uguali: 33,3%) | **${pct(s.aWin)}** | ${pct(s.aWinCI[0])} – ${pct(s.aWinCI[1])} |`,
      `| ogni B vince (media dei due) | ${pct(s.bWinEach)} | |`, `| pareggi | ${pct(s.draws)} | |`,
      `| A è nella coppia vincente (se uguali: 66,7%) | ${pct(s.aPairWin)} | ${pct(s.aPairWinCI[0])} – ${pct(s.aPairWinCI[1])} |`,
      `| punteggio A − media dei B | ${ci(s.diff)} | |`, '');
    L.push('## Vantaggio di posto', '', '| Posto | Vittorie individuali | Coppia (escluso) vincente |', '|---|---|---|');
    for (let p = 0; p < 3; p++) L.push(`| ${FF.SEATS[p]}${p === o.rules.startExcluded ? ' (escluso iniziale)' : ''} | ${pct(agg.seatWins[p] / n)} | ${pct(agg.pairWins[p] / n)} (${FF.pairLabel(p)}) |`);
    L.push('', '## Punteggi medi', '', '| | Personali | Fattore coppie | Punteggio |', '|---|---|---|---|', `| A | ${f1(s.personalA)} | ${pct(s.factorA)} | ${f1(s.scoreA)} |`, `| B (media) | ${f1(s.personalB)} | ${pct(s.factorB)} | ${f1(s.scoreB)} |`,
      '', `Durata media ${f1(s.turns)} turni. Punti squadra totali per partita ${f1(s.pairPtsPerGame)}.`, '');
    L.push('## Come vanno i turni', '', `- Coppia nel range: ${pct(s.rangeRate)} · salvata dal colore dominante: ${pct(s.immuneRate)} · **sforo: ${pct(s.sforoRate)}**`,
      `- Dichiarazioni con numero tradite: ${pct(s.betrayRate)}`, '');
    const per = (k) => (((agg.stats.A[k] || 0) + (agg.stats.B[k] || 0) + (agg.stats.game[k] || 0)) / n);
    L.push('## Eventi medi per partita', '', '| Evento | Media |', '|---|---|');
    const keys = new Set([...Object.keys(agg.stats.A), ...Object.keys(agg.stats.B), ...Object.keys(agg.stats.game)].filter((k) => !k.startsWith('v_')));
    [...keys].sort().forEach((k) => L.push(`| ${k} | ${f2(per(k))} |`));
    L.push('', '## Andamento dei punteggi (media per turno)', '', '| Turno | A | B | partite |', '|---|---|---|---|');
    for (let t = 1; t < agg.traj.cnt.length; t++) if (agg.traj.cnt[t] >= n * 0.3) L.push(`| ${t} | ${f1(agg.traj.A[t] / agg.traj.cnt[t])} | ${f1(agg.traj.B[t] / agg.traj.cnt[t])} | ${agg.traj.cnt[t]} |`);
    L.push('', '## Durata e distacco', '', '| Turni | Partite |', '|---|---|');
    Object.keys(agg.turns).map(Number).sort((a, b) => a - b).forEach((t) => L.push(`| ${t} | ${agg.turns[t]} |`));
    L.push('', '| Distacco 1°–2° (punti) | Partite |', '|---|---|');
    Object.keys(agg.margins).map(Number).sort((a, b) => a - b).forEach((m) => L.push(`| ${m}${m >= 20 ? '+' : ''} | ${agg.margins[m]} |`));
    L.push('', '## Carte giocate (distribuzione dei valori)', '', '| Valore | per la coppia | per sé | escluso |', '|---|---|---|---|');
    const sumv = (o2) => Object.values(o2).reduce((a, b) => a + b, 0) || 1;
    for (let v = 1; v <= o.rules.maxValue; v++) L.push(`| ${v} | ${pct((agg.vals.coppia[v] || 0) / sumv(agg.vals.coppia))} | ${pct((agg.vals.se[v] || 0) / sumv(agg.vals.se))} | ${pct((agg.vals.escluso[v] || 0) / sumv(agg.vals.escluso))} |`);
    return L.join('\n');
  };
  Sim.csv = function (agg) {
    const rows = ['partita;seed;posto_A;punteggio_A;punteggio_B;punteggio_C;vincitore;coppia_vincente;turni;punti_AB;punti_BC;punti_AC'];
    for (const g of agg.games) rows.push([g.i, g.seed, FF.SEATS[g.aSeat], ...g.scores.map((x) => String(x).replace('.', ',')), g.winner == null ? '' : FF.SEATS[g.winner], g.pairWinner == null ? '' : FF.pairLabel(g.pairWinner), g.turns, g.pairPts[2], g.pairPts[0], g.pairPts[1]].join(';'));
    return rows.join('\n');
  };
  Sim.reportExperiment = function (param, rows, opts) {
    const L = [`# Esperimento sulle regole: ${param}`, '', `Profilo A = ${opts.a}, B = ${opts.b}, ${rows[0] ? rows[0].s.n : 0} partite per valore, seed \`${opts.seed}\`.`, '',
      `| ${param} | A vince (33,3% se uguali) | Sforo | Salvata dal colore | Turni | Punti squadra/partita | Tradimenti | Punteggio A−B |`, '|---|---|---|---|---|---|---|---|'];
    for (const r of rows) { const s = r.s; L.push(`| **${r.value}** | ${pct(s.aWin)} (${pct(s.aWinCI[0])}–${pct(s.aWinCI[1])}) | ${pct(s.sforoRate)} | ${pct(s.immuneRate)} | ${f1(s.turns)} | ${f1(s.pairPtsPerGame)} | ${pct(s.betrayRate)} | ${ci(s.diff)} |`); }
    return L.join('\n');
  };
  Sim.reportEffects = function (rows, opts, perEffect) {
    const L = ['# Analisi delle carte-effetto "forzate"', '', `A = ${opts.a} contro due B = ${opts.b}; ${perEffect} coppie di partite (stesso seed con e senza la carta in mano a A). Δ = con carta − senza carta.`, '',
      '| Carta | Giocata | Δ punteggio A (95%) | Δ vittorie A (95%) | Vittorie A con / senza |', '|---|---|---|---|---|'];
    for (const r of rows) L.push(`| ${r.name} | ${pct(r.playedRate)} | ${ci(r.dScore)} | ${(r.dWin.m * 100).toFixed(1)} pt [${(r.dWin.lo * 100).toFixed(1)} ; ${(r.dWin.hi * 100).toFixed(1)}] | ${pct(r.forcedWin)} / ${pct(r.controlWin)} |`);
    L.push('', 'Un Δ il cui intervallo non include 0 indica una carta che dà un vantaggio (o uno svantaggio) misurabile.');
    return L.join('\n');
  };
})(typeof window !== 'undefined' ? window : globalThis);
