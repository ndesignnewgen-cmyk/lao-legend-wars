// Safari: run on tools/deck-27-preview.html?art=special (desktop and phone).
const W=ms=>new Promise(r=>setTimeout(r,ms));await W(350);
const frame=document.querySelector('iframe'),win=frame.contentWindow,D=win.__dbg,K=D.dino,doc=frame.contentDocument;
const checks=[],ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
const settings={...D.style.set({})};D.style.set({fx:'short',speed:.5});
const before=JSON.stringify(D.S.p),collection=JSON.stringify(D.deck.col());
ok(document.getElementById('fxArt').value==='special','special-art link selects the alternate artwork mode');
ok(Object.keys(K.altScenes).length===6,'all six existing special artworks have entrances');
const motifs=new Set(),paths=new Set();
for(const [id,cfg]of Object.entries(K.altScenes)){
 await Promise.all(['cut/alt-'+id+'.webp','w2/alt-'+id+'.webp'].map(path=>new Promise((res,rej)=>{const im=new win.Image();im.onload=res;im.onerror=()=>rej(Error(path));im.src='../art/'+path;})));
 const pending=D.fx.show(id,true),el=doc.querySelector('.show.dino-scene.alt'),root=el?.querySelector('.dino-alt-entrance');
 ok(el?.dataset.cut==='alt-'+id&&el.querySelector('.scut img').getAttribute('src').endsWith('/cut/alt-'+id+'.webp'),id+': uses the correct special full-body art');
 ok(root?.dataset.motif===cfg.motif&&root.querySelectorAll('.dino-alt-star').length===8,id+': own motif and bounded sparkles');
 ok(el.querySelector('.scene-subtitle').textContent===cfg.title,id+': special entrance title');
 ok(!!(root.compareDocumentPosition(el.querySelector('.scut'))&win.Node.DOCUMENT_POSITION_FOLLOWING),id+': ornament is behind the character');
 ok(win.getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)'&&win.getComputedStyle(el.querySelector('.sbg')).display==='none',id+': board stays visible without a full-screen backdrop');
 const mark=root.querySelector('.dino-alt-mark');for(const a of mark.getAnimations())a.finish();
 const rect=mark.getBoundingClientRect();ok(rect.width<=win.innerWidth&&rect.height<=win.innerHeight,id+': local ornament fits the viewport');
 motifs.add(root.dataset.motif);paths.add(cfg.path);
 D.fx.state.waits.slice().forEach(fn=>fn());await pending;
 ok(!doc.querySelector('.show,.dino-alt-entrance'),id+': skip removes every special-art layer');
 const plain=D.fx.show(id,false);ok(!doc.querySelector('.dino-alt-entrance')&&doc.querySelector('.show').dataset.cut===id,id+': regular art retains its regular entrance');
 D.fx.state.waits.slice().forEach(fn=>fn());await plain;
}
ok(motifs.size===6&&paths.size===6,'six visually distinct designs');
// Exercise the real preview button, not just the debug entry point.
document.getElementById('fxCard').value='dinoevoemperor';document.getElementById('fxArt').value='special';
const click=document.getElementById('entrance').onclick();
for(let i=0;i<100&&!doc.querySelector('.show');i++)await W(30);
ok(doc.querySelector('.show')?.dataset.cut==='alt-dinoevoemperor','preview button plays selected special art after audio decoding');
D.fx.state.waits.slice().forEach(fn=>fn());await click;
ok(!D.S.busy&&!document.getElementById('entrance').disabled,'preview unlocks after skip');
const replay=D.secure.effect('showcase',['dinoevobastion',true,false,true]);
ok(doc.querySelector('.show')?.dataset.cut==='alt-dinoevobastion'&&!!doc.querySelector('[data-motif="citadel"]'),'secure replay preserves the alternate art and ornament');
D.fx.state.waits.slice().forEach(fn=>fn());await replay;
document.getElementById('fxCard').value='dinolongneck';document.getElementById('fxCard').dispatchEvent(new Event('change'));
ok(document.getElementById('fxArt').value==='normal'&&document.getElementById('fxArt').options[1].disabled,'cards without special art return to regular artwork');
D.style.set({fx:'off'});await D.fx.show('dinoking',true);ok(!doc.querySelector('.show,.dino-alt-entrance'),'off mode also suppresses special art');
ok(JSON.stringify(D.S.p)===before&&JSON.stringify(D.deck.col())===collection,'preview changes no gameplay values or owned cosmetics');
ok(document.documentElement.scrollWidth<=innerWidth,'preview controls fit the viewport');
ok(!win.__errs.length,'no browser errors');D.style.set(settings);
return JSON.stringify({passed:checks.length,width:innerWidth,specialArts:motifs.size,checks,errors:win.__errs});
