'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const FF = require('./_load.js');

// ── helper ──
const Z = (c, id) => ({ id: id || 700 + c, z: true, c });
const N = (v, c, id) => ({ id: id || 600 + v * 4 + c, v, c });
let uid = 1000;

/* Tavolo costruito a mano. hands = [[v,c]…] per A, B, C; center = [v,c];
   top = carte pescate per prime (in ordine di pesca) prima della centrale; after = pescate dopo la centrale. */
function mk(o = {}) {
  const g = new FF.Game({ seed: 1, rules: Object.assign({ base: 10, xInSum: false, rangeMode: 'base', modMode: 'range', modScale: 1, colorRules: false, immunity: true, cromozapd: false, xHidden: false, traitor: false, scoring: 'fattore' }, o.rules), log: true }); // i test di regola usano Base 10 e la vecchia regola dell'escluso (riferimento delle cifre); il default vero è provato a parte
  FF.drive(g, g.setupGen(), () => null);
  const s = g.s; let id = 1;
  const hands = o.hands || [[[6, 1], [2, 1], [1, 1]], [[9, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]];
  s.players.forEach((p, i) => {
    p.hand = hands[i].map(([v, c]) => ({ id: id++, v, c }));
    p.eff = ((o.eff || [[], [], []])[i]).map((k) => ({ id: uid++, k }));
    p.personal = 0;
  });
  const filler = []; for (let i = 0; i < 40; i++) filler.push({ id: 500 + i, v: 5, c: 3 });
  const ctr = { id: 450, v: (o.center || [5, 0])[0], c: (o.center || [5, 0])[1] };
  s.deck = [...filler, ...(o.after || []).slice().reverse(), ctr, ...(o.top || []).slice().reverse()];
  s.discard = []; s.zapPile = []; s.zapsDrawn = o.zaps || 0; s.pending = []; s.nextCenter = null;
  s.dominant = o.dom == null ? 3 : o.dom; s.excluded = o.excl == null ? 2 : o.excl; s.dir = o.dir || 1;
  s.pairPts = [0, 0, 0]; s.contrib = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  if (o.effDeck) s.effDeck = o.effDeck.map((k) => ({ id: uid++, k }));
  s.turn = 1; s.over = false;
  return g;
}
// policy scritta a mano; play: {pid:{couple:idx,self:idx,eff:'kind'}}
function pol(o = {}) {
  o.log = [];
  return (g, d) => {
    o.log.push(d);
    switch (d.type) {
      case 'sincero': return !!(o.sincero || {})[d.player];
      case 'declare': return (o.decl || {})[d.player] || { num: null, mod: null };
      case 'play': {
        const P = (o.play || {})[d.player] || { couple: 0, self: 1 };
        const e = P.eff ? d.eff.find((x) => x.k === P.eff) : null;
        return { couple: d.hand[P.couple].id, self: d.hand[P.self].id, eff: e ? e.id : null };
      }
      case 'xplay': return d.hand[o.x || 0].id;
      case 'annulla': { const w = (o.annulla || {})[d.player]; const t = w && d.targets.find((x) => x.k === w); return t ? t.idx : null; }
      case 'effdraw': return !!o.effdraw;
    }
    return null;
  };
}
const turn = (g, o = {}) => { FF.drive(g, g.turnGen(), pol(o)); return o; };
const pts = (g, e = 2) => g.s.pairPts[e];

test('mazzi: 93 carte (80 numeriche + 12 Zapd colorate + la Cromozapd), ogni colore-valore due volte; Mazzetto Effetti da 15', () => {
  const d = FF.buildDeck();
  assert.equal(d.length, 93);
  assert.equal(d.filter((c) => c.z).length, 13);
  assert.equal(d.filter((c) => c.cromo).length, 1);
  for (let c = 0; c < 4; c++) {
    assert.equal(d.filter((x) => x.z && x.c === c).length, 3);
    for (let v = 1; v <= 10; v++) assert.equal(d.filter((x) => !x.z && x.c === c && x.v === v).length, 2);
  }
  assert.equal(new Set(d.map((c) => c.id)).size, 93);
  const e = FF.buildEffectDeck();
  assert.equal(e.length, 15);
  assert.equal(e.filter((x) => x.k === 'reverse').length, 3);
  assert.equal(e.filter((x) => x.k === 'baratto').length, 3);
  assert.equal(e.filter((x) => x.k === 'sincero' || x.k === 'swap' || x.k === 'annulla').length, 0);
});

test('setup: 3 carte numeriche a testa, colore di partenza = colore di una Zapd, escluso iniziale A', () => {
  const g = new FF.Game({ seed: 7 });
  FF.drive(g, g.setupGen(), () => null);
  for (const p of g.s.players) { assert.equal(p.hand.length, 3); assert.ok(p.hand.every((c) => !c.z)); }
  assert.ok(g.s.dominant >= 0 && g.s.dominant < 4);
  assert.equal(g.s.zapPile.length, g.s.zapsDrawn);
  assert.equal(g.s.deck.length + 9 + g.s.zapPile.length, 93);
});

test('escluso iniziale a sorte: riproducibile dal seed, tutti e tre i posti possibili; con un valore fisso viene rispettato', () => {
  assert.equal(FF.DEFAULT_RULES.startExcluded, -1);
  const seen = new Set();
  for (let i = 0; i < 60; i++) { const g = new FF.Game({ seed: 'start' + i }); seen.add(g.s.excluded); assert.equal(new FF.Game({ seed: 'start' + i }).s.excluded, g.s.excluded); }
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
  assert.equal(new FF.Game({ seed: 3, rules: { startExcluded: 1 } }).s.excluded, 1);
  assert.equal(new FF.Game({ seed: 3, rules: { startExcluded: 2 } }).s.excluded, 2);
});

test('stesso seed → stessa partita; replay delle risposte riproduce il risultato', () => {
  const play = (seed, replay) => {
    const g = new FF.Game({ seed, log: true, replay });
    const bots = [FF.RandomBot(seed + 'a'), FF.RandomBot(seed + 'b'), FF.RandomBot(seed + 'c')];
    const r = FF.drive(g, g.run(), (game, d) => bots[d.player].decide(game, d));
    return { g, r };
  };
  const a = play('det', null), b = play('det', null), c = play('altro', null);
  assert.deepEqual(a.g.events.map((e) => e.text), b.g.events.map((e) => e.text));
  assert.notDeepEqual(a.g.events.map((e) => e.text), c.g.events.map((e) => e.text));
  const rp = new FF.Game({ seed: 'det', log: true, replay: a.g.history });
  const r2 = FF.drive(rp, rp.run(), () => { throw new Error('non deve chiedere nulla'); });
  assert.deepEqual(r2, a.r);
  assert.deepEqual(rp.events.map((e) => e.text), a.g.events.map((e) => e.text));
});

test('variante (solo simulazione) xInSum: la carta dell\'escluso conta nella somma controllata dal range', () => {
  // centro 5, Base 10 → 5..15. Coppia 6+9 = 15 (dentro). Escluso gioca 4: con xInSum la somma è 19 → sforo sopra.
  let g = mk({ rules: { xInSum: true } }); turn(g);
  assert.equal(pts(g), 0); assert.equal(g.stats.g.sfora_sopra, 1); assert.equal(g.stats.p[2].escluso_rovina_la_coppia, 1);
  // senza la variante resta com'era
  g = mk(); turn(g); assert.equal(pts(g), 6 + 9 + 4);
  // l'escluso può anche salvare: centro 12 non esiste, uso Base 5 → 5..10; coppia 2+3 = 5 sotto? no: 5 è dentro; uso 1+1=2 sotto, con escluso 4 → 6 dentro
  g = mk({ rules: { xInSum: true, base: 5 }, hands: [[[1, 1], [2, 1], [1, 1]], [[1, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]] }); turn(g);
  assert.equal(pts(g), 1 + 1 + 4); assert.equal(g.stats.p[2].escluso_salva_la_coppia, 1);
});

test('variante (solo simulazione) rangeOutside: si incassa solo con la somma FUORI dal range [V, V+Base]', () => {
  // centro 5, Base 3 → zona vietata 5..8
  let g = mk({ rules: { rangeOutside: true, base: 3 } }); turn(g); // 6+9 = 15: fuori → incassa
  assert.equal(pts(g), 6 + 9 + 4);
  g = mk({ rules: { rangeOutside: true, base: 3 }, hands: [[[2, 1], [2, 1], [1, 1]], [[4, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]] }); turn(g); // 2+4 = 6: dentro → sforo
  assert.equal(pts(g), 0); assert.equal(g.stats.g.sfora_dentro, 1);
});

test('regole predefinite: range da V a V+X, colore = regola, Cromozapd, carte Traditore, modificatori che allargano ×2', () => {
  const D = FF.DEFAULT_RULES;
  assert.equal(D.rangeMode, 'xsum'); assert.equal(D.xInSum, false); assert.equal(D.colorRules, true); assert.equal(D.immunity, false); assert.equal(D.cromozapd, true);
  assert.equal(D.traitor, true); assert.equal(D.traitorCards.length, 12); assert.equal(D.traitorOverflow, 3); assert.equal(D.barattoSee, true);
  assert.deepEqual(D.colorRuleMap, ['silenzio', 'carnevale', 'luce', 'effetti']);
  assert.equal(D.modMode, 'widen'); assert.equal(D.modScale, 2);
  const g = new FF.Game({ seed: 1, log: true }), R = g.rules;
  assert.deepEqual(FF.rangeBase(R, 6, 7), [6, 13]); assert.deepEqual(FF.rangeBase(R, 3, 1), [3, 4]);
  assert.deepEqual(FF.rangeFor(R, 6, { dir: 'lo', n: 2 }, 7), [2, 17]); assert.deepEqual(FF.rangeFor(R, 6, { dir: 'hi', n: 1 }, 7), [4, 15]);
  assert.equal(g.totalZaps, 13);
  assert.equal(FF.xmodeFor(R, 'luce'), 'first'); assert.equal(FF.xmodeFor(R, 'silenzio'), 'hidden'); assert.equal(FF.xmodeFor(R, 'carnevale'), 'hidden');
  // l'escluso gioca PER PRIMO, scoperto (prima di ogni dichiarazione): centro 6, X=7 → range 6–13
  const m = (xi) => mk({ rules: { rangeMode: 'xsum', xInSum: false, modMode: 'widen', modScale: 2 }, center: [6, 0], hands: [[[3, 1], [2, 1], [1, 1]], [[4, 1], [3, 1], [1, 1]], [[7, 1], [1, 2], [9, 2]]] });
  let t = m(); const p = turn(t, { x: 0 });
  const order = p.log.map((d) => d.type + (d.first ? '*' : ''));
  assert.ok(order.indexOf('xplay*') >= 0 && order.indexOf('xplay*') < order.indexOf('declare') && order.indexOf('xplay*') < order.indexOf('play'), order.join(','));
  assert.equal(order.filter((x) => x.startsWith('xplay')).length, 1, 'l\'escluso gioca una volta sola');
  assert.equal(t.s.pairPts[2], 3 + 4 + 7, '3+4=7 dentro 6–13: la coppia incassa 7 + la carta dell\'escluso (7)');
  assert.equal(t.s.players[2].hand.length, 2, 'la carta giocata esce dalla mano subito');
  // X=1 stringe il range a 6–7: 3+4=7 ancora dentro; 3+1... con X=1 e coppia 3+4 → ok; con X piccola e somma 7 > 7? usiamo X=1 → 6–7
  t = m(); turn(t, { x: 1 }); assert.equal(t.s.pairPts[2], 7 + 1);
  t = mk({ rules: { rangeMode: 'xsum', xInSum: false, modMode: 'widen', modScale: 2 }, center: [6, 0], hands: [[[6, 1], [2, 1], [1, 1]], [[6, 1], [3, 1], [1, 1]], [[7, 1], [1, 2], [9, 2]]] });
  turn(t, { x: 1 }); assert.equal(t.s.pairPts[2], 0, '6+6=12 fuori da 6–7 (X=1): sforo sopra');
  t = mk({ rules: { rangeMode: 'xsum', xInSum: false, modMode: 'widen', modScale: 2 }, center: [6, 0], hands: [[[6, 1], [2, 1], [1, 1]], [[6, 1], [3, 1], [1, 1]], [[7, 1], [1, 2], [9, 2]]] });
  turn(t, { x: 0 }); assert.equal(t.s.pairPts[2], 6 + 6 + 7, '6+6=12 dentro 6–13 con X=7');
  const g2 = new FF.Game({ seed: 1, log: true }); assert.equal(g2.rules.base, 12);
});

test('range da V a V+Base con estremi inclusi; la coppia incassa somma + carta dell\'escluso', () => {
  // centro 5 → 5..15: 6+9 = 15 (estremo alto)
  let g = mk(); turn(g);
  assert.equal(pts(g), 6 + 9 + 4); // escluso C gioca la 4
  // estremo basso: centro 10 → 10..20, 6+4=10
  g = mk({ center: [10, 0], hands: [[[6, 1], [2, 1], [1, 1]], [[4, 1], [3, 1], [1, 1]], [[7, 1], [8, 2], [9, 2]]] }); turn(g);
  assert.equal(pts(g), 6 + 4 + 7);
});

test('sforo sopra e sotto: la coppia fa 0, la carta dell\'escluso non conta per nessuno, la carta per sé sì', () => {
  const g = mk({ center: [4, 0] }); // 4..14, 6+9 = 15 → sopra
  turn(g);
  assert.equal(pts(g), 0);
  assert.equal(g.s.contrib.flat().reduce((a, b) => a + b, 0), 0);
  assert.equal(g.s.players[0].personal, 2); assert.equal(g.s.players[1].personal, 3);
  const h = mk({ center: [10, 0] }); // 10..20, 6+9 = 15 ok; per testare "sotto" servono carte piccole
  const g2 = mk({ center: [10, 0], hands: [[[3, 1], [2, 1], [1, 1]], [[4, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]] });
  turn(g2);
  assert.equal(pts(g2), 0); // 3+4 = 7 < 10
  assert.equal(g2.stats.g.sfora_sotto, 1);
  turn(h); assert.equal(pts(h), 6 + 9 + 4);
});

test('colore dominante: se entrambe le carte-coppia lo sono, niente perdita per sforo', () => {
  const g = mk({ center: [4, 0], dom: 1 }); // 6+9=15 > 14 ma entrambe colore 1 (dominante)
  turn(g);
  assert.equal(pts(g), 6 + 9 + 4);
  assert.equal(g.stats.g.coppia_salvata_dal_colore, 1);
  // una sola carta del colore dominante: non basta
  const h = mk({ center: [4, 0], dom: 1, hands: [[[6, 1], [2, 1], [1, 1]], [[9, 2], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]] });
  turn(h); assert.equal(pts(h), 0);
});

test('il colore della carta dell\'escluso e quello della carta centrale non contano', () => {
  const g = mk({ center: [4, 1], dom: 2, hands: [[[6, 1], [2, 1], [1, 1]], [[9, 1], [3, 1], [1, 1]], [[4, 2], [8, 2], [9, 2]]] });
  turn(g); assert.equal(pts(g), 0); // carta dell'escluso del colore dominante: nessuna immunità
});

test('modificatori ±: −n abbassa il minimo, +n alza il massimo (si sommano)', () => {
  // centro 8 → 8..18; coppia 3+4 = 7 sotto; con −1 il minimo è 7 → dentro
  let g = mk({ center: [8, 0], eff: [['lo1'], [], []], hands: [[[3, 1], [2, 1], [1, 1]], [[4, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'lo1' } } });
  assert.equal(pts(g), 7 + 4);
  // centro 5 → 5..15; 8+9 = 17: servono +2
  const hands = [[[8, 1], [2, 1], [1, 1]], [[9, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]];
  g = mk({ eff: [['hi1'], ['hi1'], []], hands }); turn(g, { play: { 0: { couple: 0, self: 1, eff: 'hi1' }, 1: { couple: 0, self: 1, eff: 'hi1' } } });
  assert.equal(pts(g), 17 + 4);
  g = mk({ eff: [['hi1'], [], []], hands }); turn(g, { play: { 0: { couple: 0, self: 1, eff: 'hi1' } } });
  assert.equal(pts(g), 0); // +1 non basta
});

test('Zapd da rimpiazzo: si risolve subito, si ripesca fino a 3 carte; i ruoli si fissano a pesca finita', () => {
  const g = mk({ hands: [[[6, 1], [2, 1]], [[9, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]], top: [Z(2), N(7, 1)] });
  const p = turn(g);
  assert.equal(g.s.zapsDrawn, 1);
  assert.equal(g.s.dominant, 2);
  assert.equal(g.s.excluded, 0); // C → A
  const xp = p.log.find((d) => d.type === 'xplay');
  assert.equal(xp.player, 0); assert.equal(xp.hand.length, 3);
  assert.deepEqual(xp.hand.map((c) => c.v), [6, 2, 7]);
});

test('Zapd come carta centrale: si risolve e si ripesca finché esce una numerica; due Zapd = due passi', () => {
  let g = mk({ top: [Z(1)] }); turn(g);
  assert.equal(g.s.excluded, 0); assert.equal(g.s.dominant, 1); assert.equal(g.s.center.v, 5);
  g = mk({ top: [Z(0), Z(1)] }); turn(g);
  // la 1ª Zapd fa avanzare C→A e inverte il verso; la 2ª fa tornare A→C e il verso torna com'era
  assert.equal(g.s.excluded, 2); assert.equal(g.s.dir, 1); assert.equal(g.s.dominant, 1); assert.equal(g.s.zapsDrawn, 2);
});

test('Reverse: inverte il verso; la Zapd successiva sposta l\'escluso al contrario', () => {
  const g = mk({ eff: [['reverse'], [], []] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'reverse' } } });
  assert.equal(g.s.dir, -1); assert.equal(g.s.excluded, 2);
  g.s.deck.push(Z(0)); turn(g);
  assert.equal(g.s.excluded, 1); // C → B (e non → A), poi la Zapd rimette il verso orario
  assert.equal(g.s.dir, 1);
});

test('Reverse giocato da due attivi: si annullano a vicenda', () => {
  const g = mk({ eff: [['reverse'], ['reverse'], []] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'reverse' }, 1: { couple: 0, self: 1, eff: 'reverse' } } });
  assert.equal(g.s.dir, 1);
});

test('Prossima carta: la cima del mazzo è la centrale del turno dopo; una seconda nello stesso turno non fa nulla', () => {
  const g = mk({ eff: [['next'], ['next'], []], after: [N(8, 2)] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'next' }, 1: { couple: 0, self: 1, eff: 'next' } } });
  assert.equal(g.s.nextCenter.v, 8);
  assert.ok(g.events.some((e) => e.text.includes('già una messa da parte')));
  turn(g);
  assert.equal(g.s.center.v, 8); assert.equal(g.s.nextCenter, null);
});

test('Zapd uscita da Prossima carta: effetti dal turno dopo (colore ed escluso), la partita finisce se era la 12ª', () => {
  let g = mk({ eff: [['next'], [], []], after: [Z(3), N(8, 2)], dom: 0 });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'next' } } });
  assert.equal(g.s.zapsDrawn, 1); assert.equal(g.s.dominant, 3); assert.equal(g.s.excluded, 0); assert.equal(g.s.nextCenter.v, 8);
  assert.ok(g.events.some((e) => e.text.includes('Zapd') && e.text.includes('Prossima carta')));
  g = mk({ eff: [['next'], [], []], after: [Z(3), N(8, 2)], zaps: 11 });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'next' } } });
  assert.equal(g.s.over, true);
});

