/* CROMOZAPD — utilità UI condivise */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const UI = (FF.UI = FF.UI || {});
  const { COLORS, EFFECTS } = FF;

  UI.$ = (sel, el) => (el || document).querySelector(sel);
  UI.$$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  UI.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  UI.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const { $, $$, esc } = UI;

  // localStorage "sicuro" (può essere bloccato in navigazione privata)
  UI.store = {
    get(k, d) { try { const v = localStorage.getItem('cz_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cz_' + k, JSON.stringify(v)); } catch (e) { /* ignora */ } },
    del(k) { try { localStorage.removeItem('cz_' + k); } catch (e) { /* ignora */ } },
  };

  let toastT;
  UI.toast = function (msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  };
  UI.screen = function (id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    window.scrollTo(0, 0);
    $('#tb-info').innerHTML = '';
  };

  // Finestra modale. ritorna { el, close }
  UI.modal = function (html, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'overlay' + (opts.solid ? ' solid' : '');
    wrap.innerHTML = `<div class="dlg ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    $('#modal-root').appendChild(wrap);
    const api = { el: wrap.firstElementChild, close() { wrap.remove(); } };
    if (opts.dismiss !== false) wrap.addEventListener('click', (e) => { if (e.target === wrap) api.close(); });
    return api;
  };
  // conferma esplicita per mosse rischiose: ritorna Promise<boolean>
  UI.confirm = function (title, bodyHtml, okLabel, cancelLabel) {
    return new Promise((resolve) => {
      const dlg = UI.modal(`<h2>⚠️ ${esc(title)}</h2><div class="warnbox">${bodyHtml}</div>
        <div class="btn-row"><button class="btn" data-n>${esc(cancelLabel || 'Torno indietro')}</button><button class="btn danger" data-y style="flex:1">${esc(okLabel || 'Confermo lo stesso')}</button></div>`, { dismiss: false });
      dlg.el.querySelector('[data-y]').onclick = () => { dlg.close(); resolve(true); };
      dlg.el.querySelector('[data-n]').onclick = () => { dlg.close(); resolve(false); };
    });
  };

  UI.download = function (name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  UI.copy = async function (text) {
    try { await navigator.clipboard.writeText(text); UI.toast('Copiato negli appunti ✓'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); UI.toast('Copiato negli appunti ✓'); } catch (e2) { UI.toast('Copia non riuscita'); }
      ta.remove();
    }
  };
  UI.seg = function (container, onChange) { // gruppo di bottoni a selezione singola
    container.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
      $$('button', container).forEach((x) => x.classList.toggle('sel', x === b));
      if (onChange) onChange(b.dataset.v);
    });
  };
  UI.segVal = (container) => { const b = $('button.sel', container); return b ? b.dataset.v : null; };
  UI.randomSeed = () => 'cz-' + Math.random().toString(36).slice(2, 8);

  // ───────────────────────── carte in HTML ─────────────────────────
  // carta cliccabile per ingrandirla: attributo data-zoom
  UI.cardHTML = function (c, opts) {
    opts = opts || {};
    const z = c.k ? `eff:${c.k}` : `card:${c.z ? 'z' : c.v}:${c.c}`;
    const spr = c.k ? FF.Sprites.effect(c.k) : FF.Sprites.card(c);
    return `<button class="cardbtn ${opts.cls || ''}" data-zoom="${z}" ${opts.id != null ? `data-id="${opts.id}"` : ''} ${opts.disabled ? 'disabled' : ''} title="${esc(opts.title || '')}" aria-label="${esc(c.k ? EFFECTS[c.k].n : FF.cardName(c))}">${spr}${opts.badge ? `<span class="cbadge">${opts.badge}</span>` : ''}</button>`;
  };
  UI.miniCard = (c, cls) => `<span class="mini ${cls || ''}" data-zoom="${c.k ? 'eff:' + c.k : `card:${c.z ? 'z' : c.v}:${c.c}`}">${c.k ? FF.Sprites.effect(c.k) : FF.Sprites.card(c)}</span>`;

  UI.zoom = function (spec) {
    const [t, a, b] = spec.split(':');
    let spr, title, desc;
    if (t === 'eff') {
      const e = EFFECTS[a]; spr = FF.Sprites.effect(a); title = `${e.i} ${e.n}`;
      desc = `${e.d}<br><span class="muted">${e.kind === 'fila' ? 'Si gioca in 3ª posizione (in fila), solo da attivo, e si rivela insieme al resto.' : e.kind === 'sincero' ? 'Istantanea: si gioca scoperta a inizio turno, prima della discussione.' : 'Reattiva: si gioca dopo il reveal, solo da attivo.'}</span>`;
    } else if (a === 'z') {
      const c = Number(b); spr = FF.Sprites.card({ z: true, c }); title = `⚡ Zapd ${COLORS[c].n}`;
      desc = `Quando esce viene <b>risolta subito</b>: ${COLORS[c].i} ${COLORS[c].n} diventa il nuovo <b>colore dominante</b> il <b>gettone escluso</b> avanza di un posto e il <b>verso</b> di rotazione si inverte. Poi si ripesca. La 12ª Zapd chiude la partita.`;
    } else {
      const c = Number(b), v = Number(a); spr = FF.Sprites.card({ v, c }); title = `${v} ${COLORS[c].i} ${COLORS[c].n}`;
      desc = `Carta numerica di valore <b>${v}</b>, colore ${COLORS[c].n} (simbolo ${COLORS[c].sym}). Il colore conta solo se è il <b>colore dominante</b>.`;
    }
    const dlg = UI.modal(`<div class="zoomcard">${spr}</div><h2>${title}</h2><p>${desc}</p><div class="btn-row end"><button class="btn primary" data-x>Chiudi</button></div>`);
    dlg.el.querySelector('[data-x]').onclick = () => dlg.close();
  };
  document.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (!z || z.dataset.noZoom != null) return;
    if (z.closest('.selectable')) return; // nelle carte da scegliere il clic seleziona
    if (e.target.closest('.overlay')) return;
    UI.zoom(z.dataset.zoom);
  });

  // ───────────────────────── legenda ─────────────────────────
  UI.legendHTML = function () {
    const S = FF.Sprites, R = FF.DEFAULT_RULES;
    const row = (ico, txt) => `<div class="lrow"><span class="lico">${ico}</span><span>${txt}</span></div>`;
    let h = '<div class="lgroup">Il senso del gioco</div>';
    h += row('⚖️', '<b>Non tirare la corda.</b> La carta per sé è sempre tua, ma ogni punto che togli alla coppia abbassa la tua quota. Una coppia che sfora fa 0: una carta alta in coppia è un rischio, non un regalo.');
    h += '<div class="lgroup">Colori = regole</div>';
    h += COLORS.map((c, i) => { const rl = FF.COLOR_RULES[FF.ruleOf(R, i)]; return row(S.color(i), `<b>${c.n}</b> ${c.sym}${rl ? ` → ${rl.i} <b>${rl.n}</b>: ${rl.d}` : ''}`); }).join('');
    h += '<div class="lgroup">Carte e segni</div>';
    h += row(S.card({ v: 7, c: 1 }, 'tiny'), '<b>Numerica</b>: il valore è il numero grande. Il colore non conta (contano solo i colori delle Zapd).');
    h += row(S.card({ z: true, c: 0 }, 'tiny'), '<b>Zapd</b>: si risolve subito. Cambia il colore dominante (cioè la regola in vigore), fa avanzare l\'escluso di un altro posto e inverte il verso. 12 colorate (3 per colore).');
    h += row(S.card({ z: true, cromo: true, c: -1 }, 'tiny'), '<b>Cromozapd</b> (la 13ª Zapd): tutti passano la mano al giocatore successivo, poi chi l\'ha pescata sceglie il colore dominante, cioè la regola. Se esce come carta centrale sceglie chi la scopre.');
    h += row(S.token('tiny'), '<b>Gettone escluso</b>: chi lo ha non fa coppia in questo turno: dichiara un numero e gioca coperta 1 carta che <b>decide il range</b>.');
    h += row(S.dir(1, 'tiny'), '<b>Verso</b> di rotazione dell\'escluso (↻ A→B→C): il gettone avanza di un posto a ogni turno e a ogni Zapd; ogni Zapd inverte il verso.');
    h += row('🎯', '<b>Range</b>: la somma delle due carte-coppia deve stare tra <b>V</b> (carta centrale) e <b>V + X</b>, dove X è la carta dell\'escluso (si scopre al reveal, salvo la regola Luce).');
    h += row('💥', '<b>Sforo</b>: somma fuori range → la coppia fa 0 (anche la carta dell\'escluso non conta).');
    h += row('🐍', '<b>Carta Traditore</b>: se l\'escluso gioca un numero diverso da quello dichiarato ne pesca una (2 col Giuramento): toglie da 0 a 3 punti personali. Finito il mazzetto di 12, ogni tradimento costa 3.');
    h += row('⭐', '<b>Carta per sé</b>: conta sempre per i tuoi punti personali.');
    h += row('📊', '<b>Fattore coppie</b>: media della tua quota nei punti delle 3 coppie. Punteggio = personali × Fattore.');
    h += '<div class="lgroup">Carte-effetto (15)</div>';
    h += FF.EFFECT_IDS.filter((k) => !FF.EFFECTS[k].retired && (!FF.EFFECTS[k].mod || k.endsWith('1'))).map((k) => {
      const e = EFFECTS[k];
      return row(S.effect(k, 'tiny'), e.mod ? '<b>±1/±2/±3</b> (6 carte): allargano il range di 2·n da entrambi i lati, in fila (coperti).' : `<b>${e.n}</b>: ${e.d}`);
    }).join('');
    return h;
  };

  // ───────────────────────── cronaca ─────────────────────────
  UI.logLine = function (ev) {
    return `<div class="ll k-${ev.k} ${ev.p >= 0 ? 'p' + ev.p : ''}"><span class="lt">${ev.k === 'note' ? '📝' : 'T' + ev.t}</span><span>${esc(ev.text)}</span></div>`;
  };

  // ───────────────────────── markdown (solo ciò che serve al regolamento) ─────────────────────────
  UI.md = function (src) {
    const inline = (t) => esc(t)
      .replace(/\*\*\[(chiarito|interpretazione[^\]]*|nuovo)\]\*\*/gi, (m, g) => `<span class="tag ${g.toLowerCase().startsWith('chiar') ? 'ok' : 'warn'}">${g}</span>`)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>');
    const out = []; const L = src.split('\n'); let i = 0;
    while (i < L.length) {
      const l = L[i];
      if (/^#{1,3} /.test(l)) { const n = l.match(/^#+/)[0].length; out.push(`<h${n}>${inline(l.replace(/^#+ /, ''))}</h${n}>`); i++; }
      else if (l.startsWith('> ')) { out.push(`<blockquote>${inline(l.slice(2))}</blockquote>`); i++; }
      else if (l.startsWith('|')) {
        const rows = []; while (i < L.length && L[i].startsWith('|')) rows.push(L[i++]);
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]); const body = rows.slice(2).map(cells);
        out.push(`<div class="tblwrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      } else if (/^(- |\d+\. )/.test(l)) {
        const ord = /^\d/.test(l); const items = [];
        while (i < L.length && /^(- |\d+\. )/.test(L[i])) items.push(L[i++].replace(/^(- |\d+\. )/, ''));
        out.push(`<${ord ? 'ol' : 'ul'}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`);
      } else if (l.trim() === '') i++;
      else { const p = []; while (i < L.length && L[i].trim() && !/^(#|>|\||- |\d+\. )/.test(L[i])) p.push(L[i++]); out.push(`<p>${inline(p.join(' '))}</p>`); }
    }
    return out.join('\n');
  };
})(typeof window !== 'undefined' ? window : globalThis);
