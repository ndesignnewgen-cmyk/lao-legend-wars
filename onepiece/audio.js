/* Adapted from Lao Legend Wars' sfxfLoad/sfxf: reuse the original AAC recordings.
 * A separate bus/preferences keep this trial independent from the main game's save.
 */
(() => {
  'use strict';
  const gains=Object.freeze({click:.45,flip:.6,draw:.55,play:.7,attack:.7,hit:.75,bless:.65,'blade-focus':.55,'blade-slash':.65,'blade-guard':.6,spell:.65,destroy:.65,reveal:.6,foeturn:.65,endturn:.6});
  function plan(action,info={}){
    if(action==='attack')return [[/Zoro|013/.test(info.id||'')?'blade-slash':'attack',0],['hit',280]];
    if(action==='ko')return [['spell',0],['destroy',220]];
    if(action==='trigger')return info.effect?[['reveal',0],[info.effect==='slash'?'destroy':'bless',220]]:[['reveal',0]];
    const name={select:'flip',reset:'draw',play:'play',attach:info.kind==='sword'?'blade-focus':'bless',skill:'bless',block:'blade-guard',counter:'blade-guard',turn:'foeturn',finish:'endturn',buff:'bless',resolve:info.effect==='shield'?'blade-guard':'hit'}[action]||'click';
    return [[name,0]];
  }
  function create(options={}){
    let ctx=options.context||null,bus=null,muted=!!options.muted,volume=Math.max(0,Math.min(1,options.volume??.55)),destroyed=false;
    const buffers={},pending={},voices=new Set(),timers=new Set(),last={},history=[];
    const base=options.base||'../art/sfx/';
    const hidden=options.hidden||(()=>document.hidden);
    function remember(name,recorded){history.push({name,recorded});if(history.length>30)history.shift();}
    function setup(){
      if(destroyed)return false;
      try{
        if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;ctx=new AC();}
        if(!bus){bus=ctx.createGain();bus.gain.value=muted?0:volume;bus.connect(ctx.destination);}
        return true;
      }catch(_){return false;}
    }
    async function load(name){
      if(buffers[name])return buffers[name];if(pending[name])return pending[name];
      if(!setup()||!Object.hasOwn(gains,name))return null;
      pending[name]=fetch(base+name+'.m4a').then(r=>{if(!r.ok)throw Error('Audio '+r.status);return r.arrayBuffer();})
        .then(data=>ctx.decodeAudioData(data)).then(b=>buffers[name]=b).catch(()=>null);
      return pending[name];
    }
    function preload(){return setup()?Promise.all(Object.keys(gains).map(load)):Promise.resolve([]);}
    function unlock(){
      if(muted||hidden()||!setup())return;
      if(ctx.state==='suspended'&&typeof ctx.startRendering!=='function')ctx.resume().catch(()=>{});
      void preload();
    }
    function stop(){
      timers.forEach(clearTimeout);timers.clear();
      for(const v of [...voices]){try{v.src.stop();}catch(_){}v.cleanup();}
    }
    function track(src,gain){
      while(voices.size>=6){const oldest=voices.values().next().value;try{oldest.src.stop();}catch(_){}oldest.cleanup();}
      const v={src,cleanup(){voices.delete(v);src.disconnect();gain.disconnect();}};
      voices.add(v);src.onended=v.cleanup;return v;
    }
    // The main game's code-made sounds are the fallback while a recording loads.
    function fallback(name){
      const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
      const tap=name==='click'||name==='flip',low=/hit|destroy|guard/.test(name),dur=tap?.065:low?.16:.2;
      o.type=low?'triangle':'sine';o.frequency.setValueAtTime(low?180:tap?1000:620,t);o.frequency.exponentialRampToValueAtTime(low?65:tap?600:980,t+dur);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(tap?.06:.12,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(bus);track(o,g);o.start(t);o.stop(t+dur+.02);remember(name,false);
    }
    function play(name){
      if(destroyed||muted||volume===0||hidden()||!setup()||!Object.hasOwn(gains,name))return false;
      if(ctx.state!=='running'&&typeof ctx.startRendering!=='function')return false;
      const now=ctx.currentTime;if(last[name]!=null&&now-last[name]<.055)return false;last[name]=now;
      const b=buffers[name];if(!b){void load(name);fallback(name);return true;}
      const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=b;g.gain.value=gains[name];src.connect(g);g.connect(bus);track(src,g);src.start();remember(name,true);return true;
    }
    function cue(action,info){
      if(destroyed||muted||volume===0||hidden())return;
      for(const [name,delay] of plan(action,info)){
        if(!delay)play(name);
        else{const timer=setTimeout(()=>{timers.delete(timer);play(name);},delay);timers.add(timer);}
      }
    }
    function setMuted(value){muted=!!value;if(muted)stop();if(bus)bus.gain.setValueAtTime(muted?0:volume,ctx.currentTime);}
    function setVolume(value){const n=Number(value);if(!Number.isFinite(n))return;volume=Math.max(0,Math.min(1,n));if(volume===0)stop();if(bus)bus.gain.setValueAtTime(muted?0:volume,ctx.currentTime);}
    function suspend(){stop();if(ctx?.state==='running'&&typeof ctx.startRendering!=='function')ctx.suspend().catch(()=>{});}
    function destroy(){stop();destroyed=true;if(bus)bus.disconnect();if(!options.context&&ctx)ctx.close().catch(()=>{});}
    return {unlock,preload,play,cue,stop,suspend,destroy,setMuted,setVolume,get muted(){return muted;},get volume(){return volume;},get status(){return {loaded:Object.keys(buffers).length,active:voices.size,scheduled:timers.size,history:history.slice(),context:ctx,buffers};}};
  }
  window.OPAudio=Object.freeze({create,plan,files:Object.keys(gains)});
})();
