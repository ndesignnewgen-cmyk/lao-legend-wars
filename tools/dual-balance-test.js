const old=Math.random;let seed=427105;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
try{const r=await window.__sim(14040,1);return JSON.stringify({...r,rates:r.wins.map((n,i)=>({no:window.__dbg.DECKS[i].no,rate:+(100*n/r.plays[i]).toFixed(2)})),seed:427105});}finally{Math.random=old;}