test('Sincero: i modificatori si dichiarano esatti; quello non corrispondente vale 0', () => {
  const hands = [[[8, 1], [2, 1], [1, 1]], [[9, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]]; // 8+9 = 17 su 5..15
  // A dice +2 e gioca +2 (conta) → max 17 → dentro; B dice +2 ma gioca +3 (vale 0)
  let g = mk({ hands, eff: [['sincero', 'hi2'], ['hi3'], []] });
  turn(g, { sincero: { 0: true }, play: { 0: { couple: 0, self: 1, eff: 'hi2' }, 1: { couple: 0, self: 1, eff: 'hi3' } },
    decl: { 0: { num: 8, mod: { dir: 'hi', n: 2 } }, 1: { num: 9, mod: { dir: 'hi', n: 2 } } } });
  assert.equal(pts(g), 17 + 4);
  assert.equal(g.stats.p[1].sincero_mentito, 1);
  // A mente (dice +1, gioca +2) e B non ha modificatori → +2 vale 0 → sforo
  g = mk({ hands, eff: [['sincero', 'hi2'], [], []] });
  turn(g, { sincero: { 0: true }, play: { 0: { couple: 0, self: 1, eff: 'hi2' } }, decl: { 0: { num: 8, mod: { dir: 'hi', size: 'poco' } } } });
  assert.equal(pts(g), 0);
  // senza Sincero la dichiarazione non vincola
  g = mk({ hands, eff: [['hi2'], [], []] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'hi2' } }, decl: { 0: { num: 3, mod: { dir: 'hi', n: 1 } } } });
  assert.equal(pts(g), 17 + 4);
  // le dichiarazioni sul modificatore senza Sincero sono vaghe (anche se il bot dà un numero)
  assert.deepEqual(g.s.decls[0].mod, { dir: 'hi', size: 'poco' });
});

