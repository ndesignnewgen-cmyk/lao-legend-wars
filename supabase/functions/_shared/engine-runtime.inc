// Adapter runs inside the same closure as the game rules. No eval and no DOM/network access.
const copy = x => JSON.parse(JSON.stringify(x));
class NeedDecision extends Error { constructor(prompt){ super('decision'); this.prompt=prompt; } }
let answers=[], answerIndex=0,visualFrames=[],tracing=false;
function captureVisual(kind=null,args=[]){
 if(!tracing||visualFrames.length>=180)return;
 const state=checkpoint().state;if(!kind&&visualFrames.length&&JSON.stringify(state)===JSON.stringify(visualFrames.at(-1).state))return;
 visualFrames.push({state,kind,args:copy(args)});
}
function visualReset(){visualFrames=[];captureVisual();}
function visualResult(){
 captureVisual();tracing=false;
 const sides={};
 for(let side=0;side<2;side++){
  let previous=null;const frames=[];let base=null;
  for(const f of visualFrames.filter((f,i)=>f.kind||i===0||i===visualFrames.length-1)){
   const state=serverAPI.view({checkpoint:{state:f.state}},side).state;state.log=state.log.slice(0,3);
   if(!base){base=state;previous=state;}
   const patch=diffVisual(previous,state);previous=state;
   let args=copy(f.args),kind=f.kind;
   const key=k=>side===1&&/^h:[01]$/.test(k)?'h:'+(1-Number(k.slice(2))):k;
   if(['activate','trap','loc','draw','rite','gather','baci','banner'].includes(kind))args[0]=side===1?1-args[0]:args[0];
   if(kind==='cast'){args[0]=side===1?1-args[0]:args[0];args[1]=key(args[1]);}
   if(['lunge','fireflies'].includes(kind)){args[0]=key(args[0]);args[1]=key(args[1]);}
   if(['float','ring','heal','buff','weak','rocket','curse','tornado','trip','grab','slash'].includes(kind))args[0]=key(args[0]);
   if(kind==='activate'&&args[3])args[3]=key(args[3]);
   // A hidden character must not reveal its picture through an animation.
   if(kind==='enter'&&!state.p.flatMap(p=>p.field).some(c=>c.uid===args[0]&&c.id!=='back'))kind=null;
   if(kind==='showcase'&&C[args[0]]?.kw.hide&&side!==f.state.turn)kind=null;
   if(patch.length||kind)frames.push({patch,kind,args});
  }
  sides[side]={base,frames};
 }
 // Keep visual data bounded independently of the authoritative checkpoint.
 return new TextEncoder().encode(JSON.stringify(sides)).length<=130000?sides:null;
}
const realStart=startTurn, realOnPlay=onPlay;
render=()=>captureVisual();floatAt=(...a)=>captureVisual('float',a);fxHeal=k=>captureVisual('heal',[k]);petSay=()=>{};petGrow=()=>{};botSay=()=>{};
fxEnter=c=>captureVisual('enter',[c.uid]);
fxShowcase=(id,alt)=>captureVisual('showcase',[id,alt]);
fxActivate=(id,alt,side,key)=>captureVisual('activate',[side,id,alt,key]);
fxLunge=(...a)=>captureVisual('lunge',a);
fxCast=(side,t,kind)=>captureVisual('cast',[side,tkey(t),kind]);
fxRing=(...a)=>captureVisual('ring',a);
fxRite=(p,id,mats)=>captureVisual('rite',[pi(p),id,mats.map(c=>c.uid)]);
fxFuseGather=(p,mats,f)=>{captureVisual('gather',[pi(p),mats.map(c=>c.uid),f]);return null;};
fxFuseCutin=(...a)=>captureVisual('cutin',a);
fxFuseEmerge=c=>captureVisual('emerge',[c.uid]);
fxTrapSnap=(id,side)=>captureVisual('trap',[side,id]);
fxBanner=()=>captureVisual('banner',[S.turn]);fxBaci=p=>captureVisual('baci',[pi(p)]);
fxDraw=side=>captureVisual('draw',[side]);fxFest=f=>captureVisual('fest',[f.id]);fxTale=ti=>captureVisual('tale',[ti]);
fxSlash=(...a)=>captureVisual('slash',a);fxWave=()=>captureVisual('wave');fxRocket=k=>captureVisual('rocket',[k]);
fxCurse=k=>captureVisual('curse',[k]);fxTornado=k=>captureVisual('tornado',[k]);fxTrip=k=>captureVisual('trip',[k]);
fxLoc=(side,id)=>captureVisual('loc',[side,id]);fxBuff=(...a)=>captureVisual('buff',a);fxWeak=k=>captureVisual('weak',[k]);
fxFireflies=(...a)=>captureVisual('fireflies',a);fxGrab=k=>captureVisual('grab',[k]);
const realDestroy=destroy;destroy=async(p,c,quick)=>{if(!c.shield&&p.field.includes(c))captureVisual('destroy',[c.uid,C[c.id].tribe]);return realDestroy(p,c,quick);};
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
  visualReset();return v;
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
   startTurn=realStart;loadCheckpoint(base);answers=copy(input);answerIndex=0;S.peekFor=null;tracing=true;visualReset();
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
     const result=checkpoint();return {checkpoint:result,prompt:null,visuals:visualResult()};
   }catch(e){if(e instanceof NeedDecision)return {checkpoint:base,preview:checkpoint(),prompt:e.prompt,visuals:visualResult()};tracing=false;throw e;}
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
