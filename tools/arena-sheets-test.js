// Local integration: real popup controls, theme persistence, new arena artwork and effect cleanup.
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

let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
function theme(t){__dbg.ui.settingsOpen=true;__dbg.render();document.querySelector('[data-a="theme"][data-v="'+t+'"]').click();__dbg.ui.settingsOpen=false;__dbg.render();}
const before=JSON.stringify(__dbg.sig()),colors={};
for(const t of ['watphou','starjars','sinh','mekong','himma']){
 theme(t);check(document.getElementById('app').dataset.theme===t,'popup theme matches arena '+t);
 for(const action of ['extra','log']){
  document.querySelector(action==='extra'?'[data-a="extra"][data-v="1"]':'[data-a="log"]').click();
  const modal=document.querySelector('.modal');check(!!modal,'open '+action);const cs=getComputedStyle(modal);
  check(cs.backgroundColor!=='rgb(28, 23, 39)','old purple popup replaced');colors[t]=cs.backgroundColor;
  check(cs.color!=='rgb(255, 255, 255)'||['mekong','himma'].includes(t),'readable themed ink');
  const r=modal.getBoundingClientRect();check(r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,'popup fits '+t+' '+action);
  check(getComputedStyle(document.querySelector('.modal-bg')).backgroundColor==='rgba(0, 0, 0, 0)','board visible outside popup');
  const close=modal.querySelector('[data-a="mclose"]');modal.scrollTop=modal.scrollHeight;const cr=close.getBoundingClientRect();check(cr.top>=r.top&&cr.bottom<=r.bottom,'close remains reachable');close.click();check(!document.querySelector('.modal'),'closes '+action);
 }
 document.querySelector('[data-a="grave"][data-v="0"]').click();check(!!document.querySelector('.gview'),'grave viewer opens');check(getComputedStyle(document.querySelector('.gview-bg')).backgroundColor==='rgba(0, 0, 0, 0)','grave keeps board visible');document.querySelector('.gx').click();check(!document.querySelector('.gview'),'grave closes');
}
check(colors.watphou!==colors.starjars,'warm and cool popup materials differ');
theme('starjars');
check(JSON.parse(localStorage.getItem('lao-legend-settings')).theme==='starjars','new arena choice saved');
for(const el of document.querySelectorAll('.lane.chars'))check(getComputedStyle(el).backgroundImage.includes('starjars-lane'),'jar lane uses new artwork');
check(document.querySelectorAll('.wp-carving').length===2,'both constellation seals');
for(const name of ['lane','panel','surround']){const im=new Image();im.src='art/arena/starjars-'+name+'.webp';await im.decode();check(im.naturalWidth>=600,'jar art loaded '+name);}
for(const mode of ['full','short','off']){
 __dbg.ui.settingsOpen=true;__dbg.render();document.querySelector('[data-a="setfx"][data-v="'+mode+'"]').click();__dbg.ui.settingsOpen=false;__dbg.render();
 const p=__dbg.fx.show('phayathaen'),stage=document.querySelector('.starjars-stage');check(!!stage,'star reveal '+mode);
 check(stage.querySelectorAll('.sj-star').length===({full:12,short:5,off:0}[mode]),'stars respect motion setting');
 check(getComputedStyle(stage).backgroundColor==='rgba(0, 0, 0, 0)','no screen tint');
 document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));await p;
 check(!document.querySelector('.sj-halo,.sj-star'),'star cleanup');check([...document.querySelectorAll('.wp-carving')].every(e=>!e.getAnimations().length),'floor animation cleanup');
}
__dbg.ui.settingsOpen=true;__dbg.render();document.querySelector('[data-a="setfx"][data-v="full"]').click();__dbg.ui.settingsOpen=false;__dbg.render();
const p=__dbg.fx.cutin('sinxaysam'),stage=document.querySelector('.starjars-stage');check(!!stage&&!!stage.querySelector('.sj-halo'),'constellation fusion');check(!stage.querySelector('.wp-gate'),'new theme has its own effect');
check(getComputedStyle(stage).backgroundImage==='none','fusion keeps board visible');document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));await p;
check(!document.querySelector('.sj-halo,.sj-star'),'fusion cleaned');check(JSON.stringify(__dbg.sig())===before,'no gameplay changes');
check(window.__errs.length===0,'no browser errors: '+window.__errs.join(';'));
return {checks,viewport:[innerWidth,innerHeight],colors,errors:window.__errs};
