# Ringkasan Proyek — Jurnal XAUUSD

Riwayat per rilis/tema: `CHANGELOG.md`. Fitur & cara pakai: `README.md`. File ini hanya memuat status, arsitektur, jebakan bug, dan todo.

## Apa ini
Dashboard trading journal single-file HTML untuk akun cent XAUUSD. Tab: Ringkasan, Analisis PNL, Performa, Laporan, Transaksi, Deposit + Setelan (⚙); Kalkulator berupa modal dari tombol "Kalkulator lot" di tab Transaksi (bukan tab, sejak v1.1.114); navigasi desktop ≥ 1100px berupa sidebar kiri yang bisa diciutkan lewat tombol melayang (v1.1.110). File utama: `index.html` + `style.css` + `app.js` + `sync.js` + `config.js` (v1.1.105).

## Status (v1.1.115)
- Data aktif ada di localStorage (`jurnalXauusdData_v1`), bukan di file. File baru kosong (`kurs` = 0, mode Rp tampil Rp 0) sampai JSON diimpor lewat Setelan.
- JSON ekspor terbaru (441 transaksi, sudah berisi `waktu_buka`) siap diimpor manual. Angka ringkasan dihitung otomatis, tidak dicatat di sini.
- Tab Laporan: Paket A/B/Optimalisasi, style cetak PDF, dan L1–L17 selesai (v1.1.78–1.1.101); L18 juga sudah selesai (tombol Ekspor CSV). Tooltip kurva drawdown yang melebar keluar kartu sudah diperbaiki (v1.1.102); tooltip rolling & distribusi ditambahkan sekalian. Tidak ada bug fungsional terbuka; dua cek tampilan tooltip tercatat di Rawan bug.
- Sejak v1.1.105: kode dipecah jadi folder datar dan ada sinkron Supabase manual (`sync.js`); v1.1.106: bisa dipasang sebagai PWA. v1.1.108: layout desktop ≥ 1100px (lebar 1240px, 2 kolom di Ringkasan/Performa/Setelan). v1.1.109–1.1.110: navigasi desktop berupa sidebar kiri yang bisa diciutkan lewat tombol bulat melayang (pilihan di `jurnalSidebar`). v1.1.111: kurva Ringkasan default All Time. v1.1.112: status batas harian di kartu PNL Hari Ini. v1.1.113: Setelan → Tentang aplikasi (versi + modal Riwayat perubahan bahasa pengguna; versi tak lagi di footer). v1.1.114: tab Kalkulator dihapus dari nav; kalkulator jadi modal dari tab Transaksi (id `calc*`/`mmGridQuick` tetap, logika hitung tidak berubah). v1.1.115: lencana DD saat ini + garis puncak di kurva Ringkasan dan kartu ajakan catatan psikologi (P1 Ringkasan tuntas).
- Belum diuji ke proyek Supabase asli dan belum dicek di perangkat asli (sentuhan, PWA, sidebar); daftar cek manual ada di Todo.

## Arsitektur singkat
- Satu file `.html`; fallback data di `<script id="journal-data">`, data aktif di localStorage. Nominal internal dalam sen (¢); tampilan lewat `fmtMoney`, estimasi rupiah lewat `approxRp()`.
- Satu-satunya sumber daya eksternal: Google Fonts (font cadangan dipakai saat offline).
- Periode ("Hari Ini", kalender, Laporan) berpatokan GMT+8 tetap; dropdown zona waktu hanya mengubah tampilan jam. `tanggal` = broker GMT+3; `tanggal_gmt8`/`waktu_buka` = GMT+8.
- Ekspor/impor lewat Setelan (HTML & JSON); impor menimpa data aktif dengan konfirmasi. Tabel key penyimpanan ada di `README.md`.
- Kurva ekuitas di-crop sesuai periode; sebelum data ada → seluruh riwayat, setelah transaksi terakhir → garis datar di saldo terakhir.
- Tiap `<section>` jadi kartu; tooltip grafik lewat `ChartHover`; warna grafik memakai `var(--…)` agar ikut tema cetak.
- `period_ranges`/`periods` (selain "All Time") hanya snapshot fallback; halaman menghitung live dari `DATA.trades`.

