// Small JSON patches for animation frames. They contain presentation state, never authority.
export function diffVisual(a,b,path=[],out=[]){
 if(JSON.stringify(a)===JSON.stringify(b))return out;
 if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length){for(let i=0;i<a.length;i++)diffVisual(a[i],b[i],path.concat(i),out);return out;}
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
  for(const k of Object.keys(a))if(!Object.hasOwn(b,k))out.push([path.concat(k)]);
  for(const k of Object.keys(b))diffVisual(a[k],b[k],path.concat(k),out);
 }else out.push([path,b]);return out;
}
export function patchVisual(base,ops){
 let result=JSON.parse(JSON.stringify(base));
 for(const op of ops){const [path,value]=op;if(!Array.isArray(path)||path.some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Invalid visual path');
  if(!path.length){result=value;continue;}let at=result;for(const k of path.slice(0,-1))at=at[k];
  if(op.length===1)delete at[path.at(-1)];else at[path.at(-1)]=value;
 }return result;
}
