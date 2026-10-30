// Local development only. The engine and visuals are the actual game's implementation.
if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error('Local preview only');
const frame=document.getElementById('game'),select=document.getElementById('deck'),note=document.getElementById('note');
let ready=false,running=false,loop=true,version=0,held=null;
frame.addEventListener('load',async()=>{
 try{
 const w=frame.contentWindow,d=w.__dbg;
 if(!d)throw Error('Game debug hooks unavailable');
 const {createEngine}=await import('../supabase/functions/_shared/engine.mjs'),e=createEngine(),spec={di:0,list:e.decks[0].list};
 const cp=e.start({mode:'bot',host:spec,guest:{di:1,list:e.decks[1].list}},42),state=e.view({checkpoint:cp},0).state;state.turn=0;state.busy=false;
 w.localStorage.setItem('lao-legend-guest','1');d.ui.login=null;
 w.__secureMock=async()=>({code:'FXPREVIEW',rev:1,mode:'bot',status:'active',side:0,state:JSON.parse(JSON.stringify(state))});
 await d.secure.bot(spec,1);clearInterval(d.secure.SEC.timer);d.S.busy=true;d.S.modal=null;d.render();
 await new Promise(r=>setTimeout(r,1500));d.fx.state.flash=0;d.fx.state.ps=[];
 d.ui.settingsOpen=true;d.render();w.document.querySelector('[data-a="setfx"][data-v="full"]').click();d.ui.settingsOpen=false;d.render();
 for(const deck of [...d.DECKS].sort((a,b)=>a.no-b.no)){const o=document.createElement('option');o.value=deck.legend;o.textContent=(deck.no<=13?'ຂອງເກົ່າ · ':'ຂອງໃໝ່ · ')+'ເດັກ '+deck.no+' · '+deck.name;select.appendChild(o);}
 ready=true;note.textContent='ສາກທົດລອງ · ບໍ່ຮັບລາງວັນ';play();
 }catch(e){note.textContent='ເປີດບໍ່ໄດ້: '+e.message;}
});
async function play(){
 if(!ready||running)return;if(held){held.remove();held=null;}running=true;const token=version;
 try{await frame.contentWindow.__dbg.fx.show(select.value);}finally{running=false;if(loop&&token===version)setTimeout(()=>{if(loop&&token===version)play();},700);}
}
function skip(){const w=frame.contentWindow;w.document.dispatchEvent(new w.Event('pointerdown',{bubbles:true,cancelable:true}));}
select.addEventListener('change',()=>{version++;const token=version;skip();setTimeout(()=>{if(token===version)play();},50);});
document.getElementById('play').onclick=()=>{version++;const token=version;skip();setTimeout(()=>{if(token===version)play();},50);};
document.getElementById('loop').onclick=e=>{loop=!loop;e.target.textContent='ຫຼິ້ນຊ້ຳ: '+(loop?'ເປີດ':'ປິດ');e.target.classList.toggle('on',loop);if(loop)play();};
frame.src='../';

document.getElementById('hold').onclick=async()=>{
 if(!ready)return;loop=false;version++;document.getElementById('loop').textContent='ຫຼິ້ນຊ້ຳ: ປິດ';document.getElementById('loop').classList.remove('on');skip();
 while(running)await new Promise(r=>setTimeout(r,0));if(held)held.remove();
 frame.contentWindow.__dbg.fx.state.ps=[];frame.contentWindow.__dbg.fx.state.flash=0;
 const w=frame.contentWindow,promise=w.__dbg.fx.show(select.value),original=w.document.querySelector('.show');
 if(!original)return;
 for(const a of original.getAnimations({subtree:true})){a.pause();a.currentTime=1100;}
 const clone=original.cloneNode(true),src=[original,...original.querySelectorAll('*')],dest=[clone,...clone.querySelectorAll('*')];
 for(let i=0;i<src.length;i++){const c=w.getComputedStyle(src[i]);for(const p of ['transform','opacity','filter','stroke-dashoffset'])dest[i].style.setProperty(p,c.getPropertyValue(p));dest[i].style.animation='none';}
 clone.style.opacity='1';skip();await promise;held=clone;w.document.getElementById('fx').appendChild(clone);note.textContent='ຮູບຄ້າງ · ກົດ ເບິ່ງອີກ ເພື່ອຫຼິ້ນສາກ';
};
