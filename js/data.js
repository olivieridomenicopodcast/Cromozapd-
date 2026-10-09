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
    sincero: { retired: true, id: 'sincero', kind: 'sincero', n: 'Sincero', i: '🗣️', s: 'Istantanea: modificatori dichiarati esatti', d: 'Entrambi gli attivi dichiarano il modificatore con un numero esatto; chi mente vale 0.' },
    swap: { retired: true, id: 'swap', kind: 'fila', n: 'Scambio forzato', i: '🔁', s: 'Scambi la tua mano con quella dell\'escluso', d: 'Scambi le tue carte numeriche in mano con quelle dell\'escluso.' },
    cambio: { retired: true, id: 'cambio', kind: 'cambio', n: 'Cambio centrale', i: '🔁', s: 'Sostituisci la carta centrale con una della tua mano (prendi la vecchia)', d: 'Istantanea, dopo che l\'escluso ha giocato la sua carta: metti scoperta una carta della tua mano al posto della carta centrale e prendi in mano la vecchia centrale. Il range si sposta.' },
    baratto: { id: 'baratto', kind: 'baratto', n: 'Baratto', i: '🤝', s: 'Prendi alla cieca una carta dall\'escluso e dagliene una tua', d: 'Istantanea, dopo che l\'escluso ha giocato la sua carta: peschi alla cieca una delle carte rimaste nella mano dell\'escluso e gli dai in cambio una carta a tua scelta, coperta.' },
    lente: { retired: true, id: 'lente', kind: 'lente', n: 'Lente', i: '🔍', s: 'Guardi la carta coperta dell\'escluso, ma non parli', d: 'Istantanea, dopo che l\'escluso ha messo la sua carta coperta: la guardi (solo tu). In questo turno non puoi fare nessuna dichiarazione al compagno.' },
    annulla: { retired: true, id: 'annulla', kind: 'annulla', n: 'Annulla', i: '🚫', s: 'Reattiva: annulla un effetto rivelato', d: 'Neutralizza un effetto in fila rivelato in questo turno.' },
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
  // Regole di colore: il colore dominante (quello dell'ultima Zapd, o scelto con la Cromozapd) decide la regola in vigore
  FF.COLOR_RULES = {
    silenzio: { id: 'silenzio', n: 'Silenzio', i: '🤫', s: 'Non si parla', d: 'L\'escluso non dichiara nulla e gli attivi non fanno dichiarazioni. La carta dell\'escluso resta coperta fino al reveal: nessuno può tradire, nessuno può fidarsi.' },
    giuramento: { id: 'giuramento', n: 'Giuramento', i: '🤞', s: 'Il tradimento costa doppio', d: 'L\'escluso dichiara un numero e poi gioca coperto: se gioca un numero diverso pesca 2 carte Traditore invece di 1.' },
    luce: { id: 'luce', n: 'Luce', i: '💡', s: 'La carta dell\'escluso è scoperta', d: 'L\'escluso gioca per primo la sua carta, scoperta: il range è noto prima della discussione e nessuno può mentire.' },
    effetti: { id: 'effetti', n: 'Effetti vietati', i: '🚫', s: 'Niente carte-effetto', d: 'In questo turno nessuno può giocare carte-effetto (Reverse, Prossima carta, ±n, Baratto). Chi è escluso pesca comunque a fine turno.' },
  };
  FF.ruleOf = (R, dominant) => (R.colorRules && R.colorRuleMap ? R.colorRuleMap[dominant] || null : null);
  // come si gioca la carta dell'escluso: 'first' = per prima e scoperta; 'hidden' = dichiara e gioca coperta; null = regola vecchia
  FF.xmodeFor = (R, rule) => (R.rangeMode === 'xcard' || R.rangeMode === 'xsum' ? (R.colorRules ? (rule === 'luce' ? 'first' : 'hidden') : (R.xHidden ? 'hidden' : 'first')) : null);
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
    xInSum: false,           // variante: la carta dell'escluso conta nella somma controllata dal range (con 'xsum' no: la sua carta decide il range)
    rangeOutside: false,    // VARIANTE (solo simulazione): la somma deve stare FUORI dal range [V, V+Base] per incassare
    colorRules: true,       // il colore dominante è la REGOLA IN VIGORE del turno (Silenzio, Giuramento, Luce, Effetti vietati)
    colorRuleMap: ['silenzio', 'giuramento', 'luce', 'effetti'],   // regola per colore: Rosso, Blu, Verde, Giallo
    immunity: false,        // VARIANTE (vecchia regola): la coppia con entrambe le carte del colore dominante non sfora mai
    cromozapd: true,        // 13ª Zapd speciale: chi la pesca sceglie il colore (la regola) e tutti passano la mano
    rangeMode: 'xsum',      // 'xsum' (default, deciso da Niky) = l'escluso gioca per primo, scoperta, la carta X e il range è da V a V+X; varianti solo-simulazione: 'xcard' = V−X..V+X, 'pivot' = pivot−V..pivot+V, 'double' = V..2V, 'base' = V..V+Base
    pivot: 15,              // VARIANTE: valore centrale del range con rangeMode 'pivot'
    barattoSee: true,       // VARIANTE (carta Baratto): true = l'escluso mostra le carte rimaste in mano e chi gioca la carta SCEGLIE quale prendere (altrimenti alla cieca)
    cambioDiscard: false,   // VARIANTE (carta Cambio centrale): true = la vecchia centrale si scarta (la mano di chi la gioca scende a 2) invece di andare in mano
    xHidden: true,          // senza colorRules: l'escluso DICHIARA un numero, gioca coperto, X si scopre al reveal (con colorRules decide la regola di colore): l'escluso DICHIARA un numero esatto, gioca coperto, X si scopre al reveal
    traitor: true,          // (con X coperta): se l'escluso gioca un numero diverso da quello dichiarato pesca una carta Traditore: ne toglie il valore ai suoi punti personali
    traitorCards: [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3],   // mazzetto Traditore da 12 carte (si pesca senza reinserimento)
    traitorOverflow: 3,     // finito il mazzetto, ogni nuova carta Traditore vale questo
    modMode: 'widen',       // VARIANTE (solo simulazione) modificatori ±: 'range' (−n abbassa il minimo, +n alza il massimo), 'shift' (−n/+n spostano la somma), 'widen' (allargano il range da entrambi i lati)
    modTiming: 'blind',     // VARIANTE (solo simulazione): 'blind' = il modificatore si gioca coperto in 3ª posizione; 'after' = si gioca DOPO il reveal, a somma nota, per correggere uno sforo (sposta la somma di ±n)
    modFlex: false,         // VARIANTE (solo simulazione, con modTiming 'after'): il modificatore si usa in entrambi i versi (±n a scelta)
    modScale: 2,            // VARIANTE (solo simulazione): moltiplica il valore dei modificatori
    zapFlipsDir: true,      // ogni Zapd inverte anche il verso di rotazione (dopo aver fatto avanzare l'escluso)
    rotateEachTurn: true,   // l'escluso avanza di un posto a ogni turno (dal 2°), oltre che a ogni Zapd
    sincereZero: true,      // Sincero: il modificatore non corrispondente vale 0
    effectCopies: { reverse: 3, next: 3, baratto: 3, sincero: 0, swap: 0, annulla: 0, cambio: 0, lente: 0, lo1: 1, lo2: 1, lo3: 1, hi1: 1, hi2: 1, hi3: 1 },
  };
  FF.LEVELS = { easy: 'Facile', medium: 'Media', hard: 'Difficile' };

  // Mazzo principale: carte {id, v, c} (v = 1..maxValue, c = indice colore) e Zapd {id, z:true, c}
  FF.buildDeck = function (rules) {
    const r = Object.assign({}, FF.DEFAULT_RULES, rules || {});
    const deck = []; let id = 0;
    for (let c = 0; c < 4; c++) for (let k = 0; k < r.scales; k++) for (let v = 1; v <= r.maxValue; v++) deck.push({ id: id++, v, c });
    for (let c = 0; c < 4; c++) for (let k = 0; k < r.zapPerColor; k++) deck.push({ id: id++, z: true, c });
    if (r.cromozapd) deck.push({ id: id++, z: true, cromo: true, c: -1 });   // Cromozapd: la carta di tutti i colori
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
  FF.rangeFor = (rules, v, m, x) => {
    const [a, b] = FF.rangeBase(rules, v, x), nn = m ? m.n * (rules.modScale || 1) : 0, md = rules.modMode || 'range';
    return [a - (md === 'widen' ? nn : md === 'range' && m && m.dir === 'lo' ? nn : 0), b + (md === 'widen' ? nn : md === 'range' && m && m.dir === 'hi' ? nn : 0)];
  };
  FF.xFirst = (rules) => rules.rangeMode === 'xcard' || (rules.rangeMode === 'xsum' && !rules.xHidden);
  FF.xHidden = (rules) => rules.rangeMode === 'xsum' && !!rules.xHidden;
  FF.rangeBase = (rules, v, x) => (rules.rangeMode === 'xsum' ? [v, v + (x || 0)] : rules.rangeMode === 'xcard' ? [Math.max(1, v - (x || 0)), v + (x || 0)] : rules.rangeMode === 'pivot' ? [rules.pivot - v, rules.pivot + v] : rules.rangeMode === 'double' ? [v, 2 * v] : [v, v + rules.base]);
  FF.cardName = (c) => (c.cromo ? '🌈Cromozapd' : c.z ? `⚡Zapd ${FF.COLORS[c.c].i}` : `${c.v}${FF.COLORS[c.c].i}`);
  FF.effName = (e) => `${FF.EFFECTS[e.k].i} ${FF.EFFECTS[e.k].n}`;
})(typeof window !== 'undefined' ? window : globalThis);
