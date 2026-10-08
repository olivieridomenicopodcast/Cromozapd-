'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const FF = require('./_load.js');
require('../js/ui/sprites.js');

test('sprite: ogni carta del mazzo e ogni effetto ha uno sprite SVG ben formato', () => {
  const S = FF.Sprites;
  for (const c of FF.buildDeck()) assert.ok(S.defs[S.cardId(c)], 'manca lo sprite di ' + FF.cardName(c));
  for (const k of FF.EFFECT_IDS) assert.ok(S.defs['eff-' + k], 'manca lo sprite dell\'effetto ' + k);
  for (const id of ['back', 'back-effect', 'token', 'dir-cw', 'dir-ccw', 'bolt', 'seat-A', 'seat-B', 'seat-C']) assert.ok(S.defs[id], id);
  for (const d of S.symbols) {
    const svg = S.standalone(d.id);
    assert.ok(svg.includes('<svg') && svg.trim().endsWith('</svg>'));
    const open = (svg.match(/<(g|text|svg)[ >]/g) || []).length, close = (svg.match(/<\/(g|text|svg)>/g) || []).length;
    assert.equal(open, close, d.id + ': tag non bilanciati');
    assert.ok(!svg.includes('undefined') && !svg.includes('NaN'), d.id);
  }
});

test('sprite: i file esportati in assets/sprites sono aggiornati (lancia node tools/export-sprites.js)', () => {
  const dir = path.join(__dirname, '..', 'assets', 'sprites');
  for (const d of FF.Sprites.symbols) assert.equal(fs.readFileSync(path.join(dir, d.id + '.svg'), 'utf8'), FF.Sprites.standalone(d.id), d.id);
});
