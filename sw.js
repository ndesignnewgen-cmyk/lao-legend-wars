// Offline support for the installed app.
// Pages: network first, so a new version shows as soon as you are online; the cached copy is used offline.
// Card art and fonts: cache first, filled as cards are seen (the 60+ MB of art is not downloaded up front).
// Replacing an art file under the same name? Bump VERSION so players get the new picture.
const VERSION = 'v3-legend-entrances';
const SHELL = 'shell-' + VERSION, ART = 'art-' + VERSION, FONTS = 'fonts-' + VERSION;
const PRECACHE = ['./', 'index.html', 'cards.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'art/logo.webp', 'art/back.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  const keep = [SHELL, ART, FONTS];
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !keep.includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req){
  const c = await caches.open(SHELL);
  try{ const res = await fetch(req); if(res.ok) c.put(req, res.clone()); return res; }
  catch(err){ return (await c.match(req, {ignoreSearch:true})) || (await c.match('index.html')); }
}
async function cacheFirst(req, name){
  const hit = await caches.match(req);  // any cache: the shell precache holds the logo and card back too
  if(hit) return hit;
  const c = await caches.open(name);
  const res = await fetch(req);
  if(res.ok || res.type === 'opaque') c.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request; if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin === location.origin){
    if(req.mode === 'navigate' || /(\/|\.html|\.webmanifest)$/.test(url.pathname)) e.respondWith(networkFirst(req));
    else if(/\/(art|icons)\//.test(url.pathname)) e.respondWith(cacheFirst(req, ART));
  } else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cacheFirst(req, FONTS));
});
