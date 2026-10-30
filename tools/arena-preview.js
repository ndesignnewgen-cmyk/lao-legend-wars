// Local mock match: renders the real board and real effects, never sends a rewarded move.
if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error('Local preview only');
const frame=document.getElementById('game'),status=document.getElementById('status'),buttons=[...document.querySelectorAll('button')];
let ready=false,busy=false,showCards=false;
let demoFields=[];
frame.addEventListener('load',async()=>{
 try{
  const w=frame.contentWindow,d=w.__dbg,{createEngine}=await import('../supabase/functions/_shared/engine.mjs'),e=createEngine(),spec={di:0,list:e.decks[0].list};
  const cp=e.start({mode:'bot',host:spec,guest:{di:3,list:e.decks[3].list}},42),state=e.view({checkpoint:cp},0).state;
  state.turn=0;state.busy=false;state.T=8;
  const card=(id,uid)=>({uid,id,alt:0,sick:false,atk:0,items:[],mods:[]});
  state.p[0].field=['sinxay','phonthahan','naktanu'].map((id,i)=>card(id,900+i));
  state.p[1].field=['phayathaen','thewada','kinnari'].filter(id=>d.C[id]).map((id,i)=>card(id,910+i));
  demoFields=state.p.map(p=>p.field);
  state.p.forEach(p=>{p.field=[];p.mana=7;p.maxMana=7;p.loc=null;});
  w.localStorage.setItem('lao-legend-guest','1');d.ui.login=null;
  w.__secureMock=async()=>({code:'VATPHOU',rev:1,mode:'bot',status:'active',side:0,state:JSON.parse(JSON.stringify(state))});
  await d.secure.bot(spec,1);clearInterval(d.secure.SEC.timer);d.S.modal=null;d.S.busy=true;d.S.online=null;d.ui.detail={id:'sonsin'};
  const requested=new URLSearchParams(location.search).get('theme');const chosen=[...document.getElementById('theme').options].some(o=>o.value===requested)?requested:'watphou';document.getElementById('theme').value=chosen;setTheme(chosen);d.ui.settingsOpen=true;d.render();w.document.querySelector('[data-a="setfx"][data-v="full"]').click();d.ui.settingsOpen=false;d.render();
  for(let i=0;i<100&&w.document.getElementById('fx').childElementCount;i++)await new Promise(r=>setTimeout(r,50));d.fx.state.flash=0;d.fx.state.ps=[];
  ready=true;buttons.forEach(b=>b.disabled=false);status.textContent='ສາກທົດລອງ · ກົດປຸ່ມເພື່ອເບິ່ງແສງ';
 }catch(e){status.textContent='ເປີດບໍ່ໄດ້: '+e.message;}
});
function setTheme(value){const w=frame.contentWindow,d=w.__dbg;d.ui.settingsOpen=true;d.render();w.document.querySelector('[data-a="theme"][data-v="'+value+'"]').click();d.ui.settingsOpen=false;d.render();const label=document.querySelector('#theme option[value="'+value+'"]').textContent;document.getElementById('arena-title').textContent=label;document.title=label;frame.title='ສະໜາມ '+label+' ໃນເກມ';document.body.dataset.theme=value;}
document.getElementById('theme').onchange=e=>{if(ready&&!busy)setTheme(e.target.value);};
async function play(kind){
 if(!ready||busy)return;busy=true;buttons.forEach(b=>b.disabled=true);document.getElementById('theme').disabled=true;
 try{const d=frame.contentWindow.__dbg;await (kind==='legend'?d.fx.show('phayathaen'):d.fx.cutin('sinxaysam'));}
 finally{busy=false;buttons.forEach(b=>b.disabled=false);document.getElementById('theme').disabled=false;}
}
document.getElementById('extra').onclick=()=>{if(ready&&!busy)frame.contentWindow.document.querySelector('[data-a="extra"][data-v="1"]').click();};
document.getElementById('log').onclick=()=>{if(ready&&!busy)frame.contentWindow.document.querySelector('[data-a="log"]').click();};
document.getElementById('cards').onclick=()=>{if(!ready||busy)return;showCards=!showCards;const d=frame.contentWindow.__dbg;d.S.p.forEach((p,i)=>p.field=showCards?JSON.parse(JSON.stringify(demoFields[i])):[]);d.render();document.getElementById('cards').textContent=showCards?'ເບິ່ງສະໜາມວ່າງ':'ວາງກາດໃຫ້ເບິ່ງ';};
document.getElementById('legend').onclick=()=>play('legend');document.getElementById('fusion').onclick=()=>play('fusion');
frame.src='../';