test('Sincero: la dichiarazione sul modificatore diventa esatta; Sincero non si gioca da chi non lo ha e va in scarto', () => {
  const g = mk({ eff: [['sincero'], [], []] });
  const p = turn(g, { sincero: { 0: true, 1: true } });
  assert.equal(g.s.effDiscard.filter((e) => e.k === 'sincero').length, 1);
  const decl = p.log.filter((d) => d.type === 'declare');
  assert.ok(decl.every((d) => d.sincero === true));
});

test('Scambio forzato: l\'attivo scambia tutte le carte numeriche in mano con l\'escluso (gli effetti no)', () => {
  const g = mk({ eff: [['swap', 'reverse'], [], []] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'swap' } } });
  // A: 3−2 giocate = [1]; C (escluso): 3−1 giocata = [8,9] → dopo lo scambio A ha [8,9] e C ha [1]
  assert.deepEqual(g.s.players[0].hand.map((c) => c.v), [8, 9]);
  assert.deepEqual(g.s.players[2].hand.map((c) => c.v), [1]);
  assert.deepEqual(g.s.players[0].eff.map((e) => e.k), ['reverse']);
});

test('Annulla: neutralizza un effetto in fila rivelato (anche del compagno); non si chiede se non ci sono effetti', () => {
  const hands = [[[9, 1], [2, 1], [1, 1]], [[9, 1], [3, 1], [1, 1]], [[4, 1], [8, 2], [9, 2]]]; // 18: serve +3
  let g = mk({ hands, eff: [['hi3'], ['annulla'], []] });
  let p = turn(g, { play: { 0: { couple: 0, self: 1, eff: 'hi3' } }, annulla: { 1: 'hi3' } });
  assert.equal(pts(g), 0);
  assert.equal(g.stats.p[0]['annullato:hi3'], 1);
  assert.equal(g.s.players[1].eff.length, 0);
  g = mk({ hands, eff: [['hi3'], ['annulla'], []] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'hi3' } } }); // B può ma non vuole
  assert.equal(pts(g), 18 + 4);
  g = mk({ eff: [[], ['annulla'], []] });
  p = turn(g);
  assert.equal(p.log.filter((d) => d.type === 'annulla').length, 0);
});

