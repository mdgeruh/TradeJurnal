// Daftarkan service worker hanya di http(s) (tidak jalan di file://).
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
