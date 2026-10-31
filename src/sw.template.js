// Oxyblox — service worker (généré par src/build.py, ne pas modifier sw.js à la main).
// Met tout le jeu en cache pour jouer hors ligne ; une nouvelle version propose « Mettre à jour ».
const VERSION = '__VERSION__';
const CORE = [
  __FILES__
];

self.addEventListener('install', e => {
  // Les musiques (6 Mo, adresse avec l'empreinte du fichier ?v=) sont reprises de la version précédente
  // quand elles n'ont pas changé : une mise à jour du jeu ne les retélécharge plus.
  const mp3 = f => f.includes('.mp3');
  e.waitUntil(caches.open(VERSION).then(c => Promise.all([
    c.addAll(CORE.filter(f => !mp3(f))),
    ...CORE.filter(mp3).map(f => caches.match(f).then(hit => hit ? c.put(f, hit) : c.add(f)))
  ])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('oxyblox-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // le manifest passe par le réseau d'abord, pour que l'installation voie la dernière version
  if (url.pathname.endsWith('.webmanifest')) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; }).catch(() => caches.match(req)));
    return;
  }
  // les musiques sont lues par plages (Range) : on découpe la réponse en cache (206) pour Safari comme Chrome
  const range = req.headers.get('range');
  if (range && url.pathname.endsWith('.mp3')) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(async hit => {
      if (!hit) return fetch(req);
      const buf = await hit.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range) || [];
      const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
      return new Response(buf.slice(start, end + 1), { status: 206, headers: {
        'Content-Type': 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
    }));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: !url.pathname.endsWith('.js') && !url.pathname.endsWith('.css') }).then(hit => hit ||
      fetch(req).then(r => {
        if (r.ok && r.status === 200) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return r;
      }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined)
    )
  );
});
