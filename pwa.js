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

// Setelan → Tentang (v1.1.147): tangkap event pemasangan lebih awal (event ini muncul sebelum Setelan dibuka)
// dan sediakan pemeriksaan pembaruan manual. Ditulis defensif: tanpa service worker (file://, artefak) tetap aman.
window.__installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event('jurnalInstallReady')); });
window.addEventListener('appinstalled', () => { window.__installPrompt = null; window.dispatchEvent(new Event('jurnalInstallReady')); });
// Hasil: 'unsupported' | 'latest' | 'downloaded' (versi baru siap; banner "Versi baru siap" muncul lewat controllerchange) | 'error'
window.jurnalCheckUpdate = async function(){
  if(!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return 'unsupported';
  try{
    const reg = await navigator.serviceWorker.getRegistration();
    if(!reg) return 'unsupported';
    const before = reg.installing || reg.waiting;
    await reg.update();
    const w = reg.installing || reg.waiting;
    if(w && w !== before){
      await new Promise(res => { if(w.state === 'activated' || w.state === 'redundant') return res(); w.addEventListener('statechange', () => { if(w.state === 'activated' || w.state === 'redundant') res(); }); setTimeout(res, 8000); });
      return 'downloaded';
    }
    return before ? 'downloaded' : 'latest';
  }catch(e){ return 'error'; }
};
