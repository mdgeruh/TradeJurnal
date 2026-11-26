// Konfigurasi Supabase. Kunci "publishable" (anon) memang aman ada di sisi klien
// selama RLS aktif (lihat schema.sql). JANGAN pernah memasukkan kunci service_role / secret.
window.SUPABASE_CONFIG = {
  url: 'https://qshasucbwppubwprxerj.supabase.co',
  anonKey: 'sb_publishable__bqAK6E6Kn8sFcnBjDl4kA_9Hg0DCNR'
};
