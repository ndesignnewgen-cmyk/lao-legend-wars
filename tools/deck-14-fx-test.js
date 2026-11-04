// Safari QA: production playback, transparent assets, all FX modes, skip cleanup and secure recording.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<100&&!document.getElementById('game')?.contentWindow.__dbg;i++)await wait(100);
document.getElementById('viewBoard').click();await wait(200);
const frame=document.getElementById('game'),win=frame.contentWindow,doc=frame.contentDocument,D=win.__dbg,K=D.blade;
const checks=[],ok=(v,label)=>{if(!v)throw Error(label);checks.push(label);};
const saved={...D.style.set({})},initial=JSON.stringify(D.S.p);
const sounds=await fetch('../design/deck-14-audio.json').then(r=>r.json());
D.style.set({sfx:true,voice:false,mvol:0,svol:.8,fx:'off'});
ok(await K.preload(),'11 AAC sounds decode in Safari');
const snd=D.fx.snd,buffers=D.fx.sfb.buf,original={ctx:snd.ctx,sfx:snd.sfx,mus:snd.mus};
for(const r of sounds){
 const key='blade-'+r.id,b=buffers[key];
 ok(b&&b.numberOfChannels===2&&Math.abs(b.duration-r.duration)<.065,key+' stereo duration');
 const off=new win.OfflineAudioContext(2,48000*Math.ceil(b.duration+.25),48000),sources=[],create=off.createBufferSource.bind(off);
 off.createBufferSource=()=>{const s=create();sources.push(s);return s;};
 snd.ctx=off;snd.sfx=off.createGain();snd.sfx.gain.value=.55;snd.sfx.connect(off.destination);snd.mus=null;D.fx.sfb.last={};
 try{
  // Enter through the actual gameplay effect, not just its audio helper.
  if(r.id==='legend')await D.fx.show('nangchampa');
  else if(r.id==='fusion'||r.id==='ultimate')await D.fx.cutin(r.id==='fusion'?'khudapphen':'champathong');
  else await K.cue('h:0',r.id,'nangchampa');
  ok(sources.length===1&&sources[0].buffer===b,key+' production effect selects the recording once');
  const out=await off.startRendering();let peak=0,energy=0;
  for(let ch=0;ch<2;ch++)for(const x of out.getChannelData(ch)){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
  ok(peak>.005&&peak<.99&&energy>0,key+' audible without clipping');
 }finally{Object.assign(snd,original);}
}
const create=original.ctx.createBufferSource.bind(original.ctx);let sources=0;
original.ctx.createBufferSource=()=>{sources++;return create();};
try{
 D.style.set({sfx:false});K.sound('ultimate');ok(sources===0,'mute prevents all sound');
 D.style.set({sfx:true});D.S.fast=true;K.sound('legend');D.S.fast=false;ok(sources===0,'simulation stays silent');
}finally{original.ctx.createBufferSource=create;}
D.style.set({sfx:false,fx:'full',speed:.5});
const key='c:'+D.S.p[0].field[0].uid,target='c:'+D.S.p[1].field[0].uid;
for(const kind of ['draw','slash','double','guard','heal','focus','training','dance']){
 const p=K.cue(key,kind,'nangchampa',kind==='slash'?target:null);await wait(80);
 const e=doc.querySelector('.blade-fx');ok(!!e,kind+' cue visible');
 await Promise.all([...e.querySelectorAll('img')].map(im=>im.decode()));
 ok([...e.querySelectorAll('img')].every(im=>im.naturalWidth>0),kind+' sprites load');
 await p;ok(!doc.querySelector('.blade-fx'),kind+' cue cleans up');
}
for(const mode of ['short','off']){
 D.style.set({fx:mode});
 for(const id of Object.keys(K.scenes)){await D.fx.show(id);ok(!doc.querySelector('.show,.blade-fx'),id+' '+mode+' cleans up');}
 await D.fx.cutin('khudapphen');await D.fx.cutin('champathong');
 ok(!doc.querySelector('.show,.blade-fx'),mode+' fusions clean up');
}
D.style.set({fx:'full',speed:1});
const p=D.fx.show('champathong',true);await wait(250);ok(doc.querySelectorAll('.blade-entrance .blade-sprite').length===13&&doc.querySelectorAll('.blade-special-star').length===12,'special entrance uses bounded layered art and twelve stars');
D.fx.state.waits.slice().forEach(f=>f());await p;
ok(!doc.querySelector('.show,.blade-fx,.skiphint'),'skip removes all owned visual nodes');
ok(D.fx.state.big===0&&D.fx.state.waits.length===0,'skip releases all animation waits');
ok(initial===JSON.stringify(D.S.p),'effects do not alter game values');
// The authoritative engine must capture the new cue even with S.fast true.
const {createEngine}=await import('../supabase/functions/_shared/engine.mjs');
const E=createEngine(),spec={mode:'casual',level:1,host:{di:13,list:E.decks[13].list},guest:{di:13,list:E.decks[13].list}};
let b=await E.run(E.start(spec,1414),{type:'start'},[]),answers=[];
while(b.prompt){answers.push({side:b.prompt.side,value:[]});b=await createEngine().run(b.checkpoint,{type:'start'},answers);}
function fixture(id,blade=0){
 const cp=JSON.parse(JSON.stringify(b.checkpoint)),s=cp.state;s.turn=0;s.T=8;s.over=null;s.sel=null;s.targeting=null;cp.uid=99000;
 for(const q of s.p)Object.assign(q,{mana:10,maxMana:10,mulled:true,field:[],hand:[],blade:0,tales:[],loc:null});
 const own=D.dino.fresh('dapsongmue');Object.assign(own,{uid:88001,sick:false});s.p[0].field=[own];
 const enemy=D.dino.fresh('dappi1');Object.assign(enemy,{uid:88002,sick:false});s.p[1].field=[enemy];
 s.p[0].blade=blade;s.p[0].hand=[{id,uid:88003}];return cp;
}
for(const [id,n,kind]of [['ajandap',0,'training'],['fondap',0,'dance'],['tatlom',0,'slash'],['nangchampa',6,'dance']]){
 const cp=fixture(id,n),action={type:'play',side:0,uid:88003,...(id==='tatlom'?{tk:'c:88002'}:{})};
 const r=await createEngine().run(cp,action,[]);
 ok(!r.prompt,id+' secure action completed');
 const frames=r.visuals?.[0].frames.filter(f=>f.kind==='bladecue')||[];
 ok(frames.some(f=>f.args[1]===kind),id+' recorded '+kind+' while server is fast');
 const mirror=r.visuals[1].frames.filter(f=>f.kind==='bladecue');
 if(id==='fondap')ok(frames[0].args[0]==='h:0'&&mirror[0].args[0]==='h:1','hero effect mirrors correctly for the other screen');
 if(id==='tatlom'||id==='nangchampa')ok(!r.checkpoint.state.p[1].field.some(c=>c.uid===88002),id+' removes the intended weak enemy');
 if(id==='ajandap')ok(r.checkpoint.state.p[0].field[0].items.includes('dapmai'),'teacher still grants the wooden practice sword');
}
D.style.set(saved);ok(!(win.__errs||[]).length,'no browser errors');
return JSON.stringify({passed:checks.length,sounds:sounds.length,checks,errors:win.__errs||[]});
