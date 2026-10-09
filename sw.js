// Service worker: cache-dulu (stale-while-revalidate) untuk berkas statis supaya aplikasi tampil instan; cache diperbarui di latar
// dan versi baru dipakai pada pembukaan berikutnya (CACHE dinaikkan tiap rilis, cache lama dihapus saat aktif).
// Anti campur-versi (v1.1.181): berkas CSS/JS dipanggil index.html dengan ?v=<versi> dan di-precache dengan nama bertanda itu;
// halaman (navigasi) diambil jaringan-dulu agar index.html selalu yang terbaru, baru jatuh ke cache bila offline.
// Panggilan ke Supabase (domain lain) tidak pernah di-cache.
const V = '1.1.181';
const CACHE = 'jurnal-v' + V;
const SHELL = ['./', 'index.html',
  ...['style.css', 'app.js', 'kalender.js', 'broker.js', 'sync.js', 'config.js', 'pwa.js'].map(f => f + '?v=' + V),
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // cache:'reload' = lewati cache HTTP browser supaya yang tersimpan benar-benar berkas rilis ini.
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => { if(!r.ok) throw new Error(u + ' ' + r.status); return c.put(u, r); }))))
    .then(() => self.skipWaiting()));
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
  if(req.mode === 'navigate'){
    e.respondWith(fetch(req).then(res => {
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html').then(h => h || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if(res && (res.ok || res.type === 'opaque')){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    });
    if(hit){ net.catch(() => {}); return hit; }
    return net.catch(() => Response.error());
  }));
});
