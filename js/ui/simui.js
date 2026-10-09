/* CROMOZAPD — schermata del simulatore: tornei AI, esperimenti sulle regole, analisi delle carte-effetto, esportazioni */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const UI = FF.UI;
  const { $, $$, esc } = UI;
  const pct = (x) => (100 * x).toFixed(1) + '%';

  // ── grafici semplici in HTML/SVG ──
  function bars(items, fmt) {
    const max = Math.max(1e-9, ...items.map((i) => i.v));
    return `<div class="bars">${items.map((it) => `<div class="barrow"><span class="bl">${esc(it.label)}</span><span class="bt"><span class="bf" style="width:${(100 * it.v / max).toFixed(1)}%;background:${it.color || 'var(--accent2)'}"></span></span><span class="bv">${esc(fmt ? fmt(it.v) : it.v)}</span></div>`).join('')}</div>`;
  }
  function lineChart(series, xs) {
    const W = 560, H = 230, L = 38, B = 26, T = 10, R = 10;
    const ys = series.flatMap((s) => s.pts.filter((v) => v != null));
    const ymax = Math.max(1, ...ys) * 1.05, xmin = xs[0], xmax = xs[xs.length - 1];
    const X = (x) => L + (W - L - R) * (x - xmin) / Math.max(1, xmax - xmin), Y = (y) => H - B - (H - B - T) * y / ymax;
    let g = '';
    for (let i = 0; i <= 4; i++) { const y = ymax * i / 4; g += `<line x1="${L}" x2="${W - R}" y1="${Y(y)}" y2="${Y(y)}" stroke="#d8c8a0" stroke-width="1"/><text x="${L - 4}" y="${Y(y) + 4}" font-size="11" text-anchor="end" fill="#6d5a3d">${y.toFixed(0)}</text>`; }
    xs.forEach((x) => { if ((x - xmin) % 2 === 0) g += `<text x="${X(x)}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#6d5a3d">${x}</text>`; });
    for (const s of series) {
      const d = xs.map((x, i) => (s.pts[i] == null ? null : `${X(x).toFixed(1)},${Y(s.pts[i]).toFixed(1)}`)).filter(Boolean).join(' ');
      g += `<polyline points="${d}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" class="linechart" role="img" aria-label="Andamento dei punteggi nel tempo">${g}</svg><div class="legendline">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  const tile = (big, label, sub) => `<div class="tile"><div class="tbig">${big}</div><div class="tlab">${label}</div>${sub ? `<div class="tsub">${sub}</div>` : ''}</div>`;
  const parseParams = (txt) => { const o = {}; String(txt || '').split(/[,;\s]+/).filter(Boolean).forEach((p) => { const [k, v] = p.split('='); if (k && v != null) o[k] = v === 'true' ? true : v === 'false' ? false : Number(v); }); return Object.keys(o).length ? o : undefined; };
  const PARAM_LIST = ['modScale', 'handSize', 'zapPerColor', 'traitorOverflow', 'startExcluded', ...FF.EFFECT_IDS.filter((k) => !FF.EFFECTS[k].retired).map((k) => 'effectCopies.' + k)];

  UI.openSim = function () {
    UI.screen('sim');
    const el = $('#s-sim'), last = UI.store.get('sim_setup', {});
    const lvl = (id, def) => `<select id="${id}">${Object.entries(FF.LEVELS).map(([k, v]) => `<option value="${k}" ${k === def ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
    el.innerHTML = `<div class="wrap"><div class="card"><h2>📊 Simulazione veloce</h2>
      <p class="small muted">Partite AI contro AI in blocco. Il <b>profilo A</b> siede a rotazione in A, B e C (posti alternati) contro due giocatori <b>profilo B</b>: se i due profili sono uguali A vince 1 partita su 3. Le percentuali hanno un <b>intervallo di confidenza al 95%</b>.</p>
      <div class="rowgrid"><div class="field"><label>Profilo A</label>${lvl('sm-a', last.a || 'hard')}<input type="text" id="sm-ap" placeholder="parametri AI, es. samples=8,trust=0.7" value="${esc(last.ap || '')}"></div>
      <div class="field"><label>Profilo B</label>${lvl('sm-b', last.b || 'medium')}<input type="text" id="sm-bp" placeholder="parametri AI (facoltativi)" value="${esc(last.bp || '')}"></div></div>
      <div class="rowgrid"><div class="field"><label for="sm-n">Partite</label><input type="number" id="sm-n" min="2" value="${last.n || 200}"></div>
      <div class="field"><label for="sm-seed">Seed</label><input type="text" id="sm-seed" value="${esc(last.seed || 'playtest')}"></div>
      <div class="field"><label for="sm-logs">Cronache da conservare</label><input type="number" id="sm-logs" min="0" max="20" value="${last.logs == null ? 3 : last.logs}"></div></div>
      <label class="chk"><input type="checkbox" id="sm-swap" ${last.swap === false ? '' : 'checked'}> Posti alternati (consigliato)</label>
      <details class="adv"><summary>⚙ Varianti di regole</summary>${UI.rulesFields('sm-r-', last.rules)}</details>
      <div class="btn-row"><button class="btn primary" id="sm-run">▶ Avvia simulazione</button><button class="btn" id="sm-back">← Indietro</button></div>
      <hr><h3>🧪 Esperimento sulle regole</h3><p class="small muted">Ripete la simulazione cambiando un solo parametro e confronta i risultati.</p>
      <div class="rowgrid"><div class="field"><label>Parametro</label><select id="sm-ep">${PARAM_LIST.map((p) => `<option value="${p}" ${p === (last.ep || 'modScale') ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      <div class="field"><label>Valori (separati da virgola)</label><input type="text" id="sm-ev" value="${esc(last.ev || '5,7,10,13')}"></div></div>
      <div class="btn-row"><button class="btn" id="sm-exp">🧪 Avvia esperimento</button></div>
      <hr><h3>🔬 Analisi delle carte-effetto "forzate"</h3><p class="small muted">Per ogni carta-effetto, il profilo A parte con quella carta in mano (stesso seed con e senza): misura quanto rende, anche se l'AI non la sceglierebbe da sola.</p>
      <div class="rowgrid"><div class="field"><label for="sm-en">Coppie di partite per carta</label><input type="number" id="sm-en" min="5" value="${last.en || 100}"></div></div>
      <div class="btn-row"><button class="btn" id="sm-eff">🔬 Avvia analisi</button></div>
      <div id="sm-prog" class="hidden"><div class="progress"><span id="sm-bar"></span></div><div class="small" id="sm-ptxt"></div><button class="btn sm danger" id="sm-cancel">Annulla</button></div></div>
      <div id="sm-out"></div></div>`;
    $('#sm-back').onclick = () => UI.go('home');
    let cancel = null;
    const read = () => {
      const o = { a: $('#sm-a').value, b: $('#sm-b').value, ap: $('#sm-ap').value, bp: $('#sm-bp').value, n: Math.max(2, Number($('#sm-n').value) || 200), seed: $('#sm-seed').value.trim() || 'playtest', logs: Math.max(0, Number($('#sm-logs').value) || 0), swap: $('#sm-swap').checked, rules: UI.readRules(el), ep: $('#sm-ep').value, ev: $('#sm-ev').value, en: Math.max(5, Number($('#sm-en').value) || 100) };
      UI.store.set('sim_setup', o);
      return { games: o.n, seed: o.seed, a: o.a, b: o.b, aParams: parseParams(o.ap), bParams: parseParams(o.bp), swap: o.swap, rules: o.rules, keepLogs: o.logs, _o: o };
    };
    const busy = (on) => { $$('#s-sim .btn.primary, #sm-exp, #sm-eff').forEach((b) => { b.disabled = on; }); $('#sm-prog').classList.toggle('hidden', !on); };
    const progress = (i, n) => { $('#sm-bar').style.width = (100 * i / n).toFixed(1) + '%'; $('#sm-ptxt').textContent = `${i}/${n} partite`; };
    const go = async (fn) => {
      cancel = { cancelled: false }; busy(true); $('#sm-out').innerHTML = '';
      try { await fn(cancel); } catch (e) { console.error(e); UI.toast('Errore nella simulazione: ' + e.message); }
      busy(false);
    };
    $('#sm-cancel').onclick = () => { if (cancel) cancel.cancelled = true; };
    $('#sm-run').onclick = () => go(async (c) => { const o = read(); const agg = await FF.Sim.run(o, progress, c); showAgg(agg, o); });
    $('#sm-exp').onclick = () => go(async (c) => {
      const o = read(), p = $('#sm-ep').value, vals = $('#sm-ev').value.split(',').map((s) => Number(s.trim())).filter((x) => !isNaN(x));
      if (!vals.length) { UI.toast('Inserisci almeno un valore'); return; }
      const rows = await FF.Sim.experiment(o, p, vals, progress, c);
      const md = FF.Sim.reportExperiment(p, rows, o);
      $('#sm-out').innerHTML = `<div class="card">${UI.md(md)}<div class="btn-row"><button class="btn" id="x-md">⬇ .md</button><button class="btn" id="x-copy">📋 Copia</button></div></div>`;
      $('#x-md').onclick = () => UI.download(`cromozapd-esperimento-${p}.md`, md); $('#x-copy').onclick = () => UI.copy(md);
    });
    $('#sm-eff').onclick = () => go(async (c) => {
      const o = read(), per = o._o.en;
      const rows = await FF.Sim.analyzeEffects(o, per, (i, n) => progress(i, n), c);
      const md = FF.Sim.reportEffects(rows, o, per);
      const items = rows.map((r) => ({ label: r.name, v: Math.abs(r.dScore.m), color: r.dScore.m >= 0 ? '#1f8a4c' : '#c0392b', real: r.dScore.m }));
      $('#sm-out').innerHTML = `<div class="card"><h3>Δ punteggio medio di A con la carta in mano</h3>${bars(items, (v) => v.toFixed(2))}<p class="small muted">Verde = la carta aiuta, rosso = danneggia (lunghezza = valore assoluto).</p>${UI.md(md)}<div class="btn-row"><button class="btn" id="x-md">⬇ .md</button><button class="btn" id="x-copy">📋 Copia</button></div></div>`;
      $('#x-md').onclick = () => UI.download('cromozapd-effetti.md', md); $('#x-copy').onclick = () => UI.copy(md);
    });
  };

  // ── risultati di una simulazione ──
  function showAgg(agg, o) {
    const s = FF.Sim.summary(agg), n = agg.n, out = $('#sm-out');
    const equal = agg.opts.a === agg.opts.b && !agg.opts.aParams && !agg.opts.bParams;
    const xs = []; for (let t = 1; t < agg.traj.cnt.length; t++) if (agg.traj.cnt[t] >= n * 0.3) xs.push(t);
    const line = xs.length > 1 ? lineChart([{ name: 'Profilo A', color: '#e8833a', pts: xs.map((t) => agg.traj.A[t] / agg.traj.cnt[t]) }, { name: 'Profilo B (media)', color: '#2f6fd1', pts: xs.map((t) => agg.traj.B[t] / agg.traj.cnt[t]) }], xs) : '';
    const sumv = (obj) => Object.values(obj).reduce((a, b) => a + b, 0) || 1;
    const vals = []; for (let v = 1; v <= agg.opts.rules.maxValue; v++) vals.push(v);
    const valBars = (kind, color) => bars(vals.map((v) => ({ label: String(v), v: (agg.vals[kind][v] || 0) / sumv(agg.vals[kind]), color })), (x) => pct(x));
    const turnsH = Object.keys(agg.turns).map(Number).sort((a, b) => a - b).map((t) => ({ label: t + ' turni', v: agg.turns[t] / n }));
    const margH = Object.keys(agg.margins).map(Number).sort((a, b) => a - b).map((m) => ({ label: m >= 20 ? '20+' : String(m), v: agg.margins[m] / n }));
    const md = FF.Sim.report(agg);
    const rowsG = agg.games.slice(0, 300).map((g) => `<tr><td>${g.i + 1}</td><td><code>${esc(g.seed)}</code></td><td>${FF.SEATS[g.aSeat]}</td><td>${g.scores.map((x) => x.toFixed(1)).join(' / ')}</td><td>${g.winner == null ? '–' : FF.SEATS[g.winner] + (g.winner === g.aSeat ? ' (A)' : '')}</td><td>${g.pairWinner == null ? '–' : FF.pairLabel(g.pairWinner)}</td><td>${g.turns}</td><td><button class="btn sm" data-rev="${g.i}">▶ Rivedi</button>${agg.logs.find((l) => l.i === g.i) ? ` <button class="btn sm" data-log="${g.i}">📜 Cronaca</button>` : ''}</td></tr>`).join('');
    out.innerHTML = `<div class="card"><h2>Risultati · ${n} partite · ${(agg.ms / 1000).toFixed(1)} s</h2>
      <div class="tiles">${tile(pct(s.aWin), 'A vince l\'individuale', `95%: ${pct(s.aWinCI[0])} – ${pct(s.aWinCI[1])}${equal ? ' · atteso 33,3%' : ''}`)}
      ${tile(pct(s.aPairWin), 'A nella coppia vincente', `95%: ${pct(s.aPairWinCI[0])} – ${pct(s.aPairWinCI[1])}${equal ? ' · atteso 66,7%' : ''}`)}
      ${tile((s.diff.m >= 0 ? '+' : '') + s.diff.m.toFixed(2), 'punteggio A − B', `95%: ${s.diff.lo.toFixed(2)} ; ${s.diff.hi.toFixed(2)}`)}
      ${tile(pct(s.sforoRate), 'turni con sforo', `nel range ${pct(s.rangeRate)} · colore ${pct(s.immuneRate)}`)}
      ${tile(s.turns.toFixed(1), 'turni per partita', `punti squadra ${s.pairPtsPerGame.toFixed(0)}`)}
      ${tile(pct(s.betrayRate), 'dichiarazioni tradite', '')}</div>
      <h3>Vantaggio di posto (vittorie individuali)</h3>${bars([0, 1, 2].map((p) => ({ label: FF.SEATS[p] + (agg.opts.rules.startExcluded >= 0 && p === agg.opts.rules.startExcluded ? ' · escluso iniziale' : ''), v: agg.seatWins[p] / n, color: S_COL[p] })), pct)}
      <h3>Andamento dei punteggi nel tempo</h3>${line}
      <div class="rowgrid3"><div><h3>Durata</h3>${bars(turnsH, pct)}</div><div><h3>Distacco 1°–2°</h3>${bars(margH, pct)}</div></div>
      <h3>Carte giocate (valori)</h3><div class="rowgrid3"><div><div class="lbl">per la coppia</div>${valBars('coppia', '#2f6fd1')}</div><div><div class="lbl">per sé</div>${valBars('se', '#e8833a')}</div><div><div class="lbl">escluso</div>${valBars('escluso', '#8a5fd1')}</div></div>
      <details class="adv"><summary>📋 Report completo (Markdown)</summary><div class="rules">${UI.md(md)}</div></details>
      <div class="btn-row"><button class="btn" id="x-md">⬇ Markdown</button><button class="btn" id="x-csv">⬇ CSV</button><button class="btn" id="x-json">⬇ JSON</button><button class="btn" id="x-copy">📋 Copia report</button></div></div>
      <div class="card"><h2>Elenco partite</h2><p class="small muted">"Rivedi" riproduce la partita dal seed, messaggio per messaggio, con le mani visibili.${n > 300 ? ' Mostrate le prime 300.' : ''}</p>
      <div class="tblwrap"><table class="gtable"><thead><tr><th>#</th><th>Seed</th><th>Posto A</th><th>Punteggi A/B/C</th><th>Vince</th><th>Coppia</th><th>Turni</th><th></th></tr></thead><tbody>${rowsG}</tbody></table></div></div>`;
    $('#x-md').onclick = () => UI.download('cromozapd-simulazione.md', md);
    $('#x-csv').onclick = () => UI.download('cromozapd-partite.csv', FF.Sim.csv(agg), 'text/csv;charset=utf-8');
    $('#x-json').onclick = () => UI.download('cromozapd-simulazione.json', JSON.stringify(agg), 'application/json');
    $('#x-copy').onclick = () => UI.copy(md);
    $$('[data-rev]', out).forEach((b) => (b.onclick = () => review(agg, Number(b.dataset.rev))));
    $$('[data-log]', out).forEach((b) => (b.onclick = () => {
      const l = agg.logs.find((x) => x.i === Number(b.dataset.log));
      const dlg = UI.modal(`<h2>📜 Partita ${l.i + 1} · seed ${esc(l.seed)}</h2><div class="logbox tall">${l.lines.map(UI.logLine).join('')}</div><div class="btn-row end"><button class="btn" data-t>⬇ .txt</button><button class="btn primary" data-x>Chiudi</button></div>`, { wide: true });
      dlg.el.querySelector('[data-x]').onclick = () => dlg.close();
      dlg.el.querySelector('[data-t]').onclick = () => UI.download(`cromozapd-${l.seed}.txt`, l.lines.map((e) => `[T${e.t}] ${e.text}`).join('\n'));
    }));
    out.scrollIntoView({ behavior: 'smooth' });
  }
  const S_COL = ['#e8833a', '#2aa7a0', '#8a5fd1'];

  // rigioca la partita i-esima (stesse scelte delle AI) e la apre in modalità "Rivedi"
  function review(agg, i) {
    const o = Object.assign({}, agg.opts, { rules: agg.opts.rules });
    const r = FF.Sim.playOne(i, o);
    const diff = {}; for (const k in o.rules) if (JSON.stringify(o.rules[k]) !== JSON.stringify(FF.DEFAULT_RULES[k])) diff[k] = o.rules[k];
    UI.startSession({ seed: r.seed, rules: diff, players: r.players, speed: 'step', notes: [], forced: o.forced ? { seat: r.aSeat, k: o.forced } : null }, r.g.history.slice(), { review: true });
  }
})(typeof window !== 'undefined' ? window : globalThis);
