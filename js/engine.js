/* CROMOZAPD — motore di gioco.
   - Nessuna UI: tutto lo stato è in `game.s` (JSON puro, clonabile).
   - La partita è un generatore: `game.run()` fa `yield` di "decisioni" ({type:'declare'|'play'|...})
     e riceve la risposta; con `cfg.beats` emette anche {type:'beat'} dopo ogni evento (per animare).
   - RNG con seed → partite riproducibili. Le risposte date vengono registrate in `game.history`
     e si possono rigiocare con `cfg.replay`.
   - La cima del mazzo è l'ULTIMO elemento dell'array (`pop`).
   Le interpretazioni delle regole ambigue sono elencate in docs/REGOLAMENTO.md */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const { COLORS, EFFECTS, VAGUE } = FF;

  const mod3 = (a) => ((a % 3) + 3) % 3;

  FF.hashSeed = function (x) {
    if (typeof x === 'number') return x | 0;
    let h = 2166136261;
    const s = String(x);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h | 0;
  };
  // mulberry32 con stato esterno (usato dalle AI e dai test)
  FF.makeRng = function (seed) {
    let a = FF.hashSeed(seed);
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const pairLabel = (e) => [0, 1, 2].filter((i) => i !== e).map((i) => FF.SEATS[i]).join('');
  FF.pairLabel = pairLabel;
  const modTxt = (m) => (!m ? 'nessuno' : m.n != null ? (FF.DEFAULT_RULES.modMode === 'widen' ? `±${m.n}` : `${m.dir === 'hi' ? '+' : '−'}${m.n}`) : (FF.DEFAULT_RULES.modMode === 'widen' ? `allarga il range (${m.size})` : `${m.dir === 'hi' ? 'verso l\'alto' : 'verso il basso'} (${m.size})`));
  FF.modTxt = modTxt;

  function newStats() { return { p: [{}, {}, {}], g: {} }; }

  class Game {
    /* cfg: { seed, rules, players:[{name,kind,level} ×3], beats, log, stats, replay } */
    constructor(cfg) {
      cfg = cfg || {};
      this.cfg = cfg;
      this.rules = Object.assign({}, FF.DEFAULT_RULES, cfg.rules || {});
      this.rules.effectCopies = Object.assign({}, FF.DEFAULT_RULES.effectCopies, (cfg.rules && cfg.rules.effectCopies) || {});
      this.logOn = cfg.log !== false;
      this.statsOn = cfg.stats !== false;
      this.beats = !!cfg.beats;
      this.events = [];
      this.history = [];
      this.replay = (cfg.replay || []).slice();
      this.stats = newStats();
      this.result = null;
      this.onEvent = null;
      this.s = this._setup(cfg);
    }

    get totalZaps() { return 4 * this.rules.zapPerColor; }

    clone() {
      const g = Object.create(Game.prototype);
      g.cfg = {}; g.rules = this.rules; g.logOn = false; g.statsOn = false; g.beats = false;
      g.events = []; g.history = []; g.replay = []; g.stats = newStats(); g.result = null; g.onEvent = null;
      const t = this.s; // le carte sono oggetti immutabili: si condividono, si copiano solo gli array
      g.s = Object.assign({}, t, {
        deck: t.deck.slice(), discard: t.discard.slice(), zapPile: t.zapPile.slice(), effDeck: t.effDeck.slice(), effDiscard: t.effDiscard.slice(),
        traitorDeck: (t.traitorDeck || []).slice(),
        players: t.players.map((p) => Object.assign({}, p, { hand: p.hand.slice(), eff: p.eff.slice(), traitor: (p.traitor || []).slice() })),
        pending: t.pending.slice(), pairPts: t.pairPts.slice(), contrib: t.contrib.map((r) => r.slice()),
        decls: t.decls.slice(), lastPlay: t.lastPlay ? Object.assign({}, t.lastPlay, { fila: t.lastPlay.fila.map((f) => Object.assign({}, f)) }) : null,
      });
      return g;
    }

    // ───────────────────────── setup ─────────────────────────
    _setup(cfg) {
      const s = { rng: FF.hashSeed(cfg.seed == null ? Date.now() : cfg.seed) };
      this.s = s;
      s.deck = this._shuffle(FF.buildDeck(this.rules));
      s.discard = []; s.zapPile = [];
      s.effDeck = this._shuffle(FF.buildEffectDeck(this.rules));
      s.effDiscard = [];
      // colore dominante di partenza: il colore della prima Zapd che esce, poi si rimescola tutto
      let c = 0;
      for (let i = s.deck.length - 1; i >= 0; i--) if (s.deck[i].z) { c = s.deck[i].c; break; }
      s.dominant = c;
      this._shuffle(s.deck);
      const pl = cfg.players || [];
      s.players = [0, 1, 2].map((i) => {
        const p = pl[i] || {};
        return { id: i, name: p.name || FF.SEATS[i], kind: p.kind || 'ai', level: p.level || null, hand: [], eff: [], personal: 0, traitor: [] };
      });
      s.excluded = this.rules.startExcluded >= 0 ? this.rules.startExcluded % 3 : this.randInt(3); // a sorte (riproducibile dal seed) se < 0
      s.startExcluded = s.excluded; s.dir = this.rules.startDir;
      s.zapsDrawn = 0; s.pending = [];
      s.turn = 0; s.phase = 'setup'; s.over = false;
      s.center = null; s.nextCenter = null;
      s.sincero = null; s.decls = [null, null, null]; s.lastPlay = null;
      s.xDecl = null; s.traitorDeck = this.rules.traitor ? this._shuffle(this.rules.traitorCards.slice()) : [];
      s.pairPts = [0, 0, 0];          // indicizzato per ESCLUSO: coppia = gli altri due
      s.contrib = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // contrib[giocatore][escluso]
      return s;
    }

    // ───────────────────────── utilità ─────────────────────────
    rand() {
      const s = this.s;
      const a = (s.rng + 0x6D2B79F5) | 0; s.rng = a;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    randInt(n) { return Math.floor(this.rand() * n); }
    _shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = this.randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    pn(pid) { return `${FF.SEAT_ICONS[pid]} ${this.s.players[pid].name}`; }
    seatName(pid) { return FF.SEATS[pid]; }
    actives() { return [0, 1, 2].filter((i) => i !== this.s.excluded); }
    dirTxt(d) { return d > 0 ? '↻ A→B→C' : '↺ A→C→B'; }
    col(c) { return `${COLORS[c].i} ${COLORS[c].n}`; }

    stat(name, pid, n) {
      if (!this.statsOn) return;
      n = n == null ? 1 : n;
      if (pid == null || pid < 0) this.stats.g[name] = (this.stats.g[name] || 0) + n;
      else this.stats.p[pid][name] = (this.stats.p[pid][name] || 0) + n;
    }

    emit(k, text, p, data) {
      if (!this.logOn) return null;
      const ev = { i: this.events.length, t: this.s.turn, ph: this.s.phase, k, p: p == null ? -1 : p, text, d: data };
      this.events.push(ev);
      if (this.onEvent) this.onEvent(ev);
      return ev;
    }
    // ritorna un "beat" da yieldare (solo in modalità animata) oppure null
    say(k, text, p, data) { const ev = this.emit(k, text, p, data); return this.beats && ev ? { type: 'beat', ev } : null; }

    // ───────────────────────── punteggio ─────────────────────────
    // Fattore coppie: media dei contributi % nelle coppie con totale > 0 (frazione 0..1)
    factor(pid) {
      const s = this.s; let sum = 0, n = 0;
      for (let e = 0; e < 3; e++) if (s.pairPts[e] > 0) { sum += s.contrib[pid][e] / s.pairPts[e]; n++; }
      return n ? sum / n : 0;
    }
    score(pid) { return this.s.players[pid].personal * this.factor(pid); }
    teamPts() { return this.s.pairPts.slice(); }

    // ───────────────────────── decisioni ─────────────────────────
    // Chiede una decisione al controller (o dalla coda di replay) e registra la risposta.
    *ask(dec) {
      let ans;
      if (this.replay.length) ans = this.replay.shift();
      else ans = yield dec;
      this.history.push(ans);
      return ans;
    }

    // ───────────────────────── pesca e Zapd ─────────────────────────
    _draw() {
      const s = this.s;
      if (!s.deck.length && s.discard.length) {
        s.deck = this._shuffle(s.discard); s.discard = [];
        this.emit('sys', '🔀 Il mazzo è finito: si rimescolano gli scarti numerici.');
        this.stat('rimescolo', -1);
      }
      return s.deck.length ? s.deck.pop() : null;
    }

    // Risolve una Zapd appena uscita. defer = true: effetti dal turno dopo (Zapd da "Prossima carta").
    *zap(card, defer, who) {
      const s = this.s;
      s.zapPile.push(card); s.zapsDrawn++;
      this.stat('zapd', -1);
      let b;
      if (defer) {
        s.pending.push(card.c);
        b = this.say('zap', `⚡ Esce una Zapd ${this.col(card.c)} da "Prossima carta" (${s.zapsDrawn}/${this.totalZaps}). Colore dominante e escluso cambieranno dal turno dopo.`, -1, { zap: card.c });
      } else {
        const from = s.excluded, d0 = s.dir;
        s.dominant = card.c; s.excluded = mod3(s.excluded + s.dir);
        if (this.rules.zapFlipsDir) s.dir = -s.dir;
        b = this.say('zap', `⚡ Zapd ${this.col(card.c)} (${s.zapsDrawn}/${this.totalZaps})${who != null ? ' pescata da ' + this.pn(who) : ''}: il colore dominante diventa ${this.col(card.c)}, il gettone escluso passa da ${this.seatName(from)} a ${this.seatName(s.excluded)} (verso ${this.dirTxt(d0)})${this.rules.zapFlipsDir ? ` e il verso si inverte: ora ${this.dirTxt(s.dir)}` : ''}.`, -1, { zap: card.c });
      }
      if (b) yield b;
    }

    // pesca una carta NUMERICA risolvendo le Zapd che escono (le ripesca)
    *drawNumeric(defer, who) {
      for (let guard = 0; guard < 200; guard++) {
        const c = this._draw();
        if (!c) return null;
        if (c.z) yield* this.zap(c, defer, who); else return c;
      }
      return null;
    }

    *fillHand(pid) {
      const p = this.s.players[pid]; let n = 0;
      while (p.hand.length < this.rules.handSize) {
        const c = yield* this.drawNumeric(false, pid);
        if (!c) break;
        p.hand.push(c); n++;
      }
      return n;
    }

    // ───────────────────────── partita ─────────────────────────
    *setupGen() {
      const s = this.s;
      let b = this.say('sys', `🎮 Partita iniziata — seed ${this.cfg.seed}. Colore dominante di partenza: ${this.col(s.dominant)}. Escluso iniziale${this.rules.startExcluded < 0 ? ' (estratto a sorte)' : ''}: ${this.seatName(s.excluded)}, verso ${this.dirTxt(s.dir)}.`);
      if (b) yield b;
      for (let pid = 0; pid < 3; pid++) yield* this.fillHand(pid);
      b = this.say('sys', '🃏 Ogni giocatore ha ricevuto 3 carte.');
      if (b) yield b;
    }

    *run() {
      const s = this.s;
      yield* this.setupGen();
      for (;;) {
        s.turn++;
        yield* this.turnGen();
        if (s.over) break;
        if (s.turn > 60) { s.over = true; this.emit('warn', '⚠ Partita interrotta: troppi turni.'); break; }
      }
      yield* this.finish();
      return this.result;
    }

    *finish() {
      const s = this.s;
      s.phase = 'end'; s.over = true;
      const personal = s.players.map((p) => p.personal);
      const factor = [0, 1, 2].map((i) => this.factor(i));
      const scores = [0, 1, 2].map((i) => personal[i] * factor[i]);
      const top = Math.max(...scores), topPair = Math.max(...s.pairPts);
      const winners = [0, 1, 2].filter((i) => Math.abs(scores[i] - top) < 1e-9);
      const pairWinners = [0, 1, 2].filter((e) => s.pairPts[e] === topPair);
      this.result = {
        personal, factor, scores, pairPts: s.pairPts.slice(), turns: s.turn,
        winner: winners.length === 1 ? winners[0] : null, winners,
        pairWinner: pairWinners.length === 1 ? pairWinners[0] : null, pairWinners,
      };
      let b = this.say('end', `🏁 Fine partita (turno ${s.turn})! Coppie: ${[0, 1, 2].map((e) => `${pairLabel(e)} ${s.pairPts[e]}`).join(' · ')} → ${this.result.pairWinner == null ? 'PAREGGIO tra coppie' : 'vince la coppia ' + pairLabel(this.result.pairWinner)}.`);
      if (b) yield b;
      b = this.say('end', `🏆 Individuale (punti personali × Fattore coppie): ${[0, 1, 2].map((i) => `${this.pn(i)} ${personal[i]} × ${(factor[i] * 100).toFixed(0)}% = ${scores[i].toFixed(1)}`).join(' · ')} → ${this.result.winner == null ? 'PAREGGIO' : 'vince ' + this.pn(this.result.winner)}.`);
      if (b) yield b;
      return this.result;
    }

    // ───────────────────────── il turno ─────────────────────────
    *turnGen() {
      const s = this.s, R = this.rules;
      let b;
      s.sincero = null; s.decls = [null, null, null]; s.lastPlay = null; s.xDecl = null; s.xPick = null; s.lensBy = null;
      s.phase = 'draw';
      b = this.say('turn', `━━ Turno ${s.turn} · Zapd uscite ${s.zapsDrawn}/${this.totalZaps} ━━`);
      if (b) yield b;

      // 0) l'escluso avanza di un posto a ogni turno (dal 2°), oltre che a ogni Zapd
      if (R.rotateEachTurn && s.turn > 1) {
        const from = s.excluded; s.excluded = mod3(from + s.dir);
        this.stat('rotazioni_di_turno', -1);
        b = this.say('rotate', `🔁 Nuovo turno: il gettone escluso passa da ${this.seatName(from)} a ${this.seatName(s.excluded)} (verso ${this.dirTxt(s.dir)}). Se esce una Zapd avanzerà ancora (e il verso si inverte).`, -1, { from, to: s.excluded });
        if (b) yield b;
      }

      // 1) pesca: rimpiazzi in ordine A, B, C, poi la carta centrale
      for (let pid = 0; pid < 3; pid++) {
        const n = yield* this.fillHand(pid);
        if (n) { b = this.say('draw', `🃏 ${this.pn(pid)} pesca ${n} ${n === 1 ? 'carta' : 'carte'} e torna a ${R.handSize}.`, pid); if (b) yield b; }
      }
      if (s.nextCenter) {
        s.center = s.nextCenter; s.nextCenter = null;
        this.stat('centrale_da_prossima', -1);
      } else s.center = yield* this.drawNumeric(false, null);
      if (!s.center) { s.over = true; this.emit('warn', '⚠ Carte finite: partita conclusa.'); return; }
      const ex = s.excluded, act = this.actives();
      const XF = FF.xFirst(R); s.xFirstCard = null;   // VARIANTE (solo simulazione): l'escluso gioca per primo, scoperto, e la sua carta X decide il range [V−X, V+X]
      if (XF) {
        b = this.say('center', `🎯 Carta centrale: ${FF.cardName(s.center)}. Il range lo decide la carta dell'escluso (X): ${R.rangeMode === 'xsum' ? 'da V a V+X' : 'da V−X a V+X'}. Colore dominante: ${this.col(s.dominant)}.`, -1, { center: s.center });
        if (b) yield b;
        const xd = yield* this.ask(this._dec('xplay', ex, { decls: [], first: true }));
        const xh = s.players[ex].hand, xi = Math.max(0, xh.findIndex((c) => c.id === xd));
        s.xFirstCard = xh.splice(xi, 1)[0];
        const [xr0, xr1] = FF.rangeBase(R, s.center.v, s.xFirstCard.v);
        b = this.say('center', `🂡 ${this.pn(ex)} (escluso) gioca per primo, scoperto, ${FF.cardName(s.xFirstCard)}: range da ${xr0} a ${xr1}.`, ex, { card: s.xFirstCard, x: true });
      } else
      b = this.say('center', `🎯 Carta centrale: ${FF.cardName(s.center)} → range da ${FF.rangeBase(R, s.center.v)[0]} a ${FF.rangeBase(R, s.center.v)[1]} (${R.rangeMode === 'pivot' ? 'centrato su ' + R.pivot : 'Base ' + R.base}): la somma delle due carte-per-la-coppia${R.xInSum ? ' + la carta dell\'escluso' : ''} deve starci dentro. Colore dominante: ${this.col(s.dominant)}.`, -1, { center: s.center });
      if (b) yield b;
      b = this.say('roles', `👥 Coppia ${pairLabel(ex)} (attivi) · escluso: ${this.pn(ex)}. ${FF.xHidden(R) ? 'L\'escluso dichiara una carta e poi la gioca coperta: decide il range, che si scopre al reveal' : FF.xFirst(R) ? 'L\'escluso ha già giocato scoperta la carta che decide il range' : 'L\'escluso gioca 1 carta per la coppia' + (R.xInSum ? ': la sua carta conta nella somma del range' : '')}; ascolta la discussione ma non parla.`, ex, { excluded: ex });
      if (b) yield b;
      this.stat('turni', -1);
      if (FF.xHidden(R)) {   // VARIANTE: l'escluso dichiara il numero esatto che giocherà (poi gioca coperto; potrà mentire)
        const raw = yield* this.ask(this._dec('xdecl', ex, {}));
        const xh = s.players[ex].hand;
        s.xDecl = Number.isInteger(raw) && raw >= 1 && raw <= R.maxValue ? raw : (xh[0] ? xh[0].v : 1);
        b = this.say('declare', `🚪 ${this.pn(ex)} (escluso) dichiara: «io gioco un ${s.xDecl}» — il range sarà da ${s.center.v} a ${s.center.v} + la sua carta, e si saprà solo al reveal. (Può mentire.)`, ex, { xdecl: s.xDecl });
        if (b) yield b;
      }
      if (FF.xHidden(R)) {   // l'escluso mette COPERTA la sua carta subito (potrà essere cambiata solo dalle bugie: è già decisa)
        const pk = yield* this.ask(this._dec('xplay', ex, { decls: [], early: true }));
        const xh2 = s.players[ex].hand; s.xPick = xh2.find((c) => c.id === pk) || xh2[0];
      }
      if (FF.xFirst(R) || FF.xHidden(R)) yield* this.cambioWindow();   // effetti istantanei dopo la carta dell'escluso

      // 2) Sincero (istantanea, prima della discussione)
      s.phase = 'discuss';
      b = this.say('phase', '🗨️ Fase 2 — Discussione di coppia: solo i due attivi, con una dichiarazione non vincolante (si può tradire).', -1, { phase: 'discuss' });
      if (b) yield b;
      for (const pid of act) {
        const p = s.players[pid]; const card = p.eff.find((e) => e.k === 'sincero');
        if (!card || s.sincero != null) continue;
        const use = yield* this.ask(this._dec('sincero', pid));
        if (use) {
          p.eff.splice(p.eff.indexOf(card), 1); s.effDiscard.push(card); s.sincero = pid;
          this.stat('effetto_giocato:sincero', pid);
          b = this.say('effect', `🗣️ ${this.pn(pid)} gioca SINCERO: in questo turno entrambi gli attivi dichiarano un numero esatto sul proprio modificatore; chi poi gioca un modificatore diverso da quello dichiarato lo vedrà valere 0.`, pid, { k: 'sincero' });
          if (b) yield b;
        }
      }

      // 3) discussione: dichiarazioni (la seconda vede la prima)
      for (const pid of act) {
        const other = act.find((x) => x !== pid);
        if (s.lensBy === pid) { s.decls[pid] = { num: null, mod: null }; b = this.say('declare', `🤐 ${this.pn(pid)} ha usato la Lente: non può fare dichiarazioni in questo turno.`, pid, { decl: s.decls[pid] }); if (b) yield b; continue; }
        const raw = yield* this.ask(this._dec('declare', pid, { partner: other, partnerDecl: s.decls[other] }));
        const d = this._sanitizeDecl(raw);
        s.decls[pid] = d;
        const numTxt = d.num == null ? 'Niente da dichiarare sulla carta per la coppia' : `«ti gioco il ${d.num}»`;
        b = this.say('declare', `💬 ${this.pn(pid)} dichiara: ${numTxt}${d.mod ? ` · modificatore: ${modTxt(d.mod)}` : ''}. (Non è vincolante: si può tradire.)`, pid, { decl: d });
        if (b) yield b;
      }

      // 4) gioco coperto (simultaneo: nessuno vede le scelte altrui)
      s.phase = 'play';
      b = this.say('phase', '🂠 Fase 3 — Gioco coperto: ogni attivo sceglie carta per la coppia, carta per sé ed eventuale effetto; l\'escluso ' + (FF.xFirst(R) ? 'ha già giocato la sua.' : 'gioca 1 carta.'), -1, { phase: 'play' });
      if (b) yield b;
      const plays = {};
      for (const pid of act) plays[pid] = this._sanitizePlay(pid, yield* this.ask(this._dec('play', pid, { decls: s.decls.slice() })));
      const xp = s.players[ex];
      let xcard = s.xFirstCard || s.xPick;
      if (!xcard) { xcard = yield* this.ask(this._dec('xplay', ex, { decls: s.decls.slice() })); xcard = xp.hand.find((c) => c.id === xcard) || xp.hand[0]; }

      yield* this.afterPlay(plays, xcard);
    }

    // VARIANTE: carta "Cambio centrale" — istantanea, dopo che l'escluso ha giocato: un attivo mette una carta della sua mano al posto della centrale e prende in mano la vecchia
    *cambioWindow() {
      const s = this.s; let b;
      for (const pid of this.actives()) {
        const p = s.players[pid];
        const lens = p.eff.find((e) => e.k === 'lente');
        if (lens && s.xPick && s.lensBy == null) {   // VARIANTE: Lente — guardi la carta coperta dell'escluso, ma non parli
          const use = yield* this.ask(this._dec('lente', pid, {}));
          if (use) {
            p.eff.splice(p.eff.indexOf(lens), 1); s.effDiscard.push(lens); s.lensBy = pid;
            this.stat('effetto_giocato:lente', pid); this.stat('lente', pid);
            if (s.xPick.v !== s.xDecl) this.stat('lente_smaschera', pid);
            b = this.say('effect', `🔍 ${this.pn(pid)} gioca LENTE: guarda di nascosto la carta coperta dell'escluso. In questo turno non può fare dichiarazioni.`, pid, { k: 'lente' });
            if (b) yield b;
          }
        }
        const bar = p.eff.find((e) => e.k === 'baratto');
        if (bar) {   // VARIANTE: Baratto — prendi una carta dall'escluso (alla cieca, o scelta se barattoSee) e gliene dai una tua
          const xh = s.players[s.excluded].hand, pool = xh.filter((c) => !s.xPick || c.id !== s.xPick.id);
          const see = !!this.rules.barattoSee;
          const raw = yield* this.ask(this._dec('baratto', pid, see ? { see: true, xhand: pool.slice() } : {}));
          const give = raw && typeof raw === 'object' ? raw.give : raw;
          const gc = give != null ? p.hand.find((h) => h.id === give) : null;
          if (gc && pool.length) {
            const wanted = see && raw && typeof raw === 'object' ? pool.find((c) => c.id === raw.take) : null;
            const tk = wanted || (see ? pool[0] : pool[this.randInt(pool.length)]);
            p.eff.splice(p.eff.indexOf(bar), 1); s.effDiscard.push(bar);
            p.hand.splice(p.hand.indexOf(gc), 1, tk); xh.splice(xh.indexOf(tk), 1, gc);
            this.stat('effetto_giocato:baratto', pid); this.stat('baratto', pid);
            b = this.say('effect', `🤝 ${this.pn(pid)} gioca BARATTO: ${see ? `l'escluso gli mostra la mano e ${this.pn(pid)} sceglie una carta` : `pesca alla cieca una carta`} dalla mano di ${this.pn(s.excluded)} e gliene dà una sua.`, pid, { k: 'baratto' });
            if (b) yield b;
          }
        }
        const card = p.eff.find((e) => e.k === 'cambio');
        if (!card) continue;
        const raw = yield* this.ask(this._dec('cambio', pid, {}));
        const c = raw != null ? p.hand.find((h) => h.id === raw) : null;
        if (!c) continue;
        p.eff.splice(p.eff.indexOf(card), 1); s.effDiscard.push(card);
        const old = s.center; if (this.rules.cambioDiscard) { p.hand.splice(p.hand.indexOf(c), 1); s.discard.push(old); } else p.hand.splice(p.hand.indexOf(c), 1, old); s.center = c;
        this.stat('effetto_giocato:cambio', pid); this.stat('cambio_centrale', pid);
        const rg = s.xFirstCard ? FF.rangeBase(this.rules, c.v, s.xFirstCard.v) : null;
        b = this.say('effect', `🔁 ${this.pn(pid)} gioca CAMBIO CENTRALE: mette il ${FF.cardName(c)} al posto del ${FF.cardName(old)} (${this.rules.cambioDiscard ? 'che si scarta' : 'che prende in mano'}). Nuova centrale: ${c.v}${rg ? ` → range ${rg[0]}–${rg[1]}` : ''}.`, pid, { k: 'cambio', center: c });
        if (b) yield b;
      }
    }

    // reveal, finestra di Annulla e risoluzione: separati per poterli rilanciare su un clone (modello in avanti delle AI)
    *afterPlay(plays, xcard) {
      yield* this.reveal(plays, xcard);
      yield* this.annullaWindow();
      yield* this.resolvePhase();
    }

    *reveal(plays, xcard) {
      const s = this.s, ex = s.excluded, act = this.actives(), xp = s.players[ex];
      let b;
      // 5) reveal
      s.phase = 'reveal';
      b = this.say('phase', '🔎 Fase 4 — Reveal: si scoprono tutte le carte insieme.', -1, { phase: 'reveal' });
      if (b) yield b;
      const fila = [];
      for (const pid of act) {
        const p = s.players[pid], pl = plays[pid];
        pl.couple = this._take(p.hand, pl.coupleId); pl.self = this._take(p.hand, pl.selfId);
        s.discard.push(pl.couple, pl.self);
        if (pl.effId != null) { pl.eff = this._take(p.eff, pl.effId); s.effDiscard.push(pl.eff); fila.push({ pid, eff: pl.eff, annulled: false, zeroed: false }); }
        const dn = s.decls[pid] && s.decls[pid].num;
        let betray = '';
        if (dn != null) {
          this.stat('dichiarazioni_con_numero', pid);
          if (dn !== pl.couple.v) { this.stat('tradimenti', pid); betray = ` ⚠ Ha tradito: aveva dichiarato ${dn}.`; }
        }
        b = this.say('reveal', `🔎 ${this.pn(pid)} rivela: per la coppia ${FF.cardName(pl.couple)}, per sé ${FF.cardName(pl.self)}${pl.eff ? ', effetto ' + FF.effName(pl.eff) : ''}.${betray}`, pid, { play: pl });
        if (b) yield b;
        if (pl.eff) this.stat('effetto_giocato:' + pl.eff.k, pid);
        this.stat('v_coppia_' + pl.couple.v, pid); this.stat('v_se_' + pl.self.v, pid);
      }
      if (s.xFirstCard) s.discard.push(xcard); else { this._take(xp.hand, xcard.id); s.discard.push(xcard); }
      this.stat('v_escluso_' + xcard.v, ex);
      b = this.say('reveal', `🔎 ${this.pn(ex)} (escluso) rivela: ${FF.cardName(xcard)} per la coppia ${pairLabel(ex)}.`, ex, { card: xcard, x: true });
      if (b) yield b;
      s.lastPlay = { plays, xcard, fila };
    }

    *annullaWindow() {
      const s = this.s, ex = s.excluded, fila = s.lastPlay.fila;
      let b;
      // 6) finestra di Annulla (si chiede in ordine di seduta partendo dopo l'escluso)
      for (const pid of [mod3(ex + 1), mod3(ex + 2)]) {
        const p = s.players[pid];
        const card = p.eff.find((e) => e.k === 'annulla');
        const targets = fila.map((f, idx) => ({ idx, owner: f.pid, k: f.eff.k })).filter((t) => !fila[t.idx].annulled);
        if (!card || !targets.length) continue;
        const ans = yield* this.ask(this._dec('annulla', pid, { targets }));
        const t = targets.find((x) => x.idx === ans);
        if (t) {
          fila[t.idx].annulled = true;
          p.eff.splice(p.eff.indexOf(card), 1); s.effDiscard.push(card);
          this.stat('effetto_giocato:annulla', pid); this.stat('annullato:' + fila[t.idx].eff.k, fila[t.idx].pid);
          b = this.say('effect', `🚫 ${this.pn(pid)} gioca ANNULLA su ${FF.effName(fila[t.idx].eff)} di ${this.pn(fila[t.idx].pid)}: quell'effetto non ha alcun effetto.`, pid, { k: 'annulla', target: fila[t.idx].eff.k });
          if (b) yield b;
        }
      }
    }

    *resolvePhase() {
      const s = this.s, R = this.rules, ex = s.excluded, act = this.actives(), xp = s.players[ex];
      const { plays, xcard, fila } = s.lastPlay;
      let b;
      // 7) effetti
      s.phase = 'resolve';
      b = this.say('phase', '⚖️ Fase 5 — Risoluzione: effetti, range, colore dominante e punti.', -1, { phase: 'resolve' });
      if (b) yield b;
      let sumLo = 0, sumHi = 0;
      for (const f of fila) {
        if (f.annulled) continue;
        const e = EFFECTS[f.eff.k];
        if (e.mod) {
          let m = e.mod, zero = false;
          if (s.sincero != null && this.rules.sincereZero) {
            const d = s.decls[f.pid] && s.decls[f.pid].mod;
            if (!d || (R.modMode !== 'widen' && d.dir !== m.dir) || d.n !== m.n) zero = true;
          }
          if (zero) {
            f.zeroed = true; this.stat('sincero_mentito', f.pid);
            b = this.say('effect', `🗣️ ${this.pn(f.pid)} aveva dichiarato «${modTxt(s.decls[f.pid] && s.decls[f.pid].mod)}» ma ha giocato ${e.n}: sotto Sincero quel modificatore vale 0.`, f.pid, { k: f.eff.k });
          } else {
            const nn = m.n * (R.modScale || 1), md = R.modMode || 'range';
            if (m.dir === 'lo') sumLo += nn; else sumHi += nn;
            const what = md === 'shift' ? (m.dir === 'lo' ? `la somma delle tre carte scende di ${nn}` : `la somma delle tre carte sale di ${nn}`) : md === 'widen' ? `il range si allarga di ${nn} da entrambi i lati` : (m.dir === 'lo' ? `il minimo del range scende di ${nn}` : `il massimo del range sale di ${nn}`);
            b = this.say('effect', `${e.i} ${this.pn(f.pid)}: ${e.n} → ${what}.`, f.pid, { k: f.eff.k });
          }
          if (b) yield b;
        } else if (f.eff.k === 'reverse') {
          s.dir = -s.dir;
          b = this.say('effect', `🔄 ${this.pn(f.pid)} gioca REVERSE: il verso di rotazione ora è ${this.dirTxt(s.dir)}. La prossima Zapd sposterà l'escluso nell'altra direzione.`, f.pid, { k: 'reverse' });
          if (b) yield b;
        } else if (f.eff.k === 'next') {
          if (s.nextCenter) {
            b = this.say('effect', `🔮 ${this.pn(f.pid)} gioca PROSSIMA CARTA, ma ce n'è già una messa da parte: nessun effetto.`, f.pid, { k: 'next' });
          } else {
            const c = yield* this.drawNumeric(true, null);
            s.nextCenter = c;
            b = this.say('effect', `🔮 ${this.pn(f.pid)} gioca PROSSIMA CARTA: ${c ? FF.cardName(c) : 'nessuna carta'} è messa da parte, scoperta, e sarà la carta centrale del turno dopo.`, f.pid, { k: 'next', card: c });
          }
          if (b) yield b;
        } else if (f.eff.k === 'swap') {
          const p = s.players[f.pid], x = s.players[ex];
          const t = p.hand; p.hand = x.hand; x.hand = t;
          b = this.say('effect', `🔁 ${this.pn(f.pid)} gioca SCAMBIO FORZATO: scambia le sue ${x.hand.length} carte numeriche in mano con le ${p.hand.length} di ${this.pn(ex)} (che non può rifiutare).`, f.pid, { k: 'swap' });
          if (b) yield b;
        }
      }

      // 8) range e punti
      const [a, c2] = act, ca = plays[a].couple, cb = plays[c2].couple;
      const mmode = R.modMode || 'range';
      const [rb0, rb1] = FF.rangeBase(R, s.center.v, xcard.v);
      const min = rb0 - (mmode === 'range' ? sumLo : mmode === 'widen' ? sumLo + sumHi : 0), max = rb1 + (mmode === 'range' ? sumHi : mmode === 'widen' ? sumLo + sumHi : 0), sumPair = ca.v + cb.v;
      const shift = mmode === 'shift' ? sumHi - sumLo : 0;                 // variante 'shift': i modificatori spostano la somma
      const sumRaw = R.xInSum ? sumPair + xcard.v : sumPair;              // somma controllata dal range (con la carta dell'escluso)
      let sum = sumRaw + shift;
      const okFor = (x) => { const w = x >= min && x <= max; return R.rangeOutside ? !w : w; }; // variante: serve stare FUORI dal range
      let inRange = okFor(sum);
      if (R.xInSum && okFor(sumPair + shift) !== inRange) this.stat(inRange ? 'escluso_salva_la_coppia' : 'escluso_rovina_la_coppia', ex);
      // quanto contano davvero i modificatori ±: nel range solo grazie a loro, già nel range senza, o fuori comunque
      if (sumLo || sumHi || fila.some((f) => !f.annulled && EFFECTS[f.eff.k].mod)) {
        const baseW = sumRaw >= rb0 && sumRaw <= rb1, baseOk = R.rangeOutside ? !baseW : baseW;
        this.stat(baseOk ? (inRange ? 'modificatore_inutile' : 'modificatore_dannoso') : inRange ? 'modificatore_decisivo' : 'modificatore_non_basta', -1);
      }
      const immune = ca.c === s.dominant && cb.c === s.dominant;
      // VARIANTE modTiming 'after': dopo il reveal, a somma nota, un attivo può giocare un modificatore per correggere lo sforo
      if (R.modTiming === 'after' && !inRange && !immune) {
        for (const pid of [mod3(ex + 1), mod3(ex + 2)]) {
          const pl = s.players[pid], sc = R.modScale || 1;
          const opts = pl.eff.filter((e) => EFFECTS[e.k].mod).flatMap((e) => (R.modFlex ? [1, -1] : [EFFECTS[e.k].mod.dir === 'hi' ? 1 : -1]).map((sg) => ({ id: e.id, k: e.k, delta: sg * EFFECTS[e.k].mod.n * sc }))).filter((o) => okFor(sum + o.delta));
          if (!opts.length) continue;
          const ans = yield* this.ask(this._dec('correct', pid, { sum, min, max, opts, pts: sumPair + xcard.v }));
          const o = opts.find((x) => x.id === (ans && typeof ans === 'object' ? ans.id : ans) && (!(ans && typeof ans === 'object') || x.delta === ans.delta));
          if (o) {
            const card = this._take(pl.eff, o.id); s.effDiscard.push(card);
            sum += o.delta; inRange = true; this.stat('correzione_salva', pid); this.stat('effetto_giocato:' + card.k, pid);
            b = this.say('effect', `🛠️ ${this.pn(pid)} gioca ${FF.effName(card)} dopo il reveal: la somma passa da ${sum - o.delta} a ${sum} e rientra nel range ${min}–${max}.`, pid, { k: card.k });
            if (b) yield b;
            break;
          }
        }
      }
      const scored = inRange || immune;
      if (FF.xHidden(R)) {   // dichiarato vs giocato; se mente (sfori o no) → carta Traditore
        const lied = xcard.v !== s.xDecl;
        this.stat(lied ? 'escluso_mente' : 'escluso_onesto', ex);
        if (lied) {
          this.stat('bugia_scoperta', ex);
          if (R.traitor && s.traitorDeck.length) {
            const tv = s.traitorDeck.splice(this.randInt(s.traitorDeck.length), 1)[0];
            xp.traitor.push(tv); xp.personal -= tv; this.stat('carta_traditore', ex, tv);
            b = this.say('score', `🐍 ${this.pn(ex)} aveva dichiarato ${s.xDecl} ma ha giocato ${xcard.v}: pesca una carta TRADITORE da ${tv} (−${tv} ai punti personali).`, ex, { traitor: tv });
            if (b) yield b;
          }
        }
      }
      const pts = scored ? sumPair + xcard.v : 0;
      this.stat(inRange ? 'coppia_nel_range' : (immune ? 'coppia_salvata_dal_colore' : 'coppia_sfora'), -1);
      if (!inRange) this.stat(R.rangeOutside ? 'sfora_dentro' : (sum < min ? 'sfora_sotto' : 'sfora_sopra'), -1);
      for (const pid of act) s.players[pid].personal += plays[pid].self.v;
      if (scored) {
        s.pairPts[ex] += pts;
        s.contrib[a][ex] += ca.v; s.contrib[c2][ex] += cb.v; s.contrib[ex][ex] += xcard.v;
      }
      this.stat('punti_coppia', -1, pts);
      const why = R.rangeOutside ? (inRange ? `${sum} è fuori dalla zona vietata ${min}–${max}` : immune ? `${sum} è dentro la zona vietata ${min}–${max}, ma` + ` entrambe le carte sono del colore dominante: niente perdita` : `${sum} è DENTRO la zona vietata ${min}–${max} → SFORO`) : inRange ? `${sum} è dentro il range ${min}–${max}` : immune ? `${sum} è fuori dal range ${min}–${max}, ma entrambe le carte sono del colore dominante (${this.col(s.dominant)}): niente perdita` : `${sum} è ${sum < min ? 'sotto' : 'sopra'} il range ${min}–${max} → SFORO`;
      b = this.say('score', `📐 Coppia ${pairLabel(ex)}: ${ca.v} + ${cb.v}${R.xInSum ? ` + ${xcard.v} (escluso)` : ''} = ${sum}; ${why}. ${scored ? `La coppia incassa ${sumPair} + ${xcard.v} (escluso) = ${pts} (totale coppia ${s.pairPts[ex]}).` : `La coppia incassa 0 e la carta dell'escluso (${xcard.v}) non conta.`}`, -1, { sum, min, max, scored, pts, inRange, cv: [ca.v, cb.v], xv: xcard.v, selfs: act.map((pid) => plays[pid].self.v) });
      if (b) yield b;
      b = this.say('score', `⭐ Carte per sé: ${act.map((pid) => `${this.pn(pid)} +${plays[pid].self.v}`).join(' · ')} (contano sempre).`);
      if (b) yield b;

      // 9) l'escluso può pescare una carta-effetto
      if (xp.eff.length < R.effectHandMax && s.effDeck.length) {
        const yes = yield* this.ask(this._dec('effdraw', ex));
        if (yes) {
          const e = s.effDeck.pop(); xp.eff.push(e); this.stat('effetto_pescato:' + e.k, ex);
          b = this.say('effdraw', `🎴 ${this.pn(ex)} pesca una carta-effetto dal Mazzetto (ora ne ha ${xp.eff.length}).`, ex);
          if (b) yield b;
        }
      }

      // 10) fine turno: la carta centrale va negli scarti, Zapd rimandate, fine partita
      s.discard.push(s.center);
      if (s.pending.length) {
        for (const c of s.pending) { s.dominant = c; s.excluded = mod3(s.excluded + s.dir); if (this.rules.zapFlipsDir) s.dir = -s.dir; }
        b = this.say('zap', `⚡ Effetti della Zapd rimandata: colore dominante ${this.col(s.dominant)}, escluso ora ${this.pn(s.excluded)}${this.rules.zapFlipsDir ? `, verso ${this.dirTxt(s.dir)}` : ''}.`);
        s.pending = [];
        if (b) yield b;
      }
      s.phase = 'turn_end';
      if (s.zapsDrawn >= this.totalZaps) {
        s.over = true;
        b = this.say('sys', `🛑 È uscita l'ultima Zapd (${s.zapsDrawn}/${this.totalZaps}): questo era l'ultimo turno.`);
        if (b) yield b;
      }
    }

    // ───────────────────────── supporto alle decisioni ─────────────────────────
    _take(arr, id) { const i = arr.findIndex((c) => c.id === id); return arr.splice(i, 1)[0]; }

    // Descrive una decisione: contiene solo ciò che quel giocatore può sapere
    _dec(type, pid, extra) {
      const s = this.s, p = s.players[pid];
      return Object.assign({
        type, player: pid, turn: s.turn, excluded: s.excluded, center: s.center, base: this.rules.base, range: FF.rangeFor(this.rules, s.center.v, null, s.xFirstCard ? s.xFirstCard.v : undefined),
        dominant: s.dominant, sincero: s.sincero != null, hand: p.hand.slice(), eff: p.eff.slice(), xcard: s.xFirstCard || null, xdecl: s.xDecl == null ? null : s.xDecl, xseen: s.lensBy === pid && s.xPick ? s.xPick : null,
      }, extra || {});
    }

    _sanitizeDecl(raw) {
      const s = this.s, d = { num: null, mod: null };
      if (raw && Number.isInteger(raw.num) && raw.num >= 1 && raw.num <= this.rules.maxValue) d.num = raw.num;
      const m = raw && raw.mod;
      if (m && (m.dir === 'lo' || m.dir === 'hi')) {
        const n = m.n != null ? m.n : Object.keys(VAGUE).find((k) => VAGUE[k] === m.size);
        const nn = Number(n);
        if (nn >= 1 && nn <= 3) d.mod = s.sincero != null ? { dir: m.dir, n: nn } : { dir: m.dir, size: VAGUE[nn] };
      }
      return d;
    }

    // Valida le carte giocate; se non valide usa le prime carte della mano
    _sanitizePlay(pid, raw) {
      const p = this.s.players[pid], h = p.hand;
      raw = raw || {};
      let couple = h.find((c) => c.id === raw.couple), self = h.find((c) => c.id === raw.self);
      if (!couple || !self || couple.id === self.id) {
        this.emit('warn', `⚠ Giocata non valida di ${this.pn(pid)}: uso le prime due carte.`);
        couple = h[0]; self = h[1];
      }
      const eff = raw.eff != null ? p.eff.find((e) => e.id === raw.eff && EFFECTS[e.k].kind === 'fila' && !(this.rules.modTiming === 'after' && EFFECTS[e.k].mod)) : null;
      return { coupleId: couple.id, selfId: self.id, effId: eff ? eff.id : null };
    }
  }

  FF.Game = Game;
  FF.mod3 = mod3;

  // Esegue un generatore con una "policy" sincrona: policy(game, decision) → risposta.
  FF.drive = function (game, gen, policy) {
    let r = gen.next();
    while (!r.done) {
      const d = r.value;
      r = gen.next(d.type === 'beat' ? undefined : policy(game, d));
    }
    return r.value;
  };

  // Bot casuale (provvisorio): serve ai test, ai fuzz e a provare l'interfaccia. L'AI vera sta in js/ai.js.
  FF.RandomBot = function (seed) {
    const rng = FF.makeRng(seed == null ? 1 : seed);
    const pick = (a) => a[Math.floor(rng() * a.length)];
    return {
      level: 'random',
      decide(game, d) {
        switch (d.type) {
          case 'sincero': return rng() < 0.4;
          case 'declare': {
            const mods = d.eff.filter((e) => EFFECTS[e.k].mod);
            const m = mods.length && rng() < 0.7 ? pick(mods) : null;
            return { num: rng() < 0.8 ? pick(d.hand).v : null, mod: m ? (d.sincero ? { dir: EFFECTS[m.k].mod.dir, n: EFFECTS[m.k].mod.n } : { dir: EFFECTS[m.k].mod.dir, size: VAGUE[EFFECTS[m.k].mod.n] }) : null };
          }
          case 'play': {
            const h = d.hand.slice(); const a = h.splice(Math.floor(rng() * h.length), 1)[0]; const b = pick(h);
            const fila = d.eff.filter((e) => EFFECTS[e.k].kind === 'fila');
            return { couple: a.id, self: b.id, eff: fila.length && rng() < 0.5 ? pick(fila).id : null };
          }
          case 'xplay': return pick(d.hand).id;
          case 'xdecl': return 1 + Math.floor(rng() * game.rules.maxValue);
          case 'cambio': return rng() < 0.3 ? pick(d.hand).id : null;
          case 'lente': return rng() < 0.2;
          case 'baratto': { if (rng() >= 0.3) return null; const gv = pick(d.hand).id; return d.see ? { give: gv, take: pick(d.xhand).id } : gv; }
          case 'annulla': return rng() < 0.5 ? pick(d.targets).idx : null;
          case 'effdraw': return rng() < 0.6;
          case 'correct': return rng() < 0.5 ? (game.rules.modFlex ? { id: d.opts[0].id, delta: d.opts[0].delta } : d.opts[0].id) : null;
        }
        return null;
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
