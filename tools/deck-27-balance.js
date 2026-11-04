// Reproducible medium-bot round robin: 100 games per existing opponent.
const old=Math.random;let seed=270411;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
try{const r=await window.__sim(2600,1,null,26);return JSON.stringify({...r,seed:270411,rate:r.wins[26]/r.plays[26]});}finally{Math.random=old;}
