import assert from 'node:assert/strict';
import {createEngine} from '../supabase/functions/_shared/engine.mjs';
import {safeMove,readBody,transition,responseView,ApiError,normalizeSpec} from '../supabase/functions/_shared/security.mjs';
let checks=0;const ok=(x,m)=>{assert(x,m);checks++;};
const clone=x=>JSON.parse(JSON.stringify(x));
const e=createEngine(),spec={mode:'casual',level:1,host:{di:0,list:e.decks[0].list},guest:{di:1,list:e.decks[1].list}};
let bundle=await createEngine().run(e.start(spec,42),{type:'start'},[]);
while(bundle.prompt){const action=bundle.pending?.action||{type:'start'},answers=[...(bundle.pending?.answers||[]),{side:bundle.prompt.side,value:[]}];const next=await createEngine().run(bundle.checkpoint,action,answers);bundle={...next,pending:next.prompt?{action,answers}:null};}
const base=clone(bundle.checkpoint);
const v=e.view(bundle,0);ok(v.state.p[1].hand.every(h=>h.id==='back'),'opponent hand hidden');ok(v.state.p.every(p=>p.deck.every(id=>id==='back')),'both deck orders hidden');
ok(!('secureCounts'in v.state),'private metrics removed');
const victim=bundle.checkpoint.state.turn;
await assert.rejects(()=>e.run(base,{type:'play',side:1-victim,uid:123}),/Not your turn/);checks++;
await assert.rejects(()=>e.run(base,{type:'atk',side:victim,uid:123,tk:'h:1'}),/Illegal move/);checks++;
assert.deepEqual(base,bundle.checkpoint);checks++;
assert.throws(()=>safeMove({t:'claimed'},0));checks++;
assert.throws(()=>safeMove({t:'atk',tk:{},uid:1},0));checks++;
assert.deepEqual(safeMove({t:'atk',uid:1,tk:'H:o',side:1,win:true},0),{type:'atk',side:0,uid:1,tk:'h:1'});checks++;
await assert.rejects(()=>readBody(new Request('http://test',{method:'POST',body:'x'.repeat(17000)})),e=>e.status===413);checks++;
await assert.rejects(()=>readBody(new Request('http://test',{method:'POST',body:'[]'})),ApiError);checks++;
assert.throws(()=>normalizeSpec(e,{list:{missing:30}}));checks++;
const rid='00000000-0000-4000-8000-000000000015';
const row={engine:bundle,rev:1,deadline:new Date(Date.now()+60000).toISOString()};
await assert.rejects(()=>transition(e,row,victim,{op:'move',rid,rev:0,move:{t:'end'}}),/stale_revision/);checks++;
assert.throws(()=>responseView(e,{host:'a',guest:'b',engine:bundle},'outsider'),/not_your_game/);checks++;
let initial=await createEngine().run(e.start(spec,123),{type:'start'},[]);
ok(!!initial.prompt,'start has mulligan prompt');
await assert.rejects(()=>e.run(initial.checkpoint,{type:'start'},[{side:initial.prompt.side,value:[999999]}]),/Invalid mulligan/);checks++;
const quit=await transition(e,{engine:{...initial,pending:{action:{type:'start'},answers:[]}},rev:1},1-initial.prompt.side,{op:'move',rid,rev:1,move:{t:'quit'}});
ok(quit.checkpoint.state.over.winner===initial.prompt.side,'quit works during opponent decision');
let games=0;
const total=Number(process.argv.find(x=>x.startsWith('--games='))?.split('=')[1]||48);
for(let g=0;g<total;g++){
 const eg=createEngine(),a=g%24,b=(a+1+Math.floor(g/24))%24;
 const mode=g%2?'bot':'casual';const sp={mode,level:g%3,host:{di:a,list:eg.decks[a].list},guest:{di:b,list:eg.decks[b].list}};
 let action={type:'start'},answers=[],current={checkpoint:eg.start(sp,100+g)};
 for(let turn=0;turn<1200&&!current.checkpoint.state.over;turn++){
  const before=clone(current.checkpoint);let r;try{r=await createEngine().run(current.checkpoint,action,answers);}catch(e){console.error({game:g,turn:current.checkpoint.state.T,action,hand:current.checkpoint.state.p[action.side]?.hand.map(h=>h.id)});throw e;}
  if(r.prompt){
   const p=r.prompt;const value=p.type==='mull'?[]:p.type==='ask'?false:p.type==='rite'?p.opts[0]:p.cards[0].uid;
   answers.push({side:p.side,value});current={...r,pending:{action,answers}};
   const replay=await createEngine().run(before,action,answers.slice(0,-1));assert.deepEqual(replay.prompt,p);checks++;
  }else{current=r;answers=[];if(!r.checkpoint.state.over)action=eg.suggest(r);}
 }
 ok(!!current.checkpoint.state.over,'game completes '+g);games++;
}
console.log('PASS',checks,'security checks;',games,'authoritative games');
