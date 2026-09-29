# Ringkasan Proyek — Jurnal XAUUSD

Riwayat per rilis/tema: `CHANGELOG.md`. Fitur & cara pakai: `README.md`. File ini hanya memuat status, arsitektur, jebakan bug, dan todo.

## Apa ini
Dashboard trading journal single-file HTML untuk akun cent XAUUSD. Tab: Ringkasan, Analisis PNL, Performa, Laporan, Transaksi, Deposit, Kalkulator + Setelan (⚙). File utama: `index.html` + `style.css` + `app.js` + `sync.js` + `config.js` (v1.1.105).

## Status (v1.1.102)
- Data aktif ada di localStorage (`jurnalXauusdData_v1`), bukan di file. File baru kosong (`kurs` = 0, mode Rp tampil Rp 0) sampai JSON diimpor lewat Setelan.
- JSON ekspor terbaru (441 transaksi, sudah berisi `waktu_buka`) siap diimpor manual. Angka ringkasan dihitung otomatis, tidak dicatat di sini.
- Tab Laporan: Paket A/B/Optimalisasi, style cetak PDF, dan L1–L17 selesai (v1.1.78–1.1.101); tinggal L18. Tooltip kurva drawdown yang melebar keluar kartu sudah diperbaiki (v1.1.102); tooltip rolling & distribusi ditambahkan sekalian. Tidak ada bug fungsional terbuka; dua cek tampilan tooltip tercatat di Rawan bug.

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
- **Verifikasi:** render & error konsol dicek tiap rilis lewat Playwright + Chromium (390/768/1280px); interaksi kompleks hanya dicek bila ada dugaan bug.

## Todo
**Laporan (putaran 2)** — L1–L17 selesai (rincian di `CHANGELOG.md`, v1.1.85–1.1.100). Sisa:
- [ ] L18. Ekspor ringkasan Laporan periode terpilih ke CSV (KPI, kelompok psikologi, sesi, heatmap) untuk analisis di luar aplikasi; nominal tetap ¢ seperti ekspor lain.

**Sisa catatan dari selesai:** distribusi pips (L14 hanya PNL); hover/tooltip grafik rolling (L12).

**Verifikasi manual** (cetak PDF data asli sudah dicek 2× pada 28 Sep → perbaikan v1.1.82–1.1.83; cek ulang cetak v1.1.83 dan sisanya): tooltip kurva ekuitas (termasuk "Kustom…") dan grafik Tren (garis & bar), heatmap, blok sesi pasar dan KPI Max DD % dengan data asli, data kosong, mode terang layar, cetak di browser asli (cek margin box nomor halaman; baru diuji di Chromium).

**Ide lanjutan** (opsional)
- **Ukuran:** file kini ~294 KB. Rincian JS/CSS/HTML terakhir diukur di v1.1.81 (240 KB: JS 154, CSS 47, HTML 39; komentar JS ±17 KB, indentasi ±9 KB) dan belum diukur ulang. Muat ±175 ms, `renderLap2` 12 ms dengan 439 transaksi (v1.1.81). Minify bisa hemat ±30–40% tapi menyulitkan edit; bila perlu, buat build minified terpisah dan pertahankan file sumber. Tinjau ulang bila file > ~400 KB.
- Sinkron Supabase ada sejak v1.1.105 (`sync.js`); dependency eksternal: supabase-js dari jsDelivr.
