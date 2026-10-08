'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const FF = require('./_load.js');

function playGame(seed, levels, onDecision) {
  const g = new FF.Game({ seed, log: false });
  const ai = levels.map((l, i) => FF.AI.create(l, seed + 'a' + i));
  const r = FF.drive(g, g.run(), (game, d) => { const a = ai[d.player].decide(game, d); if (onDecision) onDecision(game, d, a); return a; });
  return { g, r };
}

test('AI: tutte le risposte sono legali (nessun avviso del motore) per ogni livello', () => {
  for (const lv of [['easy', 'easy', 'easy'], ['medium', 'medium', 'medium'], ['hard', 'hard', 'hard'], ['hard', 'medium', 'easy']]) {
    for (let i = 0; i < 6; i++) {
      const g = new FF.Game({ seed: 'leg' + i + lv.join(''), log: true });
      const ai = lv.map((l, k) => FF.AI.create(l, 'x' + i + k));
      FF.drive(g, g.run(), (game, d) => ai[d.player].decide(game, d));
      assert.deepEqual(g.events.filter((e) => e.k === 'warn'), [], lv.join() + ' partita ' + i);
      assert.equal(g.s.zapsDrawn, 12);
    }
  }
});

test('AI: stesso seed → stessa partita (determinismo) e replay delle risposte', () => {
  const a = playGame('det1', ['hard', 'medium', 'easy']), b = playGame('det1', ['hard', 'medium', 'easy']);
  assert.deepEqual(a.r, b.r);
  assert.deepEqual(a.g.history, b.g.history);
  const rp = new FF.Game({ seed: 'det1', log: false, replay: a.g.history });
  assert.deepEqual(FF.drive(rp, rp.run(), () => { throw new Error('non deve chiedere nulla'); }), a.r);
});

// L'AI non deve sbirciare: se si rimescola ciò che non può sapere (mani altrui, mazzo, effetti altrui), la decisione resta identica.
function scramble(game, pid, seed) {
  const g = game.clone(), s = g.s, rng = FF.makeRng(seed);
  const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const others = [0, 1, 2].filter((i) => i !== pid);
  const pool = sh([...s.deck, ...others.flatMap((q) => s.players[q].hand)]);
  for (const q of others) s.players[q].hand = pool.splice(0, s.players[q].hand.length);
  s.deck = pool;
  const ep = sh([...s.effDeck, ...others.flatMap((q) => s.players[q].eff)]);
  for (const q of others) s.players[q].eff = ep.splice(0, s.players[q].eff.length);
  s.effDeck = ep;
  s.rng = (s.rng * 7 + 13) | 0;
  return g;
}
test('AI: non sbircia (la decisione non dipende da mani altrui, ordine del mazzo, effetti altrui, dadi del motore)', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    let checked = 0; const kinds = {};
    const g = new FF.Game({ seed: 'peek-' + level, log: false });
    const ai = [0, 1, 2].map((i) => FF.AI.create(level, 'p' + i));
    FF.drive(g, g.run(), (game, d) => {
      if (checked < 60 && (game.s.turn % 2 === 0 || d.type !== 'play')) {
        const A = FF.AI.create(level, 'chk' + checked), B = FF.AI.create(level, 'chk' + checked);
        const x = A.decide(game, d), y = B.decide(scramble(game, d.player, 'sc' + checked), d);
        assert.deepEqual(x, y, `${level}: la decisione ${d.type} cambia se si rimescolano le carte nascoste`);
        kinds[d.type] = (kinds[d.type] || 0) + 1; checked++;
      }
      return ai[d.player].decide(game, d);
    });
    assert.ok(kinds.play > 3 && kinds.declare > 3 && kinds.xplay > 1, level + ' ' + JSON.stringify(kinds));
  }
});

test('AI: determinize conserva le carte e rispetta le conte (mani, mazzo, effetti)', () => {
  const g = new FF.Game({ seed: 'det-cons', log: false });
  const ai = FF.AI.create('easy', 1);
  let n = 0;
  FF.drive(g, g.run(), (game, d) => {
    if (n++ % 7 === 0) {
      const v = FF.AI.determinize(game, d.player, FF.makeRng(n));
      const ids = [...v.s.deck, ...v.s.discard, ...v.s.zapPile, ...v.s.players.flatMap((p) => p.hand)].map((c) => c.id);
      if (v.s.nextCenter) ids.push(v.s.nextCenter.id);
      if (v.s.center && !v.s.discard.includes(v.s.center)) ids.push(v.s.center.id);
      assert.equal(new Set(ids).size, 92); assert.equal(ids.length, 92);
      assert.deepEqual(v.s.players[d.player].hand, game.s.players[d.player].hand);
      assert.ok(v.s.players.every((p) => p.hand.every((c) => !c.z && c.v >= 1)), 'nelle mani non devono esserci Zapd');
      v.s.players.forEach((p, i) => { assert.equal(p.hand.length, game.s.players[i].hand.length); assert.equal(p.eff.length, game.s.players[i].eff.length); });
      assert.equal(new Set([...v.s.effDeck, ...v.s.effDiscard, ...v.s.players.flatMap((p) => p.eff)].map((e) => e.id)).size, 17);
    }
    return ai.decide(game, d);
  });
});

test('AI: i tradimenti sono contati e compaiono in cronaca', () => {
  const g = new FF.Game({ seed: 'betray', log: true });
  const ai = [FF.AI.create('easy', 1), FF.AI.create('easy', 2), FF.AI.create('easy', 3)];
  FF.drive(g, g.run(), (game, d) => ai[d.player].decide(game, d));
  const t = [0, 1, 2].reduce((a, p) => a + (g.stats.p[p].tradimenti || 0), 0);
  assert.equal(g.events.filter((e) => e.text.includes('Ha tradito')).length, t);
});
