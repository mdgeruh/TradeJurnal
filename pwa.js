// Daftarkan service worker hanya di http(s) (tidak jalan di file://).
// v1.1.139: bila service worker baru mengambil alih saat aplikasi sedang terbuka, tampilkan banner
// "Versi baru siap" (tanpa muat ulang otomatis, supaya isian yang belum disimpan tidak hilang).
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  const hadController = !!navigator.serviceWorker.controller;   // false pada pemasangan pertama → tanpa banner
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if(hadController) showUpdateBanner(); });
}
function showUpdateBanner(){
  if(document.getElementById('updateBanner')) return;
  const b = document.createElement('div');
  b.id = 'updateBanner'; b.className = 'update-banner'; b.setAttribute('role', 'status');
  b.innerHTML = '<span>Versi baru siap.</span><button type="button" class="quick-chip" id="updateReload">Muat ulang</button>' +
                '<button type="button" class="quick-chip" id="updateLater" aria-label="Nanti saja" title="Nanti saja">\u2715</button>';
  document.body.appendChild(b);
  document.getElementById('updateReload').addEventListener('click', () => location.reload());
  document.getElementById('updateLater').addEventListener('click', () => b.remove());
}
