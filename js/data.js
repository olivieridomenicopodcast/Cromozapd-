/* CROMOZAPD — dati: colori, carte, effetti e parametri di regola (un solo oggetto, modificabile dall'interfaccia). */
(function (root) {
  'use strict';
  const FF = (root.FF = root.FF || {});

  FF.SEATS = ['A', 'B', 'C'];
  FF.SEAT_ICONS = ['🅰️', '🅱️', '©️'];
  // colori provvisori (nomi e simboli: il simbolo serve a distinguerli anche senza vedere i colori)
  FF.COLORS = [
    { id: 'rosso', n: 'Rosso', i: '🟥', sym: '●' },
    { id: 'blu', n: 'Blu', i: '🟦', sym: '▲' },
    { id: 'verde', n: 'Verde', i: '🟩', sym: '■' },
    { id: 'giallo', n: 'Giallo', i: '🟨', sym: '★' },
  ];

  // Carte-effetto. kind: 'fila' (3ª posizione), 'sincero' (istantanea), 'annulla' (reattiva)
  FF.EFFECTS = {
    reverse: { id: 'reverse', kind: 'fila', n: 'Reverse', i: '🔄', s: 'Inverte il verso dell\'escluso', d: 'Inverte il verso di rotazione dell\'escluso.' },
    next: { id: 'next', kind: 'fila', n: 'Prossima carta', i: '🔮', s: 'La cima del mazzo sarà la centrale di domani', d: 'La carta in cima al mazzo diventa la carta centrale del turno dopo.' },
    sincero: { id: 'sincero', kind: 'sincero', n: 'Sincero', i: '🗣️', s: 'Istantanea: modificatori dichiarati esatti', d: 'Entrambi gli attivi dichiarano il modificatore con un numero esatto; chi mente vale 0.' },
    swap: { id: 'swap', kind: 'fila', n: 'Scambio forzato', i: '🔁', s: 'Scambi la tua mano con quella dell\'escluso', d: 'Scambi le tue carte numeriche in mano con quelle dell\'escluso.' },
    annulla: { id: 'annulla', kind: 'annulla', n: 'Annulla', i: '🚫', s: 'Reattiva: annulla un effetto rivelato', d: 'Neutralizza un effetto in fila rivelato in questo turno.' },
  };
  const WIDEN = true; // regola di default: i modificatori allargano il range da entrambi i lati, di n × modScale (vedi DEFAULT_RULES)
  for (const n of [1, 2, 3]) {
    const w = n * 2;
    FF.EFFECTS['lo' + n] = WIDEN
      ? { id: 'lo' + n, kind: 'fila', mod: { dir: 'lo', n }, n: '±' + n, i: '↔️', s: 'Il range si allarga di ' + w + ' per lato', d: 'Allarga il range di questo turno di ' + w + ' da entrambi i lati (minimo −' + w + ', massimo +' + w + ').' }
      : { id: 'lo' + n, kind: 'fila', mod: { dir: 'lo', n }, n: '−' + n, i: '⬇️', s: 'Il minimo del range scende di ' + n, d: 'Abbassa di ' + n + ' il minimo del range di questo turno.' };
    FF.EFFECTS['hi' + n] = WIDEN
      ? { id: 'hi' + n, kind: 'fila', mod: { dir: 'hi', n }, n: '±' + n, i: '↔️', s: 'Il range si allarga di ' + w + ' per lato', d: 'Allarga il range di questo turno di ' + w + ' da entrambi i lati (minimo −' + w + ', massimo +' + w + ').' }
      : { id: 'hi' + n, kind: 'fila', mod: { dir: 'hi', n }, n: '+' + n, i: '⬆️', s: 'Il massimo del range sale di ' + n, d: 'Alza di ' + n + ' il massimo del range di questo turno.' };
  }
  FF.EFFECT_IDS = Object.keys(FF.EFFECTS);
  FF.VAGUE = { 1: 'poco', 2: 'medio', 3: 'tanto' };

  FF.DEFAULT_RULES = {
    base: 12,               // ampiezza del range: da V a V+base (la somma controllata è di 3 carte; deciso da Niky dopo le simulazioni)
    handSize: 3,            // carte numeriche in mano
    effectHandMax: 2,       // carte-effetto in mano al massimo
    zapPerColor: 3,         // Zapd per colore (totale = 4 × questo = fine partita)
    scales: 2,              // scale da 1 a 10 per colore
    maxValue: 10,
    startExcluded: -1,      // escluso iniziale: -1 = a sorte (dal seed), 0 = A, 1 = B, 2 = C
    startDir: 1,            // verso iniziale (+1 = A→B→C)
    xInSum: true,           // la carta dell'escluso conta nella somma controllata dal range (deciso da Niky; false = vecchia regola)
    rangeOutside: false,    // VARIANTE (solo simulazione): la somma deve stare FUORI dal range [V, V+Base] per incassare
    rangeMode: 'pivot',      // VARIANTE (solo simulazione): 'base' = da V a V+Base; 'pivot' = da pivot−V a pivot+V (più larga quanto più alta è la carta centrale)
    pivot: 15,              // VARIANTE: valore centrale del range con rangeMode 'pivot'
    modMode: 'widen',       // VARIANTE (solo simulazione) modificatori ±: 'range' (−n abbassa il minimo, +n alza il massimo), 'shift' (−n/+n spostano la somma), 'widen' (allargano il range da entrambi i lati)
    modTiming: 'blind',     // VARIANTE (solo simulazione): 'blind' = il modificatore si gioca coperto in 3ª posizione; 'after' = si gioca DOPO il reveal, a somma nota, per correggere uno sforo (sposta la somma di ±n)
    modFlex: false,         // VARIANTE (solo simulazione, con modTiming 'after'): il modificatore si usa in entrambi i versi (±n a scelta)
    modScale: 2,            // VARIANTE (solo simulazione): moltiplica il valore dei modificatori
    zapFlipsDir: true,      // ogni Zapd inverte anche il verso di rotazione (dopo aver fatto avanzare l'escluso)
    rotateEachTurn: true,   // l'escluso avanza di un posto a ogni turno (dal 2°), oltre che a ogni Zapd
    sincereZero: true,      // Sincero: il modificatore non corrispondente vale 0
    effectCopies: { reverse: 3, next: 3, sincero: 3, swap: 2, annulla: 0, lo1: 1, lo2: 1, lo3: 1, hi1: 1, hi2: 1, hi3: 1 },
  };
  FF.LEVELS = { easy: 'Facile', medium: 'Media', hard: 'Difficile' };

  // Mazzo principale: carte {id, v, c} (v = 1..maxValue, c = indice colore) e Zapd {id, z:true, c}
  FF.buildDeck = function (rules) {
    const r = Object.assign({}, FF.DEFAULT_RULES, rules || {});
    const deck = []; let id = 0;
    for (let c = 0; c < 4; c++) for (let k = 0; k < r.scales; k++) for (let v = 1; v <= r.maxValue; v++) deck.push({ id: id++, v, c });
    for (let c = 0; c < 4; c++) for (let k = 0; k < r.zapPerColor; k++) deck.push({ id: id++, z: true, c });
    return deck;
  };
  FF.buildEffectDeck = function (rules) {
    const r = Object.assign({}, FF.DEFAULT_RULES, rules || {});
    const copies = Object.assign({}, FF.DEFAULT_RULES.effectCopies, r.effectCopies || {});
    const deck = []; let id = 0;
    for (const k of FF.EFFECT_IDS) for (let i = 0; i < (copies[k] || 0); i++) deck.push({ id: id++, k });
    return deck;
  };
  // estremi del range di base per una carta centrale di valore v
  // range effettivo di un turno con un eventuale modificatore m = {dir, n} (stesse regole del motore)
  FF.rangeFor = (rules, v, m) => {
    const [a, b] = FF.rangeBase(rules, v), nn = m ? m.n * (rules.modScale || 1) : 0, md = rules.modMode || 'range';
    return [a - (md === 'widen' ? nn : md === 'range' && m && m.dir === 'lo' ? nn : 0), b + (md === 'widen' ? nn : md === 'range' && m && m.dir === 'hi' ? nn : 0)];
  };
  FF.rangeBase = (rules, v) => (rules.rangeMode === 'pivot' ? [rules.pivot - v, rules.pivot + v] : [v, v + rules.base]);
  FF.cardName = (c) => (c.z ? `⚡Zapd ${FF.COLORS[c.c].i}` : `${c.v}${FF.COLORS[c.c].i}`);
  FF.effName = (e) => `${FF.EFFECTS[e.k].i} ${FF.EFFECTS[e.k].n}`;
})(typeof window !== 'undefined' ? window : globalThis);
