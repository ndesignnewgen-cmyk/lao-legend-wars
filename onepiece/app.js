(() => {
  'use strict';
  const E=window.OPLesson,$=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected='OP01-001',filter='all',query='',state=E.initial(selected),busy=false;
  const reducedMedia=matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=reducedMedia.matches;
  let prefs={muted:false,volume:.55};
  try{const saved=JSON.parse(localStorage.getItem('op-trial-sound-v1'));if(saved&&typeof saved.muted==='boolean')prefs.muted=saved.muted;if(saved&&Number.isFinite(saved.volume))prefs.volume=Math.max(0,Math.min(1,saved.volume));}catch(_){}
  const audio=window.OPAudio.create(prefs);
  const saveSound=()=>{try{localStorage.setItem('op-trial-sound-v1',JSON.stringify({muted:audio.muted,volume:audio.volume}));}catch(_){}};
  // Safari audio starts from a real tap or key press, never from page loading.
  document.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
  document.addEventListener('keydown',()=>audio.unlock(),{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.suspend();});
  window.addEventListener('pagehide',()=>audio.suspend());
  for(const file of ['target-ring','dust-ring','blade-silver-arc','beam-slash','drum-shield','blade-twin-arc','sparks','rays']){const img=new Image();img.src='../art/fx/'+file+'.webp';}

  const typeNames={leader:'ຜູ້ນຳ',character:'ຕົວລະຄອນ',event:'ເຫດການ'};
  const names={team:'ຕິດ DON!! ແລ້ວເພີ່ມພະລັງໃຫ້ທີມ',sword:'ພະລັງຂອງໂຊໂລໃນສອງຕາ',rested:'ໃຊ້ DON!! ທີ່ຈ່າຍໄປແລ້ວ',rush:'Rush ແລະການຂ້າມ Blocker',sanji:'ຕິດ DON!! ໃຫ້ຄົບ ແລ້ວໃຊ້ Rush',block:'ເອົາຊັອບເປີມາຮັບແທນ',counter:'ປ້ອງກັນດ້ວຍ Counter',ko:'ເລືອກເປົ້າໝາຍຈາກພະລັງປັດຈຸບັນ'};
  const fmt=n=>n==null?'—':n.toLocaleString('en-US');
  function image(id,cls=''){const c=E.byId[id];return `<img class="${cls}" src="${E.image(id)}" alt="${esc(c.name+' '+id)}" loading="lazy" referrerpolicy="no-referrer"><div class="image-error" hidden><b>☸</b><span>${esc(c.name)}</span><span>${id}<br>ຮູບກາດໂຫຼດບໍ່ໄດ້</span></div>`;}
  // Capture image failures without inline handlers; keep real card text separate from the image.
  document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.hidden=true;const fallback=e.target.nextElementSibling;if(fallback?.classList.contains('image-error'))fallback.hidden=false;}},true);
  function catalog(){
    $('#filters').innerHTML=Object.entries({all:'ທັງໝົດ',...typeNames}).map(([id,label])=>`<button data-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('');
    const q=query.trim().toLocaleLowerCase();const list=E.cards.filter(c=>(filter==='all'||c.type===filter)&&[c.id,c.name,c.lo,c.effect,...c.tags].join(' ').toLocaleLowerCase().includes(q));
    $('#count').textContent=list.length+' / '+E.cards.length+' ໃບ';
    $('#cards').innerHTML=list.map(c=>`<button class="catalog-card" data-card="${c.id}" aria-pressed="${selected===c.id}" aria-label="${esc(c.lo+' '+c.id)}"><div class="card-art">${image(c.id)}</div><strong>${c.lo}</strong><small>${c.id} · ${typeNames[c.type]}</small></button>`).join('')||'<p class="empty">ບໍ່ພົບກາດ · ລອງຄົ້ນຊື່ ຫຼືລະຫັດອື່ນ</p>';
  }
  function inspect(){
    const c=E.byId[selected];
    $('#inspector').innerHTML=`<p class="eyebrow">ຮູບເດີມ · ອະທິບາຍພາສາລາວ</p><div class="selected-header"><div><span class="code">${c.id} / ${typeNames[c.type]}</span><h3>${c.lo}</h3><span class="count">${esc(c.name)}</span></div></div><div class="preview-art">${image(c.id)}</div><div class="stats"><div><small>${c.type==='leader'?'ຊີວິດ':'ຄ່າລົງ'}</small><b>${c.life??c.cost}</b></div><div><small>ພະລັງ</small><b>${fmt(c.power)}</b></div><div><small>Counter</small><b>${fmt(c.counter)}</b></div></div><div class="tags">${c.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="explanation"><p><b>ໃຊ້ຕອນໃດ?</b>${c.when}</p><p><b>ໃບນີ້ເຮັດຫຍັງ?</b>${c.effect}</p>${c.trigger?`<p><b>ຖ້າເປີດໄດ້ຈາກຊີວິດ · Trigger</b>${c.trigger}</p>`:''}<p><b>ຈື່ຈຸດນີ້ໄວ້</b>${c.tip}</p></div><a href="#practice" class="primary">ລອງໃຊ້ໃບນີ້ <span>↗</span></a><a class="source" href="${E.source(c.id)}" target="_blank" rel="noopener noreferrer">ເບິ່ງກາດຈາກ Bandai ↗</a>`;
  }
  function unit(key,label){
    const u=state[key],c=E.byId[u.id];
    return `<div id="unit-${key}" class="unit${u.rested?' rested':''}${u.out?' out':''}"><div class="unit-art">${image(u.id)}</div>${u.don?`<span class="don-badge">DON!! ×${u.don}</span>`:''}<span class="unit-power">${fmt(E.power(state,key))}</span><small>${label||c.lo}${u.rested?' · ນອນ':''}</small></div>`;
  }
  function button(a,label,primary=false){return `<button data-action="${a}" class="${primary?'primary':'quiet'}" ${E.can(state,a)?'':'disabled'}>${label}</button>`;}
  function actions(){
    const k=state.kind;
    if(k==='team'||k==='sword')return button('attach','ຕິດ 1 DON!!',true)+button('turn','ເບິ່ງໃນຕາຄູ່ແຂ່ງ');
    if(k==='rested')return `<div class="target-choice">${['leader','ally'].map(t=>`<button data-action="target-${t}" aria-pressed="${state.target===t}" ${state.used?'disabled':''}>${t==='leader'?'ເລືອກຜູ້ນຳ':'ເລືອກຕົວລະຄອນ'}</button>`).join('')}</div>`+button('skill','ໃຊ້ຄວາມສາມາດ',true);
    if(k==='rush'||k==='sanji')return button('play',`ຈ່າຍ ${E.byId[selected].cost} DON!! · ລົງກາດ`,true)+button('attach','ຕິດ 1 DON!!')+button('attack','ໂຈມຕີຜູ້ນຳ');
    if(k==='block')return button('block','ໃຊ້ Blocker ຮັບແທນ',true)+button('resolve','ບໍ່ປ້ອງກັນ');
    if(k==='counter')return button('counter','ຈ່າຍ 1 DON!! · Counter',true)+button('resolve','ຕັດສິນການຕໍ່ສູ້')+button('trigger','ລອງເປີດຈາກຊີວິດ')+button('finish','ຈົບຕາຂອງ Trigger');
    if(k==='ko')return button('ko','ຈ່າຍ 4 DON!! · K.O.',true)+button('buff',state.enemyBuff?'ປ່ຽນເປົ້າໝາຍເປັນ 6,000':'ປ່ຽນເປົ້າໝາຍເປັນ 7,000')+button('trigger','ລອງເປີດຈາກຊີວິດ');
    return '';
  }
  function lesson(){
    const attacking=['rush','sanji'].includes(state.kind),defending=['block','counter'].includes(state.kind),ko=state.kind==='ko';
    const enemy=ko?unit('enemy','ເປົ້າໝາຍ · ຕົວລະຄອນ'):defending?unit('enemy','ກຳລັງໂຈມຕີ · 6,000'):unit('enemyLeader','ຜູ້ນຳຄູ່ແຂ່ງ')+(state.kind==='rush'?unit('blocker','Blocker · ຮັບແທນ'):'');
    $('#lesson').innerHTML=`<div class="training"><div class="board"><div class="side-label"><span>ຝ່າຍຄູ່ແຂ່ງ${attacking?' · ບົດຝຶກນີ້ບໍ່ໃຊ້ Counter':''}</span><span class="life" aria-label="ຊີວິດຄູ່ແຂ່ງ ${state.enemyLife}">${'◆'.repeat(state.enemyLife)}${'◇'.repeat(5-state.enemyLife)}</span></div><div class="board-row">${enemy}</div><div class="board-divider">${state.own?'ຕາຂອງເຈົ້າ':'ຕາຂອງຄູ່ແຂ່ງ'}</div><div class="board-row">${unit('leader','ຜູ້ນຳຂອງເຈົ້າ')}${state.played?unit('ally','ຕົວລະຄອນຂອງເຈົ້າ'):`<div class="unit"><div class="unit-art">${image(selected)}</div><small>ກາດຢູ່ໃນມື · ຍັງບໍ່ໄດ້ລົງ</small></div>`}</div><div class="side-label"><span>ຝ່າຍເຈົ້າ</span><span class="life" aria-label="ຊີວິດຂອງເຈົ້າ ${state.life}">${'◆'.repeat(state.life)}${'◇'.repeat(5-state.life)}</span></div><div class="resource-bar"><span>DON!! ຕັ້ງ <b>${state.active}</b></span><span>DON!! ນອນ <b>${state.rested}</b></span><span>ກອງຖິ້ມ <b>${state.trash}</b></span></div></div><div class="coach"><div><span class="step">${selected} · ບົດຝຶກສັ້ນ</span><h3>${names[state.kind]}</h3></div><p>ທົດລອງຈາກສະຖານະທີ່ກຳນົດໄວ້. ກົດ “ລອງໃໝ່” ເພື່ອທຽບຜົນ.</p><div class="lesson-actions">${actions()}</div><div class="feedback ${state.log.length?'success':''}" role="status" aria-live="polite">${state.message}</div><div class="lesson-log"><span>ສິ່ງທີ່ລອງແລ້ວ · ${state.log.length}</span>${state.log.slice(-2).map(t=>`<p>· ${t}</p>`).join('')}</div></div></div>`;
  }
  // Adapted from index.html fxRing/fxLunge: local sprites and WAAPI, no page overlays or shaking.
  function at(key){const el=$('#unit-'+key);if(!el)return null;const r=el.getBoundingClientRect();return {el,x:r.left+r.width/2,y:r.top+r.height/2};}
  function animate(el,frames,options){const a=el.animate(frames,options);return a.finished.catch(()=>{}).finally(()=>{a.cancel();if(el.classList.contains('fx-sprite')||el.classList.contains('fx-float'))el.remove();});}
  function sprite(file,p,size=140){const el=new Image();el.className='fx-sprite';el.src='../art/fx/'+file+'.webp';el.alt='';el.style.cssText=`left:${p.x-size/2}px;top:${p.y-size/2}px;width:${size}px;height:${size}px`;$('#effects').append(el);return el;}
  async function fx(kind,key,changes){
    if(reduced||!kind)return;
    const p=at(key);if(!p)return;
    const tasks=[];
    const burst=(file,point,size=160,ms=650)=>animate(sprite(file,point,size),[{opacity:0,transform:'scale(.35) rotate(-22deg)'},{opacity:1,transform:'scale(1.05) rotate(0deg)',offset:.35},{opacity:0,transform:'scale(1.35) rotate(15deg)'}],{duration:ms,easing:'ease-out'});
    if(kind==='attack'){
      const a=at(key==='leader'?'enemy':'ally');if(a){const dx=(p.x-a.x)*.55,dy=(p.y-a.y)*.55;tasks.push(animate(a.el,[{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px) scale(1.08)`,offset:.45},{transform:'translate(0,0)'}],{duration:620,easing:'ease-in-out'}));}
      await new Promise(r=>setTimeout(r,240));
      tasks.push(burst('beam-slash',p,190,500),burst('sparks',p,140,450));
    }else{
      const file=kind==='shield'?'drum-shield':kind==='slash'?'blade-silver-arc':kind==='enter'?'dust-ring':state.kind==='sword'?'blade-twin-arc':'target-ring';
      tasks.push(burst(file,p,kind==='slash'?210:160));
      if(kind==='enter')tasks.push(burst('rays',p,225,700));
      if(kind==='slash')tasks.push(burst('sparks',p,170,550));
    }
    if(kind==='buff'||kind==='shield')for(const [target,delta] of changes){
      const point=at(target);if(!point||!delta)continue;
      const n=document.createElement('span');n.className='fx-float';n.textContent=(delta>0?'+':'')+fmt(delta);n.style.left=point.x+'px';n.style.top=point.y+'px';$('#effects').append(n);
      tasks.push(animate(n,[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 -10px',offset:.3},{opacity:0,translate:'0 -60px'}],{duration:850}));
      if(target!==key)tasks.push(burst('target-ring',point,125,550));
    }
    await Promise.all(tasks);
  }
  function select(id){if(busy||!E.byId[id])return;selected=id;state=E.initial(id);catalog();inspect();lesson();}
  $('#search').addEventListener('input',e=>{query=e.target.value;catalog();});
  $('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;catalog();}});
  $('#cards').addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(b){if(!busy){audio.stop();audio.cue('select');}select(b.dataset.card);if(matchMedia('(max-width:760px)').matches)$('#inspector').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}});
  $('#reset').addEventListener('click',()=>{if(!busy){audio.stop();audio.cue('reset');state=E.initial(selected);lesson();}});
  $('#lesson').addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b||busy||b.disabled)return;
    const result=E.act(state,b.dataset.action);if(!result.changed)return;
    const changes=['leader','ally','enemy','enemyLeader','blocker'].map(k=>[k,E.power(result.state,k)-E.power(state,k)]).filter(([,n])=>n);audio.cue(b.dataset.action,{id:selected,kind:state.kind,effect:result.effect});busy=true;$('#reset').disabled=true;state=result.state;lesson();$('#lesson').querySelectorAll('button').forEach(x=>x.disabled=true);
    try{await fx(result.effect,result.key,changes);}finally{busy=false;$('#reset').disabled=false;lesson();}
  });
  function motion(){document.body.classList.toggle('reduced',reduced);$('#motion').setAttribute('aria-pressed',String(reduced));}
  $('#motion').addEventListener('click',()=>{reduced=!reduced;motion();});
  reducedMedia.addEventListener('change',e=>{reduced=e.matches;motion();});
  function soundControls(){
    $('#sound').textContent=audio.muted?'ສຽງ: ປິດ':'ສຽງ: ເປີດ';$('#sound').setAttribute('aria-pressed',String(!audio.muted));
    $('#volume').value=Math.round(audio.volume*100);$('#volume-value').value=Math.round(audio.volume*100)+'%';
    $('#volume').setAttribute('aria-valuetext',Math.round(audio.volume*100)+'%');$('#sound-test').disabled=audio.muted||audio.volume===0;
  }
  $('#sound').addEventListener('click',()=>{audio.setMuted(!audio.muted);audio.unlock();if(!audio.muted)audio.play('click');saveSound();soundControls();});
  $('#volume').addEventListener('input',e=>{audio.setVolume(Number(e.target.value)/100);saveSound();soundControls();});
  $('#volume').addEventListener('change',()=>{audio.unlock();audio.play('click');});
  $('#sound-test').addEventListener('click',()=>{audio.unlock();audio.cue('attack',{id:selected});});
  soundControls();motion();catalog();inspect();lesson();
  if(['localhost','127.0.0.1'].includes(location.hostname))window.__opTrial={select,audio,get state(){return state;},get busy(){return busy;}};
})();
