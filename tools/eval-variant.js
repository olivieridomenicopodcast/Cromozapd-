#!/usr/bin/env node
/* Valutazione completa di una variante di regole (AI Difficili, egoista semplice, livelli).
   Uso: node tools/eval-variant.js '{"xInSum":true,"base":12}' 400 "etichetta" */
'use strict';
const FF=require('../tests/_load.js');
const R=JSON.parse(process.argv[2]||'{}'), N=Number(process.argv[3]||400), label=process.argv[4]||'';
const xb=R.xInSum?5.5:0, out=!!R.rangeOutside;
const mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1), sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))};
const corr=(a,b)=>{const ma=mean(a),mb=mean(b);return mean(a.map((x,i)=>(x-ma)*(b[i]-mb)))/(sd(a)*sd(b))};
function egoist(){ const okS=(s,V,hi)=>{const w=s>=V&&s<=hi;return out?!w:w;};
  return { decide(game,d){ switch(d.type){
    case 'declare': { const V=d.center.v,h=d.hand.slice().sort((x,y)=>y.v-x.v).slice(1); const t=(V+(V+d.base))/2-xb-5.5; const c=h.sort((x,y)=>Math.abs(x.v-t)-Math.abs(y.v-t))[0]; return {num:c.v,mod:null}; }
    case 'play': { const V=d.center.v,hi=V+d.base,h=d.hand.slice().sort((x,y)=>y.v-x.v); const p=game.s.decls.find((x,i)=>x&&i!==d.player&&i!==d.excluded); const pn=p&&p.num!=null?p.num:5.5;
      const rest=h.slice(1); const ok=rest.filter(x=>okS(x.v+pn+xb,V,hi)).sort((x,y)=>x.v-y.v); const c=ok[0]||rest.slice().sort((x,y)=>Math.abs(x.v+pn+xb-(V+hi)/2)-Math.abs(y.v+pn+xb-(V+hi)/2))[0];
      return {couple:c.id,self:h[0].id,eff:null}; }
    case 'xplay': return d.hand.slice().sort((x,y)=>Math.abs(x.v-6)-Math.abs(y.v-6))[0].id;
    case 'effdraw': return false; case 'sincero': return false; default: return null; } } }; }
// 1) Difficile contro Difficile
const rows=[]; const G={}; const add=(k,v)=>{G[k]=(G[k]||0)+v;}; const seatW=[0,0,0]; let agreeP=0,agreePair=0,tot=0, turns=0;
for(let i=0;i<N;i++){
  const seed='ev'+i; const g=new FF.Game({seed,log:true,rules:R}); const ai=[0,1,2].map(p=>FF.AI.create('hard',seed+p));
  const exc=[0,0,0]; g.onEvent=(e)=>{ if(e.k==='roles') exc[e.d.excluded]++; };
  const r=FF.drive(g,g.run(),(game,d)=>ai[d.player].decide(game,d));
  for(const k in g.stats.g) add(k,g.stats.g[k]); for(let p=0;p<3;p++) for(const k in g.stats.p[p]) add(k,g.stats.p[p][k]);
  turns+=r.turns; for(let p=0;p<3;p++) rows.push({sc:r.scores[p],pe:r.personal[p],fa:r.factor[p],ex:exc[p]});
  if(r.winner!=null){ seatW[r.winner]++; tot++; if(r.personal.indexOf(Math.max(...r.personal))===r.winner) agreeP++; if(r.pairWinner!=null&&r.pairWinner!==r.winner) agreePair++; }
}
const T=(G.coppia_nel_range||0)+(G.coppia_salvata_dal_colore||0)+(G.coppia_sfora||0), pg=k=>((G[k]||0)/N).toFixed(2);
console.log(`### ${label} ${JSON.stringify(R)}`);
console.log(`Difficile×3 (${N} partite): sforo ${(100*(G.coppia_sfora||0)/T).toFixed(1)}% (sotto ${pg('sfora_sotto')} · sopra ${pg('sfora_sopra')} · dentro ${pg('sfora_dentro')} a partita) · colore salva ${(100*(G.coppia_salvata_dal_colore||0)/T).toFixed(1)}% · punti coppia ${pg('punti_coppia')} · durata ${(turns/N).toFixed(1)}`);
console.log(`  escluso salva ${pg('escluso_salva_la_coppia')} / rovina ${pg('escluso_rovina_la_coppia')} a partita · tradimenti ${(100*(G.tradimenti||0)/(G.dichiarazioni_con_numero||1)).toFixed(1)}% · modificatori: decisivi ${pg('modificatore_decisivo')} inutili ${pg('modificatore_inutile')} non bastano ${pg('modificatore_non_basta')} · Annulla pescata ${pg('effetto_pescato:annulla')} giocata ${pg('effetto_giocato:annulla')}`);
console.log(`  vittorie per posto ${seatW.map(x=>(100*x/tot).toFixed(1)+'%').join(' / ')} · Fattore sd ${(100*sd(rows.map(r=>r.fa))).toFixed(1)}% · corr(personali,turni da escluso) ${corr(rows.map(r=>r.pe),rows.map(r=>r.ex)).toFixed(2)} · vincitore = più punti personali ${(100*agreeP/tot).toFixed(0)}% · vincitore nella coppia vincente ${(100*agreePair/tot).toFixed(0)}%`);
// 2) egoista semplice contro 2 Difficili
let w=0,n=0; const Tt={p:0,f:0,s:0,k:0},O={p:0,f:0,s:0,k:0};
for(let i=0;i<Math.round(N*1.1);i++){ const seat=i%3, seed='eg'+i; const g=new FF.Game({seed,log:false,rules:R}); const ai=[0,1,2].map(p=>p===seat?egoist():FF.AI.create('hard',seed+p));
  const r=FF.drive(g,g.run(),(game,d)=>ai[d.player].decide(game,d)); n++; if(r.winner===seat) w++;
  for(let q=0;q<3;q++){const X=q===seat?Tt:O; X.p+=r.personal[q]; X.f+=r.factor[q]; X.s+=r.scores[q]; X.k++;} }
console.log(`  DILEMMA: egoista semplice contro 2 Difficili: vince ${(100*w/n).toFixed(1)}% su ${n} (atteso 33,3%) · personali ${(Tt.p/Tt.k).toFixed(1)} vs ${(O.p/O.k).toFixed(1)} · Fattore ${(100*Tt.f/Tt.k).toFixed(1)}% vs ${(100*O.f/O.k).toFixed(1)}% · punteggio ${(Tt.s/Tt.k).toFixed(2)} vs ${(O.s/O.k).toFixed(2)}`);
// 3) livelli
(async()=>{
  for(const [a,b] of [['hard','medium'],['medium','easy']]){
    const agg=await FF.Sim.run({games:Math.round(N*1.5),seed:'lad'+label,a,b,rules:R}); const s=FF.Sim.summary(agg);
    console.log(`  LIVELLI: ${a} contro due ${b}: vince ${(100*s.aWin).toFixed(1)}% (${(100*s.aWinCI[0]).toFixed(1)}–${(100*s.aWinCI[1]).toFixed(1)}) · punteggio ${s.diff.m>=0?'+':''}${s.diff.m.toFixed(2)} [${s.diff.lo.toFixed(2)} ; ${s.diff.hi.toFixed(2)}]`);
  }
})();
