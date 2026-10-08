/* CROMOZAPD — avvio, navigazione, ripresa partita, service worker */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const UI = FF.UI;
  const { $, esc } = UI;

  UI.go = function (where) {
    if (UI.session) { UI.session.dispose(); UI.session = null; }
    $('#modal-root').innerHTML = '';
    if (where === 'home') { UI.screen('home'); renderResume(); }
    else if (where === 'sim') UI.openSim ? UI.openSim() : UI.toast('Il simulatore arriva nelle prossime tappe.');
    else if (where === 'rules') UI.openRules();
    else UI.openSetup(where);
  };

  function renderResume() {
    const box = $('#resume-box');
    const sv = UI.store.get('save', null);
    if (!sv || !sv.cfg) { box.innerHTML = ''; return; }
    const names = sv.cfg.players.map((p) => esc(p.name)).join(' · ');
    box.innerHTML = `<div class="card resume"><h2>💾 Partita in corso</h2><p class="small muted">${names} · turno ${sv.turn || 1} · seed ${esc(sv.cfg.seed)}</p>
      <div class="btn-row"><button class="btn primary" id="rs-go">▶ Riprendi</button><button class="btn danger" id="rs-del">Elimina</button></div></div>`;
    $('#rs-go').onclick = () => UI.startSession(Object.assign({}, sv.cfg, { speed: sv.cfg.speed || 'step' }), sv.history);
    $('#rs-del').onclick = () => { UI.store.del('save'); renderResume(); };
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#logo-ico').innerHTML = FF.Sprites.svg('bolt');
    $('#hero-cards').innerHTML = [FF.Sprites.card({ v: 7, c: 0 }, 'h1'), FF.Sprites.card({ z: true, c: 3 }, 'h2'), FF.Sprites.effect('reverse', 'h3'), FF.Sprites.card({ v: 3, c: 1 }, 'h4')].join('');
    $('#btn-home').onclick = () => UI.go('home');
    $('#btn-rules').onclick = () => UI.go('rules');
    document.querySelectorAll('.mode').forEach((b) => b.addEventListener('click', () => UI.go(b.dataset.mode)));
    renderResume();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  });
})(typeof window !== 'undefined' ? window : globalThis);
