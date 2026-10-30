// Refresh CSP hashes and the server engine after changing browser code. No unsafe-eval or external scripts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const hash=(alg,s)=>crypto.createHash(alg).update(s).digest('base64');
const vendor=fs.readFileSync(path.join(root,'vendor/supabase-2.45.4.min.js'));
for(const name of ['index.html','cards.html']){
 const file=path.join(root,name);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<meta name="security-build"[^>]*>\s*/g,'').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/g,'').replace(/<meta name="referrer" content="no-referrer">\s*/g,'');
 if(name==='index.html')html=html.replace("sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';", "sc.src = 'vendor/supabase-2.45.4.min.js';")
  .replace(/sc\.integrity = '[^']*';\s*/g,'').replace("sc.src = 'vendor/supabase-2.45.4.min.js';", "sc.src = 'vendor/supabase-2.45.4.min.js'; sc.integrity = 'sha384-"+hash('sha384',vendor)+"';");
 const hashes=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].filter(m=>m[1].trim()).map(m=>"'sha256-"+hash('sha256',m[1])+"'");
 const policy=["default-src 'self'", "script-src 'self' "+hashes.join(' '),"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src 'self' https://fonts.gstatic.com data:","img-src 'self' data: blob: https://laolegendwars.com","media-src 'self' blob:","connect-src 'self' https://xahuvoounkdojfsvnfaj.supabase.co","worker-src 'self'","object-src 'none'","base-uri 'none'","form-action 'self'"].join('; ');
 const meta='<meta name="security-build" content="1">\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n<meta name="referrer" content="no-referrer">\n';
 html=html.startsWith('<!doctype')?html.replace(/^(<!doctype[^>]*>)/i,'$1\n'+meta):meta+html;
 fs.writeFileSync(file,html);
}
execFileSync(process.execPath,[path.join(root,'tools/build-secure-engine.cjs')],{stdio:'inherit'});