test('Annulla non può bersagliare Sincero (non è in fila)', () => {
  const g = mk({ eff: [['sincero', 'hi1'], ['annulla'], []] });
  const p = turn(g, { sincero: { 0: true }, play: { 0: { couple: 0, self: 1, eff: 'hi1' } } });
  const d = p.log.find((x) => x.type === 'annulla');
  assert.deepEqual(d.targets.map((t) => t.k), ['hi1']);
});

test('l\'escluso può pescare un effetto (max 2 in mano) e non può giocarne; gli attivi no', () => {
  let g = mk({ effDeck: ['swap', 'next', 'reverse'], eff: [[], [], ['annulla']] });
  let p = turn(g, { effdraw: true });
  assert.equal(g.s.players[2].eff.length, 2);
  assert.equal(g.s.players[0].eff.length, 0);
  // già a 2: non gli viene nemmeno chiesto
  g = mk({ effDeck: ['swap', 'next'], eff: [[], [], ['annulla', 'swap']] });
  p = turn(g, { effdraw: true });
  assert.equal(p.log.filter((d) => d.type === 'effdraw').length, 0);
  // l'escluso non riceve la domanda "play" (ha solo xplay)
  assert.ok(!p.log.some((d) => d.type === 'play' && d.player === 2));
});

test('giocata non valida: si usano le prime due carte e la cronaca avverte', () => {
  const g = mk();
  FF.drive(g, g.turnGen(), (game, d) => (d.type === 'play' ? { couple: 99999, self: 99999 } : d.type === 'xplay' ? d.hand[0].id : d.type === 'declare' ? { num: 99, mod: { dir: 'zz' } } : d.type === 'effdraw' ? false : null));
  assert.ok(g.events.some((e) => e.k === 'warn'));
  assert.deepEqual(g.s.decls[0], { num: null, mod: null });
});

