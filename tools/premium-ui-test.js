// Run with tools/wk.swift at http://localhost:8124/tools/shop-preview.html.
// Run viewport cases serially: separate mock servers share this origin's browser storage and demo account.
await new Promise(r=>setTimeout(r,900));
const w=document.getElementById('game').contentWindow,doc=w.document,checks=[];
const wait=()=>new Promise(r=>setTimeout(r,220));
const ok=(yes,name)=>{if(!yes)throw Error(name);checks.push(name);};
const click=(a,v)=>{const el=doc.querySelector('[data-a="'+a+'"]'+(v==null?'':'[data-v="'+v+'"]'));if(!el)throw Error('Missing '+a+' '+v);el.click();};
const tab=async name=>{click('shoptab',name);await wait();};
ok(!!window.shopDemo,'preview booted');const originalGems=shopDemo.eco.gems;
ok(doc.querySelectorAll('.pm-pack').length===4,'four canonical topup packs');
ok([...doc.querySelectorAll('[data-a=pmpack]')].every(b=>b.disabled),'topups disabled without merchant QR');
ok(doc.querySelector('.pm-shophero img').complete&&doc.querySelector('.pm-shophero img').naturalWidth>0,'generated chest art loads');
ok(doc.querySelector('.pm-icon').naturalWidth>0,'generated premium icon loads');
ok(doc.documentElement.scrollWidth<=w.innerWidth+1,'no page horizontal overflow');
await tab('packs');ok(doc.querySelectorAll('.pack').length===3,'regular card packs preserved');
await tab('exchange');click('pmexchange','100');ok(!!doc.querySelector('.premium-modal'),'exchange has explicit confirmation');ok(shopDemo.model.balance===1200,'opening confirmation does not debit');
click('pmclose');ok(shopDemo.model.balance===1200,'closing confirmation does not debit');
doc.getElementById('pm-amount').value='-100';doc.querySelector('[data-a=pmexchange]:not([data-v])').click();ok(!doc.querySelector('.premium-modal'),'negative exchange blocked by UI');
click('pmexchange','100');click('pmexchangeok');await wait();ok(shopDemo.model.balance===1100&&shopDemo.eco.gems===originalGems+500,'confirmed 1:5 exchange updates both balances');ok(!doc.querySelector('.premium-modal'),'success closes confirmation');ok(doc.querySelector('.pm-banner').textContent.includes('1,100'),'fresh special balance shown');
// A lost reply after a successful debit must retain the same key for the retry.
const originalRPC=shopDemo.rpc,keys=[];let lose=true;
shopDemo.d.mockSB({rpc:async(name,a)=>{if(name==='premium_exchange'){keys.push(a.request_key);const r=await originalRPC(name,a);if(lose){lose=false;return {data:null,error:{code:'NETWORK',message:'Lost reply'}};}return r;}return originalRPC(name,a);}});
click('pmexchange','100');click('pmexchangeok');await wait();ok(!!doc.querySelector('.pm-error'),'uncertain network outcome shown');ok(shopDemo.model.balance===1000,'lost reply simulated after exactly one debit');
click('pmexchangeok');await wait();ok(keys.length===2&&keys[0]===keys[1],'retry uses original persisted key');ok(shopDemo.model.balance===1000&&shopDemo.eco.gems===originalGems+1000,'retry does not duplicate either currency');
await tab('cosmetics');ok(doc.querySelectorAll('.pm-tile').length===5,'five cosmetic products rendered');
await Promise.all([...doc.querySelectorAll('.pm-back-image')].map(i=>i.decode()));
ok([...doc.querySelectorAll('.cosmetics>.pm-tile')].slice(0,3).every(t=>t.querySelector('.pm-back-image')?.naturalWidth===560),'all three generated card backs load in the shop');
click('pmpreview','back-stars');ok(doc.querySelector('.premium-modal .back-stars')&&!doc.querySelector('[data-a=pmbuyok]'),'large preview has no purchase side effect');await doc.querySelector('.premium-modal .pm-back-image').decode();ok(doc.querySelector('.premium-modal .pm-back-image').naturalWidth===560,'large preview uses generated art');click('pmclose');
click('pmbuy','back-naga');ok(shopDemo.model.balance===1000,'buy requires confirmation');click('pmbuyok');await wait();ok(shopDemo.model.balance===900&&shopDemo.model.owned.includes('back-naga'),'cosmetic purchase debits once and grants ownership');
click('pmequip','back-naga');await wait();ok(shopDemo.model.equipped.back==='back-naga','owned back can be equipped');
click('pmreset','back');await wait();ok(shopDemo.model.equipped.back==='','default back can be restored');
ok(doc.querySelector('[data-a=pmbuy][data-v=legend-set]').textContent.includes('920'),'bundle shows missing-item price');ok(doc.querySelector('[data-a=pmbuy][data-v=legend-set]').disabled,'insufficient balance disables bundle purchase');
await tab('history');ok(doc.querySelectorAll('.pm-history article').length===3,'exchange and purchase history present');
await tab('topup');document.getElementById('admin').click();ok(!!doc.querySelector('#pm-receiver')&&!!doc.querySelector('#pm-qrfile'),'admin merchant setup available');ok(!doc.querySelector('#pm-enabled').checked,'admin payments start closed');click('mmclose');
await tab('cosmetics');
for(const i of [...doc.images].filter(i=>i.offsetWidth>0&&i.src.includes('/art/ui/premium-')))ok(i.complete&&i.naturalWidth>0,'visible generated artwork loads');
ok(!w.__errs.length,'no game runtime errors');
return JSON.stringify({count:checks.length,checks,errors:w.__errs,width:w.innerWidth});
