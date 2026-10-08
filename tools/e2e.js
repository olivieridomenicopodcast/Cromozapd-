#!/usr/bin/env node
/* Prova nel browser: gioca una partita completa con un "bot" che clicca l'interfaccia, raccoglie errori di console
   e fa screenshot dei momenti principali.
   Uso: NODE_PATH=/opt/node-tools/node_modules node tools/e2e.js [--url http://localhost:8123/] [--mode ai|hotseat|watch]
        [--seed x] [--out cartella] [--mobile] */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const url = get('url', 'http://localhost:8123/'), mode = get('mode', 'ai'), seed = get('seed', 'e2e1'), out = get('out', '/tmp/e2e'), mobile = args.includes('--mobile');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 }, hasTouch: mobile, isMobile: mobile });
  const errors = [];
  p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(url);
  await p.click(`.mode[data-mode=${mode}]`);
  if (mode === 'watch') await p.click('#su-speed [data-v=instant]');
  await p.fill('#su-seed', seed);
  await p.click('#su-go');
  const shots = {}; const seen = {}; let steps = 0, decisions = 0;
  const snap = async (name) => { if (shots[name]) return; shots[name] = 1; await p.screenshot({ path: `${out}/${mobile ? 'm-' : 'd-'}${name}.png`, fullPage: true }); };
  const click = async (sel) => { const e = await p.$(sel); if (e && await e.isVisible()) { await e.click({ timeout: 2000 }); return true; } return false; };
  for (; steps < 6000; steps++) {
    if (await p.$('.dlg:has-text("Fine partita")')) { await snap('fine'); break; }
    if (await click('[data-x]')) { await snap('cover'); continue; }
    if (await p.$('#a-no') && await p.$('#a-yes')) { decisions++; await snap('sincero'); await click(mode === 'hotseat' ? '#a-yes' : '#a-no'); continue; }
    if (await p.$('#d-ok')) { decisions++; await snap('dichiara'); await p.click('[data-num="7"]').catch(() => {}); await click('#d-ok'); continue; }
    if (await p.$('#p-ok')) {
      decisions++;
      const picks = await p.$$('#g-action [data-pick]:not(.used)');
      for (let i = 0; i < 2 && i < picks.length; i++) { const q = await p.$$('#g-action [data-pick]:not(.used)'); await q[0].click(); }
      await snap('gioco');
      const eff = await p.$('#g-action [data-eff]:not([disabled])'); if (eff && Math.random() < 0.5) await eff.click();
      await click('#p-ok'); await p.waitForTimeout(40);
      if (await click('.dlg [data-y]')) await p.waitForTimeout(20);
      continue;
    }
    if (await p.$('#e-yes')) { decisions++; await snap('effetto'); await click('#e-yes'); continue; }
    if (await p.$('#a-no')) { decisions++; await snap('annulla'); await click('#a-no'); continue; }
    if (await click('#a-next')) { const t = await p.$eval('#g-announce', (e) => e.className).catch(() => ''); const k = (t.match(/k-(\w+)/) || [])[1]; if (k && !seen[k]) { seen[k] = 1; await snap('msg-' + k); } continue; }
    await p.waitForTimeout(30);
  }
  const text = await p.$eval('.dlg', (e) => e.innerText).catch(() => '(nessuna finestra finale)');
  console.log(JSON.stringify({ steps, decisions, errors, finale: text.slice(0, 300) }, null, 1));
  await b.close();
  process.exit(errors.length ? 1 : 0);
})();
