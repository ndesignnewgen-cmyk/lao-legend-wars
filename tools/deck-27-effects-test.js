// Run against tools/deck-27-preview.html with wk.swift. Real DOM + production effect code.
const W=ms=>new Promise(r=>setTimeout(r,ms));await W(400);
const f=document.querySelector('iframe'),D=f.contentWindow.__dbg,K=D.dino,doc=f.contentDocument,win=f.contentWindow,checks=[];
const ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
D.style.set({speed:.5,fx:'short'});
const imageFiles=['dino-upgrade-ring','dino-core-flare','dino-egg-crack','dino-gold-footprint','armor-plate','drum-shield','beam-slash','thruster-flame','beam-gold','target-ring'];
await Promise.all(imageFiles.map(n=>new Promise((res,rej)=>{const i=new win.Image();i.onload=res;i.onerror=()=>rej(Error(n));i.src='../art/fx/'+n+'.webp';})));
const state=JSON.stringify(D.S.p);
for(const [id,cfg]of Object.entries(K.scenes)){
 const pending=D.fx.show(id,!!D.C[id].legend);await W(45);
 const el=doc.querySelector('.show.dino-scene'),scene=el?.querySelector('.dino-entrance');
 ok(el&&scene?.dataset.role===cfg.role&&scene.dataset.stage===cfg.stage,id+': distinct illustrated entrance');
 ok(win.getComputedStyle(el.querySelector('.sbg')).display==='none'&&!el.querySelector('.stint'),id+': no full-screen tint or image backdrop');
 ok(el.querySelector('.scut')&&el.querySelectorAll('.dino-sprite').length>=1,id+': original full-body cutout and local effect art');
 D.fx.state.waits.slice().forEach(fn=>fn());await pending;
 ok(!doc.querySelector('.show'),id+': skipping cleans up every entrance layer');
}
const c=D.S.p[0].field[0],key='c:'+c.uid,card=doc.querySelector('[data-k="'+key+'"]'),r=card.getBoundingClientRect();
for(const stage of ['hatch','grow','cyber','evo']){
 const now=doc.querySelector('[data-k="'+key+'"]').getBoundingClientRect();
 const pending=K.fx(key,stage,'dinoevoemperor');const el=doc.querySelector('.dino-fx');
 ok(el&&win.getComputedStyle(el).position==='fixed'&&Math.abs(parseFloat(el.style.left)-(now.left+now.width/2))<2,stage+': anchored over the card '+JSON.stringify({left:el?.style.left,expected:now.left+now.width/2,position:el&&win.getComputedStyle(el).position,roots:doc.querySelectorAll('.dino-fx').length}));
 ok(stage!=='grow'||!el.querySelector('[data-asset="dino-egg-crack"]'),'growth does not reuse broken egg shells');
 D.fx.state.waits.slice().forEach(fn=>fn());await pending;ok(!doc.querySelector('.dino-fx'),stage+': cleanup after skip');
}
const target='c:'+D.S.p[1].field[0].uid;
for(const kind of ['egg','warm','guard','core','heal','nest','shield','claw','sword','beam']){
 await K.cue(key,kind,'dinoevoemperor',target);ok(!doc.querySelector('.dino-fx'),kind+': cue completed and removed');
}
ok(JSON.stringify(D.S.p)===state,'preview effects leave all gameplay values unchanged');
D.style.set({fx:'off'});await K.fx(key,'evo','dinoevoemperor');await D.fx.show('dinoevoemperor');ok(!doc.querySelector('.dino-fx,.show'),'off mode suppresses visual layers');
D.style.set({fx:'short',speed:1});ok(D.morphCheck()===true,'board DOM still matches normal render');
ok(!win.__errs.length,'no browser errors');return JSON.stringify({passed:checks.length,checks,errors:win.__errs});
