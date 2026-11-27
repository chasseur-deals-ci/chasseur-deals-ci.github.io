// © 2026 Serge Kedja. Tous droits réservés.
/* Service worker : la page s'ouvre même sans réseau, avec les dernières données vues.
   - coquille de la page : cache d'abord, mise à jour en arrière-plan
   - data/deals.json et site.json : réseau d'abord, dernier exemplaire en secours
   - images produits et autres sites : jamais interceptés (rien n'est stocké ici) */
const CACHE = 'cdci-v6';
const SHELL = ['./', 'index.html', 'style.css', 'infos.html', 'manifest.webmanifest', 'icon-192.png', 'logo/logo-A-transparent.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const dynamic = /\/(data\/deals\.json|site\.json)$/.test(url.pathname);
  if (dynamic) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  if (/\/data\/(story\.png|caption\.txt)$/.test(url.pathname)) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
