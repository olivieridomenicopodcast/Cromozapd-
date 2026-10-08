/* CROMOZAPD — schermata di gioco: setup, sessione (umano / AI / passa-il-telefono / spettatore) e pannelli di decisione */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const UI = FF.UI;
  const { $, $$, esc } = UI;
  const S = FF.Sprites;
  const { COLORS, EFFECTS, VAGUE } = FF;

  // ───────────────────────── regole modificabili ─────────────────────────
  const RULE_FIELDS = [
    ['base', 'Base del range'], ['handSize', 'Carte numeriche in mano'], ['effectHandMax', 'Effetti in mano al massimo'],
    ['zapPerColor', 'Zapd per colore'], ['startExcluded', 'Escluso iniziale (0 = A, 1 = B, 2 = C)'], ['startDir', 'Verso iniziale (1 = A→B→C, −1 = inverso)'],
    ['sincereZero', 'Sincero: il modificatore sbagliato vale 0'],
  ];
  UI.rulesFields = function (prefix, values) {
    const v = Object.assign({}, FF.DEFAULT_RULES, values || {});
    const copies = Object.assign({}, FF.DEFAULT_RULES.effectCopies, v.effectCopies || {});
    let h = '<div class="rulegrid">';
    for (const [k, label] of RULE_FIELDS) {
      const def = FF.DEFAULT_RULES[k];
      if (typeof def === 'boolean') h += `<label for="${prefix}${k}">${label}</label><input type="checkbox" id="${prefix}${k}" data-rule="${k}" ${v[k] ? 'checked' : ''}>`;
      else h += `<label for="${prefix}${k}">${label} <span class="muted">(std ${def})</span></label><input type="number" id="${prefix}${k}" data-rule="${k}" value="${v[k]}" min="${k === 'startDir' ? -1 : 0}">`;
    }
    h += '<div class="rg-title">Copie nel Mazzetto Effetti</div>';
    for (const k of FF.EFFECT_IDS) h += `<label for="${prefix}c-${k}">${EFFECTS[k].n} <span class="muted">(std ${FF.DEFAULT_RULES.effectCopies[k]})</span></label><input type="number" id="${prefix}c-${k}" data-copy="${k}" value="${copies[k]}" min="0">`;
    return h + '</div>';
  };
  UI.readRules = function (container) {
    const r = {};
    $$('[data-rule]', container).forEach((el) => { const k = el.dataset.rule; const x = el.type === 'checkbox' ? el.checked : Number(el.value); if (x !== FF.DEFAULT_RULES[k]) r[k] = x; });
    const cp = {};
    $$('[data-copy]', container).forEach((el) => { const k = el.dataset.copy, x = Math.max(0, Number(el.value) || 0); if (x !== FF.DEFAULT_RULES.effectCopies[k]) cp[k] = x; });
    if (Object.keys(cp).length) r.effectCopies = cp;
    return r;
  };

  // ───────────────────────── setup ─────────────────────────
  const SPEEDS = { step: 'Manuale (clic per avanzare)', slow: 'Lento', normal: 'Normale', fast: 'Veloce', instant: 'Istantaneo' };
  const SPEED_MS = { slow: 1600, normal: 900, fast: 300, instant: 0 };
  const PRESETS = {
    ai: { title: '🤖 Contro l\'AI', kinds: ['human', 'medium', 'medium'] },
    hotseat: { title: '👥 Passa il telefono', kinds: ['human', 'human', 'medium'] },
    watch: { title: '🍿 AI contro AI', kinds: ['hard', 'medium', 'easy'] },
  };
  const kindOpts = (sel) => [['human', '👤 Umano'], ['easy', '🤖 AI Facile'], ['medium', '🤖 AI Media'], ['hard', '🤖 AI Difficile']].map(([k, l]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${l}</option>`).join('');

  UI.openSetup = function (mode) {
    UI.screen('setup');
    const el = $('#s-setup'), P = PRESETS[mode];
    const last = UI.store.get('setup_' + mode, {});
    const kinds = last.kinds || P.kinds, names = last.names || [UI.store.get('pname', 'Niky'), 'Erika', 'Giocatore 3'];
    const speedDef = last.speed || (mode === 'watch' ? 'normal' : 'step');
    const seatRows = [0, 1, 2].map((i) => `<div class="seatrow"><span class="srbadge">${S.seat(i)}</span>
      <select id="su-k${i}" aria-label="Tipo del giocatore ${FF.SEATS[i]}">${kindOpts(kinds[i])}</select>
      <input type="text" id="su-n${i}" value="${esc(names[i] || '')}" maxlength="16" aria-label="Nome del giocatore ${FF.SEATS[i]}"></div>`).join('');
    el.innerHTML = `<div class="wrap narrow"><div class="card"><h2>${P.title}</h2>
      <p class="small muted">I tre posti A, B, C siedono in senso orario. L'escluso iniziale è A. Gli umani giocano sullo stesso dispositivo: quando serve compare una schermata di passaggio, così l'altro non vede la mano.</p>
      <div class="field"><label>Giocatori</label>${seatRows}</div>
      <div class="field"><label>Messaggi delle mosse</label><div class="seg" id="su-speed">${Object.entries(SPEEDS).map(([k, v]) => `<button data-v="${k}" class="${k === speedDef ? 'sel' : ''}">${v}</button>`).join('')}</div></div>
      <div class="field"><label for="su-seed">Seed (vuoto = casuale)</label><div class="inline"><input type="text" id="su-seed" placeholder="es. prova-1" value="${esc(last.seed || '')}"><button class="btn" id="su-dice" title="Genera un seed">🎲</button></div></div>
      <details class="adv"><summary>⚙ Varianti di regole (avanzate)</summary>${UI.rulesFields('su-r-', last.rules)}</details>
      <div class="btn-row"><button class="btn" id="su-back">← Indietro</button><button class="btn primary grow" id="su-go">Inizia la partita</button></div></div></div>`;
    UI.seg($('#su-speed'));
    $('#su-dice').onclick = () => { $('#su-seed').value = UI.randomSeed(); };
    $('#su-back').onclick = () => UI.go('home');
    $('#su-go').onclick = () => {
      const ks = [0, 1, 2].map((i) => $('#su-k' + i).value);
      const ns = [0, 1, 2].map((i) => $('#su-n' + i).value.trim());
      const players = ks.map((k, i) => (k === 'human' ? { name: ns[i] || 'Giocatore ' + FF.SEATS[i], kind: 'human' } : { name: (ns[i] && !/^(Niky|Erika|Giocatore)/.test(ns[i]) ? ns[i] : 'AI ' + FF.SEATS[i]), kind: 'ai', level: k }));
      if (ns[0]) UI.store.set('pname', ns[0]);
      const seed = $('#su-seed').value.trim() || UI.randomSeed();
      const rules = UI.readRules(el), speed = UI.segVal($('#su-speed'));
      UI.store.set('setup_' + mode, { kinds: ks, names: ns, seed: $('#su-seed').value.trim(), speed, rules });
      UI.startSession({ seed, rules, players, speed, notes: [] });
    };
  };

  UI.startSession = function (cfg, history, opts) {
    if (UI.session) UI.session.dispose();
    UI.session = new Session(cfg, history, opts);
    UI.session.start();
  };

  // ───────────────────────── sessione ─────────────────────────
  const WEIGHT = { turn: 0.5, phase: 0.6, sys: 0.5, center: 1.2, zap: 1.3, reveal: 1.4, score: 1.4, effect: 1.3, declare: 1.1, warn: 0.8, end: 1, note: 0, draw: 0.6, roles: 0.9, effdraw: 0.8 };
  const NEXT_TXT = {
    draw: 'Poi: si rivela la carta centrale e si fissa il range.',
    discuss: 'Poi: i due attivi giocano coperte la carta per la coppia, quella per sé ed eventualmente un effetto.',
    play: 'Poi: reveal simultaneo di tutte le carte.',
    reveal: 'Poi: finestra Annulla, effetti, range e punti.',
    resolve: 'Poi: l\'escluso può pescare un effetto e si passa al turno successivo.',
    turn_end: 'Poi: nuovo turno.', setup: 'Poi: primo turno.', end: 'Partita finita.',
  };

  class Session {
    constructor(cfg, history, opts) {
      this.cfg = cfg; opts = opts || {};
      this.review = !!opts.review;
      this.speed = cfg.speed || 'step';
      this.paused = false; this.cancelled = false; this.waiter = null; this.timer = null;
      cfg.notes = cfg.notes || [];
      this.game = new FF.Game({ seed: cfg.seed, rules: cfg.rules, players: cfg.players, beats: true, log: true, replay: history || [] });
      if (cfg.forced) { // revisione di una partita con carta-effetto forzata (analisi del simulatore)
        const g = this.game, orig = g.setupGen.bind(g);
        g.setupGen = function* () { yield* orig(); g.s.players[cfg.forced.seat].eff.push({ id: 900, k: cfg.forced.k }); };
      }
      this.ai = cfg.players.map((p, i) => (p.kind === 'ai' ? FF.AI.create(p.level, cfg.seed + 'a' + i) : null));
      this.humans = cfg.players.map((p, i) => (p.kind === 'human' ? i : -1)).filter((i) => i >= 0);
      this.multi = this.humans.length > 1;
      this.fast = !this.review && !!(history && history.length);
      this.tab = {}; this.reveal = null; this.showAll = true; this.lastPrivate = null; this.currentActor = null;
    }
    dispose() { this.cancelled = true; if (this.timer) clearTimeout(this.timer); this.waiter = null; if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler); }

    // quali mani sono visibili sul tavolo
    viewHands() {
      const g = this.game;
      if (g.s.over || this.review) return [0, 1, 2];
      if (!this.humans.length) return this.showAll ? [0, 1, 2] : [];
      if (this.humans.length === 1) return [this.humans[0]];
      return this.reveal != null ? [this.reveal] : [];
    }

    // ── interfaccia ──
    buildUI() {
      UI.screen('game');
      const el = $('#s-game');
      el.innerHTML = `<div class="gbar"><span class="turn" id="g-turn"></span><span class="chip" id="g-zap"></span><span class="chip" id="g-ex"></span><span class="spacer"></span>
        <div class="ctrl" id="g-ctrl"></div></div>
        <div class="glayout"><aside class="legendcol"><details class="panel" id="g-legend"><summary class="ptitle">Legenda</summary><div class="legend">${UI.legendHTML()}</div></details></aside>
        <div class="maincol">
          <div class="announce" id="g-announce"></div>
          <div class="phasebar"><div id="g-phases"></div><div class="nexttxt" id="g-nexttxt"></div></div>
          <div class="tablefelt" id="g-table"></div>
          <div class="panel action" id="g-action"></div>
        </div>
        <div class="sidecol">
          <div class="panel"><div class="ptitle">Punti e contributi</div><div id="g-scores"></div></div>
          <div class="panel"><div class="ptitle">A colpo d'occhio</div><div id="g-states"></div></div>
          <div class="panel"><div class="ptitle">Cronaca</div><div class="logbox" id="g-log" tabindex="0"></div></div>
        </div></div>`;
      if (window.innerWidth >= 1100) $('#g-legend').open = true;
      $('#g-ctrl').innerHTML = `<select id="g-speed" title="Velocità dei messaggi" aria-label="Velocità dei messaggi">${Object.entries(SPEEDS).map(([k, v]) => `<option value="${k}" ${k === this.speed ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <button class="btn sm" id="g-pause">⏸ Pausa</button><button class="btn sm" id="g-next">⏭ Avanti</button>
        <button class="btn sm ${this.humans.length && !this.review ? '' : 'hidden'}" id="g-skip" title="Salta i messaggi fino alla tua prossima scelta">⏩ Fino alla mia mossa</button>
        <button class="btn sm" id="g-note" title="Aggiungi una nota di playtest alla cronaca">📝 Nota</button><button class="btn sm" id="g-menu">☰ Menu</button>`;
      $('#g-speed').onchange = (e) => { this.speed = e.target.value; this.cfg.speed = this.speed; this.paused = false; this.syncCtrl(); this.release(); };
      $('#g-pause').onclick = () => { this.paused = !this.paused; this.syncCtrl(); if (!this.paused) this.release(); };
      $('#g-next').onclick = () => this.release();
      $('#g-skip').onclick = () => { this.skipTo = true; this.release(); };
      $('#g-announce').addEventListener('click', (e) => { if (this.waiter && !e.target.closest('button')) this.release(); });
      this.keyHandler = (e) => {
        if ((e.code === 'Space' || e.code === 'Enter') && this.waiter && !document.querySelector('.overlay') && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes((document.activeElement || {}).tagName)) { e.preventDefault(); this.release(); }
      };
      document.addEventListener('keydown', this.keyHandler);
      $('#g-note').onclick = () => this.addNote();
      $('#g-menu').onclick = () => this.menu();
      this.game.onEvent = (ev) => this.onEvent(ev);
      this.syncCtrl();
    }
    syncCtrl() {
      const stepping = this.speed === 'step' || this.paused;
      $('#g-pause').textContent = this.paused ? '▶ Riprendi' : '⏸ Pausa';
      $('#g-pause').classList.toggle('hidden', this.speed === 'step');
      $('#g-next').classList.toggle('hidden', !stepping);
    }
    onEvent(ev) {
      if (this.cancelled || this.fast) return;
      const box = $('#g-log'); if (!box) return;
      box.insertAdjacentHTML('beforeend', UI.logLine(ev));
      box.scrollTop = box.scrollHeight;
    }
    logHTML() {
      const notes = this.cfg.notes, ev = this.game.events; let h = '';
      const note = (n) => UI.logLine({ k: 'note', t: n.t, p: -1, text: n.text });
      ev.forEach((e, i) => { notes.filter((n) => n.at === i).forEach((n) => { h += note(n); }); h += UI.logLine(e); });
      notes.filter((n) => n.at >= ev.length).forEach((n) => { h += note(n); });
      return h;
    }
    rebuildLog() { const box = $('#g-log'); box.innerHTML = this.logHTML(); box.scrollTop = box.scrollHeight; }
    trackTab(ev) {
      const t = this.tab;
      if (ev.k === 'turn') { this.tab = { played: {}, center: null, score: null }; return; }
      if (!t.played) t.played = {};
      if (ev.k === 'center' && ev.d) t.center = ev.d.center;
      else if (ev.k === 'reveal' && ev.d) {
        if (ev.d.x) t.played[ev.p] = { couple: ev.d.card };
        else if (ev.d.play) t.played[ev.p] = { couple: ev.d.play.couple, self: ev.d.play.self, eff: ev.d.play.eff };
      } else if (ev.k === 'score' && ev.d && ev.d.sum != null) t.score = Object.assign({}, ev.d, { inRange: ev.d.sum >= ev.d.min && ev.d.sum <= ev.d.max });
    }
    rebuildTab() { this.tab = {}; for (const e of this.game.events) this.trackTab(e); }
    renderAll(active) {
      if (this.cancelled) return;
      const g = this.game, s = g.s;
      $('#g-turn').textContent = `Turno ${Math.max(1, s.turn)}`;
      $('#g-zap').textContent = `⚡ Zapd ${s.zapsDrawn}/${g.totalZaps}`;
      $('#g-ex').innerHTML = `Escluso: <b>${FF.SEATS[s.excluded]}</b>`;
      UI.renderTable($('#g-table'), g, { tab: this.tab, hands: this.viewHands(), active: active == null ? this.currentActor : active });
      UI.renderScores($('#g-scores'), g); UI.renderStates($('#g-states'), g); UI.renderPhases($('#g-phases'), g);
      $('#g-nexttxt').textContent = NEXT_TXT[s.phase] || '';
    }
    setAction(html) { const a = $('#g-action'); if (a) a.innerHTML = html; return a; }

    // ── pacing ──
    release() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } const w = this.waiter; this.waiter = null; if (w) w(); }
    announce(ev, opts) {
      const box = $('#g-announce'); if (!box) return;
      opts = opts || {}; const d = ev.d || {};
      let icon;
      if (ev.k === 'turn') icon = `<span class="aemoji">📅</span>`;
      else if (ev.k === 'phase') icon = `<span class="aemoji">${{ discuss: '🗨️', play: '🂠', reveal: '🔎', resolve: '⚖️' }[d.phase] || '▶'}</span>`;
      else if (ev.k === 'end') icon = '<span class="aemoji">🏆</span>';
      else if (ev.k === 'center' && d.center) icon = `<span class="amini">${S.card(d.center)}</span>`;
      else if (ev.k === 'zap') icon = `<span class="amini">${S.card({ z: true, c: d.zap })}</span>`;
      else if (ev.k === 'reveal' && d.play) icon = `<span class="aminis">${[d.play.couple, d.play.self].map((c) => `<span class="amini">${S.card(c)}</span>`).join('')}${d.play.eff ? `<span class="amini">${S.effect(d.play.eff.k)}</span>` : ''}</span>`;
      else if (ev.k === 'reveal' && d.card) icon = `<span class="amini">${S.card(d.card)}</span>`;
      else if (ev.k === 'effect' && d.k) icon = `<span class="amini">${S.effect(d.k)}</span>`;
      else if (ev.k === 'roles') icon = S.token('atoken');
      else if (ev.p >= 0) icon = `<span class="aseat">${S.seat(ev.p)}</span>`;
      else icon = `<span class="aemoji">${ev.k === 'score' ? '📐' : '🃏'}</span>`;
      const text = ev.text.replace(/━+/g, '').trim();
      box.className = `announce k-${ev.k} ${ev.p >= 0 ? 'p' + ev.p : ''}${opts.prompt ? ' prompt' : ''}`;
      box.innerHTML = `<div class="aicon">${icon}</div><div class="atext"><div class="amain">${esc(text)}</div></div>${opts.button ? '<button class="btn primary abtn" id="a-next">Avanti ▶</button>' : ''}`;
      const b = $('#a-next'); if (b) b.onclick = () => this.release();
    }
    promptFor(d) {
      const n = this.game.s.players[d.player].name;
      return {
        sincero: `${n}: hai la carta Sincero — vuoi giocarla?`, declare: `${n}: dichiara qualcosa al compagno (non è vincolante)`, play: `${n}: scegli le tue carte (coperte)`,
        xplay: `${n}: sei l'escluso — scegli la carta per la coppia ${FF.pairLabel(d.excluded)}`, annulla: `${n}: vuoi giocare Annulla?`, effdraw: `${n}: vuoi pescare una carta-effetto?`,
      }[d.type] || `Tocca a ${n}`;
    }
    async pace(ev) {
      if (this.fast || this.cancelled) return;
      this.lastPrivate = null;
      const always = (ev.k === 'turn' || ev.k === 'phase' || ev.k === 'end') && this.speed !== 'instant';
      const stepping = this.speed === 'step' || this.paused || always;
      if (this.skipTo && !always) { this.announce(ev); return; }
      this.setAction('<div class="muted idle">Segui i messaggi qui sopra ☝️ <span class="small">(clic sul messaggio, Avanti, Spazio o Invio)</span></div>');
      if (stepping) { this.announce(ev, { button: true }); await new Promise((r) => { this.waiter = r; }); return; }
      const base = SPEED_MS[this.speed];
      this.announce(ev);
      if (!base) { if (ev.i % 12 === 0) await UI.sleep(0); return; }
      const w = WEIGHT[ev.k] == null ? 1 : WEIGHT[ev.k];
      await new Promise((r) => { this.waiter = r; this.timer = setTimeout(() => { this.timer = null; this.waiter = null; r(); }, base * w * 1.4); });
    }

    // ── ciclo principale ──
    async start() {
      this.buildUI();
      const g = this.game;
      $('#tb-info').innerHTML = `<span class="chip">seed ${esc(this.cfg.seed)}</span>${this.review ? '<span class="chip">revisione</span>' : ''}`;
      this.renderAll(null);
      $('#g-log').innerHTML = '';
      this.announce({ k: 'sys', p: -1, text: this.review ? 'Rivedi la partita: i messaggi si avanzano a mano.' : 'Si comincia! I messaggi delle mosse compaiono qui.', d: {} });
      const it = g.run();
      let r = it.next();
      while (!r.done) {
        if (this.cancelled) return;
        const d = r.value;
        if (d.type === 'beat') {
          if (!this.fast) this.trackTab(d.ev);
          if (!this.fast && this.speed !== 'instant') this.renderAll(d.ev.p >= 0 ? d.ev.p : null);
          await this.pace(d.ev);
          if (this.fast && g.replay.length === 0) { this.fast = false; this.rebuildLog(); this.rebuildTab(); this.renderAll(); }
          r = it.next();
          continue;
        }
        if (this.fast) { this.fast = false; this.rebuildLog(); this.rebuildTab(); }
        this.currentActor = d.player;
        const pl = this.cfg.players[d.player];
        let ans;
        if (pl.kind === 'human') {
          this.skipTo = false;
          this.renderAll(d.player);
          this.announce({ k: 'prompt', p: d.player, text: this.promptFor(d), d: {} }, { prompt: true });
          ans = await this.humanDecide(d);
        } else ans = this.aiDecide(d);
        this.currentActor = null;
        if (this.cancelled) return;
        r = it.next(ans);
        this.save();
      }
      if (this.cancelled) return;
      if (!this.review) UI.store.del('save');
      this.renderAll(null);
      this.setAction('<div class="muted idle">Partita finita.</div>');
      this.endDialog();
    }
    aiDecide(d) {
      try { return this.ai[d.player].decide(this.game, d); }
      catch (e) { console.error('AI error', e); return FF.RandomBot(1).decide(this.game, d); }
    }
    save() {
      if (this.review) return;
      UI.store.set('save', { cfg: this.cfg, history: this.game.history, turn: this.game.s.turn, t: Date.now() });
    }

    // ── decisioni umane ──
    async humanDecide(d) {
      if (this.multi) {
        this.reveal = null; this.renderAll(d.player);
        await this.cover(d.player, this.promptFor(d));
        this.reveal = d.player; this.renderAll(d.player);
      }
      let ans;
      switch (d.type) {
        case 'sincero': ans = await this.sinceroPanel(d); break;
        case 'declare': ans = await this.declarePanel(d); break;
        case 'play': ans = await this.playPanel(d, false); break;
        case 'xplay': ans = await this.playPanel(d, true); break;
        case 'annulla': ans = await this.annullaPanel(d); break;
        case 'effdraw': ans = await this.effdrawPanel(d); break;
        default: ans = null;
      }
      if (this.multi) { this.reveal = null; this.setAction('<h3>Scelta fatta ✔</h3><div class="muted">Passa il dispositivo se serve.</div>'); }
      return ans;
    }
    cover(pid, why) {
      const p = this.cfg.players[pid];
      return new Promise((resolve) => {
        const dlg = UI.modal(`<div class="bigseat">${S.seat(pid)}</div><h2>Tocca a ${esc(p.name)}</h2><p>${esc(why)}</p>
          <p class="small muted">Passa il dispositivo: gli altri giocatori non devono guardare lo schermo.</p>
          <button class="btn primary block" data-x>Sono ${esc(p.name)} — mostra</button>`, { solid: true, dismiss: false });
        dlg.el.querySelector('[data-x]').onclick = () => { dlg.close(); resolve(); };
      });
    }
    pname(pid) { return this.game.s.players[pid].name; }
    handStrip(d) {
      return `<div class="lbl">La tua mano</div><div class="cardsrow big">${d.hand.map((c) => UI.cardHTML(c)).join('')}</div>
        <div class="lbl">I tuoi effetti (${d.eff.length}/${this.game.rules.effectHandMax})</div><div class="cardsrow big">${d.eff.map((c) => UI.cardHTML(c)).join('') || '<span class="muted">nessuno</span>'}</div>`;
    }
    ctxLine(d) {
      const g = this.game, lo = d.center.v, hi = d.center.v + d.base, ex = d.excluded;
      return `<div class="ctx">🎯 Centrale <b>${FF.cardName(d.center)}</b> → range <b>${lo}–${hi}</b> · 🎨 dominante <b>${COLORS[d.dominant].i} ${COLORS[d.dominant].n}</b> · coppia <b>${FF.pairLabel(ex)}</b> (escluso ${FF.SEATS[ex]})${d.sincero ? ' · 🗣️ <b>Sincero attivo</b>' : ''}</div>`;
    }

    sinceroPanel(d) {
      const card = d.eff.find((e) => e.k === 'sincero');
      return new Promise((resolve) => {
        this.setAction(`<h3>🗣️ ${esc(this.pname(d.player))}: giocare Sincero?</h3>${this.ctxLine(d)}
          <div class="actrow"><div>${UI.cardHTML(card, { cls: 'big' })}</div><div class="grow">
          <p>Se la giochi, in questo turno <b>entrambi gli attivi</b> dichiarano un <b>numero esatto</b> sul proprio modificatore (niente più "poco / tanto"). Chi poi gioca un modificatore diverso da quello dichiarato lo vede valere <b>0</b> — anche tu.</p>
          <p class="muted">Si gioca ora, scoperta, prima della discussione. Non può essere annullata.</p></div></div>
          <div class="btn-row"><button class="btn" id="a-no">No, grazie</button><button class="btn primary grow" id="a-yes">Gioca Sincero</button></div>`);
        $('#a-no').onclick = () => resolve(false); $('#a-yes').onclick = () => resolve(true);
      });
    }

    declarePanel(d) {
      const g = this.game, max = g.rules.maxValue;
      let num = null, mod = null;
      const partner = d.partnerDecl, pn = this.pname(d.partner);
      const modOpts = d.sincero
        ? [[1, 'lo'], [2, 'lo'], [3, 'lo'], [1, 'hi'], [2, 'hi'], [3, 'hi']].map(([n, dir]) => ({ key: dir + n, label: `${dir === 'hi' ? '⬆ +' : '⬇ −'}${n}`, val: { dir, n } }))
        : ['lo', 'hi'].flatMap((dir) => [1, 2, 3].map((n) => ({ key: dir + n, label: `${dir === 'hi' ? '⬆ verso l\'alto' : '⬇ verso il basso'} · ${VAGUE[n]}`, val: { dir, size: VAGUE[n] } })));
      const hasMod = d.eff.some((e) => EFFECTS[e.k].mod);
      return new Promise((resolve) => {
        const render = () => {
          this.setAction(`<h3>💬 ${esc(this.pname(d.player))}: cosa dici a ${esc(pn)}?</h3>${this.ctxLine(d)}
            ${partner ? `<div class="infobox">${esc(pn)} ha già dichiarato: ${partner.num == null ? 'niente sulla carta' : `«ti gioco il ${partner.num}»`}${partner.mod ? ` · modificatore: ${esc(FF.modTxt(partner.mod))}` : ''}.</div>` : ''}
            ${this.handStrip(d)}
            <div class="lbl">Carta per la coppia che dici di giocare <span class="muted">(non vincolante: puoi tradire)</span></div>
            <div class="numrow"><button class="${num == null ? 'sel' : ''}" data-num="">Niente</button>${Array.from({ length: max }, (_, i) => i + 1).map((n) => `<button class="${num === n ? 'sel' : ''} ${d.hand.some((c) => c.v === n) ? 'inhand' : ''}" data-num="${n}">${n}</button>`).join('')}</div>
            <div class="small muted">I numeri con il bordo pieno li hai in mano. Sulla carta per la coppia puoi dire numeri precisi.</div>
            <div class="lbl">Il tuo modificatore ${d.sincero ? '<span class="tag warn">Sincero: numero esatto, se menti vale 0</span>' : '<span class="muted">(solo indicazioni vaghe, niente numeri)</span>'}</div>
            <div class="modrow"><button class="${mod == null ? 'sel' : ''}" data-mod="">Nessuno</button>${modOpts.map((o) => `<button class="${mod === o.key ? 'sel' : ''}" data-mod="${o.key}">${o.label}</button>`).join('')}</div>
            ${hasMod ? '' : '<div class="small muted">Non hai modificatori in mano: puoi dirlo comunque, ma sarebbe una bugia.</div>'}
            <div class="btn-row"><button class="btn primary grow" id="d-ok">Dichiara</button></div>`);
          $$('#g-action [data-num]').forEach((b) => (b.onclick = () => { num = b.dataset.num === '' ? null : Number(b.dataset.num); render(); }));
          $$('#g-action [data-mod]').forEach((b) => (b.onclick = () => { mod = b.dataset.mod || null; render(); }));
          $('#d-ok').onclick = () => { const o = modOpts.find((x) => x.key === mod); resolve({ num, mod: o ? o.val : null }); };
        };
        render();
      });
    }

    // Scelta delle carte: attivo (coppia + sé + effetto) o escluso (una carta)
    playPanel(d, excl) {
      const g = this.game, R = g.rules, me = d.player;
      const sel = { couple: null, self: null, eff: null };
      const partnerId = [0, 1, 2].find((i) => i !== d.excluded && i !== me);
      const pdecl = !excl && d.decls ? d.decls[partnerId] : null;
      const mydecl = !excl && d.decls ? d.decls[me] : null;
      const cardById = (id) => d.hand.find((c) => c.id === id);
      const effReason = (e) => {
        const k = EFFECTS[e.k];
        if (excl) return 'L\'escluso non può giocare effetti in questo turno.';
        if (k.kind === 'sincero') return 'Sincero è istantanea: si gioca prima della discussione.';
        if (k.kind === 'annulla') return 'Annulla è reattiva: la potrai giocare dopo il reveal.';
        return '';
      };
      return new Promise((resolve) => {
        const preview = () => {
          if (excl) return `<div class="pv">Come escluso giochi <b>1 carta</b> per la coppia ${FF.pairLabel(d.excluded)}. Non sei vincolato dal range e il colore non conta, ma se la coppia sfora la tua carta vale 0 (e non conta nel tuo Fattore coppie).</div>`;
          const effc = sel.eff != null ? d.eff.find((e) => e.id === sel.eff) : null;
          const m = effc && EFFECTS[effc.k].mod;
          const min = d.center.v - (m && m.dir === 'lo' ? m.n : 0), max = d.center.v + d.base + (m && m.dir === 'hi' ? m.n : 0);
          const cc = sel.couple != null ? cardById(sel.couple) : null;
          let h = '';
          if (cc) {
            const lo = Math.max(1, min - cc.v), hi = Math.min(R.maxValue, max - cc.v);
            h += lo > hi ? `<div class="bad">Con il ${cc.v} per la coppia nessuna carta (1–${R.maxValue}) del compagno ti tiene nel range ${min}–${max}: ti salva solo il colore dominante.</div>`
              : `<div>Con il <b>${cc.v}</b> per la coppia, il compagno deve giocare tra <b>${lo}</b> e <b>${hi}</b> per stare nel range ${min}–${max}.</div>`;
            h += cc.c === d.dominant ? `<div class="good">🛡 Il tuo ${cc.v} è del colore dominante: se anche il compagno gioca ${COLORS[d.dominant].n}, niente sforo.</div>` : `<div class="muted">Colore ${COLORS[cc.c].n}: non è il dominante (${COLORS[d.dominant].n}).</div>`;
            if (pdecl && pdecl.num != null) { const sum = cc.v + pdecl.num; h += `<div class="${sum >= min && sum <= max ? 'good' : 'bad'}">${esc(this.pname(partnerId))} ha dichiarato ${pdecl.num}: somma ${sum} → ${sum >= min && sum <= max ? 'dentro il range ✔' : 'FUORI dal range ✘ (se dice la verità)'}.</div>`; }
            else if (pdecl) h += `<div class="muted">${esc(this.pname(partnerId))} non ha dichiarato nessun numero.</div>`;
          }
          if (sel.self != null) h += `<div>⭐ Il ${cardById(sel.self).v} per sé ti dà <b>+${cardById(sel.self).v}</b> punti personali, sempre.</div>`;
          return `<div class="pv">${h || 'Scegli le carte: nel riquadro vedrai cosa succederebbe.'}</div>`;
        };
        const render = () => {
          const slot = (key, label, c) => `<div class="slot ${c ? 'full' : ''}" data-slot="${key}"><div class="slab">${label}</div>${c ? UI.cardHTML(c, { cls: 'slotcard' }) : '<div class="emptyslot"></div>'}${c ? '<div class="small">tocca per togliere</div>' : ''}</div>`;
          const used = new Set([sel.couple, sel.self]);
          const cards = d.hand.map((c) => `<button class="cardbtn selectable ${used.has(c.id) ? 'used' : ''}" data-pick="${c.id}" aria-label="${esc(FF.cardName(c))}">${S.card(c)}</button>`).join('');
          const effs = d.eff.map((e) => { const why = excl || EFFECTS[e.k].kind !== 'fila' ? effReason(e) : ''; return `<div class="effwrap ${why ? 'off' : ''}"><button class="cardbtn selectable ${sel.eff === e.id ? 'used' : ''}" data-eff="${e.id}" ${why ? 'disabled' : ''}>${S.effect(e.k)}</button>${why ? `<div class="why">${why}</div>` : `<button class="zoomlink" data-zoom="eff:${e.k}">ingrandisci</button>`}</div>`; }).join('') || '<span class="muted">Nessun effetto in mano.</span>';
          const ready = excl ? sel.couple != null : sel.couple != null && sel.self != null;
          this.setAction(`<h3>${excl ? '🚪' : '🂠'} ${esc(this.pname(me))}: ${excl ? `la tua carta per la coppia ${FF.pairLabel(d.excluded)}` : 'scegli le tue carte (restano coperte fino al reveal)'}</h3>${this.ctxLine(d)}
            ${!excl && pdecl ? `<div class="infobox">${esc(this.pname(partnerId))} ha dichiarato: ${pdecl.num == null ? 'niente sulla carta' : `«ti gioco il ${pdecl.num}»`}${pdecl.mod ? ` · modificatore: ${esc(FF.modTxt(pdecl.mod))}` : ''}.</div>` : ''}
            <div class="lbl">La tua mano — tocca una carta per metterla nel primo spazio libero</div><div class="cardsrow big">${cards}</div>
            <div class="slots">${slot('couple', excl ? 'Per la coppia' : '1 · Per la coppia', sel.couple != null ? cardById(sel.couple) : null)}${excl ? '' : slot('self', '2 · Per sé', sel.self != null ? cardById(sel.self) : null)}
            ${excl ? '' : `<div class="slot effslot ${sel.eff != null ? 'full' : ''}" data-slot="eff"><div class="slab">3 · Effetto (facoltativo)</div>${sel.eff != null ? UI.cardHTML(d.eff.find((e) => e.id === sel.eff), { cls: 'slotcard' }) : '<div class="emptyslot"></div>'}${sel.eff != null ? '<div class="small">tocca per togliere</div>' : ''}</div>`}</div>
            <div class="lbl">I tuoi effetti ${excl ? '' : '(quelli grigi non si giocano adesso)'}</div><div class="cardsrow big">${effs}</div>
            ${preview()}
            <div class="btn-row">${FF.AI && FF.AI.suggest ? '<button class="btn" id="p-hint">💡 Suggerimento AI</button>' : ''}<button class="btn" id="p-clear">Azzera</button><button class="btn primary grow" id="p-ok" ${ready ? '' : 'disabled'}>${ready ? 'Conferma (carte coperte)' : excl ? 'Scegli una carta' : 'Scegli carta per la coppia e carta per sé'}</button></div>`);
          $$('#g-action [data-pick]').forEach((b) => (b.onclick = () => {
            const id = Number(b.dataset.pick);
            if (sel.couple === id) sel.couple = null; else if (sel.self === id) sel.self = null;
            else if (sel.couple == null) sel.couple = id; else if (!excl && sel.self == null) sel.self = id; else if (excl) sel.couple = id; else UI.toast('Hai già scelto due carte: toccane una per toglierla.');
            render();
          }));
          $$('#g-action [data-slot]').forEach((b) => (b.onclick = (e) => { if (e.target.closest('[data-zoom]') && false) return; const k = b.dataset.slot; if (sel[k] != null) { sel[k] = null; render(); } }));
          $$('#g-action [data-eff]').forEach((b) => (b.onclick = () => { const id = Number(b.dataset.eff); sel.eff = sel.eff === id ? null : id; render(); }));
          $('#p-clear').onclick = () => { sel.couple = sel.self = sel.eff = null; render(); };
          const hint = $('#p-hint'); if (hint) hint.onclick = () => { const a = FF.AI.suggest(this.game, d); if (a) { sel.couple = a.couple; sel.self = a.self != null ? a.self : null; sel.eff = a.eff; render(); UI.toast('Suggerimento applicato: puoi cambiarlo.'); } };
          $('#p-ok').onclick = async () => {
            const warns = [];
            if (!excl) {
              const cc = cardById(sel.couple), effc = sel.eff != null ? d.eff.find((e) => e.id === sel.eff) : null, m = effc && EFFECTS[effc.k].mod;
              const mn = d.center.v - (m && m.dir === 'lo' ? m.n : 0), mx = d.center.v + d.base + (m && m.dir === 'hi' ? m.n : 0);
              if (pdecl && pdecl.num != null && !(cc.v + pdecl.num >= mn && cc.v + pdecl.num <= mx) && cc.c !== d.dominant) warns.push(`Con il ${cc.v} e il ${pdecl.num} dichiarato da ${esc(this.pname(partnerId))} la somma è ${cc.v + pdecl.num}, <b>fuori dal range ${mn}–${mx}</b>: la coppia farebbe 0 (se lui dice la verità).`);
              if (m && d.sincero) { const dm = mydecl && mydecl.mod; if (!dm || dm.dir !== m.dir || dm.n !== m.n) warns.push(`Sincero è attivo e hai dichiarato «${esc(FF.modTxt(dm))}», ma giochi ${esc(EFFECTS[effc.k].n)}: <b>quel modificatore varrà 0</b>.`); }
              if (effc && effc.k === 'swap') warns.push(`<b>Scambio forzato</b>: scambi le tue carte in mano con quelle dell'escluso, senza vederle prima.`);
              if (effc && effc.k === 'reverse') warns.push('<b>Reverse</b> inverte il verso: la prossima Zapd sposterà l\'escluso al contrario.');
            }
            if (warns.length && !(await UI.confirm('Mossa rischiosa', warns.map((w) => `<p>${w}</p>`).join('')))) return;
            resolve(excl ? sel.couple : { couple: sel.couple, self: sel.self, eff: sel.eff });
          };
        };
        render();
      });
    }

    annullaPanel(d) {
      return new Promise((resolve) => {
        const card = d.eff.find((e) => e.k === 'annulla');
        this.setAction(`<h3>🚫 ${esc(this.pname(d.player))}: vuoi giocare Annulla?</h3>
          <p>Neutralizza <b>un</b> effetto in fila appena rivelato — anche quello del tuo compagno. Non puoi annullare Sincero né un altro Annulla.</p>
          <div class="actrow"><div>${UI.cardHTML(card, { cls: 'big' })}</div><div class="grow"><div class="lbl">Effetti rivelati (scegli quale annullare)</div><div class="cardsrow big">${d.targets.map((t) => `<div class="effwrap"><button class="cardbtn selectable" data-t="${t.idx}">${S.effect(t.k)}</button><div class="why">di ${esc(this.pname(t.owner))}</div></div>`).join('')}</div></div></div>
          <div class="btn-row"><button class="btn primary grow" id="a-no">Non gioco Annulla</button></div>`);
        $$('#g-action [data-t]').forEach((b) => (b.onclick = async () => {
          const t = d.targets.find((x) => x.idx === Number(b.dataset.t));
          if (await UI.confirm('Annullare questo effetto?', `<p>Annulli <b>${esc(EFFECTS[t.k].n)}</b> di ${esc(this.pname(t.owner))}. Annulla va in scarto e non si recupera.</p>`, 'Sì, annulla', 'No')) resolve(t.idx);
        }));
        $('#a-no').onclick = () => resolve(null);
      });
    }

    effdrawPanel(d) {
      const left = this.game.s.effDeck.length;
      return new Promise((resolve) => {
        this.setAction(`<h3>🎴 ${esc(this.pname(d.player))}: pesca un effetto?</h3>
          <p>Sei l'escluso di questo turno: puoi pescare <b>1 carta</b> dal Mazzetto Effetti (restano ${left}). La vedrai solo tu. Non puoi giocarla adesso, solo da attivo nei prossimi turni. Ne hai ${d.eff.length}/${this.game.rules.effectHandMax}.</p>
          <div class="actrow"><div>${S.backEffect('big')}</div><div class="grow cardsrow big">${d.eff.map((c) => UI.cardHTML(c)).join('')}</div></div>
          <div class="btn-row"><button class="btn" id="e-no">Non pesco</button><button class="btn primary grow" id="e-yes">Pesca una carta-effetto</button></div>`);
        $('#e-no').onclick = () => resolve(false); $('#e-yes').onclick = () => resolve(true);
      });
    }

    // ── note, log, menu, fine ──
    addNote() {
      const dlg = UI.modal(`<h2>📝 Nota di playtest</h2><p class="small muted">Si aggiunge alla cronaca in questo punto e finisce nell'esportazione.</p><textarea id="n-txt" rows="4" placeholder="Cosa hai notato?"></textarea>
        <div class="btn-row"><button class="btn" data-n>Annulla</button><button class="btn primary grow" data-y>Aggiungi alla cronaca</button></div>`);
      dlg.el.querySelector('[data-n]').onclick = () => dlg.close();
      dlg.el.querySelector('[data-y]').onclick = () => {
        const text = $('#n-txt').value.trim(); if (!text) return;
        this.cfg.notes.push({ at: this.game.events.length, t: this.game.s.turn, text }); this.save(); this.rebuildLog(); dlg.close(); UI.toast('Nota aggiunta ✓');
      };
    }
    exportText() {
      const g = this.game, notes = this.cfg.notes; const L = [];
      L.push('CROMOZAPD — cronaca', `seed: ${this.cfg.seed}`, `giocatori: ${this.cfg.players.map((p, i) => `${FF.SEATS[i]}=${p.name}${p.kind === 'ai' ? ' (AI ' + p.level + ')' : ''}`).join(', ')}`);
      L.push(`regole diverse dal default: ${JSON.stringify(this.cfg.rules || {})}`, '');
      g.events.forEach((e, i) => { notes.filter((n) => n.at === i).forEach((n) => L.push(`📝 NOTA (turno ${n.t}): ${n.text}`)); L.push(`[T${e.t}] ${e.text}`); });
      notes.filter((n) => n.at >= g.events.length).forEach((n) => L.push(`📝 NOTA (turno ${n.t}): ${n.text}`));
      return L.join('\n');
    }
    menu() {
      const noHumans = !this.humans.length;
      const dlg = UI.modal(`<h2>Menu</h2><div class="menugrid">
        <button class="btn" data-a="rules">📖 Regole</button><button class="btn" data-a="log">📜 Cronaca completa</button>
        <button class="btn" data-a="copy">📋 Copia la cronaca</button><button class="btn" data-a="txt">⬇ Esporta cronaca (.txt)</button>
        <button class="btn" data-a="json">⬇ Esporta partita (.json)</button>${noHumans ? '<button class="btn" data-a="hands">👁 Mostra/nascondi le mani</button>' : ''}
        <button class="btn" data-a="new">🔁 Nuova partita</button><button class="btn danger" data-a="home">🏠 Esci al menu</button></div>
        <div class="btn-row end"><button class="btn primary" data-a="x">Chiudi</button></div>`);
      dlg.el.addEventListener('click', (e) => {
        const a = (e.target.closest('[data-a]') || {}).dataset; if (!a) return; const k = a.a;
        if (k === 'x') dlg.close();
        else if (k === 'rules') { dlg.close(); UI.openRulesModal(); }
        else if (k === 'log') { dlg.close(); const d2 = UI.modal(`<h2>📜 Cronaca</h2><div class="logbox tall">${this.logHTML()}</div><div class="btn-row end"><button class="btn primary" data-x>Chiudi</button></div>`, { wide: true }); d2.el.querySelector('[data-x]').onclick = () => d2.close(); }
        else if (k === 'copy') UI.copy(this.exportText());
        else if (k === 'txt') UI.download(`cromozapd-${this.cfg.seed}.txt`, this.exportText());
        else if (k === 'json') UI.download(`cromozapd-${this.cfg.seed}.json`, JSON.stringify({ cfg: this.cfg, history: this.game.history, events: this.game.events.map((x) => ({ t: x.t, k: x.k, p: x.p, text: x.text })) }, null, 1), 'application/json');
        else if (k === 'hands') { this.showAll = !this.showAll; this.renderAll(); dlg.close(); }
        else if (k === 'new') { dlg.close(); UI.go('home'); }
        else if (k === 'home') { dlg.close(); UI.go('home'); }
      });
    }
    endDialog() {
      const g = this.game, r = g.result, s = g.s;
      const rows = [0, 1, 2].map((p) => `<tr class="${r.winners.includes(p) && r.winner != null ? 'win' : ''}"><td>${S.seat(p, 'tinyseat')} ${esc(s.players[p].name)}</td><td>${r.personal[p]}</td><td>${Math.round(100 * r.factor[p])}%</td><td><b>${r.scores[p].toFixed(1)}</b></td></tr>`).join('');
      const prow = [0, 1, 2].map((e) => `<span class="pairchip ${r.pairWinners.includes(e) && r.pairWinner != null ? 'win' : ''}">${FF.pairLabel(e)} <b>${r.pairPts[e]}</b></span>`).join('');
      const dlg = UI.modal(`<h2>🏁 Fine partita</h2>
        <div class="lbl">🤝 Vincitore di coppia</div><div class="pairs">${prow}</div><p>${r.pairWinner == null ? 'Pareggio tra coppie.' : `Vince la coppia <b>${FF.pairLabel(r.pairWinner)}</b>.`}</p>
        <div class="lbl">🏆 Vincitore individuale</div><table class="scoretbl"><thead><tr><th></th><th>Personali</th><th>Fattore</th><th>Punti</th></tr></thead><tbody>${rows}</tbody></table>
        <p>${r.winner == null ? 'Pareggio individuale.' : `Vince <b>${esc(s.players[r.winner].name)}</b>.`} <span class="muted">(${r.turns} turni · seed ${esc(this.cfg.seed)})</span></p>
        <div class="btn-row"><button class="btn" data-a="log">📜 Cronaca</button><button class="btn" data-a="rev">▶ Rivedi</button><button class="btn" data-a="txt">⬇ Esporta</button><button class="btn primary grow" data-a="home">Menu principale</button></div>`, { dismiss: true });
      dlg.el.addEventListener('click', (e) => {
        const k = ((e.target.closest('[data-a]') || {}).dataset || {}).a; if (!k) return;
        if (k === 'home') { dlg.close(); UI.go('home'); }
        else if (k === 'txt') UI.download(`cromozapd-${this.cfg.seed}.txt`, this.exportText());
        else if (k === 'log') { dlg.close(); this.menu(); }
        else if (k === 'rev') { dlg.close(); UI.startSession(Object.assign({}, this.cfg, { speed: 'step' }), g.history.slice(), { review: true }); }
      });
    }
  }
  UI.Session = Session;
})(typeof window !== 'undefined' ? window : globalThis);