## Rawan bug
- **Urutan skrip:** modul `CS`/`DTP` harus didefinisikan sebelum render awal yang memakainya (blank page v1.1.64).
- **Kalender GMT+8:** bucketing bulanan/label hari harus membaca kalender GMT+8, bukan komponen UTC mentah (hang v1.1.46, label mundur v1.1.76).
- **Cetak vs layar:** lebar A4 (~700px) memicu `@media (max-width:720px)`; grid `.stats` dan `.stat:last-child{grid-column:1/-1}` harus dinetralkan di `@media print`. Uji cetak pakai viewport 700px, bukan 900px. Hover/tooltip harus disembunyikan saat cetak.
- **Heatmap:** cetak: teks sel harus `position:absolute` + flex, jangan padding persen. Layar sempit: kolom grid `minmax(0,1fr)` dengan `min-width:0`; sel ber-`aspect-ratio` yang meregang ke tinggi baris memaksa lebar minimum kolom (v1.1.95).
- **Tooltip kurva:** `.eq-tooltip` (`white-space:nowrap`) selalu satu baris; `ChartHover` sekarang mengecilkan font & meng-klem posisi berbasis rect kartu asli (px) agar tidak pernah melewati tepi kartu (v1.1.102, gantikan klem manual per-chart lama). Dipakai kurva ekuitas, drawdown, Tren Laporan, rolling (L12), dan distribusi (L14).
- **Zona waktu:** konversi server→GMT+8 memakai selisih tetap +5 jam (broker dianggap GMT+3 sepanjang tahun). Bila broker memakai jam server berbasis DST AS, jam di musim dingin bisa meleset 1 jam; cek dengan membandingkan satu transaksi dengan MT5.
- **Max DD %:** hitung dari kurva ekuitas dengan deposit/penarikan menggeser puncak (Kompensasi MC bukan arus modal; saldo negatif dibatasi 100%). Jangan bagi Max DD nominal (berbasis PNL) dengan modal; keduanya sengaja beda dasar hitung.
- **Periode Laporan:** default `lap2Gran='all'`; `lap2GetRange('all')` mengabaikan offset dan tanpa periode pembanding (delta dimatikan).
- **Drawdown (L7):** episode dihitung dari `DATA.equity` + `modal_kumulatif`, independen dari filter Arah. Grafik butuh lebar kotak > 0, jadi digambar ulang lewat `ResizeObserver` (tab tersembunyi saat render awal).
- **Batas harian:** di localStorage `jurnalDayLimits`, bukan di `DATA`, jadi tidak ikut ekspor/impor JSON; "hari" = tanggal tutup GMT+8, urutan = waktu tutup.
- **Sesi pasar (L9):** batas jam tetap di `LAP_SESSIONS` (GMT+8, tanpa DST, tidak tumpang tindih); London–New York yang tumpang tindih masuk "New York". Perkiraan kasar, bukan jam buka resmi.
- **Silang psikologi (L16):** tampil bila ≥ 30% transaksi punya catatan (`LAP_MX_MIN_COVER`); data asli baru ±1%, jadi petunjuk tampil dulu. Sel n < 5 (`HEAT_LOW_N`) ditandai; maks 8 baris/kolom.
- **Bandingkan dua periode (L17):** independen dari periode utama Laporan (`lap2Gran`/`lap2Offset`), tapi berbagi filter Arah/Sesi/Emosi/Trigger/Jenis; "Paruh pertama/kedua riwayat" membagi di batas hari penuh dari transaksi pertama sampai hari ini.
- **Ambang lot:** klasifikasi "lot naik" memakai ≥ 1,25× lot sebelumnya; temuan otomatis rasio lot rata-rata (setelah rugi ÷ setelah menang) muncul di ≥ 1,2×. Keduanya sengaja beda.
- **Format nominal:** tanda minus selalu di depan simbol (`-$x`, `-Rp x`); pakai `fmtMoney`/`fmtRp`, jangan tulis `'Rp ' + n` sendiri.
- **Field turunan:** semua field hasil hitung dari `DATA.trades` harus ikut `recomputeAll()`.
- **Alur rilis:** versi hanya ada di `APP_VERSION` (`app.js`, tampil di Setelan → Tentang aplikasi) dan `CACHE` di `sw.js`; keduanya harus dinaikkan bersama. Tiap rilis juga tambah entri berbahasa pengguna akhir di `USER_CHANGELOG` (`app.js`, tanggal ISO; tanggal sama = gabung ke entri itu) selain `CHANGELOG.md` teknis.
- **Lencana DD Ringkasan:** basis All Time (bukan periode kurva) agar sama dengan Laporan L7; garis puncak dipotong (`clipPath`) dan sengaja tidak ikut skala Y. Puncak per titik dipetakan lewat `series[].i` dari `computeLapDD`.
- **Verifikasi:** render & error konsol dicek tiap rilis lewat Playwright + Chromium (390/768/1280px); interaksi kompleks hanya dicek bila ada dugaan bug.

