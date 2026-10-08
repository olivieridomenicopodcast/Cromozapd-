#!/usr/bin/env node
/* Simulazione da riga di comando.
   Uso:  node tools/sim.js [--games 300] [--a hard] [--b medium] [--seed x] [--noswap]
                           [--rule base=7 --rule effectCopies.reverse=0] [--aparam samples=8] [--bparam trust=0.5]
                           [--forced reverse] [--out report.md] [--csv partite.csv] [--json agg.json] [--log 2]
         node tools/sim.js --experiment base=5,7,10 [--games 300]      (confronto di un parametro di regola)
         node tools/sim.js --effects 150                                 (analisi di ogni carta-effetto forzata)
   --log N stampa il log completo delle prime N partite. */
'use strict';
const fs = require('fs');
const FF = require('../tests/_load.js');

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const all = (k) => args.reduce((a, x, i) => (x === '--' + k ? a.concat(args[i + 1]) : a), []);
const conv = (v) => (v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v));
const kv = (list) => { const o = {}; list.forEach((s) => { const [k, v] = s.split('='); o[k] = conv(v); }); return o; };
let rules = {};
for (const s of all('rule')) { const [k, v] = s.split('='); rules = FF.Sim.setRule(rules, k, conv(v)); }
const opts = {
  games: Number(get('games', 200)), seed: get('seed', 'playtest'), a: get('a', 'hard'), b: get('b', 'medium'),
  swap: !args.includes('--noswap'), rules, keepLogs: Number(get('log', 0)), forced: get('forced', null),
  aParams: all('aparam').length ? kv(all('aparam')) : undefined, bParams: all('bparam').length ? kv(all('bparam')) : undefined,
};
const progress = (i, n) => process.stderr.write(`\r${i}/${n} `);
(async () => {
  let md;
  if (get('experiment')) {
    const [param, vals] = get('experiment').split('=');
    const rows = await FF.Sim.experiment(opts, param, vals.split(',').map(conv), progress);
    md = FF.Sim.reportExperiment(param, rows, opts);
  } else if (get('effects')) {
    const per = Number(get('effects'));
    const rows = await FF.Sim.analyzeEffects(opts, per, progress);
    md = FF.Sim.reportEffects(rows, opts, per);
  } else {
    const agg = await FF.Sim.run(opts, progress);
    md = FF.Sim.report(agg);
    if (get('csv')) fs.writeFileSync(get('csv'), FF.Sim.csv(agg));
    if (get('json')) fs.writeFileSync(get('json'), JSON.stringify(agg));
    for (const l of agg.logs) {
      console.log(`\n=== Partita ${l.i} (seed ${l.seed}) — posto di A: ${FF.SEATS[l.aSeat]} — punteggi ${l.scores.map((x) => x.toFixed(1)).join(' / ')} ===`);
      console.log(l.lines.map((e) => `[T${e.t}] ${e.text}`).join('\n'));
    }
  }
  process.stderr.write('\n');
  if (get('out')) fs.writeFileSync(get('out'), md + '\n'); else console.log(md);
})();
