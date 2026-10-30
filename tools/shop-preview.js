// An isolated localhost origin keeps demo balances away from the owner's real local save.
if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error('Local preview only');
if(location.port!=='8124'){location.replace('http://localhost:8124/tools/shop-preview.html');throw Error('Use the isolated demo port 8124');}
const frame=document.getElementById('game');let model,eco,d;
const products=[{id:'back-naga',kind:'back',price:100,contents:['back-naga']},{id:'back-sinh',kind:'back',price:150,contents:['back-sinh']},{id:'back-stars',kind:'back',price:200,contents:['back-stars']},{id:'arena-meteor',kind:'arena',price:800,contents:['arena-meteor']},{id:'legend-set',kind:'bundle',price:1000,contents:['back-naga','back-sinh','back-stars','arena-meteor']}];
function state(){const p=structuredClone(model);p.products=products.map(x=>({...x,payPrice:Math.ceil(x.price*x.contents.reduce((n,id)=>n+(p.owned.includes(id)?0:products.find(x=>x.id===id).price),0)/x.contents.reduce((n,id)=>n+products.find(x=>x.id===id).price,0))}));return p;}
let retry=new Map();
async function rpc(name,a={}){
 await new Promise(r=>setTimeout(r,130));let data,error;const st=()=>({premium:state()});
 if(name==='premium_state')data=state();
 else if(name==='premium_admin')data={config:{enabled:false,receiver:'',qr_path:''},orders:model.orders.map(o=>({...o,name:'ຜູ້ທົດລອງ'}))};
 else if(name==='premium_exchange'){
  if(!retry.has(a.request_key)){if(model.balance<a.amount)error={code:'P0004'};else{model.balance-=a.amount;eco.gems+=a.amount*5;model.ledger.unshift({kind:'exchange',special_delta:-a.amount,gem_delta:a.amount*5,created_at:new Date().toISOString()});retry.set(a.request_key,true);}}
  if(!error)data={...st(),state:structuredClone(eco)};
 }else if(name==='premium_buy'){
  if(!retry.has(a.request_key)){const p=state().products.find(p=>p.id===a.product_key);if(model.balance<p.payPrice)error={code:'P0004'};else{model.balance-=p.payPrice;model.owned=[...new Set([...model.owned,...p.contents])];model.ledger.unshift({kind:'purchase',special_delta:-p.payPrice,product_id:p.id,created_at:new Date().toISOString()});retry.set(a.request_key,true);}}
  if(!error)data=st();
 }else if(name==='premium_equip'){if(a.product_key&&!model.owned.includes(a.product_key))error={code:'42501'};else{model.equipped[a.slot]=a.product_key;data=st();}}
 else error={code:'P0020'};
 return {data,error};
}
frame.onload=()=>{try{
 const w=frame.contentWindow;d=w.__dbg;if(!d)throw Error('Debug hooks unavailable');
 const uid='17000000-0000-4000-8000-000000000001';
 model={balance:1200,owned:[],equipped:{back:'',arena:''},packs:[{id:'small',amount_lak:10000,gems:100},{id:'medium',amount_lak:30000,gems:330},{id:'large',amount_lak:50000,gems:575},{id:'chest',amount_lak:100000,gems:1200}],payment:{enabled:false,receiver:'',qrPath:''},orders:[],ledger:[]};
 const saved=JSON.parse(w.localStorage.getItem('lao-legend-collection')||'{}');
 eco={gems:Number(saved.gems||300),dust:100,xp:1000,freePacks:0,pity:0,packs:0,tutGems:true,adv:0,cards:saved.cards||{},alts:Object.keys(saved.alts||{}),hardBeat:[],ach:[]};retry=new Map();
 Object.assign(d.ACCT,{user:{id:uid},prof:{name:'ຜູ້ທົດລອງ',avatar:'phayanak'},eco:true,achPending:[],admin:true});d.mockSB({rpc});d.ui.screen='shop';d.ui.shopTab=['topup','exchange','cosmetics','history'].includes(new URLSearchParams(location.search).get('tab'))?new URLSearchParams(location.search).get('tab'):'topup';d.ui.mmodal=null;d.ui.login=null;d.render();w.document.querySelector('[data-a="pmrefresh"]').click();
 window.shopDemo={get model(){return model;},get eco(){return eco;},get d(){return d;},rpc};
}catch(e){document.getElementById('status').textContent=e.message;}};
document.getElementById('reset').onclick=()=>frame.src='../?shop-demo='+Date.now();
document.getElementById('admin').onclick=()=>{d.ui.mmodal={type:'admin',tab:'payments',data:{config:{enabled:false,receiver:'',qr_path:''},orders:[]}};d.render();};
frame.src='../?shop-demo';
