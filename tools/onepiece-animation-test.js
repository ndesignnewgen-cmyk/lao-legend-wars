await new Promise(r=>setTimeout(r,500));
if(!window.__opTrial)throw new Error('App did not boot');
window.__opTrial.select('ST01-012');
document.querySelector('#practice').scrollIntoView();
for(const i of document.images)i.loading='eager';
await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
const checks=[];const assert=(v,m)=>{if(!v)throw new Error(m);checks.push(m);};
assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow at '+innerWidth);
if(document.querySelector('#motion').getAttribute('aria-pressed')==='true')document.querySelector('#motion').click();
for(const action of ['play','attach','attach','attack']){
 document.querySelector('[data-action="'+action+'"]').click();
 await new Promise(r=>setTimeout(r,1000));
 assert(!window.__opTrial.busy,'Animation unlocks '+action);
}
assert(window.__opTrial.state.enemyLife===4,'Animated attack completes');
assert(document.querySelector('#effects').children.length===0,'Temporary effect nodes removed');
assert([...document.querySelectorAll('.unit')].every(el=>el.getAnimations().length===0),'No persistent card animations');
assert(document.querySelectorAll('#effects .fx-sprite').length===0,'No effects obscure the board');
assert([...document.querySelectorAll('#cards img')].every(i=>i.complete&&i.naturalWidth),'All original card art available');
return JSON.stringify({checks,width:innerWidth,scrollWidth:document.documentElement.scrollWidth});