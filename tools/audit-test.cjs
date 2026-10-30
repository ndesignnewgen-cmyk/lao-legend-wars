// Engine regression checks. No browser/account/network access is used.
// Usage: node tools/audit-test.cjs [--sim=4416] [--hard=48]
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let source = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a,b) => b.length - a.length)[0];
const dummy = new Proxy(function(){}, {get(_,k){ if(k === 'then') return undefined; if(k === 'querySelectorAll') return () => []; if(k === 'matches') return false; return dummy; }, apply(){ return dummy; }, set(){ return true; }});
const data = new Map();
const storage = {getItem:k => data.get(k) ?? null, setItem:(k,v) => data.set(k,String(v)), removeItem:k => data.delete(k)};
const ctx = {console, document:dummy, localStorage:storage, navigator:{}, location:{hostname:'localhost',protocol:'http:',search:'',hash:'',pathname:'/'}, matchMedia:() => ({matches:true}), innerWidth:1280, innerHeight:720, Image:function(){}, HTMLImageElement:function(){}, setTimeout:(fn,ms) => { const t = setTimeout(fn,ms); t.unref(); return t; }, clearTimeout, setInterval:() => 0, clearInterval:() => {}, requestAnimationFrame:() => 0, URL, performance, addEventListener:() => {}};
ctx.window = ctx;
const tail = /choiceRestore\(\);\s*render\(\);\s*acctStart\(\);\s*liveCheck\(\);\s*\}\)\(\);\s*$/;
assert(tail.test(source), 'test instrumentation must match the startup footer');
source = source.replace(tail, `
render=()=>{}; floatAt=()=>{}; fxHeal=()=>{}; musicUpdate=()=>{};
window.audit={get S(){return S},set S(v){S=v},C,DECKS,FESTS,FEST_ROUNDS,STARTERS,GIFT_CARDS,RITES,
 mkPlayer,freshChar,heal,damageHero,destroy,playCard,attack,netApply,legalMove,applyMove,applySnap,
 cloneState,hardMoves,botTurnHard,passTurnSim,startTurnRun,turnLimitWinner,canFuse,pow,
 accountScope,cloudPull,cloudPush,acctSignOut,ACCT,markDirty,SCOPE_OWNER,SCOPE_PREFIX,SCOPE_KEYS,
 getSB:()=>SB,setSB:v=>SB=v,NET,setRNG:v=>RNG=v,seeded,SET,
 testHard:async function(kind){
   const saved={hardMoves,rolloutMove,applyMove}; let applied=[];const starts=[];
   hardMoves=()=>[{type:kind}]; rolloutMove=async()=>{starts.push(S.T);S.T=99;return 1};
   applyMove=async m=>{applied.push(m.type);S.over={winner:0,reason:'life'}};
   try{await botTurnHard(S,S.p[S.turn]);return {applied,starts}}finally{hardMoves=saved.hardMoves;rolloutMove=saved.rolloutMove;applyMove=saved.applyMove}
 }};
})();`);
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'index.html<script>'});
const a = ctx.audit;
let checks = 0;
const check = (value, message) => { assert(value,message); checks++; };
function game(){
 const p = a.mkPlayer('A',0,true,1), q = a.mkPlayer('B',1,true,1);
 p.field=[];q.field=[];p.hand=[];q.hand=[];
 a.S={p:[p,q],turn:0,T:2,level:1,fast:true,auto:true,sim:true,log:[],fest:null,busy:false};
 return {p,q,S:a.S};
}
async function test(){
 check(Object.keys(a.C).length === 344 && a.DECKS.length === 24,'card/deck count');
 for(const d of a.DECKS){
  const n=Object.values(d.list).reduce((x,y)=>x+y,0);
  check(n>=30&&n<=40,'deck size '+d.no);
  for(const [id,n] of Object.entries(d.list)) check(a.C[id]&&n<=(a.C[id].legend?1:3),'deck copies '+id);
 }
 const starter={};for(const di of a.STARTERS)for(const [id,n]of Object.entries(a.DECKS[di].list))starter[id]=Math.min(3,(starter[id]||0)+n);
 for(const id of a.GIFT_CARDS)starter[id]=1;
 const sql=fs.readFileSync(path.join(root,'supabase/f14.sql'),'utf8');
 const issued=Object.fromEntries([...sql.matchAll(/\('([a-z0-9]+)', (\d+)\)/g)].map(m=>[m[1],+m[2]]));
 assert.deepEqual(issued,starter);checks++;
 {const {p}=game();p.life=19;a.heal(p,5);check(p.life===20,'normal heal cap');p.maxLife=30;p.life=26;a.heal(p,2);check(p.life===28,'boss heal');a.heal(p,5);check(p.life===30,'boss cap');a.heal(p,-2);check(p.life===30,'negative healing cannot hurt');}
 for(const id of ['mupa','khangkhaonoy','bangfaisaen']){
  const {p}=game();const c=a.freshChar(id);c.shield=false;c.items=['dokbuathip'];p.field=[c];await a.destroy(p,c);
  const r=p.field[0];check(!!r&&r.id===id,'lotus revives '+id);
  if(a.C[id].kw.shield)check(r.shield===true,'revival restores shield');
  if(a.C[id].kw.hide)check(r.hid===true,'revival restores hiding');
  if(a.C[id].cd)check(r.cd===a.C[id].cd,'revival resets countdown');
 }
 {const {p,q,S}=game();S.online={};p.life=q.life=10;S.T=201;S.online.me='host';check(a.turnLimitWinner()===p,'host tie winner');S.p.reverse();S.online.me='guest';check(a.turnLimitWinner()===p,'guest agrees on host winner');}
 {const {p,q,S}=game();S.online={me:'host',host:{name:'host'},guest:{name:'guest'}};p.field=[a.freshChar('phonthahan')];p.field[0].mods=[{amt:1,exp:Infinity}];
  const snap=JSON.parse(JSON.stringify(S));a.NET.me='guest';a.applySnap({s:snap,rng:1,U:500,sent:0,rcv:0,left:60});a.S.fast=true;a.S.sim=true;a.S.auto=true;
  check(a.S.p[1].field[0].mods[0].exp===1e9,'legacy null permanent modifier restored');await a.passTurnSim();check(a.S.p[1].field[0].mods.length===1,'permanent modifier survives next turn');
 }
 {const {p,q,S}=game();S.online={};const c=a.freshChar('babynaga');q.field=[c];
  check(await a.netApply({t:'atk',uid:c.uid,tk:'H:o'})===false,'reject out of turn');S.turn=1;
  check(await a.netApply({t:'atk',uid:c.uid,tk:'H:o'})===false,'reject sick attacker');c.sick=false;c.atk=20;
  check(await a.netApply({t:'atk',uid:c.uid,tk:'H:o'})===false,'reject exhausted attacker');c.atk=0;
  check(await a.netApply({t:'atk',uid:c.uid,tk:{}})===false,'reject malformed target');
  p.field=[a.freshChar('sangthong')];check(await a.netApply({t:'atk',uid:c.uid,tk:'H:o'})===false,'respect taunt');p.field=[];
  check(await a.netApply({t:'atk',uid:c.uid,tk:'H:o'})===true&&p.life===19,'legal remote attack');
  q.hand=[{uid:900,id:'phayanak'}];q.mana=0;check(await a.netApply({t:'play',uid:900,tk:null})===false,'reject unaffordable play');
  check(await a.netApply({t:'fuse',f:'missing'})===false,'reject unknown fusion');check(p.life===19&&q.mana===0&&q.hand.length===1,'rejected moves do not mutate game');
 }
 {const {p,S}=game();const f=Object.values(a.C).find(c=>c.fusion);p.field=f.fusion.map(id=>a.freshChar(id));p.extra=[f.id];p.mana=10;
  check(a.legalMove(p,{type:'fuse',f:f.id}),'legal fusion');await a.applyMove({type:'fuse',f:f.id});check(p.field.some(c=>c.id===f.id),'execute fusion');
 }
 {const {p}=game();p.field=[a.freshChar('phonthahan'),a.freshChar('phonthahan')];p.hand=[{uid:901,id:'thaohung'}];p.mana=6;
  check(!a.legalMove(p,{type:'trib',uid:901,a:p.field[0].uid,b:p.field[0].uid}),'reject duplicate offerings');
  const m={type:'trib',uid:901,a:p.field[0].uid,b:p.field[1].uid};check(a.legalMove(p,m),'legal offering');await a.applyMove(m);check(p.field.some(c=>c.id==='thaohung')&&p.mana===0,'execute offering');
 }
 for(const kind of ['fuse','trib']){game();const r=await a.testHard(kind);check(r.applied.join()===kind,'hard bot dispatch '+kind);check(r.starts.join() === '2,2','both rollouts use real turn '+kind);}
 for(const fest of ['pimai','okphansa']){
  const {q,S}=game();q.life=10;q.combo=3;
  const fi=a.FESTS.findIndex(x=>x.id===fest);S.fest=[fi];const before=q.deck.length;
  await a.passTurnSim();check(q.combo===0,'reset combo');check(fest==='pimai'?q.life===11:q.deck.length===before-2,'simulated festival '+fest);
 }
 // Account A -> B -> A and guest: no shared stats or lost backups.
 {data.clear();a.ACCT.user={id:'A'};a.accountScope('A');storage.setItem('lao-legend-stats',JSON.stringify({won:99}));storage.setItem('lao-legend-sync',JSON.stringify({at:999}));
  a.ACCT.user={id:'B'};a.accountScope('B',true);check(storage.getItem('lao-legend-stats')===null,'B never inherits A stats');storage.setItem('lao-legend-stats',JSON.stringify({won:1}));
  a.ACCT.user={id:'A'};a.accountScope('A');check(JSON.parse(storage.getItem('lao-legend-stats')).won===99,'restore A backup');a.accountScope('guest');check(storage.getItem('lao-legend-stats')===null,'guest isolated');
 }
 // A response that was started for A must not apply after B signs in.
 {let resolve;const result=new Promise(r=>resolve=r);a.ACCT.user={id:'A'};a.accountScope('A');a.setSB({from:()=>({select:()=>({eq:()=>({maybeSingle:()=>result})})})});const pull=a.cloudPull();a.ACCT.user={id:'B'};a.accountScope('B');storage.setItem('lao-legend-stats',JSON.stringify({won:1}));resolve({data:{data:{at:999999,'lao-legend-stats':{won:99}}},error:null});await pull;check(JSON.parse(storage.getItem('lao-legend-stats')).won===1,'ignore previous account response');}
 console.log('PASS',checks,'regression checks');
 for(const [flag,lv] of [['sim',1],['hard',2]]){
  const arg=process.argv.find(x=>x.startsWith('--'+flag+'='));if(!arg)continue;
  a.ACCT.user=null;a.SET.fest=true;const n=+arg.split('=')[1];const r=await ctx.__sim(n,lv);
  assert.equal(r.games,n);assert.deepEqual(Array.from(r.errors),[]);
  console.log(flag,JSON.stringify({games:r.games,avgTurns:r.avgTurns,errors:r.errors,winPct:r.wins.map((w,i)=>({no:a.DECKS[i].no,pct:+(100*w/r.plays[i]).toFixed(1)}))}));
 }
}
test().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
