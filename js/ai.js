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
    easy: { samples: 0, random: 0.75, noise: 0, trust: 0.6, honest: false, lie: 0.25, holdW: 0, handW: 0.3, exclW: 0, oppW: 0.3, betrayGain: 99, effBonus: 0.05, sinceroP: 0.1, annullaP: 0.25, annullaGain: 0 },
    medium: { samples: 2, random: 0.15, noise: 1.2, trust: 0.75, honest: true, lie: 0, holdW: 0.2, handW: 0.5, exclW: 0, oppW: 0.4, betrayGain: 99, effBonus: 0.12, sinceroP: 0.3, annullaP: 0, annullaGain: 0.6 },
    hard: { samples: 14, random: 0, noise: 0.05, trust: 0.85, honest: false, lie: 0, holdW: 0.25, handW: 0.5, exclW: 2.0, oppW: 0.5, betrayGain: 0.6, effBonus: 0.12, sinceroP: 0.25, annullaP: 0, annullaGain: 0.3 },
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
    const unknown = FF.buildDeck(game.rules).filter((c) => !known.has(c.id));
    // le Zapd non stanno mai in mano (si risolvono appena pescate): le mani ricampionate hanno solo carte numeriche
    const nums = shuffle(unknown.filter((c) => !c.z)), zaps = unknown.filter((c) => c.z);
    for (const q of [0, 1, 2]) {
      if (q === pid) continue;
      const n = game.s.players[q].hand.length;
      s.players[q].hand = nums.splice(0, n);
    }
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
  function softFactor(g, p) {
    const s = g.s; let sum = 0;
    for (let e = 0; e < 3; e++) sum += s.pairPts[e] > 0 ? s.contrib[p][e] / s.pairPts[e] : 1 / 3;
    return sum / 3;
  }
  // Punteggio PROIETTATO a fine partita: i punti personali e la quota in ogni coppia si diluiscono con i turni che restano.
  // (Senza proiezione, una carta alta data alla coppia sembra aumentare il Fattore molto più di quanto farà davvero.)
  const PROJ = { selfAvg: 6.3, pairPerTurn: 4.1 };
  function projScore(g, p) {
    const s = g.s, turnsLeft = Math.max(0, g.totalZaps - s.zapsDrawn) * 1.03 + (s.zapsDrawn >= g.totalZaps ? 0 : 0.5);
    const Tf = turnsLeft * PROJ.pairPerTurn;
    let sum = 0;
    for (let e = 0; e < 3; e++) sum += (s.contrib[p][e] + Tf / 3) / (s.pairPts[e] + Tf || 1);
    return (s.players[p].personal + turnsLeft * (2 / 3) * PROJ.selfAvg) * (sum / 3);
  }
  let useProj = true;
  const softScore = (g, p) => (useProj ? projScore(g, p) : g.s.players[p].personal * softFactor(g, p));

  // valore dello stato per `pid` (più alto = meglio). P = parametri del livello.
  function evalU(g, pid, P) {
    useProj = P.proj !== false;
    const s = g.s, opp = [0, 1, 2].filter((i) => i !== pid);
    const f = softFactor(g, pid);
    const left = Math.max(0, Math.min(1, (g.totalZaps - s.zapsDrawn) / 12));
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
  function pInRange(v, lo, hi, partnerNum, trust, max) {
    let uni = 0; for (let w = 1; w <= max; w++) if (v + w >= lo && v + w <= hi) uni++;
    uni /= max;
    if (partnerNum == null) return uni;
    const inDecl = v + partnerNum >= lo && v + partnerNum <= hi ? 1 : 0;
    return trust * inDecl + (1 - trust) * uni;
  }
  // giocata euristica per un attivo: carta-coppia che tiene la somma nel range (data la dichiarazione del compagno), carta-sé la più alta
  function heurPlay(g, pid, partnerNum, trust, rng, randomP) {
    const s = g.s, p = s.players[pid], hand = p.hand, R = g.rules, c0 = s.center.v;
    if (hand.length < 2) return null;
    if (rng() < randomP) {
      const i = Math.floor(rng() * hand.length); let j = Math.floor(rng() * (hand.length - 1)); if (j >= i) j++;
      const fl = fila(p.eff);
      return { coupleId: hand[i].id, selfId: hand[j].id, effId: fl.length && rng() < 0.3 ? fl[Math.floor(rng() * fl.length)].id : null };
    }
    let best = null, bv = -Infinity;
    const effOpts = [null, ...fila(p.eff)];
    for (const c of hand) for (const sf of hand) {
      if (c === sf) continue;
      for (const e of effOpts) {
        const m = e && EFFECTS[e.k].mod;
        const lo = c0 - (m && m.dir === 'lo' ? m.n : 0), hi = c0 + R.base + (m && m.dir === 'hi' ? m.n : 0);
        const pin = pInRange(c.v, lo, hi, partnerNum, trust, R.maxValue);
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
      for (const e of fila(d.eff)) if (!seen.has(e.k)) { seen.add(e.k); effOpts.push(e); }
      const cands = [];
      for (const c of hand) for (const sf of hand) if (c !== sf) for (const e of effOpts) cands.push({ c, sf, e });
      const tot = new Array(cands.length).fill(0);
      for (let k = 0; k < NS; k++) {
        const g2 = AI.determinize(game, pid, rng);
        conditionHand(g2, partner, pnum, P.trust, rng);
        // gli altri giocano secondo il modello
        const base = {};
        base[partner] = heurPlay(g2, partner, mydecl ? mydecl.num : null, P.trust, rng, 0.05);
        const xid = heurX(g2, ex, rng, 0.1);
        const xcard = g2.s.players[ex].hand.find((c) => c.id === xid);
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

    function decideXplay(game, d) {
      const pid = d.player, s = game.s, ex = pid;
      const hand = d.hand;
      if (!hand.length) return null;
      if (P.samples <= 0 || rng() < P.random) return rng() < P.random * 0.5 ? hand[rnd(hand.length)].id : heurX(game, pid, rng, 0);
      const act = [0, 1, 2].filter((i) => i !== ex);
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
