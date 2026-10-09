/* CROMOZAPD — il tavolo: mazzi, carta centrale, posti dei giocatori, punteggi e stati a colpo d'occhio */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const UI = FF.UI;
  const { esc } = UI;
  const S = FF.Sprites;
  const { COLORS, EFFECTS } = FF;
  const PHASES = [['draw', '1 Pesca'], ['discuss', '2 Discussione'], ['play', '3 Gioco coperto'], ['reveal', '4 Reveal'], ['resolve', '5 Risoluzione']];

  const pile = (cls, spr, n, label, sub) => `<div class="pile ${cls}"><div class="pilecards">${spr}<span class="pcount">${n}</span></div><div class="plabel">${label}</div>${sub ? `<div class="psub">${sub}</div>` : ''}</div>`;

  const ruleOf = (g) => (g.rules.colorRules ? FF.COLOR_RULES[FF.ruleOf(g.rules, g.s.dominant)] || null : null);
  // la regola del colore dominante vale solo se la carta centrale è di quel colore
  function ruleText(g, center) {
    if (g.s.dominant == null) return { rl: null, on: false, txt: 'Nessun colore dominante finché non esce la prima Zapd: <b>nessuna regola</b>.' };
    const rl = ruleOf(g); if (!rl) return null;
    const dom = COLORS[g.s.dominant].n;
    if (!g.rules.colorTrigger) return { rl, on: true, txt: `<b>${rl.i} ${rl.n}</b>: ${rl.s}` };
    if (!center) return { rl, on: null, txt: `Regola del ${dom}: <b>${rl.i} ${rl.n}</b>. Si attiva solo se la carta centrale è ${dom}.` };
    return center.c === g.s.dominant
      ? { rl, on: true, txt: `<b>${rl.i} ${rl.n}</b> ATTIVA: ${rl.s}` }
      : { rl, on: false, txt: `La regola del ${dom} è ${rl.i} ${rl.n}, ma la carta centrale è ${COLORS[center.c].n}: <b>nessuna regola</b> in questo turno.` };
  }

  function zapBar(g) {
    const s = g.s, tot = g.totalZaps; let h = '';
    for (let i = 0; i < tot; i++) {
      const z = s.zapPile[i];
      h += z ? (z.cromo ? '<span class="zslot on cromo" title="Cromozapd">🌈</span>' : `<span class="zslot on" style="--zc:${S.COL[z.c]}" title="Zapd ${COLORS[z.c].n}">${COLORS[z.c].sym}</span>`) : '<span class="zslot" title="Zapd ancora nel mazzo">⚡</span>';
    }
    return `<div class="zapbar"><div class="plabel">⚡ Zapd uscite ${s.zapsDrawn}/${tot}</div><div class="zslots">${h}</div></div>`;
  }

  function rangeBox(g, tab) {
    const s = g.s, c = tab && tab.center; if (!c) return '<div class="rangebox muted">Il range apparirà con la carta centrale.</div>';
    const sc = tab && tab.score, hidden = s.xmode === 'hidden', first = s.xmode === 'first', xv = tab && tab.xcard ? tab.xcard.v : undefined;
    const xmode = !!s.xmode;
    if (xmode && xv == null && !sc) {
      const decl = hidden && s.xDecl != null ? ` L'escluso ha dichiarato <b>${s.xDecl}</b>, ma può mentire.` : '';
      return `<div class="rangebox"><div class="rtitle">Range: la somma delle 2 carte-coppia</div><div class="rnums"><b>${c.v}</b><span class="rline"></span><b>${c.v} + X</b></div><div class="rsub">${hidden ? `X = la carta che l'escluso ha giocato <b>coperta</b>: si scopre al reveal.${decl}${s.silent ? ' <b>Silenzio:</b> nessuna dichiarazione.' : ''}` : "X = la carta che gioca l'escluso, scoperta, per prima"}</div></div>`;
    }
    const xx = sc ? (sc.xv != null ? sc.xv : xv) : xv;
    const [b0, b1] = FF.rangeBase(g.rules, c.v, xx), min = sc ? sc.min : b0, max = sc ? sc.max : b1;
    const mods = sc && (min !== b0 || max !== b1) ? ` <span class="modnote">(con i modificatori)</span>` : '';
    let verdict = '';
    if (sc) verdict = `<div class="verdict ${sc.scored ? (sc.inRange ? 'ok' : 'imm') : 'ko'}">Somma ${sc.sum}: ${sc.inRange ? '✔ nel range' : sc.scored ? '🛡 immune (colore dominante)' : '💥 SFORO'}</div>`;
    return `<div class="rangebox"><div class="rtitle">Range: la somma delle 2 carte-coppia${g.rules.xInSum ? ' + la carta dell\'escluso' : ''}</div><div class="rnums"><b>${min}</b><span class="rline"></span><b>${max}</b></div><div class="rsub">da ${min} a ${max} compresi (V=${c.v}${xmode ? ` + X=${xx}` : g.rules.rangeMode === 'pivot' ? ', centrato su ' + g.rules.pivot : ', Base ' + g.rules.base})${mods}</div>${verdict}</div>`;
  }

  function seatBox(g, pid, view) {
    const s = g.s, p = s.players[pid], ex = s.excluded;
    const isEx = pid === ex, tab = view.tab || {};
    const show = view.hands && view.hands.includes(pid);
    const hand = show ? p.hand.map((c) => UI.cardHTML(c, { cls: 'seatcard' })).join('') : p.hand.map(() => S.back('seatcard')).join('');
    const eff = show ? p.eff.map((c) => UI.cardHTML(c, { cls: 'seatcard' })).join('') : p.eff.map(() => S.backEffect('seatcard')).join('');
    const pl = tab.played && tab.played[pid];
    let played = '';
    if (pl) played = `<div class="played">${pl.couple ? `<div class="pc"><div class="plab">per la coppia</div>${UI.miniCard(pl.couple)}</div>` : ''}${pl.self ? `<div class="pc"><div class="plab">per sé</div>${UI.miniCard(pl.self)}</div>` : ''}${pl.eff ? `<div class="pc"><div class="plab">effetto</div>${UI.miniCard(pl.eff)}</div>` : ''}</div>`;
    const kind = p.kind === 'human' ? '👤' : '🤖' + (p.level ? ' ' + FF.LEVELS[p.level] : '');
    const role = isEx ? `<span class="role ex">${S.token('rtok')} ESCLUSO</span>` : `<span class="role">coppia ${FF.pairLabel(ex)}</span>`;
    return `<div class="seat s${pid} ${view.active === pid ? 'turn' : ''} ${isEx ? 'isex' : ''}" style="--sc:${S.SEATCOL[pid]}">
      <div class="shead">${S.seat(pid, 'sbadge')}<div class="sname"><b>${esc(p.name)}</b><span class="skind">${kind}</span></div>${role}</div>
      <div class="shand"><div class="hlabel">Mano (${p.hand.length})</div><div class="cardsrow">${hand || '<span class="muted small">vuota</span>'}</div></div>
      <div class="shand"><div class="hlabel">Effetti (${p.eff.length})</div><div class="cardsrow">${eff || '<span class="muted small">nessuno</span>'}</div></div>
      ${p.traitor && p.traitor.length ? `<div class="trait" title="Carte Traditore: tolgono punti personali">🐍 ${p.traitor.map((v) => `<span class="tcard">−${v}</span>`).join(' ')}</div>` : ''}
      ${played}</div>`;
  }

  UI.renderTable = function (el, g, view) {
    view = view || {};
    const s = g.s, tab = view.tab || {};
    const nextEx = FF.mod3(s.excluded + s.dir);
    const nc = s.nextCenter ? UI.miniCard(s.nextCenter) : '';
    el.innerHTML = `
      <div class="tbl-top">
        ${pile('deck', S.back('pilecard'), s.deck.length, 'Mazzo', 'pesca dall\'alto')}
        ${pile('effpile', S.backEffect('pilecard'), s.effDeck.length, 'Mazzetto Effetti', 'solo l\'escluso pesca')}
        ${pile('discardp', s.discard.length ? S.card(s.discard[s.discard.length - 1], 'pilecard') : '<div class="emptyslot"></div>', s.discard.length, 'Scarti', 'carte giocate')}
        ${zapBar(g)}
      </div>
      <div class="tbl-mid">
        <div class="centerblock"><div class="clabel">Carta centrale</div>${tab.center ? UI.cardHTML(tab.center, { cls: 'bigcard' }) : '<div class="emptyslot big"></div>'}</div>
        ${rangeBox(g, tab)}
        <div class="domblock"><div class="clabel">Colore dominante</div><div class="domcol" style="--dc:${s.dominant == null ? '#777' : S.COL[s.dominant]}">${s.dominant == null ? '' : S.color(s.dominant, 'domsym')}<b>${s.dominant == null ? 'Nessuno' : COLORS[s.dominant].n}</b></div><div class="psub">${ruleText(g, tab.center) ? ruleText(g, tab.center).txt : 'Se le 2 carte-coppia sono di questo colore: nessuno sforo'}</div></div>
        <div class="dirblock"><div class="clabel">Verso</div>${S.dir(s.dir, 'dirbig')}<div class="psub">${g.rules.rotateEachTurn ? `Al prossimo turno il gettone passa a <b>${FF.SEATS[nextEx]}</b>; ogni Zapd lo sposta ancora e inverte il verso` : `Prossima Zapd: il gettone passa a <b>${FF.SEATS[nextEx]}</b>`}</div></div>
        ${s.nextCenter ? `<div class="nextblock"><div class="clabel">Messa da parte</div>${nc}<div class="psub">centrale del turno dopo</div></div>` : ''}
      </div>
      <div class="seats">${[0, 1, 2].map((p) => seatBox(g, p, view)).join('')}</div>`;
  };

  // punteggi e contributi di tutti, sempre visibili
  UI.renderScores = function (el, g) {
    const s = g.s, pod = g.rules.scoring === 'podio';
    const head = `<tr><th></th>${[0, 1, 2].map((e) => `<th title="Punti della coppia ${FF.pairLabel(e)}">${FF.pairLabel(e)}</th>`).join('')}<th title="Somma delle carte per sé, meno le carte Traditore">Pers.</th><th title="${pod ? 'Somma dei podi nelle 3 coppie (3 al primo, 2 al secondo, 1 all\'ultimo)' : 'Media delle tue quote nelle 3 coppie'}">${pod ? 'Quota' : 'Fatt.'}</th><th title="${pod ? 'Personali × Quota' : 'Personali × Fattore'}">Punti</th></tr>`;
    const pairRow = `<tr class="pairrow"><td>Coppia</td>${[0, 1, 2].map((e) => `<td><b>${s.pairPts[e]}</b></td>`).join('')}<td colspan="3" class="muted">squadra</td></tr>`;
    const cell = (p, e) => (pod ? (s.pairPts[e] ? `${s.contrib[p][e]} <span class="podio p${String(g.podioIn(p, e)).replace('.', '_')}" title="podio: ${g.podioIn(p, e)}">${g.podioIn(p, e)}</span>` : '–') : (s.pairPts[e] ? Math.round(100 * s.contrib[p][e] / s.pairPts[e]) + '%' : '–'));
    const rows = [0, 1, 2].map((p) => `<tr class="pr${p}"><td>${S.seat(p, 'tinyseat')} ${esc(s.players[p].name)}</td>${[0, 1, 2].map((e) => `<td>${cell(p, e)}</td>`).join('')}<td>${s.players[p].personal}${s.players[p].traitor && s.players[p].traitor.length ? ` <span class="muted" title="Carte Traditore: −${s.players[p].traitor.reduce((a, b) => a + b, 0)}">🐍</span>` : ''}</td><td>${pod ? g.factor(p) : Math.round(100 * g.factor(p)) + '%'}</td><td><b>${pod ? Math.round(g.score(p)) : g.score(p).toFixed(1)}</b></td></tr>`).join('');
    el.innerHTML = `<table class="scoretbl"><thead>${head}</thead><tbody>${pairRow}${rows}</tbody></table>
      <div class="small muted" style="margin-top:6px">${pod ? 'Colonne AB / BC / AC: i punti che ognuno ha messo in quella coppia (anche da escluso) e, in piccolo, il podio: 3 a chi ne ha messi di più, 2 al secondo, 1 all\'ultimo (a pari punti vince chi ha messo meno carte). Quota = somma dei tre podi. Punti = personali × Quota.' : 'Colonne AB / BC / AC: quota di ognuno nei punti di quella coppia (anche da escluso). Punti = personali × Fattore.'}</div>`;
  };

  // stati speciali: descritti sempre, anche quando non sono attivi
  UI.renderStates = function (el, g) {
    const s = g.s, ex = s.excluded;
    const item = (ico, title, state, on, desc) => `<div class="state ${on ? 'on' : 'off'}"><div class="sico">${ico}</div><div><div class="stitle">${title} <span class="sbadge2 ${on ? 'on' : ''}">${state}</span></div><div class="sdesc">${desc}</div></div></div>`;
    const rl = ruleOf(g);
    el.innerHTML = [
      item(s.dominant == null ? '⚪' : S.color(s.dominant, 'stico'), 'Colore dominante', s.dominant == null ? 'nessuno' : COLORS[s.dominant].n, true, s.dominant == null ? 'Finché non esce la prima Zapd (o la Cromozapd) non c\'è nessun colore dominante, quindi nessuna regola.' : rl ? `Dice qual è la regola: ${rl.i} <b>${rl.n}</b> — ${rl.d} La regola si attiva solo nei turni in cui la carta centrale è di questo colore (ora: ${g.s.rule ? 'ATTIVA' : 'non attiva'}). Cambia a ogni Zapd.` : 'Se entrambe le carte-coppia degli attivi sono di questo colore la coppia non perde mai per sforo. Cambia a ogni Zapd.'),
      item(S.dir(s.dir, 'stico'), 'Verso di rotazione', s.dir > 0 ? '↻ A→B→C' : '↺ A→C→B', true, g.rules.rotateEachTurn ? `L'escluso ora è ${FF.SEATS[ex]}. Passa al giocatore dopo (${FF.SEATS[FF.mod3(ex + s.dir)]}) a ogni nuovo turno e a ogni Zapd; ogni Zapd (e Reverse) inverte il verso.` : `L'escluso ora è ${FF.SEATS[ex]}. A ogni Zapd passa a ${FF.SEATS[FF.mod3(ex + s.dir)]}. Reverse inverte il verso.`),
      item('🔮', 'Carta messa da parte', s.nextCenter ? FF.cardName(s.nextCenter) : 'nessuna', !!s.nextCenter, s.nextCenter ? 'Sarà la carta centrale del turno dopo (la pesca centrale viene saltata).' : 'Prossima carta ne mette una da parte: diventa la centrale del turno dopo.'),
      item('⚡', 'Zapd', `${s.zapsDrawn}/${g.totalZaps}`, s.zapsDrawn >= g.totalZaps - 2, s.zapsDrawn >= g.totalZaps ? 'Uscite tutte: è l\'ultimo turno.' : `Ne mancano ${g.totalZaps - s.zapsDrawn}${g.rules.cromozapd && !g.s.zapPile.some((z) => z.cromo) ? ' (una è la 🌈 Cromozapd: tutti passano la mano e chi la pesca sceglie la regola)' : ''}: la partita finisce con l\'uscita dell\'ultima (si gioca quel turno per intero).`),
    ].join('');
  };

  UI.renderPhases = function (el, g) {
    const ph = g.s.phase;
    const idx = PHASES.findIndex((p) => p[0] === ph || (ph === 'turn_end' && p[0] === 'resolve'));
    el.innerHTML = PHASES.map((p, i) => `<span class="phchip ${i === idx ? 'now' : i < idx ? 'done' : ''}">${p[1]}</span>`).join('<span class="phsep">›</span>');
  };
})(typeof window !== 'undefined' ? window : globalThis);
