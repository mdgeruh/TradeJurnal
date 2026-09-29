// Service worker: cache-dulu (stale-while-revalidate) supaya aplikasi tampil instan; cache diperbarui di latar
// dan versi baru dipakai pada pembukaan berikutnya (CACHE dinaikkan tiap rilis, cache lama dihapus saat aktif).
// Panggilan ke Supabase (domain lain) tidak pernah di-cache.
const CACHE = 'jurnal-v1.1.134';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'sync.js', 'config.js', 'pwa.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin && !CDN.includes(url.hostname)) return;
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if(res && (res.ok || res.type === 'opaque')){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    });
    if(hit){ net.catch(() => {}); return hit; }
    return net.catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error());
  }));
});
