#!/usr/bin/env node
/* Genera il kit "stampa e gioca" in stampa/:
   - carte-fronte-retro.html/.pdf : tutte le carte, 9 per foglio A4 (formato poker 63,5 × 88,9 mm), pagine fronte/retro alternate
   - carte-solo-fronti.html/.pdf  : solo i fronti (per bustine con una carta qualunque dietro)
   - tabellone-e-plance.html/.pdf : tabellone centrale, 3 zone di coppia, 3 plance giocatore (A4 orizzontale)
   - foglio-punti.pdf, regolamento.pdf
   Uso: node tools/build-print.js [--no-pdf]    (i PDF si fanno con Chromium/Playwright) */
'use strict';
const fs = require('fs'), path = require('path');
require('../js/data.js'); require('../js/ui/sprites.js');
const FF = globalThis.FF, S = FF.Sprites, R = FF.DEFAULT_RULES;
const root = path.join(__dirname, '..'), out = path.join(root, 'stampa');
fs.mkdirSync(out, { recursive: true });

const CW = 63.5, CH = 88.9, GX = (210 - 3 * CW) / 2, GY = (297 - 3 * CH) / 2;   // griglia 3×3 centrata su A4
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ───────────────────────── elenco carte ─────────────────────────
const cards = [];   // { f: idSprite fronte, b: idSprite retro, g: gruppo }
for (const c of FF.buildDeck(R)) cards.push({ f: S.cardId(c), b: 'back', g: 'Mazzo principale' });
for (const id of ['rule-silenzio', 'rule-carnevale', 'rule-luce', 'rule-effetti']) cards.push({ f: id, b: 'back', g: 'Carte regola di colore (si tengono scoperte, non nel mazzo)' });
cards.push({ f: 'escluso-cw', b: 'escluso-ccw', g: 'Carta Escluso / verso (si tiene scoperta, non nel mazzo)' });
for (const c of FF.buildEffectDeck(R)) cards.push({ f: 'eff-' + c.k, b: 'back-effect', g: 'Mazzetto Effetti' });
for (const v of R.traitorCards) cards.push({ f: 'trait-' + v, b: 'back-trait', g: 'Mazzetto Traditore' });
const sheets = [];
for (let i = 0; i < cards.length; i += 9) sheets.push(cards.slice(i, i + 9));
const ns = sheets.length;

