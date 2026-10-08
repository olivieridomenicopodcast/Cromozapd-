'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const FF = require('./_load.js');

test('simulatore: stessi parametri → stessi risultati; posti alternati A/B/C', async () => {
  const o = { games: 12, seed: 'simT', a: 'medium', b: 'easy', rules: {} };
  const x = await FF.Sim.run(o), y = await FF.Sim.run(o);
  assert.deepEqual(x.games, y.games);
  assert.deepEqual(x.seatN, [4, 4, 4]);
  assert.equal(x.aWins + x.bWins + x.draws, 12);
  assert.equal(x.seatWins.reduce((a, b) => a + b, 0) + x.draws, 12);
});

test('simulatore: intervalli di confidenza coerenti', () => {
  const [lo, hi] = FF.Sim.wilson(50, 100);
  assert.ok(lo < 0.5 && hi > 0.5 && lo > 0.39 && hi < 0.61);
  assert.deepEqual(FF.Sim.wilson(0, 0), [0, 0]);
  const m = FF.Sim.meanCI(4, 20, 120); // valori 5±…
  assert.equal(m.m, 5); assert.ok(m.lo < 5 && m.hi > 5);
});

test('simulatore: report Markdown, CSV e JSON esportabili', async () => {
  const agg = await FF.Sim.run({ games: 6, seed: 'rep', a: 'easy', b: 'easy', keepLogs: 1 });
  const md = FF.Sim.report(agg);
  for (const t of ['## Vittorie', '## Vantaggio di posto', '## Come vanno i turni', '## Andamento dei punteggi', '## Carte giocate']) assert.ok(md.includes(t), t);
  assert.equal(FF.Sim.csv(agg).split('\n').length, 7);
  assert.ok(agg.logs.length === 1 && agg.logs[0].lines.length > 50);
  assert.doesNotThrow(() => JSON.stringify(agg));
  const s = FF.Sim.summary(agg);
  assert.ok(s.sforoRate >= 0 && s.sforoRate <= 1 && Math.abs(s.sforoRate + s.rangeRate + s.immuneRate - 1) < 1e-9);
});

test('simulatore: esperimento sulle regole cambia davvero il parametro', async () => {
  const rows = await FF.Sim.experiment({ games: 10, seed: 'exp', a: 'easy', b: 'easy', rules: { rangeMode: 'base' } }, 'base', [0, 10]);
  assert.equal(rows.length, 2);
  assert.ok(rows[0].s.sforoRate > rows[1].s.sforoRate, 'con Base 0 lo sforo deve essere molto più frequente');
  assert.deepEqual(FF.Sim.setRule({}, 'effectCopies.reverse', 0), { effectCopies: { reverse: 0 } });
});

test('simulatore: analisi di una carta forzata la mette davvero in mano ad A', async () => {
  const r = FF.Sim.playOne(0, { seed: 'frc', a: 'hard', b: 'easy', forced: 'swap', rules: {}, games: 1 });
  const all = [...r.g.s.effDiscard, ...r.g.s.players.flatMap((p) => p.eff)];
  assert.ok(all.some((e) => e.id === 900 && e.k === 'swap'), 'la carta forzata deve esistere (giocata o ancora in mano)');
  const rows = await FF.Sim.analyzeEffects({ games: 3, seed: 'ae', a: 'easy', b: 'easy', rules: { effectCopies: { reverse: 0 } } }, 3);
  assert.equal(rows.length, FF.EFFECT_IDS.length - 1); // reverse escluso: 0 copie
  assert.ok(rows.every((x) => x.n === 3));
});

test('simulatore: parametri dell\'AI sovrascrivibili (torneo tra varianti)', () => {
  const r = FF.Sim.playOne(0, { seed: 'par', a: 'hard', b: 'hard', aParams: { samples: 2 }, rules: {}, games: 1 });
  assert.ok(r.res.turns > 5);
});
