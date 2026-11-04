const D=window.__dbg,K=D.dino,R=D.rules,C=D.C,checks=[];
const ok=(x,n)=>{if(!x)throw Error(n);checks.push(n);};
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){const g={screen:'game',p:[K.make('A',0,true,1),K.make('B',1,true,1)],turn:0,T:1,level:1,log:[],over:null,fast:true,auto:true,sim:true,busy:false,modal:null,targeting:null};K.set(g);for(const p of g.p){p.deck=Array(30).fill('babynaga');p.mana=20;p.maxMana=20;p.tales=[];p.mulled=true;}return g;}
function put(g,id,side=0){const c=K.fresh(id);g.p[side].field.push(c);return c;}
let g=fixture(),p=g.p[0],c=put(g,'dinometaraptor');
ok(Object.values(C).filter(c=>c.tribe2).length===15,'15 selected cards, at most two tribes');
ok(R.hasTribe(c,'dino')&&R.hasTribe(c,'cyborg'),'hybrid counts for both tribes');
ok(R.hasTribe('nagax','naga')&&R.hasTribe('mechyak','giant'),'existing characters gain their folklore identity');
ok(!R.hasTribe('dinotrex','cyborg')&&!R.hasTribe('dinoeggtrex','cyborg'),'ordinary dinosaur and egg are not cyborgs');
ok(K.targets(p,'chippower').some(t=>t.c===c)&&K.targets(p,'dinocore').some(t=>t.c===c),'hybrid receives either tribe-specific item');
const n=K.pow(p,c);put(g,'phayanak');const nx=put(g,'nagax');ok(K.pow(p,nx)===C.nagax.power+1,'naga aura buffs hybrid exactly once');
p.loc='neoncity';R.attach(p,c,'chippower');ok(K.pow(p,c)===n+C.chippower.bonus+1,'chip plus location applies each printed source once');
g=fixture();p=g.p[0];c=put(g,'babynaga');R.attach(p,c,'sonsin');R.attach(p,c,'lowai');ok(c.items.length===2&&R.equipMax(c)===2,'ordinary character has two slots');
const old=K.pow(p,c);ok(R.attach(p,c,'wao',0)&&c.items.join(',')==='lowai,wao'&&p.grave.includes('sonsin'),'chosen item goes to grave and new item uses its slot');
ok(K.pow(p,c)===old-C.sonsin.bonus+C.wao.bonus,'removed bonus disappears');
const before=clone({c,p});ok(!R.attach(p,c,'katip',9)&&JSON.stringify({c,p})===JSON.stringify(before),'invalid replacement never mutates state');
R.attach(p,c,'wao',1);ok(c.items.filter(x=>x==='wao').length===1&&p.grave.includes('wao'),'same normal item replaces rather than stacks');
ok(R.equipMax({id:'kalaket'})===4&&R.equipMax({id:'nakdap'})===4&&R.equipMax({id:'nagax'})===4,'printed equipment specialists retain extra slots');
g=fixture();p=g.p[0];c=put(g,'nagax');for(let i=0;i<3;i++)R.attach(p,c,'chippower');ok(c.items.filter(x=>x==='chippower').length===2,'chip duplicates capped at two even on Naga-X');for(let i=0;i<3;i++)R.attach(p,c,'chipfly');ok(c.items.length===4&&c.items.filter(x=>x==='chipfly').length===2,'Naga-X can use four slots, two of each chip');
g=fixture();p=g.p[0];c=put(g,'babynaga');R.attach(p,c,'takut');ok(c.shield&&c.itemShield==='takut','item shield records its source');R.detach(p,c,0);ok(!c.shield,'removing unspent item shield removes protection');
c=put(g,'dinometatrike');R.attach(p,c,'takut');R.detach(p,c,0);ok(c.shield,'removing item keeps independent innate shield');
c=put(g,'babynaga');R.attach(p,c,'takut');await K.destroy(p,c,true);ok(!c.shield&&p.field.includes(c),'shield absorbs one hit');R.attach(p,c,'lowai');R.detach(p,c,0);ok(!c.shield,'removing consumed item does not regenerate shield');
c=put(g,'babynaga');R.attach(p,c,'takut');let h={uid:90001,id:'puemponkan'};p.hand=[h];await K.play(p,h,{kind:'char',owner:p,c});R.detach(p,c,0);ok(c.shield,'independent spell shield survives removing equipment');
g=fixture();p=g.p[0];c=put(g,'babynaga');R.attach(p,c,'takut');R.attach(p,c,'lowai');h={uid:90002,id:'sonsin'};p.hand=[h];const state=JSON.stringify(g);ok(!K.legal(p,{type:'play',uid:h.uid,tk:'c:'+c.uid,replace:99}),'forged slot rejected');await K.play(p,h,{kind:'char',owner:p,c},null,99);ok(JSON.stringify(g)===state,'invalid direct equipment play spends neither hand nor mana');
ok(K.legal(p,{type:'play',uid:h.uid,tk:'c:'+c.uid,replace:1}),'explicit legal replacement accepted');await R.apply({type:'play',uid:h.uid,tk:'c:'+c.uid,replace:1});ok(c.items.includes('sonsin')&&!c.items.includes('lowai')&&p.mana===18,'real move replaces selected equipment and pays once');
ok(K.clone().p[0].field[0].itemShield===c.itemShield,'hard bot clone preserves shield provenance');
g=fixture();p=g.p[0];c=put(g,'nagax');p.hand=[{uid:90003,id:'chippower'}];const moves=K.moves(p).filter(m=>m.type==='play');ok(moves.length>0&&moves.every(m=>K.legal(p,m)),'hard bot emits legal equipment choices');
for(let i=0;i<3;i++){const l=R.recipe(i);ok(Object.values(l).reduce((a,b)=>a+b,0)>=30&&Object.values(l).reduce((a,b)=>a+b,0)<=40&&Object.entries(l).every(([id,n])=>C[id]&&!C[id].fusion&&!C[id].token&&n<=3&&(!C[id].legend||n===1)),'mixed recipe '+i+' is legal');}
ok(R.pool({own:false,deck:'',tribe:'naga'}).includes('nagax'),'builder secondary tribe search');
ok(R.pool({own:false,deck:'',role:'equip'}).every(id=>R.roles(id).includes('equip')),'role filter');
ok(D.deck.related('nagax').some(x=>x.id==='phayanak')||D.deck.related('phayanak').some(x=>x.id==='nagax'),'related cards explain cross-tribe aura');
ok(D.deck.tips({chippower:3,babynaga:3}).some(t=>t.includes('ບໍ່ມີຕົວທີ່ຮັບໄດ້')),'builder warns about unusable equipment');
K.set(null);
// Authoritative game validates the same slot and secondary-tribe behavior.
const {createEngine}=await import('/supabase/functions/_shared/engine.mjs');const {safeMove}=await import('/supabase/functions/_shared/security.mjs');
const E=createEngine(),spec={mode:'casual',level:1,host:{di:0,list:E.decks[0].list},guest:{di:1,list:E.decks[1].list}};let base=E.start(spec,4271);base.state.turn=0;base.state.T=1;base.state.p.forEach(p=>{p.mulled=true;p.mana=10;p.maxMana=10;p.tales=[];});base.state.p[0].field=[{uid:90100,id:'babynaga',sick:false,atk:0,items:['takut','lowai'],mods:[],shield:true,itemShield:'takut'}];base.state.p[0].hand=[{uid:90101,id:'sonsin'}];
let rejected=false;try{await E.run(base,{type:'play',side:0,uid:90101,tk:'c:90100',replace:9});}catch{rejected=true;}ok(rejected,'server rejects forged slot');
const bcopy=JSON.stringify(base),result=await E.run(base,safeMove({t:'play',uid:90101,tk:'c:90100',replace:0},0));ok(JSON.stringify(base)===bcopy,'authoritative transition keeps original checkpoint immutable');const sc=result.checkpoint.state.p[0];ok(sc.field[0].items.join(',')==='lowai,sonsin'&&!sc.field[0].shield&&sc.grave.includes('takut')&&sc.mana===8,'server commits same replacement, shield removal and cost');
let bad=false;try{safeMove({t:'play',replace:'0'},0);}catch{bad=true;}ok(bad,'sanitizer rejects nonnumeric replacement');
const hidden=E.view(result,1).state;ok(hidden.p[1].hand.every(x=>x.id==='back')&&hidden.p.every(p=>p.deck.every(x=>x==='back')),'new rules preserve private hand and deck');
return JSON.stringify({passed:checks.length,checks,errors:window.__errs});