const sprite = (id) => S.svg(id, 'spr');
function cropMarks() {
  const xs = [0, 1, 2, 3].map((i) => GX + i * CW), ys = [0, 1, 2, 3].map((i) => GY + i * CH), L = 4, G = 1;
  let h = '';
  for (const x of xs) h += `<i class="m v" style="left:${x}mm;top:${GY - G - L}mm;height:${L}mm"></i><i class="m v" style="left:${x}mm;top:${GY + 3 * CH + G}mm;height:${L}mm"></i>`;
  for (const y of ys) h += `<i class="m h" style="top:${y}mm;left:${GX - G - L}mm;width:${L}mm"></i><i class="m h" style="top:${y}mm;left:${GX + 3 * CW + G}mm;width:${L}mm"></i>`;
  return h;
}
function sheetPage(cs, idx, side) {
  // il retro si stampa ribaltando sul lato lungo: le colonne si specchiano
  const cells = cs.map((c, i) => {
    const r = Math.floor(i / 3), col = i % 3, cc = side === 'b' ? 2 - col : col;
    return `<div class="c" style="left:${GX + cc * CW}mm;top:${GY + r * CH}mm">${sprite(side === 'b' ? c.b : c.f)}</div>`;
  }).join('');
  const groups = [...new Set(cs.map((c) => c.g))].join(' · ');
  return `<section class="sheet">${cropMarks()}${cells}<div class="foot">Cromozapd · foglio ${idx + 1}/${ns} · ${side === 'b' ? '<b>RETRO</b> (ribalta sul lato lungo)' : '<b>FRONTE</b>'} · ${esc(groups)}</div></section>`;
}
const CSS_CARDS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; } html, body { margin: 0; background: #888; }
.sheet { position: relative; width: 210mm; height: 297mm; background: #fff; overflow: hidden; page-break-after: always; break-after: page; margin: 0 auto 6mm; }
.c { position: absolute; width: ${CW}mm; height: ${CH}mm; } .c svg { width: 100%; height: 100%; display: block; }
.m { position: absolute; background: #000; display: block; } .m.v { width: .2mm; margin-left: -.1mm; } .m.h { height: .2mm; margin-top: -.1mm; }
.foot { position: absolute; left: 0; right: 0; bottom: 4mm; text-align: center; font: 7pt "Trebuchet MS", Verdana, sans-serif; color: #444; }
@media print { html, body { background: none; } .sheet { margin: 0; } .noprint { display: none; } }
.noprint { position: fixed; top: 6px; right: 6px; z-index: 9; font: 700 14px sans-serif; } .noprint button { padding: 8px 14px; font: inherit; border: 2px solid #333; border-radius: 8px; background: #ffd54a; cursor: pointer; }`;
const wrapHtml = (title, css, body) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body><div class="noprint"><button onclick="print()">🖨 Stampa</button></div>${body}</body></html>`;

const both = []; sheets.forEach((cs, i) => { both.push(sheetPage(cs, i, 'f')); both.push(sheetPage(cs, i, 'b')); });
fs.writeFileSync(path.join(out, 'carte-fronte-retro.html'), wrapHtml('Cromozapd — carte (fronte/retro)', CSS_CARDS, both.join('')));
fs.writeFileSync(path.join(out, 'carte-solo-fronti.html'), wrapHtml('Cromozapd — carte (solo fronti)', CSS_CARDS, sheets.map((cs, i) => sheetPage(cs, i, 'f')).join('')));

// ───────────────────────── tabellone, zone, plance (A4 orizzontale) ─────────────────────────
const SW = 65, SH = 91;   // un po' più grandi della carta, per posarla senza precisione
const SEATC = S.SEATCOL, SEATS = ['A', 'B', 'C'];
const spot = (x, y, title, sub, extra) => `<div class="spot" style="left:${x}mm;top:${y}mm"><b>${title}</b><span>${sub || ''}</span>${extra || ''}</div>`;
const page = (inner, foot) => `<section class="land">${inner}<div class="foot">${foot}</div></section>`;
const rowX = (n, i) => { const gap = 4, total = n * SW + (n - 1) * gap; return (297 - total) / 2 + i * (SW + gap); };

function tabellone() {
  const y1 = 9, y2 = y1 + SH + 5;
  const zap = `<div class="zaps">${[1, 2, 3, 4, 5].map((n) => `<u>${n}</u>`).join('')}</div>`;
  return page([
    spot(rowX(4, 0), y1, 'MAZZO', 'pesca le carte numeriche (a faccia in giù)'),
    spot(rowX(4, 1), y1, 'CARTA CENTRALE', 'V = il suo valore<br>Range = da <b>V</b> a <b>V + X</b>'),
    spot(rowX(4, 2), y1, 'CARTA DELL\'ESCLUSO', 'X · coperta fino al reveal<br>(con <b>Luce</b>: scoperta, per prima)'),
    spot(rowX(4, 3), y1, 'REGOLA DI COLORE', 'qui la carta del <b>colore dominante</b><br>La regola vale solo se la carta centrale è di quel colore'),
    spot(rowX(4, 0), y2, 'MAZZETTO EFFETTI', 'a faccia in giù'),
    spot(rowX(4, 1), y2, 'MAZZETTO TRADITORE', 'a faccia in giù'),
    spot(rowX(4, 2), y2, 'SCARTI', 'carte sforate ed effetti giocati<br>(se il mazzo finisce si rimescolano solo i numerici)'),
    spot(rowX(4, 3), y2, 'ZAPD USCITE', 'mettile qui, scoperte<br>alla <b>5ª</b> (l\'ultima) finisce la partita', zap),
  ].join(''), 'Cromozapd · tabellone centrale · stampa su A4 orizzontale');
}
function zona(a, b) {
  const [pa, pb, pc] = [0, 1, 2];
  const coppia = SEATS[a] + SEATS[b];
  const y = 62;
  const spots = [0, 1, 2].map((p) => spot(rowX(3, p), y, `POSTO ${SEATS[p]}`, p === a || p === b ? 'carte che metti quando questa coppia incassa' : `carta dell'escluso (X) quando incassa la coppia ${coppia}`, `<i class="dot" style="background:${SEATC[p]}"></i>`)).join('');
  return page(`<div class="zt"><small>ZONA DI COPPIA</small><h1><span style="color:${SEATC[a]}">${SEATS[a]}</span> + <span style="color:${SEATC[b]}">${SEATS[b]}</span></h1>
    <p>Quando la coppia <b>incassa</b>, ognuno mette nel proprio posto le sue carte: i due attivi la <b>carta-coppia</b>, l'escluso la sua <b>X</b>. Se la coppia <b>sfora</b>, le carte vanno negli scarti.</p></div>${spots}
    <div class="zb">A fine partita: somma i <b>valori</b> delle carte di ogni posto → 3 punti a chi ha di più, 2 al secondo, 1 all'ultimo. Pari punti: vince chi ha messo <b>meno carte</b>; se pari anche quelle, si divide. Zona mai incassata: 2 a testa.</div>`, `Cromozapd · zona ${coppia} · stampa su A4 orizzontale`);
}
function plancia(p) {
  const y1 = 7;
  const spots = [
    spot(rowX(4, 0), y1, 'CARTA PER LA COPPIA', 'coperta<br>(sommata a quella del compagno)'),
    spot(rowX(4, 1), y1, 'CARTA PER TE', 'coperta<br>(valgono sempre per i tuoi punti personali)'),
    spot(rowX(4, 2), y1, 'EFFETTO IN FILA', 'coperto · 3ª carta · al massimo uno'),
    spot(rowX(4, 3), y1, 'CARTE TRADITORE', 'scoperte, per tutta la partita'),
  ].join('');
  const memo = [
    ['Pesca', 'Fino a 3 carte numeriche. Si scopre la carta centrale V. Zapd pescata: si risolve subito (colore dominante, escluso +1, verso invertito) e si ripesca.'],
    ['Escluso', 'Dichiara un <b>numero esatto</b> e gioca la X coperta. <b>Luce</b>: X scoperta per prima. <b>Silenzio</b>: nessuna dichiarazione.'],
    ['Baratto', 'Istantaneo, subito dopo la mossa dell\'escluso: lui ti mostra la mano, tu prendi una carta e gliene dai una tua, coperta.'],
    ['Discussione', 'Solo i due attivi (non con <b>Silenzio</b>). Tradire il compagno è libero. Poi: carta-coppia, carta-per-te, eventuale effetto in fila.'],
    ['Reveal', 'Range = <b>da V a V+X</b> (estremi inclusi). Se la <b>somma delle due carte-coppia</b> è nel range la coppia incassa <b>somma + X</b>; sopra o sotto = <b>0</b>.'],
    ['Traditore', 'Se la X giocata ≠ numero dichiarato: peschi una carta Traditore (con <b>Carnevale</b>, no). Finite le 12, ogni bugia costa 3.'],
    ['Dopo', 'L\'escluso pesca 1 effetto. Il gettone escluso avanza di 1 al turno dopo. <b>Cromozapd</b>: tutti passano la mano di carte numeriche al successivo; chi l\'ha pescata sceglie il colore dominante.'],
  ].map(([t, d], i) => `<li><b>${i + 1}. ${t}</b> ${d}</li>`).join('');
  return page(`${spots}<div class="who" style="background:${SEATC[p]}">GIOCATORE ${SEATS[p]}</div>
    <ol class="memo">${memo}</ol>
    <div class="fine"><b>Fine</b> (dopo la 5ª Zapd): per ogni coppia somma i valori messi da ognuno → podio 3/2/1. <b>Quota</b> = somma dei tre podi (3…9). <b>Punteggio = (carte per te − Traditore) × quota</b>. Vince la coppia con più punti squadra e chi ha il punteggio più alto.</div>`,
  `Cromozapd · plancia giocatore ${SEATS[p]} · stampa su A4 orizzontale`);
}
const CSS_LAND = `
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; } html, body { margin: 0; background: #888; font-family: "Trebuchet MS", Verdana, sans-serif; color: #222; }
.land { position: relative; width: 297mm; height: 210mm; background: #fff; overflow: hidden; page-break-after: always; break-after: page; margin: 0 auto 6mm; }
.spot { position: absolute; width: ${SW}mm; height: ${SH}mm; border: .5mm dashed #888; border-radius: 3.5mm; padding: 3mm; text-align: center; background: #fafafa; }
.spot > b { display: block; font-size: 10.5pt; letter-spacing: .3pt; margin-top: 2mm; } .spot > span { display: block; font-size: 8pt; color: #555; margin-top: 1.5mm; line-height: 1.35; } .spot > span b { color: #222; }
.zaps { position: absolute; left: 0; right: 0; bottom: 6mm; display: flex; justify-content: center; gap: 2mm; } .zaps u { text-decoration: none; width: 9mm; height: 9mm; border: .5mm solid #555; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11pt; color: #555; }
.dot { position: absolute; left: 50%; bottom: 6mm; margin-left: -5mm; width: 10mm; height: 10mm; border-radius: 50%; }
.foot { position: absolute; left: 0; right: 0; bottom: 2.5mm; text-align: center; font-size: 7pt; color: #666; }
.zt { position: absolute; left: 14mm; right: 14mm; top: 8mm; } .zt small { font-size: 9pt; letter-spacing: 2pt; color: #666; } .zt h1 { margin: 0; font-size: 34pt; line-height: 1.1; } .zt p { margin: 2mm 0 0; font-size: 9.5pt; max-width: 230mm; }
.zb { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; border: .4mm solid #444; background: #f3f3f3; border-radius: 2mm; padding: 3mm 4mm; font-size: 9.5pt; }
.who { position: absolute; left: 14mm; top: 103mm; color: #fff; font-weight: 900; font-size: 13pt; padding: 1.2mm 5mm; border-radius: 2mm; letter-spacing: 1pt; }
.memo { position: absolute; left: 14mm; right: 14mm; top: 114mm; margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 8mm; font-size: 8.8pt; line-height: 1.32; }
.memo li { break-inside: avoid; margin-bottom: 2.4mm; } .memo li > b:first-child { color: #000; }
.fine { position: absolute; left: 14mm; right: 14mm; bottom: 8.5mm; border: .4mm solid #444; background: #f3f3f3; border-radius: 2mm; padding: 2mm 3mm; font-size: 8.8pt; }
@media print { html, body { background: none; } .land { margin: 0; } .noprint { display: none; } }
.noprint { position: fixed; top: 6px; right: 6px; z-index: 9; font: 700 14px sans-serif; } .noprint button { padding: 8px 14px; font: inherit; border: 2px solid #333; border-radius: 8px; background: #ffd54a; cursor: pointer; }`;
const landPages = [tabellone(), zona(0, 1), zona(1, 2), zona(0, 2), plancia(0), plancia(1), plancia(2)];
fs.writeFileSync(path.join(out, 'tabellone-e-plance.html'), wrapHtml('Cromozapd — tabellone e plance', CSS_LAND, landPages.join('')));

console.log(`${cards.length} carte in ${ns} fogli (${ns * 2} facciate fronte/retro); ${landPages.length} pagine di tabellone/plance`);

// ───────────────────────── PDF ─────────────────────────
if (process.argv.includes('--no-pdf')) process.exit(0);
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const pdf = async (html, file, opts) => {
    const p = await b.newPage();
    await p.goto('file://' + path.join(out, html)); await p.waitForTimeout(200);
    await p.pdf(Object.assign({ path: path.join(out, file), printBackground: true, preferCSSPageSize: true }, opts || {}));
    await p.close();
  };
  await pdf('carte-fronte-retro.html', 'carte-fronte-retro.pdf');
  await pdf('carte-solo-fronti.html', 'carte-solo-fronti.pdf');
  await pdf('tabellone-e-plance.html', 'tabellone-e-plance.pdf');
  // foglio punti: la pagina si stampa da sola con il suo CSS
  { const p = await b.newPage(); await p.goto('file://' + path.join(root, 'foglio-punti.html')); await p.waitForTimeout(200);
    await p.pdf({ path: path.join(out, 'foglio-punti.pdf'), printBackground: true, preferCSSPageSize: true, format: 'A4' }); await p.close(); }
  // regolamento: testo reso dall'app stessa
  { const p = await b.newPage(); await p.goto('file://' + path.join(root, 'index.html')); await p.waitForTimeout(500);
    const html = await p.evaluate(() => FF.UI.md(FF.RULEBOOK_MD));
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:14mm}body{font:10pt/1.45 "Trebuchet MS",Verdana,sans-serif;color:#222}h1{font-size:19pt}h2{font-size:13.5pt;border-bottom:1.5px solid #999;margin-top:16px}h3{font-size:11pt}table{border-collapse:collapse;width:100%;margin:6px 0;font-size:9pt}th,td{border:1px solid #999;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eee}blockquote{margin:6px 0;padding:4px 10px;background:#f1f1f1;border-left:4px solid #888}tr,li{break-inside:avoid}</style>${html}`);
    await p.pdf({ path: path.join(out, 'regolamento.pdf'), printBackground: true, preferCSSPageSize: true }); await p.close(); }
  await b.close();
  console.log('PDF scritti in stampa/');
})().catch((e) => { console.error(e); process.exit(1); });
