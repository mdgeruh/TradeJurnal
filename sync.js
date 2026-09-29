// Sinkron Supabase (v1.1.105). Dimuat SETELAH app.js: memakai DATA, saveActiveData,
// rebuildEquitySeries, recomputeAll, showConfirmModal, showNotifyModal, queueNotifyAfterReload.
(function(){
  const $ = id => document.getElementById(id);
  const cfg = window.SUPABASE_CONFIG || {};
  const noteEl = $('syncNote');
  const say = (msg, ok) => {
    noteEl.textContent = msg;
    noteEl.style.color = ok === true ? 'var(--gain)' : ok === false ? 'var(--loss)' : '';
  };
  const btns = ['syncLoginBtn','syncSignupBtn','syncLogoutBtn','syncPushBtn','syncPullBtn'].map($);
  const setBusy = b => btns.forEach(x => { x.disabled = b; });

  if(!window.supabase){
    say('Library Supabase gagal dimuat. Cek koneksi internet lalu muat ulang.', false);
    btns.forEach(x => x.disabled = true); return;
  }
  if(!cfg.url || /ISI_/.test(cfg.url) || !cfg.anonKey){
    say('Isi url proyek Supabase di config.js dulu.', false);
    btns.forEach(x => x.disabled = true); return;
  }
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

  async function auth(kind){
    const email = $('syncEmail').value.trim(), password = $('syncPass').value;
    if(!email || password.length < 6){ say('Isi email dan password (minimal 6 karakter).', false); return; }
    setBusy(true); say('Memproses…');
    try{
      if(kind === 'signup'){
        const { data, error } = await sb.auth.signUp({ email, password });
        if(error) throw new Error(error.message);
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

  $('syncLoginBtn').addEventListener('click', () => auth('login'));
  $('syncSignupBtn').addEventListener('click', () => auth('signup'));
  $('syncLogoutBtn').addEventListener('click', async () => { await sb.auth.signOut(); say(''); });
  $('syncPushBtn').addEventListener('click', push);
  $('syncPullBtn').addEventListener('click', pull);
  sb.auth.onAuthStateChange((_e, s) => { session = s; render(); });
  sb.auth.getSession().then(({ data }) => { session = data.session; render(); });
})();
