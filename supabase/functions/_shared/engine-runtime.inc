// Adapter runs inside the same closure as the game rules. No eval and no DOM/network access.
const copy = x => JSON.parse(JSON.stringify(x));
class NeedDecision extends Error { constructor(prompt){ super('decision'); this.prompt=prompt; } }
let answers=[], answerIndex=0;
const realStart=startTurn, realOnPlay=onPlay;
render=()=>{};floatAt=()=>{};fxHeal=()=>{};petSay=()=>{};petGrow=()=>{};botSay=()=>{};
feat=(p,k)=>{ if(!S?.secureCounts)return; const n=S.secureCounts[pi(p)];n[k]=(n[k]||0)+1; };
questEvent=(k,n=1)=>{if(S?.secureCounts){const c=S.secureCounts[0];c[k]=(c[k]||0)+n;}};
onPlay=async(p,c,t)=>{await realOnPlay(p,c,t);if(c.id==='phihuean')S.peekFor=pi(p);};
botTurn=async()=>{}; // server driver awaits bot moves instead of scheduling a background turn
startTurn=async()=>{}; // newGame constructs, then the explicit 'start' action opens the first turn
// Decisions are replayed from the last stable checkpoint. Never store a half-finished move as truth.
decide=async(p,local)=>{
  S.modal=null;const pending=local();if(pending?.catch)pending.catch(()=>{});
  const m=S.modal;S.modal=null;if(!m)throw Error('Missing decision prompt');
  const side=pi(p), prompt={side,type:m.type};
  if(m.type==='mull')prompt.cards=p.hand.map(h=>({uid:h.uid,id:h.id,alt:h.alt}));
  else if(m.type==='ask')prompt.text=m.text;
  else if(m.type==='rite')prompt.opts=m.opts.slice();
  else if(m.type==='discard')prompt.cards=p.hand.map(h=>({uid:h.uid,id:h.id,alt:h.alt}));
  else throw Error('Unsupported decision');
  if(answerIndex>=answers.length)throw new NeedDecision(prompt);
  const a=answers[answerIndex++];if(a.side!==side)throw Error('Wrong decision owner');
  const v=a.value;
  if(m.type==='mull'&&(!Array.isArray(v)||v.length>p.hand.length||new Set(v).size!==v.length||v.some(u=>!p.hand.some(h=>h.uid===u))))throw Error('Invalid mulligan');
  if(m.type==='ask'&&typeof v!=='boolean')throw Error('Invalid reaction');
  if(m.type==='rite'&&!m.opts.includes(v))throw Error('Invalid rite');
  if(m.type==='discard'&&!p.hand.some(h=>h.uid===v))throw Error('Invalid discard');
  return v;
};
function loadCheckpoint(c){S=copy(c.state);S.fast=true;S.sim=true;S.auto=false;S.modal=null;S.targeting=null;S.online.me='host';RNG=seeded(0);RNG.set(c.rng);U=c.uid;}
function checkpoint(){return {state:copy({...S,modal:null,targeting:null,onEnd:undefined}),rng:RNG.get(),uid:U};}
function validDeck(list){
  if(!list||typeof list!=='object'||Array.isArray(list))return false;
  const entries=Object.entries(list);if(entries.length>40)return false;let n=0;
  for(const [id,k]of entries){const d=C[id];if(!Object.hasOwn(C,id)||!d||d.token||d.fusion||d.ritual||!Number.isInteger(k)||k<1||k>(d.legend?1:3))return false;n+=k;}
  return n>=30&&n<=40;
}
async function driveBot(){
  let count=0;
  while(!S.over&&cur().bot&&count++<2){
    const p=cur(),q=opp(p);
    if(p.level===2)await botTurnHard(S,p);
    else{
      const fuseReady=async()=>{for(const f of p.extra||[])if(!S.over&&canFuse(p,f)&&fuseGood(p,f))await fuse(p,f);};
      if(p.level)await fuseReady();
      for(let i=0;i<15&&!S.over;i++){const ch=p.level===0?botPickEasy(p,q):botPick(p,q);if(!ch)break;await playCard(p,ch.h,ch.t,ch.trib);}
      if(p.level&&!S.over)await fuseReady();
      for(const c of [...p.field].sort((a,b)=>pow(p,b)-pow(p,a)))for(let i=0;i<3&&!S.over&&p.field.includes(c)&&canAttack(p,c);i++){const t=p.level===0?botTargetEasy(p,c):botTarget(p,c);if(!t)break;await attack(p,c,t);}
    }
    if(!S.over)await endTurn();
  }
}
const serverAPI={
 validDeck, cards:C, decks:DECKS, adventures:ADV, baseDeck:baseDeckOf,
 suggest(bundle){loadCheckpoint(bundle.checkpoint);const p=cur(),q=opp(p),ch=botPick(p,q);if(ch)return ch.trib?{type:'trib',side:S.turn,uid:ch.h.uid,a:ch.trib[0].uid,b:ch.trib[1].uid}:{type:'play',side:S.turn,uid:ch.h.uid,tk:ch.t?tkey(ch.t):null};
 for(const c of p.field)if(canAttack(p,c)){const t=botTarget(p,c);if(t)return {type:'atk',side:S.turn,uid:c.uid,tk:tkey(t)};}return {type:'end',side:S.turn};},
 start(spec,seed){
   if(!validDeck(spec.host.list)||!validDeck(spec.guest.list))throw Error('Invalid deck');
   startTurn=async()=>{};
   newGame(spec.host.di, spec.level||0,{fast:true,online:{seed,me:'host',host:spec.host,guest:spec.guest},adv:spec.stage??undefined,boss:spec.stage==null?0:ADV[spec.stage]?.boss||0});
   S.sim=true;S.fast=true;S.auto=false;S.secureCounts=[{},{}];S.p.forEach((p,i)=>{p.remote=true;p.bot=spec.mode==='bot'&&i===1;p.level=spec.level||0;});
   startTurn=realStart;return checkpoint();
 },
 async run(base,action,input=[]){
   loadCheckpoint(base);answers=copy(input);answerIndex=0;S.peekFor=null;
   try{
     if(action.type==='start')await startTurn();
     else if(action.type==='quit'){if(action.side!==0&&action.side!==1)throw Error('Invalid side');gameOver(S.p[1-action.side],'quit');}
     else{
       if(action.side!==S.turn)throw Error('Not your turn');
       if(action.type==='end')await endTurn();
       else{const move={...action};if(!legalMove(cur(),move))throw Error('Illegal move');await applyMove(move);}
     }
     await driveBot();
     if(answerIndex!==answers.length)throw Error('Unexpected answers');
     return {checkpoint:checkpoint(),prompt:null};
   }catch(e){if(e instanceof NeedDecision)return {checkpoint:base,preview:checkpoint(),prompt:e.prompt};throw e;}
 },
 view(bundle,side){
   const c=bundle.preview||bundle.checkpoint,st=copy(c.state);const peek=st.peekFor===side;
   for(let i=0;i<2;i++){const p=st.p[i];p.deck=Array(p.deck.length).fill('back');if(i!==side){if(!peek)p.hand=p.hand.map((_,j)=>({uid:-(j+1),id:'back'}));p.traps=(p.traps||[]).map(()=> 'back');for(const f of p.field)if(f.hid){f.id='back';f.items=[];f.mods=[];}}}
   if(side===1){st.p.reverse();st.turn=1-st.turn;if(st.over)st.over.winner=1-st.over.winner;}
   st.online={me:side===0?'host':'guest',host:{name:'host'},guest:{name:'guest'}};st.fast=false;st.sim=false;st.secure=true;st.auto=false;st.p[0].bot=false;st.p[0].remote=false;st.p[1].remote=true;
   st.p[0].name='ເຈົ້າ';st.p[1].name='ໝູ່';
   st.busy=st.turn!==0||!!bundle.prompt;st.modal=null;delete st.secureCounts;delete st.peekFor;
   const prompt=bundle.prompt?.side===side?copy(bundle.prompt):null;
   return {state:st,prompt,peek};
 }
};
