// Request validation and authoritative transition orchestration. Test without Deno/network.
export class ApiError extends Error {constructor(code,status=400){super(code);this.status=status;}}
export const allowedOrigins=new Set(['https://laolegendwars.com','https://ndesignnewgen-cmyk.github.io','http://localhost:8123','http://127.0.0.1:8123']);
export async function readBody(req,limit=16384){
 const size=req.headers.get('content-length');if(size&&(!/^\d+$/.test(size)||+size>limit))throw new ApiError('too_large',413);
 const reader=req.body?.getReader();if(!reader)throw new ApiError('bad_request');const chunks=[];let n=0;
 while(true){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>limit){await reader.cancel();throw new ApiError('too_large',413);}chunks.push(value);}
 const bytes=new Uint8Array(n);let at=0;for(const b of chunks){bytes.set(b,at);at+=b.length;}let body;
 try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new ApiError('bad_json');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError('bad_request');return body;
}
export function normalizeSpec(engine,input){
 if(!input||!engine.validDeck(input.list))throw new ApiError('bad_deck');
 const list=Object.fromEntries(Object.entries(input.list).sort(([a],[b])=>a.localeCompare(b)));
 const di=Number.isInteger(input.di)&&engine.decks[input.di]?input.di:engine.baseDeck(list);
 return {list,di,cover:engine.cards[input.cover]&&!engine.cards[input.cover].token?input.cover:null};
}
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
export function safeMove(raw,side){
 if(!raw||!['play','atk','fuse','trib','end','quit'].includes(raw.t))throw new ApiError('bad_move');
 const out={type:raw.t,side};
 for(const k of ['uid','a','b'])if(raw[k]!=null){if(!Number.isSafeInteger(raw[k])||raw[k]<0)throw new ApiError('bad_move');out[k]=raw[k];}
 if(raw.f!=null){if(typeof raw.f!=='string'||!/^[a-z0-9]{1,40}$/.test(raw.f))throw new ApiError('bad_move');out.f=raw.f;}
 if(raw.tk!=null){if(typeof raw.tk!=='string'||! /^(?:H:[so]|c:\d+)$/.test(raw.tk))throw new ApiError('bad_target');out.tk=raw.tk==='H:s'?'h:'+side:raw.tk==='H:o'?'h:'+(1-side):raw.tk;}
 return out;
}
function answerDefault(p){return p.type==='mull'?[]:p.type==='ask'?false:p.type==='rite'?p.opts[0]:p.cards[0].uid;}
export async function transition(engine,row,side,body,now=Date.now()){
 if(!uuid(body.rid))throw new ApiError('bad_request_id');
 let bundle=row.engine;
 if(!bundle){
  const spec={...row.spec,mode:row.mode};spec.host=normalizeSpec(engine,spec.host);spec.guest=normalizeSpec(engine,spec.guest);
  const seed=body.serverSeed;if(!Number.isSafeInteger(seed))throw new ApiError('missing_seed',500);
  const base=engine.start(spec,seed),action={type:'start'};const next=await engine.run(base,action,[]);
  return {...next,pending:next.prompt?{action,answers:[]}:null,timeouts:[0,0]};
 }
 if(bundle.checkpoint.state.over)return bundle;
 if(body.op==='move'&&body.move?.t==='quit'){const next=await engine.run(bundle.checkpoint,{type:'quit',side},[]);return {...next,pending:null,timeouts:bundle.timeouts||[0,0]};}
 // Bot games have no turn clock: the browser plays them ahead on its own copy and nobody waits on the other side.
 const expired=row.mode!=='bot'&&!!row.deadline&&now>=Date.parse(row.deadline);
 if(body.op==='poll'&&!expired)return null;
 if(body.op==='move'&&body.rev!==row.rev)throw new ApiError('stale_revision',409);
 const timeouts=[...(bundle.timeouts||[0,0])];
 let action,answers=[];
 if(bundle.prompt){
  if(!expired&&(body.op!=='answer'||bundle.prompt.side!==side))throw new ApiError('waiting_for_answer',409);
  if(!expired&&body.rev!==row.rev)throw new ApiError('stale_revision',409);
  action=bundle.pending.action;answers=[...bundle.pending.answers,{side:bundle.prompt.side,value:expired?answerDefault(bundle.prompt):body.value}];
 }else{
  if(expired){const turn=bundle.checkpoint.state.turn;timeouts[turn]++;action={type:timeouts[turn]>=3?'quit':'end',side:turn};}
  else{if(body.op!=='move')throw new ApiError('bad_request');action=safeMove(body.move,side);timeouts[side]=0;}
 }
 const next=await engine.run(bundle.checkpoint,action,answers);
 return {...next,pending:next.prompt?{action,answers}:null,timeouts};
}
export function responseView(engine,row,uid,opts={}){
 const side=uid===row.host?0:uid===row.guest?1:-1;if(side<0)throw new ApiError('not_your_game',403);
 if(!row.engine)return {code:row.code,rev:row.rev,status:'waiting',side,mode:row.mode};
 const view=engine.view(row.engine,side);view.state.online.room=row.code;view.state.online.ranked=row.mode==='ranked';
 if(row.mode==='bot'){delete view.state.online;view.state.p[1].name='ບອດ';}
 view.state.secureId=row.code;view.state.secureRev=row.rev;view.state.secureMode=row.mode;view.state.secureDeadline=row.deadline;
 // full = the whole engine bundle, only for the player of a bot game, so the browser can run the same game locally.
 const full=opts.full&&row.mode==='bot'&&side===0?row.engine:undefined;
 return {...view,full,visuals:row.engine.visuals?.[side]||null,counts:(row.engine.preview||row.engine.checkpoint).state.secureCounts?.[side]||{},code:row.code,rev:row.rev,status:row.status,mode:row.mode,side,reward:side===0?row.reward:null,rewarded:row.rewarded};
}
