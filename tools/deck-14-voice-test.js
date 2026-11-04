// Safari: exercise the actual showcase/secure entrance paths and render the recorded voice mix.
const wait=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
for(let i=0;i<100&&!document.querySelector('iframe')?.contentWindow.__dbg;i++)await wait(100);
document.getElementById('viewBoard').click();
const f=document.querySelector('iframe'),w=f.contentWindow,D=w.__dbg,settings={...D.style.set({})},before=JSON.stringify(D.S.p);
const rows=(await fetch('../design/deck-14-voices.json').then(r=>r.json())).filter(r=>r.status==='installed');
D.style.set({sfx:true,voice:true,mvol:0,fx:'off',speed:1});ok(await D.blade.preload(),'all installed speech and SFX preload');
const snd=D.fx.snd,vo=D.fx.vo,original={ctx:snd.ctx,sfx:snd.sfx,mus:snd.mus};
function reset(){if(vo.active?.onended)vo.active.onended();vo.active=null;vo.t={};vo.last=0;}
for(const r of rows){
 const b=vo.buf[r.id];ok(b&&b.numberOfChannels===1&&Math.abs(b.duration-r.duration)<.065,r.id+' AAC decodes with the expected duration');
 const off=new w.OfflineAudioContext(2,48000*Math.ceil(b.duration+.5),48000),sources=[],create=off.createBufferSource.bind(off);
 off.createBufferSource=()=>{const s=create();sources.push(s);return s;};
 snd.ctx=off;snd.sfx=off.createGain();snd.sfx.gain.value=.5;snd.sfx.connect(off.destination);snd.mus=null;reset();D.fx.sfb.last={};
 try{
  await D.fx.show(r.id.replace(/^alt-/,''),r.id.startsWith('alt-'));
  const selected=()=>sources.filter(s=>s.buffer===b);
  ok(selected().length===1,r.id+' real showcase starts exactly its own recorded line');
  const c=D.S.p[0].field.find(c=>c.id===r.id);
  if(c){await D.secure.effect('enter',[c.uid]);ok(selected().length===1,r.id+' following secure field entrance does not speak twice');}
  const count=sources.length;D.fx.voice(rows.find(x=>x.id!==r.id)?.id||r.id);ok(sources.length===count,r.id+' another voice cannot overlap the active line');
  const out=await off.startRendering();let energy=0,peak=0;
  for(let ch=0;ch<out.numberOfChannels;ch++)for(const x of out.getChannelData(ch)){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
  ok(energy>0&&peak>.005&&peak<.99,r.id+' voice and SFX mix is audible without clipping');
  reset();D.style.set({voice:false});const n=sources.length;D.fx.voice(r.id);ok(sources.length===n,r.id+' voice switch mutes the line');
  D.style.set({voice:true});D.S.fast=true;D.fx.voice(r.id);D.S.fast=false;ok(sources.length===n,r.id+' fast simulation stays silent');
  D.S.sim=true;D.fx.voice(r.id);D.S.sim=false;ok(sources.length===n,r.id+' bot simulation stays silent');
 }finally{reset();Object.assign(snd,original);}
}
// The original four-second cooldown was shorter than a slow showcase followed by its field entry.
for(const [id,alt] of [['nangchampa',false],['champathong',true]])if(vo.buf[alt?'alt-'+id:id]){
 reset();D.style.set({sfx:false,voice:true,fx:'full',speed:1.5});
 const off=new w.OfflineAudioContext(1,48000*4,48000),sources=[],create=off.createBufferSource.bind(off);
 off.createBufferSource=()=>{const s=create();sources.push(s);return s;};snd.ctx=off;snd.sfx=off.createGain();snd.sfx.connect(off.destination);snd.mus=null;
 try{await D.fx.show(id,alt);if(vo.active?.onended)vo.active.onended();D.fx.voice(id);ok(sources.length===1&&sources[0].buffer===vo.buf[alt?'alt-'+id:id],id+' slow showcase and following base-card voice still speak only once after the line has ended');}
 finally{reset();Object.assign(snd,original);}
}
ok(JSON.stringify(D.S.p)===before,'voice playback changes no game values');
for(const r of rows.filter(r=>D.C[r.id]?.fusion)){
 const g=D.S,p=g.p[0];g.turn=0;g.auto=true;p.field=D.C[r.id].fusion.map(id=>D.dino.fresh(id));p.mana=10;p.blade=0;p.fused=[];p.extra=[r.id];D.render();
 const off=new w.OfflineAudioContext(1,48000*5,48000),sources=[],create=off.createBufferSource.bind(off);
 off.createBufferSource=()=>{const s=create();sources.push(s);return s;};snd.ctx=off;snd.sfx=off.createGain();snd.sfx.connect(off.destination);snd.mus=null;
 reset();D.style.set({sfx:true,voice:true,fx:'full',speed:.1});D.fx.sfb.last={};
 try{await D.blade.fuse(r.id);ok(sources.filter(s=>s.buffer===vo.buf[r.id]).length===1,r.id+' actual card fusion speaks its own line once');ok(p.field.length===1&&p.field[0].id===r.id&&p.mana===8,r.id+' spoken fusion preserves the result and mana cost');}
 finally{reset();Object.assign(snd,original);g.auto=false;}
}
D.style.set(settings);ok(!f.contentDocument.querySelector('.show'),'showcase cleans up');ok(!(w.__errs||[]).length,'no browser errors');
return JSON.stringify({passed:checks.length,voices:rows.map(r=>r.id),checks});
