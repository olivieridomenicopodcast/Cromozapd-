/* CROMOZAPD — sprite SVG disegnati nel codice (nessuna risorsa esterna).
   `node tools/export-sprites.js` li esporta come file in assets/sprites/. */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const S = (FF.Sprites = {});

  const COL = ['#d9433b', '#2f6fd1', '#2e9d57', '#eab51f'];
  const DARK = ['#8e1f1a', '#173f86', '#146132', '#7d5d00'];
  const SEATCOL = ['#e8833a', '#2aa7a0', '#8a5fd1'];
  S.COL = COL; S.SEATCOL = SEATCOL;
  const FONT = 'font-family="\'Trebuchet MS\',\'Segoe UI\',Verdana,sans-serif"';

  const star = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  };
  // simbolo del colore (forma diversa per ogni colore: leggibile anche senza distinguere i colori)
  function sym(c, cx, cy, r, fill, stroke) {
    const st = stroke ? ` stroke="${stroke}" stroke-width="${r * 0.12}" stroke-linejoin="round"` : '';
    if (c === 0) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${st}/>`;
    if (c === 1) return `<polygon points="${cx},${cy - r} ${cx + r * 1.0},${cy + r * 0.8} ${cx - r * 1.0},${cy + r * 0.8}" fill="${fill}"${st}/>`;
    if (c === 2) return `<rect x="${cx - r * 0.88}" y="${cy - r * 0.88}" width="${r * 1.76}" height="${r * 1.76}" rx="${r * 0.18}" fill="${fill}"${st}/>`;
    return `<polygon points="${star(cx, cy, r * 1.1)}" fill="${fill}"${st}/>`;
  }
  const bolt = (cx, cy, k, fill, stroke) => `<polygon points="${cx + 6 * k},${cy - 30 * k} ${cx - 16 * k},${cy + 4 * k} ${cx - 2 * k},${cy + 4 * k} ${cx - 8 * k},${cy + 30 * k} ${cx + 16 * k},${cy - 8 * k} ${cx + 2 * k},${cy - 8 * k}" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="${2 * k}" stroke-linejoin="round"/>`;
  function wrap(text, n) {
    const out = []; let line = '';
    for (const w of String(text).split(' ')) { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
    if (line) out.push(line);
    return out;
  }
  const lines = (arr, x, y, size, fill, lh, extra) => arr.map((t, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" fill="${fill}" text-anchor="middle" ${FONT} ${extra || ''}>${t.replace(/&/g, '&amp;')}</text>`).join('');

  // frecce circolari (verso di rotazione): dir > 0 orario
  function circArrow(cx, cy, r, dir, color, w) {
    const a0 = dir > 0 ? -150 : -30, a1 = dir > 0 ? 100 : 100 - 130; // archi di ~250°
    const rad = (d) => d * Math.PI / 180;
    const start = dir > 0 ? -150 : 330, end = dir > 0 ? 100 : 80;
    const x0 = cx + r * Math.cos(rad(start)), y0 = cy + r * Math.sin(rad(start)), x1 = cx + r * Math.cos(rad(end)), y1 = cy + r * Math.sin(rad(end));
    const sweep = dir > 0 ? 1 : 0;
    const tx = -Math.sin(rad(end)) * (dir > 0 ? 1 : -1), ty = Math.cos(rad(end)) * (dir > 0 ? 1 : -1); // tangente nel verso di marcia
    const nx = -ty, ny = tx, hs = w * 2.4;
    const head = `${x1 + tx * hs},${y1 + ty * hs} ${x1 + nx * hs * 0.8},${y1 + ny * hs * 0.8} ${x1 - nx * hs * 0.8},${y1 - ny * hs * 0.8}`;
    return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 1 ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/><polygon points="${head}" fill="${color}"/>`;
  }

  // icone vettoriali degli effetti (area ~ 60×60 centrata in cx,cy)
  function effIcon(k, cx, cy, col) {
    const g = (b) => `<g transform="translate(${cx - 30} ${cy - 30})">${b}</g>`;
    const hi = k.startsWith('hi'), lo = k.startsWith('lo');
    if (hi || lo) {
      const n = k.slice(2), up = hi;
      const arrow = up ? '<polygon points="16,6 32,28 22,28 22,54 10,54 10,28 0,28" fill="#2e9d57"/>' : '<polygon points="16,54 32,32 22,32 22,6 10,6 10,32 0,32" fill="#d9433b"/>';
      return g(arrow + `<text x="46" y="42" font-size="30" font-weight="900" fill="${up ? '#1c6b3a' : '#9b2a24'}" text-anchor="middle" ${FONT}>${up ? '+' : '−'}${n}</text>`);
    }
    switch (k) {
      case 'reverse': return g(circArrow(30, 30, 20, 1, '#6b3fa0', 7).replace(/>/g, '>') + '<g transform="rotate(180 30 30)" opacity="0.0"></g>');
      case 'next': return g('<rect x="6" y="12" width="26" height="38" rx="4" fill="#8a96a8" stroke="#445" stroke-width="2"/><rect x="20" y="8" width="26" height="38" rx="4" fill="#fff" stroke="#445" stroke-width="2"/><text x="33" y="35" font-size="24" font-weight="900" fill="#6b3fa0" text-anchor="middle" ' + FONT + '>?</text><polygon points="44,50 58,50 51,58" fill="#6b3fa0" transform="rotate(-90 51 52)"/>');
      case 'sincero': return g('<path d="M6 8h48a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H26l-12 12v-12H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#f2a63b" stroke="#8a5a00" stroke-width="2.5"/><text x="30" y="33" font-size="22" font-weight="900" fill="#fff" text-anchor="middle" ' + FONT + '>=7</text>');
      case 'swap': return g('<rect x="4" y="10" width="20" height="28" rx="3" fill="#e9eef7" stroke="#445" stroke-width="2"/><rect x="36" y="22" width="20" height="28" rx="3" fill="#cfe3d3" stroke="#445" stroke-width="2"/><path d="M26 18h14l-4-5M34 44H20l4 5" fill="none" stroke="#6b3fa0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>');
      case 'annulla': return g('<circle cx="30" cy="30" r="22" fill="none" stroke="#c92a2a" stroke-width="7"/><line x1="14" y1="46" x2="46" y2="14" stroke="#c92a2a" stroke-width="7" stroke-linecap="round"/>');
    }
    return '';
  }

  // ── registro sprite ──
  const defs = {};
  function def(id, vb, body, label) { defs[id] = { id, vb, body, label }; }
  S.defs = defs;

  // carte numeriche
  for (let c = 0; c < 4; c++) {
    for (let v = 1; v <= 10; v++) {
      def(`card-${v}-${FF.COLORS[c].id}`, '0 0 100 140', () => `
        <rect x="2" y="2" width="96" height="136" rx="10" fill="#fffaf0" stroke="${COL[c]}" stroke-width="4"/>
        <rect x="9" y="9" width="82" height="122" rx="6" fill="${COL[c]}" opacity="0.13"/>
        ${sym(c, 50, 70, 32, COL[c], null).replace('fill=', 'opacity="0.28" fill=')}
        <text x="50" y="86" font-size="${v === 10 ? 50 : 62}" font-weight="900" fill="${DARK[c]}" text-anchor="middle" ${FONT} stroke="#fffaf0" stroke-width="3" paint-order="stroke">${v}</text>
        <text x="14" y="30" font-size="21" font-weight="900" fill="${DARK[c]}" text-anchor="middle" ${FONT}>${v}</text>${sym(c, 14, 42, 7, COL[c], null)}
        <g transform="rotate(180 50 70)"><text x="14" y="30" font-size="21" font-weight="900" fill="${DARK[c]}" text-anchor="middle" ${FONT}>${v}</text>${sym(c, 14, 42, 7, COL[c], null)}</g>`, `${v} ${FF.COLORS[c].n}`);
    }
    def(`zapd-${FF.COLORS[c].id}`, '0 0 100 140', () => `
      <rect x="2" y="2" width="96" height="136" rx="10" fill="#1d1b2e" stroke="${COL[c]}" stroke-width="5"/>
      <rect x="10" y="10" width="80" height="120" rx="6" fill="none" stroke="${COL[c]}" stroke-width="1.5" opacity="0.7"/>
      ${bolt(50, 64, 1.45, '#ffd84a', '#fff3b0')}
      <text x="50" y="118" font-size="17" font-weight="900" fill="#fff" text-anchor="middle" ${FONT} letter-spacing="2">ZAPD</text>
      ${sym(c, 18, 20, 8, COL[c], '#fff')}${sym(c, 82, 20, 8, COL[c], '#fff')}`, `Zapd ${FF.COLORS[c].n}`);
  }
  def('back', '0 0 100 140', () => `
    <rect x="2" y="2" width="96" height="136" rx="10" fill="#2c3e6b" stroke="#f2e6c9" stroke-width="4"/>
    <rect x="11" y="11" width="78" height="118" rx="6" fill="none" stroke="#f2e6c9" stroke-width="1.6" opacity="0.8"/>
    ${[0, 1, 2, 3].map((c) => sym(c, 32 + (c % 2) * 36, 48 + Math.floor(c / 2) * 44, 11, COL[c], '#f2e6c9')).join('')}
    ${bolt(50, 70, 0.55, '#ffd84a', null)}`, 'Dorso carta');
  def('back-effect', '0 0 100 140', () => `
    <rect x="2" y="2" width="96" height="136" rx="10" fill="#5b3a86" stroke="#f2e6c9" stroke-width="4"/>
    <rect x="11" y="11" width="78" height="118" rx="6" fill="none" stroke="#f2e6c9" stroke-width="1.6" opacity="0.8"/>
    <text x="50" y="82" font-size="40" font-weight="900" fill="#f2e6c9" text-anchor="middle" ${FONT}>✦</text>
    <text x="50" y="112" font-size="11" font-weight="800" fill="#f2e6c9" text-anchor="middle" ${FONT}>EFFETTI</text>`, 'Dorso Mazzetto Effetti');
  for (const k of FF.EFFECT_IDS) {
    const e = FF.EFFECTS[k], head = e.kind === 'sincero' ? '#e08a1e' : e.kind === 'annulla' ? '#b92d2d' : '#6b3fa0';
    const kindTxt = e.kind === 'sincero' ? 'ISTANTANEA' : e.kind === 'annulla' ? 'REATTIVA' : 'IN FILA';
    def(`eff-${k}`, '0 0 100 140', () => `
      <rect x="2" y="2" width="96" height="136" rx="10" fill="#f6ecd2" stroke="${head}" stroke-width="4"/>
      <path d="M2 12a10 10 0 0 1 10-10h76a10 10 0 0 1 10 10v26H2z" fill="${head}"/>
      <text x="50" y="25" font-size="${e.n.length > 12 ? 11 : e.n.length > 10 ? 12.5 : 15.5}" font-weight="900" fill="#fff" text-anchor="middle" ${FONT}>${e.n}</text>
      <text x="50" y="35" font-size="6.5" font-weight="800" fill="#fff" text-anchor="middle" ${FONT} letter-spacing="1" opacity="0.9">${kindTxt}</text>
      ${effIcon(k, 50, 70, head)}
      ${lines(wrap(e.s, 19), 50, 108, 8.6, '#3b2a14', 10.5, 'font-weight="700"')}`, e.n);
  }
  def('token', '0 0 100 100', () => `
    <circle cx="50" cy="50" r="46" fill="#f2c14e" stroke="#8a5a00" stroke-width="5"/>
    <circle cx="50" cy="50" r="36" fill="none" stroke="#8a5a00" stroke-width="2.5" stroke-dasharray="4 4"/>
    <circle cx="50" cy="38" r="9" fill="#5a3a00"/><path d="M32 66a18 16 0 0 1 36 0z" fill="#5a3a00"/>
    <line x1="22" y1="78" x2="78" y2="22" stroke="#c92a2a" stroke-width="7" stroke-linecap="round"/>`, 'Gettone escluso');
  ['A', 'B', 'C'].forEach((L, i) => def(`seat-${L}`, '0 0 100 100', () => `<circle cx="50" cy="50" r="46" fill="${SEATCOL[i]}" stroke="#fff" stroke-width="5"/><text x="50" y="68" font-size="56" font-weight="900" fill="#fff" text-anchor="middle" ${FONT}>${L}</text>`, `Giocatore ${L}`));
  def('dir-cw', '0 0 100 100', () => circArrow(50, 50, 32, 1, '#3b2a14', 11), 'Verso orario');
  def('dir-ccw', '0 0 100 100', () => circArrow(50, 50, 32, -1, '#3b2a14', 11), 'Verso antiorario');
  def('bolt', '0 0 100 100', () => bolt(50, 50, 1.4, '#ffd84a', '#8a6a00'), 'Zapd');
  for (let c = 0; c < 4; c++) def(`sym-${FF.COLORS[c].id}`, '0 0 100 100', () => sym(c, 50, 50, 38, COL[c], '#3b2a14'), FF.COLORS[c].n);

  // ── API ──
  S.xmlns = 'xmlns="http://www.w3.org/2000/svg"';
  S.svg = function (id, cls, attrs) {
    const d = defs[id]; if (!d) return '';
    return `<svg viewBox="${d.vb}" class="spr ${cls || ''}" role="img" aria-label="${d.label}" ${attrs || ''}>${d.body()}</svg>`;
  };
  S.standalone = function (id) {
    const d = defs[id];
    const [, , w, h] = d.vb.split(' ').map(Number);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg ${S.xmlns} viewBox="${d.vb}" width="${w * 3}" height="${h * 3}" role="img" aria-label="${d.label}">${d.body()}</svg>\n`;
  };
  S.cardId = (c) => (c.z ? `zapd-${FF.COLORS[c.c].id}` : `card-${c.v}-${FF.COLORS[c.c].id}`);
  S.card = (c, cls, attrs) => S.svg(S.cardId(c), 'crd ' + (cls || ''), attrs);
  S.effect = (k, cls, attrs) => S.svg('eff-' + k, 'crd eff ' + (cls || ''), attrs);
  S.back = (cls) => S.svg('back', 'crd back ' + (cls || ''));
  S.backEffect = (cls) => S.svg('back-effect', 'crd back ' + (cls || ''));
  S.seat = (pid, cls) => S.svg('seat-' + FF.SEATS[pid], 'seatspr ' + (cls || ''));
  S.token = (cls) => S.svg('token', 'token ' + (cls || ''));
  S.dir = (d, cls) => S.svg(d > 0 ? 'dir-cw' : 'dir-ccw', 'dirico ' + (cls || ''));
  S.color = (c, cls) => S.svg('sym-' + FF.COLORS[c].id, 'colsym ' + (cls || ''));
  S.bolt = (cls) => S.svg('bolt', 'boltico ' + (cls || ''));
  S.symbols = Object.values(defs);
})(typeof window !== 'undefined' ? window : globalThis);
