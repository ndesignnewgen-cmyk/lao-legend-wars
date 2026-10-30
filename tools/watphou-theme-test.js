// Safari/WebKit integration: actual settings, board, imagery, audio and effect lifecycle. Local mock only.
const {createEngine}=await import('./supabase/functions/_shared/engine.mjs');
const engine=createEngine(),spec={di:0,list:engine.decks[0].list};
const cp=engine.start({mode:'bot',host:spec,guest:{di:1,list:engine.decks[1].list}},42);
const state=engine.view({checkpoint:cp},0).state;state.turn=0;state.busy=false;
localStorage.setItem('lao-legend-guest','1');__dbg.ui.login=null;
window.__secureMock=async()=>({code:'FXPREVIEW',rev:1,mode:'bot',status:'active',side:0,state:JSON.parse(JSON.stringify(state))});
await __dbg.secure.bot(spec,1);clearInterval(__dbg.secure.SEC.timer);
__dbg.S.busy=true;__dbg.S.modal=null;__dbg.render();
await new Promise(r=>setTimeout(r,1500));
__dbg.fx.state.flash=0;__dbg.fx.state.ps=[];

const pause=ms=>new Promise(r=>setTimeout(r,ms));let checks=0;
const check=(v,m)=>{if(!v)throw Error(m);checks++;};
function choose(a,value){__dbg.ui.settingsOpen=true;__dbg.render();document.querySelector('[data-a="'+a+'"][data-v="'+value+'"]').click();__dbg.ui.settingsOpen=false;__dbg.render();}
choose('theme','watphou');choose('setfx','full');
check(document.querySelectorAll('.lane.chars .wp-carving svg').length===2,'two independent carved courtyards');
for(const lane of document.querySelectorAll('.lane.chars'))check(getComputedStyle(lane).backgroundImage.includes('watphou-lane-v2'),'stone slab replaces scenery beneath cards');
check(JSON.parse(localStorage.getItem('lao-legend-settings')).theme==='watphou','theme persists');
check(__dbg.music.state.want==='watphou','theme music selected');
check(document.querySelectorAll('.lane.chars').length===2,'both lanes remain');
const field=document.querySelector('.field2');check(getComputedStyle(field).backgroundImage.includes('watphou-surround-v2'),'painted temple background');
const r=field.getBoundingClientRect();check(r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,'mat fits viewport');
const bg=new Image();bg.src='art/arena/watphou-surround-v2.webp';await bg.decode();check(bg.naturalWidth>=1600,'background detailed enough');
const gate=new Image();gate.src='art/arena/watphou-gate.webp';await gate.decode();
const cv=document.createElement('canvas');cv.width=cv.height=100;const ctx=cv.getContext('2d');ctx.drawImage(gate,0,0,100,100);
check(ctx.getImageData(0,0,1,1).data[3]===0,'gate transparent outside');check(ctx.getImageData(50,50,1,1).data[3]===0,'gate opening transparent');check(ctx.getImageData(20,50,1,1).data[3]>150,'gate stone visible');
const body=document.querySelector('.wp-panel-body');
if(innerWidth>=980){
 check(!!body,'framed sidebar has a scrollable reading area');
 check(body.clientHeight>100&&body.clientHeight<document.getElementById('dpanel').clientHeight,'footer art has reserved space');
 body.scrollTop=body.scrollHeight;const lore=body.querySelector('.plore').getBoundingClientRect(),box=body.getBoundingClientRect();check(lore.bottom<=box.bottom+1,'long card text can be reached without overlapping footer');
 const old=body.scrollTop;__dbg.render();check(document.querySelector('.wp-panel-body').scrollTop===old,'reading position survives redraw');
}
const before=JSON.stringify(__dbg.S);
for(const mode of ['full','short','off']){
 choose('setfx',mode);
 for(const id of ['phayathaen','nangchampa']){
  const p=__dbg.fx.show(id),stage=document.querySelector('.watphou-stage');check(!!stage,id+' theme decoration in '+mode);
  check(getComputedStyle(stage).backgroundColor==='rgba(0, 0, 0, 0)','transparent reveal');
  check(stage.querySelectorAll('.wp-petal').length===({full:10,short:5,off:0}[mode]),'petals respect setting');
  if(stage.querySelector('.stint'))check(getComputedStyle(stage.querySelector('.stint')).display==='none','no full screen dark tint');
  await pause(mode==='off'?25:180);document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));await p;
  check(!document.querySelector('.wp-halo,.wp-petal'),'reveal cleanup');check([...document.querySelectorAll('.wp-carving')].every(e=>e.getAnimations().length===0),'floor glow cleaned after skip');
 }
 const p=__dbg.fx.cutin('sinxaysam');
 if(mode==='full'){
  const stage=document.querySelector('.fzcut');check(stage.classList.contains('watphou-stage'),'theme fusion');check(!!stage.querySelector('.wp-gate'),'stone gate appears behind new card');
  check(getComputedStyle(stage).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(stage).backgroundImage==='none','fusion keeps board visible');
  for(const a of stage.getAnimations({subtree:true})){a.pause();a.currentTime=1740;}
  const br=stage.querySelector('.fzband').getBoundingClientRect();check(br.top>=0&&br.bottom<=innerHeight,'fusion name fits viewport');
  const cr=stage.querySelector('.fzres').getBoundingClientRect();check(cr.top>=0&&cr.bottom<=innerHeight,'fusion card fits viewport');
  await stage.querySelector('.wp-gate').decode();document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));
 }else check(!document.querySelector('.fzcut'),'short/off skip long fusion');
 await p;check(!document.querySelector('.wp-gate'),'fusion cleanup');
}
check(JSON.stringify(__dbg.S)===before,'theme/effects do not change game state');
choose('setfx','full');choose('theme','sinh');check(!document.querySelector('.wp-carving'),'previous theme preserved');
const p=__dbg.fx.cutin('sinxaysam');check(!document.querySelector('.wp-gate,.wp-halo'),'other theme has no Wat Phou gate');document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));await p;
choose('theme','watphou');
const sound=await __dbg.music.level('watphou',12);check(sound.rms>-60&&sound.peak<0,'theme music audible and no clipping: '+JSON.stringify(sound));
await pause(1500);check(!document.querySelector('.wp-petal,.wp-gate'),'no delayed effects after skip');
check(window.__errs.length===0,'no browser errors: '+window.__errs.join(';'));
return {checks,viewport:[innerWidth,innerHeight],sound,errors:window.__errs};
