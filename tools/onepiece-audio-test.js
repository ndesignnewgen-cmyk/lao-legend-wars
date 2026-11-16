// Safari/WebKit: decode reused recordings and render the actual production playback path.
const checks=[],ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
const A=window.OPAudio,D=window.__opTrial,W=ms=>new Promise(r=>setTimeout(r,ms));
ok(!!A&&!!D,'Audio module and trial boot');
const preloader=A.create({context:new OfflineAudioContext(2,48000,48000),hidden:()=>false});
await preloader.preload();const buffers=preloader.status.buffers;
ok(A.files.every(n=>buffers[n]?.duration>0),'All 15 original recordings decode in Safari');
const levels=[];
for(const name of A.files){
  const off=new OfflineAudioContext(2,48000*3,48000),audio=A.create({context:off,hidden:()=>false});
  await audio.preload();
  ok(audio.play(name)&&audio.status.history.at(-1).recorded,name+' uses original recording');
  const rendered=await off.startRendering();let peak=0,energy=0;
  for(let ch=0;ch<rendered.numberOfChannels;ch++)for(const x of rendered.getChannelData(ch)){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
  ok(peak>.001&&peak<.99&&energy>0,name+' is audible and does not clip');levels.push({name,peak});audio.destroy();
}
ok(A.plan('attack',{id:'ST01-012'})[0][0]==='attack'&&A.plan('attack')[1][0]==='hit','Attack cue has launch and delayed impact');
ok(A.plan('attack',{id:'ST01-013'})[0][0]==='blade-slash','Zoro uses existing sword recording');
ok(A.plan('block')[0][0]==='blade-guard'&&A.plan('counter')[0][0]==='blade-guard','Defensive actions use guard recording');
ok(A.plan('trigger',{effect:null}).length===1,'Empty Trigger does not play a false power-up');
const audio=A.create({context:new OfflineAudioContext(2,48000,48000),hidden:()=>false});await audio.preload();
audio.cue('attack');ok(audio.status.scheduled===1&&audio.status.active===1,'Impact is scheduled separately');
audio.setMuted(true);ok(audio.status.scheduled===0&&audio.status.active===0&&!audio.play('hit'),'Mute stops current and delayed sounds');
await W(320);ok(audio.status.history.length===1,'Muted delayed impact never plays later');
audio.setMuted(false);audio.setVolume(0);ok(!audio.play('play'),'Zero volume is silent');
audio.setVolume(.55);audio.play('play');audio.stop();ok(audio.status.active===0,'Stopping clears voices');
const hidden=A.create({context:new OfflineAudioContext(2,48000,48000),hidden:()=>true});ok(!hidden.play('play'),'Hidden page cannot emit audio');
// Exercise actual controls; reduced-motion preference does not mute audio.
const original={muted:D.audio.muted,volume:D.audio.volume};
if(document.querySelector('#sound').getAttribute('aria-pressed')==='true')document.querySelector('#sound').click();
ok(D.audio.muted&&document.querySelector('#sound-test').disabled,'Mute control updates audio and test button');
document.querySelector('#sound').click();ok(!D.audio.muted,'Unmute control updates audio');
const volume=document.querySelector('#volume');volume.value='23';volume.dispatchEvent(new Event('input',{bubbles:true}));
ok(D.audio.volume===.23&&document.querySelector('#volume-value').value==='23%','Volume control updates output and bus');
const saved=JSON.parse(localStorage.getItem('op-trial-sound-v1'));ok(saved.volume===.23&&!saved.muted,'Trial audio settings persist separately');
if(document.querySelector('#motion').getAttribute('aria-pressed')!=='true')document.querySelector('#motion').click();
ok(!D.audio.muted,'Reducing animation leaves sound enabled');
volume.value=String(Math.round(original.volume*100));volume.dispatchEvent(new Event('input',{bubbles:true}));
if(original.muted)document.querySelector('#sound').click();
audio.destroy();hidden.destroy();preloader.destroy();
return JSON.stringify({passed:checks.length,checks,levels});
