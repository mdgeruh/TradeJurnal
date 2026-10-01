// Sinkron Supabase (v1.1.105). Dimuat SETELAH app.js: memakai DATA, saveActiveData,
// rebuildEquitySeries, recomputeAll, showConfirmModal, showNotifyModal, queueNotifyAfterReload.
(function(){
  // supabase-js (v1.1.139) dimuat malas: hanya saat Setelan dibuka, ada sesi tersimpan, atau URL berisi token/kode
  // (tautan reset password). Sebelumnya dimuat sinkron di <head> pada setiap pembukaan aplikasi.
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  let started = false, loading = false;
  function loadLib(){
    if(started || loading) return;
    if(window.supabase){ started = true; return syncMain(); }
    loading = true;
    const s = document.createElement('script');
    s.src = LIB;
    s.onload = () => { loading = false; started = true; syncMain(); };
    s.onerror = () => { loading = false; syncMain(); };   // syncMain menampilkan pesan gagal muat; buka Setelan lagi untuk mencoba ulang
    document.head.appendChild(s);
  }
  const needNow = () => { try{ return /access_token|type=recovery|[?&]code=/.test(location.hash + location.search) || Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)); }catch(e){ return false; } };
  document.querySelectorAll('#settingsGearBtn, [data-tab="setelan"]').forEach(b => b.addEventListener('click', loadLib));
  const gateOn = () => document.documentElement.classList.contains('gate-on');
  if(needNow() || gateOn()) loadLib();

  function syncMain(){
  const $ = id => document.getElementById(id);
  const cfg = window.SUPABASE_CONFIG || {};
  const noteEl = $('syncNote');
  const say = (msg, ok) => {
    noteEl.textContent = msg;
    noteEl.style.color = ok === true ? 'var(--gain)' : ok === false ? 'var(--loss)' : '';
  };
  const btns = ['syncLoginBtn','syncSignupBtn','syncLogoutBtn','syncPushBtn','syncPullBtn','syncForgotBtn','syncChangePassBtn'].map($);
  const setBusy = b => btns.forEach(x => { x.disabled = b; });
  btns.forEach(x => { x.disabled = false; });   // awal bersih (bila percobaan muat sebelumnya gagal)

  // ---- Halaman login (v1.1.146) ----
  const gate = $('loginGate'), lgNote = $('lgNote');
  let lgMode = 'login', lgBusy = false;
  const lgSay = (msg, kind) => { lgNote.textContent = msg; lgNote.className = 'lg-note' + (kind ? ' ' + kind : ''); };
  function gateShow(){ document.documentElement.classList.add('gate-on'); }
  function gateHide(){ document.documentElement.classList.remove('gate-on'); }
  function gateBusy(b){ lgBusy = b; ['lgSubmit','lgSkip','lgForgot'].forEach(i => { $(i).disabled = b; }); }
  function setMode(m){
    lgMode = m;
    $('lgTabLogin').classList.toggle('active', m === 'login'); $('lgTabLogin').setAttribute('aria-selected', m === 'login');
    $('lgTabSignup').classList.toggle('active', m === 'signup'); $('lgTabSignup').setAttribute('aria-selected', m === 'signup');
    $('lgPass2Wrap').hidden = m !== 'signup';
    $('lgForgot').hidden = m !== 'login';
    $('lgSubmit').textContent = m === 'login' ? 'Masuk' : 'Buat akun';
    $('lgPass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    lgSay('');
  }
  function skipGate(){ try{ localStorage.setItem('jurnalGateSkip', '1'); }catch(e){} gateHide(); }
  $('lgTabLogin').addEventListener('click', () => setMode('login'));
  $('lgTabSignup').addEventListener('click', () => setMode('signup'));
  $('lgSkip').addEventListener('click', skipGate);
  $('lgEye').addEventListener('click', () => {
    const show = $('lgPass').type === 'password';
    $('lgPass').type = show ? 'text' : 'password'; if($('lgPass2')) $('lgPass2').type = show ? 'text' : 'password';
    $('lgEye').textContent = show ? 'Sembunyi' : 'Lihat'; $('lgEye').setAttribute('aria-pressed', show);
    $('lgEye').setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  });
  gate.addEventListener('keydown', e => { if(e.key === 'Escape' && !lgBusy) skipGate(); });
  // Tanpa Supabase (library gagal dimuat / config kosong) halaman login tidak berguna: jurnal tetap bisa dipakai lokal.
  function gateUnavailable(msg){
    if(!gateOn()) return;
    lgSay(msg, 'err');
    ['lgSubmit','lgForgot'].forEach(i => { $(i).disabled = true; });
  }

  if(!window.supabase){
    say('Library Supabase gagal dimuat. Cek koneksi internet lalu muat ulang.', false);
    gateUnavailable('Tidak bisa terhubung ke layanan masuk. Cek koneksi internet, atau lanjut tanpa masuk.');
    btns.forEach(x => x.disabled = true); return;
  }
  if(!cfg.url || /ISI_/.test(cfg.url) || !cfg.anonKey){
    say('Isi url proyek Supabase di config.js dulu.', false);
    gateHide();
    btns.forEach(x => x.disabled = true); return;
  }
  gateBusy(false);   // tombol halaman login aktif setelah library siap
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  let session = null;

  const str = v => (v === null || v === undefined) ? '' : String(v);
  const num = v => (v === null || v === undefined || v === '') ? null : Number(v);
  const depKey = l => `${l.tanggal}|${l.tipe}|${Number(l.cent)}`;
  // Info sinkron terakhir (waktu perangkat), disimpan terpisah dari DATA supaya tidak ikut ekspor/impor JSON.
  const INFO_KEY = 'jurnalSyncInfo';
  const BLN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const p2 = n => String(n).padStart(2, '0');
  const fmtWhen = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}, ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const readInfo = () => { try{ return JSON.parse(localStorage.getItem(INFO_KEY)) || {}; }catch(e){ return {}; } };
  function showLast(){
    const i = readInfo();
    $('syncLastPush').textContent = i.push ? 'Terakhir disinkronkan: ' + fmtWhen(i.push) : 'Belum pernah disinkronkan dari browser ini.';
    $('syncLastPull').textContent = i.pull ? 'Terakhir dipulihkan: ' + fmtWhen(i.pull) : '';
  }
  function markSync(kind){
    try{ const i = readInfo(); i[kind] = new Date().toISOString(); localStorage.setItem(INFO_KEY, JSON.stringify(i)); }catch(e){}
    showLast();
    window.dispatchEvent(new Event('jurnalBackupChanged')); // segarkan status cadangan di app.js
  }
  const chunks = (a, n) => { const o = []; for(let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  const must = ({ error }) => { if(error) throw new Error(error.message); };

  function tradeRow(t, uid){
    return { user_id: uid, id: str(t.id), arah: str(t.arah), lot: num(t.lot), buka: num(t.buka), tutup: num(t.tutup),
      pips: num(t.pips), laba: num(t.laba), tanggal: str(t.tanggal), tanggal_gmt8: str(t.tanggal_gmt8),
      waktu_buka: str(t.waktu_buka), trigger: str(t.trigger), trigger_exit: str(t.trigger_exit),
      emosi: str(t.emosi), jenis_entry: str(t.jenis_entry), catatan: str(t.catatan) };
  }
  function depRow(l, uid){
    return { user_id: uid, tanggal: str(l.tanggal), tipe: str(l.tipe), jenis: str(l.jenis), usd: num(l.usd), cent: num(l.cent) };
  }
  async function fetchAll(table, cols){
    const out = [];
    for(let from = 0; ; from += 1000){
      const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
      if(error) throw new Error(error.message);
      out.push(...data);
      if(data.length < 1000) break;
    }
    return out;
  }

  function render(){
    const on = !!session;
    $('syncAuthBox').hidden = on;
    $('syncActionBox').hidden = !on;
    $('syncStatus').textContent = 'Belum masuk';
    $('syncUser').textContent = on ? 'Masuk sebagai ' + session.user.email : '';
    showLast();
  }

  // Satu jalur untuk form di Setelan dan halaman login; `from` memilih sumber isian dan tempat pesan.
  async function gateAuth(){
    const email = $('lgEmail').value.trim(), password = $('lgPass').value;
    if(!/^\S+@\S+\.\S+$/.test(email)){ lgSay('Isi alamat email yang valid.', 'err'); $('lgEmail').focus(); return; }
    if(password.length < 6){ lgSay('Password minimal 6 karakter.', 'err'); $('lgPass').focus(); return; }
    if(lgMode === 'signup' && password !== $('lgPass2').value){ lgSay('Ulangi password dengan sama persis.', 'err'); $('lgPass2').focus(); return; }
    gateBusy(true); lgSay('Memproses…');
    try{
      if(lgMode === 'signup'){
        const { data, error } = await sb.auth.signUp({ email, password });
        if(error) throw new Error(error.message);
        if(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0){ lgSay('Email ini sudah terdaftar. Pilih Masuk, atau gunakan Lupa password.', 'err'); return; }
        if(!data.session){ lgSay('Akun dibuat. Buka email Anda untuk konfirmasi, lalu pilih Masuk.', 'ok'); setMode('login'); lgSay('Akun dibuat. Buka email Anda untuk konfirmasi, lalu pilih Masuk.', 'ok'); return; }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if(error) throw new Error(/invalid login/i.test(error.message) ? 'Email atau password salah.' : error.message);
      }
      $('lgPass').value = ''; $('lgPass2').value = ''; lgSay('');
      // onAuthStateChange menutup halaman login
    }catch(e){ lgSay('Gagal: ' + e.message, 'err'); }
    finally{ gateBusy(false); }
  }
  async function gateForgot(){
    const email = $('lgEmail').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(email)){ lgSay('Isi email akun Anda dulu di kolom email.', 'err'); $('lgEmail').focus(); return; }
    if(!/^https?:$/.test(location.protocol)){ lgSay('Reset password butuh aplikasi dibuka lewat alamat web (http/https).', 'err'); return; }
    gateBusy(true); lgSay('Mengirim tautan…');
    try{
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if(error) throw new Error(error.message);
      lgSay('Jika email itu terdaftar, tautan reset sudah dikirim. Cek email (juga folder spam), ikuti tautannya, lalu isi password baru.', 'ok');
    }catch(e){ lgSay('Gagal: ' + e.message, 'err'); }
    finally{ gateBusy(false); }
  }
  $('lgForm').addEventListener('submit', e => { e.preventDefault(); if(!lgBusy) gateAuth(); });
  $('lgForgot').addEventListener('click', gateForgot);

  async function auth(kind){
    const email = $('syncEmail').value.trim(), password = $('syncPass').value;
    if(!email || password.length < 6){ say('Isi email dan password (minimal 6 karakter).', false); return; }
    setBusy(true); say('Memproses…');
    try{
      if(kind === 'signup'){
        const { data, error } = await sb.auth.signUp({ email, password });
        if(error) throw new Error(error.message);
        if(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0){ say('Email ini sudah terdaftar. Tekan Masuk, atau pakai Lupa password bila lupa.', false); return; }
        if(!data.session){ say('Akun dibuat. Buka email untuk konfirmasi, lalu tekan Masuk.', true); return; }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if(error) throw new Error(error.message);
      }
      $('syncPass').value = ''; say('');
    }catch(e){ say('Gagal: ' + e.message, false); }
    finally{ setBusy(false); }
  }

  async function push(){
    const uid = session.user.id;
    const trades = [...new Map(DATA.trades.map(t => [str(t.id), tradeRow(t, uid)])).values()];
    const deps = [...new Map(DATA.deposit.log.map(l => [depKey(l), depRow(l, uid)])).values()];
    const warn = (!trades.length && !deps.length) ? ' Browser ini KOSONG, jadi semua data di cloud akan terhapus.' : '';
    if(!await showConfirmModal(`Sinkronkan ${trades.length} transaksi & ${deps.length} deposit ke cloud? Data di cloud yang tidak ada di browser ini akan dihapus.${warn}`)) return;
    setBusy(true); say('Mengirim…');
    try{
      // Bila kolom `catatan` belum ada di Supabase (migrasi belum dijalankan), kirim ulang tanpa kolom itu supaya sinkron tetap jalan.
      let noCatatan = false;
      const stripCat = rows => rows.map(({ catatan, ...r }) => r);
      for(const c of chunks(trades, 500)){
        let res = await sb.from('trades').upsert(noCatatan ? stripCat(c) : c, { onConflict: 'user_id,id' });
        if(res.error && !noCatatan && /catatan/i.test(res.error.message)){ noCatatan = true; res = await sb.from('trades').upsert(stripCat(c), { onConflict: 'user_id,id' }); }
        must(res);
      }
      for(const c of chunks(deps, 500)) must(await sb.from('deposit_log').upsert(c, { onConflict: 'user_id,tanggal,tipe,cent' }));
      must(await sb.from('pengaturan').upsert({ user_id: uid, kurs: num(DATA.kurs) || 0 }, { onConflict: 'user_id' }));

      const localIds = new Set(trades.map(t => t.id));
      const gone = (await fetchAll('trades', 'id')).map(r => r.id).filter(id => !localIds.has(id));
      for(const c of chunks(gone, 100)) must(await sb.from('trades').delete().in('id', c));

      const localDep = new Set(deps.map(depKey));
      const goneDep = (await fetchAll('deposit_log', 'tanggal,tipe,cent')).filter(r => !localDep.has(depKey(r)));
      for(const r of goneDep) must(await sb.from('deposit_log').delete().eq('tanggal', r.tanggal).eq('tipe', r.tipe).eq('cent', r.cent));

      markSync('push');
      const lostCat = noCatatan ? trades.filter(t => t.catatan).length : 0;
      say(`Tersinkron: ${trades.length} transaksi, ${deps.length} deposit. Dihapus dari cloud: ${gone.length + goneDep.length}.` +
        (noCatatan ? ` Kolom "catatan" belum ada di Supabase, jadi catatan bebas${lostCat ? ` (${lostCat} transaksi)` : ''} belum ikut terkirim. Jalankan migrasi-catatan.sql di SQL Editor lalu sinkronkan lagi.` : ''), noCatatan ? false : true);
    }catch(e){ say('Gagal kirim: ' + e.message, false); }
    finally{ setBusy(false); }
  }

  async function pull(){
    setBusy(true); say('Mengambil…');
    try{
      const [tr, dp, cfgRows] = await Promise.all([
        fetchAll('trades', '*'), fetchAll('deposit_log', '*'), fetchAll('pengaturan', '*')
      ]);
      if(!tr.length && !dp.length){ say('Cloud masih kosong. Tidak ada yang dipulihkan.', false); return; }
      setBusy(false);
      if(!await showConfirmModal(`Timpa data browser ini dengan data cloud (${tr.length} transaksi, ${dp.length} deposit)? Cadangan JSON data sekarang didownload otomatis dulu.`)){ say(''); return; }
      setBusy(true);
      if(DATA.trades.length || DATA.deposit.log.length){
        downloadTextFile(`jurnal-xauusd-data-${dateStampNow()}-sebelum-tarik.json`, JSON.stringify(DATA, null, 2), 'application/json;charset=utf-8;');
      }
      const strCols = ['arah','tanggal','tanggal_gmt8','waktu_buka','trigger','trigger_exit','emosi','jenis_entry'];
      // Bila cloud belum punya kolom `catatan`, jangan hapus catatan lokal: pertahankan per ID.
      const cloudHasCat = !tr.length || ('catatan' in tr[0]);
      const localCat = new Map(DATA.trades.filter(t => t.catatan).map(t => [String(t.id), t.catatan]));
      DATA.trades = tr.map(r => { const t = { id: r.id }; ['arah','lot','buka','tutup','pips','laba','tanggal','tanggal_gmt8','waktu_buka','trigger','trigger_exit','emosi','jenis_entry']
        .forEach(k => { t[k] = strCols.includes(k) ? str(r[k]) : Number(r[k]); });
        const cat = cloudHasCat ? str(r.catatan) : (localCat.get(String(r.id)) || '');
        if(cat) t.catatan = cat;
        return t; })
        .sort((a, b) => a.tanggal_gmt8 < b.tanggal_gmt8 ? -1 : a.tanggal_gmt8 > b.tanggal_gmt8 ? 1 : 0);
      DATA.deposit.log = dp.map(r => ({ tanggal: r.tanggal, jenis: str(r.jenis), tipe: r.tipe, usd: Number(r.usd), cent: Number(r.cent) }))
        .sort((a, b) => a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0);
      if(cfgRows.length && cfgRows[0].kurs != null) DATA.kurs = Number(cfgRows[0].kurs);
      rebuildEquitySeries();
      recomputeAll();
      if(!saveActiveData(DATA)){ say('Gagal menyimpan ke penyimpanan lokal browser (penuh atau diblokir).', false); return; }
      markSync('pull');
      queueNotifyAfterReload(`Data dari cloud dimuat: ${tr.length} transaksi, ${dp.length} deposit.`, 'success');
      try{ sessionStorage.setItem('jurnalPendingTab', 'setelan'); }catch(e){}
      say('Tersimpan, memuat ulang…', true);
      setTimeout(() => location.reload(), 500);
    }catch(e){ say('Gagal ambil: ' + e.message, false); }
    finally{ setBusy(false); }
  }

  async function forgot(){
    const email = $('syncEmail').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(email)){ say('Isi email akun Anda dulu di kolom email di atas.', false); return; }
    if(!/^https?:$/.test(location.protocol)){ say('Reset password butuh aplikasi dibuka lewat alamat web (http/https), bukan berkas lokal.', false); return; }
    setBusy(true); say('Mengirim tautan…');
    try{
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if(error) throw new Error(error.message);
      say('Jika email itu terdaftar, tautan reset sudah dikirim. Buka email Anda (cek juga folder spam), ikuti tautannya, lalu Anda kembali ke sini untuk mengisi password baru.', true);
    }catch(e){ say('Gagal: ' + e.message, false); }
    finally{ setBusy(false); }
  }
  async function changePass(){
    const p1 = $('syncNewPass').value, p2 = $('syncNewPass2').value;
    if(p1.length < 6){ say('Password baru minimal 6 karakter.', false); return; }
    if(p1 !== p2){ say('Ulangi password baru dengan sama persis.', false); return; }
    setBusy(true); say('Menyimpan password…');
    try{
      const { error } = await sb.auth.updateUser({ password: p1 });
      if(error) throw new Error(error.message);
      $('syncNewPass').value = ''; $('syncNewPass2').value = '';
      say('Password berhasil diganti. Pakai password baru saat masuk berikutnya.', true);
    }catch(e){ say('Gagal ganti password: ' + e.message, false); }
    finally{ setBusy(false); }
  }
  // Setelah membuka tautan reset dari email, supabase-js memicu PASSWORD_RECOVERY dengan sesi sementara: arahkan ke form ganti password.
  function recoveryMode(){
    const gear = document.getElementById('settingsGearBtn'); if(gear) gear.click();
    if(window.showSetelanGroup) window.showSetelanGroup('akun');
    say('Tautan reset diterima. Isi password baru di bawah, lalu tekan Simpan password.', true);
    setTimeout(() => { const r = $('syncPassRow'); if(r && r.scrollIntoView) r.scrollIntoView({ block: 'center' }); $('syncNewPass').focus(); }, 350);
  }

  $('syncLoginBtn').addEventListener('click', () => auth('login'));
  $('syncForgotBtn').addEventListener('click', forgot);
  $('syncChangePassBtn').addEventListener('click', changePass);
  $('syncSignupBtn').addEventListener('click', () => auth('signup'));
  // Keluar: halaman login muncul lagi (pilihan "Lanjut tanpa masuk" dicabut). Data di perangkat ini tidak dihapus.
  // v1.1.148: Keluar memakai scope 'local' (cukup menghapus sesi di perangkat ini, tanpa panggilan jaringan yang bisa gagal),
  // lalu memastikan sesi benar-benar hilang. Sebelumnya signOut() global yang gagal (offline/token kedaluwarsa) membiarkan sesi tetap aktif tanpa pesan.
  async function doLogout(){
    try{ localStorage.removeItem('jurnalGateSkip'); }catch(e){}
    setBusy(true); say('Keluar…');
    try{ await sb.auth.signOut({ scope: 'local' }); }catch(e){}
    try{
      const { data } = await sb.auth.getSession();
      if(data && data.session){   // masih ada: hapus paksa kunci sesi lalu muat ulang agar klien bersih
        Object.keys(localStorage).filter(k => /^sb-.*-auth-token/.test(k)).forEach(k => localStorage.removeItem(k));
        say('Anda sudah keluar.', true); setTimeout(() => location.reload(), 300); return;
      }
    }catch(e){}
    session = null; render(); gateSync('SIGNED_OUT'); say('');
    setBusy(false);
  }
  $('syncLogoutBtn').addEventListener('click', doLogout);
  $('syncPushBtn').addEventListener('click', push);
  $('syncPullBtn').addEventListener('click', pull);
  const recoveryUrl = /access_token|type=recovery|[?&]code=/.test(location.hash + location.search);   // dibaca sebelum supabase-js membersihkan URL
  function gateSync(ev){
    if(session){ gateHide(); return; }
    if(ev === 'SIGNED_OUT'){ gateShow(); setMode('login'); lgSay('Anda sudah keluar.', ''); }
    else if(ev === 'INIT' && !recoveryUrl && localStorage.getItem('jurnalGateSkip') !== '1') gateShow();   // sesi tersimpan sudah kedaluwarsa
  }
  sb.auth.onAuthStateChange((ev, s) => { session = s; render(); gateSync(ev); if(ev === 'PASSWORD_RECOVERY'){ gateHide(); recoveryMode(); } });
  sb.auth.getSession().then(({ data }) => { session = data.session; render(); gateSync('INIT'); if(gateOn()) setTimeout(() => $('lgEmail').focus(), 50); });
  }
})();
