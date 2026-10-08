/* CROMOZAPD — intelligenza artificiale.
   PROVVISORIO (tappa interfaccia): per ora tutti i livelli giocano a caso. Le AI vere (facile < media < difficile,
   con simulazione in avanti sul motore e senza sbirciare le carte nascoste) arrivano nella tappa successiva. */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});
  const AI = (FF.AI = { provisional: true });
  AI.create = function (level, seed) { const b = FF.RandomBot(seed); b.level = level; return b; };
})(typeof window !== 'undefined' ? window : globalThis);
