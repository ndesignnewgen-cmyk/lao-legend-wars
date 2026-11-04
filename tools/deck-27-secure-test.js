// Run through tools/wk.swift; tests the generated authoritative engine and decision replay.
const {createEngine,RULES_HASH}=await import('../supabase/functions/_shared/engine.mjs');
const api=createEngine(),checks=[],ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
const copy=x=>JSON.parse(JSON.stringify(x));
const spec={host:{di:26,list:api.decks[26].list},guest:{di:0,list:api.decks[0].list},mode:'pvp',level:1};
const base=api.start(spec,270411);
ok(api.validDeck(spec.host.list),'server accepts the new 30-card deck');
ok(!api.validDeck({...spec.host.list,dinoevoemperor:1}),'server rejects generated forms in a submitted deck');
function fixture(id='dinometarex',side=0){const b=copy(base),s=b.state;s.turn=side;s.T=7;s.fest=null;s.over=null;s.log=[];s.p.forEach(p=>Object.assign(p,{field:[],hand:[],traps:[],loc:null,grave:[],mana:10,maxMana:10,mulled:true,tales:[],deck:Array(20).fill('dinoraptor'),bot:false}));b.uid=20000;
 const p=s.p[side],q=s.p[1-side];p.hand=[{id:'dinoawaken',uid:19001}];p.field=[{id,uid:19002,sick:false,atk:1,items:['dinocore'],mods:[{amt:-1,exp:99}],dinoSince:5,dinoBase:id==='dinometarex'?'dinoking':'dinotrike',dinoCoreFresh:1}];
 q.field=[{id:'sangthong',uid:19003,sick:false,atk:0,items:[],mods:[]}];return b;}
const f=fixture(),move={type:'play',side:0,uid:19001,tk:'c:19002'};
const waiting=await api.run(f,move);
ok(waiting.prompt?.type==='ask'&&waiting.prompt.side===0,'emperor weapon choice is a server decision');
ok(waiting.checkpoint.state.p[0].field[0].id==='dinometarex'&&!waiting.checkpoint.state.p[0].dinoEvolved,'pending choice leaves authoritative checkpoint unchanged');
const sword=await api.run(f,move,[{side:0,value:true}]),beam=await api.run(f,move,[{side:0,value:false}]);
for(const [name,r]of [['sword',sword],['beam',beam]]){
 const p=r.checkpoint.state.p[0],c=p.field[0];ok(!r.prompt&&c.id==='dinoevoemperor'&&p.dinoEvolved&&c.atk===1&&c.mods[0].amt===-1&&c.items[0]==='dinocore','secure '+name+' evolution preserves state');
 ok(p.mana===6&&p.deck.length===19&&r.checkpoint.state.p[1].field.length===0,'secure '+name+' charges once, draws once and resolves one attack');
 ok(r.visuals[0].frames.some(x=>x.kind==='dinochange')&&r.visuals[1].frames.some(x=>x.kind==='dinochange'),'secure '+name+' records transform effects for both screens');
}
ok(sword.visuals[0].frames.some(f=>f.kind==='lunge'),'server records the emperor sword duel animation');
ok(beam.visuals[0].frames.some(f=>f.kind==='dinocue'&&f.args[1]==='beam'),'server records the dinosaur beam cue');
ok(sword.visuals[0].frames.some(f=>f.kind==='showcase'&&f.args[3]===true),'transform showcase does not replay its sound a second time');
const again=await api.run(f,move,[{side:0,value:true}]);ok(JSON.stringify(again.checkpoint)===JSON.stringify(sword.checkpoint),'decision replay is deterministic');
const second=copy(sword.checkpoint);second.state.p[0].field=[{id:'dinometatrike',uid:19004,sick:false,atk:0,items:[],mods:[],dinoSince:1}];second.state.p[0].hand=[{id:'dinoawaken',uid:19005}];let rejected=false;try{await api.run(second,{type:'play',side:0,uid:19005,tk:'c:19004'});}catch(e){rejected=true;}ok(rejected,'server refuses a second humanoid evolution');
const one=fixture('dinometarex',1),pending1=await api.run(one,{...move,side:1});ok(pending1.prompt?.side===1,'guest owns guest weapon decision');const guest=await api.run(one,{...move,side:1},[{side:1,value:false}]);ok(api.view(guest,1).state.p[0].field[0].id==='dinoevoemperor','guest sees own evolved card on correct side');
const counter=fixture('dinometatrike');counter.state.p[1].traps=['ngaonam'];const no=await api.run(counter,move);ok(no.checkpoint.state.p[0].field[0].id==='dinometatrike'&&!no.checkpoint.state.p[0].dinoEvolved,'countered spell does not consume once-per-game evolution');
const same=fixture('dinometatrike');same.state.p[0].field[0].dinoSince=7;rejected=false;try{await api.run(same,move);}catch(e){rejected=true;}ok(rejected,'server rejects same-turn evolution');
const eg=fixture();eg.state.p[0].field=[];eg.state.p[0].hand=[{id:'dinoeggtrex',uid:19001}];const egg=await api.run(eg,{type:'play',side:0,uid:19001});ok(egg.visuals[0].frames.some(f=>f.kind==='dinocue'&&f.args[1]==='egg'),'egg placement cue is recorded');
const he=fixture('dinometatrike',1);he.state.p[1].hand=[{id:'dinorepair',uid:19001}];he.state.p[1].life=10;const heal=await api.run(he,{type:'play',side:1,uid:19001});ok(heal.visuals[0].frames.some(f=>f.kind==='dinocue'&&f.args[0]==='h:1')&&heal.visuals[1].frames.some(f=>f.kind==='dinocue'&&f.args[0]==='h:0'),'hero healing cue flips correctly for the guest');
return JSON.stringify({passed:checks.length,checks,hash:RULES_HASH});