test('fine partita: l\'ultima Zapd chiude il turno in corso; punteggio = personali × Fattore coppie; Fattore salta le coppie a 0', () => {
  const g = mk({ zaps: 11, top: [Z(0)] });
  turn(g);
  assert.equal(g.s.over, true);
  assert.equal(g.s.excluded, 0); // la Zapd ha spostato l'escluso su A: coppia BC
  const r = FF.drive(g, g.finish(), () => null);
  // BC: 6? B gioca la 9, C gioca la 4 → 13 nel range 5..15; A (escluso) gioca la 6 → 19
  assert.equal(g.s.pairPts[0], 9 + 4 + 6);
  assert.ok(Math.abs(r.factor[1] - 9 / 19) < 1e-9);
  assert.ok(Math.abs(r.factor[2] - 4 / 19) < 1e-9);
  assert.ok(Math.abs(r.factor[0] - 6 / 19) < 1e-9);
  assert.equal(r.personal[1], 3); assert.equal(r.personal[2], 8);
  assert.ok(Math.abs(r.scores[2] - 8 * 4 / 19) < 1e-9);
  assert.equal(r.pairWinner, 0);
  assert.equal(r.winner, 2); // 8×4/19 = 1.68 > 3×9/19 = 1.42
});

test('contributi: in ogni coppia i contributi % dei tre giocatori sommano al 100%', () => {
  const g = new FF.Game({ seed: 'contrib', log: false });
  const bots = [FF.RandomBot(1), FF.RandomBot(2), FF.RandomBot(3)];
  FF.drive(g, g.run(), (game, d) => bots[d.player].decide(game, d));
  for (let e = 0; e < 3; e++) {
    const tot = g.s.contrib[0][e] + g.s.contrib[1][e] + g.s.contrib[2][e];
    assert.equal(tot, g.s.pairPts[e]);
  }
});

