// Dashboard fallback: generate a single plain-text source file without copying any credentials.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['_shared/visual.mjs','_shared/engine.mjs','_shared/security.mjs','secure-game/index.ts'];
const source=files.map(p=>fs.readFileSync(path.join(root,'supabase/functions',p),'utf8').split('\n').filter(l=>!l.startsWith('import ')).join('\n').replace(/^export /gm,'')).join('\n');
const dest=process.argv[2]||'/tmp/lao-secure-effects.txt';fs.writeFileSync(dest,source);console.log('Built dashboard source:',dest);
