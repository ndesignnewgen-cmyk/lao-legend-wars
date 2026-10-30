// Run with tools/wk.swift on localhost; uses a mock response, no account or remote writes.
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

const pause=ms=>new Promise(r=>setTimeout(r,ms));
let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
const pieces=['champa','stone-jar','rice-basket','cave-crystal','palm-manuscript','chick-star'];
for(const name of pieces){const im=new Image();im.src='art/fx/'+name+'.webp';await im.decode();check(im.naturalWidth===512,name+' optimized art');const cv=document.createElement('canvas');cv.width=cv.height=32;const ctx=cv.getContext('2d');ctx.drawImage(im,0,0,32,32);const rgba=ctx.getImageData(0,0,32,32).data;check(rgba[3]===0&&rgba.at(-1)===0,name+' transparent corners');check([...rgba].filter((v,i)=>i%4===3&&v>100).length>50,name+' visible subject');}
const painted={nangchampa:5,pulangseung:2,khunjueang:3,chaothamkonglor:2,maekhuakham:1,panyakham:2,maekaidao:7};
const ids=__dbg.DECKS.filter(d=>d.no>=14&&d.no<=24).sort((a,b)=>a.no-b.no).map(d=>d.legend);
check(ids.length===11,'eleven new legends');
function mode(value){__dbg.ui.settingsOpen=true;__dbg.render();document.querySelector('[data-a="setfx"][data-v="'+value+'"]').click();__dbg.ui.settingsOpen=false;__dbg.render();}
const before=JSON.stringify(__dbg.S),results=[];
for(const setting of ['full','short','off']){
 mode(setting);
 for(const id of ids){
  const gaps=[];let ticking=setting==='full',last=performance.now();
  const tick=now=>{if(!ticking)return;gaps.push(now-last);last=now;requestAnimationFrame(tick);};if(ticking)requestAnimationFrame(tick);
  const start=Date.now(),promise=__dbg.fx.show(id),el=document.querySelector('.legend-scene');
  check(!!el,id+' scene');check(!!el.querySelector('.scene-art svg'),id+' vector artwork');
  if(id==='maekaidao')check(el.querySelectorAll('.chick-star').length===7,'exactly seven chick stars');
  check(getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)',id+' transparent stage');
  check(!el.querySelector('.stint'),id+' no screen tint');
  check(!!el.querySelector('.sbg')&&getComputedStyle(el.querySelector('.sbg')).display!=='none',id+' reference-style painted background');
  check(!el.querySelector('.scene-dial'),id+' no decorative dial');
  check(el.querySelectorAll('.scene-painted').length===(painted[id]||0),id+' painted decorations');
  const picture=el.querySelector('.sfigure img,.scut img');await picture.decode();
  check(picture.naturalWidth>0,id+' art loaded');
  check(!el.querySelector('.sfigure')&&!!el.querySelector('.scut'),id+' character cutout instead of a frame');
  // At rest the band stays inside the viewport and below the character.
  const banner=el.querySelector('.sband');
  for(const a of banner.getAnimations())a.finish();
  const br=banner.getBoundingClientRect();
  check(br.left>=-1&&br.right<=innerWidth+1&&br.top>=0&&br.bottom<=innerHeight+1,id+' banner fits');
  if(setting==='off')check(el.classList.contains('still')&&!el.querySelector('.scene-mote,.scene-pulse'),id+' reduced visuals');
  else check(el.querySelectorAll('.scene-mote').length===(setting==='short'?14:34),id+' moving themed particles');
  await promise;ticking=false;
  const elapsed=Date.now()-start;
  check(!el.isConnected&&!document.querySelector('.scene-art'),id+' scene cleaned');
  check(__dbg.fx.state.big===0&&__dbg.fx.state.waits.length===0,id+' waits cleaned');
  const target={full:2300,short:1265,off:120}[setting];
  check(parseFloat(el.style.getPropertyValue('--dur'))===(setting==='short'?1265:2300),id+' configured duration');
  check(elapsed>0&&elapsed<target+1500,id+' completes within bound '+elapsed);
  const sorted=gaps.slice(2).sort((a,b)=>a-b);
  results.push({id,setting,ms:elapsed,...(sorted.length?{frameP95:Math.round(sorted[Math.floor(sorted.length*.95)]),frameMax:Math.round(sorted.at(-1))}:{})});
 }
}
mode('full');
for(const id of ids){
 const promise=__dbg.fx.show(id);await pause(70);
 const skipAt=performance.now();document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));await promise;
 check(performance.now()-skipAt<250,id+' tap skips immediately after dispatch');
 check(!document.querySelector('.legend-scene,.scene-art,.scene-spark'),id+' skip removes all owned layers');
}
for(const id of ids){const promise=__dbg.fx.show(id,1);await pause(30);check(!!document.querySelector('.legend-scene img'),id+' alternate art path');document.dispatchEvent(new Event('pointerdown',{bubbles:true,cancelable:true}));await promise;}
await pause(500);check(!document.querySelector('.scene-art,.scene-spark'), 'delayed callbacks cannot recreate layers');
check(JSON.stringify(__dbg.S)===before,'effects do not change game state');
// Exercise the server-confirmed showcase-frame path as well as direct previews.
window.__secureMock=async()=>({code:'FXFRAME',rev:1,mode:'bot',status:'active',side:0,state:JSON.parse(JSON.stringify(state)),visuals:{base:JSON.parse(JSON.stringify(state)),frames:[{patch:[],kind:'showcase',args:['panyakham',0]}]}});
const serverStart=performance.now(),serverPromise=__dbg.secure.bot(spec,1);
await pause(500);check(!!document.querySelector('.legend-scene .scene-art'),'server frame uses legend scene');
await serverPromise;clearInterval(__dbg.secure.SEC.timer);
check(__dbg.S.secure&&__dbg.secure.SEC.rev===1,'server frame finishes and applies state');
check(!document.querySelector('.legend-scene'),'server frame cleaned');
check(window.__errs.length===0,'no browser errors: '+window.__errs.join(';'));
return {checks,viewport:[innerWidth,innerHeight],results,errors:window.__errs};