test('fuzz: invarianti su 300 partite (carte non si perdono né si duplicano, limiti di mano, durata)', () => {
  let tot = 0;
  for (let i = 0; i < 300; i++) {
    const g = new FF.Game({ seed: 'fz' + i, log: false });
    const bots = [FF.RandomBot('x' + i), FF.RandomBot('y' + i), FF.RandomBot('z' + i)];
    FF.drive(g, g.run(), (game, d) => {
      const s = game.s;
      const ids = [...s.deck, ...s.discard, ...s.zapPile, ...s.players.flatMap((p) => p.hand)].map((c) => c.id);
      if (s.nextCenter) ids.push(s.nextCenter.id);
      if (s.center && !s.discard.includes(s.center)) ids.push(s.center.id);
      if (s.xFirstCard && !s.discard.includes(s.xFirstCard)) ids.push(s.xFirstCard.id);
      assert.equal(ids.length, 93, 'carte numeriche+Zapd: ' + ids.length);
      assert.equal(new Set(ids).size, 93, 'duplicati');
      const eids = [...s.effDeck, ...s.effDiscard, ...s.players.flatMap((p) => p.eff)].map((e) => e.id);
      assert.equal(eids.length, 15); assert.equal(new Set(eids).size, 15);
      for (const p of s.players) { assert.ok(p.hand.length <= 3 && p.eff.length <= 2); }
      assert.ok(s.zapPile.length === s.zapsDrawn);
      return bots[d.player].decide(game, d);
    });
    assert.ok(g.result.turns >= 5 && g.result.turns <= 14, 'turni ' + g.result.turns);
    assert.equal(g.s.zapsDrawn, 13);
    tot += g.result.turns;
  }
  const avg = tot / 300;
  assert.ok(avg > 10 && avg < 14, 'durata media ' + avg);
});

test('Zapd: cambia colore, fa avanzare l\'escluso e inverte il verso (prima avanza, poi inverte)', () => {
  let g = mk({ excl: 0, dir: 1, top: [Z(2)] }); turn(g);
  assert.equal(g.s.excluded, 1); assert.equal(g.s.dir, -1); assert.equal(g.s.dominant, 2);
  g = mk({ excl: 0, dir: -1, top: [Z(2)] }); turn(g);
  assert.equal(g.s.excluded, 2); assert.equal(g.s.dir, 1);
  g = mk({ excl: 0, dir: 1, top: [Z(2)], rules: { zapFlipsDir: false } }); turn(g);
  assert.equal(g.s.excluded, 1); assert.equal(g.s.dir, 1);
  g = mk({ excl: 2, dir: 1, eff: [['next'], [], []], after: [Z(3), N(8, 2)] });
  turn(g, { play: { 0: { couple: 0, self: 1, eff: 'next' } } });
  assert.equal(g.s.dir, -1); assert.equal(g.s.excluded, 0); assert.equal(g.s.dominant, 3);
});

test('rotazione: dal 2° turno l\'escluso avanza di un posto a ogni turno, e ancora a ogni Zapd; nel 1° turno resta A', () => {
  // turno 1: nessuna rotazione automatica
  let g = mk({ excl: 2 }); g.s.turn = 1; turn(g);
  assert.equal(g.s.excluded, 2);
  // turno 2, nessuna Zapd: C → A
  g = mk({ excl: 2 }); g.s.turn = 2; turn(g);
  assert.equal(g.s.excluded, 0);
  assert.ok(g.events.some((e) => e.k === 'rotate'));
  // turno 2 con una Zapd in pesca: C → A (turno) → B (Zapd)
  g = mk({ excl: 2, top: [Z(1)] }); g.s.turn = 2; turn(g);
  assert.equal(g.s.excluded, 1); assert.equal(g.s.dominant, 1);
  // col verso inverso: C → B
  g = mk({ excl: 2, dir: -1 }); g.s.turn = 2; turn(g);
  assert.equal(g.s.excluded, 1);
  // regola disattivata: come nella lettura letterale del Design Doc, cambia solo con le Zapd
  g = mk({ excl: 2, rules: { rotateEachTurn: false } }); g.s.turn = 2; turn(g);
  assert.equal(g.s.excluded, 2);
});

