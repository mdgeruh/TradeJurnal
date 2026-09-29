// ---------- Penyimpanan lokal (localStorage) ----------
// Data aktif disimpan di localStorage browser supaya bertahan lintas kunjungan
// tanpa perlu download ulang file HTML tiap kali data diperbarui/diimpor.
// Tag #journal-data di bawah sengaja dikosongkan (skeleton kosong) supaya file
// tetap ringan — data yang sesungguhnya hidup di localStorage setelah impor
// pertama. Jika localStorage kosong (kunjungan pertama / browser baru), UI
// menampilkan status kosong dan menunggu impor JSON dari tab Setelan.
const JOURNAL_LS_KEY = 'jurnalXauusdData_v1';
function loadEmbeddedData(){
  return JSON.parse(document.getElementById('journal-data').textContent);
}
function loadActiveData(){
  try{
    const saved = localStorage.getItem(JOURNAL_LS_KEY);
    if(saved) return JSON.parse(saved);
  }catch(e){}
  return loadEmbeddedData();
}
function saveActiveData(data){
  try{
    localStorage.setItem(JOURNAL_LS_KEY, JSON.stringify(data));
    return true;
  }catch(e){
    return false;
  }
}
let DATA = loadActiveData();

// ---------- GMT+8 time helpers ----------
// Fixes "Hari Ini" / kalender mengikuti timezone browser atau UTC, bukan GMT+8 (acuan data).
// O3: cache per string tanggal (fungsi murni dari string, jadi edit/hapus transaksi tidak perlu invalidasi)
const _g8Cache = new Map();
function parseGmt8(iso){
  let v = _g8Cache.get(iso);
  if(v === undefined){
    if(_g8Cache.size > 20000) _g8Cache.clear();
    v = new Date(iso + '+08:00').getTime();
    _g8Cache.set(iso, v);
  }
  return v;
}
function gmt8NowParts(){
  const shifted = new Date(Date.now() + 8*3600*1000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth(), d: shifted.getUTCDate() };
}
function gmt8DayBounds(y,m,d){
  const start = Date.UTC(y,m,d,0,0,0) - 8*3600*1000;
  const end = start + 24*3600*1000 - 1;
  return [start,end];
}
function gmt8DateKeyFromParts(y,m,d){
  // v1.1.124: dinormalkan lewat Date.UTC supaya d ≤ 0 atau m di luar 0–11 tetap tanggal valid (chip 7/30 Hari sebelumnya menghasilkan "2026-09-00").
  const x = new Date(Date.UTC(y,m,d));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
}
const GMT8_NOW = gmt8NowParts();
const GMT8_TODAY_KEY = gmt8DateKeyFromParts(GMT8_NOW.y, GMT8_NOW.m, GMT8_NOW.d);

function buildLiveRanges(){
  const {y,m,d} = GMT8_NOW;
  const [todayStart, todayEnd] = gmt8DayBounds(y,m,d);
  const dow = (new Date(Date.UTC(y,m,d)).getUTCDay() + 6) % 7; // Senin=0
  const [weekStart] = gmt8DayBounds(y,m,d-dow);
  const [, weekEnd] = gmt8DayBounds(y,m,d-dow+6);
  const [lastWeekStart] = gmt8DayBounds(y,m,d-dow-7);
  const [, lastWeekEnd] = gmt8DayBounds(y,m,d-dow-1);
  const [monthStart] = gmt8DayBounds(y,m,1);
  const [, monthEnd] = gmt8DayBounds(y,m+1,0);
  const [lastMonthStart] = gmt8DayBounds(y,m-1,1);
  const [, lastMonthEnd] = gmt8DayBounds(y,m,0);
  const rolling90Start = todayEnd - 90*24*3600*1000;
  const [yearStart] = gmt8DayBounds(y,0,1);
  const [, yearEnd] = gmt8DayBounds(y,11,31);
  const [lastYearStart] = gmt8DayBounds(y-1,0,1);
  const [, lastYearEnd] = gmt8DayBounds(y-1,11,31);
  return [
    {label:'Hari Ini', start:todayStart, end:todayEnd},
    {label:'Minggu Ini', start:weekStart, end:weekEnd},
    {label:'Minggu Lalu', start:lastWeekStart, end:lastWeekEnd},
    {label:'Bulan Ini', start:monthStart, end:monthEnd},
    {label:'Bulan Lalu', start:lastMonthStart, end:lastMonthEnd},
    {label:'3 Bulan Terakhir (rolling)', start:rolling90Start, end:todayEnd},
    {label:'Tahun Ini', start:yearStart, end:yearEnd},
    {label:'Tahun Lalu', start:lastYearStart, end:lastYearEnd},
    {label:'All Time', start:Date.UTC(2000,0,1), end:Date.UTC(2100,0,1)}
  ];
}
function computeLivePeriods(ranges){
  return ranges.map(r=>{
    const matched = DATA.trades.filter(t=>{
      const tt = parseGmt8(t.tanggal_gmt8);
      return tt>=r.start && tt<=r.end;
    });
    const win = matched.filter(t=>t.laba>0).length;
    const pl = matched.reduce((s,t)=>s+t.laba,0);
    return {
      label: r.label,
      trans: matched.length,
      winrate: matched.length ? win/matched.length : 0,
      pl,
      pl_rp: pl/100*DATA.kurs
    };
  });
}
// ---------- Chip periode bersama (Ringkasan, Analisis PNL): 7H · 1B · 3B · 1T · All · Sesuaikan ----------
// Satu sumber label/arti: 7/30/90/365 hari bergulir sampai akhir hari ini (GMT+8); All = seluruh riwayat.
const PERIOD_PRESETS = [
  {key:'7h', label:'7H', days:7, long:'7 hari terakhir'},
  {key:'1b', label:'1B', days:30, long:'30 hari terakhir'},
  {key:'3b', label:'3B', days:90, long:'90 hari terakhir'},
  {key:'1t', label:'1T', days:365, long:'365 hari terakhir'},
  {key:'all', label:'All', long:'All Time'},
  {key:'custom', label:'Sesuaikan', long:'Kustom'}
];
function buildPeriodChips(el, opts){
  const { items, active, onSelect } = opts;
  el.innerHTML = items.map(r=>`<button type="button" class="lap-gran-btn${r.key===active?' active':''}" role="tab" aria-selected="${r.key===active}" data-key="${r.key}">${r.label}</button>`).join('');
  el.querySelectorAll('.lap-gran-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      el.querySelectorAll('.lap-gran-btn').forEach(b=>{ const on = b===btn; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
      onSelect(btn.dataset.key);
    });
  });
}
const LIVE_RANGES = buildLiveRanges();
const LIVE_PERIODS = computeLivePeriods(LIVE_RANGES);

const fmtCent = n => (n<0?'-':'') + Math.abs(n).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
// Tanda minus SEBELUM simbol ("-Rp 1.234"), sama seperti "-$1,00" di fmtMoney; pembulatan ke 0 tidak menampilkan "-Rp 0".
const fmtRp = n => { const r = Math.round(n); return (r<0?'-':'') + 'Rp ' + Math.abs(r).toLocaleString('id-ID'); };
const fmtPct = n => (n*100).toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%';

// ---------- Mata uang tampilan kartu hero (USD / USC / Rp) ----------
// Data internal tetap dalam sen (¢); 100¢ = 1 USD. USC = US cent (satuan asli akun cent), BUKAN USD Coin.
// Pilihan ini cuma mengubah tampilan kartu hero (saldo, PNL Kumulatif, snapshot PNL) di tab
// Ringkasan. Kalau USD/USC dipilih, estimasi rupiah (pakai DATA.kurs) ikut tampil.
const HERO_CURRENCIES = [{value:'USD',label:'USD'},{value:'USC',label:'USC (\u00a2)'},{value:'IDR',label:'Rp'}];
let HERO_CURRENCY = 'USD';
try{
  const savedCur = localStorage.getItem('jurnalHeroCurrency');
  if(savedCur==='USDC') HERO_CURRENCY = 'USC'; // nilai lama v1.1.71 (maksudnya US cent, bukan USD Coin)
  else if(HERO_CURRENCIES.some(o=>o.value===savedCur)) HERO_CURRENCY = savedCur;
}catch(e){}
// Formatter nominal umum (dipakai SEMUA tab, ikut pilihan mata uang di kartu hero).
// Input selalu sen (¢): USC = apa adanya, USD = ¢/100, Rp = ¢/100*kurs.
function fmtMoney(c){
  if(HERO_CURRENCY==='IDR') return fmtRp(c/100*DATA.kurs);
  if(HERO_CURRENCY==='USD') return (c<0?'-':'') + '$' + fmtCent(Math.abs(c)/100);
  return fmtCent(c) + '\u00a2';
}
// Versi tanpa simbol (sel tabel/kalender yang sudah punya header/unit). compact=true: Rp diringkas (rb/jt).
function fmtMoneyNum(c, compact){
  if(HERO_CURRENCY==='USC') return fmtCent(c);
  if(HERO_CURRENCY==='USD') return fmtCent(c/100);
  const rp = c/100*DATA.kurs, a = Math.abs(rp), sg = rp<0?'-':'';
  if(compact){
    if(a>=1e6) return sg + (a/1e6).toLocaleString('id-ID',{maximumFractionDigits:1}) + 'jt';
    if(a>=1e3) return sg + (a/1e3).toLocaleString('id-ID',{maximumFractionDigits:1}) + 'rb';
  }
  return sg + Math.round(a).toLocaleString('id-ID');
}
const curUnitSymbol = () => HERO_CURRENCY==='IDR' ? 'Rp' : (HERO_CURRENCY==='USD' ? '$' : '\u00a2');
// Label sumbu-Y kurva ekuitas: angka bulat ringkas, desimal hanya bila rentang sempit (USD).
function fmtAxisMoney(c, rangeCent){
  if(HERO_CURRENCY==='USC') return Math.round(c).toLocaleString('id-ID');
  if(HERO_CURRENCY==='USD'){
    const r = rangeCent/100, dec = r>=20 ? 0 : (r>=2 ? 1 : 2);
    return (c/100).toLocaleString('id-ID',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  }
  return fmtMoneyNum(c, true);
}
// Teks tersimpan di DATA (Rekor transaksi, catatan Max DD) selalu dalam ¢ — dikonversi saat ditampilkan.
function convCentText(str){
  return String(str).replace(/([+-]?)(\d[\d.]*,\d{2})\s*\u00a2/g, (m,sg,num)=>{
    const v = parseFloat(num.replace(/\./g,'').replace(',','.')) * (sg==='-'?-1:1);
    return (sg==='+' && v>=0 ? '+' : '') + fmtMoney(v);
  });
}
// Estimasi rupiah ringkas di bawah angka laba/rugi ("≈ Rp 501.435"). Di mode Rp kosong (sudah rupiah).
function approxRp(cent){
  if(HERO_CURRENCY==='IDR') return '';
  return `<span class="approx-rp">\u2248 ${fmtRp(cent/100*DATA.kurs)}</span>`;
}
let HERO_PNL = null; // diisi snapshot PNL (hari ini/7H/30H) begitu dihitung
const heroSign = n => n>=0 ? '+' : '';
// Nominal PNL bertanda dalam mata uang terpilih; USD/USC disertai estimasi rupiah.
function heroPlTxt(plCent, plRp){
  if(HERO_CURRENCY==='IDR') return heroSign(plRp) + fmtRp(plRp);
  const main = HERO_CURRENCY==='USC' ? fmtCent(plCent) + ' USC' : fmtCent(plCent/100) + ' USD';
  return heroSign(plCent) + main;
}
// Estimasi Rp sebagai sub-baris "≈ Rp xxx" (kosong di mode Rp karena angka utamanya sudah rupiah).
const heroRpSub = plRp => HERO_CURRENCY==='IDR' ? '' : '\u2248 ' + fmtRp(plRp);
function renderHeroMoney(){
  const idr = HERO_CURRENCY==='IDR';
  const saldo = DATA.summary.saldo_akhir;
  const saldoRp = saldo/100*DATA.kurs;
  const numEl = document.getElementById('heroSaldo');
  numEl.textContent = idr ? fmtRp(saldoRp) : (HERO_CURRENCY==='USC' ? fmtCent(saldo) : fmtCent(saldo/100));
  numEl.classList.toggle('long', idr);
  const approxEl = document.getElementById('heroSaldoRp');
  approxEl.textContent = idr ? '' : '\u2248 ' + fmtRp(saldoRp);
  approxEl.hidden = idr;

  // PNL Kumulatif — pakai DATA.summary (selalu direcompute recomputeAll()), bukan DATA.periods.
  const pl = DATA.summary.pl_cent, pl_rp = DATA.summary.pl_rp;
  const cls = pl>=0 ? 'up' : 'down';
  const pct = DATA.summary.pct_pl;
  const pctTxt = (pct===null || pct===undefined) ? '' : `<span class="${cls}">${pct>=0?'+':''}${fmtPct(pct)}</span> · `;
  document.getElementById('heroAllTime').innerHTML = `<span class="lbl">PNL Kumulatif</span>${pctTxt}<span class="val ${cls}">${heroPlTxt(pl, pl_rp)}</span>${idr ? '' : `<span class="hero-rp-sub">${heroRpSub(pl_rp)}</span>`}`;

  if(!HERO_PNL) return;
  const pctFmt = p => p===null ? '\u2013' : (p>=0?'+':'') + fmtPct(p);
  const mainPctEl = document.getElementById('pnlTodayPct');
  mainPctEl.textContent = pctFmt(HERO_PNL.today.pct);
  mainPctEl.className = 'pnl-main-pct ' + (HERO_PNL.today.pl>=0?'up':'down');
  document.getElementById('pnlTodayApprox').textContent = heroPlTxt(HERO_PNL.today.pl, HERO_PNL.today.pl_rp);
  const todayRpEl = document.getElementById('pnlTodayRp');
  todayRpEl.textContent = heroRpSub(HERO_PNL.today.pl_rp);
  todayRpEl.hidden = idr;
  document.getElementById('pnlGrid').innerHTML = [{lbl:'PNL 7H', m:HERO_PNL.d7},{lbl:'PNL 30H', m:HERO_PNL.d30}].map(r=>`
    <div class="pnl-cell">
      <div class="pnl-lbl">${r.lbl}</div>
      <div class="pnl-pct ${r.m.pl>=0?'up':'down'}">${pctFmt(r.m.pct)}</div>
      <div class="pnl-val">${heroPlTxt(r.m.pl, r.m.pl_rp)}</div>
      ${idr ? '' : `<div class="hero-rp-sub">${heroRpSub(r.m.pl_rp)}</div>`}
    </div>
  `).join('');
}

// ---------- Zona waktu tampilan (pilihan dropdown) ----------
// Timestamp "tanggal" di data (equity, deposit, tanggal transaksi) tercatat di waktu server broker (GMT+3, tanpa offset di string ISO-nya).
// tanggal_gmt8 sudah difiks ke GMT+8 dan tetap jadi acuan untuk kalender/periode (Hari Ini dsb). Dropdown ini hanya mengubah tampilan jam pada tabel.
const ID_BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const TZ_OPTIONS = [
  {value:180, label:'GMT+3 (Waktu Broker)'},
  {value:420, label:'WIB (GMT+7)'},
  {value:480, label:'WITA (GMT+8)'},
  {value:540, label:'WIT (GMT+9)'}
];
let CURRENT_TZ_OFFSET = 180;
try{
  const saved = localStorage.getItem('jurnalTzOffset');
  if(saved!==null && TZ_OPTIONS.some(o=>o.value===Number(saved))) CURRENT_TZ_OFFSET = Number(saved);
}catch(e){}

function baseToUtcMs(iso){ return new Date(iso + '+03:00').getTime(); }
function tzParts(ms, offsetMin){
  const s = new Date(ms + offsetMin*60000);
  return { y:s.getUTCFullYear(), mo:s.getUTCMonth(), d:s.getUTCDate(), h:s.getUTCHours(), mi:s.getUTCMinutes() };
}
const fmtDate = iso => {
  const p = tzParts(baseToUtcMs(iso), CURRENT_TZ_OFFSET);
  return `${String(p.d).padStart(2,'0')} ${ID_BULAN[p.mo]} ${p.y}`;
};
const fmtDateTime = iso => {
  const p = tzParts(baseToUtcMs(iso), CURRENT_TZ_OFFSET);
  return `${String(p.d).padStart(2,'0')} ${ID_BULAN[p.mo]} ${String(p.h).padStart(2,'0')}:${String(p.mi).padStart(2,'0')}`;
};
// waktu_buka disimpan dengan basis GMT+8 (sama seperti tanggal_gmt8), bukan basis broker GMT+3 seperti "tanggal" —
// jadi butuh konversi dasar +08:00, bukan +03:00, sebelum menerapkan offset zona waktu terpilih.
const fmtDateTimeGmt8 = iso => {
  const p = tzParts(new Date(iso + '+08:00').getTime(), CURRENT_TZ_OFFSET);
  return `${String(p.d).padStart(2,'0')} ${ID_BULAN[p.mo]} ${String(p.h).padStart(2,'0')}:${String(p.mi).padStart(2,'0')}`;
};
// Sama seperti fmtDateTimeGmt8 tapi tanggal saja (dipakai catatan max drawdown & rekor transaksi).
const fmtDateGmt8 = iso => {
  const p = tzParts(new Date(iso + '+08:00').getTime(), CURRENT_TZ_OFFSET);
  return `${String(p.d).padStart(2,'0')} ${ID_BULAN[p.mo]} ${p.y}`;
};

(function(){
  const wrap = document.getElementById('tzSelectWrap');
  const btn = document.getElementById('tzSelectBtn');
  const label = document.getElementById('tzSelectLabel');
  const list = document.getElementById('tzSelectList');

  function applyOffset(offset){
    CURRENT_TZ_OFFSET = offset;
    const opt = TZ_OPTIONS.find(o=>o.value===offset);
    label.textContent = opt ? opt.label : '—';
    list.querySelectorAll('li').forEach(li=>{
      const isActive = Number(li.dataset.value)===offset;
      li.classList.toggle('active', isActive);
      li.setAttribute('aria-selected', String(isActive));
    });
  }
  list.innerHTML = TZ_OPTIONS.map(o=>`<li role="option" tabindex="-1" data-value="${o.value}">${o.label}</li>`).join('');
  function openTz(focusIdx){
    document.querySelectorAll('.custom-select.open, .dt-picker.open').forEach(el=>{ if(el!==wrap) el.classList.remove('open'); });
    wrap.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    const li = [...list.querySelectorAll('li')];
    if(li.length){
      const idx = focusIdx==null ? Math.max(0, li.findIndex(x=>Number(x.dataset.value)===CURRENT_TZ_OFFSET)) : focusIdx;
      (li[idx]||li[0]).focus();
    }
  }
  function closeTz(returnFocus){
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    if(returnFocus) btn.focus();
  }
  list.addEventListener('keydown', (e)=>{
    const li = [...list.querySelectorAll('li')];
    const cur = li.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){ e.preventDefault(); (li[Math.min(cur+1, li.length-1)]||li[0]).focus(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); (li[Math.max(cur-1, 0)]||li[0]).focus(); }
    else if(e.key==='Home'){ e.preventDefault(); li[0] && li[0].focus(); }
    else if(e.key==='End'){ e.preventDefault(); li[li.length-1] && li[li.length-1].focus(); }
    else if(e.key==='Enter' || e.key===' '){ e.preventDefault(); li[cur] && li[cur].click(); }
    else if(e.key==='Tab'){ closeTz(false); }
  });
  btn.addEventListener('keydown', (e)=>{
    if((e.key==='ArrowDown' || e.key==='ArrowUp') && !wrap.classList.contains('open')){
      e.preventDefault(); openTz(e.key==='ArrowDown' ? 0 : undefined);
    }
  });
  list.querySelectorAll('li').forEach(li=>{
    li.addEventListener('click', (e)=>{
      e.stopPropagation();
      closeTz(false);
      const offset = Number(li.dataset.value);
      if(offset === CURRENT_TZ_OFFSET) return;
      applyOffset(offset);
      try{ localStorage.setItem('jurnalTzOffset', String(CURRENT_TZ_OFFSET)); }catch(e){}
      if(window.renderTrades) window.renderTrades();
      if(window.renderDepositLog) window.renderDepositLog();
      if(window.renderEquityChart) window.renderEquityChart();
    });
  });
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(wrap.classList.contains('open')) closeTz(false); else openTz();
  });
  document.addEventListener('click', (e)=>{
    if(!wrap.contains(e.target)) closeTz(false);
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && wrap.classList.contains('open')) closeTz(true);
  });
  applyOffset(CURRENT_TZ_OFFSET);
})();

// Self-heal saat halaman dibuka: recompute semua field turunan (saldo, statistik, rekor
// transaksi, catatan max DD, saldo Kalkulator) dari DATA.trades/deposit.log yang sebenarnya,
// lalu simpan ulang. Ini BUKAN cuma untuk data baru — localStorage yang sudah kadung
// menyimpan hasil recomputeAll() versi lama (sebelum v1.1.69, saat mm.equity/top_win/top_loss/
// maxdd_note belum ikut dihitung ulang) tidak otomatis terkoreksi hanya dengan membuka file
// versi baru; recompute+save di sini yang membetulkannya, sekali saat itu saja. Ditaruh
// setelah fmtCent/fmtDate/fmtDateGmt8/CURRENT_TZ_OFFSET siap (dipakai recomputeAll) tapi
// sebelum kartu Ringkasan/Rekor Transaksi/Kalkulator di bawah ini membaca DATA.
rebuildEquitySeries();
recomputeAll();
saveActiveData(DATA);

// ---------- Header ----------
document.getElementById('updatedLine').textContent = DATA.dashboard.update.replace('Update terakhir: ','');
renderHeroMoney();

// ---------- PNL snapshot (hari ini / 7H / 30H / sepanjang masa) ----------
(function(){
  // DATA.equity sudah kronologis (dibangun dari events.sort() di rebuildEquitySeries()),
  // jadi tidak perlu disalin & di-sort ulang di sini.
  const eqTimes = DATA.equity.map(p=>new Date(p[0]).getTime());
  // Binary search (data sudah terurut kronologis), bukan linear scan — konsisten dengan
  // pola nearestIndex() yang sudah dipakai kurva ekuitas untuk kebutuhan serupa (cari
  // titik pada/sebelum suatu waktu). Dipanggil 3x per load (Hari Ini/7H/30H).
  function equityAt(ts){
    let lo=0, hi=eqTimes.length-1, ans=-1;
    while(lo<=hi){
      const mid=(lo+hi)>>1;
      if(eqTimes[mid] <= ts){ ans=mid; lo=mid+1; } else hi=mid-1;
    }
    return ans===-1 ? 0 : DATA.equity[ans][1];
  }
  const todayRange = LIVE_RANGES.find(p=>p.label==='Hari Ini');
  const refEnd = todayRange.end;

  function rollingMetric(days){
    const start = refEnd - days*24*3600*1000;
    const matched = DATA.trades.filter(t=>{
      const tt = parseGmt8(t.tanggal_gmt8);
      return tt > start && tt <= refEnd;
    });
    const pl = matched.reduce((s,t)=>s+t.laba,0);
    const basis = equityAt(start);
    const pct = basis>0 ? pl/basis : null;
    return {pl, pct, pl_rp: pl/100*DATA.kurs};
  }

  const todayPeriod = LIVE_PERIODS.find(p=>p.label==='Hari Ini');
  const todayBasis = equityAt(todayRange.start);
  const todayPct = todayBasis>0 ? todayPeriod.pl/todayBasis : null;

  const metrics = {
    today: {pl: todayPeriod.pl, pct: todayPct, pl_rp: todayPeriod.pl_rp},
    d7: rollingMetric(7),
    d30: rollingMetric(30)
  };

  HERO_PNL = metrics;
  renderHeroMoney();

  const eyeBtn = document.getElementById('eyeToggle');
  const snapshotEl = document.getElementById('pnlSnapshot');
  eyeBtn.addEventListener('click', ()=>{
    const hidden = snapshotEl.classList.toggle('hidden-values');
    eyeBtn.textContent = hidden ? '\u25cc' : '\u25c9';
    eyeBtn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
  });
})();

// ---------- Periode Ringkasan: chip bulat (v1.1.134), default All ----------
let currentPeriodRange = null;
buildPeriodChips(document.getElementById('periodChips'), { items: PERIOD_PRESETS, active: 'all', onSelect: k=> selectPeriodKey(k) });
const customRangeEl = document.getElementById('customRange');
const customNote = document.getElementById('customNote');

// ---------- Stat strip: total transaksi s/d expectancy, mengikuti periode terpilih ----------
function computePeriodStats(matched){
  const total = matched.length;
  // Parse tanggal sekali per transaksi (decorate-sort-undecorate), bukan di dalam komparator
  // sort (yang sebelumnya memanggil parseGmt8 dua kali per perbandingan → O(n log n) parse).
  const sorted = matched
    .map(t=>({t, tt:parseGmt8(t.tanggal_gmt8)}))
    .sort((a,b)=> a.tt - b.tt)
    .map(x=>x.t);
  // Win count, gross profit, dan gross loss dihitung dalam satu pass (dulu: 1 filter+reduce
  // utk win, 1 filter+reduce terpisah utk loss — dua kali traversal penuh array).
  let winCount = 0, lossCount = 0, grossWin = 0, grossLoss = 0;
  for(const t of sorted){
    if(t.laba > 0){ winCount++; grossWin += t.laba; }
    else if(t.laba < 0){ lossCount++; grossLoss += -t.laba; }
  }
  const avgWin = winCount ? grossWin/winCount : 0;
  const avgLoss = lossCount ? grossLoss/lossCount : 0;
  const rr = avgLoss>0 ? avgWin/avgLoss : 0;
  const pf = grossLoss>0 ? grossWin/grossLoss : (grossWin>0 ? Infinity : 0);
  const pl = grossWin - grossLoss;
  const pl_rp = pl/100*DATA.kurs;
  const expectancy = total ? pl/total : 0;
  let running = 0, peak = 0, maxDD = 0;
  for(const t of sorted){
    running += t.laba;
    if(running > peak) peak = running;
    const dd = peak - running;
    if(dd > maxDD) maxDD = dd;
  }
  return { total, winrate: total? winCount/total : 0, pf, maxdd: maxDD, expectancy, pl, pl_rp, avgWin, avgLoss, rr, winCount, lossCount };
}
// Satu kartu stat strip: Transaksi & Win rate digabung dengan Laba/Rugi (+ sub-baris ≈ Rp),
// PF, Max DD, Expectancy — sebelumnya Transaksi & Win rate juga tampil terpisah di kartu
// period-detail di atas kurva ekuitas, jadi dobel dengan kartu ini.
function renderStatStrip(st){
  const pfTxt = st.total===0 ? '—' : (st.pf===Infinity ? '∞' : st.pf.toFixed(2).replace('.',',')+'x');
  document.getElementById('statStrip').innerHTML = `
    <div class="stat"><div class="stat-lbl">Transaksi</div><div class="stat-val">${st.total}</div></div>
    <div class="stat"><div class="stat-lbl">Win rate</div><div class="stat-val">${st.total? fmtPct(st.winrate) : '—'}</div></div>
    <div class="stat"><div class="stat-lbl">Laba/Rugi</div><div class="stat-val ${st.pl>=0?'up':'down'}">${st.pl>=0?'+':''}${fmtMoney(st.pl)}</div>${approxRp(st.pl)}</div>
    <div class="stat"><div class="stat-lbl">PF</div><div class="stat-val">${pfTxt}</div></div>
    <div class="stat"><div class="stat-lbl" title="Berbasis PNL (tanpa deposit/penarikan); beda dasar hitung dengan Drawdown ekuitas di kurva">Max DD (PNL)</div><div class="stat-val ${st.maxdd>0?'down':''}">-${fmtMoney(st.maxdd)}</div></div>
    <div class="stat"><div class="stat-lbl">Expectancy</div><div class="stat-val ${st.expectancy>=0?'up':'down'}">${st.expectancy>=0?'+':''}${fmtMoney(st.expectancy)}</div></div>
  `;
}

// ---------- Laporan: ringkasan performa + analisis psikologi trading, mengikuti periode terpilih ----------
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function groupByField(matched, field){
  const map = {};
  matched.forEach(t=>{
    const v = t[field];
    if(!v) return;
    if(!map[v]) map[v] = {name:v, count:0, win:0, pl:0, list:[]};
    map[v].count++;
    map[v].list.push(t);
    if(t.laba>0) map[v].win++;
    map[v].pl += t.laba;
  });
  return Object.values(map).sort((a,b)=> b.count - a.count);
}
function renderPsyGroup(containerId, rows, total, keepOrder, emptyMsg){
  const el = document.getElementById(containerId);
  if(!el) return;
  if(!rows.length){ el.innerHTML = `<div class="psy-empty">${emptyMsg || 'Belum ada transaksi dengan catatan ini pada periode terpilih.'}</div>`; return; }
  let maxCount = 0, tagged = 0;
  for(const r of rows){ if(r.count > maxCount) maxCount = r.count; tagged += r.count; }
  if(!keepOrder) rows = rows.slice().sort((a,b)=> b.pl - a.pl); // urut PNL terbesar → terkecil
  const cover = total==null ? '' : `<div class="psy-cover">${tagged} dari ${total} transaksi tercatat</div>`;
  el.innerHTML = cover + rows.map((r,i)=>{
    const wr = r.count ? r.win/r.count : 0;
    const barPct = maxCount ? (r.count/maxCount*100) : 0;
    return `<div class="psy-row"${r.list ? ` data-i="${i}" title="Ketuk untuk melihat transaksi"` : ''}><div class="psy-row-bar" style="width:${barPct}%"></div><div class="psy-row-content">
      <span class="psy-row-name">${escapeHtml(r.name)}${r.count<10 ? '<span class="psy-low" title="Kurang dari 10 transaksi: belum cukup untuk disimpulkan">n kecil</span>' : ''}</span>
      <span class="psy-row-metrics"><span><b>${r.count}</b>x</span><span>WR ${fmtPct(wr)}</span><span class="${r.pl>=0?'up':'down'}" title="Expectancy per transaksi">Exp ${r.pl>=0?'+':''}${fmtMoney(r.pl/r.count)}</span><span class="${r.pl>=0?'up':'down'}">${r.pl>=0?'+':''}${fmtMoney(r.pl)}</span></span>
    </div></div>`;
  }).join('');
  el._rows = rows;
  el.onclick = (e)=>{
    const row = e.target.closest('.psy-row[data-i]'); if(!row) return;
    const r = el._rows[+row.dataset.i];
    if(r && r.list && r.list.length && window.openListModal) window.openListModal(r.name, r.list);
  };
}
function deltaTag(cur, prev, fmt, lowerBetter){
  if(prev==null || !isFinite(cur) || !isFinite(prev)) return '';
  const d = cur - prev;
  if(Math.abs(d) < 1e-9) return '<span class="stat-delta">= sama</span>';
  const good = lowerBetter ? d<0 : d>0;
  return `<span class="stat-delta ${good?'up':'down'}">${d>0?'\u25B2':'\u25BC'} ${fmt(Math.abs(d))}</span>`;
}
function renderLaporan(matched, label, prev){
  const labelEl = document.getElementById('laporanPeriodLabel');
  if(labelEl) labelEl.textContent = label || '—';
  const st = computePeriodStats(matched || []);
  const stripEl = document.getElementById('laporanStatStrip');
  if(stripEl){
    const pfTxt = st.total===0 ? '—' : (st.pf===Infinity ? '∞' : st.pf.toFixed(2).replace('.',',')+'x');
    const pv = prev || null;
    const ppFmt = v=> fmtPct(v).replace('%',' pp');
    const rrTxt = st.rr>0 ? st.rr.toFixed(2).replace('.',',') : '—';
    const kpiEl = document.getElementById('lapKpi');
    if(kpiEl){
      kpiEl.innerHTML = `
        <div class="stat"><div class="stat-lbl">Laba bersih</div><div class="stat-val ${st.pl>=0?'up':'down'}">${st.total? (st.pl>=0?'+':'')+fmtMoney(st.pl) : '—'}</div>${st.total? approxRp(st.pl) : ''}${pv? deltaTag(st.pl, pv.pl, fmtMoney) : ''}</div>
        <div class="stat"><div class="stat-lbl">Win rate</div><div class="stat-val">${st.total? fmtPct(st.winrate) : '—'}</div>${pv? deltaTag(st.winrate, pv.winrate, ppFmt) : ''}</div>
        <div class="stat"><div class="stat-lbl">PF</div><div class="stat-val">${pfTxt}</div>${pv? deltaTag(st.pf, pv.pf, v=>v.toFixed(2).replace('.',',')+'x') : ''}</div>
        <div class="stat"><div class="stat-lbl">Max DD</div><div class="stat-val ${st.maxdd>0?'down':''}">${st.maxdd>0?'-':''}${fmtMoney(st.maxdd)}</div>${approxRp(-st.maxdd)}<span class="approx-rp" id="lapKpiDDPct"></span>${pv? deltaTag(st.maxdd, pv.maxdd, fmtMoney, true) : ''}</div>`;
      let noteEl = document.getElementById('laporanDeltaNote');
      if(!noteEl){ noteEl = document.createElement('div'); noteEl.id = 'laporanDeltaNote'; noteEl.className = 'lap-delta-note'; kpiEl.insertAdjacentElement('afterend', noteEl); }
      noteEl.textContent = pv ? '▲/▼ = selisih dibanding periode sebelumnya (hijau = membaik).' : (lap2Gran==='all' ? 'All Time mencakup seluruh riwayat, jadi tidak ada periode pembanding. Pilih Harian/Mingguan/Bulanan untuk melihat selisih.' : 'Tidak ada transaksi di periode sebelumnya untuk dibandingkan.');
    }
    stripEl.innerHTML = `
      <div class="stat"><div class="stat-lbl">Expectancy</div><div class="stat-val ${st.expectancy>=0?'up':'down'}">${st.expectancy>=0?'+':''}${fmtMoney(st.expectancy)}</div>${approxRp(st.expectancy)}</div>
      <div class="stat"><div class="stat-lbl">Rata-rata menang</div><div class="stat-val up">${st.winCount? '+'+fmtMoney(st.avgWin) : '—'}</div>${st.winCount? approxRp(st.avgWin) : ''}</div>
      <div class="stat"><div class="stat-lbl">Rata-rata kalah</div><div class="stat-val down">${st.lossCount? '-'+fmtMoney(st.avgLoss) : '—'}</div><span class="approx-rp">RR 1 : ${rrTxt} (menang ÷ kalah)</span></div>
    `;
  }
  const matchedArr = matched || [];
  renderPsyGroup('laporanTriggerEntry', groupByField(matchedArr, 'trigger'), matchedArr.length);
  renderPsyGroup('laporanTriggerExit', groupByField(matchedArr, 'trigger_exit'), matchedArr.length);
  renderPsyGroup('laporanEmosi', groupByField(matchedArr, 'emosi'), matchedArr.length);
  renderPsyGroup('laporanJenisEntry', groupByField(matchedArr, 'jenis_entry'), matchedArr.length);
}
window.renderLaporan = renderLaporan;

function psyRow(name, list){
  let win=0, pl=0;
  for(const t of list){ if(t.laba>0) win++; pl += t.laba; }
  return {name, count:list.length, win, pl, list};
}
// L16: silang psikologi. Matriks dua dimensi (Expectancy per sel); hanya tampil bila cakupan catatan >= 30% transaksi periode.
const LAP_MX_PAIRS = [['es','Emosi \u00d7 Trigger entry'],['js','Jenis entry \u00d7 Sesi']];
const LAP_MX_MIN_COVER = 0.3, LAP_MX_MAX = 8;
let lapMxPair = 'es', lapMxList = [], lapMxCells = null;
function lapMxSesi(t){
  if(!t.waktu_buka) return '';
  const d = new Date(parseGmt8(t.waktu_buka) + 8*3600000); if(isNaN(d)) return '';
  const i = lapSessionIdx(d.getUTCHours()); return i < 0 ? '' : LAP_SESSIONS[i][0];
}
function drawLapMx(){
  const el = document.getElementById('lapMx'), modeEl = document.getElementById('lapMxMode'), noteEl = document.getElementById('lapMxNote');
  if(!el || !modeEl || !noteEl) return;
  const arr = lapMxList || [], n = arr.length, noted = arr.filter(hasNote).length;
  modeEl.innerHTML = LAP_MX_PAIRS.map(m=>`<button type="button" class="hm-btn${m[0]===lapMxPair?' on':''}" data-m="${m[0]}">${m[1]}</button>`).join('');
  modeEl.onclick = e => { const b = e.target.closest('.hm-btn'); if(!b) return; lapMxPair = b.dataset.m; drawLapMx(); };
  lapMxCells = null; el.onclick = null;
  if(!n || noted/n < LAP_MX_MIN_COVER){
    el.innerHTML = `<div class="psy-empty">Catatan psikologi baru ${noted} dari ${n} transaksi (${n ? Math.round(noted/n*100) : 0}%); matriks tampil bila \u2265 ${Math.round(LAP_MX_MIN_COVER*100)}%. Isi lewat tab Transaksi \u2192 \u201cSimpan & lanjut\u201d.</div>`;
    noteEl.textContent = ''; return;
  }
  const es = lapMxPair === 'es';
  const rf = es ? (t=>t.emosi||'') : (t=>t.jenis_entry||''), cf = es ? (t=>t.trigger||'') : lapMxSesi;
  const map = {}, rc = {}, cc = {}; let used = 0;
  for(const t of arr){
    const r = rf(t), c = cf(t); if(!r || !c) continue;
    (map[r+'\u0001'+c] || (map[r+'\u0001'+c] = [])).push(t); rc[r] = (rc[r]||0)+1; cc[c] = (cc[c]||0)+1; used++;
  }
  const byCnt = o => Object.keys(o).sort((a,b)=>o[b]-o[a] || a.localeCompare(b));
  let rows = byCnt(rc), cols = es ? byCnt(cc) : LAP_SESSIONS.map(s=>s[0]).filter(c=>cc[c]);
  const cut = rows.length > LAP_MX_MAX || cols.length > LAP_MX_MAX;
  rows = rows.slice(0, LAP_MX_MAX); cols = cols.slice(0, LAP_MX_MAX);
  if(!used || !rows.length || !cols.length){
    el.innerHTML = '<div class="psy-empty">Belum ada transaksi dengan kedua atribut tercatat pada periode ini.</div>'; noteEl.textContent = ''; return;
  }
  const cells = []; let mx = 0;
  for(const r of rows) for(const c of cols){ const l = map[r+'\u0001'+c]; if(l){ const pl = l.reduce((a,t)=>a+t.laba,0); mx = Math.max(mx, Math.abs(pl/l.length)); } }
  let h = '<table><thead><tr><th></th>' + cols.map(c=>`<th>${escapeHtml(c)}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach(r=>{
    h += `<tr><th class="rl">${escapeHtml(r)}</th>`;
    cols.forEach(c=>{
      const l = map[r+'\u0001'+c];
      if(!l){ h += '<td class="empty"></td>'; return; }
      const e = l.reduce((a,t)=>a+t.laba,0)/l.length, i = cells.push({title: r+' \u00d7 '+c, list:l}) - 1;
      h += `<td data-i="${i}" class="${l.length<HEAT_LOW_N?'low':''}" style="${heatBg(e,'exp',mx)}" title="Ketuk untuk melihat transaksi"><b class="${e>=0?'up':'down'}">${e>=0?'+':''}${escapeHtml(fmtMoney(e))}</b><small>n ${l.length}</small></td>`;
    });
    h += '</tr>';
  });
  el.innerHTML = h + '</tbody></table>';
  lapMxCells = cells;
  el.onclick = e => { const td = e.target.closest('td[data-i]'); if(!td || !lapMxCells) return; const c = lapMxCells[+td.dataset.i]; if(c && window.openListModal) window.openListModal(c.title, c.list); };
  noteEl.textContent = `Sel = Expectancy per transaksi; n kecil (< ${HEAT_LOW_N}) diberi garis putus-putus. Hanya ${used} dari ${n} transaksi yang kedua atributnya tercatat (cakupan catatan ${Math.round(noted/n*100)}%).` + (cut ? ` Ditampilkan ${LAP_MX_MAX} baris/kolom terbanyak.` : '') + ' Ketuk sel untuk melihat daftar transaksinya.';
}
const HEAT_DAYS = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
const HEAT_MODES = [['pnl','PNL'],['wr','Win rate'],['exp','Expectancy'],['n','Jumlah']];
const HEAT_LOW_N = 5; // sel dengan transaksi < 5 ditandai sampel kecil
// Sesi pasar menurut jam BUKA (GMT+8), batas tetap tanpa penyesuaian DST: [nama, jam mulai, jam selesai (eksklusif)].
// Jam selesai < jam mulai = melewati tengah malam. Ketiganya menutup 24 jam tanpa tumpang tindih, jadi tiap transaksi masuk tepat satu sesi.
const LAP_SESSIONS = [['Asia',6,15],['London',15,20],['New York',20,6]];
function lapSessionIdx(h){ return LAP_SESSIONS.findIndex(s=> s[1] < s[2] ? (h>=s[1] && h<s[2]) : (h>=s[1] || h<s[2])); }
const lapSessionName = i => { const s = LAP_SESSIONS[i], p2 = n=>String(n).padStart(2,'0'); return `${s[0]} (${p2(s[1])}\u2013${p2(s[2])})`; };
let lapHeatMode = 'pnl', lapHeatData = null, heatSel = null;
function heatLabel(k){
  const p2 = n=>String(n).padStart(2,'0');
  if(k==='g') return 'Semua jam & hari';
  if(k[0]==='r') return HEAT_DAYS[+k.slice(1)] + ' (semua jam)';
  if(k[0]==='c') return 'Jam ' + p2(+k.slice(1)*2) + '–' + p2(+k.slice(1)*2+2) + ' (semua hari)';
  return HEAT_DAYS[Math.floor(+k/12)] + ' ' + p2((+k%12)*2) + '–' + p2((+k%12)*2+2);
}
function heatVal(a, mode){
  if(!a || !a.n) return null;
  return mode==='pnl' ? a.pl : (mode==='exp' ? a.pl/a.n : (mode==='wr' ? a.win/a.n : a.n));
}
function heatText(v, mode, mx){
  if(v==null) return '';
  if(mode==='wr') return Math.round(v*100) + '%';
  if(mode==='n') return String(v);
  return fmtAxisMoney(v, mx);
}
function heatBg(v, mode, mx){
  if(v==null) return '';
  let cv, pct;
  if(mode==='n'){ cv = '--paper'; pct = 12 + 55*v/(mx||1); }
  else if(mode==='wr'){ cv = v>=0.5 ? '--gain' : '--loss'; pct = 20 + 80*Math.abs(v-0.5)*2; }
  else { cv = v>=0 ? '--gain' : '--loss'; pct = 25 + 75*Math.abs(v)/(mx||1); }
  return `background:color-mix(in srgb, var(${cv}) ${Math.round(pct)}%, transparent)`;
}
function drawLapHeat(){
  const D = lapHeatData, heatEl = document.getElementById('lapHeat'), infoEl = document.getElementById('lapHeatInfo');
  if(!heatEl || !infoEl) return;
  if(!D || !D.used){
    heatEl.innerHTML = '<div class="psy-empty">Belum ada transaksi dengan waktu buka pada periode ini.</div>';
    infoEl.textContent = ''; heatEl.onclick = null; return;
  }
  const mode = lapHeatMode, add = (t,c)=>{ t.n+=c.n; t.pl+=c.pl; t.win+=c.win; t.list.push(...c.list); };
  const look = {}, rows = [], cols = [], grand = {n:0,pl:0,win:0,list:[]};
  for(let i=0;i<7;i++) rows.push({n:0,pl:0,win:0,list:[]});
  for(let i=0;i<12;i++) cols.push({n:0,pl:0,win:0,list:[]});
  for(const k in D.cell){ const c = D.cell[k]; add(rows[Math.floor(k/12)], c); add(cols[k%12], c); add(grand, c); look[k] = c; }
  rows.forEach((a,i)=>{ look['r'+i] = a; }); cols.forEach((a,i)=>{ look['c'+i] = a; }); look.g = grand;
  let mxC = 0, mxT = 0;
  for(const k in look){
    const v = heatVal(look[k], mode); if(v==null) continue;
    const m = mode==='wr' ? 0 : Math.abs(v);
    if(/^\d+$/.test(k)) mxC = Math.max(mxC, m); else mxT = Math.max(mxT, m);
  }
  const box = (k, tot)=>{
    const a = look[k], v = heatVal(a, mode), mx = tot ? mxT : mxC;
    const txt = v==null ? '' : ` data-v="${escapeHtml(heatText(v, mode, mx))}"`;
    return `<div class="hc${tot?' ht':''}${a && a.n && a.n<HEAT_LOW_N ? ' low' : ''}" data-k="${k}"${txt} style="${heatBg(v, mode, mx)}"></div>`;
  };
  let h = '<div class="lap-heat-mode">' + HEAT_MODES.map(m=>`<button type="button" class="hm-btn${m[0]===mode?' on':''}" data-m="${m[0]}">${m[1]}</button>`).join('') + '</div>';
  h += `<div class="hm-cap">Metrik: ${HEAT_MODES.find(m=>m[0]===mode)[1]}</div><div class="lap-heat"><div></div>`;
  for(let b=0;b<12;b++) h += `<div class="hh">${b*2}</div>`;
  h += '<div class="hh">Σ</div>';
  for(let dw=0; dw<7; dw++){
    h += `<div class="hl">${HEAT_DAYS[dw]}</div>`;
    for(let b=0;b<12;b++) h += box(dw*12+b, false);
    h += box('r'+dw, true);
  }
  h += '<div class="hl">Σ</div>';
  for(let b=0;b<12;b++) h += box('c'+b, true);
  h += box('g', true) + '</div>';
  const leg = mode==='wr' ? 'Rugi (WR &lt; 50%)</span><i></i><span>Profit (WR &gt; 50%)</span><span>· warna penuh = 0% / 100%'
    : mode==='n' ? 'Sedikit</span><i style="background:linear-gradient(90deg,var(--line-soft),var(--paper))"></i><span>Banyak</span><span>· warna penuh = ' + mxC + ' transaksi'
    : 'Rugi</span><i></i><span>Profit</span><span>· warna penuh = ±' + escapeHtml(fmtMoney(mxC));
  heatEl.innerHTML = h + `<div class="lap-heat-legend"><span>${leg}</span></div><div class="psy-cover" style="margin-top:6px;">Garis putus-putus = kurang dari ${HEAT_LOW_N} transaksi (sampel kecil). Σ = total per hari / per jam.</div>`;
  const base = `${D.used} dari ${D.total} transaksi punya waktu buka. Ketuk sel untuk detail.`;
  heatSel = null; infoEl.textContent = base;
  heatEl.onclick = (e)=>{
    const btn = e.target.closest('.hm-btn');
    if(btn){ lapHeatMode = btn.dataset.m; drawLapHeat(); return; }
    const el = e.target.closest('.hc'); if(!el) return;
    heatEl.querySelectorAll('.hc.sel').forEach(x=>x.classList.remove('sel'));
    el.classList.add('sel');
    const k = el.dataset.k, a = look[k], lbl = heatLabel(k);
    const sgn = v=>(v>=0?'+':'') + fmtMoney(v);
    heatSel = a && a.n ? {title: lbl, list: a.list} : null;
    infoEl.innerHTML = a && a.n ? `${lbl}: ${a.n} transaksi, WR ${fmtPct(a.win/a.n)}, PNL ${sgn(a.pl)}, Exp ${sgn(a.pl/a.n)}${a.n<HEAT_LOW_N ? ' · sampel kecil' : ''} <button type="button" class="hm-link">Lihat transaksi</button>` : `${lbl}: tidak ada transaksi`;
  };
  infoEl.onclick = (e)=>{ if(e.target.closest('.hm-link') && heatSel && window.openListModal) window.openListModal(heatSel.title, heatSel.list); };
}
// ---------- L7: drawdown (underwater) dari kurva ekuitas akun ----------
// Puncak ekuitas digeser oleh deposit/penarikan (bukan untung/rugi), sama seperti Max DD % di blok Return.
// Episode drawdown = dari puncak sampai ekuitas kembali ke (atau melewati) puncak itu.
// ---------- L12: rolling expectancy & win rate (jendela N transaksi terakhir, urut waktu tutup) ----------
let lapRollWin = 30, lapRollData = null;
function computeLapRoll(arr, W){
  const n = arr.length, pts = [];
  if(n < W) return {W, n, pts};
  let sum = 0, win = 0;
  for(let i=0;i<n;i++){
    sum += arr[i].laba; if(arr[i].laba>0) win++;
    if(i>=W){ sum -= arr[i-W].laba; if(arr[i-W].laba>0) win--; }
    if(i>=W-1) pts.push({n:i+1, exp:sum/W, wr:win/W});
  }
  const tot = arr.reduce((a,t)=>a+t.laba,0), tw = arr.filter(t=>t.laba>0).length;
  return {W, n, pts, allExp: tot/n, allWr: tw/n};
}
function drawLapRoll(){
  const D = lapRollData, box = document.getElementById('lapRollBox'); if(!box || !D) return;
  const modeEl = document.getElementById('lapRollMode'), stEl = document.getElementById('lapRollStats'), noteEl = document.getElementById('lapRollNote');
  modeEl.innerHTML = [30,50].map(w=>`<button type="button" class="hm-btn${w===lapRollWin?' on':''}" data-w="${w}">${w} transaksi</button>`).join('');
  modeEl.onclick = e=>{ const b = e.target.closest('.hm-btn'); if(!b) return; lapRollWin = +b.dataset.w; lapRollData = computeLapRoll(lapRollData.arr, lapRollWin); lapRollData.arr = D.arr; drawLapRoll(); };
  if(D.pts.length < 2){ stEl.innerHTML = ''; box.innerHTML = ''; noteEl.textContent = `Butuh minimal ${D.W + 1} transaksi pada periode ini untuk tren rolling ${D.W} transaksi (ada ${D.n}).`; return; }
  const P = D.pts, last = P[P.length-1], sg = v=>(v>=0?'+':'') + fmtMoney(v), cls = v=>v>=0?'up':'down';
  let bst = P[0], wst = P[0]; for(const p of P){ if(p.exp>bst.exp) bst = p; if(p.exp<wst.exp) wst = p; }
  const card = (l,v,sub)=>`<div class="stat"><div class="stat-lbl">${l}</div><div class="stat-val ${cls(v)}">${escapeHtml(sg(v))}</div><span class="approx-rp">${sub}</span></div>`;
  stEl.innerHTML = card(`Expectancy ${D.W} terakhir`, last.exp, `WR ${fmtPct(last.wr)}`) + card('Seluruh periode', D.allExp, `WR ${fmtPct(D.allWr)} · n=${D.n}`) + card('Jendela terbaik', bst.exp, `s.d. trx ke-${bst.n}`) + card('Jendela terburuk', wst.exp, `s.d. trx ke-${wst.n}`);
  const W = Math.round(box.clientWidth); if(!W) return; // tab tersembunyi: digambar ulang lewat ResizeObserver
  const H = 150, padL = 50, padR = 8, padT = 10, padB = 20, plotW = W-padL-padR, plotH = H-padT-padB;
  let yMin = 0, yMax = 0; for(const p of P){ if(p.exp<yMin) yMin = p.exp; if(p.exp>yMax) yMax = p.exp; }
  if(yMax - yMin < 1e-9){ yMax += 1; yMin -= 1; }
  const n0 = P[0].n, n1 = last.n, x = n => padL + (n - n0)/(n1 - n0)*plotW, y = v => padT + plotH - (v - yMin)/(yMax - yMin)*plotH, rng = yMax - yMin;
  const path = P.map((p,i)=>`${i?'L':'M'}${x(p.n).toFixed(1)},${y(p.exp).toFixed(1)}`).join('');
  const ax = [yMax, 0, yMin].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<text x="${padL-6}" y="${(y(v)+3.5).toFixed(1)}" text-anchor="end">${escapeHtml(fmtAxisMoney(v, rng))}</text>`).join('');
  box.innerHTML = `<svg id="lapRollChart" role="img" aria-label="${escapeHtml(`Expectancy rolling ${D.W} transaksi, dari transaksi ke-${n0} sampai ke-${n1}`)}" viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;overflow:visible;">
    <g fill="var(--paper-faint)" font-size="9" font-family="IBM Plex Mono,monospace">${ax}<text x="${padL}" y="${H-5}">trx ${n0}</text><text x="${W-padR}" y="${H-5}" text-anchor="end">trx ${n1}</text></g>
    <line x1="${padL}" x2="${W-padR}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="var(--paper-faint)" stroke-width="1" stroke-dasharray="3,3"/>
    <path d="${path}" fill="none" stroke="var(--gold)" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="${x(n1).toFixed(1)}" cy="${y(last.exp).toFixed(1)}" r="3" fill="var(--gold)"/>
    <line id="lapRollHoverLine" x1="0" y1="${padT}" x2="0" y2="${padT+plotH}" stroke="var(--paper-faint)" stroke-width="1" stroke-dasharray="2,3" opacity="0"/>
    <circle id="lapRollHoverDot" r="3.5" fill="var(--gold)" opacity="0"/>
    <rect id="lapRollHoverArea" x="${padL}" y="0" width="${plotW}" height="${H}" fill="transparent"/>
  </svg><div class="eq-tooltip" id="lapRollTip"></div>`;
  noteEl.textContent = `Garis = expectancy rata-rata per transaksi pada ${D.W} transaksi terakhir di tiap titik (urut waktu tutup); garis putus-putus = 0. Win rate jendela terakhir ada di kartu.`;
  const rArr = D.arr;
  function rNearest(px){
    const nAt = n0 + (px-padL)/plotW*(n1-n0);
    let lo=0, hi=P.length-1;
    while(lo<hi){ const mid=(lo+hi)>>1; if(P[mid].n<nAt) lo=mid+1; else hi=mid; }
    return lo;
  }
  ChartHover.attach({
    svg: document.getElementById('lapRollChart'), hoverArea: document.getElementById('lapRollHoverArea'), W, H,
    resolveIndex: px => Math.max(0, Math.min(P.length-1, rNearest(px))),
    posX: i => x(P[i].n),
    dots: [{ el: document.getElementById('lapRollHoverDot'), y: i => y(P[i].exp) }],
    hoverLine: { el: document.getElementById('lapRollHoverLine') },
    tooltip: { el: document.getElementById('lapRollTip'), top: i => y(P[i].exp), html: i => {
      const p = P[i], tr = rArr && rArr[p.n-1];
      const dateTxt = tr ? escapeHtml(lapFmtDate(parseGmt8(tr.tanggal_gmt8))) : '';
      return `<span class="t-date">s.d. trx #${p.n}${dateTxt?' \u00b7 '+dateTxt:''}</span>` + ttJoin([`Exp: ${p.exp>=0?'+':''}${fmtMoney(p.exp)}`, `WR: ${fmtPct(p.wr)}`]);
    } },
    touchPreventDefault: true
  });
}
// ---------- L13: Beli vs Jual berdampingan (mengabaikan filter Arah; periode dan filter lain tetap berlaku) ----------
function lapArahStat(list){
  let gw = 0, gl = 0, lots = 0, nl = 0;
  for(const t of list){ if(t.laba>0) gw += t.laba; else if(t.laba<0) gl -= t.laba; if(+t.lot>0){ lots += +t.lot; nl++; } }
  return {pf: gl>0 ? gw/gl : (gw>0 ? Infinity : null), lot: nl ? lots/nl : null};
}
function renderLapArahSplit(){
  const beli = lap2NoArah.filter(t=>t.arah==='Beli'), jual = lap2NoArah.filter(t=>t.arah==='Jual');
  renderPsyGroup('lapArahSplit', [psyRow('Beli', beli), psyRow('Jual', jual)].filter(r=>r.count), lap2NoArah.length, true, 'Belum ada transaksi pada periode ini.');
  const sb = lapArahStat(beli), sj = lapArahStat(jual);
  const pf = v => v==null ? '\u2014' : (v===Infinity ? '\u221e' : v.toFixed(2).replace('.',',') + 'x'), lot = v => v==null ? '\u2014' : v.toFixed(2).replace('.',',');
  const c = (l,v)=>`<div class="stat"><div class="stat-lbl">${l}</div><div class="stat-val">${v}</div></div>`;
  document.getElementById('lapArahStats').innerHTML = c('PF Beli', pf(sb.pf)) + c('PF Jual', pf(sj.pf)) + c('Lot rata-rata Beli', lot(sb.lot)) + c('Lot rata-rata Jual', lot(sj.lot));
  document.getElementById('lapArahNote').textContent = lap2Arah==='semua' ? '' : 'Blok ini membandingkan kedua arah, jadi filter Arah di atas tidak berlaku di sini (periode dan filter lain tetap).';
}
// ---------- L14: distribusi hasil per transaksi (PNL; 10% terbaik/terburuk = ceil(10% x n) transaksi, n >= 10) ----------
let lapDistData = null;
function computeLapDist(arr){
  const v = arr.map(t=>t.laba).filter(x=>isFinite(x)).sort((a,b)=>a-b), n = v.length;
  if(n < 10) return {n};
  const pct = p => { const i = (n-1)*p, lo = Math.floor(i), hi = Math.ceil(i); return v[lo] + (v[hi]-v[lo])*(i-lo); };
  const k = Math.max(1, Math.ceil(n*0.1)), sum = l=>l.reduce((a,x)=>a+x,0);
  const gp = v.reduce((a,x)=>x>0?a+x:a,0), gl = v.reduce((a,x)=>x<0?a-x:a,0);
  const topSum = sum(v.slice(-k)), botSum = -sum(v.slice(0,k));
  return {n, k, v, min:v[0], max:v[n-1], med:pct(.5), p10:pct(.1), p90:pct(.9), gp, gl, net:gp-gl, topSum, botSum,
          topShare: gp>0 ? Math.max(0,topSum)/gp : null, botShare: gl>0 ? Math.max(0,botSum)/gl : null};
}
function drawLapDist(){
  const D = lapDistData, box = document.getElementById('lapDistBox'), stEl = document.getElementById('lapDist'), noteEl = document.getElementById('lapDistNote');
  if(!box || !D) return;
  if(!D.v){ stEl.innerHTML = ''; box.innerHTML = ''; noteEl.textContent = `Butuh minimal 10 transaksi pada periode ini (ada ${D.n}).`; return; }
  const sg = v=>(v>=0?'+':'') + fmtMoney(v), cls = v=>v>=0?'up':'down';
  const card = (l,val,sub,c)=>`<div class="stat"><div class="stat-lbl">${l}</div><div class="stat-val ${c||''}">${val}</div>${sub?`<span class="approx-rp">${sub}</span>`:''}</div>`;
  const pc = v=>v==null ? '\u2014' : fmtPct(v);
  stEl.innerHTML = card('Median', escapeHtml(sg(D.med)), '', cls(D.med)) + card('P10 (terburuk)', escapeHtml(sg(D.p10)), '', cls(D.p10)) + card('P90 (terbaik)', escapeHtml(sg(D.p90)), '', cls(D.p90))
    + card(`${D.k} menang terbesar`, pc(D.topShare), 'dari laba kotor') + card(`${D.k} rugi terbesar`, pc(D.botShare), 'dari rugi kotor') + card('Laba bersih tanpa itu', escapeHtml(sg(D.net - D.topSum)), `tanpa ${D.k} menang terbesar`, cls(D.net - D.topSum));
  noteEl.textContent = 'Percentile dihitung dari PNL per transaksi. Batang = jumlah transaksi per rentang PNL; merah = rentang rugi, hijau = rentang untung.';
  const W = Math.round(box.clientWidth); if(!W) return; // tab tersembunyi: digambar ulang lewat ResizeObserver
  if(D.max - D.min < 1e-9){ box.innerHTML = '<div class="psy-empty">Semua transaksi berhasil sama.</div>'; return; }
  const H = 130, padL = 8, padR = 8, padT = 8, padB = 22, plotW = W-padL-padR, plotH = H-padT-padB, B = 12, w = (D.max-D.min)/B, cnt = new Array(B).fill(0);
  for(const x of D.v) cnt[Math.min(B-1, Math.floor((x-D.min)/w))]++;
  const mxC = Math.max(...cnt), bw = plotW/B, rng = D.max - D.min, xv = v => padL + (v - D.min)/rng*plotW;
  const bars = cnt.map((c,i)=>{
    const lo = D.min + i*w, hi = lo + w, h = c/mxC*plotH, loss = (lo+hi)/2 < 0;
    return `<rect ${loss?'class="lap-bar-loss" ':''}x="${(padL+i*bw+1).toFixed(1)}" y="${(padT+plotH-h).toFixed(1)}" width="${Math.max(1,bw-2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${loss?'var(--loss)':'var(--gain)'}" opacity="0.85"/>`;
  }).join('');
  const zero = D.min < 0 && D.max > 0 ? `<line x1="${xv(0).toFixed(1)}" x2="${xv(0).toFixed(1)}" y1="${padT}" y2="${padT+plotH}" stroke="var(--paper-faint)" stroke-width="1" stroke-dasharray="3,3"/><text x="${xv(0).toFixed(1)}" y="${H-6}" text-anchor="middle">0</text>` : '';
  box.innerHTML = `<svg id="lapDistChart" role="img" aria-label="${escapeHtml(`Histogram PNL per transaksi, ${D.n} transaksi, dari ${fmtMoney(D.min)} sampai ${fmtMoney(D.max)}`)}" viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;overflow:visible;">${bars}${zero}
    <g fill="var(--paper-faint)" font-size="9" font-family="IBM Plex Mono,monospace"><text x="${padL}" y="${H-6}">${escapeHtml(fmtAxisMoney(D.min, rng))}</text><text x="${W-padR}" y="${H-6}" text-anchor="end">${escapeHtml(fmtAxisMoney(D.max, rng))}</text></g>
    <rect id="lapDistHoverBar" x="0" y="${padT}" width="${bw}" height="${plotH}" fill="var(--gold)" opacity="0" style="pointer-events:none;"/>
    <rect id="lapDistHoverArea" x="${padL}" y="0" width="${plotW}" height="${H}" fill="transparent"/></svg><div class="eq-tooltip" id="lapDistTip"></div>`;
  const distHiBar = document.getElementById('lapDistHoverBar');
  ChartHover.attach({
    svg: document.getElementById('lapDistChart'), hoverArea: document.getElementById('lapDistHoverArea'), W, H,
    resolveIndex: px => Math.max(0, Math.min(B-1, Math.floor((px-padL)/bw))),
    posX: i => padL + (i+0.5)*bw,
    dots: [],
    tooltip: { el: document.getElementById('lapDistTip'), top: () => padT, html: i => {
      const lo = D.min + i*w, hi = lo + w, c = cnt[i], pct = D.n ? c/D.n : 0;
      return `<span class="t-date">${escapeHtml(fmtMoney(lo))} s.d. ${escapeHtml(fmtMoney(hi))}</span>` + ttJoin([`${c} transaksi`, `${fmtPct(pct)} dari total`]);
    } },
    onShow: i => { distHiBar.setAttribute('x', padL+i*bw+1); distHiBar.setAttribute('width', Math.max(1,bw-2)); distHiBar.style.opacity = 0.16; },
    onHide: () => { distHiBar.style.opacity = 0; },
    touchPreventDefault: true
  });
}
let lapDDData = null;
function ttJoin(parts){ return parts.filter(Boolean).join(' \u00b7 '); }
function lapFmtDur(ms){
  const m = Math.max(0, Math.round(ms/60000));
  if(m >= 1440) return Math.round(m/1440) + ' hari';
  if(m >= 60) return Math.round(m/60) + ' jam';
  return Math.max(1, m) + ' mnt';
}
function lapFmtDate(ts){ return lap2DayLabel(ts) + ' ' + new Date(ts + 8*3600000).getUTCFullYear(); }
function computeLapDD(range){
  const eq = DATA.equity || [], mk = DATA.modal_kumulatif || [];
  const series = []; let peak = null;
  for(let i=0;i<eq.length;i++){
    const ts = parseGmt8(eq[i][0]); if(ts > range.end) break;
    const flow = (mk[i]||0) - (i ? (mk[i-1]||0) : 0);
    if(peak !== null) peak += flow;
    const bal = eq[i][1];
    if(ts < range.start){ peak = bal; continue; }
    if(peak === null || bal > peak) peak = bal;
    series.push({ts, bal, peak, i});
  }
  const episodes = []; let cur = null;
  for(let i=0;i<series.length;i++){
    const p = series[i], dd = p.peak - p.bal;
    if(dd > 1e-9){
      const pct = p.peak > 0 ? Math.min(1, dd/p.peak) : 1;
      if(!cur) cur = {start: i>0 ? series[i-1].ts : p.ts, end:null, depthPct:0, depth:0, troughTs:p.ts};
      if(pct > cur.depthPct || (pct === cur.depthPct && dd > cur.depth)){ cur.depthPct = pct; cur.depth = dd; cur.troughTs = p.ts; }
    } else if(cur){ cur.end = p.ts; episodes.push(cur); cur = null; }
  }
  const last = series.length ? series[series.length-1] : null;
  let now = null;
  if(cur){ cur.ongoing = true; episodes.push(cur); now = {pct: last.peak>0 ? Math.min(1,(last.peak-last.bal)/last.peak) : 1, since: cur.start, ts: last.ts}; }
  return {series, episodes, last, now};
}
function drawLapDD(){
  const box = document.getElementById('lapDDBox'); if(!box || !lapDDData) return;
  const {series} = lapDDData;
  if(series.length < 2){ box.innerHTML = '<div class="psy-empty">Belum cukup data ekuitas pada periode ini.</div>'; return; }
  const W = Math.round(box.clientWidth); if(!W) return; // tab tersembunyi: digambar ulang lewat ResizeObserver
  const H = 170, padL = 50, padR = 8, padT = 10, padB = 22, plotW = W-padL-padR, plotH = H-padT-padB;
  let yMin = Infinity, yMax = -Infinity;
  for(const p of series){ if(p.bal < yMin) yMin = p.bal; if(p.peak > yMax) yMax = p.peak; }
  if(yMax - yMin < 1e-9){ yMax += 1; yMin -= 1; }
  const t0 = series[0].ts, t1 = series[series.length-1].ts;
  const x = ts => t1===t0 ? padL + plotW/2 : padL + (ts - t0)/(t1 - t0)*plotW;
  const y = v => padT + plotH - (v - yMin)/(yMax - yMin)*plotH;
  const peakPts = series.map(p=>`${x(p.ts).toFixed(1)},${y(p.peak).toFixed(1)}`);
  const eqPts = series.map(p=>`${x(p.ts).toFixed(1)},${y(p.bal).toFixed(1)}`);
  const area = peakPts.concat(eqPts.slice().reverse()).join(' ');
  const rng = yMax - yMin;
  const ax = [yMax, (yMax+yMin)/2, yMin].map(v=>`<text x="${padL-6}" y="${(y(v)+3.5).toFixed(1)}" text-anchor="end">${escapeHtml(fmtAxisMoney(v, rng))}</text>`).join('');
  const grid = [yMax, (yMax+yMin)/2, yMin].map(v=>`<line x1="${padL}" x2="${W-padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`).join('');
  const aria = `Kurva ekuitas dengan arsiran drawdown, ${lapFmtDate(t0)} sampai ${lapFmtDate(t1)}`;
  box.innerHTML = `
    <div style="position:relative;"><svg role="img" aria-label="${escapeHtml(aria)}" viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;">
      <defs><pattern id="lapDDHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.6" height="5" fill="var(--loss)"/></pattern></defs>
      <g stroke="var(--line-soft)" stroke-width="1">${grid}</g>
      <polygon points="${area}" fill="var(--loss)" fill-opacity="0.22"/>
      <polygon points="${area}" fill="url(#lapDDHatch)" fill-opacity="0.55"/>
      <polyline points="${peakPts.join(' ')}" fill="none" stroke="var(--paper-faint)" stroke-width="1" stroke-dasharray="3,3"/>
      <polyline points="${eqPts.join(' ')}" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-linejoin="round"/>
      <g fill="var(--paper-faint)" font-size="10" font-family="'IBM Plex Mono',monospace">${ax}
        <text x="${padL}" y="${H-6}" text-anchor="start">${escapeHtml(lapFmtDate(t0))}</text>
        <text x="${W-padR}" y="${H-6}" text-anchor="end">${escapeHtml(lapFmtDate(t1))}</text></g>
      <line id="lapDDHoverLine" x1="0" y1="${padT}" x2="0" y2="${padT+plotH}" stroke="var(--paper-faint)" stroke-width="1" stroke-dasharray="2,3" opacity="0"/>
      <circle id="lapDDHoverDot" r="3.5" fill="var(--gold)" opacity="0"/>
      <rect id="lapDDHoverArea" x="${padL}" y="0" width="${plotW}" height="${H}" fill="transparent"/>
    </svg><div class="eq-tooltip" id="lapDDTip"></div></div>
    <div class="psy-cover" style="margin-top:4px;">Garis emas = ekuitas; garis putus-putus = puncak berjalan; area arsir = drawdown. Arahkan kursor / ketuk grafik untuk detail.</div>`;
  // L15: tooltip hover (titik data terdekat menurut waktu)
  const ser = series, nearest = px => {
    const tq = t0 + (px - padL)/plotW*(t1 - t0); let lo = 0, hi = ser.length-1;
    while(hi - lo > 1){ const m = (lo+hi) >> 1; if(ser[m].ts <= tq) lo = m; else hi = m; }
    return Math.abs(ser[lo].ts - tq) <= Math.abs(ser[hi].ts - tq) ? lo : hi;
  };
  ChartHover.attach({
    svg: box.querySelector('svg'), hoverArea: box.querySelector('#lapDDHoverArea'), W, H,
    resolveIndex: px => t1===t0 ? 0 : nearest(Math.max(padL, Math.min(W-padR, px))),
    posX: i => x(ser[i].ts),
    dots: [{ el: box.querySelector('#lapDDHoverDot'), y: i => y(ser[i].bal) }],
    hoverLine: { el: box.querySelector('#lapDDHoverLine') },
    tooltip: { el: box.querySelector('#lapDDTip'), top: i => y(ser[i].bal), html: i => {
      const p = ser[i], dd = p.peak - p.bal, pc = p.peak > 0 ? Math.min(1, dd/p.peak) : 1;
      const rpTxt = HERO_CURRENCY!=='IDR' ? `<span>\u2248 ${fmtRp(p.bal/100*DATA.kurs)}</span>` : '';
      return `<span class="t-date">${escapeHtml(lapFmtDate(p.ts))}</span>` + ttJoin([`Ekuitas: ${fmtMoney(p.bal)}`, rpTxt, `Puncak: ${fmtMoney(p.peak)}`, `<span class="${dd>0?'down':'up'}">${dd>0 ? `Drawdown: -${fmtPct(pc)} (-${fmtMoney(dd)})` : 'Di puncak'}</span>`]);
    } },
touchPreventDefault: true
  });
}
function renderLapDD(){
  const d = lapDDData, el = document.getElementById('lapDD'), listEl = document.getElementById('lapDDList'), noteEl = document.getElementById('lapDDNote');
  if(!el) return;
  const fin = d.episodes.filter(e=>e.depthPct > 0);
  if(!d.series.length || !fin.length){
    el.innerHTML = d.series.length
      ? '<div class="stat"><div class="stat-lbl">Drawdown saat ini</div><div class="stat-val up">Di puncak</div></div>'
      : '';
    listEl.innerHTML = d.series.length ? '<div class="psy-empty">Tidak ada drawdown pada periode ini.</div>' : '<div class="psy-empty">Belum ada data ekuitas pada periode ini.</div>';
    drawLapDD(); if(noteEl) noteEl.textContent = ''; return;
  }
  const lastTs = d.last.ts;
  const dur = e => (e.end !== null ? e.end : lastTs) - e.start;
  const deepest = fin.reduce((a,e)=> e.depthPct > a.depthPct ? e : a, fin[0]);
  const longest = fin.reduce((a,e)=> dur(e) > dur(a) ? e : a, fin[0]);
  const rec = deepest.end !== null ? lapFmtDur(deepest.end - deepest.troughTs) : 'belum pulih';
  el.innerHTML = `
    <div class="stat"><div class="stat-lbl">DD terdalam</div><div class="stat-val down">-${fmtPct(deepest.depthPct)}</div><span class="approx-rp">-${fmtMoney(deepest.depth)}</span></div>
    <div class="stat"><div class="stat-lbl">Durasi DD terpanjang</div><div class="stat-val">${lapFmtDur(dur(longest))}</div><span class="approx-rp">${longest.ongoing ? 'masih berlangsung' : lapFmtDate(longest.start) + ' \u2192 ' + lapFmtDate(longest.end)}</span></div>
    <div class="stat"><div class="stat-lbl">Waktu pulih (DD terdalam)</div><div class="stat-val ${deepest.end===null?'down':''}">${rec}</div><span class="approx-rp">${deepest.end!==null ? 'titik terendah \u2192 puncak baru' : 'belum kembali ke puncak'}</span></div>
    <div class="stat"><div class="stat-lbl">DD saat ini</div><div class="stat-val ${d.now?'down':'up'}">${d.now ? '-'+fmtPct(d.now.pct) : 'Di puncak'}</div><span class="approx-rp">${d.now ? 'sejak ' + lapFmtDate(d.now.since) : 'ekuitas di puncak'}</span></div>`;
  const top = fin.slice().sort((a,b)=>b.depthPct - a.depthPct).slice(0,3);
  const mx = top[0].depthPct || 1;
  listEl.innerHTML = top.map(e=>`<div class="psy-row"><div class="psy-row-bar" style="width:${(e.depthPct/mx*100).toFixed(0)}%"></div><div class="psy-row-content">
      <span class="psy-row-name">${lapFmtDate(e.start)} \u2192 ${e.end!==null ? lapFmtDate(e.end) : 'sekarang'}</span>
      <span class="psy-row-metrics"><span class="down">-${fmtPct(e.depthPct)}</span><span>-${fmtMoney(e.depth)}</span><span>${lapFmtDur(dur(e))}</span><span>${e.end!==null ? 'pulih ' + lapFmtDur(e.end - e.troughTs) : 'belum pulih'}</span></span>
    </div></div>`).join('');
  if(noteEl) noteEl.textContent = 'Berdasarkan ekuitas akun (tidak terpengaruh filter Arah); deposit/penarikan menggeser puncak, bukan dihitung sebagai untung/rugi. Durasi = dari puncak sampai ekuitas kembali ke puncak itu; waktu pulih = dari titik terendah sampai puncak baru.';
  drawLapDD();
}
function renderLapLanjut(matched, range){
  const pairs = matched.map(t=>({t, tt:parseGmt8(t.tanggal_gmt8)})).sort((a,b)=>a.tt-b.tt);
  const arr = pairs.map(x=>x.t);
  lapRollData = computeLapRoll(arr, lapRollWin); lapRollData.arr = arr; drawLapRoll();
  renderLapArahSplit();
  lapDistData = computeLapDist(arr); drawLapDist();
  // B1: streak + kondisi setelah menang/rugi
  let bestW=0, bestL=0, cur=0, curType=0;
  const afterWin=[], afterLoss=[];
  arr.forEach((t,i)=>{
    const type = t.laba>0 ? 1 : (t.laba<0 ? -1 : 0);
    if(type!==0 && type===curType) cur++; else { cur = type!==0 ? 1 : 0; curType = type; }
    if(type===1 && cur>bestW) bestW = cur;
    if(type===-1 && cur>bestL) bestL = cur;
    if(i>0){ const pv = arr[i-1].laba; if(pv>0) afterWin.push(t); else if(pv<0) afterLoss.push(t); }
  });
  const curTxt = curType===0 ? '—' : `${cur}x ${curType>0?'menang':'rugi'}`;
  document.getElementById('lapStreak').innerHTML = `
    <div class="stat"><div class="stat-lbl">Menang beruntun</div><div class="stat-val up">${bestW||'—'}</div></div>
    <div class="stat"><div class="stat-lbl">Rugi beruntun</div><div class="stat-val down">${bestL||'—'}</div></div>
    <div class="stat"><div class="stat-lbl">Streak saat ini</div><div class="stat-val ${curType>0?'up':(curType<0?'down':'')}">${curTxt}</div></div>`;
  renderPsyGroup('lapStreakAfter', [psyRow('Setelah menang', afterWin), psyRow('Setelah rugi', afterLoss)].filter(r=>r.count), null, true);
  renderPsyGroup('lapAfterLoss', groupByField(afterLoss, 'emosi'), afterLoss.length);
  lapMxList = matched; drawLapMx(); // L16: silang psikologi
  // B2: heatmap jam x hari (waktu_buka, GMT+8, bin 2 jam); render di drawLapHeat()
  const cell = {}; let used = 0;
  const sessList = LAP_SESSIONS.map(()=>[]); // L9: kelompok per sesi pasar (alternatif bin 2 jam)
  for(const t of matched){
    if(!t.waktu_buka) continue;
    const d = new Date(parseGmt8(t.waktu_buka) + 8*3600000);
    if(isNaN(d)) continue;
    const k = ((d.getUTCDay()+6)%7)*12 + Math.floor(d.getUTCHours()/2);
    const c = cell[k] || (cell[k] = {n:0, pl:0, win:0, list:[]});
    c.n++; c.pl += t.laba; if(t.laba>0) c.win++; c.list.push(t); used++;
    sessList[lapSessionIdx(d.getUTCHours())].push(t);
  }
  lapHeatData = {cell, used, total: matched.length};
  drawLapHeat();
  renderPsyGroup('lapSession', LAP_SESSIONS.map((s,i)=>psyRow(lapSessionName(i), sessList[i])).filter(r=>r.count), matched.length, true, 'Belum ada transaksi dengan waktu buka pada periode ini.');
  const sessNote = document.getElementById('lapSessionNote');
  if(sessNote) sessNote.textContent = 'Batas jam tetap (GMT+8, tanpa penyesuaian DST): Asia 06\u201315, London 15\u201320, New York 20\u201306 (termasuk tumpang tindih London\u2013New York). Perkiraan kasar; jam buka riil tiap sesi bergeser mengikuti DST. Ketuk baris untuk melihat transaksinya.';
  // B3: durasi posisi vs hasil
  const bins = [['< 5 menit',5],['5–30 menit',30],['30 mnt – 2 jam',120],['2 – 12 jam',720],['> 12 jam',Infinity]];
  const binList = bins.map(()=>[]);
  for(const x of pairs){
    if(!x.t.waktu_buka) continue;
    const m = (x.tt - parseGmt8(x.t.waktu_buka))/60000;
    if(!(m>=0)) continue;
    binList[bins.findIndex(b=>m<b[1])].push(x.t);
  }
  renderPsyGroup('lapDur', bins.map((b,i)=>psyRow(b[0], binList[i])).filter(r=>r.count), matched.length, true);
  // B4: return % & Max DD % terhadap modal bersih di akhir periode
  const st = computePeriodStats(matched);
  let modal = null;
  const eq = DATA.equity || [], mk = DATA.modal_kumulatif || [];
  for(let i=0;i<eq.length;i++){ if(parseGmt8(eq[i][0]) <= range.end) modal = mk[i]; else break; }
  // Max DD % dari puncak ekuitas ke titik terendah; deposit/penarikan menggeser puncak (bukan dianggap untung/rugi)
  let ddPct = 0, peak = null, wiped = false;
  for(let i=0;i<eq.length;i++){
    const ts = parseGmt8(eq[i][0]); if(ts > range.end) break;
    const flow = (mk[i]||0) - (i ? (mk[i-1]||0) : 0);
    if(peak !== null) peak += flow;
    const bal = eq[i][1];
    if(ts < range.start){ peak = bal; continue; }
    if(peak === null || bal > peak) peak = bal;
    if(peak > 0){ const d = (peak - bal)/peak; if(d > ddPct) ddPct = d; }
    if(bal <= 0 && st.total > 0) wiped = true;
  }
  if(ddPct > 1) ddPct = 1;
  const ok = modal>0 && st.total>0;
  // KPI Max DD di atas: tambahkan persentase dari kurva ekuitas (nominal KPI berbasis PNL, jadi dua angka ini beda dasar hitung).
  const ddPctEl = document.getElementById('lapKpiDDPct');
  if(ddPctEl) ddPctEl.textContent = (ok && ddPct > 0) ? '-' + fmtPct(ddPct) + ' dari puncak ekuitas' : '';
  document.getElementById('lapReturn').innerHTML = `
    <div class="stat"><div class="stat-lbl">Return periode</div><div class="stat-val ${st.pl>=0?'up':'down'}">${ok ? (st.pl>=0?'+':'')+fmtPct(st.pl/modal) : '—'}</div></div>
    <div class="stat"><div class="stat-lbl">Max DD</div><div class="stat-val ${st.maxdd>0?'down':''}">${ok ? '-'+fmtPct(ddPct) : '—'}</div></div>
    <div class="stat"><div class="stat-lbl">Modal bersih</div><div class="stat-val">${modal>0 ? fmtMoney(modal) : '—'}</div></div>`;
  // L7: drawdown (underwater) + durasi & waktu pulih
  lapDDData = computeLapDD(range);
  renderLapDD();
  // L5: lot & ukuran posisi (deteksi menaikkan lot setelah rugi / martingale / revenge sizing)
  const lotOf = t => { const v = parseFloat(t.lot); return v>0 ? v : 0; };
  const avgLot = list => { const a = list.map(lotOf).filter(v=>v>0); return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; };
  const fmtLot = v => v>0 ? v.toFixed(2).replace('.',',') : '\u2014';
  const lotAll = avgLot(arr), lotW = avgLot(afterWin), lotL = avgLot(afterLoss);
  const lotRatio = (lotW>0 && lotL>0) ? lotL/lotW : null;
  const lotUp = [], lotFlat = [];
  for(let i=1;i<arr.length;i++){
    if(!(arr[i-1].laba<0)) continue;
    const p = lotOf(arr[i-1]), c = lotOf(arr[i]);
    if(!(p>0 && c>0)) continue;
    (c >= p*1.25 ? lotUp : lotFlat).push(arr[i]);
  }
  const lotEl = document.getElementById('lapLot');
  if(lotEl) lotEl.innerHTML = `
    <div class="stat"><div class="stat-lbl">Lot rata-rata</div><div class="stat-val">${fmtLot(lotAll)}</div></div>
    <div class="stat"><div class="stat-lbl">Setelah menang</div><div class="stat-val">${fmtLot(lotW)}</div></div>
    <div class="stat"><div class="stat-lbl">Setelah rugi</div><div class="stat-val ${lotRatio!==null && lotRatio>=1.2 ? 'down' : ''}">${fmtLot(lotL)}</div>${lotRatio!==null ? `<span class="approx-rp">${lotRatio.toFixed(2).replace('.',',')}\u00d7 setelah menang</span>` : ''}</div>`;
  renderPsyGroup('lapLotAfterLoss', [psyRow('Lot naik \u2265 1,25\u00d7 setelah rugi', lotUp), psyRow('Lot sama / turun setelah rugi', lotFlat)].filter(r=>r.count), null, true, 'Belum ada transaksi yang didahului transaksi rugi dengan data lot.');
  const sizeBins = [['Kecil (< 0,75\u00d7 rata-rata)',[]],['Normal (0,75\u20131,5\u00d7)',[]],['Besar (> 1,5\u00d7 rata-rata)',[]]];
  if(lotAll>0) for(const t of arr){ const l = lotOf(t); if(!(l>0)) continue; sizeBins[l < lotAll*0.75 ? 0 : (l > lotAll*1.5 ? 2 : 1)][1].push(t); }
  renderPsyGroup('lapLotSize', sizeBins.map(b=>psyRow(b[0], b[1])).filter(r=>r.count), null, true, 'Belum ada transaksi dengan data lot pada periode ini.');
  const maxLossV = arr.reduce((m,t)=> t.laba<0 && -t.laba>m ? -t.laba : m, 0);
  const lotNote = document.getElementById('lapLotNote');
  if(lotNote) lotNote.textContent = (maxLossV>0 && st.avgLoss>0)
    ? `Rugi terbesar ${fmtMoney(maxLossV)} = ${(maxLossV/st.avgLoss).toFixed(1).replace('.',',')}\u00d7 rata-rata rugi (${fmtMoney(st.avgLoss)}). Lot rata-rata dihitung dari transaksi yang punya data lot.`
    : 'Belum ada transaksi rugi pada periode ini.';
  // L4: temuan otomatis (aturan sederhana, hanya kelompok bersampel cukup)
  const F = [], sg = v=>(v>=0?'+':'') + fmtMoney(v);
  { const b = lap2NoArah.filter(t=>t.arah==='Beli'), j = lap2NoArah.filter(t=>t.arah==='Jual'); // L13: butuh n >= 20 per arah
    if(b.length >= 20 && j.length >= 20){
      const rb = psyRow('', b), rj = psyRow('', j), eb = rb.pl/rb.count, ej = rj.pl/rj.count;
      if((eb>=0) !== (ej>=0) || Math.abs(eb-ej) >= 0.5*Math.max(Math.abs(eb), Math.abs(ej)))
        F.push(`Beli (n=${b.length}): WR ${fmtPct(rb.win/rb.count)}, expectancy ${sg(eb)}; Jual (n=${j.length}): WR ${fmtPct(rj.win/rj.count)}, expectancy ${sg(ej)}.`);
    } }
  { const D = lapDistData; // L14: ketergantungan pada 10% transaksi terbaik
    if(D && D.v && D.n >= 30 && D.net > 0 && D.net - D.topSum <= 0) F.push(`Laba bersih ${sg(D.net)} bergantung pada ${D.k} transaksi menang terbesar (10%): tanpa itu hasilnya ${sg(D.net - D.topSum)}.`);
  }
  if(arr.length >= 60){ // L12: 30 transaksi terakhir vs sebelumnya (tanda beda atau selisih expectancy >= 50%)
    const rc = arr.slice(-30), pv = arr.slice(0,-30), ex = l=>l.reduce((a,t)=>a+t.laba,0)/l.length, wr = l=>l.filter(t=>t.laba>0).length/l.length;
    const e1 = ex(rc), e0 = ex(pv);
    if((e1>=0) !== (e0>=0) || Math.abs(e1-e0) >= 0.5*Math.abs(e0)) F.push(`30 transaksi terakhir: WR ${fmtPct(wr(rc))}, expectancy ${sg(e1)}; ${pv.length} transaksi sebelumnya: WR ${fmtPct(wr(pv))}, expectancy ${sg(e0)}.`);
  }
  if(st.total >= 30 && st.avgLoss > 0 && st.avgWin > 0){
    const be = 1/(1+st.rr);
    if(st.rr < 1 && st.winrate > 0.5) F.push(`Win rate ${fmtPct(st.winrate)}, tetapi rata-rata kalah ${(1/st.rr).toFixed(1).replace('.',',')}× rata-rata menang (RR 1 : ${st.rr.toFixed(2).replace('.',',')}). Dengan RR ini, titik impas butuh win rate ≈ ${fmtPct(be)}.`);
    else if(st.rr >= 1 && st.winrate < be) F.push(`Win rate ${fmtPct(st.winrate)} di bawah titik impas ${fmtPct(be)} untuk RR 1 : ${st.rr.toFixed(2).replace('.',',')}.`);
  }
  if(afterWin.length >= 20 && afterLoss.length >= 20){
    const wa = psyRow('', afterWin), la = psyRow('', afterLoss);
    if(Math.abs(wa.win/wa.count - la.win/la.count) >= 0.10 || (la.pl/la.count) < 0 !== (wa.pl/wa.count) < 0)
      F.push(`Setelah transaksi rugi (n=${la.count}): WR ${fmtPct(la.win/la.count)}, expectancy ${sg(la.pl/la.count)}; setelah menang (n=${wa.count}): WR ${fmtPct(wa.win/wa.count)}, expectancy ${sg(wa.pl/wa.count)}.`);
  }
  if(lapHeatData && lapHeatData.used){
    const cs = Object.keys(lapHeatData.cell).filter(k=>lapHeatData.cell[k].n >= HEAT_LOW_N).sort((a,b)=>lapHeatData.cell[a].pl - lapHeatData.cell[b].pl);
    if(cs.length >= 4){
      const w = cs[0], bst = cs[cs.length-1], cw = lapHeatData.cell[w], cb = lapHeatData.cell[bst];
      if(cw.pl < 0) F.push(`Jam × hari buka terburuk: ${heatLabel(w)} (n=${cw.n}, PNL ${sg(cw.pl)}); ${cb.pl>0 ? `terbaik: ${heatLabel(bst)} (n=${cb.n}, PNL ${sg(cb.pl)})` : 'tidak ada sel yang positif'}.`);
    }
  }
  const sess = LAP_SESSIONS.map((s,i)=>Object.assign(psyRow(lapSessionName(i), sessList[i]), {short:s[0]})).filter(r=>r.count >= 20).sort((a,b)=>(a.pl/a.count) - (b.pl/b.count));
  if(sess.length >= 2){ const sb = sess[sess.length-1], sw = sess[0]; F.push(`Sesi buka: expectancy terbaik ${sb.short} (n=${sb.count}, ${sg(sb.pl/sb.count)}), terburuk ${sw.short} (n=${sw.count}, ${sg(sw.pl/sw.count)}).`); }
  const dur = bins.map((b,i)=>psyRow(b[0], binList[i])).filter(r=>r.count >= 20).sort((a,b)=>(a.pl/a.count) - (b.pl/b.count));
  if(dur.length >= 2) F.push(`Durasi posisi: expectancy terbaik ${dur[dur.length-1].name} (n=${dur[dur.length-1].count}, ${sg(dur[dur.length-1].pl/dur[dur.length-1].count)}), terburuk ${dur[0].name} (n=${dur[0].count}, ${sg(dur[0].pl/dur[0].count)}).`);
  if(afterWin.length >= 20 && afterLoss.length >= 20 && lotRatio !== null && lotRatio >= 1.2)
    F.push(`Lot rata-rata setelah transaksi rugi ${fmtLot(lotL)} vs setelah menang ${fmtLot(lotW)} (${lotRatio.toFixed(2).replace('.',',')}\u00d7).`);
  if(lotUp.length >= 20 && lotFlat.length >= 20){
    const u = psyRow('', lotUp), fl = psyRow('', lotFlat);
    if(u.pl/u.count < fl.pl/fl.count)
      F.push(`Saat lot dinaikkan \u2265 1,25\u00d7 setelah rugi (n=${u.count}): WR ${fmtPct(u.win/u.count)}, expectancy ${sg(u.pl/u.count)}; lot sama/turun (n=${fl.count}): WR ${fmtPct(fl.win/fl.count)}, expectancy ${sg(fl.pl/fl.count)}.`);
  }
  // L6: transaksi per hari (hari = tanggal tutup GMT+8) & batas harian pribadi
  const dayMap = {};
  for(const t of arr){ const k = t.tanggal_gmt8.slice(0,10); (dayMap[k] || (dayMap[k] = {k, list:[], pl:0})).list.push(t); }
  const days = Object.values(dayMap);
  days.forEach(d=>{ d.pl = d.list.reduce((a,t)=>a+t.laba, 0); });
  const dLbl = k => k.slice(8,10) + '/' + k.slice(5,7);
  const dailyEl = document.getElementById('lapDaily');
  if(dailyEl){
    if(!days.length) dailyEl.innerHTML = '';
    else {
      const busy = days.reduce((a,d)=> d.list.length > a.list.length ? d : a, days[0]);
      const worst = days.reduce((a,d)=> d.pl < a.pl ? d : a, days[0]);
      dailyEl.innerHTML = `
        <div class="stat"><div class="stat-lbl">Hari trading</div><div class="stat-val">${days.length}</div><span class="approx-rp">rata-rata ${(arr.length/days.length).toFixed(1).replace('.',',')} trx/hari</span></div>
        <div class="stat"><div class="stat-lbl">Hari tersibuk</div><div class="stat-val">${busy.list.length} trx</div><span class="approx-rp">${dLbl(busy.k)} \u00b7 PNL ${sg(busy.pl)}</span></div>
        <div class="stat"><div class="stat-lbl">Hari terburuk</div><div class="stat-val ${worst.pl<0?'down':''}">${sg(worst.pl)}</div><span class="approx-rp">${dLbl(worst.k)} \u00b7 ${worst.list.length} trx</span></div>`;
    }
  }
  const dayBinDefs = [['1\u20132 trx/hari',1,2],['3\u20135 trx/hari',3,5],['6\u201310 trx/hari',6,10],['> 10 trx/hari',11,Infinity]];
  const dayBins = dayBinDefs.map(b=>{
    const ds = days.filter(d=> d.list.length>=b[1] && d.list.length<=b[2]);
    const list = ds.flatMap(d=>d.list);
    const avg = ds.length ? ds.reduce((a,d)=>a+d.pl,0)/ds.length : 0;
    return {...psyRow(`${b[0]} \u00b7 ${ds.length} hari \u00b7 ${sg(avg)}/hari`, list), days:ds.length, avg};
  }).filter(r=>r.count);
  renderPsyGroup('lapDayBins', dayBins, null, true, 'Belum ada transaksi pada periode ini.');
  const lim = DAY_LIMITS, hasLim = !!(lim.maxLoss || lim.maxTrades);
  const overLoss = [], overTr = [], within = [], afterLim = [];
  for(const d of days){
    let cum = 0, hit = false, cnt = 0, crossed = false;
    for(const t of d.list){
      cnt++;
      if(hit || (lim.maxTrades && cnt > lim.maxTrades)) afterLim.push(t);
      cum += t.laba;
      if(lim.maxLoss && cum <= -lim.maxLoss) hit = true;
    }
    const tooMany = !!(lim.maxTrades && d.list.length > lim.maxTrades);
    if(hit){ overLoss.push(d); crossed = true; }
    if(tooMany){ overTr.push(d); crossed = true; }
    if(!crossed) within.push(d);
  }
  const dayRow = (name, ds) => psyRow(`${name} \u00b7 ${ds.length} hari`, ds.flatMap(d=>d.list));
  renderPsyGroup('lapDayLimits', hasLim ? [
    lim.maxLoss ? dayRow(`Rugi harian \u2265 ${fmtMoney(lim.maxLoss)}`, overLoss) : null,
    lim.maxTrades ? dayRow(`Lebih dari ${lim.maxTrades} trx/hari`, overTr) : null,
    dayRow('Hari dalam batas', within),
    psyRow('Transaksi setelah batas tercapai', afterLim)
  ].filter(r=>r && r.count) : [], null, true,
  hasLim ? 'Belum ada transaksi pada periode ini.' : 'Belum ada batas harian. Atur \u201cMaks rugi harian\u201d dan/atau \u201cMaks transaksi per hari\u201d di Setelan \u2699 untuk melihat hari yang melewati batas.');
  const dNote = document.getElementById('lapDailyNote');
  if(dNote) dNote.textContent = 'Hari = tanggal tutup transaksi (GMT+8). \u201cSetelah batas tercapai\u201d = transaksi berikutnya di hari yang sama, setelah rugi kumulatif hari itu (urut waktu tutup) menyentuh batas atau jumlah transaksi melewati batas.';
  {
    const lo = dayBins.filter(r=>r.days>=5 && /^1/.test(r.name)), hi = dayBins.filter(r=>r.days>=5 && /^(6|>)/.test(r.name));
    if(lo.length && hi.length){
      const hd = days.filter(d=>d.list.length>=6), ld = days.filter(d=>d.list.length<=2);
      const hAvg = hd.reduce((a,d)=>a+d.pl,0)/hd.length, lAvg = ld.reduce((a,d)=>a+d.pl,0)/ld.length;
      if(hAvg < lAvg) F.push(`Hari dengan \u2265 6 transaksi (${hd.length} hari): rata-rata PNL ${sg(hAvg)}/hari; hari 1\u20132 transaksi (${ld.length} hari): ${sg(lAvg)}/hari.`);
    }
  }
  if(afterLim.length >= 10){
    const a = psyRow('', afterLim);
    F.push(`${a.count} transaksi berada setelah batas harian tercapai: WR ${fmtPct(a.win/a.count)}, expectancy ${sg(a.pl/a.count)}, total ${sg(a.pl)}.`);
  }
  {
    const ep = lapDDData.episodes.filter(e=>e.depthPct >= 0.05);
    if(ep.length){
      const dp = ep.reduce((a,e)=> e.depthPct > a.depthPct ? e : a, ep[0]);
      F.push(`Drawdown terdalam ${fmtPct(dp.depthPct)} (${lapFmtDate(dp.start)} \u2192 ${dp.end!==null ? lapFmtDate(dp.end) : 'sekarang'}), ${dp.end!==null ? 'pulih dalam ' + lapFmtDur(dp.end - dp.troughTs) + ' dari titik terendah' : 'belum kembali ke puncak'}.`);
    }
  }
  const fEl = document.getElementById('lapFindings');
  if(fEl) fEl.innerHTML = F.length ? F.map(x=>`<li>${x}</li>`).join('') : '<li>Belum ada temuan: data periode ini terlalu sedikit atau tidak ada pola yang menonjol.</li>';
  document.getElementById('lapReturnNote').textContent = 'Return = laba bersih ÷ modal bersih (deposit dikurangi penarikan) di akhir periode. Max DD % = penurunan terbesar dari puncak ekuitas; deposit/penarikan dinetralkan, jadi bisa berbeda dari Max DD nominal di atas.' + (wiped ? ' Saldo sempat mencapai nol/negatif (mis. margin call), jadi DD dibatasi 100%.' : '');
}

// ---------- Batas harian pribadi (Setelan) untuk analisis overtrading di Laporan (L6) ----------
let DAY_LIMITS = {maxLoss:null, maxTrades:null}; // maxLoss dalam sen (¢)
try{
  const v = JSON.parse(localStorage.getItem('jurnalDayLimits') || 'null');
  if(v){
    if(v.maxLoss > 0) DAY_LIMITS.maxLoss = +v.maxLoss;
    if(v.maxTrades >= 1) DAY_LIMITS.maxTrades = Math.floor(+v.maxTrades);
  }
}catch(e){}
// ---------- Status batas harian di kartu PNL Hari Ini (v1.1.112) ----------
// Memakai definisi yang sama dengan Laporan: hari = tanggal tutup GMT+8, urutan = waktu tutup, rugi = rugi kumulatif
// terdalam hari itu. Tersembunyi bila kedua batas belum diisi. Halaman selalu reload setelah transaksi berubah, jadi
// cukup digambar saat muat dan saat batas diubah di Setelan.
function renderDayLimitStatus(){
  const box = document.getElementById('dayLimitBox');
  if(!box) return;
  const lim = DAY_LIMITS;
  if(!lim.maxLoss && !lim.maxTrades){ box.hidden = true; box.innerHTML = ''; return; }
  const r = LIVE_RANGES[0]; // Hari Ini
  const list = DATA.trades
    .filter(t=>{ const tt = parseGmt8(t.tanggal_gmt8); return tt>=r.start && tt<=r.end; })
    .sort((a,b)=>parseGmt8(a.tanggal_gmt8) - parseGmt8(b.tanggal_gmt8));
  let cum = 0, worst = 0;
  for(const t of list){ cum += t.laba; if(-cum > worst) worst = -cum; }
  const amt = c => HERO_CURRENCY==='IDR' ? fmtRp(c/100*DATA.kurs)
    : (HERO_CURRENCY==='USC' ? fmtCent(c) + ' USC' : fmtCent(c/100) + ' USD');
  const row = (label, valTxt, ratio, note, money) => {
    const cls = ratio>=1 ? 'over' : (ratio>=0.8 ? 'warn' : 'ok');
    const pct = Math.min(100, Math.round(ratio*100));
    const m = money ? ' dl-money' : '';
    return `<div class="dl-row ${cls}"><div class="dl-top"><span class="dl-lbl">${label}</span><span class="dl-val${m}">${valTxt}</span></div>`
      + `<div class="dl-bar" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>`
      + `<div class="dl-note${m}">${note}</div></div>`;
  };
  const rows = [];
  if(lim.maxLoss){
    const ratio = worst / lim.maxLoss;
    rows.push(row('Rugi harian', `${amt(worst)} / ${amt(lim.maxLoss)}`, ratio,
      ratio>=1 ? 'Batas tercapai' : `Sisa ${amt(lim.maxLoss - worst)}`, true));
  }
  if(lim.maxTrades){
    const n = list.length, ratio = n / lim.maxTrades;
    rows.push(row('Transaksi hari ini', `${n} / ${lim.maxTrades}`, ratio,
      n>lim.maxTrades ? `Terlampaui (+${n - lim.maxTrades})` : (n===lim.maxTrades ? 'Batas tercapai' : `Sisa ${lim.maxTrades - n} transaksi`), false));
  }
  box.innerHTML = rows.join('');
  box.hidden = false;
}
(function setupDayLimits(){
  const lossEl = document.getElementById('limMaxLoss'), trEl = document.getElementById('limMaxTrades'), hint = document.getElementById('limMaxLossHint');
  if(!lossEl || !trEl) return;
  const baseHint = hint.textContent;
  const showHint = ()=>{
    hint.textContent = DAY_LIMITS.maxLoss
      ? `= $${fmtCent(DAY_LIMITS.maxLoss/100)} \u2248 ${fmtRp(DAY_LIMITS.maxLoss/100*DATA.kurs)}. ` + baseHint
      : baseHint;
  };
  if(DAY_LIMITS.maxLoss) lossEl.value = DAY_LIMITS.maxLoss;
  if(DAY_LIMITS.maxTrades) trEl.value = DAY_LIMITS.maxTrades;
  showHint();
  const onChange = ()=>{
    const l = parseFloat(lossEl.value), n = parseInt(trEl.value, 10);
    DAY_LIMITS = {maxLoss: l>0 ? l : null, maxTrades: n>=1 ? n : null};
    try{ localStorage.setItem('jurnalDayLimits', JSON.stringify(DAY_LIMITS)); }catch(e){}
    showHint();
    renderDayLimitStatus();
    if(typeof renderLap2 === 'function') renderLap2();
  };
  lossEl.addEventListener('input', onChange);
  trEl.addEventListener('input', onChange);
})();
renderDayLimitStatus();

// ---------- Laporan: tren profit/rugi mandiri (periode & filter sendiri, tidak terikat pemilih periode di tab Ringkasan) ----------
const ID_HARI_PENDEK = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const LAP2_GRANS = [
  {key:'harian', label:'Harian'},
  {key:'mingguan', label:'Mingguan'},
  {key:'bulanan', label:'Bulanan'},
  {key:'3bulan', label:'3 Bulan'},
  {key:'1tahun', label:'1 Tahun'},
  {key:'all', label:'All Time'}
];
let lap2Gran = 'all'; // default Laporan: All Time (seluruh riwayat transaksi)
let lap2Offset = 0;
let lap2Export = null; // L18: {range, matched, gran} terakhir dirender; dipakai buildLapCsv() (harus dideklarasi sebelum render awal)
let lap2Arah = 'semua';
let lap2NoArah = []; // transaksi periode terpilih setelah filter lain tetapi TANPA filter Arah (untuk blok Beli vs Jual, L13)
let lap2Sesi = 'semua'; // filter sesi pasar (indeks LAP_SESSIONS sebagai string); transaksi tanpa waktu_buka tidak lolos saat filter aktif
const lap2SesiPass = t => { if(lap2Sesi==='semua') return true; if(!t.waktu_buka) return false; return lapSessionIdx(new Date(parseGmt8(t.waktu_buka) + 8*3600000).getUTCHours()) === +lap2Sesi; };
const lap2SesiLabel = () => lap2Sesi==='semua' ? '' : LAP_SESSIONS[+lap2Sesi][0];
// L11: filter catatan psikologi. Nilai 'semua' | opsi | '-' (belum dicatat). Dropdown dibangun di bawah, setelah modul CS ada.
let lap2Emosi = 'semua', lap2Trigger = 'semua', lap2Jenis = 'semua';
const lap2FldOk = (v, sel) => sel==='semua' || (sel==='-' ? !v : v===sel);
const lap2ExtraOn = () => lap2Sesi!=='semua' || lap2Emosi!=='semua' || lap2Trigger!=='semua' || lap2Jenis!=='semua';
const lap2ExtraPass = t => lap2SesiPass(t) && lap2FldOk(t.emosi, lap2Emosi) && lap2FldOk(t.trigger, lap2Trigger) && lap2FldOk(t.jenis_entry, lap2Jenis);
const lap2ExtraLabel = () => [lap2Sesi!=='semua' && 'Sesi: '+lap2SesiLabel(), lap2Emosi!=='semua' && 'Emosi: '+(lap2Emosi==='-'?'belum dicatat':lap2Emosi), lap2Trigger!=='semua' && 'Trigger: '+(lap2Trigger==='-'?'belum dicatat':lap2Trigger), lap2Jenis!=='semua' && 'Jenis: '+(lap2Jenis==='-'?'belum dicatat':lap2Jenis)].filter(Boolean).map(x=>' \u00b7 '+x).join('');

function lap2DayLabel(ts){
  const dt = new Date(ts + 8*3600000); // ts = awal hari GMT+8 (epoch); geser +8 jam supaya getUTC* membaca tanggal GMT+8 yang benar
  return `${dt.getUTCDate()} ${ID_BULAN[dt.getUTCMonth()]}`;
}
function lap2GetRange(gran, offset){
  const {y,m,d} = GMT8_NOW;
  if(gran==='all'){
    // Dari hari transaksi pertama sampai hari ini (atau hari transaksi terakhir bila lebih baru); offset diabaikan.
    let first = Infinity, last = -Infinity;
    for(const t of DATA.trades){ const v = parseGmt8(t.tanggal_gmt8); if(v<first) first = v; if(v>last) last = v; }
    const dayOf = ts => { const q = new Date(ts + 8*3600000); return gmt8DayBounds(q.getUTCFullYear(), q.getUTCMonth(), q.getUTCDate()); };
    const [todayS, todayE] = gmt8DayBounds(y,m,d);
    const s0 = isFinite(first) ? Math.min(dayOf(first)[0], todayS) : todayS;
    const e0 = isFinite(last) ? Math.max(dayOf(last)[1], todayE) : todayE;
    const span = (e0 - s0)/86400000;
    const a = new Date(s0 + 8*3600000), z = new Date(e0 + 8*3600000);
    const fmtD = (q, withYear) => `${q.getUTCDate()} ${ID_BULAN[q.getUTCMonth()]}` + (withYear ? ` ${q.getUTCFullYear()}` : '');
    const sameYear = a.getUTCFullYear()===z.getUTCFullYear();
    return {start:s0, end:e0, bucket: span<=45 ? 'day' : (span<=200 ? 'week' : 'month'), multiYear: span>365,
            label: `${fmtD(a, !sameYear)} \u2013 ${fmtD(z, true)}`};
  }
  if(gran==='harian'){
    const base = new Date(Date.UTC(y,m,d+offset));
    const [s,e] = gmt8DayBounds(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
    const dow = base.getUTCDay();
    return {start:s, end:e, bucket:'hour', label:`${ID_HARI_PENDEK[dow]}, ${base.getUTCDate()} ${ID_BULAN[base.getUTCMonth()]} ${base.getUTCFullYear()}`};
  }
  if(gran==='mingguan'){
    const dow0 = (new Date(Date.UTC(y,m,d)).getUTCDay()+6)%7;
    const monday = new Date(Date.UTC(y,m,d-dow0+offset*7));
    const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate()+6);
    const [s] = gmt8DayBounds(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
    const [,e] = gmt8DayBounds(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate());
    const label = monday.getUTCMonth()===sunday.getUTCMonth()
      ? `${monday.getUTCDate()} – ${sunday.getUTCDate()} ${ID_BULAN[sunday.getUTCMonth()]}`
      : `${monday.getUTCDate()} ${ID_BULAN[monday.getUTCMonth()]} – ${sunday.getUTCDate()} ${ID_BULAN[sunday.getUTCMonth()]}`;
    return {start:s, end:e, bucket:'day', label};
  }
  if(gran==='bulanan'){
    const base = new Date(Date.UTC(y, m+offset, 1));
    const [s] = gmt8DayBounds(base.getUTCFullYear(), base.getUTCMonth(), 1);
    const [,e] = gmt8DayBounds(base.getUTCFullYear(), base.getUTCMonth()+1, 0);
    return {start:s, end:e, bucket:'day', label:`${ID_BULAN[base.getUTCMonth()]} ${base.getUTCFullYear()}`};
  }
  if(gran==='3bulan'){
    const endBase = new Date(Date.UTC(y, m+offset*3, 1));
    const [,e] = gmt8DayBounds(endBase.getUTCFullYear(), endBase.getUTCMonth()+1, 0);
    const startBase = new Date(Date.UTC(endBase.getUTCFullYear(), endBase.getUTCMonth()-2, 1));
    const [s] = gmt8DayBounds(startBase.getUTCFullYear(), startBase.getUTCMonth(), 1);
    const label = startBase.getUTCFullYear()===endBase.getUTCFullYear()
      ? `${ID_BULAN[startBase.getUTCMonth()]} – ${ID_BULAN[endBase.getUTCMonth()]} ${endBase.getUTCFullYear()}`
      : `${ID_BULAN[startBase.getUTCMonth()]} ${startBase.getUTCFullYear()} – ${ID_BULAN[endBase.getUTCMonth()]} ${endBase.getUTCFullYear()}`;
    return {start:s, end:e, bucket:'week', label};
  }
  const yy = y + offset;
  const [s] = gmt8DayBounds(yy,0,1);
  const [,e] = gmt8DayBounds(yy,11,31);
  return {start:s, end:e, bucket:'month', label:String(yy)};
}
function lap2Buckets(range){
  const {start,end,bucket} = range;
  const buckets = [];
  if(bucket==='hour'){
    for(let h=0;h<24;h+=2){
      const bs = start + h*3600000, be = Math.min(bs + 2*3600000 - 1, end);
      buckets.push({start:bs, end:be, label:String(h).padStart(2,'0')+':00'});
    }
  } else if(bucket==='day'){
    let cur = start;
    while(cur <= end){
      const be = Math.min(cur + 24*3600000 - 1, end);
      buckets.push({start:cur, end:be, label:lap2DayLabel(cur)});
      cur = be + 1;
    }
  } else if(bucket==='week'){
    let cur = start;
    while(cur <= end){
      const be = Math.min(cur + 7*24*3600000 - 1, end);
      buckets.push({start:cur, end:be, label:lap2DayLabel(cur)});
      cur = be + 1;
    }
  } else {
    let cur = start;
    while(cur <= end){
      const shifted = new Date(cur + 8*3600000); // baca kalender GMT+8 yang sebenarnya, bukan komponen UTC mentah dari epoch yang sudah digeser -8 jam
      const y2 = shifted.getUTCFullYear(), m2 = shifted.getUTCMonth();
      const [ms] = gmt8DayBounds(y2, m2, 1);
      const [,me] = gmt8DayBounds(y2, m2+1, 0);
      buckets.push({start:Math.max(ms,start), end:Math.min(me,end), label:ID_BULAN[m2] + (range.multiYear ? ' ' + String(y2).slice(-2) : '')});
      cur = me + 1;
    }
  }
  return buckets;
}
// ---------- Hover/tooltip generik untuk kurva SVG (dipakai kurva ekuitas & tren profit/rugi) ----------
// Sebelumnya ditulis 2x terpisah dengan pola sedikit beda (cara cari index terdekat — time-based
// binary search vs pembulatan index seragam; 1 vs 2 titik yang disorot; struktur tooltip beda) —
// hasil audit optimasi 26 Sep 2026 menandai ini sebagai risiko (fix bug di satu chart gampang lupa
// diterapkan ke chart satunya). Disatukan jadi satu modul: tiap chart kirim cara resolusi index &
// posisi X-nya sendiri (time-based utk kurva ekuitas, index rounding utk tren profit/rugi), modul ini
// yang menangani listener mouse/touch/klik, garis & titik sorot, serta penempatan tooltip.
const ChartHover = (function(){
  // Tooltip selalu satu baris (white-space:nowrap), tapi kartu grafik di layar sempit bisa lebih
  // sempit dari teks itu. Sebelum menempatkan, kecilkan font sampai muat lebar kartu (fitBox, default
  // induk svg), lalu clamp posisi pakai lebar & rect ASLI (px), bukan persentase dari W (unit viewBox)
  // yang bisa beda dengan lebar render sebenarnya — supaya tooltip tidak pernah melewati tepi kartu.
  function fitTooltip(el, fitBox, svgRect, lx, W){
    if(!fitBox) return;
    const contRect = fitBox.getBoundingClientRect(), margin = 6, avail = contRect.width - margin*2;
    el.style.whiteSpace = 'nowrap'; el.style.maxWidth = ''; el.style.fontSize = '';
    const baseFont = parseFloat(getComputedStyle(el).fontSize) || 11.5;
    let w0 = el.offsetWidth;
    if(avail > 30 && w0 > avail){
      const scale = Math.max(0.72, avail/w0);
      el.style.fontSize = (baseFont*scale).toFixed(1) + 'px';
      w0 = el.offsetWidth;
      if(w0 > avail){ el.style.whiteSpace = 'normal'; el.style.maxWidth = avail + 'px'; w0 = avail; }
    }
    const half = w0/2, desired = svgRect.left + (lx/W)*svgRect.width;
    const clamped = Math.max(contRect.left+margin+half, Math.min(contRect.right-margin-half, desired));
    el.style.left = (clamped - contRect.left) + 'px';
  }
  function attach(cfg){
    const { svg, hoverArea, W, H, resolveIndex, posX, dots = [], hoverLine, tooltip,
            enableClick = false, outsideHideContainer = null, touchPreventDefault = false,
            fitBox, onShow, onHide, autoHideMs = 0 } = cfg;
    let hideTimer = null;
    function showAt(clientX){
      if(autoHideMs && window.matchMedia && matchMedia('(hover: none)').matches){ clearTimeout(hideTimer); hideTimer = setTimeout(hide, autoHideMs); }
      const rect = svg.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width * W;
      const i = resolveIndex(px);
      const lx = posX(i);
      if(hoverLine){
        hoverLine.el.setAttribute('x1', lx); hoverLine.el.setAttribute('x2', lx); hoverLine.el.style.opacity = 1;
      }
      dots.forEach(d=>{ d.el.setAttribute('cx', d.x ? d.x(i) : lx); d.el.setAttribute('cy', d.y(i)); d.el.style.opacity = 1; });
      if(tooltip){
        tooltip.el.style.opacity = 1;
        tooltip.el.style.top = (tooltip.top(i)/H*100) + '%';
        tooltip.el.innerHTML = tooltip.html(i);
        fitTooltip(tooltip.el, fitBox !== undefined ? fitBox : svg.parentElement, rect, lx, W);
      }
      if(onShow) onShow(i);
    }
    function hide(){
      clearTimeout(hideTimer);
      if(hoverLine) hoverLine.el.style.opacity = 0;
      dots.forEach(d=> d.el.style.opacity = 0);
      if(tooltip) tooltip.el.style.opacity = 0;
      if(onHide) onHide();
    }
    hoverArea.addEventListener('mousemove', e=> showAt(e.clientX));
    hoverArea.addEventListener('mouseleave', hide);
    if(enableClick) hoverArea.addEventListener('click', e=> showAt(e.clientX));
    hoverArea.addEventListener('touchstart', e=>{ const t=e.touches[0]; if(t) showAt(t.clientX); }, {passive:true});
    hoverArea.addEventListener('touchmove', e=>{
      const t=e.touches[0]; if(!t) return;
      showAt(t.clientX);
      if(touchPreventDefault) e.preventDefault();
    }, touchPreventDefault ? {passive:false} : {passive:true});
    if(outsideHideContainer){
      // Re-render bikin elemen SVG baru tiap kali (ganti tab/periode), tapi container-nya sendiri
      // (mis. #chartBox) tetap sama — lepas listener document lama yang nempel di container ini
      // dulu supaya tidak menumpuk tiap re-render.
      if(outsideHideContainer._chartHoverOutsideHandler){
        document.removeEventListener('click', outsideHideContainer._chartHoverOutsideHandler);
      }
      const handler = (e)=>{ if(!outsideHideContainer.contains(e.target)) hide(); };
      outsideHideContainer._chartHoverOutsideHandler = handler;
      document.addEventListener('click', handler);
    }
    return { showAt, hide };
  }
  return { attach };
})();

let lap2LastBuckets = null;
function fillLapTable(buckets){
  const el = document.getElementById('lapTrendTable');
  if(!el) return;
  if(!buckets.length){ el.innerHTML = ''; return; }
  el.innerHTML = '<table><thead><tr><th>Periode</th><th>Profit</th><th>Rugi</th><th>Transaksi</th></tr></thead><tbody>' +
    buckets.map(b=>`<tr><td>${escapeHtml(b.label)}</td><td class="up">+${fmtMoney(b.profit)}</td><td class="down">-${fmtMoney(b.loss)}</td><td>${b.count}</td></tr>`).join('') + '</tbody></table>';
}
function renderLap2Chart(buckets){
  const box = document.getElementById('lapTrendBox');
  if(!box) return;
  lap2LastBuckets = buckets;
  fillLapTable(buckets);
  if(!buckets.length || buckets.every(b=>b.count===0)){
    box.innerHTML = '<div style="padding:32px 12px;text-align:center;color:var(--paper-faint);">Tidak ada transaksi pada periode ini.</div>';
    return;
  }
  const bw = Math.round(box.clientWidth); // 0 saat tab tersembunyi -> fallback 880, ResizeObserver merender ulang begitu tampil
  const W = bw>0 ? Math.max(280, bw) : 880, H=220, padL=W<500?42:52, padR=10, padT=14, padB=24;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const gainColor = 'var(--gain)', lossColor = 'var(--loss)';
  const n = buckets.length;
  let maxVal = 1;
  for(const b of buckets){ if(b.profit > maxVal) maxVal = b.profit; if(b.loss > maxVal) maxVal = b.loss; }
  const barMode = (lap2Gran==='harian' || lap2Gran==='mingguan');
  const x = i => barMode ? padL + (i+0.5)/n*plotW : (n<=1 ? padL+plotW/2 : padL + (i/(n-1))*plotW);
  const y = v => padT + plotH - (v/maxVal)*plotH;
  const baseY = y(0);
  const profitPts = buckets.map((b,i)=>({x:x(i), y:y(b.profit)}));
  const lossPts = buckets.map((b,i)=>({x:x(i), y:y(b.loss)}));
  const profitD = buildSmoothPath(profitPts);
  const lossD = buildSmoothPath(lossPts);
  const areaD = profitD + ` L ${x(n-1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  const ySteps = 3;
  let gridLines = '', yLabels = '';
  for(let i=0;i<=ySteps;i++){
    const yy = y(maxVal*i/ySteps);
    gridLines += `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/>`;
    yLabels += `<text x="${padL-6}" y="${yy+3.5}" text-anchor="end">${escapeHtml(fmtAxisMoney(maxVal*i/ySteps, maxVal))}</text>`;
  }
  const labelEvery = Math.max(1, Math.ceil(n/7));
  let xLabels = '';
  buckets.forEach((b,i)=>{ if(i%labelEvery===0 || i===n-1) xLabels += `<text x="${x(i)}" y="${H-6}" text-anchor="middle">${escapeHtml(b.label)}</text>`; });
  const totP = buckets.reduce((a,b)=>a+b.profit,0), totL = buckets.reduce((a,b)=>a+b.loss,0);
  const ariaTxt = `Grafik ${barMode?'bar':'garis'} profit dan rugi, ${n} periode. Total profit +${fmtMoney(totP)}, total rugi -${fmtMoney(totL)}. Rincian ada di tabel angka di bawah grafik.`;
  let seriesSvg;
  if(barMode){
    const slotW = plotW/n, bwid = Math.max(3, Math.min(slotW*0.36, 22));
    seriesSvg = buckets.map((b,i)=>{
      const cx = x(i);
      const hp = baseY - y(b.profit), hl = baseY - y(b.loss);
      return (b.profit>0 ? `<rect x="${cx-bwid-1}" y="${y(b.profit)}" width="${bwid}" height="${hp}" rx="1.5" fill="${gainColor}" opacity="0.85"/>` : '')
           + (b.loss>0 ? `<rect class="lap-bar-loss" x="${cx+1}" y="${y(b.loss)}" width="${bwid}" height="${hl}" rx="1.5" fill="${lossColor}" opacity="0.85"/>` : '');
    }).join('');
  } else {
    seriesSvg = `<path d="${areaD}" fill="url(#lap2Fill)" stroke="none"/>
      <path class="lap-line-profit" d="${profitD}" fill="none" stroke="${gainColor}" stroke-width="1.8"/>
      <path class="lap-line-loss" d="${lossD}" fill="none" stroke="${lossColor}" stroke-width="1.8"/>`;
  }
  box.innerHTML = `
    <svg id="lap2Chart" role="img" aria-label="${escapeHtml(ariaTxt)}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:220px;overflow:visible;">
      <defs><pattern id="lapHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#fff"/><rect width="1.6" height="4" fill="var(--loss)"/></pattern><linearGradient id="lap2Fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--gain)" stop-opacity="0.22"/><stop offset="100%" stop-color="var(--gain)" stop-opacity="0"/>
      </linearGradient></defs>
      <g stroke="var(--line-soft)" stroke-width="1">${gridLines}</g>
      ${seriesSvg}
      <g fill="var(--paper-faint)" font-size="10" font-family="'IBM Plex Mono',monospace">${xLabels}</g>
      <g fill="var(--paper-faint)" font-size="10" font-family="'IBM Plex Mono',monospace">${yLabels}</g>
      <circle id="lap2HoverProfit" r="3.5" fill="${gainColor}" opacity="0"/>
      <circle id="lap2HoverLoss" r="3.5" fill="${lossColor}" opacity="0"/>
      <line id="lap2HoverLine" x1="0" y1="${padT}" x2="0" y2="${padT+plotH}" stroke="var(--paper-faint)" stroke-width="1" stroke-dasharray="2,3" opacity="0"/>
      <rect id="lap2HoverArea" x="${padL}" y="0" width="${plotW}" height="${H}" fill="transparent"/>
    </svg>
    <div class="eq-tooltip" id="lap2Tooltip"></div>
  `;
  const svg = document.getElementById('lap2Chart');
  const hoverArea = document.getElementById('lap2HoverArea');
  const hoverLine = document.getElementById('lap2HoverLine');
  const dotP = document.getElementById('lap2HoverProfit');
  const dotL = document.getElementById('lap2HoverLoss');
  const tooltip = document.getElementById('lap2Tooltip');
  ChartHover.attach({
    svg, hoverArea, W, H,
    resolveIndex(px){ return barMode ? Math.max(0, Math.min(n-1, Math.floor((px-padL)/plotW*n))) : Math.max(0, Math.min(n-1, Math.round((px-padL)/plotW*(n-1)))); },
    posX: i => x(i),
    dots: barMode ? [] : [
      { el: dotP, y: i => y(buckets[i].profit) },
      { el: dotL, y: i => y(buckets[i].loss) }
    ],
    hoverLine: { el: hoverLine },
    tooltip: {
      el: tooltip,
      top: i => Math.min(y(buckets[i].profit), y(buckets[i].loss)),
      html: i => {
        const rp = HERO_CURRENCY!=='IDR';
        return `<span class="t-date">${escapeHtml(buckets[i].label)}</span>` + ttJoin([
          `<span class="up">Profit: +${fmtMoney(buckets[i].profit)}</span>`,
          rp ? `<span class="up">\u2248 +${fmtRp(buckets[i].profit/100*DATA.kurs)}</span>` : '',
          `<span class="down">Rugi: -${fmtMoney(buckets[i].loss)}</span>`,
          rp ? `<span class="down">\u2248 -${fmtRp(buckets[i].loss/100*DATA.kurs)}</span>` : ''
        ]);
      }
    },
    touchPreventDefault: true
  });
}
// ---------- L17: bandingkan dua periode bebas (A vs B) ----------
const CMP_PRESETS = [
  {value:'bulan-ini', label:'Bulan ini'}, {value:'bulan-lalu', label:'Bulan lalu'},
  {value:'7h', label:'7 hari terakhir'}, {value:'7h-lalu', label:'7 hari sebelumnya'},
  {value:'30h', label:'30 hari terakhir'}, {value:'30h-lalu', label:'30 hari sebelumnya'},
  {value:'tahun-ini', label:'Tahun ini'},
  {value:'paruh1', label:'Paruh pertama riwayat'}, {value:'paruh2', label:'Paruh kedua riwayat'},
  {value:'kustom', label:'Kustom\u2026'}
];
let cmpSel = {A:'bulan-lalu', B:'bulan-ini'};
function cmpFmtRange(s, e){
  const a = new Date(s + 8*3600000), z = new Date(e + 8*3600000);
  const f = (q, y) => `${q.getUTCDate()} ${ID_BULAN[q.getUTCMonth()]}` + (y ? ' ' + q.getUTCFullYear() : '');
  return `${f(a, a.getUTCFullYear()!==z.getUTCFullYear())} \u2013 ${f(z, true)}`;
}
function cmpRange(side){
  const key = cmpSel[side], {y,m,d} = GMT8_NOW, DAY = 86400000;
  const [todayS, todayE] = gmt8DayBounds(y,m,d);
  let s, e, running = false;
  if(key==='bulan-ini'){ s = gmt8DayBounds(y,m,1)[0]; e = todayE; running = true; }
  else if(key==='bulan-lalu'){ s = gmt8DayBounds(y,m-1,1)[0]; e = gmt8DayBounds(y,m,0)[1]; }
  else if(key==='7h'){ s = todayS - 6*DAY; e = todayE; running = true; }
  else if(key==='7h-lalu'){ s = todayS - 13*DAY; e = todayS - 7*DAY + DAY - 1; }
  else if(key==='30h'){ s = todayS - 29*DAY; e = todayE; running = true; }
  else if(key==='30h-lalu'){ s = todayS - 59*DAY; e = todayS - 30*DAY + DAY - 1; }
  else if(key==='tahun-ini'){ s = gmt8DayBounds(y,0,1)[0]; e = todayE; running = true; }
  else if(key==='paruh1' || key==='paruh2'){
    let first = Infinity;
    for(const t of DATA.trades){ const v = parseGmt8(t.tanggal_gmt8); if(v<first) first = v; }
    if(!isFinite(first)) return {start:0, end:-1, label:'Belum ada transaksi', running:false, empty:true};
    const q = new Date(first + 8*3600000), s0 = gmt8DayBounds(q.getUTCFullYear(), q.getUTCMonth(), q.getUTCDate())[0];
    const mid = s0 + Math.floor((todayE - s0)/2/DAY)*DAY; // batas hari penuh
    if(key==='paruh1'){ s = s0; e = mid - 1; } else { s = mid; e = todayE; running = true; }
  } else { // kustom
    const p = id => { const v = (document.getElementById(id)||{}).value; if(!v) return null; const [yy,mm,dd] = v.split('-').map(Number); return gmt8DayBounds(yy, mm-1, dd); };
    const a = p('cmp'+side+'From'), b = p('cmp'+side+'To');
    if(!a || !b) return {start:0, end:-1, label:'Isi tanggal mulai dan akhir', running:false, empty:true};
    s = Math.min(a[0], b[0]); e = Math.max(a[1], b[1]);
  }
  const name = (CMP_PRESETS.find(p=>p.value===key)||{}).label || '';
  return {start:s, end:e, label: (key==='kustom' ? '' : name + ' \u00b7 ') + cmpFmtRange(s, e), running};
}
function cmpTrades(r){
  if(r.empty) return [];
  let list = DATA.trades.filter(t=>{ const tt = parseGmt8(t.tanggal_gmt8); return tt>=r.start && tt<=r.end; });
  if(lap2ExtraOn()) list = list.filter(lap2ExtraPass);
  if(lap2Arah !== 'semua') list = list.filter(t=>t.arah===lap2Arah);
  return list;
}
function renderLapCmp(){
  const el = document.getElementById('lapCmp'), noteEl = document.getElementById('lapCmpNote');
  if(!el) return;
  ['A','B'].forEach(sd=>{ const c = document.getElementById('cmp'+sd+'Custom'); if(c) c.hidden = cmpSel[sd] !== 'kustom'; });
  const rA = cmpRange('A'), rB = cmpRange('B'), lA = cmpTrades(rA), lB = cmpTrades(rB);
  const sA = computePeriodStats(lA), sB = computePeriodStats(lB);
  const sg = v => v>0 ? '+' : '';
  const money = v => fmtMoney(v), moneyS = v => sg(v) + fmtMoney(v);
  const both = sA.total>0 && sB.total>0;
  const rows = [
    ['Transaksi', st=>st.total, v=>String(v), d=>sg(d)+Math.abs(d), null],
    ['Win rate', st=>st.total?st.winrate:null, v=>fmtPct(v), d=>sg(d)+(Math.abs(d)*100).toFixed(1).replace('.',',')+' pt', 'up'],
    ['Laba bersih', st=>st.total?st.pl:null, moneyS, d=>moneyS(d), 'up'],
    ['Profit factor', st=>st.total?st.pf:null, v=>v===Infinity?'\u221e':v.toFixed(2).replace('.',',')+'x', d=>sg(d)+Math.abs(d).toFixed(2).replace('.',',')+'x', 'up'],
    ['Expectancy', st=>st.total?st.expectancy:null, moneyS, d=>moneyS(d), 'up'],
    ['Rata-rata menang', st=>st.winCount?st.avgWin:null, money, d=>moneyS(d), 'up'],
    ['Rata-rata rugi', st=>st.lossCount?st.avgLoss:null, v=>'-'+money(v), d=>moneyS(d), 'down'],
    ['Rasio menang/rugi', st=>st.rr>0?st.rr:null, v=>v.toFixed(2).replace('.',','), d=>sg(d)+Math.abs(d).toFixed(2).replace('.',','), 'up'],
    ['Max DD (PNL)', st=>st.total?st.maxdd:null, v=>'-'+money(v), d=>moneyS(d), 'down']
  ];
  let better = 0, worse = 0, judged = 0;
  const body = rows.map(([lbl, get, fmt, dfmt, dir])=>{
    const a = get(sA), b = get(sB);
    const cell = v => v==null ? '\u2014' : escapeHtml(fmt(v));
    let dTxt = '\u2014', cls = '';
    if(a!=null && b!=null && isFinite(a) && isFinite(b)){
      const d = b - a;
      if(Math.abs(d) < 1e-9){ dTxt = '= sama'; }
      else {
        dTxt = dfmt(d);
        if(dir){ const good = dir==='up' ? d>0 : d<0; cls = good ? 'up' : 'down'; judged++; if(good) better++; else worse++; }
      }
    }
    return `<tr><td class="lbl">${lbl}</td><td>${cell(a)}</td><td>${cell(b)}</td><td class="${cls}">${escapeHtml(dTxt)}</td></tr>`;
  }).join('');
  el.innerHTML = `
    <div class="lap-cmp-legend"><div><b>A</b>${escapeHtml(rA.label)} \u00b7 ${sA.total} transaksi</div><div><b>B</b>${escapeHtml(rB.label)} \u00b7 ${sB.total} transaksi</div></div>
    <div class="lap-tbl-scroll"><table class="lap-cmp-tbl"><thead><tr><th></th><th>A</th><th>B</th><th>Selisih (B\u2212A)</th></tr></thead><tbody>${body}</tbody></table></div>`;
  const notes = [];
  if(both && judged) notes.push(`B lebih baik pada ${better} dari ${judged} metrik pembanding, A pada ${worse}. Hijau = B lebih baik, merah = B lebih buruk (Max DD dan rata-rata rugi: lebih kecil lebih baik).`);
  else if(sA.total===0 && sB.total===0) notes.push('Kedua periode belum punya transaksi (sesuai filter).');
  else if(!both) notes.push('Salah satu periode belum punya transaksi (sesuai filter), jadi selisih belum bisa dihitung.');
  if(both && (sA.total < 10 || sB.total < 10)) notes.push('Salah satu periode kurang dari 10 transaksi: selisih belum cukup untuk disimpulkan.');
  if(rA.running || rB.running) notes.push('Periode berjalan (sampai hari ini) belum penuh: jumlah transaksi dan laba bersih tidak sebanding langsung, lebih adil dibaca lewat win rate, PF, dan expectancy.');
  if(noteEl) noteEl.textContent = notes.join(' ');
}
function renderLap2(){
  const range = lap2GetRange(lap2Gran, lap2Offset);
  const rangeLbl = document.getElementById('lapRangeLabel');
  if(rangeLbl) rangeLbl.textContent = range.label;
  const metaEl = document.getElementById('printMeta');
  if(metaEl){ const gl = LAP2_GRANS.find(g=>g.key===lap2Gran); metaEl.dataset.base = `Periode ${gl?gl.label:''}: ${range.label} · Arah: ${lap2Arah==='semua'?'Semua':lap2Arah}${lap2ExtraLabel()}`; metaEl.textContent = metaEl.dataset.base; }
  const nextBtn = document.getElementById('lapNavNext');
  if(nextBtn) nextBtn.disabled = lap2Gran==='all' || range.end >= Date.now();
  const prevBtn = document.getElementById('lapNavPrev');
  if(prevBtn) prevBtn.disabled = lap2Gran==='all'; // All Time: tidak ada periode sebelum/sesudah

  // Parse tanggal tiap transaksi SEKALI di sini (bukan diulang lagi per bucket di bawah —
  // sebelumnya setiap bucket menjalankan .filter() sendiri yang parse ulang tanggal semua
  // transaksi, jadi O(transaksi × jumlah bucket) pemanggilan parseGmt8/`new Date`).
  let matchedPairs = DATA.trades
    .map(t=>({t, tt:parseGmt8(t.tanggal_gmt8)}))
    .filter(p=>p.tt>=range.start && p.tt<=range.end);
  if(lap2ExtraOn()) matchedPairs = matchedPairs.filter(p=>lap2ExtraPass(p.t));
  lap2NoArah = matchedPairs.map(p=>p.t);
  if(lap2Arah !== 'semua') matchedPairs = matchedPairs.filter(p=>p.t.arah===lap2Arah);
  const matched = matchedPairs.map(p=>p.t);

  const buckets = lap2Buckets(range).map(b=>{
    // profit, loss, dan count dihitung dalam satu pass per bucket (dulu: 3 pass terpisah
    // via .filter().reduce() ×2 + .length pada array `inBucket` yang baru dibuat per bucket).
    let profit=0, loss=0, count=0;
    for(const p of matchedPairs){
      if(p.tt>=b.start && p.tt<=b.end){
        count++;
        if(p.t.laba>0) profit += p.t.laba;
        else if(p.t.laba<0) loss += p.t.laba;
      }
    }
    return { ...b, profit, loss: Math.abs(loss), count };
  });
  renderLap2Chart(buckets);
  // Kartu "Ringkasan performa periode" & analisis psikologi trading di tab Laporan
  // sekarang ikut periode & filter Arah milik tab Laporan sendiri (range, lap2Arah),
  // bukan lagi periode yang dipilih di tab Ringkasan.
  let prevSt = null;
  if(lap2Gran !== 'all'){
    const prevRange = lap2GetRange(lap2Gran, lap2Offset-1);
    let prevM = DATA.trades.filter(t=>{ const tt = parseGmt8(t.tanggal_gmt8); return tt>=prevRange.start && tt<=prevRange.end; });
    if(lap2Arah !== 'semua') prevM = prevM.filter(t=>t.arah===lap2Arah);
    if(lap2ExtraOn()) prevM = prevM.filter(lap2ExtraPass);
    prevSt = prevM.length ? computePeriodStats(prevM) : null;
  }
  renderLaporan(matched, range.label + (lap2Arah!=='semua' ? ' · ' + lap2Arah : '') + lap2ExtraLabel(), prevSt);
  renderLapLanjut(matched, range);
  renderLapCmp();
  lap2Export = {range, matched, gran:lap2Gran};
  const csvBtn = document.getElementById('laporanCsvBtn');
  if(csvBtn) csvBtn.disabled = !matched.length;

  let totalProfit=0, totalLossRaw=0, worstTrade=0;
  for(const t of matched){
    if(t.laba>0) totalProfit += t.laba;
    else if(t.laba<0){ totalLossRaw += t.laba; if(t.laba<worstTrade) worstTrade = t.laba; }
  }
  const totalLoss = Math.abs(totalLossRaw);
  const net = totalProfit - totalLoss;
  const dayCount = Math.max(1, Math.round((Math.min(range.end, Date.now())-range.start)/86400000)); // periode berjalan: hitung sampai hari ini
  const sumEl = document.getElementById('lapSummaryGrid');
  if(sumEl){
    sumEl.innerHTML = `
      <div class="lap-summary-item"><div class="lap-sum-lbl">Profit</div><div class="lap-sum-val up">+${fmtMoney(totalProfit)}</div>${approxRp(totalProfit)}</div>
      <div class="lap-summary-item"><div class="lap-sum-lbl">Rugi</div><div class="lap-sum-val down">-${fmtMoney(totalLoss)}</div>${approxRp(-totalLoss)}</div>
      <div class="lap-summary-item"><div class="lap-sum-lbl">Menang / Kalah</div><div class="lap-sum-val">${matched.filter(t=>t.laba>0).length} / ${matched.filter(t=>t.laba<0).length}</div></div>
      <div class="lap-summary-item"><div class="lap-sum-lbl">Rugi terbesar</div><div class="lap-sum-val down">${worstTrade<0 ? fmtMoney(worstTrade) : '—'}</div>${worstTrade<0 ? approxRp(worstTrade) : ''}</div>
      <div class="lap-summary-item"><div class="lap-sum-lbl">Rata-rata bersih/hari</div><div class="lap-sum-val ${net>=0?'up':'down'}">${net>=0?'+':''}${fmtMoney(net/dayCount)}</div>${approxRp(net/dayCount)}</div>
      <div class="lap-summary-item"><div class="lap-sum-lbl">Transaksi</div><div class="lap-sum-val">${matched.length}</div></div>
    `;
  }
}
function lap2SetupControls(){
  const granEl = document.getElementById('lapGranTabs');
  if(!granEl) return;
  granEl.innerHTML = LAP2_GRANS.map(g=>`<button type="button" class="lap-gran-btn${g.key===lap2Gran?' active':''}" data-gran="${g.key}">${g.label}</button>`).join('');
  granEl.querySelectorAll('.lap-gran-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      lap2Gran = btn.dataset.gran; lap2Offset = 0;
      granEl.querySelectorAll('.lap-gran-btn').forEach(b=>b.classList.toggle('active', b===btn));
      renderLap2();
    });
  });
  const arahEl = document.getElementById('lapArahFilter');
  const arahOptions = [{key:'semua',label:'Semua'},{key:'Beli',label:'Beli'},{key:'Jual',label:'Jual'}];
  arahEl.innerHTML = arahOptions.map(o=>`<button type="button" class="lap-filter-chip${o.key===lap2Arah?' active':''}" data-arah="${o.key}">${o.label}</button>`).join('');
  arahEl.querySelectorAll('.lap-filter-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      lap2Arah = btn.dataset.arah;
      arahEl.querySelectorAll('.lap-filter-chip').forEach(b=>b.classList.toggle('active', b===btn));
      renderLap2();
    });
  });
  const sesiEl = document.getElementById('lapSesiFilter');
  const sesiOptions = [{key:'semua',label:'Semua sesi'}].concat(LAP_SESSIONS.map((s,i)=>({key:String(i),label:s[0]})));
  sesiEl.innerHTML = sesiOptions.map(o=>`<button type="button" class="lap-filter-chip${o.key===lap2Sesi?' active':''}" data-sesi="${o.key}">${o.label}</button>`).join('');
  sesiEl.querySelectorAll('.lap-filter-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      lap2Sesi = btn.dataset.sesi;
      sesiEl.querySelectorAll('.lap-filter-chip').forEach(b=>b.classList.toggle('active', b===btn));
      renderLap2();
    });
  });
  document.getElementById('lapNavPrev').addEventListener('click', ()=>{ lap2Offset -= 1; renderLap2(); });
  document.getElementById('lapNavNext').addEventListener('click', ()=>{
    if(document.getElementById('lapNavNext').disabled) return;
    lap2Offset += 1; renderLap2();
  });
}
lap2SetupControls();
renderLap2();
(function(){
  const box = document.getElementById('lapTrendBox');
  if(!box || typeof ResizeObserver==='undefined') return;
  let lastW = 0;
  new ResizeObserver(()=>{
    const w = Math.round(box.clientWidth);
    if(w && w!==lastW){ lastW = w; if(lap2LastBuckets) renderLap2Chart(lap2LastBuckets); }
  }).observe(box);
})();

(function(){
  const box = document.getElementById('lapDDBox');
  if(!box || typeof ResizeObserver==='undefined') return;
  let lastW = 0;
  new ResizeObserver(()=>{
    const w = Math.round(box.clientWidth);
    if(w && w!==lastW){ lastW = w; drawLapDD(); }
  }).observe(box);
})();

(function(){
  const box = document.getElementById('lapDistBox');
  if(!box || typeof ResizeObserver==='undefined') return;
  let lastW = 0;
  new ResizeObserver(()=>{ const w = Math.round(box.clientWidth); if(w && w!==lastW){ lastW = w; drawLapDist(); } }).observe(box);
})();

(function(){
  const box = document.getElementById('lapRollBox');
  if(!box || typeof ResizeObserver==='undefined') return;
  let lastW = 0;
  new ResizeObserver(()=>{
    const w = Math.round(box.clientWidth);
    if(w && w!==lastW){ lastW = w; drawLapRoll(); }
  }).observe(box);
})();

// L18: ekspor ringkasan Laporan (periode & filter terpilih) ke CSV. Format panjang satu tabel:
// Bagian, Item, Transaksi, Menang, Win rate (%), Expectancy (¢), PNL (¢), Nilai. Nominal tetap sen (¢), seperti ekspor lain.
function buildLapCsv(){
  const E = lap2Export; if(!E || !E.matched.length) return null;
  const list = E.matched, st = computePeriodStats(list);
  const gl = LAP2_GRANS.find(g=>g.key===E.gran);
  const num = v => (isFinite(v) ? (Math.round(v*100)/100).toFixed(2) : '');
  const cell = v => {
    let x = String(v == null ? '' : v);
    if(/^[=+@\t\r]/.test(x)) x = "'" + x; // cegah interpretasi formula di Excel/Sheets (hanya untuk teks, bukan angka)
    return /[",\n;]/.test(x) ? '"' + x.replace(/"/g,'""') + '"' : x;
  };
  const rows = [];
  const add = (bagian, item, n, win, pl, nilai) => rows.push([bagian, item,
    n==null?'':n, win==null?'':win, (n ? (win/n*100).toFixed(1) : ''), (n ? num(pl/n) : ''), (pl==null?'':num(pl)), nilai==null?'':nilai].map(cell).join(','));
  const filt = ((lap2Arah!=='semua' ? ' \u00b7 Arah: '+lap2Arah : '') + lap2ExtraLabel()).replace(/^ \u00b7 /,'').replace(/ \u00b7 /g,'; ') || 'Tanpa filter';
  add('Info','Periode '+(gl?gl.label:'')+': '+E.range.label);
  add('Info','Filter',null,null,null,filt);
  add('Info','Catatan',null,null,null,'Tanggal tutup & waktu buka GMT+8; nominal dalam sen (cent)');
  add('Info','Dibuat',null,null,null,new Date().toISOString());
  add('KPI','Transaksi',null,null,null,st.total);
  add('KPI','Menang / Kalah',null,null,null,st.winCount+' / '+st.lossCount);
  add('KPI','Win rate (%)',null,null,null,(st.winrate*100).toFixed(1));
  add('KPI','Laba bersih (¢)',null,null,null,num(st.pl));
  add('KPI','Profit factor',null,null,null,st.pf===Infinity?'inf':(st.total?st.pf.toFixed(2):''));
  add('KPI','Max DD PNL (¢)',null,null,null,num(st.maxdd));
  add('KPI','Expectancy (¢)',null,null,null,num(st.expectancy));
  add('KPI','Rata-rata menang (¢)',null,null,null,st.winCount?num(st.avgWin):'');
  add('KPI','Rata-rata kalah (¢)',null,null,null,st.lossCount?num(st.avgLoss):'');
  add('KPI','RR (menang/kalah)',null,null,null,st.rr>0?st.rr.toFixed(2):'');
  for(const [bagian, field] of [['Trigger entry','trigger'],['Trigger exit','trigger_exit'],['Emosi','emosi'],['Jenis entry','jenis_entry']]){
    groupByField(list, field).sort((a,b)=>b.pl-a.pl).forEach(r=>add(bagian, r.name, r.count, r.win, r.pl));
    const un = list.filter(t=>!t[field]);
    if(un.length) add(bagian, '(belum dicatat)', un.length, un.filter(t=>t.laba>0).length, un.reduce((a,t)=>a+t.laba,0));
  }
  // Sesi pasar & heatmap jam x hari (waktu buka GMT+8; transaksi tanpa waktu_buka tidak ikut)
  const sess = LAP_SESSIONS.map(()=>({n:0,win:0,pl:0})), heat = {};
  for(const t of list){
    if(!t.waktu_buka) continue;
    const d = new Date(parseGmt8(t.waktu_buka) + 8*3600000); if(isNaN(d)) continue;
    const h = d.getUTCHours(), si = lapSessionIdx(h), k = ((d.getUTCDay()+6)%7)*12 + Math.floor(h/2);
    const a = sess[si], c = heat[k] || (heat[k] = {n:0,win:0,pl:0});
    for(const x of [a,c]){ x.n++; x.pl += t.laba; if(t.laba>0) x.win++; }
  }
  sess.forEach((a,i)=>{ if(a.n) add('Sesi pasar', lapSessionName(i), a.n, a.win, a.pl); });
  Object.keys(heat).map(Number).sort((a,b)=>a-b).forEach(k=>add('Heatmap jam x hari', heatLabel(String(k)), heat[k].n, heat[k].win, heat[k].pl));
  const header = ['Bagian','Item','Transaksi','Menang','Win rate (%)','Expectancy (¢)','PNL (¢)','Nilai'];
  return '\uFEFF' + [header.join(','), ...rows].join('\n');
}
document.getElementById('laporanCsvBtn').addEventListener('click', ()=>{
  const csv = buildLapCsv();
  if(!csv) return;
  downloadTextFile(`laporan_xauusd_${lap2Export.gran}_${dateStampNow()}.csv`, csv, 'text/csv;charset=utf-8;');
  if(window.showNotifyModal) showNotifyModal('Ringkasan Laporan berhasil diunduh (CSV, nominal dalam ¢).', 'success');
});

document.getElementById('laporanPrintBtn').addEventListener('click', ()=>{
  const metaEl = document.getElementById('printMeta');
  const ver = ((document.querySelector('footer')||{}).textContent||'').match(/v[\d.]+/);
  if(metaEl) metaEl.textContent = (metaEl.dataset.base||'') + ' · Dicetak ' + new Date().toLocaleString('id-ID') + (ver ? ' · Jurnal XAUUSD ' + ver[0] : '');
  const tbl = document.querySelector('.lap-tbl-wrap');
  if(tbl){ tbl.dataset.was = tbl.open ? '1' : '0'; const short = (lap2Gran==='harian' || lap2Gran==='mingguan'); tbl.dataset.pr = short ? '1' : '0'; tbl.open = short; }
  document.body.classList.add('printing-laporan');
  window.print();
});
window.addEventListener('afterprint', ()=>{
  document.body.classList.remove('printing-laporan');
  const tbl = document.querySelector('.lap-tbl-wrap');
  if(tbl){ tbl.open = tbl.dataset.was === '1'; delete tbl.dataset.pr; }
  const metaEl = document.getElementById('printMeta');
  if(metaEl && metaEl.dataset.base) metaEl.textContent = metaEl.dataset.base;
});

function selectCustom(){
  customRangeEl.classList.add('open');
  applyCustomRange();
}
function applyCustomRange(){
  const fromV = DTP.get('customFrom'), toV = DTP.get('customTo');
  if(!fromV || !toV){ return; }
  const rs = parseGmt8(fromV+'T00:00:00');
  const re = parseGmt8(toV+'T23:59:59');
  if(re < rs){ customNote.textContent = 'Tanggal "sampai" harus setelah "dari"'; return; }
  const matched = DATA.trades.filter(t=>{
    const tt = parseGmt8(t.tanggal_gmt8);
    return tt>=rs && tt<=re;
  });
  const pl = matched.reduce((s,t)=>s+t.laba,0);
  customNote.textContent = matched.length ? '' : 'Tidak ada transaksi di rentang ini';
  currentPeriodRange = {start: rs, end: re};
  renderStatStrip(computePeriodStats(matched));
  if(window.updateChartHighlight) window.updateChartHighlight(currentPeriodRange, 'Kustom ' + fromV + ' – ' + toV, pl);
  if(window.renderTrades) window.renderTrades();
}


function selectPeriodKey(key){
  if(key === 'custom'){ selectCustom(); return; }
  customRangeEl.classList.remove('open');
  const preset = PERIOD_PRESETS.find(p=>p.key===key) || PERIOD_PRESETS[4];
  let range;
  if(preset.days){
    const {y,m,d} = GMT8_NOW, [, todayEnd] = gmt8DayBounds(y,m,d);
    range = {start: todayEnd - preset.days*86400000, end: todayEnd};
  } else {
    range = {start: Date.UTC(2000,0,1), end: Date.UTC(2100,0,1)};
  }
  currentPeriodRange = range;
  const matched = DATA.trades.filter(t=>{
    const tt = parseGmt8(t.tanggal_gmt8);
    return tt>=range.start && tt<=range.end;
  });
  const pl = matched.reduce((s,t)=>s+t.laba, 0);
  renderStatStrip(computePeriodStats(matched));
  if(window.updateChartHighlight) window.updateChartHighlight(range, preset.long, pl);
}

// ---------- Equity chart (hand-drawn SVG, no dependencies) ----------
function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function hexToRgb(hex){
  hex = hex.replace('#','');
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  const n = parseInt(hex,16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
// Helper bersama: bangun path SVG halus yang tetap melewati tiap titik data persis,
// pakai monotone cubic Hermite (metode Fritsch-Carlson, sama seperti curveMonotoneX
// di D3) alih-alih Catmull-Rom mentah. Bedanya: kurva di tiap segmen dijamin secara
// matematis tidak akan overshoot/undershoot melewati nilai kedua titik ujungnya —
// jadi transisi dari runtun datar (mis. beberapa bucket bernilai 0) ke lonjakan tajam
// melengkung halus secara alami, tanpa sudut kaku dan tanpa perlu clamp manual ke
// garis nol seperti sebelumnya (dipakai kurva Tren profit/rugi maupun kurva ekuitas).
function buildSmoothPath(pts){
  const n = pts.length;
  if(n < 2) return n ? `M ${pts[0].x} ${pts[0].y}` : '';
  if(n === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  const dx = new Array(n-1), dy = new Array(n-1), slope = new Array(n-1);
  for(let i=0;i<n-1;i++){
    dx[i] = pts[i+1].x - pts[i].x;
    dy[i] = pts[i+1].y - pts[i].y;
    slope[i] = dx[i] !== 0 ? dy[i]/dx[i] : 0;
  }
  // Tangen awal tiap titik: rata-rata slope kiri-kanan, atau 0 di titik ekstrem lokal
  // (slope berbeda tanda / salah satunya nol) supaya tidak overshoot melewati puncak/lembah.
  const m = new Array(n);
  m[0] = slope[0];
  m[n-1] = slope[n-2];
  for(let i=1;i<n-1;i++){
    if(slope[i-1] === 0 || slope[i] === 0 || (slope[i-1] < 0) !== (slope[i] < 0)) m[i] = 0;
    else m[i] = (slope[i-1] + slope[i]) / 2;
  }
  // Langkah Fritsch-Carlson: skala ulang tangen per segmen kalau kombinasinya masih
  // bisa menyebabkan overshoot, supaya kurva tetap monoton di dalam tiap segmen.
  for(let i=0;i<n-1;i++){
    if(slope[i] === 0){ m[i] = 0; m[i+1] = 0; continue; }
    const a = m[i] / slope[i], b = m[i+1] / slope[i];
    const s = a*a + b*b;
    if(s > 9){
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * slope[i];
      m[i+1] = tau * b * slope[i];
    }
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for(let i=0;i<n-1;i++){
    const cp1x = pts[i].x + dx[i]/3;
    const cp1y = pts[i].y + m[i]*dx[i]/3;
    const cp2x = pts[i+1].x - dx[i]/3;
    const cp2y = pts[i+1].y - m[i+1]*dx[i]/3;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i+1].x} ${pts[i+1].y}`;
  }
  return d;
}

let lastPeriodLabel = null;
let lastPeriodPL = 0;
// Animasi "gambar garis dari nol" cuma diputar sekali di render pertama (buka halaman).
// Tanpa ini, ganti periode/tab (yang rebuild seluruh innerHTML SVG) ikut memicu ulang
// animasi 1.1 detik itu tiap kali, terasa "berkedip" kalau user gonta-ganti periode cepat.
let eqAnimated = false;
// ---------- Ringkasan: DD saat ini + puncak berjalan (v1.1.115) ----------
// Memakai computeLapDD (sama dengan Laporan L7, All Time) supaya angkanya konsisten. Tidak mengikuti pemilih periode kurva.
function eqDrawdownAllTime(){
  const d = computeLapDD({start:-Infinity, end:Infinity});
  const peakAt = {};
  for(const p of d.series) peakAt[p.i] = p.peak;
  return {d, peakAt};
}
function renderEqDdBadge(d){
  const el = document.getElementById('eqDdBadge'); if(!el) return;
  if(!d || !d.last){ el.innerHTML = ''; return; }
  if(d.now){
    const nominal = d.last.peak - d.last.bal;
    el.innerHTML = `<span class="eq-dd-badge down" title="Dihitung dari seluruh riwayat (sama dengan Laporan \u2192 Drawdown), tidak mengikuti pemilih periode."><span>DD saat ini</span><b>-${fmtPct(d.now.pct)}</b><span>dari puncak</span><span class="eq-dd-sub">-${fmtMoney(nominal)} \u00b7 sejak ${lapFmtDate(d.now.since)}</span></span>`;
  } else {
    el.innerHTML = `<span class="eq-dd-badge up" title="Dihitung dari seluruh riwayat (sama dengan Laporan \u2192 Drawdown), tidak mengikuti pemilih periode."><span>Ekuitas</span><b>di puncak</b></span>`;
  }
}
let eqLegendHidden = { modal:false, peak:false };
function renderEquityChart(){
  const eqFull = DATA.equity;
  const box = document.getElementById('chartBox');
  const ddAll = (eqFull && eqFull.length) ? eqDrawdownAllTime() : null;
  renderEqDdBadge(ddAll ? ddAll.d : null);
  if(!eqFull || eqFull.length === 0){
    box.innerHTML = '<div style="padding:40px 12px;text-align:center;color:var(--paper-faint);">Belum ada data transaksi. Impor data JSON di tab Setelan untuk mulai, atau data akan otomatis tersimpan di penyimpanan lokal setelah sinkron berikutnya.</div>';
    return;
  }
  const modalFull = DATA.modal_kumulatif || null;
  const W = 880, H = 260, padL = 54, padR = 22, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const goldColor = cssVar('--gold');
  const gainColor = cssVar('--gain');
  const lossColor = cssVar('--loss');
  const modalColor = cssVar('--paper-dim');
  const peakColor = cssVar('--gold-dim');

  const fullTimes = eqFull.map(p=>new Date(p[0]).getTime());
  const dataStart = fullTimes[0], dataEnd = fullTimes[fullTimes.length-1];
  const nowTs = Date.now();

  // ---------- Scope the chart to the selected period (fallback: seluruh riwayat sampai hari ini) ----------
  // Catatan: batas akhir memakai "sekarang" (nowTs), bukan dataEnd (waktu transaksi terakhir),
  // supaya kurva tetap berjalan sampai tanggal berjalan walau tidak ada transaksi baru.
  let scopeStart = dataStart, scopeEnd = Math.max(dataEnd, nowTs), lineColor = goldColor, periodLabel = '';
  // Catatan: ada dua jenis "tidak ada irisan" dan keduanya butuh perlakuan beda.
  // (a) periode SEBELUM data pernah ada (mis. "Tahun Lalu" sebelum mulai trading) — wajar fallback ke seluruh riwayat.
  // (b) periode SETELAH data terakhir (mis. "Minggu Ini"/"Minggu Lalu" dihitung dari jam perangkat sekarang,
  //     padahal sudah beberapa hari tanpa transaksi baru) — ini BUKAN "belum pernah ada data", jadi jangan
  //     dilempar ke fallback seluruh riwayat; cukup tampilkan garis datar di saldo terakhir, dibatasi ke jendela periode itu.
  const beforeAnyData = currentPeriodRange && currentPeriodRange.end < dataStart;
  const afterLastData = currentPeriodRange && currentPeriodRange.start > dataEnd;
  if(currentPeriodRange && !beforeAnyData){
    scopeStart = Math.max(dataStart, currentPeriodRange.start);
    scopeEnd = Math.min(nowTs, currentPeriodRange.end);
    lineColor = lastPeriodPL >= 0 ? gainColor : lossColor;
    periodLabel = lastPeriodLabel || '';
    if(afterLastData) periodLabel += ' — belum ada transaksi baru, saldo tetap di posisi terakhir';
  } else if(beforeAnyData){
    // periode terpilih belum punya data sama sekali — jangan tampilkan kurva kosong,
    // tampilkan seluruh riwayat sebagai fallback dengan catatan
    periodLabel = (lastPeriodLabel || '') + ' — belum ada data, menampilkan seluruh riwayat';
  }

  // titik saldo terakhir sebelum awal periode, jadi kurva punya titik pijakan di tepi kiri
  let baseIdx = 0;
  for(let i=0;i<fullTimes.length;i++){ if(fullTimes[i] <= scopeStart) baseIdx = i; else break; }
  const idxs = [baseIdx];
  for(let i=baseIdx+1;i<fullTimes.length;i++){
    if(fullTimes[i] > scopeEnd) break;
    idxs.push(i);
  }

  const times = idxs.map(i => Math.min(scopeEnd, Math.max(scopeStart, fullTimes[i])));
  const vals = idxs.map(i => eqFull[i][1]);
  const modalVals = (modalFull && modalFull.length===eqFull.length) ? idxs.map(i=>modalFull[i]) : null;
  const peakVals = ddAll ? idxs.map((i,k)=> ddAll.peakAt[i] !== undefined ? ddAll.peakAt[i] : vals[k]) : null;

  // ---------- Tarik kurva mendatar sampai akhir rentang (hari ini / akhir periode) ----------
  // Tanpa ini, garis berhenti persis di transaksi terakhir walau periodenya masih berjalan.
  if(times[times.length-1] < scopeEnd){
    times.push(scopeEnd);
    vals.push(vals[vals.length-1]);
    if(modalVals) modalVals.push(modalVals[modalVals.length-1]);
    if(peakVals) peakVals.push(peakVals[peakVals.length-1]);
    idxs.push(idxs[idxs.length-1]); // titik tambahan ini mewakili saldo terakhir yang sama, bukan transaksi baru
  }
  const tMin = scopeStart, tMax = Math.max(scopeEnd, scopeStart+1);
  const allVals = modalVals ? vals.concat(modalVals) : vals;
  // Pakai loop manual, bukan Math.min/max(...array) — spread argumen ke fungsi punya batas
  // jumlah argumen JS (~65rb); aman untuk data sekarang, tapi berisiko "Maximum call stack
  // size exceeded" kalau riwayat trading terus tumbuh bertahun-tahun.
  let vMin = 0, vMax = -Infinity;
  for(const v of allVals){ if(v < vMin) vMin = v; if(v > vMax) vMax = v; }
  const vPad = (vMax-vMin)*0.08 || 1;
  const yLo = vMin - vPad, yHi = vMax + vPad;

  const x = t => padL + (t-tMin)/(tMax-tMin) * plotW;
  const y = v => padT + plotH - (v-yLo)/(yHi-yLo) * plotH;

  // ---------- Max drawdown dalam rentang yang ditampilkan (trading-only, exclude deposit/penarikan) ----------
  const ddSeries = modalVals ? vals.map((v,i)=>v-modalVals[i]) : vals;
  let peakIdx = 0, troughIdx = 0, maxDD = 0, runPeakIdx = 0;
  for(let i=1;i<ddSeries.length;i++){
    if(ddSeries[i] > ddSeries[runPeakIdx]) runPeakIdx = i;
    const dd = ddSeries[runPeakIdx] - ddSeries[i];
    if(dd > maxDD){ maxDD = dd; peakIdx = runPeakIdx; troughIdx = i; }
  }

  // ---------- Titik ATH (all-time high) & Bottom pada rentang yang ditampilkan ----------
  let athIdx = 0, bottomIdx = 0;
  for(let i=1;i<vals.length;i++){
    if(vals[i] > vals[athIdx]) athIdx = i;
    if(vals[i] < vals[bottomIdx]) bottomIdx = i;
  }
  const athPx = x(times[athIdx]), athPy = y(vals[athIdx]);
  const bottomPx = x(times[bottomIdx]), bottomPy = y(vals[bottomIdx]);
  const showBottomLabel = bottomIdx !== athIdx;

  const eqPts = times.map((t,i)=>({x:x(t), y:y(vals[i])}));
  // Garis puncak berjalan (putus-putus), hanya digambar bila ada jarak dari kurva (ada drawdown di rentang ini).
  let showPeak = false;
  if(peakVals){ for(let k=0;k<vals.length;k++){ if(peakVals[k] - vals[k] > 1e-9){ showPeak = true; break; } } }
  const peakLineColor = cssVar('--paper-faint');
  const peakPtsStr = showPeak ? times.map((t,k)=>`${x(t).toFixed(1)},${y(peakVals[k]).toFixed(1)}`).join(' ') : '';
  const d = buildSmoothPath(eqPts);
  let modalD = '', areaD = '';
  if(modalVals){
    const modalPts = times.map((t,i)=>({x:x(t), y:y(modalVals[i])}));
    modalD = buildSmoothPath(modalPts);
    // isian hanya antara kurva ekuitas dan garis modal (bukan sampai dasar sumbu)
    areaD = d + ' L ' + modalPts[modalPts.length-1].x + ' ' + modalPts[modalPts.length-1].y + ' ' + buildSmoothPath(modalPts.slice().reverse()).replace(/^M/, 'L') + ' Z';
  } else {
    const yBase = y(Math.min(Math.max(0, yLo), yHi));
    areaD = d + ` L ${x(times[times.length-1])} ${yBase} L ${x(times[0])} ${yBase} Z`;
  }

  // Sumbu Y: tick "cantik" (kelipatan 1/2/2,5/5 x 10^k) dalam satuan tampilan (USD/USC/Rp), garis nol tegas
  const dispF = HERO_CURRENCY==='USD' ? 0.01 : (HERO_CURRENCY==='IDR' ? (DATA.kurs||0)/100 : 1);
  const axisF = dispF > 0 ? dispF : 1;
  const rawStep = (yHi-yLo)*axisF/5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const stepD = [1,2,2.5,5,10].map(m=>m*mag).find(v=>v >= rawStep) || 10*mag;
  const fmtTick = vd => {
    const a = Math.abs(vd), sg = vd<0 ? '-' : '';
    if(HERO_CURRENCY==='USD') return sg + a.toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:stepD<1?2:0});
    if(a>=1e6) return sg + (a/1e6).toLocaleString('id-ID',{maximumFractionDigits:2}) + 'jt';
    if(a>=1e3) return sg + (a/1e3).toLocaleString('id-ID',{maximumFractionDigits:2}) + 'rb';
    return sg + a.toLocaleString('id-ID',{maximumFractionDigits:2});
  };
  let gridLines = '', yLabels = '', zeroLine = '';
  for(let k=Math.ceil(yLo*axisF/stepD - 1e-9); k*stepD <= yHi*axisF + 1e-9; k++){
    const vd = Math.round(k*stepD*1e6)/1e6, yy = y(vd/axisF);
    if(k===0) zeroLine = `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}" stroke="${cssVar('--paper-faint')}" stroke-width="1" opacity="0.7"/>`;
    else gridLines += `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/>`;
    yLabels += `<text x="${padL-8}" y="${yy+3}" text-anchor="end">${fmtTick(vd)}</text>`;
  }
  yLabels += `<text x="2" y="7" text-anchor="start">${curUnitSymbol()}</text>`;
  // x labels: pick ~6 evenly spaced points. Format mengikuti rentang tampilan (spanMs) supaya
  // tidak lagi selalu "bulan+tahun" — untuk periode pendek (Hari Ini/Minggu Ini dst.) itu bikin
  // semua label sama persis (mis. "Sep 26" berulang 7x), tidak menunjukkan progres waktu sama sekali.
  const nXLabels = 6;
  const spanMs = tMax - tMin;
  const DAY_MS = 86400000;
  let xLabels = '';
  for(let i=0;i<=nXLabels;i++){
    const t = tMin + (tMax-tMin)*i/nXLabels;
    const dt = new Date(t);
    let lbl;
    if(spanMs <= 2*DAY_MS){
      lbl = dt.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
    } else if(spanMs <= 62*DAY_MS){
      lbl = dt.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
    } else if(spanMs <= 400*DAY_MS){
      lbl = dt.toLocaleDateString('id-ID',{month:'short',year:'2-digit'});
    } else {
      lbl = dt.toLocaleDateString('id-ID',{year:'numeric'});
    }
    xLabels += `<text x="${x(t)}" y="${H-6}" text-anchor="${i===nXLabels ? 'end' : (i===0 ? 'start' : 'middle')}">${lbl}</text>`;
  }

  // Kunci tampil/sembunyi legenda (bertahan antar render)
  const hid = eqLegendHidden;
  const noteLabel = periodLabel && periodLabel.indexOf(' — ') >= 0 ? periodLabel : ''; // label periode hanya bila ada catatan (periode sudah terlihat di pemilih)
  const bandH = 5, bandY = padT + plotH - bandH;
  box.innerHTML = `
    <div class="eq-plot">
    <svg id="equityChart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:260px;">
      <defs>
        <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.26"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.04"/>
        </linearGradient>
      <clipPath id="eqPlotClip"><rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}"/></clipPath>
      </defs>
      <g class="eq-grid">${gridLines}</g>
      ${zeroLine}
      <path d="${areaD}" fill="url(#eqFill)" stroke="none" clip-path="url(#eqPlotClip)"/>
      ${modalD ? `<path id="eqModalLine" d="${modalD}" fill="none" stroke="${modalColor}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7" style="${hid.modal ? 'display:none' : ''}"/>` : ''}
      <path d="${d}" fill="none" stroke="${lineColor}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"${eqAnimated ? '' : `
            stroke-dasharray="3000" stroke-dashoffset="3000"`}>${eqAnimated ? '' : `
        <animate attributeName="stroke-dashoffset" from="3000" to="0" dur="1.1s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.1 1"/>`}
      </path>
      ${showPeak ? `<polyline id="eqPeakLine" points="${peakPtsStr}" fill="none" stroke="${peakColor}" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.95" clip-path="url(#eqPlotClip)" style="pointer-events:none;${hid.peak ? 'display:none;' : ''}"/>` : ''}
      <g class="eq-axis">${yLabels}${xLabels}</g>
      <rect id="eqDrawdownRect" x="${x(times[peakIdx])}" y="${bandY}" width="${Math.max(1.5, x(times[troughIdx])-x(times[peakIdx]))}" height="${bandH}" fill="${lossColor}" opacity="0.6" style="pointer-events:none;"/>
      <line class="eq-dd-edge" x1="${x(times[peakIdx])}" y1="${padT}" x2="${x(times[peakIdx])}" y2="${padT+plotH}" stroke="${lossColor}" stroke-width="1" stroke-dasharray="3 3" opacity="0" style="pointer-events:none;"/>
      <line class="eq-dd-edge" x1="${x(times[troughIdx])}" y1="${padT}" x2="${x(times[troughIdx])}" y2="${padT+plotH}" stroke="${lossColor}" stroke-width="1" stroke-dasharray="3 3" opacity="0" style="pointer-events:none;"/>
      <circle id="eqAthDot" cx="${athPx}" cy="${athPy}" r="3" fill="${gainColor}"/>
      ${showBottomLabel ? `<circle id="eqBottomDot" cx="${bottomPx}" cy="${bottomPy}" r="3" fill="${lossColor}"/>` : ''}
      <line class="eq-hover-line" id="eqHoverLine" x1="0" y1="${padT}" x2="0" y2="${padT+plotH}"/>
      <circle class="eq-hover-dot" id="eqHoverDot" r="3.5"/>
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="transparent" id="eqHoverArea"/>
    </svg>
    <div class="eq-tooltip" id="eqTooltip"></div>
    <div class="eq-extreme-label ath" id="eqAthLabel" style="left:${athPx/W*100}%;top:${athPy/H*100}%;">${fmtMoney(vals[athIdx])}</div>
    ${showBottomLabel ? `<div class="eq-extreme-label bottom" id="eqBottomLabel" style="left:${bottomPx/W*100}%;top:${bottomPy/H*100}%;">${fmtMoney(vals[bottomIdx])}</div>` : ''}
    <div class="eq-period-label" id="eqPeriodLabel">${noteLabel ? 'Menampilkan: ' + noteLabel : ''}</div>
    </div>
    <div class="eq-legend">
      <button type="button" class="eq-legend-item eq-legend-wide" data-eqleg="dd" aria-pressed="false" title="Ketuk untuk menyorot periode drawdown di kurva"><span class="eq-legend-swatch" style="background:${lossColor};opacity:0.6;height:5px"></span>Drawdown ekuitas terbesar: ${fmtMoney(maxDD)} (${fmtDate(eqFull[idxs[peakIdx]][0])} &rarr; ${fmtDate(eqFull[idxs[troughIdx]][0])})</button>
      <span class="eq-legend-item"><span class="eq-legend-swatch" style="background:${lineColor}"></span>${modalD ? 'Saldo / Ekuitas' : 'Saldo'}</span>
      ${modalD ? `<button type="button" class="eq-legend-item${hid.modal ? ' off' : ''}" data-eqleg="modal" aria-pressed="${!hid.modal}" title="Ketuk untuk tampil/sembunyi"><span class="eq-legend-swatch" style="background:${modalColor};opacity:0.7"></span>Modal kumulatif</button>` : ''}
      ${showPeak ? `<button type="button" class="eq-legend-item${hid.peak ? ' off' : ''}" data-eqleg="peak" aria-pressed="${!hid.peak}" title="Ketuk untuk tampil/sembunyi"><span class="eq-legend-swatch eq-legend-dash" style="border-top-color:${peakColor}"></span>Puncak berjalan</button>` : ''}
      <span class="eq-legend-item"><span class="eq-legend-dot" style="background:${gainColor}"></span>Titik tertinggi</span>
      ${showBottomLabel ? `<span class="eq-legend-item"><span class="eq-legend-dot" style="background:${lossColor}"></span>Titik terendah</span>` : ''}
    </div>
  `;
  // Legenda bisa diketuk: sembunyikan/tampilkan garis modal & puncak; sorot penuh periode drawdown
  box.querySelectorAll('[data-eqleg]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.getAttribute('data-eqleg');
      if(k === 'dd'){
        const on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on);
        const r = document.getElementById('eqDrawdownRect');
        r.setAttribute('y', on ? padT : bandY); r.setAttribute('height', on ? plotH : bandH); r.setAttribute('opacity', on ? 0.14 : 0.6);
        box.querySelectorAll('.eq-dd-edge').forEach(l=> l.setAttribute('opacity', on ? 0.5 : 0));
        return;
      }
      eqLegendHidden[k] = !eqLegendHidden[k];
      const el = document.getElementById(k === 'modal' ? 'eqModalLine' : 'eqPeakLine');
      if(el) el.style.display = eqLegendHidden[k] ? 'none' : '';
      btn.classList.toggle('off', eqLegendHidden[k]);
      btn.setAttribute('aria-pressed', !eqLegendHidden[k]);
    });
  });

  const svg = document.getElementById('equityChart');
  const hoverArea = document.getElementById('eqHoverArea');
  const hoverLine = document.getElementById('eqHoverLine');
  const hoverDot = document.getElementById('eqHoverDot');
  const tooltip = document.getElementById('eqTooltip');
  const athLabel = document.getElementById('eqAthLabel');
  const bottomLabel = document.getElementById('eqBottomLabel');
  const periodLbl = document.getElementById('eqPeriodLabel');

  function nearestIndex(t){
    let lo=0, hi=times.length-1;
    while(lo<hi){ const mid=(lo+hi)>>1; if(times[mid]<t) lo=mid+1; else hi=mid; }
    return lo;
  }

  // Saat hover/klik di titik manapun: label ATH & Bottom memudar (opacity 0),
  // digantikan tooltip nilai titik yang ditunjuk. Saat dilepas, ATH & Bottom muncul lagi.
  ChartHover.attach({
    svg, hoverArea, W, H,
    resolveIndex(px){
      const t = tMin + (px-padL)/plotW * (tMax-tMin);
      return Math.max(0, Math.min(times.length-1, nearestIndex(t)));
    },
    posX: i => x(times[i]),
    dots: [ { el: hoverDot, y: i => y(vals[i]) } ],
    hoverLine: { el: hoverLine },
    tooltip: {
      el: tooltip,
      top: i => 0,
      html: i => {
        const modalPart = modalVals ? `<span style="color:${modalColor}">Modal: ${fmtMoney(modalVals[i])}</span>` : '';
        return `<span class="t-date">${fmtDate(eqFull[idxs[i]][0])}</span>` + ttJoin([fmtMoney(vals[i]), modalPart]);
      }
    },
    enableClick: true,
    autoHideMs: 3000,
    outsideHideContainer: box,
    onShow(){ if(athLabel) athLabel.style.opacity = 0; if(bottomLabel) bottomLabel.style.opacity = 0; if(periodLbl) periodLbl.style.opacity = 0; },
    onHide(){ if(athLabel) athLabel.style.opacity = 1; if(bottomLabel) bottomLabel.style.opacity = 1; if(periodLbl) periodLbl.style.opacity = 1; }
  });
  eqAnimated = true;
}

// ---------- Dipanggil setiap kali periode (tab/kustom) berubah ----------
window.updateChartHighlight = function(range, label, pl){
  currentPeriodRange = range;
  lastPeriodLabel = label;
  lastPeriodPL = pl || 0;
  renderEquityChart();
};
renderEquityChart();
window.renderEquityChart = renderEquityChart;

// ---------- Modal detail hari (dipicu dari kalender PNL Harian di tab Analisis PNL) ----------
(function(){
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const DOW_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const dayOverlay = document.getElementById('dayModalOverlay');
  const daySummaryEl = document.getElementById('dayModalSummary');
  const dayListEl = document.getElementById('dayTradeList');
  const dayEmptyEl = document.getElementById('dayModalEmpty');

  function renderTradeList(trades, withDate){
    if(!trades.length){
      daySummaryEl.innerHTML = '';
      dayListEl.innerHTML = '';
      dayEmptyEl.style.display = 'block';
    } else {
      dayEmptyEl.style.display = 'none';
      const pl = trades.reduce((s,t)=>s+t.laba, 0);
      const wins = trades.filter(t=>t.laba>0).length;
      const losses = trades.filter(t=>t.laba<0).length;
      daySummaryEl.innerHTML = `
        <span><span class="dms-lbl">Laba/rugi</span><span class="${pl>=0?'up':'down'}">${pl>=0?'+':''}${fmtMoney(pl)}</span></span>
        <span><span class="dms-lbl">Transaksi</span>${trades.length}</span>
        <span><span class="dms-lbl">Menang</span><span class="up">${wins}</span></span>
        <span><span class="dms-lbl">Kalah</span><span class="down">${losses}</span></span>
      `;
      dayListEl.innerHTML = trades.map(t => {
        const time = withDate ? fmtDateTime(t.tanggal) : fmtDateTime(t.tanggal).slice(-5);
        return `<div class="day-trade-row" data-id="${t.id}">
          <span class="dtr-time">${time}</span>
          <span class="dtr-arah ${t.arah==='Beli'?'up':'down'}">${t.arah}</span>
          <span class="dtr-lot">${t.lot} lot</span>
          <span class="dtr-laba ${t.laba>=0?'up':'down'}">${t.laba>=0?'+':''}${fmtMoney(t.laba)}</span>
        </div>`;
      }).join('');
    }
  }
  function openListModal(title, list){
    document.getElementById('dayModalTitle').textContent = title;
    const all = list.slice().sort((a,b) => parseGmt8(a.tanggal_gmt8) - parseGmt8(b.tanggal_gmt8));
    renderTradeList(all.slice(0,150), true);
    if(all.length > 150) dayListEl.insertAdjacentHTML('beforeend', `<p class="modal-message">Menampilkan 150 dari ${all.length} transaksi.</p>`);
    dayOverlay.classList.add('show');
  }
  function openDayModal(key){
    const [y,mo,d] = key.split('-').map(Number);
    const dow = new Date(y, mo-1, d).getDay();
    document.getElementById('dayModalTitle').textContent = `${DOW_NAMES[dow]}, ${d} ${monthNames[mo-1]} ${y}`;

    const trades = DATA.trades
      .filter(t => t.tanggal_gmt8 && t.tanggal_gmt8.slice(0,10) === key)
      .sort((a,b) => parseGmt8(a.tanggal_gmt8) - parseGmt8(b.tanggal_gmt8));

    renderTradeList(trades, false);
    dayOverlay.classList.add('show');
  }
  function closeDayModal(){ dayOverlay.classList.remove('show'); }

  dayListEl.addEventListener('click', (e)=>{
    const row = e.target.closest('.day-trade-row[data-id]');
    if(row && window.openTradeDetail){
      closeDayModal();
      window.openTradeDetail(row.dataset.id);
    }
  });
  document.getElementById('dayModalCloseBtn').addEventListener('click', closeDayModal);
  dayOverlay.addEventListener('click', (e)=>{ if(e.target===dayOverlay) closeDayModal(); });
  window.openDayModal = openDayModal;
  window.openListModal = openListModal;
})();

// ---------- Analisis PNL (tab baru): stat ringkas per rentang bergulir dari hari ini ----------
(function(){
  const granEl = document.getElementById('anGranTabs');
  if(!granEl) return;
  const statEl = document.getElementById('anStatStrip');
  const rangeEl = document.getElementById('anCustomRange');
  const noteEl = document.getElementById('anCustomNote');

  const AN_RANGES = PERIOD_PRESETS;
  let anKey = 'all';

  function currentRange(){
    const {y,m,d} = GMT8_NOW;
    const [, todayEnd] = gmt8DayBounds(y,m,d);
    const opt = AN_RANGES.find(r=>r.key===anKey);
    if(opt.key === 'custom'){
      // Dt-picker kustom (bukan <input type="date"> bawaan browser), dibangun & di-seed
      // setelah modul DTP tersedia — lihat blok DTP.build('anCustomFrom', ...) di bawah.
      const fromVal = DTP.get('anCustomFrom');
      const toVal = DTP.get('anCustomTo');
      if(!fromVal || !toVal) return null;
      const [fy,fm,fd] = fromVal.split('-').map(Number);
      const [ty,tm,td] = toVal.split('-').map(Number);
      const [start] = gmt8DayBounds(fy,fm-1,fd);
      const [,end] = gmt8DayBounds(ty,tm-1,td);
      if(end < start){ noteEl.textContent = 'Tanggal "Sampai" harus setelah "Dari".'; return null; }
      noteEl.textContent = '';
      return {start, end};
    }
    noteEl.textContent = '';
    if(opt.key === 'all'){
      // seluruh riwayat: mulai dari awal hari transaksi pertama (GMT+8) sampai akhir hari ini
      let first = null;
      DATA.trades.forEach(t=>{ if(t.tanggal_gmt8 && (first===null || t.tanggal_gmt8 < first)) first = t.tanggal_gmt8; });
      if(!first) return {start: todayEnd - 86400000, end: todayEnd};
      const [fy,fm,fd] = first.slice(0,10).split('-').map(Number);
      return {start: gmt8DayBounds(fy,fm-1,fd)[0], end: todayEnd};
    }
    return {start: todayEnd - opt.days*86400000, end: todayEnd};
  }

  function render(){
    rangeEl.classList.toggle('open', anKey === 'custom');
    const range = currentRange();
    if(!range){ statEl.innerHTML = ''; return; }
    const matched = DATA.trades.filter(t=>{
      if(!t.tanggal_gmt8) return false;
      const tt = parseGmt8(t.tanggal_gmt8);
      return tt>=range.start && tt<=range.end;
    });
    const grossWin = matched.filter(t=>t.laba>0).reduce((s,t)=>s+t.laba,0);
    const grossLoss = Math.abs(matched.filter(t=>t.laba<0).reduce((s,t)=>s+t.laba,0));
    const netPl = grossWin - grossLoss;

    const byDate = {};
    matched.forEach(t=>{
      const key = t.tanggal_gmt8.slice(0,10);
      byDate[key] = (byDate[key]||0) + t.laba;
    });
    let winDays=0, lossDays=0;
    Object.values(byDate).forEach(pl=>{ if(pl>0) winDays++; else if(pl<0) lossDays++; });
    const totalDays = Math.max(1, Math.round((range.end - range.start)/86400000));
    const breakevenDays = Math.max(0, totalDays - winDays - lossDays);
    const winRateOfDays = winDays/totalDays;

    statEl.innerHTML = `
      <div class="stat"><div class="stat-lbl">Total Laba</div><div class="stat-val up">+${fmtMoney(grossWin)}</div></div>
      <div class="stat"><div class="stat-lbl">Total Kerugian</div><div class="stat-val down">-${fmtMoney(grossLoss)}</div></div>
      <div class="stat"><div class="stat-lbl">Laba/Rugi Bersih</div><div class="stat-val ${netPl>=0?'up':'down'}">${netPl>=0?'+':''}${fmtMoney(netPl)}</div></div>
      <div class="stat"><div class="stat-lbl">Hari Menang</div><div class="stat-val up">${winDays} Hari</div></div>
      <div class="stat"><div class="stat-lbl">Hari Rugi</div><div class="stat-val down">${lossDays} Hari</div></div>
      <div class="stat"><div class="stat-lbl">Hari Titik Impas</div><div class="stat-val">${breakevenDays} Hari</div></div>
      <div class="stat"><div class="stat-lbl">Tingkat Kemenangan</div><div class="stat-val">${fmtPct(winRateOfDays)}</div></div>
    `;
  }

  buildPeriodChips(granEl, { items: AN_RANGES, active: anKey, onSelect: k=>{ anKey = k; render(); } });
  render();
  window.renderAnalisisRange = render;
})();

// ---------- Analisis PNL: Kalender P&L harian, independen dari rentang di atas, gaya sama dgn tab Ringkasan ----------
(function(){
  const grid = document.getElementById('anCalGrid');
  if(!grid) return;
  const monthLabel = document.getElementById('anCalMonthLabel');
  const summaryEl = document.getElementById('anCalSummary');
  const prevBtn = document.getElementById('anCalPrev');
  const nextBtn = document.getElementById('anCalNext');

  const byDate = {};
  DATA.trades.forEach(t=>{
    if(!t.tanggal_gmt8) return;
    const key = t.tanggal_gmt8.slice(0,10);
    if(!byDate[key]) byDate[key] = {pl:0, count:0};
    byDate[key].pl += t.laba;
    byDate[key].count += 1;
  });
  let maxAbsDaily = 1;
  for(const d of Object.values(byDate)){ const a = Math.abs(d.pl); if(a > maxAbsDaily) maxAbsDaily = a; }

  const allKeys = Object.keys(byDate).sort();
  const todayKey = GMT8_TODAY_KEY;
  let curYear, curMonth;
  if(allKeys.length){
    const last = allKeys[allKeys.length-1];
    curYear = +last.slice(0,4); curMonth = +last.slice(5,7)-1;
  } else {
    const now = new Date();
    curYear = now.getFullYear(); curMonth = now.getMonth();
  }

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  function render(){
    monthLabel.textContent = monthNames[curMonth] + ' ' + curYear;
    const firstOfMonth = new Date(curYear, curMonth, 1);
    const daysInMonth = new Date(curYear, curMonth+1, 0).getDate();
    let startWeekday = firstOfMonth.getDay();
    startWeekday = (startWeekday+6)%7;

    let cells = '';
    for(let i=0;i<startWeekday;i++) cells += `<div class="cal-day empty"></div>`;
    let monthPl = 0, winDays = 0, lossDays = 0, activeDays = 0;
    for(let d=1; d<=daysInMonth; d++){
      const key = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const info = byDate[key];
      let cls = 'cal-day', style = '', inner = `<span class="cd-num">${d}</span>`;
      if(info){
        activeDays++;
        monthPl += info.pl;
        const intensity = 0.22 + 0.65*(Math.abs(info.pl)/maxAbsDaily);
        const [gr,gg,gb] = hexToRgb(cssVar('--gain'));
        const [lr,lg,lb] = hexToRgb(cssVar('--loss'));
        if(info.pl>0){ cls += ' gain'; style = `background:rgba(${gr},${gg},${gb},${intensity.toFixed(2)})`; winDays++; }
        else if(info.pl<0){ cls += ' loss'; style = `background:rgba(${lr},${lg},${lb},${intensity.toFixed(2)})`; lossDays++; }
        inner += `<span class="cd-pl">${info.pl>=0?'+':''}${fmtMoneyNum(info.pl, true)}</span><span class="cd-count">${info.count}× </span>`;
      } else {
        inner += `<span class="cd-pl">&nbsp;</span>`;
      }
      if(key===todayKey) cls += ' today';
      cells += `<div class="${cls}" style="${style}" title="${key}" data-date="${key}">${inner}</div>`;
    }
    grid.innerHTML = cells;
    summaryEl.innerHTML = `
      <span><span class="cs-lbl">Laba/rugi bulan ini</span><span class="${monthPl>=0?'up':'down'}">${monthPl>=0?'+':''}${fmtMoney(monthPl)}</span></span>
      <span><span class="cs-lbl">Hari aktif</span>${activeDays}</span>
      <span><span class="cs-lbl">Hari untung</span><span class="up">${winDays}</span></span>
      <span><span class="cs-lbl">Hari rugi</span><span class="down">${lossDays}</span></span>
    `;
  }
  prevBtn.onclick = ()=>{ curMonth--; if(curMonth<0){curMonth=11;curYear--;} render(); };
  nextBtn.onclick = ()=>{ curMonth++; if(curMonth>11){curMonth=0;curYear++;} render(); };
  render();
  window.renderAnCalendar = render;

  grid.addEventListener('click', (e)=>{
    const cell = e.target.closest('.cal-day[data-date]');
    if(cell && window.openDayModal) window.openDayModal(cell.dataset.date);
  });
})();

// ---------- Months ----------
const monthGrid = document.getElementById('monthGrid');
const maxAbsPl = Math.max(...DATA.months.map(m=>Math.abs(m.pl)));
const evalClass = ev => ev==='Sangat Baik' ? 'good' : (ev==='Waspada' ? 'warn' : 'bad');
DATA.months.forEach(m=>{
  const row = document.createElement('div');
  row.className = 'month-row';
  const barPct = Math.min(100, Math.abs(m.pl)/maxAbsPl*100);
  const pos = m.pl>=0;
  const pctTxt = (m.pct===null || m.pct===undefined) ? '\u2013' : `${m.pct>=0?'+':''}${fmtPct(m.pct)}`;
  row.innerHTML = `
    <div class="m-top">
      <span class="m-name">${m.bulan}</span>
      <span class="m-pl-wrap"><span class="m-pl ${pos?'up':'down'}">${pos?'+':''}${fmtMoney(m.pl)}</span><span class="m-pct">(${pctTxt} thd saldo sebelum)</span></span>
    </div>
    <div class="m-bar-track"><div class="m-bar ${pos?'pos':'neg'}" style="width:${barPct}%"></div></div>
    <div class="m-meta">
      <span>${m.trans}\u00d7 transaksi \u2022 <span class="m-wr">WR ${fmtPct(m.winrate)}</span></span>
      <span class="m-eval-badge ${evalClass(m.eval)}">${m.eval}</span>
    </div>
  `;
  monthGrid.appendChild(row);
});

// ---------- Weeks ----------
const weeks = DATA.weeks;
const STRIP_H = 92; // must match .week-strip height in CSS
const maxGainW = Math.max(0, ...weeks.map(w=>w.pl));
const maxLossW = Math.max(0, ...weeks.map(w=>-w.pl));
const rangeW = (maxGainW + maxLossW) || 1;
const baselinePx = (maxLossW/rangeW) * STRIP_H; // distance of zero-line from bottom
const stripEl = document.getElementById('weekStrip');
const labelsEl = document.getElementById('weekLabels');

const zeroLine = document.createElement('div');
zeroLine.className = 'week-zero-line';
zeroLine.style.bottom = baselinePx + 'px';
stripEl.appendChild(zeroLine);

const weekTooltip = document.createElement('div');
weekTooltip.className = 'eq-tooltip week-tooltip';
stripEl.appendChild(weekTooltip);

weeks.forEach(w=>{
  const pctTxt = (w.pct===null || w.pct===undefined) ? '\u2013' : `${w.pct>=0?'+':''}${fmtPct(w.pct)}`;
  const wrap = document.createElement('div');
  wrap.className = 'week-bar-wrap';
  const pos = w.pl>=0;
  const barH = Math.max(2, Math.abs(w.pl)/rangeW * STRIP_H);
  const barStyle = pos
    ? `height:${barH}px;bottom:${baselinePx}px;`
    : `height:${barH}px;top:${STRIP_H-baselinePx}px;`;
  wrap.innerHTML = `<div class="week-bar ${pos?'':'neg'}" style="${barStyle}"></div>`;
  wrap.addEventListener('mouseenter', ()=>{
    weekTooltip.style.opacity = 1;
    weekTooltip.style.left = (wrap.offsetLeft + wrap.offsetWidth/2) + 'px';
    weekTooltip.innerHTML = `<span class="t-date">Minggu ${w.minggu} \u00b7 ${w.periode}</span>${pos?'+':''}${fmtMoney(w.pl)} <span style="color:var(--paper-dim)">(${pctTxt})</span><br><span style="color:var(--paper-faint)">WR ${fmtPct(w.winrate)} \u2022 ${w.trans} transaksi</span>`;
  });
  wrap.addEventListener('mouseleave', ()=>{ weekTooltip.style.opacity = 0; });
  stripEl.appendChild(wrap);
  const lbl = document.createElement('span');
  lbl.textContent = 'W'+w.minggu;
  labelsEl.appendChild(lbl);
});
document.querySelector('.week-strip-scroll').scrollLeft = 999999;

// ---------- Records ----------
document.getElementById('maxddNote').textContent = convCentText(DATA.maxdd_note);
const winEl = document.getElementById('topWin');
DATA.dashboard.top_win.forEach(t=>{
  const [date, amt] = t.split('•').map(s=>s.trim());
  winEl.innerHTML += `<div class="rec-row"><span class="rec-date">${date}</span><span class="up">${convCentText(amt)}</span></div>`;
});
const lossEl = document.getElementById('topLoss');
DATA.dashboard.top_loss.forEach(t=>{
  const [date, amt] = t.split('•').map(s=>s.trim());
  lossEl.innerHTML += `<div class="rec-row"><span class="rec-date">${date}</span><span class="down">${convCentText(amt)}</span></div>`;
});

// ---------- Split arah: Beli vs Jual (pie chart) ----------
function renderSplitArah(){
  const centerEl = document.getElementById('splitPieCenter');
  const legendEl = document.getElementById('splitPieLegend');
  const arcBeli = document.getElementById('splitPieBeli');
  const arcJual = document.getElementById('splitPieJual');
  if(!centerEl || !legendEl || !arcBeli || !arcJual) return;
  const groups = { Beli: [], Jual: [] };
  DATA.trades.forEach(t=>{ if(groups[t.arah]) groups[t.arah].push(t); });
  const totalTrans = DATA.trades.length;

  function stats(list){
    const n = list.length;
    const wins = list.filter(t=>t.laba>0);
    const losses = list.filter(t=>t.laba<0);
    const pl = list.reduce((s,t)=>s+t.laba,0);
    const winrate = n ? wins.length/n : 0;
    return {n, wins: wins.length, losses: losses.length, winrate, pl};
  }

  const sBeli = stats(groups.Beli), sJual = stats(groups.Jual);
  const pctBeli = totalTrans ? sBeli.n/totalTrans*100 : 0;
  const pctJual = totalTrans ? sJual.n/totalTrans*100 : 0;
  const gainColor = cssVar('--gain'), lossColor = cssVar('--loss');

  const r = 64, circ = 2*Math.PI*r;
  const beliLen = circ * pctBeli/100;
  const jualLen = circ * pctJual/100;
  arcBeli.setAttribute('stroke', gainColor);
  arcBeli.setAttribute('stroke-dasharray', `${beliLen} ${circ-beliLen}`);
  arcJual.setAttribute('stroke', lossColor);
  arcJual.setAttribute('stroke-dasharray', `${jualLen} ${circ-jualLen}`);
  arcJual.setAttribute('stroke-dashoffset', `${-beliLen}`);

  legendEl.innerHTML = ['Beli','Jual'].map(arah=>{
    const s = arah==='Beli' ? sBeli : sJual;
    const pct = arah==='Beli' ? pctBeli : pctJual;
    const tagClass = arah==='Beli' ? 'beli' : 'jual';
    const plClass = s.pl>=0 ? 'up' : 'down';
    return `
      <div class="spl-row" data-arah="${arah}">
        <span class="tag ${tagClass}">${arah}</span>
        <span style="font-size:12px;color:var(--paper-dim);">${s.n} transaksi &middot; ${pct.toFixed(1)}%</span>
        <span class="spl-meta">
          <span class="spl-pl ${plClass}">${fmtMoney(s.pl)}</span>
          WR ${fmtPct(s.winrate)} &middot; ${s.wins}W/${s.losses}L
        </span>
      </div>
    `;
  }).join('');

  // ---------- Interaksi hover/klik: tampilkan detail arah di tengah donut ----------
  const detailByArah = { Beli: sBeli, Jual: sJual };
  const pctByArah = { Beli: pctBeli, Jual: pctJual };
  const colorByArah = { Beli: gainColor, Jual: lossColor };
  let pinnedArah = null;

  function showTotalCenter(){
    centerEl.innerHTML = `<div class="spc-num">${totalTrans}</div><div class="spc-lbl">Transaksi</div>`;
  }
  function showDetailCenter(arah){
    const s = detailByArah[arah];
    const pct = pctByArah[arah];
    const plSign = s.pl>=0 ? '+' : '';
    centerEl.innerHTML = `
      <div class="spc-num" style="color:${colorByArah[arah]}">${s.n}</div>
      <div class="spc-lbl">${arah} &middot; ${pct.toFixed(1)}%</div>
      <div class="spc-sub">${plSign}${fmtMoney(s.pl)}<br>WR ${fmtPct(s.winrate)} &middot; ${s.wins}W/${s.losses}L</div>
    `;
  }
  function setHighlight(arah){
    arcBeli.classList.toggle('active', arah==='Beli');
    arcJual.classList.toggle('active', arah==='Jual');
    arcBeli.classList.toggle('dim', arah && arah!=='Beli');
    arcJual.classList.toggle('dim', arah && arah!=='Jual');
    legendEl.querySelectorAll('.spl-row').forEach(row=>{
      row.classList.toggle('dim', !!arah && row.dataset.arah !== arah);
    });
  }
  function clearHighlight(){
    arcBeli.classList.remove('active','dim');
    arcJual.classList.remove('active','dim');
    legendEl.querySelectorAll('.spl-row').forEach(row=>row.classList.remove('dim'));
  }
  function focusArah(arah){
    showDetailCenter(arah);
    setHighlight(arah);
  }
  function unfocus(){
    if(pinnedArah){ focusArah(pinnedArah); return; }
    showTotalCenter();
    clearHighlight();
  }
  function togglePin(arah){
    pinnedArah = (pinnedArah === arah) ? null : arah;
    if(pinnedArah) focusArah(pinnedArah); else unfocus();
  }

  showTotalCenter();
  [[arcBeli,'Beli'],[arcJual,'Jual']].forEach(([el, arah])=>{
    el.onmouseenter = () => focusArah(arah);
    el.onmouseleave = () => unfocus();
    el.onclick = () => togglePin(arah);
  });
  legendEl.querySelectorAll('.spl-row').forEach(row=>{
    const arah = row.dataset.arah;
    row.onmouseenter = () => focusArah(arah);
    row.onmouseleave = () => unfocus();
    row.onclick = () => togglePin(arah);
  });
}
renderSplitArah();
window.renderSplitArah = renderSplitArah;

// ---------- Money management ----------
const mm = DATA.dashboard.mm;

// ---------- Kalkulator money management (interaktif; tampil di modal dari tab Transaksi, v1.1.114) ----------
(function(){
  const elSaldo = document.getElementById('calcSaldo');
  const elRisk = document.getElementById('calcRisk');
  const elSl = document.getElementById('calcSl');
  const elRr = document.getElementById('calcRr');
  const gridQuick = document.getElementById('mmGridQuick');
  const warnBox = document.getElementById('calcWarn');
  const resetBtn = document.getElementById('calcResetBtn');
  if(!elSaldo || !gridQuick) return;

  const pipval = mm.pipval || 10;
  const defaultRr = (mm.sl>0) ? (mm.tp_pips / mm.sl) : 1.5;

  function setDefaults(){
    elRisk.value = (mm.risk*100).toFixed(1);
    elSl.value = mm.sl;
    elRr.value = defaultRr.toFixed(1);
  }
  elSaldo.value = mm.equity; // statis, selalu mengikuti saldo jurnal terkini — bukan input yang bisa diubah user
  setDefaults();

  function render(){
    const saldo = mm.equity; // statis, tidak bisa diubah dari input
    const riskPct = Math.max(0, parseFloat(elRisk.value) || 0) / 100;
    const sl = Math.max(0.01, parseFloat(elSl.value) || 0.01);
    const rr = Math.max(0.01, parseFloat(elRr.value) || 0.01);

    const riskCent = saldo * riskPct;
    const lot = riskCent / (sl * pipval);
    const tpPips = sl * rr;
    const tpCent = riskCent * rr;

    gridQuick.innerHTML = `
      <div class="mm-cell"><div class="stat-lbl">Risiko / trade</div><div class="stat-val">${fmtCent(riskCent)}¢</div><div class="stat-sub">\u2248 ${fmtRp(riskCent/100*DATA.kurs)}</div></div>
      <div class="mm-cell highlight"><div class="stat-lbl">Lot ideal disarankan</div><div class="stat-val">${lot.toFixed(2)}</div></div>
      <div class="mm-cell"><div class="stat-lbl">Stop loss</div><div class="stat-val">${sl} pips</div></div>
      <div class="mm-cell"><div class="stat-lbl">Take profit</div><div class="stat-val">${tpPips.toFixed(1)} pips</div></div>
      <div class="mm-cell"><div class="stat-lbl">Target profit</div><div class="stat-val">${fmtCent(tpCent)}¢</div><div class="stat-sub">\u2248 ${fmtRp(tpCent/100*DATA.kurs)}</div></div>
      <div class="mm-cell"><div class="stat-lbl">Rasio risk:reward</div><div class="stat-val">1 : ${rr.toFixed(1)}</div></div>
    `;

    if(warnBox){
      if(riskPct > 0.03){
        warnBox.textContent = `Risiko ${(riskPct*100).toFixed(1)}% per transaksi tergolong agresif — umumnya disarankan di bawah 2-3% dari saldo agar tahan dari beberapa kali kalah beruntun.`;
        warnBox.classList.add('show');
      } else if(lot < 0.01){
        warnBox.textContent = 'Lot ideal di bawah 0.01 — pertimbangkan menaikkan risiko atau memperkecil stop loss.';
        warnBox.classList.add('show');
      } else {
        warnBox.classList.remove('show');
      }
    }
  }

  [elRisk, elSl, elRr].forEach(el=>{
    el.addEventListener('input', render);
  });
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{ setDefaults(); render(); });
  }
  render();

  const quotes = [
    'Bertahan lebih penting daripada menang besar sekali.',
    'Rencana trading yang dilanggar bukan lagi rencana.',
    'Ukuran lot yang tepat melindungi modal saat arah salah.',
    'Kerugian kecil adalah biaya normal, bukan kegagalan.',
    'Konsistensi mengalahkan keberuntungan dalam jangka panjang.',
    'Jangan biarkan satu transaksi menentukan mood satu hari.',
    'Evaluasi proses, bukan hanya hasil akhir.',
    'Modal yang bertahan adalah modal yang bisa profit besok.'
  ];
  const quoteEl = document.getElementById('quoteBox');
  if(quoteEl){
    quoteEl.textContent = '“' + quotes[Math.floor(Math.random()*quotes.length)] + '”';
  }
})();

// ---------- Log deposit ----------
const DEP_SORT_GETTERS = {
  tanggal: e => baseToUtcMs(e.tanggal),
  jenis: e => e.jenis,
  tipe: e => e.tipe,
  cent: e => e.cent
};
let depSort = { key:'tanggal', dir:-1 }; // default: terbaru dulu

function renderDepositLog(){
  const dep = DATA.deposit;
  document.getElementById('depositSummary').innerHTML = `
    <div class="mm-cell"><div class="stat-lbl">Total deposit</div><div class="stat-val up">${fmtMoney(dep.total_deposit)}</div></div>
    <div class="mm-cell"><div class="stat-lbl">Total penarikan</div><div class="stat-val down">${fmtMoney(dep.total_penarikan)}</div></div>
    <div class="mm-cell"><div class="stat-lbl">Kompensasi MC</div><div class="stat-val" style="color:var(--gold)">${fmtMoney(dep.total_mc)}</div></div>
    <div class="mm-cell highlight"><div class="stat-lbl">Modal bersih</div><div class="stat-val">${fmtMoney(dep.modal_bersih)}</div></div>
  `;
  const tipeTag = t => {
    if(t==='Deposit') return `<span class="tag deposit">Deposit</span>`;
    if(t==='Penarikan') return `<span class="tag penarikan">Penarikan</span>`;
    return `<span class="tag kompensasi">Kompensasi MC</span>`;
  };
  const q = document.getElementById('depositSearchBox').value.trim().toLowerCase();
  const tipeFilter = CS.get('csw_depositFilterTipe');
  const filtered = dep.log.filter(e=>{
    if(q && !e.jenis.toLowerCase().includes(q)) return false;
    if(tipeFilter && e.tipe !== tipeFilter) return false;
    return true;
  });
  const getter = DEP_SORT_GETTERS[depSort.key];
  filtered.sort((a,b)=>{
    const ka = getter(a), kb = getter(b);
    const cmp = (typeof ka === 'string') ? ka.localeCompare(kb) : (ka - kb);
    return cmp * depSort.dir;
  });
  const body = document.getElementById('depositBody');
  body.innerHTML = filtered.length ? filtered.map(e=>`
    <tr>
      <td>${fmtDateTime(e.tanggal)}</td>
      <td style="text-align:left;color:var(--paper-dim);">${e.jenis}</td>
      <td>${tipeTag(e.tipe)}</td>
      <td class="${e.cent>=0?'laba pos':'laba neg'}">${e.cent>=0?'+':''}${fmtMoney(e.cent)}</td>
    </tr>`).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--paper-faint);padding:18px 8px;">Tidak ada data yang cocok.</td></tr>`;
}

// ---------- Sort header log deposit (klik atau keyboard) ----------
(function(){
  const headers = [...document.querySelectorAll('#tabpanel-modal table.ledger thead th.sortable')];
  function updateDepHeaderIndicators(){
    headers.forEach(h=>{
      const ind = h.querySelector('.sort-ind');
      const isActive = h.dataset.key === depSort.key;
      h.classList.toggle('active', isActive);
      ind.textContent = isActive ? (depSort.dir===1 ? '▲' : '▼') : '';
      h.setAttribute('aria-sort', isActive ? (depSort.dir===1 ? 'ascending' : 'descending') : 'none');
    });
  }
  function applyDepSort(key){
    if(depSort.key === key){
      depSort.dir *= -1;
    } else {
      depSort.key = key;
      depSort.dir = (key==='tanggal') ? -1 : 1;
    }
    updateDepHeaderIndicators();
    renderDepositLog();
  }
  headers.forEach(h=>{
    h.setAttribute('tabindex','0');
    h.setAttribute('role','button');
    h.addEventListener('click', ()=>applyDepSort(h.dataset.key));
    h.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        applyDepSort(h.dataset.key);
      }
    });
  });
  updateDepHeaderIndicators();
})();
document.getElementById('depositSearchBox').addEventListener('input', renderDepositLog);
window.renderDepositLog = renderDepositLog;

// ---------- Trades ledger ----------
const allTrades = [...DATA.trades].reverse(); // newest first
const tbody = document.getElementById('ledgerBody');

// Ambang "rugi besar": 10% kerugian terburuk secara historis (persentil, bukan angka tetap)
const sortedLosses = allTrades.map(t=>t.laba).filter(v=>v<0).sort((a,b)=>a-b);
let bigLossPct = 10;
try{ const v = localStorage.getItem('jurnalBigLossPct'); if(v==='off') bigLossPct = 0; else if(v!==null){ const n = parseFloat(v); if(n>=1 && n<=50) bigLossPct = n; } }catch(e){}
let bigLossThreshold = null;
function recomputeBigLoss(){
  bigLossThreshold = (bigLossPct>0 && sortedLosses.length) ? sortedLosses[Math.max(0, Math.ceil(sortedLosses.length*bigLossPct/100)-1)] : null;
  document.getElementById('tradeCount').textContent = allTrades.length + ' transaksi tercatat' + (bigLossThreshold!==null ? ` · garis merah = rugi ${String(bigLossPct).replace('.',',')}% terbesar` : '');
}

recomputeBigLoss();

const SORT_GETTERS = {
  tanggal: t => parseGmt8(t.tanggal_gmt8),
  id: t => t.id,
  arah: t => t.arah,
  lot: t => t.lot,
  buka: t => t.buka,
  tutup: t => t.tutup,
  pips: t => t.pips,
  laba: t => t.laba,
  wbuka: t => t.waktu_buka ? parseGmt8(t.waktu_buka) : 0,
  durasi: t => tradeDurMin(t) ?? -1
};
function tradeDurMin(t){
  if(!t.waktu_buka) return null;
  const m = Math.round((parseGmt8(t.tanggal_gmt8) - parseGmt8(t.waktu_buka)) / 60000);
  return isFinite(m) && m >= 0 ? m : null;
}
function fmtTradeDur(m){
  if(m===null) return '-';
  if(m < 60) return m + ' mnt';
  if(m < 1440) return Math.floor(m/60) + 'j ' + String(m%60).padStart(2,'0') + 'm';
  return Math.floor(m/1440) + 'h ' + Math.floor(m%1440/60) + 'j';
}
let currentSort = { key:'tanggal', dir:-1 }; // default: tanggal terbaru dulu
let lastFilteredTrades = [];

const ledgerSel = new Set();
let ledgerLimit = 300; const LEDGER_STEP = 100, LEDGER_KEY = 'jurnalLedgerState'; let ledgerRestoring = false;
function saveLedgerState(f){
  if(ledgerRestoring) return;
  try{
    const sc = document.querySelector('.ledger-scroll'), chip = document.querySelector('.ledger-quick-range .quick-chip.active');
    sessionStorage.setItem(LEDGER_KEY, JSON.stringify(Object.assign({}, f, { sort:currentSort, limit:ledgerLimit, chip:chip ? chip.dataset.range : '', st:sc ? sc.scrollTop : 0 })));
  }catch(e){}
}
window.addEventListener('pagehide', ()=>{
  try{ const v = JSON.parse(sessionStorage.getItem(LEDGER_KEY)||'null'), sc = document.querySelector('.ledger-scroll'); if(v && sc){ v.st = sc.scrollTop; sessionStorage.setItem(LEDGER_KEY, JSON.stringify(v)); } }catch(e){}
});
function hasNote(t){ return !!(t.trigger || t.trigger_exit || t.emosi || t.jenis_entry); }
function renderTrades(){
  const q = document.getElementById('searchBox').value.trim().toLowerCase();
  const arah = CS.get('csw_filterArah');
  const hasil = CS.get('csw_filterHasil');
  const catatan = CS.get('csw_filterCatatan');
  const fEmosi = CS.get('csw_filterEmosi'), fTrig = CS.get('csw_filterTrigger'), fJenis = CS.get('csw_filterJenis'), fSesi = CS.get('csw_filterSesi');
  const fromV = DTP.get('ledgerFrom');
  const toV = DTP.get('ledgerTo');
  const rs = fromV ? parseGmt8(fromV+'T00:00:00') : null;
  const re = toV ? parseGmt8(toV+'T23:59:59') : null;
  const lotMinV = document.getElementById('ledgerLotMin').value;
  const lotMaxV = document.getElementById('ledgerLotMax').value;
  const lotMin = lotMinV !== '' ? parseFloat(lotMinV) : null;
  const lotMax = lotMaxV !== '' ? parseFloat(lotMaxV) : null;
  const noteEl = document.getElementById('ledgerFilterNote');
  const dateInvalid = (rs!==null && re!==null && re<rs);
  const lotInvalid = (lotMin!==null && lotMax!==null && lotMax<lotMin);
  noteEl.textContent = dateInvalid ? 'Tanggal "sampai" harus setelah "dari"'
    : lotInvalid ? '"Lot max" harus lebih besar dari "Lot min"' : '';
  const filtered = (dateInvalid || lotInvalid) ? [] : allTrades.filter(t=>{
    if(q && !t.id.toLowerCase().includes(q) && !String(t.catatan||'').toLowerCase().includes(q)) return false;
    if(arah && t.arah!==arah) return false;
    if(hasil==='win' && t.laba<=0) return false;
    if(hasil==='loss' && t.laba>=0) return false;
    if(catatan==='belum' && hasNote(t)) return false;
    if(catatan==='sudah' && !hasNote(t)) return false;
    if(fEmosi && t.emosi!==fEmosi) return false;
    if(fTrig && t.trigger!==fTrig) return false;
    if(fJenis && t.jenis_entry!==fJenis) return false;
    if(fSesi!=='' && (!t.waktu_buka || lapSessionIdx(new Date(parseGmt8(t.waktu_buka) + 8*3600000).getUTCHours()) !== +fSesi)) return false;
    if(lotMin!==null && t.lot < lotMin) return false;
    if(lotMax!==null && t.lot > lotMax) return false;
    const tt = parseGmt8(t.tanggal_gmt8);
    if(rs!==null && tt < rs) return false;
    if(re!==null && tt > re) return false;
    return true;
  });
  const getter = SORT_GETTERS[currentSort.key];
  filtered.sort((a,b)=>{
    const ka = getter(a), kb = getter(b);
    const cmp = (typeof ka === 'string') ? ka.localeCompare(kb) : (ka - kb);
    return cmp * currentSort.dir;
  });
  tbody.innerHTML = filtered.length ? filtered.slice(0,ledgerLimit).map(t=>`
    <tr class="${bigLossThreshold!==null && t.laba<=bigLossThreshold ? 'big-loss' : ''}${ledgerSel.has(t.id) ? ' sel-on' : ''}" data-id="${escapeHtml(t.id)}" data-meta="${escapeHtml('Lot '+t.lot+' · '+t.buka.toFixed(2)+' → '+t.tutup.toFixed(2)+' · '+(t.pips>=0?'+':'')+t.pips.toFixed(1)+'p')}">
      <td class="c-date"><input type="checkbox" class="sel-cb" tabindex="-1" aria-label="Pilih transaksi"${ledgerSel.has(t.id) ? ' checked' : ''}>${fmtDateTime(t.tanggal)}</td>
      <td class="c-id"><span class="note-dot ${hasNote(t)?'on':''}" title="${escapeHtml(hasNote(t) ? 'Catatan: '+[t.emosi,t.trigger,t.jenis_entry].filter(Boolean).join(' · ') : 'Belum ada catatan psikologi')}"></span>${escapeHtml(t.id)}${t.catatan ? `<span class="cat-ico" title="${escapeHtml(String(t.catatan).slice(0,160))}">✎</span>` : ''}</td>
      <td class="c-dir"><span class="tag ${t.arah==='Beli'?'beli':'jual'}">${escapeHtml(t.arah)}</span></td>
      <td class="c-lot" data-l="Lot">${t.lot}</td>
      <td class="c-open" data-l="Buka">${t.buka.toFixed(2)}</td>
      <td class="c-close" data-l="Tutup">${t.tutup.toFixed(2)}</td>
      <td class="col-x">${t.waktu_buka ? fmtDateTimeGmt8(t.waktu_buka) : '-'}</td>
      <td class="col-x">${fmtTradeDur(tradeDurMin(t))}</td>
      <td class="c-pips ${t.pips>=0?'laba pos':'laba neg'}" data-l="Pips">${t.pips>=0?'+':''}${t.pips.toFixed(1)}</td>
      <td class="c-laba ${t.laba>=0?'laba pos':'laba neg'}">${t.laba>=0?'+':''}${fmtMoneyNum(t.laba)}</td>
    </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;color:var(--paper-faint);padding:18px 8px;">Tidak ada transaksi yang cocok dengan filter.</td></tr>`;
  const sum = filtered.reduce((s,t)=>s+t.laba,0);
  document.getElementById('ledgerShown').textContent = `Menampilkan ${Math.min(filtered.length,ledgerLimit)} dari ${filtered.length}`;
  document.getElementById('ledgerSum').textContent = `Jumlah: ${fmtMoney(sum)}`;
  const wn = filtered.filter(t=>t.laba>0), ls = filtered.filter(t=>t.laba<0);
  const gw = wn.reduce((a,t)=>a+t.laba,0), gl = ls.reduce((a,t)=>a+t.laba,0), stEl = document.getElementById('ledgerStats');
  if(stEl) stEl.textContent = filtered.length ? `Seluruh hasil filter: ${wn.length} menang · ${ls.length} rugi · WR ${(wn.length/filtered.length*100).toFixed(1).replace('.',',')}%` + (wn.length ? ` · rata-rata menang ${fmtMoney(gw/wn.length)}` : '') + (ls.length ? ` · rata-rata rugi ${fmtMoney(gl/ls.length)}` + (wn.length ? ` · PF ${(gw/Math.abs(gl)).toFixed(2).replace('.',',')}` : '') : '') : '';
  lastFilteredTrades = filtered;
  { const ss = document.getElementById('ledgerSortSel'); if(ss){ const v = currentSort.key + ':' + currentSort.dir; ss.value = [...ss.options].some(o=>o.value===v) ? v : ''; } }
  const moreBtn = document.getElementById('ledgerMoreBtn');
  if(moreBtn){ const rest = filtered.length - ledgerLimit; moreBtn.style.display = rest>0 ? '' : 'none'; if(rest>0) moreBtn.textContent = `Tampilkan ${Math.min(LEDGER_STEP,rest)} lagi (${rest} tersisa)`; }
  saveLedgerState({ q, arah, hasil, catatan, fEmosi, fTrig, fJenis, fSesi, from:fromV||'', to:toV||'', lotMin:lotMinV, lotMax:lotMaxV });
  if(noteEl.textContent === ''){ const miss = filtered.filter(t=>!hasNote(t)).length; if(filtered.length && miss) noteEl.textContent = `${miss} dari ${filtered.length} transaksi di tampilan ini belum punya catatan psikologi. Buka satu transaksi → Edit → "Simpan & lanjut" untuk mengisi berurutan.`; }

  let activeFilters = 0;
  if(q) activeFilters++;
  if(arah) activeFilters++;
  if(hasil) activeFilters++;
  if(catatan) activeFilters++;
  if(fEmosi) activeFilters++;
  if(fTrig) activeFilters++;
  if(fJenis) activeFilters++;
  if(fSesi!=='') activeFilters++;
  if(fromV || toV) activeFilters++;
  if(lotMinV !== '' || lotMaxV !== '') activeFilters++;
  const badgeEl = document.getElementById('ledgerFilterBadge');
  if(activeFilters>0){
    badgeEl.textContent = activeFilters + ' filter aktif';
    badgeEl.classList.add('show');
  } else {
    badgeEl.textContent = '';
    badgeEl.classList.remove('show');
  }
}

// ---------- Sort header (klik atau keyboard untuk sortir) ----------
(function(){
  const headers = [...document.querySelectorAll('#tabpanel-transaksi table.ledger thead th.sortable')];
  function updateHeaderIndicators(){
    headers.forEach(h=>{
      const ind = h.querySelector('.sort-ind');
      const isActive = h.dataset.key === currentSort.key;
      h.classList.toggle('active', isActive);
      ind.textContent = isActive ? (currentSort.dir===1 ? '▲' : '▼') : '';
      h.setAttribute('aria-sort', isActive ? (currentSort.dir===1 ? 'ascending' : 'descending') : 'none');
    });
  }
  function applySort(key){
    if(currentSort.key === key){
      currentSort.dir *= -1;
    } else {
      currentSort.key = key;
      currentSort.dir = (key==='tanggal') ? -1 : 1; // tanggal default terbaru dulu, kolom lain default naik
    }
    updateHeaderIndicators();
    renderTrades();
  }
  headers.forEach(h=>{
    h.setAttribute('tabindex','0');
    h.setAttribute('role','button');
    h.addEventListener('click', ()=>applySort(h.dataset.key));
    h.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        applySort(h.dataset.key);
      }
    });
  });
  updateHeaderIndicators();
  window.updateLedgerSortInd = updateHeaderIndicators;
})();
(function(){
  const sel = document.getElementById('ledgerSortSel'); if(!sel) return;
  const sync = ()=>{ const v = currentSort.key + ':' + currentSort.dir; sel.value = [...sel.options].some(o=>o.value===v) ? v : ''; };
  sel.addEventListener('change', ()=>{
    if(!sel.value) return;
    const [k,d] = sel.value.split(':'); currentSort.key = k; currentSort.dir = +d;
    if(window.updateLedgerSortInd) window.updateLedgerSortInd();
    renderTrades();
  });
  const orig = window.updateLedgerSortInd;
  window.updateLedgerSortInd = function(){ if(orig) orig(); sync(); };
  sync();
})();
document.getElementById('searchBox').addEventListener('input', renderTrades);
document.getElementById('ledgerLotMin').addEventListener('input', renderTrades);
document.getElementById('ledgerLotMax').addEventListener('input', renderTrades);
document.getElementById('ledgerResetBtn').addEventListener('click', ()=>{
  document.getElementById('searchBox').value = '';
  CS.set('csw_filterArah', '');
  CS.set('csw_filterHasil', '');
  CS.set('csw_filterCatatan', '');
  ['csw_filterEmosi','csw_filterTrigger','csw_filterJenis','csw_filterSesi'].forEach(id=>CS.set(id, ''));
  DTP.set('ledgerFrom', '');
  DTP.set('ledgerTo', '');
  document.getElementById('ledgerLotMin').value = '';
  document.getElementById('ledgerLotMax').value = '';
  document.getElementById('ledgerFilterNote').textContent = '';
  ledgerLimit = 300;
  document.querySelectorAll('.ledger-quick-range .quick-chip').forEach(b=>b.classList.remove('active'));
  syncLedgerAllChip();
  renderTrades();
});

// ---------- Quick date chips (7 Hari / 30 Hari / Bulan Ini) ----------
(function(){
  function gmt8DateKeyOffset(days){
    const {y,m,d} = GMT8_NOW;
    return gmt8DateKeyFromParts(y, m, d + days);
  }
  const chips = [...document.querySelectorAll('.ledger-quick-range .quick-chip')];
  // "All" aktif bila tidak ada chip lain aktif dan kedua tanggal kosong (default; = tanpa batas tanggal)
  window.syncLedgerAllChip = function(){
    const allChip = document.getElementById('quickAll'); if(!allChip) return;
    const other = chips.some(c=>c!==allChip && c.classList.contains('active'));
    allChip.classList.toggle('active', !other && !DTP.get('ledgerFrom') && !DTP.get('ledgerTo'));
  };
  function applyChip(range){
    const todayKey = GMT8_TODAY_KEY;
    if(range === 'all'){
      DTP.set('ledgerFrom', '');
      DTP.set('ledgerTo', '');
    } else if(range === '7'){
      DTP.set('ledgerFrom', gmt8DateKeyOffset(-6));
      DTP.set('ledgerTo', todayKey);
    } else if(range === '30'){
      DTP.set('ledgerFrom', gmt8DateKeyOffset(-29));
      DTP.set('ledgerTo', todayKey);
    } else if(range === 'today'){
      DTP.set('ledgerFrom', todayKey);
      DTP.set('ledgerTo', todayKey);
    } else if(range === 'week'){
      const {y,m,d} = GMT8_NOW, dow = new Date(Date.UTC(y,m,d)).getUTCDay(); // Senin = awal minggu
      DTP.set('ledgerFrom', gmt8DateKeyOffset(-((dow+6)%7)));
      DTP.set('ledgerTo', todayKey);
    } else if(range === 'lastmonth'){
      const {y,m} = GMT8_NOW;
      DTP.set('ledgerFrom', gmt8DateKeyFromParts(y, m-1, 1));
      DTP.set('ledgerTo', gmt8DateKeyFromParts(y, m, 0));
    } else if(range === 'month'){
      const {y,m} = GMT8_NOW;
      DTP.set('ledgerFrom', gmt8DateKeyFromParts(y, m, 1));
      DTP.set('ledgerTo', todayKey);
    }
    renderTrades();
  }
  chips.forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const wasActive = chip.classList.contains('active');
      chips.forEach(b=>b.classList.remove('active'));
      if(!wasActive || chip.dataset.range === 'all'){
        chip.classList.add('active');
        applyChip(chip.dataset.range);
      } else {
        DTP.set('ledgerFrom', '');
        DTP.set('ledgerTo', '');
        syncLedgerAllChip();
        renderTrades();
      }
    });
  });
  // Klik manual & konfirmasi (OK) pada date-picker tanggal melepas status aktif chip.
  // (dipicu lewat onChange DTP.build di atas, bukan event 'input' — dt-picker bukan <input>.)
})();
document.getElementById('ledgerExportBtn').addEventListener('click', ()=>{
  if(!lastFilteredTrades.length){ return; }
  const header = ['Tanggal tutup','ID posisi','Arah','Lot','Buka','Tutup','Pips','Laba (cent)','Tanggal tutup (GMT+8)','Waktu buka (GMT+8)','Trigger entry','Trigger exit','Emosi','Jenis entry','Catatan'];
  const csvEscape = v => {
    const s = String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const rows = lastFilteredTrades.map(t => [
    fmtDateTime(t.tanggal), t.id, t.arah, t.lot, t.buka.toFixed(2), t.tutup.toFixed(2), t.pips.toFixed(1), t.laba.toFixed(2),
    String(t.tanggal_gmt8||'').replace('T',' '), String(t.waktu_buka||'').replace('T',' '), t.trigger||'', t.trigger_exit||'', t.emosi||'', t.jenis_entry||'', t.catatan||''
  ].map(csvEscape).join(','));
  const csv = '\uFEFF' + [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const stamp = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
  a.href = url;
  a.download = `transaksi_xauusd_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
// ---------- Impor CSV transaksi (v1.1.123): menambah transaksi baru, tidak menimpa; ID yang sudah ada dilewati ----------
function parseCsvText(text){
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0] || '';
  const delim = first.split(';').length > first.split(',').length ? ';' : ',';
  const rows = []; let row = [], f = '', q = false;
  const endRow = ()=>{ row.push(f); f = ''; if(row.some(x=>x!=='')) rows.push(row); row = []; };
  for(let i=0;i<text.length;i++){
    const c = text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; }
    else if(c==='"') q = true;
    else if(c===delim){ row.push(f); f=''; }
    else if(c==='\n' || c==='\r'){ if(c==='\r' && text[i+1]==='\n') i++; endRow(); }
    else f += c;
  }
  endRow();
  return rows;
}
const CSV_ALIAS = {
  gmt8:['tanggaltutupgmt8'], tutupTime:['tanggaltutup','tanggal','waktututup','closetime','time'],
  id:['idposisi','id','ticket','position','posisi'], arah:['arah','type','tipe','direction'],
  lot:['lot','volume','size'], buka:['buka','hargabuka','openprice'], tutup:['tutup','hargatutup','closeprice'],
  pips:['pips'], laba:['labacent','laba','profit'], wb:['waktubukagmt8','waktubuka','opentime'],
  trigger:['triggerentry','trigger'], trigger_exit:['triggerexit'], emosi:['emosi'], jenis_entry:['jenisentry'], catatan:['catatan','catatanbebas','note','notes']
};
function csvToTrades(text){
  const rows = parseCsvText(text);
  if(rows.length < 2) return { fresh:[], dup:0, bad:[], assumed:false, empty:true };
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const head = rows[0].map(norm), col = {};
  for(const k in CSV_ALIAS){ for(const a of CSV_ALIAS[k]){ const i = head.indexOf(a); if(i>=0){ col[k] = i; break; } } }
  const need = ['arah','lot','buka','tutup'].filter(k=>col[k]===undefined);
  if(need.length || (col.gmt8===undefined && col.tutupTime===undefined)) return { fresh:[], dup:0, bad:[], assumed:false, missing:true };
  const pn = v => { let s = String(v==null?'':v).trim().replace(/\s/g,''); s = (s.includes(',') && !s.includes('.')) ? s.replace(',', '.') : s.replace(/,/g,''); return s==='' ? NaN : parseFloat(s); };
  const pdt = v => { const m = String(v||'').trim().match(/^(\d{4})[-./](\d{2})[-./](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/); return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]||'00'}` : ''; };
  // Format ekspor lama: "27 Sep 22:29" / "27 Sep 2026 22:29" (bulan Indonesia/Inggris; tanpa tahun -> tahun terdekat yang tidak melewati hari ini).
  // Zona waktunya = zona tampilan saat CSV diekspor; dipakai CURRENT_TZ_OFFSET lalu dikonversi ke GMT+8.
  const MON = {jan:0,feb:1,mar:2,apr:3,mei:4,may:4,jun:5,jul:6,agu:7,aug:7,agt:7,sep:8,okt:9,oct:9,nov:10,des:11,dec:11};
  const nowMs = Date.now();
  const pdtNamed = v => {
    const m = String(v||'').trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(?:(\d{4})\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if(!m) return '';
    const mo = MON[m[2].toLowerCase()]; if(mo===undefined) return '';
    const d = +m[1], h = +m[4], mi = +m[5], sec = +(m[6]||0);
    let y = m[3] ? +m[3] : new Date(nowMs + CURRENT_TZ_OFFSET*60000).getUTCFullYear();
    const toUtc = yy => Date.UTC(yy, mo, d, h, mi, sec) - CURRENT_TZ_OFFSET*60000;
    if(!m[3]) while(toUtc(y) > nowMs + 2*86400000) y--;
    const g = new Date(toUtc(y) + 8*3600000);
    if(isNaN(g)) return '';
    return g.toISOString().slice(0,19);
  };
  let namedFmt = false;
  const get = (r,k) => col[k]===undefined ? '' : String(r[col[k]]==null ? '' : r[col[k]]).trim();
  const inData = new Set(DATA.trades.map(t=>String(t.id))), inFile = new Set();
  const fresh = [], bad = []; let dup = 0;
  rows.slice(1).forEach((r, n)=>{
    const line = n + 2;
    const a = get(r,'arah'), arah = /beli|buy/i.test(a) ? 'Beli' : (/jual|sell/i.test(a) ? 'Jual' : '');
    const lot = pn(get(r,'lot')), buka = pn(get(r,'buka')), tutup = pn(get(r,'tutup'));
    let g8 = pdt(get(r,'gmt8'));
    if(!g8){
      const tt = get(r,'tutupTime');
      g8 = pdt(tt);
      if(!g8){ g8 = pdtNamed(tt); if(g8) namedFmt = true; }
    }
    if(!arah || !(lot>0) || !(buka>0) || !(tutup>0) || !g8){ bad.push(line); return; }
    const id = get(r,'id') || ('imp-' + Date.now() + '-' + line);
    // Lewati bila ID sudah ada di data. Dalam satu file, ID sama dengan waktu/harga tutup berbeda = penutupan parsial, tetap diimpor.
    const fk = id + '|' + g8 + '|' + tutup;
    if(inData.has(id) || inFile.has(fk)){ dup++; return; }
    inFile.add(fk);
    let pips = pn(get(r,'pips')), laba = pn(get(r,'laba'));
    if(!isFinite(pips)) pips = round2((arah==='Beli' ? (tutup-buka) : (buka-tutup)) * 10);
    if(!isFinite(laba)) laba = round2(pips * lot * 10);
    fresh.push({ id, arah, lot, buka, tutup, pips, laba,
      tanggal: new Date(new Date(g8 + 'Z').getTime() - 5*3600*1000).toISOString().slice(0,19), tanggal_gmt8: g8,
      waktu_buka: pdt(get(r,'wb')), trigger: get(r,'trigger'), trigger_exit: get(r,'trigger_exit'), emosi: get(r,'emosi'), jenis_entry: get(r,'jenis_entry'), ...(get(r,'catatan') ? { catatan: get(r,'catatan').slice(0,1000) } : {}) });
  });
  return { fresh, dup, bad, assumed: col.gmt8===undefined && !namedFmt, namedFmt };
}
(function(){
  const btn = document.getElementById('ledgerImportBtn'), inp = document.getElementById('ledgerImportInput');
  if(!btn || !inp) return;
  btn.addEventListener('click', ()=>inp.click());
  inp.addEventListener('change', async ()=>{
    const file = inp.files && inp.files[0]; inp.value = '';
    if(!file) return;
    let res;
    try{ res = csvToTrades(await file.text()); }catch(e){ queueNotifyAfterReload('Gagal membaca file CSV.', 'error'); location.reload(); return; }
    if(res.missing || res.empty){ await showConfirmModal(res.empty ? 'File CSV kosong atau hanya berisi judul kolom.' : 'Kolom wajib tidak ditemukan. CSV harus punya kolom Arah, Lot, Buka, Tutup, dan Tanggal tutup (pakai file hasil Ekspor CSV sebagai contoh).'); return; }
    const extra = (res.dup ? ` ${res.dup} dilewati (ID sudah ada).` : '') + (res.bad.length ? ` ${res.bad.length} baris tidak valid diabaikan (baris ${res.bad.slice(0,5).join(', ')}${res.bad.length>5?', …':''}).` : '') + (res.assumed && res.fresh.length ? ' Kolom "Tanggal tutup (GMT+8)" tidak ada, jadi waktu dianggap GMT+8.' : '') + (res.namedFmt && res.fresh.length ? ' Tanggal tanpa tahun dibaca sebagai tahun terdekat, dan jamnya dianggap mengikuti zona waktu tampilan saat ini.' : '');
    if(!res.fresh.length){ await showConfirmModal('Tidak ada transaksi baru untuk diimpor.' + extra); return; }
    if(!await showConfirmModal(`Tambahkan ${res.fresh.length} transaksi baru dari "${file.name}"? Data yang sudah ada tidak diubah.` + extra)) return;
    DATA.trades.push(...res.fresh);
    DATA.trades.sort((x,y)=>parseGmt8(x.tanggal_gmt8) - parseGmt8(y.tanggal_gmt8));
    rebuildEquitySeries();
    recomputeAll();
    if(!saveActiveData(DATA)){ await showConfirmModal('Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir).'); return; }
    queueNotifyAfterReload(`${res.fresh.length} transaksi berhasil diimpor dari CSV.`, 'success');
    setTimeout(()=>{ location.reload(); }, 300);
  });
})();
document.getElementById('ledgerMoreBtn').addEventListener('click', ()=>{ ledgerLimit += LEDGER_STEP; renderTrades(); });
(function(){
  const el = document.getElementById('limBigLossPct'); if(!el) return;
  el.value = bigLossPct > 0 ? bigLossPct : '';
  el.addEventListener('input', ()=>{
    const v = el.value.trim(), n = parseFloat(v);
    if(v === ''){ bigLossPct = 0; try{ localStorage.setItem('jurnalBigLossPct','off'); }catch(e){} }
    else if(n>=1 && n<=50){ bigLossPct = n; try{ localStorage.setItem('jurnalBigLossPct', String(n)); }catch(e){} }
    else return;
    recomputeBigLoss(); renderTrades();
  });
})();
window.renderTrades = renderTrades;

// ---------- Tema: mode (gelap/terang/otomatis) + skema warna (v1.1.121) ----------
(function(){
  const root = document.documentElement, toggleBtn = document.getElementById('themeToggle');
  // c = swatch gelap, l = swatch terang (ink, aksen, gain, loss); harus sama dengan blok CSS html[data-scheme] / html[data-theme="light"][data-scheme]
  const SCHEMES = [
    {id:'emas', n:'Emas Klasik', c:['#1B1712','#C9A24B','#84AB7C','#C06B54'], l:['#F3EDE0','#9C7526','#4F7548','#9C4530']},
    {id:'ocean', n:'Blue Ocean', c:['#071B33','#4DB8FF','#5FD0A0','#EE7B66'], l:['#EEF5FB','#0B6AAE','#1B7550','#B23F2B']},
    {id:'teal', n:'Teal Green', c:['#0B1B1C','#2EC4B6','#A6D96A','#F0806A'], l:['#EDF6F5','#09726A','#4A7419','#B0442C']},
    {id:'grafit', n:'Grafit Netral', c:['#121212','#E0B84D','#79B98A','#D9736A'], l:['#F4F4F4','#856410','#2C7742','#A63E29']},
    {id:'kontras', n:'Kontras Tinggi', c:['#0A0A0A','#FFD166','#4DA3FF','#FF9F43'], l:['#FFFFFF','#855300','#0A58C0','#B04400']}
  ];
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  let mode = 'dark', scheme = 'emas';
  try{
    const m = localStorage.getItem('jurnalTheme'), s = localStorage.getItem('jurnalScheme');
    if(m==='light'||m==='dark'||m==='auto') mode = m;
    if(SCHEMES.some(x=>x.id===s)) scheme = s;
  }catch(e){}
  const isLight = () => mode==='light' || (mode==='auto' && mq && mq.matches);
  const grid = document.getElementById('schemeGrid'), chips = [...document.querySelectorAll('#themeModes [data-mode]')];
  if(grid) grid.innerHTML = SCHEMES.map(s => `<button type="button" class="scheme-card" data-scheme-id="${s.id}" aria-pressed="false"><span class="scheme-sw">${s.c.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span>${s.n}</span></button>`).join('');
  let apply = function(persist){
    const light = isLight();
    if(light) root.setAttribute('data-theme','light'); else root.removeAttribute('data-theme');
    if(scheme!=='emas') root.setAttribute('data-scheme',scheme); else root.removeAttribute('data-scheme');
    toggleBtn.textContent = light ? '☀' : '☾';
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', SCHEMES.find(x=>x.id===scheme)[light ? 'l' : 'c'][0]);
    document.querySelectorAll('.scheme-card').forEach(card => { const sc = SCHEMES.find(x=>x.id===card.dataset.schemeId); card.querySelectorAll('.scheme-sw i').forEach((el, i) => { el.style.background = sc[light ? 'l' : 'c'][i]; }); });
    chips.forEach(c => c.classList.toggle('active', c.dataset.mode===mode));
    document.querySelectorAll('.scheme-card').forEach(c => c.setAttribute('aria-pressed', c.dataset.schemeId===scheme ? 'true' : 'false'));
    if(persist){ try{ localStorage.setItem('jurnalTheme', mode); localStorage.setItem('jurnalScheme', scheme); }catch(e){} }
    if(window.renderEquityChart) window.renderEquityChart();
    if(window.renderAnCalendar) window.renderAnCalendar();
    if(window.renderSplitArah) window.renderSplitArah();
  };
  // ---- Aksen custom + mode buta warna (v1.1.131) ----
  const accIn = document.getElementById('accentInput'), accMsg = document.getElementById('accentMsg'), cbBtns = [...document.querySelectorAll('#cbModes [data-cb]')];
  let accents = {}, cb = false;
  try{ const a = JSON.parse(localStorage.getItem('jurnalAccent')||'null'); if(a && typeof a==='object') accents = a; cb = localStorage.getItem('jurnalCB')==='1'; }catch(e){}
  const lum = h => { const c = [1,3,5].map(i => parseInt(h.substr(i,2),16)/255).map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4)); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
  const ratio = (a,b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
  const mix = (a,b,t) => '#' + [1,3,5].map(i => Math.round(parseInt(a.substr(i,2),16)*(1-t)+parseInt(b.substr(i,2),16)*t).toString(16).padStart(2,'0')).join('').toUpperCase();
  const dist = (a,b) => Math.sqrt([1,3,5].reduce((s,i) => s + Math.pow(parseInt(a.substr(i,2),16)-parseInt(b.substr(i,2),16),2), 0));
  const modeKey = () => isLight() ? 'l' : 'd';
  const say = (t, warn) => { if(accMsg){ accMsg.textContent = t||''; accMsg.classList.toggle('warn', !!warn); } };
  function paintAccent(){
    const a = accents[modeKey()];
    if(a){ root.style.setProperty('--gold', a[0]); root.style.setProperty('--gold-dim', a[1]); }
    else { root.style.removeProperty('--gold'); root.style.removeProperty('--gold-dim'); }
    if(cb) root.setAttribute('data-cb','1'); else root.removeAttribute('data-cb');
    if(accIn){ const sc = SCHEMES.find(x=>x.id===scheme); accIn.value = (a ? a[0] : sc[isLight()?'l':'c'][1]).toLowerCase(); }
    cbBtns.forEach(b => b.classList.toggle('active', (b.dataset.cb==='1') === cb));
  }
  function saveAccent(){ try{ if(Object.keys(accents).length) localStorage.setItem('jurnalAccent', JSON.stringify(accents)); else localStorage.removeItem('jurnalAccent'); localStorage.setItem('jurnalCB', cb ? '1' : '0'); }catch(e){} }
  function repaintCharts(){ if(window.renderEquityChart) window.renderEquityChart(); if(window.renderAnCalendar) window.renderAnCalendar(); if(window.renderSplitArah) window.renderSplitArah(); }
  if(accIn) accIn.addEventListener('change', () => {
    const hex = accIn.value.toUpperCase(), sc = SCHEMES.find(x=>x.id===scheme), ink = sc[isLight()?'l':'c'][0];
    const r = ratio(hex, ink);
    if(r < 4.5){ say('Aksen ditolak: kontras ' + r.toFixed(1).replace('.',',') + ':1 terhadap latar (minimal 4,5:1). Pilih warna yang lebih ' + (isLight() ? 'gelap' : 'terang') + '.', true); paintAccent(); return; }
    const near = [sc[isLight()?'l':'c'][2], sc[isLight()?'l':'c'][3]].concat(cb ? [isLight() ? '#0A58C0' : '#4DA3FF', isLight() ? '#B04400' : '#FF9F43'] : []);
    if(near.some(c => dist(hex, c.toUpperCase()) < 70)){ say('Aksen ditolak: terlalu mirip warna untung/rugi, jadi mudah tertukar dengan hasil trading.', true); paintAccent(); return; }
    accents[modeKey()] = [hex, mix(hex, ink, 0.3)];
    saveAccent(); say('Aksen ' + hex + ' dipakai (kontras ' + r.toFixed(1).replace('.',',') + ':1).'); paintAccent(); repaintCharts();
  });
  const accReset = document.getElementById('accentReset');
  if(accReset) accReset.addEventListener('click', () => { delete accents[modeKey()]; saveAccent(); say('Aksen kembali ke bawaan skema.'); paintAccent(); repaintCharts(); });
  cbBtns.forEach(b => b.addEventListener('click', () => { cb = b.dataset.cb==='1'; saveAccent(); paintAccent(); repaintCharts(); }));
  const resetBtn = document.getElementById('themeResetBtn');
  if(resetBtn) resetBtn.addEventListener('click', () => { mode = 'dark'; scheme = 'emas'; accents = {}; cb = false; saveAccent(); say('Tampilan dikembalikan ke bawaan.'); apply(true); });
  const _apply = apply;
  apply = function(persist){ _apply(persist); paintAccent(); };
  toggleBtn.addEventListener('click', () => { mode = isLight() ? 'dark' : 'light'; apply(true); });
  chips.forEach(c => c.addEventListener('click', () => { mode = c.dataset.mode; apply(true); }));
  if(grid) grid.addEventListener('click', e => { const b = e.target.closest('.scheme-card'); if(b){ scheme = b.dataset.schemeId; apply(true); } });
  if(mq){ const on = () => { if(mode==='auto') apply(false); }; if(mq.addEventListener) mq.addEventListener('change', on); else if(mq.addListener) mq.addListener(on); }
  apply(false);
})();

// ---------- Main tabs (grouping sections) — sinkron nav atas & bawah ----------
(function(){
  const btns = [...document.querySelectorAll('.main-tab-btn, .bnav-btn, #settingsGearBtn')];
  const panels = [...document.querySelectorAll('.tab-panel')];
  function goToTab(tab){
    btns.forEach(b=>{
      const isActive = b.dataset.tab === tab;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(p=>p.classList.toggle('active', p.dataset.panel===tab));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>goToTab(btn.dataset.tab));
  });
  // Jika halaman baru saja di-reload akibat aksi backup/restore/reset di tab Setelan,
  // kembalikan ke tab itu alih-alih default Ringkasan.
  let pendingTab = null;
  try{
    pendingTab = sessionStorage.getItem('jurnalPendingTab');
    sessionStorage.removeItem('jurnalPendingTab');
  }catch(e){}
  if(pendingTab){
    btns.forEach(b=>{
      const isActive = b.dataset.tab === pendingTab;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(p=>p.classList.toggle('active', p.dataset.panel===pendingTab));
  }
})();

// ---------- Sidebar desktop (v1.1.109): tombol melayang ciut/perluas, pilihan disimpan ----------
(function(){
  const btn = document.getElementById('sidebarToggle');
  if(!btn) return;
  const root = document.documentElement;
  function sync(){
    const c = root.classList.contains('sb-collapsed');
    const txt = c ? 'Perluas sidebar' : 'Ciutkan sidebar';
    btn.setAttribute('aria-expanded', c ? 'false' : 'true');
    btn.setAttribute('aria-label', txt);
    btn.title = txt;
  }
  btn.addEventListener('click', ()=>{
    const c = root.classList.toggle('sb-collapsed');
    try{ localStorage.setItem('jurnalSidebar', c ? 'collapsed' : 'expanded'); }catch(e){}
    sync();
    // Grafik yang memakai ResizeObserver menggambar ulang sendiri; sinyal ini untuk yang lain.
    setTimeout(()=>window.dispatchEvent(new Event('resize')), 260);
  });
  sync();
})();

// ---------- Modal konfirmasi & notifikasi ----------
const NOTIFY_SESSION_KEY = 'jurnalNotifyPending';

// Modal konfirmasi: menggantikan confirm() bawaan browser dengan dialog bergaya sama
// seperti tampilan dashboard. Async — dipakai dengan await.
function showConfirmModal(message){
  return new Promise(resolve=>{
    const overlay = document.getElementById('confirmModalOverlay');
    document.getElementById('confirmModalMessage').textContent = message;
    const btnYes = document.getElementById('confirmModalYes');
    const btnNo = document.getElementById('confirmModalNo');
    overlay.classList.add('show');
    function cleanup(result){
      overlay.classList.remove('show');
      btnYes.removeEventListener('click', onYes);
      btnNo.removeEventListener('click', onNo);
      overlay.removeEventListener('click', onOverlay);
      resolve(result);
    }
    function onYes(){ cleanup(true); }
    function onNo(){ cleanup(false); }
    function onOverlay(e){ if(e.target === overlay) cleanup(false); }
    btnYes.addEventListener('click', onYes);
    btnNo.addEventListener('click', onNo);
    overlay.addEventListener('click', onOverlay);
  });
}

// Modal notifikasi: kartu di tengah layar (bukan toast), auto-tertutup setelah beberapa
// detik atau bisa ditutup manual. type: 'success' | 'error' (opsional).
function showNotifyModal(message, type){
  const overlay = document.getElementById('notifyModalOverlay');
  const box = document.getElementById('notifyModalBox');
  const closeBtn = document.getElementById('notifyModalClose');
  box.classList.remove('success','error');
  if(type) box.classList.add(type);
  document.getElementById('notifyModalMessage').textContent = message;
  overlay.classList.add('show');
  clearTimeout(showNotifyModal._timer);
  function close(){ overlay.classList.remove('show'); }
  showNotifyModal._timer = setTimeout(close, 4000);
  closeBtn.onclick = close;
}

// Untuk aksi yang diikuti reload halaman (impor, reset ke bawaan): simpan pesan notifikasi
// di sessionStorage supaya tetap muncul setelah halaman dimuat ulang.
function queueNotifyAfterReload(message, type){
  try{ sessionStorage.setItem(NOTIFY_SESSION_KEY, JSON.stringify({message, type})); }catch(e){}
}
(function(){
  try{
    const pending = sessionStorage.getItem(NOTIFY_SESSION_KEY);
    if(pending){
      sessionStorage.removeItem(NOTIFY_SESSION_KEY);
      const {message, type} = JSON.parse(pending);
      setTimeout(()=> showNotifyModal(message, type), 300);
    }
  }catch(e){}
})();

// ---------- Ekspor & impor data ----------
function dateStampNow(){
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  return now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes());
}
function downloadTextFile(filename, content, mime){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function buildFullHtmlString(){
  // Sinkronkan tag data bawaan dengan data AKTIF (localStorage jika ada) supaya
  // file .html hasil download selalu membawa data terkini, bukan data lama.
  document.getElementById('journal-data').textContent = JSON.stringify(DATA);
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
}
document.getElementById('exportHtmlBtn').addEventListener('click', ()=>{
  downloadTextFile(`jurnal-xauusd-${dateStampNow()}.html`, buildFullHtmlString(), 'text/html;charset=utf-8;');
  showNotifyModal('Backup HTML berhasil didownload.', 'success');
});
document.getElementById('exportJsonBtn').addEventListener('click', ()=>{
  downloadTextFile(`jurnal-xauusd-data-${dateStampNow()}.json`, JSON.stringify(DATA, null, 2), 'application/json;charset=utf-8;');
  showNotifyModal('Backup JSON berhasil didownload.', 'success');
});

const IMPORT_REQUIRED_KEYS = ['summary','periods','equity','months','weeks','trades','deposit','period_ranges'];
document.getElementById('importJsonInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  const noteEl = document.getElementById('importNote');
  if(!file) return;
  noteEl.textContent = 'Membaca file…';
  noteEl.style.color = '';
  const reader = new FileReader();
  reader.onload = async () => {
    let parsed;
    try{
      parsed = JSON.parse(reader.result);
    }catch(err){
      noteEl.textContent = 'File bukan JSON yang valid.';
      noteEl.style.color = 'var(--loss)';
      showNotifyModal('Impor gagal: file bukan JSON yang valid.', 'error');
      e.target.value = '';
      return;
    }
    const missing = IMPORT_REQUIRED_KEYS.filter(k => !(k in parsed));
    if(missing.length){
      noteEl.textContent = `Struktur data tidak sesuai (bagian hilang: ${missing.join(', ')}).`;
      noteEl.style.color = 'var(--loss)';
      showNotifyModal('Impor gagal: struktur data tidak sesuai.', 'error');
      e.target.value = '';
      return;
    }
    const trCount = Array.isArray(parsed.trades) ? parsed.trades.length : 0;
    const confirmed = await showConfirmModal(`Timpa data yang sedang aktif di dashboard ini dengan data dari file (${trCount} transaksi)? Tindakan ini tidak bisa dibatalkan — pastikan sudah download cadangan (backup) data saat ini jika masih diperlukan.`);
    if(!confirmed){
      e.target.value = '';
      noteEl.textContent = '';
      return;
    }
    if(!saveActiveData(parsed)){
      noteEl.textContent = 'Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir). Coba mode browser non-privat, atau bersihkan data situs lain.';
      noteEl.style.color = 'var(--loss)';
      showNotifyModal('Impor gagal: tidak bisa menyimpan ke penyimpanan lokal browser.', 'error');
      e.target.value = '';
      return;
    }
    noteEl.textContent = 'Data valid & tersimpan di penyimpanan lokal browser — memuat ulang dashboard...';
    noteEl.style.color = 'var(--gain)';
    queueNotifyAfterReload('Data berhasil dipulihkan (restore) dari file cadangan.', 'success');
    try{ sessionStorage.setItem('jurnalPendingTab', 'setelan'); }catch(err){}
    setTimeout(()=>{ location.reload(); }, 500);
  };
  reader.onerror = () => {
    noteEl.textContent = 'Gagal membaca file.';
    noteEl.style.color = 'var(--loss)';
    showNotifyModal('Impor gagal: file tidak bisa dibaca.', 'error');
  };
  reader.readAsText(file);
});

document.getElementById('clearLocalDataBtn').addEventListener('click', async ()=>{
  const hasData = Array.isArray(DATA.trades) && DATA.trades.length > 0;
  const confirmMsg = hasData
    ? 'Hapus data tersimpan di browser ini dan kembali ke data bawaan file HTML? Cadangan (backup) JSON dari data saat ini akan otomatis didownload lebih dulu sebelum dihapus.'
    : 'Hapus data tersimpan di browser ini dan kembali ke data bawaan file HTML? Tindakan ini tidak bisa dibatalkan.';
  const confirmed = await showConfirmModal(confirmMsg);
  if(!confirmed) return;
  if(hasData){
    downloadTextFile(`jurnal-xauusd-data-${dateStampNow()}-sebelum-reset.json`, JSON.stringify(DATA, null, 2), 'application/json;charset=utf-8;');
  }
  try{ localStorage.removeItem(JOURNAL_LS_KEY); }catch(e){}
  queueNotifyAfterReload(hasData ? 'Cadangan otomatis didownload & data direset ke bawaan file.' : 'Data direset ke bawaan file.', 'success');
  try{ sessionStorage.setItem('jurnalPendingTab', 'setelan'); }catch(err){}
  // Jeda sebentar supaya proses download cadangan sempat dimulai browser sebelum halaman reload.
  setTimeout(()=>{ location.reload(); }, hasData ? 600 : 300);
});

// ---------- Tambah/edit/hapus data manual: hitung ulang seluruh agregat setelah data berubah ----------
function round2(n){ return Math.round((n+Number.EPSILON)*100)/100; }

// Waktu server (GMT+3, naive) -> label tampilan GMT+8 (naive), selisih tetap +5 jam.
function serverToGmt8Iso(iso){
  const ms = new Date(iso+'Z').getTime() + 5*3600*1000;
  const d = new Date(ms);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// Bangun ulang kurva ekuitas & modal kumulatif dari nol dengan menggabungkan DATA.trades +
// DATA.deposit.log terurut kronologis (berbasis label GMT+8). Dipakai setiap kali data berubah
// (tambah/edit/hapus manual) supaya kurva & agregat tetap akurat walau entri disisipkan di tengah.
function rebuildEquitySeries(){
  const events = [];
  DATA.trades.forEach(t=>{
    events.push({ ts: parseGmt8(t.tanggal_gmt8), gmt8: t.tanggal_gmt8, val: t.laba, modalDelta: 0 });
  });
  DATA.deposit.log.forEach(l=>{
    const gmt8 = serverToGmt8Iso(l.tanggal);
    const modalDelta = (l.tipe==='Deposit' || l.tipe==='Penarikan') ? l.cent : 0;
    events.push({ ts: parseGmt8(gmt8), gmt8, val: l.cent, modalDelta });
  });
  events.sort((a,b)=> a.ts-b.ts);
  let bal = 0, modal = 0;
  const eq = [], mk = [];
  events.forEach(e=>{
    bal = round2(bal + e.val);
    modal = round2(modal + e.modalDelta);
    eq.push([e.gmt8, bal]);
    mk.push(modal);
  });
  DATA.equity = eq;
  DATA.modal_kumulatif = mk;
}

function recomputeAll(){
  const trades = DATA.trades;
  const total = trades.length;
  const win = trades.filter(t=>t.laba>0).length;
  const loss = trades.filter(t=>t.laba<0).length;
  const winrate = total ? win/total : 0;
  const pl_cent = round2(trades.reduce((s,t)=>s+t.laba,0));
  const kurs = DATA.kurs || 0;
  const pl_rp = Math.round(pl_cent*kurs/100*10000)/10000;

  const log = DATA.deposit.log;
  const total_deposit = round2(log.filter(l=>l.tipe==='Deposit').reduce((s,l)=>s+l.cent,0));
  const total_penarikan = round2(Math.abs(log.filter(l=>l.tipe==='Penarikan').reduce((s,l)=>s+l.cent,0)));
  const total_mc = round2(log.filter(l=>l.tipe==='Kompensasi MC').reduce((s,l)=>s+l.cent,0));
  const modal_bersih = round2(total_deposit - total_penarikan);
  DATA.deposit.total_deposit = total_deposit;
  DATA.deposit.total_penarikan = total_penarikan;
  DATA.deposit.total_mc = total_mc;
  DATA.deposit.modal_bersih = modal_bersih;

  const saldo_akhir = DATA.equity.length ? DATA.equity[DATA.equity.length-1][1] : 0;
  const pct_pl = modal_bersih ? pl_cent/modal_bersih : 0;

  Object.assign(DATA.summary, { total, win, loss, winrate, pl_cent, pl_rp, saldo_akhir, pct_pl });
  DATA.dashboard.saldo = saldo_akhir;
  // Saldo di modal Kalkulator ikut dibaca dari sini (mm.equity) — dulu cuma snapshot statis dari
  // data ekspor/impor terakhir, tidak pernah disentuh recomputeAll(), jadi tetap menunjukkan
  // saldo lama walau sudah ada transaksi/deposit/penarikan manual baru lewat FAB.
  DATA.dashboard.mm.equity = saldo_akhir;

  const sumWin = trades.filter(t=>t.laba>0).reduce((s,t)=>s+t.laba,0);
  const sumLoss = trades.filter(t=>t.laba<0).reduce((s,t)=>s+t.laba,0);
  const pf = sumLoss !== 0 ? sumWin/Math.abs(sumLoss) : DATA.dashboard.stats.pf;
  const expectancy = total ? pl_cent/total : 0;

  // Max drawdown trading-only (ekuitas dikurangi modal kumulatif), metode sama seperti kurva ekuitas.
  const eq = DATA.equity.map(e=>e[1]);
  const mk = DATA.modal_kumulatif;
  const dd = eq.map((v,i)=> v-(mk[i]!==undefined?mk[i]:0));
  let runPeak=0, maxdd=0, maxddPeakIdx=0, maxddTroughIdx=0;
  for(let i=1;i<dd.length;i++){
    if(dd[i]>dd[runPeak]) runPeak=i;
    const cur = dd[runPeak]-dd[i];
    if(cur>maxdd){ maxdd=cur; maxddPeakIdx=runPeak; maxddTroughIdx=i; }
  }
  Object.assign(DATA.dashboard.stats, { total, winrate, pf, maxdd: -round2(maxdd), expectancy });

  // Catatan max drawdown di kartu "Rekor transaksi" — sama seperti mm.equity di atas, dulu
  // snapshot statis (DATA.maxdd_note) yang tidak pernah ikut recompute; sekarang dibangun ulang
  // dari titik puncak/lembah drawdown yang baru saja dihitung persis di atas.
  DATA.maxdd_note = (maxdd > 0)
    ? (maxddPeakIdx===maxddTroughIdx
        ? `Turun ${fmtCent(maxdd)}¢ pada ${fmtDateGmt8(DATA.equity[maxddTroughIdx][0])}.`
        : `Turun ${fmtCent(maxdd)}¢ dari puncak ${fmtDateGmt8(DATA.equity[maxddPeakIdx][0])} ke titik terendah ${fmtDateGmt8(DATA.equity[maxddTroughIdx][0])}.`)
    : '';

  // Rekor transaksi (kemenangan/kerugian terbesar) — sama seperti mm.equity & maxdd_note di atas,
  // dulu snapshot statis (DATA.dashboard.top_win/top_loss) yang tidak ikut recompute sehingga
  // tidak ikut transaksi manual baru. Dihitung ulang di sini dari DATA.trades, terurut laba.
  const TOP_REKOR_N = 5;
  DATA.dashboard.top_win = trades.filter(t=>t.laba>0).sort((a,b)=>b.laba-a.laba).slice(0,TOP_REKOR_N)
    .map(t=>`${fmtDate(t.tanggal)} • +${fmtCent(t.laba)}¢`);
  DATA.dashboard.top_loss = trades.filter(t=>t.laba<0).sort((a,b)=>a.laba-b.laba).slice(0,TOP_REKOR_N)
    .map(t=>`${fmtDate(t.tanggal)} • ${fmtCent(t.laba)}¢`);

  const now = new Date();
  const bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  DATA.dashboard.update = `Update terakhir: ${now.getDate()} ${bln[now.getMonth()]} ${now.getFullYear()}  •  Akun Cent (1 USD = 100¢)`;
}

// ---------- Dropdown kustom generik (bukan <select> bawaan browser) ----------
// Dipakai untuk Arah, Trigger Entry, Trigger Exit, Kondisi Emosi, Jenis Entry di form Tambah/Edit Transaksi.
const CS = (function(){
  const instances = {};
  function closeAllExcept(exceptEl){
    document.querySelectorAll('.custom-select.open, .dt-picker.open').forEach(el=>{
      if(el!==exceptEl && !el.contains(exceptEl)) el.classList.remove('open');
    });
  }
  function build(id, options, placeholder, onChange){
    const wrap = document.getElementById(id);
    if(!wrap) return;
    const btn = wrap.querySelector('.custom-select-btn');
    const label = wrap.querySelector('.cs-label');
    const list = wrap.querySelector('.custom-select-list');
    let value = '';
    // Opsi bisa berupa string biasa (value===label, gaya lama) atau {value,label}
    // (dipakai filter yang butuh opsi "semua" dengan value kosong tapi label bukan placeholder).
    const norm = options.map(o => (o && typeof o === 'object') ? o : {value:o, label:o});
    list.innerHTML = norm.map(o=>`<li role="option" tabindex="-1" data-value="${o.value}">${o.label}</li>`).join('');
    const items = () => [...list.querySelectorAll('li')];
    function labelFor(v){
      const found = norm.find(o=>o.value===v);
      return found ? found.label : (v || placeholder || '- Pilih -');
    }
    function select(v, silent){
      value = v;
      label.textContent = labelFor(v);
      items().forEach(li=>{
        const isActive = li.dataset.value===v;
        li.classList.toggle('active', isActive);
        li.setAttribute('aria-selected', String(isActive));
      });
      if(!silent && onChange) onChange(v);
    }
    // Navigasi keyboard (Panah atas/bawah, Home/End, Enter/Escape) — supaya setara
    // dengan <select> bawaan browser yang digantikan widget ini, bukan cuma bisa diklik/disentuh.
    function openList(focusIdx){
      closeAllExcept(wrap);
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      const li = items();
      if(li.length){
        const idx = focusIdx==null ? Math.max(0, li.findIndex(x=>x.dataset.value===value)) : focusIdx;
        (li[idx]||li[0]).focus();
      }
    }
    function closeList(returnFocus){
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      if(returnFocus) btn.focus();
    }
    items().forEach(li=>{
      li.addEventListener('click', (e)=>{
        e.stopPropagation();
        select(li.dataset.value);
        closeList(false);
      });
    });
    list.addEventListener('keydown', (e)=>{
      const li = items();
      const cur = li.indexOf(document.activeElement);
      if(e.key==='ArrowDown'){ e.preventDefault(); (li[Math.min(cur+1, li.length-1)]||li[0]).focus(); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); (li[Math.max(cur-1, 0)]||li[0]).focus(); }
      else if(e.key==='Home'){ e.preventDefault(); li[0] && li[0].focus(); }
      else if(e.key==='End'){ e.preventDefault(); li[li.length-1] && li[li.length-1].focus(); }
      else if(e.key==='Enter' || e.key===' '){ e.preventDefault(); if(li[cur]){ select(li[cur].dataset.value); closeList(true); } }
      else if(e.key==='Escape'){ e.preventDefault(); closeList(true); }
      else if(e.key==='Tab'){ closeList(false); }
    });
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(wrap.classList.contains('open')) closeList(false); else openList();
    });
    btn.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowDown' || e.key==='ArrowUp'){
        if(!wrap.classList.contains('open')){ e.preventDefault(); openList(e.key==='ArrowDown' ? 0 : items().length-1); }
      }else if(e.key==='Escape' && wrap.classList.contains('open')){
        closeList(false);
      }
    });
    document.addEventListener('click', (e)=>{ if(!wrap.contains(e.target)) closeList(false); });
    select('', true);
    instances[id] = { get:()=>value, set:(v)=>select(v||'', true) };
  }
  return {
    build,
    get(id){ return instances[id] ? instances[id].get() : ''; },
    set(id, v){ if(instances[id]) instances[id].set(v); }
  };
})();

const ARAH_OPTIONS = ['Beli','Jual'];
const TRIGGER_OPTIONS = ['Breakout','Retest/Pullback','Support/Resistance','Trend Following','Reversal/Pembalikan','Order Block','Fibonacci Retracement','Moving Average Cross','News/Fundamental','Lainnya'];
const EXIT_TRIGGER_OPTIONS = ['TP','SL','Cut Loss','ABC (Asal Biru Close)','Lainnya'];
const EMOSI_OPTIONS = ['Tenang','Percaya diri','Ragu-ragu','Cemas','FOMO','Serakah','Marah','Balas dendam','Bosan','Lelah/ngantuk'];
const JENIS_ENTRY_OPTIONS = ['Konservatif','Agresif'];

['entryArah','editArah'].forEach(id=> CS.build('csw_'+id, ARAH_OPTIONS, 'Beli'));
['entryTrigger','editTrigger'].forEach(id=> CS.build('csw_'+id, TRIGGER_OPTIONS, '- Pilih -'));
['entryTriggerExit','editTriggerExit'].forEach(id=> CS.build('csw_'+id, EXIT_TRIGGER_OPTIONS, '- Pilih -'));
['entryEmosi','editEmosi'].forEach(id=> CS.build('csw_'+id, EMOSI_OPTIONS, '- Pilih -'));
['entryJenisEntry','editJenisEntry'].forEach(id=> CS.build('csw_'+id, JENIS_ENTRY_OPTIONS, '- Pilih -'));
CS.set('csw_entryArah', 'Beli');
CS.set('csw_editArah', 'Beli');

// ---------- Date-time picker kustom (bukan <input type="datetime-local"> bawaan browser) ----------
// Kalender bulan + dropdown jam/menit (memakai list yang sama gayanya dengan .custom-select).
const DTP = (function(){
  const instances = {};
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const HARI = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const pad = n => String(n).padStart(2,'0');

  function closeAllExcept(exceptEl){
    document.querySelectorAll('.custom-select.open, .dt-picker.open').forEach(el=>{
      if(el!==exceptEl && !el.contains(exceptEl)) el.classList.remove('open');
    });
  }
  function build(name, placeholder, opts){
    opts = opts || {};
    const dateOnly = !!opts.dateOnly;
    const onChange = opts.onChange;
    const root = document.getElementById('dtp_'+name);
    if(!root) return;
    root.innerHTML = `
      <button type="button" class="dt-picker-btn"><span class="dt-picker-label">${placeholder}</span><span class="custom-select-arrow"></span></button>
      <div class="dt-picker-panel">
        <div class="dt-cal-head">
          <button type="button" class="dt-nav" data-dir="-1" aria-label="Bulan sebelumnya">‹</button>
          <span class="dt-cal-title"></span>
          <button type="button" class="dt-nav" data-dir="1" aria-label="Bulan berikutnya">›</button>
        </div>
        <div class="dt-cal-dow">${HARI.map(h=>`<span>${h}</span>`).join('')}</div>
        <div class="dt-cal-grid"></div>
        ${dateOnly ? '' : `<div class="dt-time-row">
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" class="dt-hour-input" placeholder="00" aria-label="Jam">
          <span class="dt-time-colon">:</span>
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" class="dt-min-input" placeholder="00" aria-label="Menit">
        </div>`}
        <div class="dt-actions">
          <button type="button" class="ledger-reset-btn dt-today-btn">Hari ini</button>
          <button type="button" class="ledger-reset-btn modal-btn-primary dt-ok-btn">OK</button>
        </div>
      </div>`;
    const btn = root.querySelector('.dt-picker-btn');
    const label = root.querySelector('.dt-picker-label');
    const calTitle = root.querySelector('.dt-cal-title');
    const calGrid = root.querySelector('.dt-cal-grid');
    const hourInput = root.querySelector('.dt-hour-input');
    const minInput = root.querySelector('.dt-min-input');

    let sel = null;
    let viewY, viewMo;

    function fmtLabel(){
      if(!sel) return placeholder;
      return dateOnly ? `${pad(sel.d)} ${BULAN[sel.mo].slice(0,3)} ${sel.y}`
        : `${pad(sel.d)} ${BULAN[sel.mo].slice(0,3)} ${sel.y}, ${pad(sel.h)}:${pad(sel.mi)}`;
    }
    function syncLabel(){ label.textContent = fmtLabel(); }
    function getValue(){
      if(!sel) return '';
      return dateOnly ? `${sel.y}-${pad(sel.mo+1)}-${pad(sel.d)}`
        : `${sel.y}-${pad(sel.mo+1)}-${pad(sel.d)}T${pad(sel.h)}:${pad(sel.mi)}`;
    }

    function renderCalendar(){
      calTitle.textContent = `${BULAN[viewMo]} ${viewY}`;
      const firstDow = new Date(Date.UTC(viewY,viewMo,1)).getUTCDay();
      const daysInMonth = new Date(Date.UTC(viewY,viewMo+1,0)).getUTCDate();
      const daysInPrevMonth = new Date(Date.UTC(viewY,viewMo,0)).getUTCDate();
      let cells = '';
      for(let i=0;i<firstDow;i++){
        cells += `<button type="button" class="dt-cal-cell muted" disabled>${daysInPrevMonth-firstDow+1+i}</button>`;
      }
      for(let d=1; d<=daysInMonth; d++){
        const isSel = sel && sel.y===viewY && sel.mo===viewMo && sel.d===d;
        cells += `<button type="button" class="dt-cal-cell${isSel?' selected':''}" data-d="${d}">${d}</button>`;
      }
      const trailing = (7 - ((firstDow+daysInMonth) % 7)) % 7;
      for(let d=1; d<=trailing; d++){
        cells += `<button type="button" class="dt-cal-cell muted" disabled>${d}</button>`;
      }
      calGrid.innerHTML = cells;
      calGrid.querySelectorAll('.dt-cal-cell[data-d]').forEach(cell=>{
        cell.addEventListener('click', (e)=>{
          e.stopPropagation();
          const d = parseInt(cell.dataset.d,10);
          if(!sel) sel = { y:viewY, mo:viewMo, d, h:0, mi:0 };
          else { sel.y=viewY; sel.mo=viewMo; sel.d=d; }
          renderCalendar();
        });
      });
    }

    // Navigasi keyboard di grid kalender (Panah, Home/End, PageUp/PageDown) — sel & tombol
    // sudah <button> native (otomatis bisa di-Tab & Enter/Space), ini menambah cara pindah
    // antar tanggal tanpa Tab satu-satu, setara widget date picker pada umumnya.
    function focusDay(y, mo, d){
      // Pakai aritmetika Date supaya lompat/mundur lintas bulan (mis. 31 Jan + 1 hari) otomatis
      // ke tanggal yang benar, bukan cuma di-clamp di bulan yang sama.
      const dt = new Date(Date.UTC(y, mo, d));
      const ny = dt.getUTCFullYear(), nm = dt.getUTCMonth(), nd = dt.getUTCDate();
      if(ny!==viewY || nm!==viewMo){ viewY=ny; viewMo=nm; renderCalendar(); }
      const cell = calGrid.querySelector(`.dt-cal-cell[data-d="${nd}"]`);
      if(cell) cell.focus();
    }
    calGrid.addEventListener('keydown', (e)=>{
      const cur = e.target.closest('.dt-cal-cell[data-d]');
      if(!cur) return;
      const d = parseInt(cur.dataset.d,10);
      if(e.key==='ArrowRight'){ e.preventDefault(); focusDay(viewY,viewMo,d+1); }
      else if(e.key==='ArrowLeft'){ e.preventDefault(); focusDay(viewY,viewMo,d-1); }
      else if(e.key==='ArrowDown'){ e.preventDefault(); focusDay(viewY,viewMo,d+7); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); focusDay(viewY,viewMo,d-7); }
      else if(e.key==='Home'){ e.preventDefault(); focusDay(viewY,viewMo,1); }
      else if(e.key==='End'){ e.preventDefault(); focusDay(viewY,viewMo,new Date(Date.UTC(viewY,viewMo+1,0)).getUTCDate()); }
      else if(e.key==='PageUp'){ e.preventDefault(); let ny=viewY,nm=viewMo-1; if(nm<0){nm=11;ny--;} focusDay(ny,nm,d); }
      else if(e.key==='PageDown'){ e.preventDefault(); let ny=viewY,nm=viewMo+1; if(nm>11){nm=0;ny++;} focusDay(ny,nm,d); }
    });

    function refreshTimeLists(){
      if(dateOnly) return;
      hourInput.value = sel ? pad(sel.h) : '';
      minInput.value = sel ? pad(sel.mi) : '';
    }

    function commitHourInput(){
      const digits = hourInput.value.replace(/\D/g,'');
      if(digits===''){ hourInput.value = sel ? pad(sel.h) : '00'; return; }
      let h = Math.min(23, parseInt(digits,10));
      if(!sel){ sel = { y:viewY, mo:viewMo, d:(new Date()).getDate(), h:0, mi:0 }; }
      sel.h = h; hourInput.value = pad(h);
    }
    function commitMinInput(){
      const digits = minInput.value.replace(/\D/g,'');
      if(digits===''){ minInput.value = sel ? pad(sel.mi) : '00'; return; }
      let mi = Math.min(59, parseInt(digits,10));
      if(!sel){ sel = { y:viewY, mo:viewMo, d:(new Date()).getDate(), h:0, mi:0 }; }
      sel.mi = mi; minInput.value = pad(mi);
    }
    if(!dateOnly){
      hourInput.addEventListener('input', (e)=>{ e.target.value = e.target.value.replace(/\D/g,'').slice(0,2); });
      hourInput.addEventListener('focus', (e)=>{ closeAllExcept(root); e.target.select(); });
      hourInput.addEventListener('blur', commitHourInput);
      hourInput.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'){ e.preventDefault(); commitHourInput(); }
      });
      hourInput.addEventListener('click', (e)=> e.stopPropagation());
      minInput.addEventListener('input', (e)=>{ e.target.value = e.target.value.replace(/\D/g,'').slice(0,2); });
      minInput.addEventListener('focus', (e)=>{ closeAllExcept(root); e.target.select(); });
      minInput.addEventListener('blur', commitMinInput);
      minInput.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'){ e.preventDefault(); commitMinInput(); }
      });
      minInput.addEventListener('click', (e)=> e.stopPropagation());
    }

    root.querySelector('.dt-cal-head').addEventListener('click', (e)=>{
      const navBtn = e.target.closest('.dt-nav');
      if(!navBtn) return;
      const dir = parseInt(navBtn.dataset.dir,10);
      viewMo += dir;
      if(viewMo<0){ viewMo=11; viewY--; } else if(viewMo>11){ viewMo=0; viewY++; }
      renderCalendar();
    });

    root.querySelector('.dt-today-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      const now = new Date();
      sel = { y:now.getFullYear(), mo:now.getMonth(), d:now.getDate(), h:now.getHours(), mi:now.getMinutes() };
      viewY = sel.y; viewMo = sel.mo;
      renderCalendar(); refreshTimeLists();
    });

    root.querySelector('.dt-ok-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      if(!sel){ const now=new Date(); sel = { y:now.getFullYear(), mo:now.getMonth(), d:now.getDate(), h:now.getHours(), mi:now.getMinutes() }; }
      syncLabel();
      root.classList.remove('open');
      if(onChange) onChange(getValue());
    });

    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const wasOpen = root.classList.contains('open');
      closeAllExcept(root);
      root.classList.toggle('open', !wasOpen);
      if(!wasOpen){
        if(sel){ viewY=sel.y; viewMo=sel.mo; } else { const now=new Date(); viewY=now.getFullYear(); viewMo=now.getMonth(); }
        renderCalendar(); refreshTimeLists();
      }
    });
    document.addEventListener('click', (e)=>{
      if(!root.contains(e.target)){
        root.classList.remove('open');
      }
    });

    instances[name] = {
      get: getValue,
      set(iso){
        if(!iso){ sel=null; syncLabel(); return; }
        const [datePart, timePart] = iso.split('T');
        const [y,mo,d] = datePart.split('-').map(Number);
        const [h,mi] = (timePart||'00:00').split(':').map(Number);
        sel = { y, mo: mo-1, d, h, mi };
        viewY=y; viewMo=mo-1;
        syncLabel();
      }
    };
    syncLabel();
  }
  return {
    build,
    get(name){ return instances[name] ? instances[name].get() : ''; },
    set(name, iso){ if(instances[name]) instances[name].set(iso); }
  };
})();

DTP.build('entryWaktuBuka', 'Pilih waktu buka (opsional)');
DTP.build('entryWaktuTrade', 'Pilih waktu tutup');
DTP.build('entryWaktuDeposit', 'Pilih waktu');
DTP.build('editWaktuBuka', 'Pilih waktu buka (opsional)');
DTP.build('editWaktu', 'Pilih waktu tutup');

// ---------- Filter tab Transaksi (dropdown & tanggal kustom, bukan bawaan browser) ----------
// ---------- Pemilih mata uang kartu hero (USD / USC / Rp) ----------
CS.build('csw_heroCurrency', HERO_CURRENCIES, 'USD', v=>{
  HERO_CURRENCY = v || 'USD';
  try{ localStorage.setItem('jurnalHeroCurrency', HERO_CURRENCY); }catch(e){}
  // Semua tab (kartu, tabel, kurva, laporan) dibangun dari data saat halaman dibuka, jadi cara
  // paling aman supaya SEMUANYA ikut ganti mata uang: reload, lalu kembali ke tab yang sama.
  try{
    const activeBtn = document.querySelector('.main-tab-btn.active');
    if(activeBtn) sessionStorage.setItem('jurnalPendingTab', activeBtn.dataset.tab);
  }catch(e){}
  location.reload();
});
CS.set('csw_heroCurrency', HERO_CURRENCY);
document.querySelectorAll('.cur-unit').forEach(el=>{ el.textContent = curUnitSymbol(); });
CS.build('csw_filterArah', [{value:'',label:'Semua arah'}, {value:'Beli',label:'Beli'}, {value:'Jual',label:'Jual'}], 'Semua arah', ()=>{ if(window.renderTrades) window.renderTrades(); });
CS.build('csw_filterHasil', [{value:'',label:'Semua hasil'}, {value:'win',label:'Menang'}, {value:'loss',label:'Kalah'}], 'Semua hasil', ()=>{ if(window.renderTrades) window.renderTrades(); });
[['csw_filterEmosi','Semua emosi',EMOSI_OPTIONS],['csw_filterTrigger','Semua trigger',TRIGGER_OPTIONS],['csw_filterJenis','Semua jenis entry',JENIS_ENTRY_OPTIONS]].forEach(([id,ph,o])=>CS.build(id, [{value:'',label:ph}, ...o.map(x=>({value:x,label:x}))], ph, ()=>{ if(window.renderTrades) window.renderTrades(); }));
CS.build('csw_filterSesi', [{value:'',label:'Semua sesi'}, ...LAP_SESSIONS.map((x,i)=>({value:String(i),label:x[0]}))], 'Semua sesi', ()=>{ if(window.renderTrades) window.renderTrades(); });
CS.build('csw_filterCatatan', [{value:'',label:'Semua catatan'}, {value:'belum',label:'Belum ada catatan psikologi'}, {value:'sudah',label:'Sudah ada catatan'}], 'Semua catatan', ()=>{ if(window.renderTrades) window.renderTrades(); });
[['csw_lapEmosi','Semua emosi',EMOSI_OPTIONS,v=>{lap2Emosi=v;}],['csw_lapTrigger','Semua trigger',TRIGGER_OPTIONS,v=>{lap2Trigger=v;}],['csw_lapJenis','Semua jenis',JENIS_ENTRY_OPTIONS,v=>{lap2Jenis=v;}]].forEach(([id,ph,opts,set])=>{
  CS.build(id, [{value:'semua',label:ph},...opts.map(o=>({value:o,label:o})),{value:'-',label:'Belum dicatat'}], ph, ()=>{ set(CS.get(id)); renderLap2(); });
});
['A','B'].forEach(sd=>{
  const id = 'csw_cmp' + sd;
  CS.build(id, CMP_PRESETS, cmpSel[sd]==='bulan-ini' ? 'Bulan ini' : 'Bulan lalu', ()=>{ cmpSel[sd] = CS.get(id); renderLapCmp(); });
  CS.set(id, cmpSel[sd]);
  ['From','To'].forEach(x=>{ const inp = document.getElementById('cmp'+sd+x); if(inp) inp.addEventListener('change', renderLapCmp); });
});
CS.build('csw_depositFilterTipe', [{value:'',label:'Semua tipe'}, {value:'Deposit',label:'Deposit'}, {value:'Penarikan',label:'Penarikan'}, {value:'Kompensasi MC',label:'Kompensasi MC'}], 'Semua tipe', renderDepositLog);
renderDepositLog();
function onLedgerDateChange(){
  document.querySelectorAll('.ledger-quick-range .quick-chip').forEach(b=>b.classList.remove('active'));
  syncLedgerAllChip();
  if(window.renderTrades) window.renderTrades();
}
DTP.build('ledgerFrom', 'Dari tanggal', { dateOnly:true, onChange:onLedgerDateChange });
DTP.build('ledgerTo', 'Sampai tanggal', { dateOnly:true, onChange:onLedgerDateChange });
syncLedgerAllChip(); // default: chip All aktif (tanpa batas tanggal); dipanggil setelah DTP siap

// ---------- Analisis PNL: rentang "Sesuaikan" (dt-picker kustom, bukan <input type="date"> bawaan browser) ----------
(function(){
  function onAnalisisDateChange(){ if(window.renderAnalisisRange) window.renderAnalisisRange(); }
  DTP.build('anCustomFrom', 'Dari tanggal', { dateOnly:true, onChange:onAnalisisDateChange });
  DTP.build('anCustomTo', 'Sampai tanggal', { dateOnly:true, onChange:onAnalisisDateChange });
  // Seed default rentang kustom dari rentang data aktual, pola sama seperti period picker tab Ringkasan.
  const allDates = DATA.trades.map(t=>t.tanggal_gmt8).filter(Boolean).sort();
  if(allDates.length){
    DTP.set('anCustomFrom', allDates[0].slice(0,10));
    DTP.set('anCustomTo', allDates[allDates.length-1].slice(0,10));
  }
})();

// ---------- Kurva ekuitas (Ringkasan): periode "Kustom…" (dt-picker kustom, bukan <input type="date"> bawaan browser) ----------
(function(){
  DTP.build('customFrom', 'Dari tanggal', { dateOnly:true, onChange:applyCustomRange });
  DTP.build('customTo', 'Sampai tanggal', { dateOnly:true, onChange:applyCustomRange });
  // Seed default sama seperti versi lama: tanggal transaksi terakhir untuk dari & sampai.
  const allDatesRingkasan = DATA.trades.map(t=>t.tanggal_gmt8).filter(Boolean).sort();
  if(allDatesRingkasan.length){
    DTP.set('customTo', allDatesRingkasan[allDatesRingkasan.length-1].slice(0,10));
    DTP.set('customFrom', allDatesRingkasan[allDatesRingkasan.length-1].slice(0,10));
  }
})();

(function(){
  const fabWrap = document.getElementById('fabWrap');
  const fabMain = document.getElementById('fabMainBtn');
  const fabMenu = document.getElementById('fabMenu');
  const overlay = document.getElementById('entryModalOverlay');
  const titleEl = document.getElementById('entryModalTitle');
  const formTrade = document.getElementById('entryFormTrade');
  const formDeposit = document.getElementById('entryFormDeposit');
  const errEl = document.getElementById('entryModalError');
  const jumlahLabel = document.getElementById('entryJumlahLabel');
  let mode = 'trade';

  function toggleFab(open){
    const willOpen = open !== undefined ? open : !fabMenu.classList.contains('show');
    fabMenu.classList.toggle('show', willOpen);
    fabMain.classList.toggle('open', willOpen);
    fabMain.setAttribute('aria-expanded', String(willOpen));
  }
  fabMain.addEventListener('click', ()=> toggleFab());
  document.addEventListener('click', (e)=>{
    if(!fabWrap.contains(e.target)) toggleFab(false);
  });

  function nowLocalInputValue(){
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEntryModal(m){
    mode = m;
    errEl.style.display = 'none'; errEl.textContent = '';
    formTrade.style.display = (m==='trade') ? 'flex' : 'none';
    formDeposit.style.display = (m==='trade') ? 'none' : 'flex';
    titleEl.textContent = m==='trade' ? 'Tambah Transaksi' : (m==='deposit' ? 'Tambah Deposit' : 'Tambah Penarikan');
    jumlahLabel.textContent = m==='penarikan' ? 'Jumlah Penarikan (USD)' : 'Jumlah Deposit (USD)';
    if(m==='trade'){
      document.getElementById('entryIdPosisi').value = '';
      CS.set('csw_entryArah', 'Beli');
      document.getElementById('entryLot').value = '';
      DTP.set('entryWaktuBuka', '');
      document.getElementById('entryBuka').value = '';
      document.getElementById('entryTutup').value = '';
      document.getElementById('entryLaba').value = '';
      DTP.set('entryWaktuTrade', nowLocalInputValue());
      CS.set('csw_entryTrigger', '');
      CS.set('csw_entryTriggerExit', '');
      CS.set('csw_entryEmosi', '');
      CS.set('csw_entryJenisEntry', '');
      document.getElementById('entryCatatan').value = '';
    } else {
      document.getElementById('entryUsd').value = '';
      document.getElementById('entryJenis').value = m==='deposit' ? 'Deposit Bank Transfer' : 'Internal Transfer (Remove Funds)';
      DTP.set('entryWaktuDeposit', nowLocalInputValue());
    }
    overlay.classList.add('show');
    toggleFab(false);
  }
  function closeEntryModal(){ overlay.classList.remove('show'); }

  document.querySelectorAll('.fab-mini').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(b.dataset.mode==='kalkulator'){
        const fm = document.getElementById('fabMainBtn'); document.getElementById('fabMenu').classList.remove('show'); fm.classList.remove('open'); fm.setAttribute('aria-expanded','false');
        document.getElementById('openCalcBtn').click();
      } else openEntryModal(b.dataset.mode);
    });
  });
  document.getElementById('entryModalCancel').addEventListener('click', closeEntryModal);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeEntryModal(); });

  document.getElementById('entryModalSave').addEventListener('click', ()=>{
    errEl.style.display = 'none';
    if(mode==='trade'){
      const idPosisiRaw = document.getElementById('entryIdPosisi').value.trim();
      const arah = CS.get('csw_entryArah') || 'Beli';
      const lot = parseFloat(document.getElementById('entryLot').value);
      const buka = parseFloat(document.getElementById('entryBuka').value);
      const tutup = parseFloat(document.getElementById('entryTutup').value);
      const waktu = DTP.get('entryWaktuTrade');
      if(!(lot>0) || !(buka>0) || !(tutup>0) || !waktu){
        errEl.textContent = 'Lengkapi lot, harga buka, harga tutup, dan waktu dengan benar.';
        errEl.style.display = 'block'; return;
      }
      if(idPosisiRaw && DATA.trades.some(t=>t.id===idPosisiRaw)){
        errEl.textContent = `ID Posisi "${idPosisiRaw}" sudah dipakai transaksi lain. Pakai ID lain atau kosongkan untuk ID otomatis.`;
        errEl.style.display = 'block'; return;
      }
      const pips = round2((arah==='Beli' ? (tutup-buka) : (buka-tutup)) * 10);
      let laba = round2(pips * lot * 10);
      const labaRaw = document.getElementById('entryLaba').value.trim();
      if(labaRaw !== ''){
        const lv = parseFloat(labaRaw);
        if(!isFinite(lv)){ errEl.textContent = 'Laba aktual harus berupa angka (dalam ¢) atau dikosongkan.'; errEl.style.display = 'block'; return; }
        laba = round2(lv);
      }
      const tanggal_gmt8 = waktu + ':00';
      const tanggal = gmt8ToServerIso(waktu);
      const waktuBukaVal = DTP.get('entryWaktuBuka');
      const waktu_buka_gmt8 = waktuBukaVal ? waktuBukaVal + ':00' : '';
      const trigger = CS.get('csw_entryTrigger');
      const trigger_exit = CS.get('csw_entryTriggerExit');
      const emosi = CS.get('csw_entryEmosi');
      const jenis_entry = CS.get('csw_entryJenisEntry');
      const idPosisi = idPosisiRaw || ('manual-'+Date.now());
      const catatanBaru = document.getElementById('entryCatatan').value.trim().slice(0,1000);
      DATA.trades.push({ id: idPosisi, arah, lot, buka, tutup, pips, laba, tanggal, tanggal_gmt8, waktu_buka: waktu_buka_gmt8, trigger, trigger_exit, emosi, jenis_entry, ...(catatanBaru ? { catatan: catatanBaru } : {}) });
    } else {
      const usdRaw = parseFloat(document.getElementById('entryUsd').value);
      const jenis = document.getElementById('entryJenis').value.trim() || (mode==='deposit' ? 'Deposit Manual' : 'Penarikan Manual');
      const waktu = DTP.get('entryWaktuDeposit');
      if(!(usdRaw>0) || !waktu){
        errEl.textContent = 'Lengkapi jumlah dan waktu dengan benar.';
        errEl.style.display = 'block'; return;
      }
      const signedUsd = mode==='penarikan' ? -Math.abs(usdRaw) : Math.abs(usdRaw);
      const cent = round2(signedUsd*100);
      const tanggal = gmt8ToServerIso(waktu);
      DATA.deposit.log.push({ tanggal, jenis, tipe: mode==='deposit' ? 'Deposit' : 'Penarikan', usd: signedUsd, cent });
    }
    rebuildEquitySeries();
    recomputeAll();
    if(!saveActiveData(DATA)){
      errEl.textContent = 'Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir).';
      errEl.style.display = 'block'; return;
    }
    closeEntryModal();
    const msg = mode==='trade' ? 'Transaksi manual berhasil ditambahkan.' : (mode==='deposit' ? 'Deposit manual berhasil ditambahkan.' : 'Penarikan manual berhasil ditambahkan.');
    queueNotifyAfterReload(msg, 'success');
    setTimeout(()=>{ location.reload(); }, 300);
  });
})();

// ---------- Nilai datetime-local (GMT+8) <-> waktu server (GMT+3) ----------
function gmt8ToServerIso(val){
  const ms = new Date(val+':00Z').getTime() - 5*3600*1000;
  const d = new Date(ms);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// ---------- Detail transaksi: lihat / edit / hapus ----------
(function(){
  const overlay = document.getElementById('detailModalOverlay');
  const viewBox = document.getElementById('detailView');
  const editBox = document.getElementById('detailEdit');
  const viewActions = document.getElementById('detailViewActions');
  const editActions = document.getElementById('detailEditActions');
  const errEl = document.getElementById('detailModalError');
  let currentId = null;

  function findTrade(id){ return DATA.trades.find(t=>t.id===id); }

  function openDetail(id){
    const t = findTrade(id);
    if(!t) return;
    currentId = id;
    errEl.style.display='none'; errEl.textContent='';
    document.getElementById('dvId').textContent = t.id;
    document.getElementById('dvArah').textContent = t.arah;
    document.getElementById('dvLot').textContent = t.lot;
    document.getElementById('dvBuka').textContent = t.buka.toFixed(2);
    document.getElementById('dvTutup').textContent = t.tutup.toFixed(2);
    document.getElementById('dvPips').textContent = (t.pips>=0?'+':'')+t.pips.toFixed(1);
    document.getElementById('dvLaba').textContent = (t.laba>=0?'+':'')+fmtMoney(t.laba);
    document.getElementById('dvWaktu').textContent = fmtDateTime(t.tanggal);
    document.getElementById('dvWaktuBuka').textContent = t.waktu_buka ? fmtDateTimeGmt8(t.waktu_buka) : '-';
    document.getElementById('dvTrigger').textContent = t.trigger || '-';
    document.getElementById('dvTriggerExit').textContent = t.trigger_exit || '-';
    document.getElementById('dvEmosi').textContent = t.emosi || '-';
    document.getElementById('dvJenisEntry').textContent = t.jenis_entry || '-';
    document.getElementById('dvCatatan').textContent = t.catatan || '-';
    viewBox.style.display='block'; editBox.style.display='none';
    viewActions.style.display='flex'; editActions.style.display='none';
    const ids = lastFilteredTrades.map(x=>x.id), ix = ids.indexOf(id);
    document.getElementById('detailPrevBtn').disabled = ix <= 0;
    document.getElementById('detailNextBtn').disabled = ix < 0 || ix >= ids.length - 1;
    overlay.classList.add('show');
  }
  function stepDetail(dir){ const ids = lastFilteredTrades.map(x=>x.id), j = ids.indexOf(currentId) + dir; if(j>=0 && j<ids.length) openDetail(ids[j]); }
  const FILL_KEY = 'jurnalFillQueue', FILL_OPEN = 'jurnalFillOpen';
  function fillQueue(){ try{ const v = sessionStorage.getItem(FILL_KEY); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
  function clearFillQueue(){ try{ sessionStorage.removeItem(FILL_KEY); sessionStorage.removeItem(FILL_OPEN); }catch(e){} }
  function nextCandidates(){ const q = fillQueue(); return (q || lastFilteredTrades.filter(x=>x.id!==currentId && !hasNote(x)).map(x=>x.id)).filter(id=>id!==currentId); }
  function closeDetail(){ overlay.classList.remove('show'); currentId=null; clearFillQueue(); }

  tbody.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr[data-id]');
    if(tr && !tr.closest('table').classList.contains('selecting')) openDetail(tr.dataset.id);
  });
  document.getElementById('detailCloseBtn').addEventListener('click', closeDetail);
  document.getElementById('detailPrevBtn').addEventListener('click', ()=>stepDetail(-1));
  document.getElementById('detailNextBtn').addEventListener('click', ()=>stepDetail(1));
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeDetail(); });

  document.getElementById('detailEditBtn').addEventListener('click', ()=>{
    const t = findTrade(currentId);
    if(!t) return;
    CS.set('csw_editArah', t.arah);
    document.getElementById('editLot').value = t.lot;
    DTP.set('editWaktuBuka', t.waktu_buka ? t.waktu_buka.slice(0,16) : '');
    document.getElementById('editBuka').value = t.buka;
    document.getElementById('editTutup').value = t.tutup;
    document.getElementById('editLaba').value = t.laba;
    DTP.set('editWaktu', t.tanggal_gmt8.slice(0,16));
    CS.set('csw_editTrigger', t.trigger || '');
    CS.set('csw_editTriggerExit', t.trigger_exit || '');
    CS.set('csw_editEmosi', t.emosi || '');
    CS.set('csw_editJenisEntry', t.jenis_entry || '');
    document.getElementById('editCatatan').value = t.catatan || '';
    viewBox.style.display='none'; editBox.style.display='flex';
    viewActions.style.display='none'; editActions.style.display='flex';
    const nb = document.getElementById('detailSaveNextBtn'), cand = nextCandidates();
    nb.style.display = cand.length ? '' : 'none';
    nb.textContent = `Simpan & lanjut (${cand.length})`;
  });
  document.getElementById('detailCancelEditBtn').addEventListener('click', ()=>{
    viewBox.style.display='block'; editBox.style.display='none';
    viewActions.style.display='flex'; editActions.style.display='none';
  });

  function saveTrade(goNext){
    const t = findTrade(currentId);
    if(!t) return;
    errEl.style.display='none';
    const arah = CS.get('csw_editArah') || 'Beli';
    const lot = parseFloat(document.getElementById('editLot').value);
    const buka = parseFloat(document.getElementById('editBuka').value);
    const tutup = parseFloat(document.getElementById('editTutup').value);
    const waktu = DTP.get('editWaktu');
    if(!(lot>0) || !(buka>0) || !(tutup>0) || !waktu){
      errEl.textContent = 'Lengkapi lot, harga buka, harga tutup, dan waktu dengan benar.';
      errEl.style.display='block'; return;
    }
    // v1.1.104: pips & laba hanya dihitung ulang bila arah/lot/harga benar-benar diubah. Sebelumnya setiap
    // Simpan (termasuk sekadar mengisi catatan psikologi lewat "Simpan & lanjut") menimpa laba/pips asli
    // broker (yang sudah termasuk swap/komisi) dengan rumus lot × selisih harga.
    const prevLaba = t.laba, labaIn = document.getElementById('editLaba').value.trim(), labaNum = labaIn==='' ? null : parseFloat(labaIn);
    if(labaIn!=='' && !isFinite(labaNum)){ errEl.textContent = 'Laba aktual harus berupa angka (dalam ¢).'; errEl.style.display='block'; return; }
    const priceChanged = t.arah!==arah || t.lot!==lot || t.buka!==buka || t.tutup!==tutup;
    t.arah = arah; t.lot = lot; t.buka = buka; t.tutup = tutup;
    if(priceChanged){
      t.pips = round2((arah==='Beli' ? (tutup-buka) : (buka-tutup)) * 10);
      t.laba = round2(t.pips * lot * 10);
    }
    // v1.1.125: laba yang diisi/diubah manual di kolom "Laba aktual" menang atas hitungan rumus (mis. sudah termasuk swap/komisi).
    if(labaNum!==null && labaNum!==prevLaba) t.laba = round2(labaNum);
    // Waktu: jangan menimpa detik asli bila menit tidak diubah (input hanya sampai menit).
    if(waktu !== String(t.tanggal_gmt8||'').slice(0,16)){
      t.tanggal_gmt8 = waktu + ':00';
      t.tanggal = gmt8ToServerIso(waktu);
    }
    const editWaktuBukaVal = DTP.get('editWaktuBuka');
    if((editWaktuBukaVal||'') !== String(t.waktu_buka||'').slice(0,16)){
      t.waktu_buka = editWaktuBukaVal ? editWaktuBukaVal + ':00' : '';
    }
    t.trigger = CS.get('csw_editTrigger');
    t.trigger_exit = CS.get('csw_editTriggerExit');
    t.emosi = CS.get('csw_editEmosi');
    t.jenis_entry = CS.get('csw_editJenisEntry');
    { const cat = document.getElementById('editCatatan').value.trim().slice(0,1000); if(cat) t.catatan = cat; else delete t.catatan; }
    rebuildEquitySeries();
    recomputeAll();
    if(!saveActiveData(DATA)){
      errEl.textContent = 'Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir).';
      errEl.style.display='block'; return;
    }
    if(goNext){
      const q = nextCandidates().filter(id=>id!==t.id);
      if(q.length){
        try{ sessionStorage.setItem(FILL_KEY, JSON.stringify(q.slice(1))); sessionStorage.setItem(FILL_OPEN, q[0]); }catch(e){}
        overlay.classList.remove('show'); currentId = null;
        queueNotifyAfterReload(`Tersimpan. Lanjut ke transaksi berikutnya (${q.length} di antrean).`, 'success');
        setTimeout(()=>{ location.reload(); }, 300);
        return;
      }
    }
    closeDetail();
    queueNotifyAfterReload('Transaksi berhasil diperbarui.', 'success');
    setTimeout(()=>{ location.reload(); }, 300);
  }
  document.getElementById('detailSaveBtn').addEventListener('click', ()=>saveTrade(false));
  document.getElementById('detailSaveNextBtn').addEventListener('click', ()=>saveTrade(true));

  document.getElementById('detailDeleteBtn').addEventListener('click', async ()=>{
    const t = findTrade(currentId);
    if(!t) return;
    const confirmed = await showConfirmModal(`Hapus transaksi #${t.id} (${t.arah} ${t.lot} lot, laba ${t.laba>=0?'+':''}${fmtMoney(t.laba)})? Tindakan ini tidak bisa dibatalkan.`);
    if(!confirmed) return;
    DATA.trades = DATA.trades.filter(x=>x.id!==currentId);
    rebuildEquitySeries();
    recomputeAll();
    if(!saveActiveData(DATA)){
      errEl.textContent = 'Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir).';
      errEl.style.display='block'; return;
    }
    try{ localStorage.setItem('jurnalUndoDelete', JSON.stringify({ trade:t, at:Date.now() })); }catch(e){}
    closeDetail();
    queueNotifyAfterReload('Transaksi berhasil dihapus. Bisa dikembalikan lewat tombol "Batalkan hapus" di tab Transaksi (30 menit).', 'success');
    setTimeout(()=>{ location.reload(); }, 300);
  });
  window.openTradeDetail = openDetail;
})();

// ---------- Ringkasan: ajakan isi catatan psikologi (v1.1.115) ----------
// Menghitung transaksi tanpa catatan (hasNote) dan membuka alur "Simpan & lanjut" yang sudah ada (antrean di sessionStorage).
function renderPsyPrompt(){
  const box = document.getElementById('psyPromptCard'); if(!box) return;
  const trades = DATA.trades || [];
  const missing = trades.filter(t=>!hasNote(t));
  if(!trades.length || !missing.length){ box.hidden = true; return; }
  const cover = (trades.length - missing.length) / trades.length * 100;
  document.getElementById('psyPromptTitle').textContent = `${missing.length} transaksi belum ada catatan psikologi`;
  document.getElementById('psyPromptSub').textContent = `Cakupan catatan baru ${cover.toFixed(cover < 10 ? 1 : 0).replace('.', ',')}% dari ${trades.length} transaksi. Makin lengkap, makin berguna analisis psikologi di Laporan. Diurutkan dari transaksi terbaru.`;
  box.hidden = false;
}
(function(){
  const btn = document.getElementById('psyPromptBtn');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const missing = (DATA.trades || []).filter(t=>!hasNote(t))
      .sort((p,q) => parseGmt8(q.tanggal_gmt8) - parseGmt8(p.tanggal_gmt8));
    if(!missing.length || !window.openTradeDetail) return;
    try{ sessionStorage.setItem('jurnalFillQueue', JSON.stringify(missing.slice(1).map(t=>t.id))); }catch(e){}
    const tabBtn = document.querySelector('.main-tab-btn[data-tab="transaksi"]');
    if(tabBtn) tabBtn.click();
    window.openTradeDetail(missing[0].id);
    const eb = document.getElementById('detailEditBtn'); if(eb) eb.click();
  });
})();

// Pemicu render awal dipindah ke sini (paling akhir skrip) supaya modul CS/DTP
// (dipakai filter tab Transaksi) sudah selesai dibangun sebelum renderTrades() pertama jalan.
selectPeriodKey('all'); // default Ringkasan: All (v1.1.111, chip sejak v1.1.134)
renderPsyPrompt();
// ---------- Pilih & isi massal catatan psikologi (v1.1.126) ----------
(function(){
  const table = document.querySelector('table.ledger'), bar = document.getElementById('bulkBar'), selBtn = document.getElementById('ledgerSelectBtn');
  if(!table || !bar || !selBtn) return;
  [['csw_bulkEmosi','Isi emosi',EMOSI_OPTIONS],['csw_bulkTrigger','Isi trigger',TRIGGER_OPTIONS],['csw_bulkJenis','Isi jenis entry',JENIS_ENTRY_OPTIONS]].forEach(([id,ph,o])=>CS.build(id, o, ph));
  const ui = ()=>{ document.getElementById('bulkCount').textContent = ledgerSel.size + ' dipilih'; };
  const setMode = on => {
    table.classList.toggle('selecting', on); bar.style.display = on ? 'flex' : 'none';
    selBtn.textContent = on ? 'Selesai' : 'Pilih'; selBtn.setAttribute('aria-pressed', String(on));
    if(!on) ledgerSel.clear();
    ui(); renderTrades();
  };
  selBtn.addEventListener('click', ()=>setMode(!table.classList.contains('selecting')));
  tbody.addEventListener('click', e=>{
    const tr = e.target.closest('tr[data-id]');
    if(!tr || !table.classList.contains('selecting')) return;
    const id = tr.dataset.id;
    if(ledgerSel.has(id)) ledgerSel.delete(id); else ledgerSel.add(id);
    tr.classList.toggle('sel-on', ledgerSel.has(id));
    const cb = tr.querySelector('.sel-cb'); if(cb) cb.checked = ledgerSel.has(id);
    ui();
  });
  document.getElementById('bulkAllBtn').addEventListener('click', ()=>{ lastFilteredTrades.forEach(t=>ledgerSel.add(t.id)); ui(); renderTrades(); });
  document.getElementById('bulkNoneBtn').addEventListener('click', ()=>{ ledgerSel.clear(); ui(); renderTrades(); });
  document.getElementById('bulkApplyBtn').addEventListener('click', async ()=>{
    const f = { emosi:CS.get('csw_bulkEmosi'), trigger:CS.get('csw_bulkTrigger'), jenis_entry:CS.get('csw_bulkJenis') };
    const keys = Object.keys(f).filter(k=>f[k]);
    if(!ledgerSel.size || !keys.length){ await showConfirmModal(!ledgerSel.size ? 'Pilih dulu transaksi yang mau diisi (ketuk barisnya, atau "Pilih semua hasil filter").' : 'Pilih minimal satu isian: emosi, trigger, atau jenis entry.'); return; }
    if(!await showConfirmModal(`Isi ${ledgerSel.size} transaksi: ${keys.map(k=>k.replace('_',' ') + ' = ' + f[k]).join(', ')}? Isian yang tidak dipilih tidak diubah; isian lama pada kolom yang sama ditimpa.`)) return;
    let n = 0;
    DATA.trades.forEach(t=>{ if(ledgerSel.has(t.id)){ keys.forEach(k=>{ t[k] = f[k]; }); n++; } });
    rebuildEquitySeries(); recomputeAll();
    if(!saveActiveData(DATA)){ await showConfirmModal('Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir).'); return; }
    queueNotifyAfterReload(`${n} transaksi diperbarui.`, 'success');
    setTimeout(()=>{ location.reload(); }, 300);
  });
})();
// v1.1.122: pulihkan filter, sortir, jumlah baris, dan posisi gulir buku transaksi setelah reload (simpan/hapus/"Simpan & lanjut").
(function(){
  let s = null; try{ s = JSON.parse(sessionStorage.getItem(LEDGER_KEY)||'null'); }catch(e){}
  if(!s) return;
  ledgerRestoring = true;
  try{
    document.getElementById('searchBox').value = s.q || '';
    document.getElementById('ledgerLotMin').value = s.lotMin || '';
    document.getElementById('ledgerLotMax').value = s.lotMax || '';
    CS.set('csw_filterArah', s.arah || ''); CS.set('csw_filterHasil', s.hasil || ''); CS.set('csw_filterCatatan', s.catatan || '');
    CS.set('csw_filterEmosi', s.fEmosi || ''); CS.set('csw_filterTrigger', s.fTrig || ''); CS.set('csw_filterJenis', s.fJenis || ''); CS.set('csw_filterSesi', s.fSesi || '');
    DTP.set('ledgerFrom', s.from || ''); DTP.set('ledgerTo', s.to || '');
    if(s.sort && SORT_GETTERS[s.sort.key] && (s.sort.dir===1 || s.sort.dir===-1)){ currentSort = { key:s.sort.key, dir:s.sort.dir }; if(window.updateLedgerSortInd) window.updateLedgerSortInd(); }
    ledgerLimit = Math.max(300, s.limit || 300);
  }catch(e){}
  ledgerRestoring = false;
  renderTrades();
  document.querySelectorAll('.ledger-quick-range .quick-chip').forEach(b=>b.classList.toggle('active', !!s.chip && b.dataset.range===s.chip));
  syncLedgerAllChip();
  const sc = document.querySelector('.ledger-scroll'), applyScroll = ()=>{ if(sc && s.st) sc.scrollTop = s.st; };
  setTimeout(applyScroll, 60);
  const tb = document.querySelector('.main-tab-btn[data-tab="transaksi"]'); if(tb) tb.addEventListener('click', ()=>setTimeout(applyScroll, 60), { once:true });
})();
// v1.1.124: batalkan hapus (satu tingkat, 30 menit, hanya di browser ini; tidak ikut sinkron/ekspor).
(function(){
  const K = 'jurnalUndoDelete', bar = document.getElementById('undoDeleteBar');
  let v = null; try{ v = JSON.parse(localStorage.getItem(K) || 'null'); }catch(e){}
  const drop = ()=>{ try{ localStorage.removeItem(K); }catch(e){} if(bar) bar.style.display = 'none'; };
  if(!bar || !v || !v.trade || !v.trade.id || Date.now() - v.at > 30*60000){ if(v) drop(); return; }
  document.getElementById('undoDeleteText').textContent = 'Transaksi #' + v.trade.id + ' baru dihapus.';
  bar.style.display = 'flex';
  document.getElementById('undoDeleteX').addEventListener('click', drop);
  document.getElementById('undoDeleteBtn').addEventListener('click', ()=>{
    if(!DATA.trades.some(x=>x.id===v.trade.id)){
      DATA.trades.push(v.trade);
      DATA.trades.sort((x,y)=>parseGmt8(x.tanggal_gmt8) - parseGmt8(y.tanggal_gmt8));
      rebuildEquitySeries(); recomputeAll();
      if(!saveActiveData(DATA)){ showConfirmModal('Gagal menyimpan ke penyimpanan lokal browser (mungkin penuh atau diblokir).'); return; }
    }
    try{ localStorage.removeItem(K); }catch(e){}
    queueNotifyAfterReload('Transaksi dikembalikan.', 'success');
    setTimeout(()=>{ location.reload(); }, 300);
  });
})();
(function(){
  let id = null;
  try{ id = sessionStorage.getItem('jurnalFillOpen'); sessionStorage.removeItem('jurnalFillOpen'); }catch(e){}
  if(!id || !window.openTradeDetail) return;
  const tabBtn = document.querySelector('.main-tab-btn[data-tab="transaksi"]');
  if(tabBtn) tabBtn.click();
  window.openTradeDetail(id);
  const eb = document.getElementById('detailEditBtn'); if(eb) eb.click();
})();

// ---------- Tentang aplikasi: versi + riwayat perubahan bahasa awam (v1.1.113) ----------
// SETIAP RILIS: naikkan APP_VERSION, tambah entri di USER_CHANGELOG (tanggal ISO, bahasa pengguna akhir),
// naikkan CACHE di sw.js, dan tambah entri di CHANGELOG.md. Versi hanya tampil di Setelan (bukan di footer).
const APP_VERSION = '1.1.134';
const USER_CHANGELOG = [
  { date:'2026-09-29', items:[
    'Pilihan periode kini berupa <strong>chip bulat</strong> (7H · 1B · 3B · 1T · All · Sesuaikan) di Ringkasan dan Analisis PNL, dan bawaannya <strong>All</strong>. Tab Transaksi mendapat chip <strong>All</strong> (tanpa batas tanggal). Tombol mata uang di kartu saldo tampil polos tanpa garis tepi.',
    'Kurva ekuitas di Ringkasan <strong>lebih jelas</strong>: garis modal dan puncak berjalan kini beda gaya dan warna, sumbu angka memakai kelipatan bulat dengan satuan dan garis nol, isian hanya di antara kurva dan modal, blok drawdown menjadi pita tipis di dasar, dan tooltip tampil di atas grafik lalu hilang sendiri di layar sentuh. Legenda bisa diketuk untuk menyembunyikan garis atau menyorot drawdown. Angka PF kini memakai koma.',
    'Aplikasi terbuka <strong>lebih cepat</strong>, terutama saat sinyal lemah: tampilan langsung muncul dari penyimpanan perangkat dan diperbarui diam-diam di latar. Setelah ada versi baru, versi itu dipakai saat aplikasi dibuka lagi. Huruf tidak lagi menahan tampilan awal.',
    'Setelan → <strong>Tampilan</strong>: pilih <strong>warna aksen</strong> sendiri (tombol utama, tab aktif, garis kurva) untuk mode gelap dan terang secara terpisah; warna yang kontrasnya terlalu rendah atau terlalu mirip warna untung/rugi ditolak dengan penjelasan. Ditambah opsi <strong>untung biru / rugi oranye</strong> bagi yang sulit membedakan hijau–merah, dan tombol <strong>Atur ulang tampilan</strong>.',
    'Setelan → <strong>Tampilan</strong>: skema warna kini juga berlaku di <strong>mode terang</strong> (sebelumnya semua skema tampil sebagai terang Kertas Hangat). Tiap skema punya versi terangnya sendiri, dan contoh warna di kartu skema ikut berganti mengikuti mode.',
    'Tab <strong>Transaksi</strong>: <strong>catatan bebas</strong> per transaksi (alasan entry, pelajaran) di form Tambah dan Edit, tampil di detail; ikon ✎ di samping ID menandai transaksi yang punya catatan, kotak pencarian kini juga mencari isi catatan, dan ekspor/impor CSV memuat kolom Catatan. Catatan ikut sinkron ke cloud setelah kolom <code>catatan</code> ditambahkan di Supabase (jalankan <code>migrasi-catatan.sql</code> sekali).',
    'Tab <strong>Transaksi</strong> di HP (layar sempit): daftar kini tampil sebagai <strong>kartu ringkas</strong> (tanggal + ID, arah, laba besar di kanan, lot/buka/tutup/pips di bawahnya) sehingga tidak perlu menggulir ke samping; ketuk kartu tetap membuka detail. Header kolom diganti menu <strong>Urutkan</strong> di atas daftar.',
    'Tab <strong>Transaksi</strong>: <strong>impor CSV</strong> kini bisa membaca CSV lama yang tanggalnya tanpa tahun (mis. "27 Sep 22:29") dan bulan berbahasa Indonesia; sebelumnya semua baris dianggap tidak valid. Transaksi dengan ID sama tetapi waktu tutup berbeda (penutupan parsial) dalam satu file kini ikut diimpor.',
    'Tab <strong>Transaksi</strong>: tombol <strong>Pilih</strong> untuk memilih beberapa transaksi (ketuk baris, atau "Pilih semua hasil filter") lalu mengisi emosi, trigger, dan jenis entry sekaligus, cocok dipadukan dengan filter "Belum ada catatan"; serta pengaturan baru di Setelan → <strong>Buku transaksi</strong> untuk memilih persentase rugi terbesar yang diberi garis merah (bawaan 10%).',
    'Tab <strong>Transaksi</strong>: filter baru <strong>Emosi</strong>, <strong>Trigger</strong>, <strong>Jenis entry</strong>, dan <strong>Sesi pasar</strong>; tombol <strong>‹ ›</strong> di jendela detail untuk pindah ke transaksi sebelumnya/berikutnya tanpa menutupnya; kolom <strong>Laba aktual</strong> di Tambah/Edit transaksi (isi bila ingin memakai laba asli broker, termasuk swap dan komisi); dan <strong>Kalkulator lot</strong> juga tersedia di menu tombol (+).',
    'Tab <strong>Transaksi</strong>: kolom <strong>Waktu buka</strong> dan <strong>Durasi</strong> (bisa diurutkan; disembunyikan di layar HP), ringkasan hasil filter di bawah tabel (menang, rugi, win rate, rata-rata menang/rugi, profit factor), chip cepat <strong>Hari Ini</strong>, <strong>Minggu Ini</strong> (mulai Senin), dan <strong>Bulan Lalu</strong>, serta tombol <strong>Batalkan hapus</strong> selama 30 menit setelah menghapus transaksi. Perbaikan: chip <strong>7 Hari</strong> dan <strong>30 Hari</strong> tidak lagi salah menghitung tanggal awal di awal bulan atau saat tanggal hari ini kecil.',
    'Tab <strong>Transaksi</strong> bisa <strong>impor CSV</strong>: tombol ikon unggah di samping tombol ekspor. Aplikasi menampilkan ringkasan (jumlah transaksi baru, ID yang dilewati, baris tidak valid) dan meminta konfirmasi; transaksi baru ditambahkan tanpa mengubah data lama. Ekspor CSV kini juga memuat kolom <strong>Tanggal tutup (GMT+8)</strong> agar hasil ekspor bisa diimpor kembali dengan waktu yang tepat.',
    'Tab <strong>Transaksi</strong>: daftar kini bisa dibuka seluruhnya lewat tombol <strong>Tampilkan lagi</strong> (sebelumnya berhenti di 300 baris); filter, urutan, dan posisi gulir tidak hilang lagi setelah menyimpan atau menghapus, jadi mengisi catatan psikologi berurutan lebih nyaman; titik hijau di samping ID menandai transaksi yang sudah punya catatan psikologi; ekspor CSV kini memuat waktu buka dan catatan psikologi; tombol <strong>Kalkulator lot</strong> pindah ke baris judul (di HP tinggal ikon) sehingga filter naik satu baris.',
    'Setelan punya bagian <strong>Tampilan</strong>: pilih mode <strong>Gelap / Terang / Otomatis</strong> (mengikuti perangkat) dan lima skema warna: Emas Klasik, Blue Ocean, Teal Green, Grafit Netral, dan Kontras Tinggi (untung biru, rugi oranye, ramah buta warna). Skema berlaku di mode gelap.',
    'Tombol <strong>Tutup</strong> di jendela (detail transaksi, detail hari, kalkulator, riwayat perubahan, notifikasi) diganti tombol <strong>✕</strong> di sudut kanan atas.',
    'Banyak tombol kini memakai <strong>ikon</strong> (unduh, cetak, sinkronkan/pulihkan cloud, edit, hapus, tutup, keluar, riwayat). Tombol penting seperti Simpan, Batal, Masuk, dan Daftar tetap berikon plus tulisan. Tahan atau arahkan kursor ke ikon untuk melihat namanya.',
    'Di Setelan → Sinkron Supabase kini tampil <strong>tanggal dan jam terakhir disinkronkan</strong> ke cloud, dan terakhir dipulihkan dari cloud (waktu perangkat ini).',
    'Tombol sinkron di Setelan kini berbunyi <strong>Sinkronkan ke cloud</strong> dan <strong>Pulihkan dari cloud</strong> (sebelumnya "Kirim ke awan" dan "Tarik dari awan"); semua tulisan "awan" diganti "cloud". Fungsinya sama.',
    'Query pembuatan akun di <strong>query-user-supabase.sql</strong> diperbaiki agar mudah disalin dan dijalankan di Supabase, termasuk dari HP.',
    'Tersedia file <strong>query-user-supabase.sql</strong> untuk membuat akun login dan memeriksa data di Supabase (daftar user, ringkasan performa, cek keamanan). Dijalankan manual di Supabase, tidak mengubah tampilan aplikasi.',
    'Kurva ekuitas di Ringkasan kini punya lencana <strong>DD saat ini</strong> (turun berapa persen dari puncak) dan <strong>garis puncak</strong> putus-putus. Angkanya sama dengan yang ada di Laporan.',
    'Ringkasan menampilkan kartu <strong>ajakan mengisi catatan psikologi</strong>: jumlah transaksi yang belum dicatat, dengan tombol <strong>Isi sekarang</strong> untuk mengisinya satu per satu dari yang terbaru.',
    '<strong>Kalkulator</strong> tidak lagi jadi tab sendiri. Buka lewat tombol <strong>Kalkulator lot</strong> di tab Transaksi; hasilnya muncul di jendela kecil, jadi Anda tidak perlu pindah halaman.',
    '<strong>Riwayat perubahan</strong> kini bisa dibuka dari Setelan, lengkap dengan info versi aplikasi.',
    'Kartu <strong>PNL Hari Ini</strong> menampilkan sisa batas rugi harian dan batas jumlah transaksi (bar hijau, emas, lalu merah saat hampir atau sudah tercapai). Batasnya diatur di Setelan.',
    'Di layar lebar, menu pindah ke <strong>sidebar kiri</strong> yang bisa diciutkan, dan tampilan memakai lebih banyak kolom.',
    'Kurva Ringkasan langsung menampilkan <strong>seluruh riwayat (All Time)</strong> saat dibuka.',
    'Aplikasi bisa <strong>dipasang di HP</strong> (Android dan iOS) seperti aplikasi biasa.',
    'Data bisa <strong>disinkronkan ke cloud</strong> untuk cadangan dan pindah perangkat (Setelan → Sinkron Supabase).',
    'Perbaikan: layar tidak lagi berkedip gelap saat memakai tema terang.'
  ]},
  { date:'2026-09-28', items:[
    'Pilihan mata uang <strong>USD / USC / Rp</strong> di kartu saldo, berlaku di semua tab. Setara rupiah tampil kecil di bawah angka.',
    'Tab Laporan jauh lebih lengkap: <strong>heatmap jam × hari</strong>, sesi pasar (Asia, London, New York), grafik drawdown, tren performa, sebaran hasil, analisis ukuran lot, dan <strong>temuan otomatis</strong> dari data Anda.',
    'Laporan bisa <strong>membandingkan dua periode</strong> berdampingan, dan disaring berdasarkan arah, sesi, emosi, trigger, dan jenis entry.',
    'Periode Laporan kini mulai dari <strong>All Time</strong>. Hasil laporan bisa dicetak atau disimpan ke PDF dengan tata letak A4 yang rapi.',
    'Batas harian pribadi (maks rugi dan maks transaksi) bisa diisi di Setelan.',
    'Tab Transaksi punya filter catatan psikologi dan tombol <strong>Simpan &amp; lanjut</strong> untuk mengisi catatan berurutan.',
    'Perbaikan: tooltip grafik tidak lagi keluar dari kartu di layar sempit, Max Drawdown tidak lagi melebihi 100%, dan beberapa tampilan cetak dirapikan.'
  ]},
  { date:'2026-09-27', items:[
    'Perbaikan: saldo di Kalkulator dan rekor transaksi kini ikut terhitung ulang setelah data berubah.'
  ]},
  { date:'2026-09-26', items:[
    'Tab baru <strong>Analisis PNL</strong>: statistik rentang waktu (7 hari sampai 1 tahun) dan kalender PNL harian. Ketuk tanggal untuk melihat transaksinya.',
    'Menu diperbarui, Setelan kini lewat ikon ⚙. Semua dropdown dan kalender bisa dipakai lewat keyboard.',
    'Halaman jadi lebih ringan dan cepat, dan label di Analisis PNL tidak lagi saling menimpa.'
  ]},
  { date:'2026-09-25', items:[
    'Tab <strong>Laporan</strong> pertama hadir: tren laba/rugi, ringkasan periode, analisis psikologi trading, dan cetak PDF.',
    'Kurva dibuat lebih halus. Ada jendela detail per hari, tema terang/gelap yang tersimpan, dan pilihan zona waktu.',
    'Perbaikan: tab "1 Tahun" tidak lagi membuat halaman macet.'
  ]},
  { date:'2026-09-23', items:[
    'Tombol <strong>+</strong> untuk menambah transaksi, deposit, atau penarikan secara manual, lengkap dengan catatan psikologi (trigger, emosi, jenis entry). Transaksi bisa dilihat, diedit, dan dihapus.'
  ]},
  { date:'2026-09-22', items:[
    'Versi awal: Ringkasan, Performa, Deposit, Transaksi, dan Kalkulator (sekarang dibuka dari tab Transaksi).',
    'Data tersimpan otomatis di browser. Ada tombol Reset ke Bawaan yang mengunduh cadangan dulu.'
  ]}
];
(function(){
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const overlay = document.getElementById('changelogModalOverlay');
  const listEl = document.getElementById('changelogList');
  const verEl = document.getElementById('appVersionVal');
  if(verEl) verEl.textContent = 'v' + APP_VERSION;
  function fmtDate(iso){ const [y,m,d] = iso.split('-').map(Number); return `${d} ${monthNames[m-1]} ${y}`; }
  function render(){
    const rows = USER_CHANGELOG.slice().sort((a,b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    listEl.innerHTML = rows.map(r =>
      `<div class="cl-date">${fmtDate(r.date)}</div><ul class="cl-items">${r.items.map(i => `<li>${i}</li>`).join('')}</ul>`
    ).join('');
  }
  function open(){ render(); listEl.scrollTop = 0; overlay.classList.add('show'); }
  function close(){ overlay.classList.remove('show'); }
  document.getElementById('changelogBtn').addEventListener('click', open);
  document.getElementById('changelogCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('show')) close(); });
})();

// ---------- Modal Kalkulator: tombol di tab Transaksi (v1.1.114) ----------
(function(){
  const overlay = document.getElementById('calcModalOverlay');
  const openBtn = document.getElementById('openCalcBtn');
  if(!overlay || !openBtn) return;
  function open(){ overlay.classList.add('show'); }
  function close(){ overlay.classList.remove('show'); openBtn.focus(); }
  openBtn.addEventListener('click', open);
  document.getElementById('calcModalCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('show')) close(); });
})();
