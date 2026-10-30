// Authentication is always checked with Auth.getUser, even when gateway verify_jwt is disabled for publishable keys.
import {createEngine} from '../_shared/engine.mjs';
import {ApiError,allowedOrigins,readBody,normalizeSpec,transition,responseView} from '../_shared/security.mjs';
const url=Deno.env.get('SUPABASE_URL');
const anon=Deno.env.get('SUPABASE_ANON_KEY');
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // platform-injected; never return/log this or put it in browser code
async function rpc(name,args,token=service){
 const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:token===service?service:anon,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});
 const data=await r.json();if(!r.ok)throw new ApiError(data.code==='40001'?'stale_revision':data.code==='42501'?'not_allowed':'request_rejected',data.code==='40001'?409:403);return data;
}
function code(){const abc='ABCDEFGHJKMNPQRSTUVWXYZ23456789',b=crypto.getRandomValues(new Uint8Array(16));return Array.from(b.slice(0,8),x=>abc[x%abc.length]).join('');}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin&&!allowedOrigins.has(origin))return new Response('{}',{status:403,headers});
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';headers['Access-Control-Allow-Methods']='POST,OPTIONS';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return new Response('{}',{status:405,headers});
 try{
  const token=req.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]{40,8192})$/)?.[1];if(!token)throw new ApiError('sign_in',401);
  const body=await readBody(req);
  if(!['create','join','poll','move','answer'].includes(body.op))throw new ApiError('bad_request');
  const auth=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token},signal:AbortSignal.timeout(5000)});
  if(!auth.ok)throw new ApiError('sign_in',401);const user=await auth.json();if(!user.id)throw new ApiError('sign_in',401);
  const kind=body.op==='answer'?'move':body.op;if(!await rpc('sec_gate',{kind},token))throw new ApiError('rate_limited',429);
  const engine=createEngine();let row;
  if(body.op==='create'){
   const mode=body.mode==='bot'?'bot':'casual',host=normalizeSpec(engine,body.spec);let level=1,stage=null,guest=null;
   if(mode==='bot'){
    if(!Number.isInteger(body.level)||body.level<0||body.level>2)throw new ApiError('bad_level');level=body.level;
    if(body.stage!=null){if(!Number.isInteger(body.stage)||!engine.adventures[body.stage])throw new ApiError('bad_stage');stage=body.stage;}
    const adv=stage==null?null:engine.adventures[stage];level=adv?.lv??level;
    const di=adv?.di??body.botDeck;if(!Number.isInteger(di)||!engine.decks[di])throw new ApiError('bad_opponent');guest={di,list:engine.decks[di].list};
   }
   row=await rpc('sec_create',{actor:user.id,room_code:code(),game_mode:mode,game_spec:{host,guest,level,stage}});
  }else{
   if(typeof body.code!=='string'||! /^[A-Z2-9]{5,8}$/.test(body.code))throw new ApiError('bad_code');
   row=body.op==='join'?await rpc('sec_join',{actor:user.id,room_code:body.code,guest_spec:normalizeSpec(engine,body.spec)}):await rpc('sec_read',{actor:user.id,room_code:body.code});
  }
  const side=user.id===row.host?0:user.id===row.guest?1:-1;if(side<0)throw new ApiError('not_your_game',403);
  if(row.mode==='bot'||row.guest){
   if(row.status==='finished'){await rpc('sec_reward',{actor:user.id,room_code:row.code});row=await rpc('sec_read',{actor:user.id,room_code:row.code});}
   else{
    // UUID is a retry key, not proof of authority. Membership, revision and all rules are checked separately.
    const request={...body,rid:body.rid||crypto.randomUUID(),serverSeed:crypto.getRandomValues(new Uint32Array(1))[0]};
    if(await rpc('sec_seen',{actor:user.id,room_code:row.code,rid:request.rid}))return new Response(JSON.stringify(responseView(engine,row,user.id)),{headers});
    if(!row.engine){row.spec.host=normalizeSpec(engine,row.spec.host);row.spec.guest=normalizeSpec(engine,row.spec.guest);}
    const next=await transition(engine,row,side,request);
    if(next)row=await rpc('sec_commit',{actor:user.id,room_code:row.code,expected:row.rev,rid:request.rid,next_engine:next,game_action:{op:body.op,move:body.move||null}});
   }
  }
  return new Response(JSON.stringify(responseView(engine,row,user.id)),{headers});
 }catch(e){const err=e instanceof ApiError?e:new ApiError('request_rejected',400);return new Response(JSON.stringify({error:err.message}),{status:err.status,headers});}
});