test('rotazione: in una partita intera senza Zapd ognuno è escluso a turno (A, B, C, A, …)', () => {
  const g = new FF.Game({ seed: 'rot', log: true, rules: { zapPerColor: 3 } });
  const bots = [FF.RandomBot(1), FF.RandomBot(2), FF.RandomBot(3)];
  const ex = []; g.onEvent = (e) => { if (e.k === 'roles') ex.push(e.d.excluded); };
  FF.drive(g, g.run(), (game, d) => bots[d.player].decide(game, d));
  // ad ogni turno l'escluso avanza di almeno un posto: non può restare lo stesso senza che una Zapd lo riporti (3 passi = giro completo)
  let same = 0; for (let t = 1; t < ex.length; t++) if (ex[t] === ex[t - 1]) same++;
  assert.ok(same < ex.length * 0.3, 'troppe ripetizioni: ' + same + '/' + ex.length);
});

test('regolamento (docs/REGOLAMENTO.md): parametri coerenti con il codice, rulebook.js aggiornato', () => {
  const fs = require('fs'), path = require('path');
  const md = fs.readFileSync(path.join(__dirname, '..', 'docs', 'REGOLAMENTO.md'), 'utf8');
  const gen = fs.readFileSync(path.join(__dirname, '..', 'js', 'rulebook.js'), 'utf8');
  assert.ok(gen.includes(JSON.stringify(md)), 'js/rulebook.js non aggiornato: lancia node tools/build-rules.js');
  const R = FF.DEFAULT_RULES, E = R.effectCopies;
  const val = (name) => {
    const row = md.split('\n').find((l) => l.startsWith('| ' + name));
    assert.ok(row, name + ' manca nel regolamento (§12)');
    return row.split('|')[2].replace(/\*/g, '').trim();
  };
  assert.equal(val('Range'), 'da V a V + X'); assert.equal(R.rangeMode, 'xsum');
  assert.equal(val('Modificatori ±n: allargano il range di n ×'), String(R.modScale));
  assert.equal(val('Carte in mano'), String(R.handSize));
  assert.equal(val('Effetti in mano al massimo'), String(R.effectHandMax));
  assert.equal(val('Zapd per colore'), String(R.zapPerColor));
  assert.equal(val('Punteggio'), R.scoring === 'podio' ? 'podio (3/2/1 per coppia, quota = somma dei tre podi)' : 'fattore');
  assert.equal(val('Cromozapd (13ª Zapd)'), R.cromozapd ? 'sì' : 'no');
  assert.equal(val('Colore dominante = regola in vigore'), R.colorRules ? 'sì' : 'no');
  assert.equal(val('La regola si attiva solo se la carta centrale ha il colore dominante'), R.colorTrigger ? 'sì' : 'no');
  assert.equal(val('Immunità del colore dominante'), R.immunity ? 'sì' : 'no');
  assert.equal(val('Carte nel mazzetto Traditore'), String(R.traitorCards.length));
  assert.equal(val('Valore di ogni Traditore dopo il mazzetto'), String(R.traitorOverflow));
  assert.equal(val('Baratto: chi lo gioca vede la mano dell\'escluso'), R.barattoSee ? 'sì' : 'no');
  assert.equal(val('Copie di Reverse'), String(E.reverse));
  assert.equal(val('Copie di Prossima carta'), String(E.next));
  assert.equal(val('Copie di Baratto'), String(E.baratto));
  assert.equal(val('Copie di ogni ±1/2/3'), String(E.lo1 + E.hi1));
  assert.equal(val('Escluso iniziale'), R.startExcluded < 0 ? 'a sorte' : String(R.startExcluded));
  assert.equal(val('L\'escluso avanza a ogni turno'), R.rotateEachTurn ? 'sì' : 'no');
  assert.equal(val('Ogni Zapd inverte il verso'), R.zapFlipsDir ? 'sì' : 'no');
  assert.ok(md.includes('93 carte') && md.includes('13 carte Zapd') && md.includes('15 carte'));
  // le regole di colore descritte nel regolamento sono quelle del codice
  FF.COLORS.forEach((c, i) => { const rl = FF.COLOR_RULES[R.colorRuleMap[i]]; assert.ok(md.includes('| ' + c.n + ' | **' + rl.n + '**'), c.n + ' → ' + rl.n); });
  assert.equal(R.effectCopies.sincero + R.effectCopies.swap + R.effectCopies.annulla, 0);
  for (const e of Object.values(FF.EFFECTS).filter((x) => !x.mod && !x.retired)) assert.ok(md.includes('**' + e.n + '**'), e.n + ' manca nel regolamento');
});

test('regole di colore: si attivano solo se la carta centrale ha il colore dominante; Silenzio, Luce, Effetti vietati cambiano il turno', () => {
  const run = (dom, ctr, over) => {
    const g = mk({ rules: Object.assign({ rangeMode: 'xsum', colorRules: true, colorTrigger: true, immunity: false, xHidden: true, traitor: true }, over || {}), center: ctr, dom });
    const p = turn(g, { x: 0 }); return { g, p };
  };
  let r = run(0, [5, 0]);
  assert.equal(r.g.s.rule, 'silenzio'); assert.ok(r.g.s.silent); assert.ok(!r.p.log.some((d) => d.type === 'declare' || d.type === 'xdecl'));
  r = run(0, [5, 1]);
  assert.equal(r.g.s.ruleLatent, 'silenzio'); assert.equal(r.g.s.rule, null); assert.ok(r.p.log.some((d) => d.type === 'xdecl')); assert.ok(r.p.log.some((d) => d.type === 'declare'));
  r = run(2, [5, 2]);
  assert.equal(r.g.s.rule, 'luce'); assert.equal(r.g.s.xmode, 'first'); assert.ok(r.p.log.some((d) => d.type === 'xplay' && d.first));
  r = run(3, [5, 3]);
  assert.equal(r.g.s.rule, 'effetti'); assert.ok(r.g.s.noEff);
  r = run(0, [5, 1], { colorTrigger: false });
  assert.equal(r.g.s.rule, 'silenzio');
});

