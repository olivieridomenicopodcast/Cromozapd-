/* CROMOZAPD — intelligenza artificiale.
   Tre livelli:
   - easy   : euristiche semplici con molte scelte a caso
   - medium : valuta ogni giocata simulando il turno sul motore (pochi campioni, un po' di rumore), sempre sincera con il compagno
   - hard   : come medium con più campioni, modella il compagno (si fida delle dichiarazioni), usa gli effetti strategici
              (Reverse, Prossima carta, Scambio forzato, Annulla) e può tradire solo quando conviene davvero
   Informazione nascosta: l'AI NON legge le mani degli altri né l'ordine del mazzo. Per decidere costruisce con `determinize`
   un clone del gioco in cui le carte ignote (mani altrui, mazzo, mazzetto effetti) sono ricampionate a caso tra quelle
   davvero ignote: il motore stesso fa da modello in avanti (`afterPlay` su un clone). Un test verifica che la decisione
   non cambi se si rimescola ciò che l'AI non può sapere. */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const AI = (FF.AI = {});
  const { EFFECTS, VAGUE } = FF;
  const mod3 = (a) => ((a % 3) + 3) % 3;

  // parametri dei livelli (si possono sovrascrivere per fare esperimenti: AI.create(level, seed, {samples: 8}))
  AI.PARAMS = {
    easy: { xLie: false, samples: 0, random: 0.75, noise: 0, trust: 0.6, honest: false, lie: 0.25, holdW: 0, handW: 0.3, exclW: 0, oppW: 0.3, betrayGain: 99, effBonus: 0.05, sinceroP: 0.1, annullaP: 0.25, annullaGain: 0 },
    medium: { xLie: false, samples: 2, random: 0.15, noise: 1.2, trust: 0.75, honest: true, lie: 0, holdW: 0.2, handW: 0.5, exclW: 0, oppW: 0.4, betrayGain: 99, effBonus: 0.12, sinceroP: 0.3, annullaP: 0, annullaGain: 0.6 },
    hard: { xLie: true, samples: 14, random: 0, noise: 0.05, trust: 0.85, honest: false, lie: 0, holdW: 0.25, handW: 0.5, exclW: 2.0, oppW: 0.5, betrayGain: 0.6, effBonus: 0.12, sinceroP: 0.25, annullaP: 0, annullaGain: 0.3 },
  };

  // ───────────────────────── informazione: cosa può sapere un giocatore ─────────────────────────
  // Ricostruisce un clone del gioco dal punto di vista di `pid`: le carte che non può conoscere sono ricampionate.
  AI.determinize = function (game, pid, rng) {
    const g = game.clone(), s = g.s;
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    // carte numeriche e Zapd: note = mia mano + scarti + Zapd uscite + carte scoperte
    const known = new Set();
    for (const c of s.players[pid].hand) known.add(c.id);
    for (const c of s.discard) known.add(c.id);
    for (const c of s.zapPile) known.add(c.id);
    if (s.nextCenter) known.add(s.nextCenter.id);
    if (s.center) known.add(s.center.id);
    if (s.xFirstCard) known.add(s.xFirstCard.id);
    if (s.lensBy === pid && s.xPick) known.add(s.xPick.id);   // ho guardato la carta coperta dell'escluso
    const unknown = FF.buildDeck(game.rules).filter((c) => !known.has(c.id));
    // le Zapd non stanno mai in mano (si risolvono appena pescate): le mani ricampionate hanno solo carte numeriche
    const nums = shuffle(unknown.filter((c) => !c.z)), zaps = unknown.filter((c) => c.z);
    for (const q of [0, 1, 2]) {
      if (q === pid) continue;
      const n = game.s.players[q].hand.length;
      s.players[q].hand = nums.splice(0, n);
    }
    if (s.lensBy === pid && s.xPick && s.players[s.excluded].hand.length) { const eh = s.players[s.excluded].hand; eh[0] = s.xPick; }
    s.deck = shuffle(nums.concat(zaps)); // il resto è il mazzo, in ordine casuale
    // carte-effetto: note = mie + giocate
    const eknown = new Set();
    for (const e of s.players[pid].eff) eknown.add(e.id);
    for (const e of s.effDiscard) eknown.add(e.id);
    const eunk = shuffle(FF.buildEffectDeck(game.rules).filter((e) => !eknown.has(e.id)));
    for (const q of [0, 1, 2]) {
      if (q === pid) continue;
      s.players[q].eff = eunk.splice(0, game.s.players[q].eff.length);
    }
    s.effDeck = eunk;
    if (s.traitorDeck && s.traitorDeck.length) shuffle(s.traitorDeck);   // si sa cosa resta nel mazzetto Traditore, non l'ordine
    s.rng = Math.floor(rng() * 2147483647) | 0; // i dadi del motore veri non si conoscono
    return g;
  };

  // se il compagno ha dichiarato un numero, con probabilità `p` ha davvero quella carta in mano
  function conditionHand(g, q, num, p, rng) {
    if (num == null || rng() >= p) return;
    const s = g.s, hand = s.players[q].hand;
    if (hand.some((c) => c.v === num)) return;
    const i = s.deck.findIndex((c) => c.v === num);
    if (i < 0 || !hand.length) return;
    const j = Math.floor(rng() * hand.length);
    const t = hand[j]; hand[j] = s.deck[i]; s.deck[i] = t;
  }

  // ───────────────────────── valutazione ─────────────────────────
  // Fattore coppie "morbido": le coppie ancora a 0 contano 1/3 (quota neutra) così le prime mosse non valgono 0 per forza
  // con il punteggio a podio una quota % si traduce in un podio atteso (1..3) e il "fattore equivalente" è la somma dei podi / 18 (media 1/3)
  const shareToPodio = (sh) => Math.max(1, Math.min(3, 2 + 6 * (sh - 1 / 3)));
  function softFactor(g, p) {
    const s = g.s; let sum = 0;
    for (let e = 0; e < 3; e++) { const sh = s.pairPts[e] > 0 ? s.contrib[p][e] / s.pairPts[e] : 1 / 3; sum += g.rules.scoring === 'podio' ? shareToPodio(sh) / 6 : sh; }
    return sum / 3;
  }
  // Punteggio PROIETTATO a fine partita: i punti personali e la quota in ogni coppia si diluiscono con i turni che restano.
  // (Senza proiezione, una carta alta data alla coppia sembra aumentare il Fattore molto più di quanto farà davvero.)
  const PROJ = { selfAvg: 6.3, pairPerTurn: 4.1 };
  // turni che restano (stima): la partita finisce quando esce l'ultima Zapd, che sta verso la fine del mazzo; ~6,2 carte a turno
  const turnsLeftEst = (g) => (g.s.zapsDrawn >= g.totalZaps ? 0 : Math.max(0.5, (g.s.deck.length * 0.9) / 6.2));
  function projScore(g, p) {
    const s = g.s, turnsLeft = turnsLeftEst(g);
    const Tf = turnsLeft * PROJ.pairPerTurn;
    let sum = 0;
    for (let e = 0; e < 3; e++) { const sh = (s.contrib[p][e] + Tf / 3) / (s.pairPts[e] + Tf || 1); sum += g.rules.scoring === 'podio' ? shareToPodio(sh) / 6 : sh; }
    return (s.players[p].personal + turnsLeft * (2 / 3) * PROJ.selfAvg) * (sum / 3);
  }
  let useProj = true;
  const softScore = (g, p) => (useProj ? projScore(g, p) : g.s.players[p].personal * softFactor(g, p));

  // valore dello stato per `pid` (più alto = meglio). P = parametri del livello.
  function evalU(g, pid, P) {
    useProj = P.proj !== false;
    const s = g.s, opp = [0, 1, 2].filter((i) => i !== pid);
    const f = softFactor(g, pid);
    const left = Math.max(0, Math.min(1, turnsLeftEst(g) / 12));
    let hand = 0;
    for (const c of s.players[pid].hand) hand += c.v - 5.5;
    let u = softScore(g, pid) - P.oppW * 0.5 * (softScore(g, opp[0]) + softScore(g, opp[1]));
    u += P.handW * f * 0.5 * hand * left;
    // chi sarà escluso al prossimo passo della rotazione perde un turno da attivo
    if (P.exclW && mod3(s.excluded + s.dir) === pid) u -= P.exclW * f * left;
    // una carta-effetto in mano è un'opzione futura: giocarla a vuoto ha un costo
    u += (P.holdW || 0) * left * s.players[pid].eff.length;
    // punti delle coppie di cui faccio parte (titolo di coppia)
    u += 0.03 * (s.pairPts[opp[0]] + s.pairPts[opp[1]] - s.pairPts[pid]);
    return Number.isFinite(u) ? u : -1e9;
  }

  // ───────────────────────── euristiche (modello degli altri e livello facile) ─────────────────────────
  const fila = (eff) => eff.filter((e) => EFFECTS[e.k].kind === 'fila');
  function pInRange(v, lo, hi, partnerNum, trust, max, R) {
    const xs = R && R.xInSum ? Array.from({ length: max }, (_, i) => i + 1) : [0]; // carta dell'escluso (variante): sconosciuta, uniforme
    const ok = (sum) => { const w = sum >= lo && sum <= hi; return R && R.rangeOutside ? !w : w; };
    let uni = 0, n = 0;
    for (let w = 1; w <= max; w++) for (const z of xs) { n++; if (ok(v + w + z)) uni++; }
    uni /= n;
    if (partnerNum == null) return uni;
    let d = 0; for (const z of xs) if (ok(v + partnerNum + z)) d++;
    return trust * (d / xs.length) + (1 - trust) * uni;
  }
  // giocata euristica per un attivo: carta-coppia che tiene la somma nel range (data la dichiarazione del compagno), carta-sé la più alta
  function heurPlay(g, pid, partnerNum, trust, rng, randomP) {
    const s = g.s, p = s.players[pid], hand = p.hand, R = g.rules, xv = s.xFirstCard ? s.xFirstCard.v : (s.lensBy === pid && s.xPick ? s.xPick.v : s.xDecl != null ? (rng() < (s.carnival ? trust * 0.35 : trust) ? s.xDecl : 5) : (s.xmode === 'hidden' ? 5 : undefined)), c0 = FF.rangeBase(R, s.center.v, xv)[0], c1 = FF.rangeBase(R, s.center.v, xv)[1];
    if (hand.length < 2) return null;
    if (rng() < randomP) {
      const i = Math.floor(rng() * hand.length); let j = Math.floor(rng() * (hand.length - 1)); if (j >= i) j++;
      const fl = s.noEff ? fila(p.eff).filter((e) => EFFECTS[e.k].mod) : fila(p.eff);
      return { coupleId: hand[i].id, selfId: hand[j].id, effId: fl.length && rng() < 0.3 ? fl[Math.floor(rng() * fl.length)].id : null };
    }
    let best = null, bv = -Infinity;
    const effOpts = [null, ...fila(p.eff).filter((e) => !(R.modTiming === 'after' && EFFECTS[e.k].mod) && !(s.noEff && !EFFECTS[e.k].mod))];
    for (const c of hand) for (const sf of hand) {
      if (c === sf) continue;
      for (const e of effOpts) {
        const m = e && EFFECTS[e.k].mod, md = R.modMode || 'range', nn = m ? m.n * (R.modScale || 1) : 0;
        const lo = c0 - (m && md === 'range' && m.dir === 'lo' ? nn : 0) - (m && md === 'widen' ? nn : 0), hi = c1 + (m && md === 'range' && m.dir === 'hi' ? nn : 0) + (m && md === 'widen' ? nn : 0);
        const sh = m && md === 'shift' ? (m.dir === 'hi' ? nn : -nn) : 0;
        const pin = pInRange(c.v + sh, lo, hi, partnerNum, trust, R.maxValue, R);
        const v = pin * 0.33 * (c.v + (partnerNum != null ? partnerNum : 5.5)) + 0.35 * sf.v - (e ? (m ? 0.12 : 0.02) : 0) + rng() * 0.01;
        if (v > bv) { bv = v; best = { coupleId: c.id, selfId: sf.id, effId: e ? e.id : null }; }
      }
    }
    return best;
  }
  // carta dell'escluso: una carta di valore medio (non tiene alto il suo Fattore, non butta le carte migliori)
  function heurX(g, pid, rng, randomP) {
    const hand = g.s.players[pid].hand;
    if (!hand.length) return null;
    if (rng() < randomP) return hand[Math.floor(rng() * hand.length)].id;
    return hand.slice().sort((a, b) => Math.abs(a.v - 6) - Math.abs(b.v - 6) || a.id - b.id)[0].id;
  }

  // ───────────────────────── modello in avanti ─────────────────────────
  // policy usata dentro le simulazioni per le decisioni degli altri
  const simPolicy = (game, d) => {
    switch (d.type) {
      case 'annulla': return null;
      case 'effdraw': return false;
      case 'sincero': return false;
      case 'cambio': return null;
      case 'baratto': return null;
      case 'lente': return false;
      case 'colorpick': return 0;
      default: return null;
    }
  };
  function simulate(g2, plays, xcard, pid, P) {
    const g = g2.clone();
    FF.drive(g, g.afterPlay(JSON.parse(JSON.stringify(plays)), xcard), simPolicy);
    return evalU(g, pid, P);
  }

  // ───────────────────────── il giocatore AI ─────────────────────────
  AI.create = function (level, seed, params) {
    const P = Object.assign({}, AI.PARAMS[level] || AI.PARAMS.medium, params || {});
    const rng = FF.makeRng(seed == null ? Date.now() : seed);
    const rnd = (n) => Math.floor(rng() * n);

    // piano di gioco per un attivo (usato anche per dichiarare)
    function planActive(game, d, useSim, nSamples) {
      const NS = nSamples || P.samples;
      const pid = d.player, s = game.s, ex = s.excluded;
      const partner = [0, 1, 2].find((i) => i !== ex && i !== pid);
      const pdecl = s.decls[partner], pnum = pdecl ? pdecl.num : null;
      const mydecl = s.decls[pid];
      const hand = d.hand;
      if (hand.length < 2) return null;
      if (!useSim || P.samples <= 0) {
        const h = heurPlay(game, pid, pnum, P.trust, rng, P.random);
        return h && { couple: h.coupleId, self: h.selfId, eff: h.effId, u: 0 };
      }
      // candidati: tutte le coppie ordinate di carte × (nessun effetto | ogni effetto in fila diverso)
      const effOpts = [null]; const seen = new Set();
      for (const e of (s.noEff ? fila(d.eff).filter((x) => EFFECTS[x.k].mod) : fila(d.eff))) if (!seen.has(e.k) && !(game.rules.modTiming === 'after' && EFFECTS[e.k].mod)) { seen.add(e.k); effOpts.push(e); }
      const cands = [];
      for (const c of hand) for (const sf of hand) if (c !== sf) for (const e of effOpts) cands.push({ c, sf, e });
      const tot = new Array(cands.length).fill(0);
      for (let k = 0; k < NS; k++) {
        const g2 = AI.determinize(game, pid, rng);
        conditionHand(g2, partner, pnum, P.trust, rng);
        // gli altri giocano secondo il modello
        const base = {};
        base[partner] = heurPlay(g2, partner, mydecl ? mydecl.num : null, P.trust, rng, 0.05);
        let xid = s.xFirstCard ? s.xFirstCard.id : (s.lensBy === pid && s.xPick ? s.xPick.id : null);
        if (xid == null && s.xDecl != null && rng() < (s.carnival ? P.trust * 0.35 : P.trust)) { const hc = g2.s.players[ex].hand.find((c) => c.v === s.xDecl); if (hc) xid = hc.id; }   // l'escluso ha detto la verità (o così credo)
        if (xid == null) xid = heurX(g2, ex, rng, 0.1);
        const xcard = s.xFirstCard || (s.lensBy === pid && s.xPick ? s.xPick : null) || g2.s.players[ex].hand.find((c) => c.id === xid);
        if (!base[partner] || !xcard) continue;
        // se il compagno ha dichiarato un numero, con probabilità `trust` gioca davvero quella carta
        if (pnum != null && rng() < P.trust) {
          const hc = g2.s.players[partner].hand.find((c) => c.v === pnum);
          if (hc && hc.id !== base[partner].selfId) base[partner].coupleId = hc.id;
          else if (hc) { base[partner].selfId = base[partner].coupleId; base[partner].coupleId = hc.id; }
        }
        for (let i = 0; i < cands.length; i++) {
          const { c, sf, e } = cands[i];
          const plays = { [pid]: { coupleId: c.id, selfId: sf.id, effId: e ? e.id : null }, [partner]: base[partner] };
          let u = simulate(g2, plays, xcard, pid, P);
          if (e && e.k === 'next') u += P.effBonus;
          tot[i] += u;
        }
      }
      let order = cands.map((c, i) => ({ c, v: tot[i] / NS + (P.noise ? (rng() - 0.5) * P.noise * 2 : 0) })).sort((a, b) => b.v - a.v);
      let best = order[0];
      api.lastOrder = order.slice(0, 8).map((o) => `${o.c.c.v}/${o.c.sf.v}${o.c.e ? '+' + o.c.e.k : ''}=${o.v.toFixed(2)}`);
      // tradimento: scostarsi da ciò che ho dichiarato solo se il guadagno supera la soglia
      if (mydecl && mydecl.num != null && hand.some((c) => c.v === mydecl.num)) {
        const honest = order.find((o) => o.c.c.v === mydecl.num);
        if (honest && best.c.c.v !== mydecl.num && (P.honest || best.v - honest.v < P.betrayGain)) best = honest;
      }
      return { couple: best.c.c.id, self: best.c.sf.id, eff: best.c.e ? best.c.e.id : null, u: best.v };
    }

    // variante 'xHidden': l'escluso sceglie CARTA da giocare e NUMERO da dichiarare (può mentire, ma se mente e la coppia sfora paga la carta Traditore)
    function planXHidden(game, d) {
      const pid = d.player, s = game.s, hand = d.hand;
      if (api.xPlan && api.xPlan.key === s.turn + ':' + s.zapsDrawn + ':' + hand.map((c) => c.id).join(',')) return api.xPlan;
      let plan;
      if (P.samples <= 0 || rng() < P.random) { const id = heurX(game, pid, rng, 0); const c = hand.find((x) => x.id === id) || hand[0]; plan = { card: c, decl: c.v }; }
      else {
        const act = [0, 1, 2].filter((i) => i !== pid);
        const lieSet = P.xLie && !s.silent ? [...new Set([...hand.map((c) => c.v), Math.max(...hand.map((c) => c.v)), game.rules.maxValue])] : [];
        const cands = [];
        for (const c of hand) { cands.push({ c, n: c.v }); for (const n of lieSet) if (n !== c.v) cands.push({ c, n }); }
        const tot = new Array(cands.length).fill(0); let nn = 0;
        for (let k = 0; k < P.samples; k++) {
          const g2 = AI.determinize(game, pid, rng), baseBy = {};
          for (const n of new Set(cands.map((x) => x.n))) {
            const g3 = g2.clone(); if (!s.silent) g3.s.xDecl = n; const b = {};
            for (const q of act) b[q] = heurPlay(g3, q, null, P.trust, rng, 0.05);
            baseBy[n] = b;
          }
          nn++;
          cands.forEach((cd, i) => {
            const b = baseBy[cd.n]; if (!b[act[0]] || !b[act[1]]) return;
            const g4 = g2.clone(); if (!s.silent) g4.s.xDecl = cd.n;
            tot[i] += simulate(g4, b, cd.c, pid, P);
          });
        }
        let bi = 0, bv = -Infinity;
        cands.forEach((cd, i) => { const v = tot[i] / Math.max(1, nn) + (P.noise ? (rng() - 0.5) * P.noise * 2 : 0); if (v > bv) { bv = v; bi = i; } });
        plan = { card: cands[bi].c, decl: cands[bi].n };
      }
      plan.key = s.turn + ':' + s.zapsDrawn + ':' + hand.map((c) => c.id).join(',');
      api.xPlan = plan;
      return plan;
    }

    function decideXplay(game, d) {
      const pid = d.player, s = game.s, ex = pid;
      const hand = d.hand;
      if (!hand.length) return null;
      if (game.s.xmode === 'hidden') return planXHidden(game, d).card.id;
      if (P.samples <= 0 || rng() < P.random) return rng() < P.random * 0.5 ? hand[rnd(hand.length)].id : heurX(game, pid, rng, 0);
      const act = [0, 1, 2].filter((i) => i !== ex);
      if (d.first) {   // variante 'xcard': l'escluso gioca per primo e la sua carta decide il range; gli attivi (non hanno ancora parlato) rispondono con l'euristica
        const tot = new Array(hand.length).fill(0); let n = 0;
        for (let k = 0; k < P.samples; k++) {
          const g2 = AI.determinize(game, pid, rng);
          hand.forEach((c, i) => {
            const g3 = g2.clone(); const h3 = g3.s.players[pid].hand;
            g3.s.xFirstCard = c; h3.splice(h3.findIndex((y) => y.id === c.id), 1);
            const base = {};
            for (const q of act) base[q] = heurPlay(g3, q, null, P.trust, rng, 0.05);
            if (!base[act[0]] || !base[act[1]]) return;
            tot[i] += simulate(g3, base, c, pid, P);
          });
          n++;
        }
        if (!n) return hand[0].id;
        let bi = 0, bv = -Infinity;
        tot.forEach((t, i) => { const v = t / n + (P.noise ? (rng() - 0.5) * P.noise * 2 : 0); if (v > bv) { bv = v; bi = i; } });
        return hand[bi].id;
      }
      const tot = new Array(hand.length).fill(0); let n = 0;
      for (let k = 0; k < P.samples; k++) {
        const g2 = AI.determinize(game, pid, rng);
        const base = {};
        for (const q of act) {
          const dq = s.decls[act.find((x) => x !== q)];
          base[q] = heurPlay(g2, q, dq ? dq.num : null, P.trust, rng, 0.05);
          const dd = s.decls[q];
          if (dd && dd.num != null && rng() < P.trust) {
            const hc = g2.s.players[q].hand.find((c) => c.v === dd.num);
            if (hc && base[q]) { if (hc.id === base[q].selfId) base[q].selfId = base[q].coupleId; base[q].coupleId = hc.id; }
          }
        }
        if (!base[act[0]] || !base[act[1]]) continue;
        n++;
        hand.forEach((c, i) => { tot[i] += simulate(g2, base, c, pid, P); });
      }
      if (!n) return hand[0].id;
      let bi = 0, bv = -Infinity;
      tot.forEach((t, i) => { const v = t / n + (P.noise ? (rng() - 0.5) * P.noise * 2 : 0); if (v > bv) { bv = v; bi = i; } });
      return hand[bi].id;
    }

    // Cromozapd: scelta del colore (= regola in vigore). Euristica: da escluso preferisco Silenzio (nessuna dichiarazione, X coperta),
    // da attivo Luce (la carta dell'escluso è scoperta); se non ho effetti e ne hanno gli altri, Effetti vietati.
    function decideColor(game, d) {
      const R = game.rules, s = game.s, pid = d.player;
      if (P.samples <= 0 || rng() < P.random) return rnd(4);
      const col = (rule) => (R.colorRuleMap || []).indexOf(rule);
      const isEx = s.excluded === pid;
      const hasEff = (q) => s.players[q].eff.length;
      if (!isEx && !hasEff(pid) && [0, 1, 2].some((q) => q !== pid && hasEff(q) >= 1) && col('effetti') >= 0) return col('effetti');
      const want = isEx ? ['carnevale', 'silenzio', 'effetti', 'luce'] : ['luce', 'effetti', 'silenzio', 'carnevale'];
      for (const r of want) if (col(r) >= 0) return col(r);
      return rnd(4);
    }

    // variante: carta "Lente" — conviene guardare la carta dell'escluso rinunciando a parlare?
    function decideLente(game, d) {
      const pid = d.player, s = game.s, ex = s.excluded;
      if (P.samples <= 0 || rng() < P.random) return rng() < 0.3;
      const act = [0, 1, 2].filter((i) => i !== ex), partner = act.find((x) => x !== pid);
      let gain = 0, n = 0;
      for (let k = 0; k < Math.max(4, Math.ceil(P.samples / 2)); k++) {
        const g2 = AI.determinize(game, pid, rng);
        const eh = g2.s.players[ex].hand;
        let xcard = null;
        if (s.xDecl != null && rng() < (s.carnival ? P.trust * 0.35 : P.trust)) xcard = eh.find((c) => c.v === s.xDecl);
        if (!xcard) xcard = eh.find((c) => c.id === heurX(g2, ex, rng, 0.1));
        if (!xcard) continue;
        n++;
        const run = (know) => {
          const g3 = g2.clone(); g3.s.xPick = xcard;
          const base = {};
          if (know) g3.s.lensBy = pid;
          base[pid] = heurPlay(g3, pid, null, P.trust, rng, 0.05);
          base[partner] = heurPlay(g3, partner, know ? null : null, P.trust, rng, 0.05);
          if (!base[pid] || !base[partner]) return null;
          return simulate(g3, base, xcard, pid, P);
        };
        const a = run(false), b2 = run(true);
        if (a == null || b2 == null) continue;
        gain += b2 - a;
      }
      return n ? gain / n > 0.15 : false;   // soglia: il costo del silenzio e della carta
    }

    // variante: carta "Baratto" — peschi alla cieca una carta dall'escluso e gli dai una tua
    function decideBaratto(game, d) {
      const pid = d.player, s = game.s, hand = d.hand, ex = s.excluded, see = !!d.see;
      if (P.samples <= 0 || rng() < P.random) { if (rng() >= 0.3) return null; const gv = hand[rnd(hand.length)].id; return see ? { give: gv, take: d.xhand[rnd(d.xhand.length)].id } : gv; }
      const act = [0, 1, 2].filter((i) => i !== ex);
      const nTake = see ? d.xhand.length : 1;
      const nOpt = 1 + hand.length * nTake;
      const tot = new Array(nOpt).fill(0); let n = 0;
      for (let k = 0; k < Math.max(4, Math.ceil(P.samples / 2)); k++) {
        const g2 = AI.determinize(game, pid, rng);
        const xo2 = g2.s.players[ex];
        let xcard = s.xFirstCard;
        if (see) {   // la mano dell'escluso (tolta la carta già giocata) è NOTA: ce la mostra
          const poolIds = new Set(d.xhand.map((c) => c.id));
          const fixed = d.xhand.slice();
          if (!xcard) {
            let cand = xo2.hand.find((c) => !poolIds.has(c.id) && s.xDecl != null && c.v === s.xDecl && rng() < P.trust) || xo2.hand.find((c) => !poolIds.has(c.id)) || g2.s.deck.find((c) => !c.z && !poolIds.has(c.id));
            if (!cand) continue;
            xcard = cand; xo2.hand = [cand, ...fixed];
          } else xo2.hand = fixed;
        } else if (!xcard) {
          if (s.xDecl != null && rng() < P.trust) xcard = xo2.hand.find((c) => c.v === s.xDecl);
          if (!xcard) xcard = xo2.hand.find((c) => c.id === heurX(g2, ex, rng, 0.1));
        }
        if (!xcard) continue;
        const pool = see ? d.xhand.map((c) => c.id) : xo2.hand.filter((c) => c.id !== xcard.id).map((c) => c.id);
        if (!pool.length) continue;
        n++;
        const blindTake = pool[Math.floor(rng() * pool.length)];
        for (let i = 0; i < nOpt; i++) {
          const g3 = g2.clone();
          if (i > 0) {
            const gIdx = Math.floor((i - 1) / nTake), tIdx = (i - 1) % nTake;
            const tid = see ? pool[tIdx] : blindTake;
            const me = g3.s.players[pid], xo = g3.s.players[ex];
            const gi = me.hand.findIndex((c) => c.id === hand[gIdx].id), ti = xo.hand.findIndex((c) => c.id === tid);
            if (gi < 0 || ti < 0) continue;
            const gc = me.hand[gi]; me.hand.splice(gi, 1, xo.hand[ti]); xo.hand.splice(ti, 1, gc);
            const ei = me.eff.findIndex((e) => e.k === 'baratto'); if (ei >= 0) me.eff.splice(ei, 1);
          }
          const base = {};
          for (const q of act) base[q] = heurPlay(g3, q, null, P.trust, rng, 0.05);
          if (!base[act[0]] || !base[act[1]]) continue;
          tot[i] += simulate(g3, base, xcard, pid, P);
        }
      }
      if (!n) return null;
      let bi = 0, bv = -Infinity;
      tot.forEach((t, i) => { const v = t / n + (P.noise ? (rng() - 0.5) * P.noise * 2 : 0); if (v > bv) { bv = v; bi = i; } });
      if (bi === 0) return null;
      const gIdx = Math.floor((bi - 1) / nTake), tIdx = (bi - 1) % nTake;
      return see ? { give: hand[gIdx].id, take: d.xhand[tIdx].id } : hand[gIdx].id;
    }

    // variante: carta "Cambio centrale"
    function decideCambio(game, d) {
      const pid = d.player, s = game.s, hand = d.hand, ex = s.excluded;
      if (P.samples <= 0 || rng() < P.random) return rng() < 0.3 ? hand[rnd(hand.length)].id : null;
      const act = [0, 1, 2].filter((i) => i !== ex);
      const tot = new Array(hand.length + 1).fill(0); let n = 0;
      for (let k = 0; k < P.samples; k++) {
        const g2 = AI.determinize(game, pid, rng);
        let xcard = s.xFirstCard;
        if (!xcard) {
          const eh = g2.s.players[ex].hand;
          if (s.xDecl != null && rng() < (s.carnival ? P.trust * 0.35 : P.trust)) xcard = eh.find((c) => c.v === s.xDecl);
          if (!xcard) xcard = eh.find((c) => c.id === heurX(g2, ex, rng, 0.1));
        }
        if (!xcard) continue;
        n++;
        for (let i = 0; i <= hand.length; i++) {
          const g3 = g2.clone();
          if (i > 0) {
            const me = g3.s.players[pid], idx = me.hand.findIndex((c) => c.id === hand[i - 1].id);
            if (idx < 0) continue;
            const c = me.hand[idx]; if (game.rules.cambioDiscard) { me.hand.splice(idx, 1); g3.s.discard.push(g3.s.center); } else me.hand.splice(idx, 1, g3.s.center); g3.s.center = c;
            const ei = me.eff.findIndex((e) => e.k === 'cambio'); if (ei >= 0) me.eff.splice(ei, 1);
          }
          const base = {};
          for (const q of act) base[q] = heurPlay(g3, q, null, P.trust, rng, 0.05);
          if (!base[act[0]] || !base[act[1]]) continue;
          tot[i] += simulate(g3, base, xcard, pid, P);
        }
      }
      if (!n) return null;
      let bi = 0, bv = -Infinity;
      tot.forEach((t, i) => { const v = t / n + (P.noise ? (rng() - 0.5) * P.noise * 2 : 0); if (v > bv) { bv = v; bi = i; } });
      return bi === 0 ? null : hand[bi - 1].id;
    }

    function decideAnnulla(game, d) {
      const pid = d.player;
      if (rng() < P.annullaP) return d.targets[rnd(d.targets.length)].idx;
      if (P.samples <= 0) return null;
      const opts = [null, ...d.targets.map((t) => t.idx)];
      const tot = new Array(opts.length).fill(0);
      const myAnn = d.eff.find((e) => e.k === 'annulla');
      for (let k = 0; k < Math.max(2, Math.ceil(P.samples / 2)); k++) {
        const g2 = AI.determinize(game, pid, rng);
        opts.forEach((o, i) => {
          const g = g2.clone();
          if (o != null) {
            g.s.lastPlay.fila[o].annulled = true;
            const me = g.s.players[pid]; me.eff.splice(me.eff.findIndex((e) => e.id === myAnn.id), 1);
          }
          FF.drive(g, g.resolvePhase(), simPolicy);
          tot[i] += evalU(g, pid, P);
        });
      }
      const n = Math.max(2, Math.ceil(P.samples / 2));
      let bi = 0, bv = tot[0] / n;
      for (let i = 1; i < opts.length; i++) { const v = tot[i] / n - P.annullaGain; if (v > bv) { bv = v; bi = i; } } // tenere Annulla per dopo ha un valore
      return opts[bi];
    }

    const decl = (game, d) => {
      // dichiarazione: la carta che penso di giocare (sincera, salvo il livello facile) e il modificatore
      const plan = planActive(game, d, true, Math.max(2, Math.ceil(P.samples / 2)));
      const out = { num: null, mod: null };
      if (!plan) return out;
      const hand = d.hand, c = hand.find((x) => x.id === plan.couple);
      out.num = c ? c.v : null;
      const e = plan.eff != null ? d.eff.find((x) => x.id === plan.eff) : null;
      if (e && EFFECTS[e.k].mod) { const m = EFFECTS[e.k].mod; out.mod = d.sincero ? { dir: m.dir, n: m.n } : { dir: m.dir, size: VAGUE[m.n] }; }
      if (P.lie && rng() < P.lie) { out.num = 1 + rnd(game.rules.maxValue); if (rng() < 0.5) out.mod = null; }
      if (rng() < P.random * 0.3) out.num = null;
      return out;
    };

    const api = {
      level, params: P,
      decide(game, d) {
        switch (d.type) {
          case 'sincero': {
            const hasMod = d.eff.some((e) => EFFECTS[e.k].mod);
            return rng() < (level === 'hard' ? (hasMod ? 0.5 : P.sinceroP) : P.sinceroP);
          }
          case 'declare': return decl(game, d);
          case 'play': {
            const plan = planActive(game, d, true);
            if (!plan) return { couple: d.hand[0].id, self: d.hand[1 % d.hand.length].id, eff: null };
            return { couple: plan.couple, self: plan.self, eff: plan.eff };
          }
          case 'xplay': return decideXplay(game, d);
          case 'cambio': return decideCambio(game, d);
          case 'baratto': return decideBaratto(game, d);
          case 'colorpick': return decideColor(game, d);
          case 'lente': return decideLente(game, d);
          case 'xdecl': return planXHidden(game, d).decl;
          case 'correct': { // variante modTiming 'after': conviene spendere la carta per salvare i punti della coppia?
            if (level === 'easy' && rng() < 0.5) return null;
            const g0 = game.clone(), g1 = game.clone(), s1 = g1.s, ex = d.excluded, lp = s1.lastPlay;
            const act = [0, 1, 2].filter((i) => i !== ex);
            s1.pairPts[ex] += d.pts; s1.contrib[act[0]][ex] += lp.plays[act[0]].couple.v; s1.contrib[act[1]][ex] += lp.plays[act[1]].couple.v; s1.contrib[ex][ex] += lp.xcard.v;
            const left = Math.max(0, Math.min(1, turnsLeftEst(game) / 12));
            const gain = evalU(g1, d.player, P) - evalU(g0, d.player, P), cost = (P.holdW || 0.2) * left + 0.1;
            if (gain <= cost) return null;
            const best = d.opts.slice().sort((x, y) => Math.abs(x.delta) - Math.abs(y.delta))[0]; // la carta più piccola che basta
            return game.rules.modFlex ? { id: best.id, delta: best.delta } : best.id;
          }
          case 'annulla': return decideAnnulla(game, d);
          case 'effdraw': return level === 'easy' ? rng() < 0.5 : true;
        }
        return null;
      },
    };
    return api;
  };

  // suggerimento per un giocatore umano (usa il livello difficile)
  AI.suggest = function (game, d) {
    const ai = AI.create('hard', 'suggest-' + game.s.turn + '-' + d.player);
    if (d.type === 'play') return ai.decide(game, d);
    if (d.type === 'xplay') return { couple: ai.decide(game, d) };
    return null;
  };

  AI.evalU = evalU; AI.softFactor = softFactor; AI.heurPlay = heurPlay;
})(typeof window !== 'undefined' ? window : globalThis);
