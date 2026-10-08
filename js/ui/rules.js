/* CROMOZAPD — schermata e finestra del regolamento (testo generato da docs/REGOLAMENTO.md) */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const UI = FF.UI;
  const { $ } = UI;
  UI.openRules = function () {
    UI.screen('rules');
    $('#s-rules').innerHTML = `<div class="wrap"><div class="card rules">${UI.md(FF.RULEBOOK_MD || '# Regolamento non disponibile')}</div><div class="btn-row"><button class="btn primary" id="ru-back">← Indietro</button></div></div>`;
    $('#ru-back').onclick = () => UI.go('home');
  };
  UI.openRulesModal = function () {
    const dlg = UI.modal(`<div class="rules">${UI.md(FF.RULEBOOK_MD || '')}</div><div class="btn-row end"><button class="btn primary" data-x>Chiudi</button></div>`, { wide: true });
    dlg.el.querySelector('[data-x]').onclick = () => dlg.close();
  };
})(typeof window !== 'undefined' ? window : globalThis);