test('Carnevale (Blu): se l\'escluso gioca un numero diverso dal dichiarato non pesca carte Traditore; nel turno normale sì', () => {
  const lie = (dom, ctr) => {
    const g = mk({ rules: { rangeMode: 'xsum', colorRules: true, colorTrigger: true, immunity: false, xHidden: true, traitor: true, traitorCards: [3] }, center: ctr, dom });
    g.s.traitorDeck = [3];
    // l'escluso dichiara 9 ma gioca la sua prima carta (4)
    const pol0 = pol({ x: 0 }); const base = pol0;
    FF.drive(g, g.turnGen(), (game, d) => (d.type === 'xdecl' ? 9 : base(game, d)));
    return g;
  };
  let g = lie(1, [5, 1]);   // Blu e centrale blu → Carnevale attivo
  assert.equal(g.s.rule, 'carnevale'); assert.equal(g.s.players[2].traitor.length, 0); assert.equal(g.stats.p[2].bugia_gratis_carnevale, 1);
  g = lie(1, [5, 0]);       // centrale di un altro colore → turno normale: pesca la carta Traditore
  assert.equal(g.s.rule, null); assert.equal(g.s.players[2].traitor.length, 1); assert.equal(g.s.players[2].traitor[0], 3);
});

test('punteggio a podio: 3/2/1 per coppia a chi ha messo di più, pari merito si divide, coppia a 0 vale 2 a testa; punteggio = personali × quota', () => {
  const g = mk({ rules: { scoring: 'podio' } });
  // AB: A 14, B 12, C 9 · BC: A 15, B 13, C 10 · AC: A 12, B 8, C 17 (esempio del regolamento)
  const s = g.s; s.contrib = [[14, 15, 12], [12, 13, 8], [9, 10, 17]]; s.pairPts = [35, 38, 37];
  // contrib[giocatore][escluso]: indice 0 = coppia con escluso A (BC)… per l'esempio basta l'ordinamento per colonna
  const q = [0, 1, 2].map((p) => g.podio(p));
  assert.deepEqual(q.map((x) => Math.round(x * 100) / 100), [8, 5, 5]);
  s.players[0].personal = 44; s.players[1].personal = 53; s.players[2].personal = 43;
  assert.deepEqual([0, 1, 2].map((p) => g.score(p)), [44 * 8, 53 * 5, 43 * 5]);
  // pari merito di punti e di carte: due a pari al primo posto prendono (3+2)/2 = 2,5 e l'ultimo 1
  s.contribN = [[2, 2, 2], [2, 2, 2], [2, 2, 2]]; s.contrib = [[5, 5, 5], [5, 5, 5], [3, 3, 3]]; s.pairPts = [13, 13, 13];
  assert.equal(g.podio(0), 7.5); assert.equal(g.podio(2), 3);
  // pari merito di punti ma con meno carte: vince chi ha messo meno carte
  s.contribN = [[4, 4, 4], [3, 3, 3], [2, 2, 2]]; s.contrib = [[12, 12, 12], [12, 12, 12], [9, 9, 9]]; s.pairPts = [33, 33, 33];
  assert.equal(g.podio(1), 9); assert.equal(g.podio(0), 6); assert.equal(g.podio(2), 3);
  // una coppia mai incassata vale 2 a tutti
  s.contribN = [[2, 2, 2], [2, 2, 2], [2, 2, 2]]; s.pairPts = [0, 13, 13]; s.contrib = [[0, 5, 5], [0, 5, 5], [0, 3, 3]];
  assert.equal(g.podio(0), 2 + 2.5 + 2.5);
});

test('foglio punti stampabile: esiste, spiega il podio e il pari merito, ha un esempio compilato che torna con il regolamento', () => {
  const fs = require('fs'), path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'foglio-punti.html'), 'utf8');
  for (const t of ['Foglio punti', 'PODIO', 'QUOTA', 'PERSONALI', 'PUNTEGGIO', 'Vale chi ha meno carte', 'ESEMPIO COMPILATO', 'Zona senza carte']) assert.ok(html.includes(t), t + ' manca nel foglio');
  // l'esempio del foglio e quello del regolamento usano gli stessi numeri e danno 8, 5, 5 → 352, 265, 215
  assert.ok(html.includes('A: [[3, 5, 2, 4]]') && html.includes('C: [[6, 4, 2, 5]]'));
  const g = mk({ rules: { scoring: 'podio' } }), s = g.s;
  s.contrib = [[14, 15, 12], [12, 13, 8], [9, 10, 17]]; s.pairPts = [35, 38, 37]; s.contribN = [[4, 4, 3], [3, 3, 2], [3, 3, 4]];
  assert.deepEqual([0, 1, 2].map((p) => g.podio(p)), [8, 5, 5]);
});