## Todo
**Ringkasan — improvement (prioritas, diusulkan 29 Sep; belum dikerjakan)**
Kondisi sekarang: kartu hero (saldo, PNL kumulatif, Hari Ini, 7H, 30H), kurva ekuitas + lencana DD saat ini & garis puncak + pemilih periode (default All Time), stat strip 6 metrik, kartu ajakan catatan psikologi, kutipan acak.
- **P1 — tinggi, usaha kecil**
  - [x] **Status batas harian di kartu "PNL Hari Ini"** (selesai v1.1.112; `renderDayLimitStatus`, `#dayLimitBox`): bar progres rugi hari ini vs `DAY_LIMITS.maxLoss` dan jumlah transaksi vs `maxTrades` (data sudah ada, sekarang hanya tampil di Laporan). Warna berubah di ≥ 80% dan saat terlampaui; tersembunyi bila batas belum diisi.
  - [x] **Drawdown saat ini + garis puncak di kurva ekuitas** (selesai v1.1.115; `eqDrawdownAllTime`, `renderEqDdBadge`, `#eqDdBadge`): lencana "DD saat ini −x% dari puncak" dan garis putus-putus puncak berjalan; pakai perhitungan drawdown yang sudah ada di Laporan (L7) supaya angkanya konsisten.
  - [x] **Ajakan isi catatan psikologi** (selesai v1.1.115; `renderPsyPrompt`, `#psyPromptCard`): kartu kecil "N transaksi belum ada catatan" dengan tombol ke alur "Simpan & lanjut". Cakupan data asli baru ±1%, dan itu menahan filter/silang psikologi di Laporan (L16).
- **P2 — sedang**
  - [ ] **Toggle kurva: Ekuitas / PNL kumulatif (tanpa deposit):** lonjakan deposit dan penarikan kini menyamarkan performa trading di kurva ekuitas.
  - [ ] **PNL Bulan Ini** (dan opsional Minggu Ini, kalender GMT+8) di samping 7H/30H yang rolling; bulan berjalan lebih sering dipakai untuk evaluasi.
  - [ ] **Metrik stat strip tambahan:** streak saat ini, rata-rata menang/rugi dan rasio menang/rugi; serta judul kecil "Periode: …" di atas stat strip karena strip mengikuti pemilih periode sedangkan kartu hero tidak.
  - [ ] **Keadaan kosong yang bisa ditindaklanjuti:** tombol "Impor JSON" dan "Masuk & Ambil dari awan" langsung di Ringkasan (sekarang hanya teks petunjuk).
- **P3 — rendah**
  - [ ] Indikator sinkron Supabase di Ringkasan (terakhir dikirim/diambil; ada perubahan lokal yang belum dikirim). Sinkron masih manual, jadi mudah lupa.
  - [ ] Ganti kutipan acak dengan checklist/aturan trading pribadi yang bisa diedit (atau hapus kartunya).
  - [ ] Daftar 5 transaksi terakhir dengan hasil dan emosi, bergaya ringkas.
Catatan pengerjaan: tiap butir mengubah `app.js`/`style.css`, jadi ikuti alur rilis biasa (naikkan `APP_VERSION` di `app.js` dan `CACHE` di `sw.js`, tambah entri `USER_CHANGELOG` di `app.js` serta `CHANGELOG.md`, cek Playwright 390/1280px, data kosong dan data sintetis).

**Laporan (putaran 2)** — L1–L17 selesai (rincian di `CHANGELOG.md`, v1.1.85–1.1.100). Sisa:
- [x] L18 (sudah ada di kode: tombol "Ekspor CSV" di tab Laporan). Ekspor ringkasan Laporan periode terpilih ke CSV (KPI, kelompok psikologi, sesi, heatmap) untuk analisis di luar aplikasi; nominal tetap ¢ seperti ekspor lain.

**Sisa catatan dari selesai:** distribusi pips (L14 hanya PNL); hover/tooltip grafik rolling (L12).

**Verifikasi manual** (cetak PDF data asli sudah dicek 2× pada 28 Sep → perbaikan v1.1.82–1.1.83; cek ulang cetak v1.1.83 dan sisanya): tooltip kurva ekuitas (termasuk "Kustom…") dan grafik Tren (garis & bar), heatmap, blok sesi pasar dan KPI Max DD % dengan data asli, data kosong, mode terang layar, cetak di browser asli (cek margin box nomor halaman; baru diuji di Chromium).

**Ide lanjutan** (opsional)
- **Ukuran:** file kini ~294 KB. Rincian JS/CSS/HTML terakhir diukur di v1.1.81 (240 KB: JS 154, CSS 47, HTML 39; komentar JS ±17 KB, indentasi ±9 KB) dan belum diukur ulang. Muat ±175 ms, `renderLap2` 12 ms dengan 439 transaksi (v1.1.81). Minify bisa hemat ±30–40% tapi menyulitkan edit; bila perlu, buat build minified terpisah dan pertahankan file sumber. Tinjau ulang bila file > ~400 KB.
- Sinkron Supabase ada sejak v1.1.105 (`sync.js`); dependency eksternal: supabase-js dari jsDelivr.
