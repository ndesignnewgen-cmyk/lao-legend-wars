// Local mock only: no real uploads, bank call or Supabase settings changes.
await new Promise(r=>setTimeout(r,850));
const w=document.getElementById('game').contentWindow,d=w.__dbg,doc=w.document,checks=[],uploads=new Map();
const ok=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
document.getElementById('admin').click();
ok(doc.getElementById('pm-receiver').value==='BOUNPASONG CHANTHAVONG MR','owner receiver prefilled');
ok(!doc.getElementById('pm-enabled').checked,'payments not automatically enabled');
await Promise.all([...doc.querySelectorAll('.pm-admin .pm-qr')].map(i=>i.decode()));
ok(doc.querySelectorAll('.pm-admin .pm-qr').length===5,'original and four v2 amount QRs load');
const m=d.ui.mmodal;let args;
d.mockSB({storage:{from:bucket=>({upload:async(path,file)=>{ok(bucket==='merchant-qr','merchant-only bucket');uploads.set(path,new Uint8Array(await file.arrayBuffer()));return {data:{path},error:null};}})},rpc:async(name,a)=>{
 if(name!=='premium_settings')return shopDemo.rpc(name,a);
 args=a;return {data:{config:{receiver:a.receiver_name,qr_path:a.qr_path,enabled:a.enabled,amount_qrs:a.amount_qrs},packs:shopDemo.model.packs,orders:[]},error:null};
}});
doc.querySelector('[data-a=pmadminsave]').click();
for(let i=0;i<100&&!args;i++)await new Promise(r=>setTimeout(r,30));
ok(!!args&&uploads.size===5,'one save uploads original and all four amount QRs');
ok(args.enabled===false,'save keeps payment switch closed');
ok(Object.keys(args.amount_qrs).length===4,'server receives four canonical amount paths');
for(const n of [10000,30000,50000,100000]){
 const expected=new Uint8Array(await (await fetch('../art/payments/bcel-onepay-'+n+'-v2.png')).arrayBuffer()),actual=uploads.get(args.amount_qrs[n]);
 ok(actual?.length===expected.length&&actual.every((b,i)=>b===expected[i]),'exact v2 '+n+' QR bytes uploaded');
}
ok(m.data.config.amount_qrs['10000']===args.amount_qrs['10000'],'saved server mapping returned');
m.data.config={receiver:args.receiver_name,qr_path:'',enabled:false,amount_qrs:{}};d.render();
ok(!doc.getElementById('pm-enabled').checked,'no automatic payment activation');
ok(!w.__errs.length,'no runtime errors');
return JSON.stringify({count:checks.length,checks,errors:w.__errs});
