// Service worker: gjør at hele nettstedet virker uten nett etter første besøk.
// Lages av bygg.py, som fyller inn versjon og fillister (plassholderne under) ved bygging.
// Ingen data sendes noe sted. Den lagrer bare nettstedets egne filer i nettleserens cache.
'use strict';
const VERSION = '277cd20a671e';
const CACHE = 'siren-' + VERSION;
// Lastes ned med en gang (norsk spill, forside, musikk, bilder, alle språkversjonene av siden).
const PRECACHE = ["./", ".git/COMMIT_EDITMSG", ".git/HEAD", ".git/config", ".git/description", ".git/hooks/applypatch-msg.sample", ".git/hooks/commit-msg.sample", ".git/hooks/fsmonitor-watchman.sample", ".git/hooks/post-update.sample", ".git/hooks/pre-applypatch.sample", ".git/hooks/pre-commit.sample", ".git/hooks/pre-merge-commit.sample", ".git/hooks/pre-push.sample", ".git/hooks/pre-rebase.sample", ".git/hooks/pre-receive.sample", ".git/hooks/prepare-commit-msg.sample", ".git/hooks/push-to-checkout.sample", ".git/hooks/sendemail-validate.sample", ".git/hooks/update.sample", ".git/index", ".git/info/exclude", ".git/logs/HEAD", ".git/logs/refs/heads/main", ".git/objects/00/5dde684e18eb0c79411f60b5f0f59555a33002", ".git/objects/03/c0175c53ebb28cf3a291b615d078d630be326c", ".git/objects/05/f14e77c74699732d89dc880094187050b475e8", ".git/objects/0f/b22a94a91f2e8c344f8a1c019852f839b11fc3", ".git/objects/18/ee3925e945e03f0224878629f6d9167554c5c5", ".git/objects/20/3bece20841fb3263032fed4f81786df32d073b", ".git/objects/22/73323625dfbcd66c98c0656c463b1e49e724dc", ".git/objects/29/1cd11d8ebd5fdb85a9a8f3187530f1dd65bf98", ".git/objects/2e/d9945be8dfcb2b3ff0a941cb011a73d5da332f", ".git/objects/31/f94e7268b45dc136acd6349b6153f9ce75cb5d", ".git/objects/35/b91a7c7ce0ad21e5a2914e3362d9cf8303d6c5", ".git/objects/3c/4c67d0582257e766f261e04ced8cf29e3f28bf", ".git/objects/3d/82899e37936d0a2593d49f3f938e5cc34a4dfa", ".git/objects/3e/8076f2090d37a6ab9a855ee2414e93a286a4f0", ".git/objects/45/b0c672e431be5ceea1ab61978211722fa70565", ".git/objects/49/67c24f1c9a6db244a874d086982679c6615df0", ".git/objects/56/dcfb9c974b6af407aae2ee7c1a188096209b59", ".git/objects/61/de6e7d18c68528f0312a4c04f2d7b90c9709cb", ".git/objects/65/027e1942277a9f26feb6f3d6ffaf50158e082c", ".git/objects/81/59c960c641e508b86c843febf1778bdca92487", ".git/objects/94/b4bd05e5d1ed6927a143271c91bc5da936ae50", ".git/objects/97/2c2a2a88514930b8e0a1c8d1c5ab375dcd7c7f", ".git/objects/a4/5ae8b7149c274f648c3f4b2b6b08fee77e8f51", ".git/objects/a5/3541509b39425407706378ebce2fb361c44afb", ".git/objects/aa/35f65047376406fb7d66d5e84a1fdc12c06492", ".git/objects/ac/bb76088d4b551cc020563a6a50cf4eb3b5bf86", ".git/objects/b1/ecdf61f279ce3be3158898321cea5f743d5567", ".git/objects/c1/6016989544db3c481531d7fd7189769cb18002", ".git/objects/ca/7f33ba54fc9a4ba881b05b4ea99847026f2dc8", ".git/objects/d3/a571f8bcf212f4efd98120b42bc71e0e185d06", ".git/objects/d7/72dc4d3aec84834c2a62d885c3e86739648c0b", ".git/objects/e0/e8fb48bde868baa253f62c5d9dd55077f0bb5f", ".git/objects/e6/9de29bb2d1d6434b8b29ae775ad8c2e48c5391", ".git/objects/e6/ff8c6431ee8678c6a801be0b20144fb0ab67d5", ".git/objects/e8/4e163bdbd39c7b3c73b31e01a07047c58d1eb3", ".git/objects/fc/6c7d25001debd6dd98a7edd033d031b658539b", ".git/refs/heads/main", "bilder/bibliotek.jpg", "bilder/port.jpg", "bilder/speilsal.jpg", "bilder/taverna.jpg", "bilder/tempel.jpg", "bilder/yacht.jpg", "ikoner/apple-touch-icon.png", "ikoner/ikon-192.png", "ikoner/ikon-512.png", "ikoner/ikon-maskable-512.png", "index.html", "manifest.webmanifest", "spill/index.en.html", "spill/index.html", "spill/lyd/musikk.js", "spill/lyd/stemmer.js", "spill/"];
// Stemmer for andre språk (store filer) lastes ned i bakgrunnen etter at spillet er klart,
// så alle språk virker uten nett, uten at første lasting blir treg.
const LAZY = ["spill/lyd/stemmer.en.js"];

const url = p => new URL(p, self.registration.scope).href;

// Henter de store språkfilene én og én i bakgrunnen. Trygt å kalle mange ganger.
let topping = null;
function topUp() {
  return topping || (topping = (async () => {
    const c = await caches.open(CACHE);
    for (const p of LAZY) {
      if (await c.match(url(p))) continue;
      try { const r = await fetch(url(p)); if (r.ok) await c.put(url(p), r); } catch (e) { break; } // uten nett: prøv igjen senere
    }
  })().finally(() => { topping = null; }));
}
async function status() {
  const c = await caches.open(CACHE);
  let done = 0; for (const p of LAZY) if (await c.match(url(p))) done++;
  return { version: VERSION, done, total: LAZY.length };
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE.map(url))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('siren-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
  topUp();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const u = new URL(req.url);
  // bare egne filer; nedlastbare filer i last-ned/ går rett til nettet
  if (req.method !== 'GET' || u.origin !== self.location.origin || u.pathname.includes('/last-ned/')) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    // ignoreSearch: ?fast o.l. skal ikke gi en ny kopi
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') c.put(req, res.clone()); // f.eks. stemmer for et nytt språk
      return res;
    } catch (err) {
      if (req.mode === 'navigate') return (await c.match(url('index.html'))) || Response.error();
      return Response.error();
    }
  })());
});

// Sidene spør om status; svaret sier hvor mange språk som er klare uten nett.
self.addEventListener('message', e => {
  if (e.data !== 'status' || !e.source) return;
  e.waitUntil(status().then(st => { e.source.postMessage(st); if (st.done < st.total) return topUp().then(status).then(s2 => e.source.postMessage(s2)); }));
});
