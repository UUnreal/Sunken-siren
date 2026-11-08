// Service worker: gjør at hele nettstedet virker uten nett etter første besøk.
// Lages av bygg.py, som fyller inn versjon og fillister (plassholderne under) ved bygging.
// Ingen data sendes noe sted. Den lagrer bare nettstedets egne filer i nettleserens cache.
'use strict';
const VERSION = 'a62d74f3fcb1';
const CACHE = 'siren-' + VERSION;
// Lastes ned med en gang (norsk spill, forside, musikk, bilder, alle språkversjonene av siden).
const PRECACHE = ["./", "CHANGELOG.md", "bilder/bibliotek.jpg", "bilder/port.jpg", "bilder/speilsal.jpg", "bilder/taverna.jpg", "bilder/tempel.jpg", "bilder/yacht.jpg", "ikoner/apple-touch-icon.png", "ikoner/ikon-192.png", "ikoner/ikon-512.png", "ikoner/ikon-maskable-512.png", "index.html", "manifest.webmanifest", "spill/index.en.html", "spill/index.html", "spill/lyd/musikk.js", "spill/lyd/stemmer.js", "spill/"];
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
