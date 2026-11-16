/* Standalone teaching scenarios. This is not the Lao Legend Wars engine or a full OPTCG simulator.
 * Source/verification notes: design/onepiece-lao-trial.md. No account or game economy access.
 */
(() => {
  'use strict';
  const official = 'https://en.onepiece-cardgame.com/';
  const cards = [
    {id:'ST01-001',name:'Monkey D. Luffy',lo:'ລູຟີ',type:'leader',power:5000,life:5,tags:['Activate: Main','Once Per Turn'],when:'ໃນຊ່ວງຫຼັກຂອງຕາເຈົ້າ · ໃຊ້ໄດ້ 1 ຄັ້ງຕໍ່ຕາ',effect:'ເອົາ DON!! ທີ່ນອນຢູ່ໄດ້ສູງສຸດ 1 ໃບ ໄປຕິດໃຫ້ຜູ້ນຳ ຫຼືຕົວລະຄອນຂອງເຈົ້າ.',tip:'ໃຊ້ DON!! ທີ່ຈ່າຍໄປແລ້ວ ມາຊ່ວຍເພີ່ມພະລັງ. ຍ້າຍ DON!! ຈາກຕົວອື່ນມາບໍ່ໄດ້.',lesson:'rested'},
    {id:'OP01-001',name:'Roronoa Zoro',lo:'ໂຊໂລ',type:'leader',power:5000,life:5,tags:['DON!! ×1','Your Turn'],when:'ໃນຕາເຈົ້າ · ຕິດ DON!! ໃຫ້ໃບນີ້ຢ່າງໜ້ອຍ 1 ໃບ',effect:'ຕົວລະຄອນຂອງເຈົ້າທຸກໃບ ໄດ້ພະລັງເພີ່ມ 1,000.',tip:'ຕິດ DON!! 2 ໃບ ກໍເພີ່ມໃຫ້ທີມພຽງ 1,000. ຕົວທີ່ລົງຕາມຫຼັງກໍໄດ້ຜົນນີ້.',lesson:'team'},
    {id:'ST01-012',name:'Monkey D. Luffy',lo:'ລູຟີ · ໂຈມຕີທັນທີ',type:'character',cost:5,power:6000,tags:['Rush','DON!! ×2','When Attacking'],when:'Rush ໃຊ້ໄດ້ທັນທີ · ຜົນຂ້າມ Blocker ຕ້ອງຕິດ DON!! 2 ໃບ',effect:'ໂຈມຕີໄດ້ໃນຕາທີ່ລົງມາ. ຖ້າຕິດ DON!! ຢ່າງໜ້ອຍ 2 ໃບ ເວລາໂຈມຕີ ຄູ່ແຂ່ງໃຊ້ Blocker ໃນການຕໍ່ສູ້ນັ້ນບໍ່ໄດ້.',tip:'ຜົນຂ້າມ Blocker ນີ້ ບໍ່ໄດ້ໃຊ້ຕໍ່ໃຫ້ການໂຈມຕີຂອງຕົວອື່ນ.',lesson:'rush'},
    {id:'ST01-013',name:'Roronoa Zoro',lo:'ໂຊໂລ · ສາມດາບ',type:'character',cost:3,power:5000,tags:['DON!! ×1'],when:'ຂະນະທີ່ຕິດ DON!! ຢ່າງໜ້ອຍ 1 ໃບ',effect:'ກາດໃບນີ້ໄດ້ພະລັງເພີ່ມ 1,000.',tip:'ຜົນຄວາມສາມາດ +1,000 ຍັງມີໃນຕາຄູ່ແຂ່ງ. ສ່ວນ +1,000 ປົກກະຕິຈາກ DON!! ມີສະເພາະຕາເຈົ້າ.',lesson:'sword'},
    {id:'ST01-004',name:'Sanji',lo:'ຊັນຈິ',type:'character',cost:2,power:4000,tags:['DON!! ×2','Rush'],when:'ຕິດ DON!! ໃຫ້ໃບນີ້ຢ່າງໜ້ອຍ 2 ໃບ',effect:'ໄດ້ Rush: ໂຈມຕີໄດ້ໃນຕາທີ່ລົງມາ.',tip:'ຖ້າກາດນອນຢູ່ ກໍໂຈມຕີບໍ່ໄດ້ ເຖິງວ່າຈະມີ Rush.',lesson:'sanji'},
    {id:'ST01-006',name:'Tony Tony Chopper',lo:'ຊັອບເປີ',type:'character',cost:1,power:1000,tags:['Blocker'],when:'ຫຼັງຄູ່ແຂ່ງປະກາດໂຈມຕີ',effect:'ເລືອກວາງໃບນີ້ຈາກຕັ້ງເປັນນອນ ເພື່ອໃຫ້ມັນຮັບການໂຈມຕີແທນເປົ້າໝາຍເດີມ.',tip:'ກາດທີ່ນອນຢູ່ແລ້ວ ໃຊ້ Blocker ບໍ່ໄດ້.',lesson:'block'},
    {id:'ST01-007',name:'Nami',lo:'ນາມິ',type:'character',cost:1,power:1000,counter:1000,tags:['Activate: Main','Once Per Turn'],when:'ໃນຊ່ວງຫຼັກຂອງຕາເຈົ້າ · 1 ຄັ້ງຕໍ່ຕາ',effect:'ເອົາ DON!! ທີ່ນອນຢູ່ໄດ້ສູງສຸດ 1 ໃບ ໄປຕິດໃຫ້ຜູ້ນຳ ຫຼືຕົວລະຄອນຂອງເຈົ້າ.',tip:'ເລືອກຕິດໃຫ້ນາມິເອງກໍໄດ້.',lesson:'rested'},
    {id:'ST01-014',name:'Guard Point',lo:'ກາດປ້ອງກັນ',type:'event',cost:1,tags:['Counter','Trigger'],when:'ຈັງຫວະ Counter ຂອງການຕໍ່ສູ້',effect:'ເລືອກຜູ້ນຳ ຫຼືຕົວລະຄອນຂອງເຈົ້າໄດ້ສູງສຸດ 1 ໃບ ໃຫ້ໄດ້ພະລັງ +3,000 ໃນການຕໍ່ສູ້ນີ້.',trigger:'ເລືອກຜູ້ນຳ ຫຼືຕົວລະຄອນຂອງເຈົ້າໄດ້ສູງສຸດ 1 ໃບ ໃຫ້ໄດ້ພະລັງ +1,000 ຈົນຈົບຕາ.',tip:'Counter ຈາກມືຕ້ອງຈ່າຍ 1 DON!!. ຜົນ +3,000 ຈົບພ້ອມການຕໍ່ສູ້.',lesson:'counter'},
    {id:'ST01-015',name:'Gum-Gum Jet Pistol',lo:'ໝັດຢາງ Jet Pistol',type:'event',cost:4,tags:['Main','Trigger','K.O.'],when:'ໃນຊ່ວງຫຼັກຂອງຕາເຈົ້າ',effect:'ເລືອກຕົວລະຄອນຄູ່ແຂ່ງທີ່ມີພະລັງ 6,000 ຫຼືຕ່ຳກວ່າໄດ້ສູງສຸດ 1 ໃບ ໃຫ້ອອກຈາກສະໜາມ (K.O.).',trigger:'ໃຊ້ຜົນ Main ຂອງກາດນີ້.',tip:'ນັບພະລັງປັດຈຸບັນ. ຖ້າຖືກເພີ່ມເປັນ 7,000 ຈະເລືອກເປັນເປົ້າໝາຍບໍ່ໄດ້.',lesson:'ko'}
  ];
  const byId = Object.fromEntries(cards.map(c=>[c.id,c]));
  function unit(id,don=0){return {id,don,rested:false,out:false};}
  function initial(id){
    const c=byId[id]; if(!c) throw new Error('Unknown lesson');
    const s={id,kind:c.lesson,own:true,active:2,rested:0,used:false,played:true,resolved:false,counter:false,trigger:false,finished:false,enemyLife:5,life:5,trash:0,target:'leader',enemyBuff:false,message:'ເລືອກປຸ່ມດ້ານລຸ່ມ ເພື່ອລອງໃຊ້ກາດ.',log:[],leader:unit('ST01-001'),ally:unit('ST01-013'),enemy:unit('ST01-012'),enemyLeader:unit('ST01-001'),blocker:unit('ST01-006')};
    if(c.type==='leader')s.leader=unit(id);
    if(c.type==='character')s.ally=unit(id);
    if(s.kind==='rested'){s.active=0;s.rested=1;s.message='ມີ DON!! ນອນ 1 ໃບ. ລອງເອົາມາຕິດໃຫ້ກາດ.';}
    if(s.kind==='rush'||s.kind==='sanji'){s.active=c.cost+2;s.played=false;s.message='ກາດຍັງຢູ່ໃນມື. ຈ່າຍ DON!! ເພື່ອລົງສະໜາມກ່ອນ.';}
    if(s.kind==='counter'){s.own=false;s.active=1;s.message='ຄູ່ແຂ່ງໂຈມຕີ 6,000 ໃສ່ຜູ້ນຳ 5,000. ນີ້ແມ່ນຈັງຫວະ Counter.';}
    if(s.kind==='block'){s.own=false;s.active=0;s.message='ຄູ່ແຂ່ງໂຈມຕີຜູ້ນຳ. ເຈົ້າມີຊັອບເປີທີ່ຍັງຕັ້ງຢູ່.';}
    if(s.kind==='ko'){s.active=4;s.message='ລອງເລືອກຕົວທີ່ມີພະລັງ 6,000. ປ່ຽນພະລັງເປັນ 7,000 ເພື່ອທຽບເບິ່ງໄດ້.';}
    return s;
  }
  function power(s,key){
    const u=s[key],base=byId[u.id].power||0;
    if(u.out)return 0;
    const ours=key==='leader'||key==='ally';
    let p=base+((ours?s.own:!s.own)?u.don*1000:0);
    if(u.id==='ST01-013'&&u.don>=1)p+=1000;
    if(key==='ally'&&s.leader.id==='OP01-001'&&s.leader.don>=1&&s.own)p+=1000;
    if(key==='leader'&&s.counter&&!s.resolved)p+=3000;
    if(key==='leader'&&s.trigger&&s.kind==='counter'&&!s.finished)p+=1000;
    if(key==='enemy'&&s.enemyBuff)p+=1000;
    return p;
  }
  function can(s,a){
    if(a==='target-leader'||a==='target-ally')return s.kind==='rested'&&!s.used;
    if(a==='attach')return s.own&&s.active>0&&!s.resolved&&(s.kind==='team'||s.kind==='sword'||((s.kind==='rush'||s.kind==='sanji')&&s.played))&&(s.kind==='team'?s.leader:s.ally).don<2;
    if(a==='skill')return s.kind==='rested'&&s.own&&!s.used&&s.rested>0;
    if(a==='play')return (s.kind==='rush'||s.kind==='sanji')&&!s.played&&s.active>=byId[s.id].cost;
    if(a==='attack')return (s.kind==='rush'||s.kind==='sanji')&&s.own&&s.played&&!s.ally.rested&&!s.resolved&&(s.kind==='rush'||s.ally.don>=2);
    if(a==='turn')return (s.kind==='team'||s.kind==='sword')&&s.own;
    if(a==='block')return s.kind==='block'&&!s.ally.rested&&!s.ally.out&&!s.resolved;
    if(a==='counter')return s.kind==='counter'&&!s.counter&&!s.trigger&&!s.resolved&&s.active>=1;
    if(a==='resolve')return (s.kind==='counter'||s.kind==='block')&&!s.resolved;
    if(a==='trigger')return (s.kind==='counter'||s.kind==='ko')&&!s.used&&!s.counter&&!s.resolved;
    if(a==='finish')return s.kind==='counter'&&s.trigger&&!s.finished;
    if(a==='buff')return s.kind==='ko'&&!s.resolved&&!s.used;
    if(a==='ko')return s.kind==='ko'&&!s.resolved&&!s.used&&s.active>=4&&power(s,'enemy')<=6000;
    return false;
  }
  // Pure transition: rejected actions preserve the entire state, including resources.
  function act(state,action){
    if(!can(state,action))return {state,changed:false,effect:null};
    const s=JSON.parse(JSON.stringify(state));let effect='buff',key='ally';
    if(action.startsWith('target-')){s.target=action.slice(7);return {state:s,changed:true,effect:null};}
    if(action==='attach'){
      key=s.kind==='team'?'leader':'ally';s.active--;s[key].don++;
      s.message=s.kind==='team'?'ຜູ້ນຳໄດ້ພະລັງຈາກ DON!!. ຕົວລະຄອນໄດ້ +1,000 ຈາກຄວາມສາມາດໂຊໂລ.':s.kind==='sword'?'ໂຊໂລໄດ້ທັງພະລັງຈາກ DON!! ແລະຈາກຄວາມສາມາດຂອງຕົນ.':s.ally.don>=2?'ຕິດ DON!! ຄົບ 2 ໃບແລ້ວ. ລອງໂຈມຕີເບິ່ງ.':'ຕິດແລ້ວ 1 DON!!. ລອງຕິດອີກ 1 ໃບ.';
    }
    if(action==='skill'){key=s.target;s.rested--;s[key].don++;s.used=true;s.message='ເອົາ DON!! ທີ່ນອນມາຕິດແລ້ວ. ໃນຕານີ້ໃຊ້ຄວາມສາມາດນີ້ຊ້ຳບໍ່ໄດ້.';}
    if(action==='play'){const n=byId[s.id].cost;s.active-=n;s.rested+=n;s.played=true;effect='enter';s.message=s.kind==='rush'?'ລູຟີມີ Rush ຢູ່ແລ້ວ. ຈະໂຈມຕີເລີຍ ຫຼືຕິດ 2 DON!! ເພື່ອຂ້າມ Blocker ກໍໄດ້.':'ຊັນຈິລົງແລ້ວ. ຕ້ອງຕິດ 2 DON!! ເພື່ອໃຊ້ Rush ໃນຕານີ້.';}
    if(action==='attack'){
      s.ally.rested=true;s.resolved=true;effect='attack';key='enemyLeader';
      if(s.kind==='rush'&&s.ally.don<2){s.blocker.rested=true;s.blocker.out=true;key='blocker';s.trash++;s.message='ຊັອບເປີຮັບແທນ ແລະ K.O. ຜູ້ນຳຄູ່ແຂ່ງບໍ່ເສຍຊີວິດ. ລອງໃໝ່ແລ້ວຕິດ 2 DON!! ເບິ່ງ.';}
      else{s.enemyLife--;s.message=s.kind==='rush'?'ຄູ່ແຂ່ງໃຊ້ Blocker ບໍ່ໄດ້. ໃນບົດຝຶກນີ້ຄູ່ແຂ່ງບໍ່ໃຊ້ Counter ແລະເສຍຊີວິດ 1 ໃບ.':'ຊັນຈິໃຊ້ Rush ໂຈມຕີໄດ້ໃນຕາທີ່ລົງ. ໃນບົດຝຶກນີ້ຄູ່ແຂ່ງບໍ່ໃຊ້ Counter ແລະເສຍຊີວິດ 1 ໃບ.';}
    }
    if(action==='turn'){s.own=false;effect=null;s.message=s.kind==='team'?'ເຖິງຕາຄູ່ແຂ່ງ: ຜົນເພີ່ມພະລັງໃຫ້ທີມຂອງໂຊໂລຢຸດແລ້ວ.':'ເຖິງຕາຄູ່ແຂ່ງ: +1,000 ຈາກ DON!! ປົກກະຕິຢຸດ. ແຕ່ +1,000 ຈາກຄວາມສາມາດຍັງຢູ່.';}
    if(action==='block'){s.ally.rested=true;s.ally.out=true;s.resolved=true;s.trash++;effect='shield';s.message='ຊັອບເປີຮັບແທນ ແລະ K.O. ຜູ້ນຳຂອງເຈົ້າບໍ່ເສຍຊີວິດ.';}
    if(action==='counter'){s.active--;s.rested++;s.counter=true;s.trash++;key='leader';effect='shield';s.message='ຈ່າຍ 1 DON!! ແລ້ວ. ຜູ້ນຳ 5,000 + 3,000 = 8,000 ສຳລັບການຕໍ່ສູ້ນີ້.';}
    if(action==='resolve'){const defended=s.counter;s.resolved=true;key='leader';effect=defended?'shield':'attack';if(!defended)s.life--;s.message=defended?'8,000 ສູງກວ່າ 6,000 ຈຶ່ງປ້ອງກັນໄດ້. ຈົບການຕໍ່ສູ້ແລ້ວ +3,000 ຈະຫາຍໄປ.':'ບໍ່ໄດ້ປ້ອງກັນ. ຜູ້ນຳເສຍຊີວິດ 1 ໃບ.';}
    if(action==='trigger'){
      s.trigger=true;s.used=true;s.trash++;key=s.kind==='ko'?'enemy':'leader';effect=s.kind==='ko'?'slash':'buff';
      if(s.kind==='counter'){s.resolved=true;s.life--;s.message='ຮັບຄວາມເສຍຫາຍ ເປີດ Guard Point ຈາກຊີວິດ ແລ້ວເລືອກ Trigger. ຜູ້ນຳໄດ້ +1,000 ຈົນຈົບຕາ ໂດຍບໍ່ຈ່າຍ DON!!.';}
      else {s.life--;s.resolved=true;if(power(s,'enemy')<=6000){s.enemy.out=true;s.trash++;s.message='ເປີດ Jet Pistol ຈາກຊີວິດ ແລ້ວໃຊ້ Trigger. ຕົວ 6,000 K.O. ໂດຍບໍ່ຈ່າຍ 4 DON!!.';}else{s.message='ເປີດ Trigger ໄດ້ ແຕ່ຕົວ 7,000 ເປັນເປົ້າໝາຍບໍ່ໄດ້. ກາດໄປກອງຖິ້ມ ແລະບໍ່ມີຕົວ K.O.';effect=null;}}
    }
    if(action==='finish'){s.finished=true;effect=null;s.message='ຈົບຕາແລ້ວ. ພະລັງ +1,000 ຈາກ Trigger ຫາຍໄປ.';}
    if(action==='buff'){s.enemyBuff=!s.enemyBuff;key='enemy';s.message=s.enemyBuff?'ພະລັງປັດຈຸບັນເປັນ 7,000. Jet Pistol ເລືອກຕົວນີ້ບໍ່ໄດ້.':'ພະລັງກັບມາ 6,000. Jet Pistol ເລືອກຕົວນີ້ໄດ້.';}
    if(action==='ko'){s.active-=4;s.rested+=4;s.enemy.out=true;s.resolved=true;s.used=true;s.trash+=2;key='enemy';effect='slash';s.message='ຈ່າຍ 4 DON!!. ຕົວລະຄອນ 6,000 ອອກຈາກສະໜາມ. ກາດເຫດການໄປກອງຖິ້ມ.';}
    s.log.push(s.message);return {state:s,changed:true,effect,key};
  }
  window.OPLesson=Object.freeze({cards,byId,initial,power,can,act,image:id=>'cards/'+id+'.png',source:id=>official+'cardlist/?series='+(id.startsWith('OP01')?'569101':'569001')});
})();
