// Run with wk.swift against deck-14-preview.html. Checks real board geometry and rule-facing replay.
const W=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
for(let n=0;n<100&&!document.querySelector('iframe')?.contentWindow.__dbg;n++)await W(100);
document.getElementById('viewBoard').click();
const iframe=document.querySelector('iframe'),win=iframe.contentWindow,doc=iframe.contentDocument,D=win.__dbg;
const settings={...D.style.set({})};D.style.set({sfx:false,fx:'full',speed:.5});
const K=D.dino,setup=(f,side=0)=>{
 const g=D.S;g.auto=true;g.fast=false;g.over=null;g.turn=side;g.busy=true;
 for(const p of g.p)Object.assign(p,{field:[],mana:10,blade:0,fused:[],extra:[f],tales:[]});
 g.p[side].field=D.C[f].fusion.map(id=>{const c=K.fresh(id);c.sick=false;return c;});D.render();return g.p[side];
};
const node=uid=>doc.querySelector('[data-k="c:'+uid+'"]');
// Exact real-card copies, correct start size, visible lift, orbit and cleanup.
for(const side of [0,1]){
 const p=setup('champathong',side),before=JSON.stringify(D.S.p),original=p.field.map(c=>node(c.uid));
 const promise=D.blade.gather(side,'champathong'),root=doc.querySelector('.blade-gather'),clones=[...root.querySelectorAll('.blade-fusion-card')];
 ok(clones.length===2,'side '+side+': both battlefield cards are lifted');
 ok(clones.every((c,i)=>+c.dataset.sourceUid===p.field[i].uid),'side '+side+': clones use actual material UIDs');
 ok(clones.every(c=>c.querySelector('.card .bottom .namebox')&&c.querySelector('.cost')),'side '+side+': full frames, names and costs retained');
 ok(!root.querySelector('[data-k],[data-act]'),'side '+side+': visual copies have no game actions or duplicate keys');
 ok(original.every(e=>e.style.visibility==='hidden'),'side '+side+': real cards hidden while lifting');
 const start=clones.map(c=>c.getBoundingClientRect());
 // Sample the actual animation at the lift phase; headless WebKit can defer its first paint.
 for(const c of clones){const a=c.getAnimations()[0];a.pause();a.currentTime=165;}
 const lift=clones.map(c=>c.getBoundingClientRect());
 ok(lift.every((r,i)=>r.y<start[i].y-10),'side '+side+': cards rise from their board positions');
 clones.forEach(c=>c.getAnimations().forEach(a=>a.play()));
 const frames=clones[0].getAnimations()[0]?.effect.getKeyframes()||[];
 ok(frames.length>25&&frames.some(f=>/rotate\(/.test(f.transform)),'side '+side+': card path contains a full rotating spiral');
 await promise;
 ok(!doc.querySelector('.blade-gather'),'side '+side+': gather layer removed');
 ok(original.every(e=>e.style.visibility!=='hidden'),'side '+side+': original visibility restored');
 ok(before===JSON.stringify(D.S.p),'side '+side+': visual gather changes no rules');
}
// Skipping must cancel every owned animation and restore the original board.
setup('khudapphen');let promise=D.blade.gather(0,'khudapphen');await W(100);
D.fx.state.waits.slice().forEach(fn=>fn());await promise;
ok(!doc.querySelector('.blade-gather,.skiphint')&&D.fx.state.big===0,'skip clears the gather and input lock');
ok(D.S.p[0].field.every(c=>node(c.uid).style.visibility!=='hidden'),'skip restores both material cards');
// Exercise the actual rule sequence, including replacement and the result flying to its lane.
for(const f of ['khudapphen','champathong']){
 const p=setup(f),ids=p.field.map(c=>c.id);
 ok(D.blade.canFuse(f),f+': normal fusion is legal');
 await D.blade.fuse(f);
 ok(p.mana===8&&p.fused.includes(f),f+': mana and once-per-game tracking unchanged');
 ok(p.field.length===1&&p.field[0].id===f&&ids.every(id=>p.grave.includes(id)),f+': materials replaced by exactly one result');
 ok(!doc.querySelector('.blade-gather,.blade-fusion-card,.show,.blade-fx,.skiphint'),f+': complete sequence cleans up');
 ok(node(p.field[0].uid).style.visibility!=='hidden',f+': final field card is visible');
 ok(D.morphCheck()===true,f+': board matches a fresh render');
}
for(const fx of ['short','off']){
 D.style.set({fx});setup('champathong');await D.blade.fuse('champathong');
 ok(D.S.p[0].field[0].id==='champathong'&&!doc.querySelector('.blade-gather,.blade-fx,.show'),fx+': fusion rules and cleanup still work');
}
// The server records the same complete sequence and mirrors the gather side.
const {createEngine}=await import('../supabase/functions/_shared/engine.mjs');
const E=createEngine(),spec={mode:'casual',level:1,host:{di:13,list:E.decks[13].list},guest:{di:13,list:E.decks[13].list}};
let b=await E.run(E.start(spec,141426),{type:'start'},[]),answers=[];
while(b.prompt){answers.push({side:b.prompt.side,value:[]});b=await createEngine().run(b.checkpoint,{type:'start'},answers);}
for(const f of ['khudapphen','champathong','singkhu']){
 const cp=JSON.parse(JSON.stringify(b.checkpoint)),s=cp.state;s.turn=0;s.T=8;s.over=null;cp.uid=99900;
 for(const p of s.p)Object.assign(p,{field:[],hand:[],mana:10,maxMana:10,blade:0,fused:[],extra:[f],tales:[],loc:null});
 s.p[0].field=D.C[f].fusion.map((id,i)=>({...K.fresh(id),uid:89000+i,sick:false}));
 const r=await createEngine().run(cp,{type:'fuse',side:0,f},[]);
 ok(!r.prompt&&r.checkpoint.state.p[0].field.length===1&&r.checkpoint.state.p[0].field[0].id===f,f+': authoritative fusion succeeds');
 const frames=r.visuals[0].frames,kinds=frames.map(f=>f.kind);
 ok(kinds.indexOf('gather')<kinds.indexOf('cutin')&&kinds.indexOf('cutin')<kinds.indexOf('emerge'),f+': server records gather, reveal and emerge in order');
 const own=frames.find(f=>f.kind==='gather'),other=r.visuals[1].frames.find(f=>f.kind==='gather');
 ok(own.args[0]===0&&other.args[0]===1&&JSON.stringify(own.args[1])===JSON.stringify(other.args[1]),f+': other screen uses mirrored side with the same material UIDs');
}
D.S.auto=false;D.S.busy=false;D.style.set(settings);D.render();
ok(!(win.__errs||[]).length,'no browser errors');
return JSON.stringify({passed:checks.length,viewport:[innerWidth,innerHeight],checks,errors:win.__errs||[]});
