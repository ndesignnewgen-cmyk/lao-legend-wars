// Run with tools/wk.swift against localhost. Tests the real rules, not a copied implementation.
const D=window.__dbg, K=D.dino, C=D.C, checks=[];
const ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
function fixture(){
 const g={screen:'game',p:[K.make('A',26,true,1),K.make('B',0,true,1)],turn:0,T:1,level:1,log:[],over:null,fast:true,auto:true,sim:true,busy:false,modal:null,targeting:null};
 K.set(g);for(const p of g.p){p.deck=Array(30).fill('dinoraptor');p.mana=10;p.maxMana=10;p.tales=[];p.mulled=true;}
 return g;
}
function put(g,id,side=0){const c=K.fresh(id);g.p[side].field.push(c);return c;}
async function play(g,id,c){const p=g.p[0],h={uid:100000+p.grave.length+p.hand.length,id};p.hand.push(h);await K.play(p,h,c?{kind:'char',owner:p,c}:null);}
let g=fixture(),p=g.p[0],e=put(g,'dinoeggtrex');
ok(!K.canAttack(p,e),'eggs cannot attack');
g.T=3;await K.start(p);ok(e.id==='dinoeggtrex'&&e.dinoTimer===1,'first own start counts once');
g.T=5;await K.start(p);ok(e.id==='dinobabyrex'&&e.dinoTimer===2&&K.canAttack(p,e),'hatch at own start readies baby; growth not counted twice');
g.T=7;await K.start(p);ok(e.id==='dinobabyrex'&&e.dinoTimer===1,'baby growth first start');
g.T=9;await K.start(p);ok(e.id==='dinotrex'&&e.dinoTimer===0,'baby grows into ordinary rex, never a legend');
g=fixture();p=g.p[0];e=put(g,'dinoeggtrike');await K.tick(p,e,false);await K.tick(p,e,false);
ok(e.id==='dinotrike'&&!K.canAttack(p,e)&&!K.cyber(p,e),'mid-turn hatch waits and cannot immediately upgrade');
g.T=3;ok(K.cyber(p,e),'survived natural form can upgrade next turn');
e.sick=false;e.atk=1;e.frz=5;e.items=['dinocore'];e.dinoCoreFresh=1;e.mods=[{amt:-2,exp:100}];const uid=e.uid,slot=p.field.indexOf(e),deck=p.deck.length;
await play(g,'dinoupgrade',e);
ok(e.id==='dinometatrike'&&e.uid===uid&&p.field.indexOf(e)===slot,'cyber changes in place');
ok(e.atk===1&&e.frz===5&&e.mods[0].amt===-2&&e.items[0]==='dinocore'&&!K.canAttack(p,e),'upgrade preserves spent attack, freeze, debuff and item');
ok(e.shield&&p.deck.length===deck-1&&e.dinoCoreFresh===0,'new shield and exactly one item draw');
const r=put(g,'dinoraptor');r.dinoSince=1;ok(!K.cyber(p,r),'one upgraded form per side');
ok(!K.evo(p,e),'cannot awaken on the upgrade turn');
g.T=5;ok(K.evo(p,e),'cyber survives a turn before awakening');await play(g,'dinoawaken',e);
ok(e.id==='dinoevobastion'&&p.dinoEvolved&&e.shield&&e.atk===1&&e.frz===5&&p.deck.length===deck-1,'humanoid preserves state, grants one shield; no repeated core draw');
const copy=K.clone();ok(copy.p[0].dinoEvolved&&copy.p[0].field[0].dinoBase==='dinotrike'&&copy.p[0].field[0].dinoCoreFresh===0,'hard bot clone keeps evolution state');
K.bounce(p,e);ok(p.hand.some(h=>h.id==='dinotrike')&&!p.field.includes(e)&&p.dinoEvolved,'bounce returns ordinary form; once-per-game flag remains');
g.T=7;ok(K.cyber(p,r),'upgrade allowed again after previous leaves on later turn');
await play(g,'dinoupgrade',r);g.T=9;ok(!K.evo(p,r),'cannot awaken a second time even after bouncing');
g=fixture();p=g.p[0];e=put(g,'dinoking');e.dinoSince=0;await play(g,'dinoupgrade',e);e.shield=false;await K.destroy(p,e);
ok(!p.field.length&&p.grave.includes('dinoking')&&!p.grave.includes('dinometarex'),'destroy leaves no free previous form and no cyber in grave');
g=fixture();p=g.p[0];e=put(g,'dinoraptor');e.dinoSince=0;await play(g,'dinoupgrade',e);g.T=3;await play(g,'dinoawaken',e);ok(e.id==='dinoevoblader'&&K.canAttack(p,e),'blader rush works without a new attack allotment');e.atk=1;ok(!K.canAttack(p,e),'dual swords do not give two attacks');
g=fixture();p=g.p[0];e=put(g,'dinoeggtrike');p.loc='dinovalley';ok(K.pow(p,e)===2,'valley buffs eggs');p.loc=null;ok(K.pow(p,e)===1,'valley bonus vanishes when removed');
const n=put(g,'dinolongneck');p.life=10;for(let i=0;i<3;i++){let x=put(g,'dinoeggraptor');x.dinoTimer=1;await K.tick(p,x,false);}ok(p.life===12&&n.dinoHealN===2,'longneck healing capped at two hatches per turn');
g=fixture();p=g.p[0];const a=put(g,'dinoraptor'),b=put(g,'dinoraptor');ok(K.pow(p,a)===3,'raptor pack bonus');b.id='dinometaraptor';ok(K.pow(p,a)===3,'cyber aura replaces, never stacks with pack bonus');
g=fixture();p=g.p[0];const h={uid:999999,id:'dinoawaken'};p.hand=[h];ok(!!K.block(p,h)&&!K.legal(p,{type:'play',uid:h.uid,tk:null}),'unavailable evolution cannot spend mana or become a legal move');
const before=p.mana;ok(K.targets(p,'dinohatch').length===0&&p.mana===before,'no egg means no hatch target');
const sp=D.deck.sp(D.DECKS[26].list);ok(['dinobabyrex','dinometarex','dinoevoemperor','dinoevobastion','dinoevoblader'].every(id=>sp.sum.some(x=>x.id===id)),'extra pile includes hatches and all humanoid forms');
ok(Object.values(D.DECKS[26].list).reduce((a,b)=>a+b,0)===30&&Object.entries(D.DECKS[26].list).every(([id,n])=>n<=3&&!C[id].token),'30-card starter excludes generated forms');
ok(D.DECKS[25].no===26&&D.DECKS[26].no===27,'new deck appended; saved deck indices unchanged');
K.set(null);return JSON.stringify({passed:checks.length,checks,errors:window.__errs});
