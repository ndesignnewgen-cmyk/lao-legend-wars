const {createEngine}=await import('/supabase/functions/_shared/engine.mjs');const {safeMove}=await import('/supabase/functions/_shared/security.mjs');const api=createEngine(),D=window.__dbg,results=[];
for(let g=0;g<30;g++){
 const a=g%27,b=(a+5)%27,list=g>=27?D.rules.recipe(g-27):api.decks[a].list;
 const spec={mode:g%2?'bot':'casual',level:1,host:{di:a,list},guest:{di:b,list:api.decks[b].list}};
 let current={checkpoint:api.start(spec,525100+g)},action={type:'start'},answers=[],moves=0;
 for(let i=0;i<900&&!current.checkpoint.state.over;i++){
  const before=JSON.stringify(current.checkpoint),r=await createEngine().run(current.checkpoint,action,answers);
  if(JSON.stringify(current.checkpoint)!==before)throw Error('mutated checkpoint');
  if(r.prompt){const p=r.prompt,value=p.type==='mull'?[]:p.type==='ask'?false:p.type==='rite'?p.opts[0]:p.cards[0].uid;answers.push({side:p.side,value});}
  else{current=r;answers=[];if(!r.checkpoint.state.over)action=api.suggest(r);moves++;}
  for(const p of (r.preview||r.checkpoint).state.p)for(const c of p.field){const max=D.rules.equipMax(c);if(c.items.length>max)throw Error('equipment overflow '+c.id);for(const id of c.items)if(c.items.filter(x=>x===id).length>D.rules.equipCopies(c,id))throw Error('duplicate overflow '+id);}
  if(g%6===0){const v=api.view(r,1);if(v.state.p.some(p=>p.deck.some(x=>x!=='back')))throw Error('deck privacy');}
 }
 if(!current.checkpoint.state.over)throw Error('game incomplete '+g);
 results.push({game:g,host:g>=27?'mix'+(g-27):api.decks[a].no,moves,winner:current.checkpoint.state.over.winner});
}
return JSON.stringify({passed:results.length,results});
