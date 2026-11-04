// Run with tools/wk.swift against tools/deck-27-preview.html.
// Decode real AAC assets in Safari, render the production playback path offline,
// then verify the actual effect entry points select the corresponding recordings.
const W=ms=>new Promise(r=>setTimeout(r,ms));await W(350);
const frame=document.querySelector('iframe'),win=frame.contentWindow,D=win.__dbg,K=D.dino;
const checks=[],ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
const manifest=await fetch('../design/deck-27-audio.json').then(r=>r.json());
const settings={...D.style.set({})};
D.style.set({sfx:true,svol:.8,mvol:0,fx:'off'});
ok(await K.preload(),'all 15 owner recordings fetched and decoded in Safari');
const buffers=D.fx.sfb.buf,snd=D.fx.snd,original={ctx:snd.ctx,sfx:snd.sfx,mus:snd.mus};
const state=JSON.stringify(D.S.p),levels=[];
for(const r of manifest.files){
 const b=buffers[r.key];ok(b&&b.numberOfChannels===2&&Math.abs(b.duration-r.seconds)<.06,r.key+': stereo duration matches imported recording');
}
async function playback(expected,fn,label){
 const off=new win.OfflineAudioContext(2,48000*4,48000),made=[],make=off.createBufferSource.bind(off);
 off.createBufferSource=()=>{const s=make();made.push(s);return s;};
 snd.ctx=off;snd.sfx=off.createGain();snd.sfx.gain.value=.55;snd.sfx.connect(off.destination);snd.mus=null;
 D.fx.sfb.last={};
 try{
  await fn();ok(made.length===1&&made[0].buffer===buffers[expected],label+': plays the matching owner recording once');
  const rendered=await off.startRendering();let peak=0,energy=0;
  for(let ch=0;ch<2;ch++)for(const x of rendered.getChannelData(ch)){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
  ok(peak>.001&&peak<.99&&energy>0,label+': audible non-clipping offline playback');
  levels.push({label,peak});
 }finally{Object.assign(snd,original);}
}
for(const kind of Object.keys(K.sounds))await playback('dino-'+kind,()=>K.sound(kind,'dinoking'),kind);
await playback('dino-roar-b',()=>K.sound('roar','dinotrex'),'rex alternate roar');
await playback('dino-upgrade-b',()=>K.sound('upgrade','dinometatrike'),'trike armor take');
await playback('dino-evolve-b',()=>K.sound('evolve','dinoevoblader'),'blader warrior take');
const key='c:'+D.S.p[0].field[0].uid;
for(const [stage,sound]of [['hatch','hatch'],['grow','grow'],['cyber','upgrade'],['evo','evolve']]){
 await playback('dino-'+sound,()=>K.fx(key,stage,'dinoevoemperor'),'transform '+stage);
}
for(const [cue,sound]of Object.entries({egg:'egg',warm:'egg',core:'core',heal:'heal',nest:'heal',guard:'shield',shield:'shield',claw:'claw',sword:'sword',beam:'beam'})){
 await playback('dino-'+sound,()=>K.cue(key,cue,'dinoevoemperor'),'cue '+cue);
}
D.style.set({fx:'short',speed:.5});
for(const [id,sound]of [['dinoking','dino-roar'],['dinometatrike','dino-upgrade-b'],['dinoevobastion','dino-evolve-b']]){
 await playback(sound,async()=>{const p=D.fx.show(id);D.fx.state.waits.slice().forEach(fn=>fn());await p;},'entrance '+id);
}
for(const id of Object.keys(K.altScenes)){
 const kind=K.scenes[id].sound,variant=(kind==='upgrade'||kind==='evolve')&&/raptor|blader|bastion/.test(id)?'-b':'';
 await playback('dino-'+kind+variant,async()=>{const p=D.fx.show(id,true);D.fx.state.waits.slice().forEach(fn=>fn());await p;},'special-art entrance '+id);
}
// Production guard checks: muting and simulations must create no audio sources.
const make=original.ctx.createBufferSource.bind(original.ctx);let created=0;
original.ctx.createBufferSource=()=>{created++;return make();};
try{
 D.style.set({sfx:false});K.sound('roar','dinoking');ok(created===0,'effects mute silences owner recordings and fallback');
 D.style.set({sfx:true});const fast=D.S.fast;D.S.fast=true;
 try{K.sound('evolve','dinoevoemperor');ok(created===0,'fast simulation produces no sound');}finally{D.S.fast=fast;}
}finally{original.ctx.createBufferSource=make;D.style.set(settings);}
ok(JSON.stringify(D.S.p)===state,'audio leaves all gameplay values unchanged');
ok(!win.__errs.length,'no browser errors during audio checks');
return JSON.stringify({passed:checks.length,uniqueRecordings:manifest.files.length,checks,levels,errors:win.__errs});
