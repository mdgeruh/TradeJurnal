# Ringkasan Proyek — Jurnal XAUUSD

Riwayat per rilis/tema: `CHANGELOG.md`. Fitur & cara pakai: `README.md`. File ini hanya memuat status, arsitektur, jebakan bug, dan todo.

## Apa ini
Dashboard trading journal single-file HTML untuk akun cent XAUUSD. Tab: Ringkasan, Analisis PNL, Performa, Laporan, Transaksi, Deposit + Setelan (⚙); Kalkulator berupa modal dari tombol "Kalkulator lot" di tab Transaksi (bukan tab, sejak v1.1.114); navigasi desktop ≥ 1100px berupa sidebar kiri yang bisa diciutkan lewat tombol melayang (v1.1.110). File utama: `index.html` + `style.css` + `app.js` + `sync.js` + `config.js` (v1.1.105); Supabase: `schema.sql` + `query-user-supabase.sql` (v1.1.116).

## Status (v1.1.126)
- v1.1.126: Transaksi: mode Pilih + isi massal emosi/trigger/jenis entry, ambang garis merah rugi besar bisa diatur di Setelan; belum diuji di browser. Sisa Transaksi: tampilan kartu HP dan catatan bebas (butuh migrasi kolom Supabase `catatan`; lihat butir di Todo).
- v1.1.125: Transaksi: filter Emosi/Trigger/Jenis entry/Sesi, tombol ‹ › di modal detail, Laba aktual opsional di Tambah/Edit (tanpa perubahan skema), Kalkulator lot di menu FAB; belum diuji di browser. Sisa Transaksi: tampilan kartu HP, aksi massal, ambang rugi besar, catatan bebas.
- v1.1.124: Transaksi P2 sebagian: kolom Waktu buka/Durasi, ringkasan hasil filter, chip Hari Ini/Minggu Ini/Bulan Lalu, Batalkan hapus; fix chip 7/30 Hari (`gmt8DateKeyFromParts` tak valid saat d ≤ 0); belum diuji di browser.
- v1.1.123: impor CSV di tab Transaksi (tambah saja, ID ganda dilewati, konfirmasi dulu; ekspor CSV kini punya kolom `Tanggal tutup (GMT+8)`); belum diuji di browser. Ide lanjutan: pratinjau baris, pilihan zona waktu, impor deposit, opsi perbarui transaksi ber-ID sama.
- v1.1.122: tab Transaksi P1 selesai (tombol Tampilkan lagi, filter/sortir/gulir bertahan setelah reload, titik status catatan, CSV lengkap, escape HTML) + tombol Kalkulator lot pindah ke baris judul; belum diuji di browser. Sisa P2/P3 Transaksi ada di Todo.
- Data aktif ada di localStorage (`jurnalXauusdData_v1`), bukan di file. File baru kosong (`kurs` = 0, mode Rp tampil Rp 0) sampai JSON diimpor lewat Setelan.
- JSON ekspor terbaru (441 transaksi, sudah berisi `waktu_buka`) siap diimpor manual. Angka ringkasan dihitung otomatis, tidak dicatat di sini.
- Tab Laporan: Paket A/B/Optimalisasi, style cetak PDF, dan L1–L17 selesai (v1.1.78–1.1.101); L18 juga sudah selesai (tombol Ekspor CSV). Tooltip kurva drawdown yang melebar keluar kartu sudah diperbaiki (v1.1.102); tooltip rolling & distribusi ditambahkan sekalian. Tidak ada bug fungsional terbuka; dua cek tampilan tooltip tercatat di Rawan bug.
- Sejak v1.1.105: kode dipecah jadi folder datar dan ada sinkron Supabase manual (`sync.js`); v1.1.106: bisa dipasang sebagai PWA. v1.1.108: layout desktop ≥ 1100px (lebar 1240px, 2 kolom di Ringkasan/Performa/Setelan). v1.1.109–1.1.110: navigasi desktop berupa sidebar kiri yang bisa diciutkan lewat tombol bulat melayang (pilihan di `jurnalSidebar`). v1.1.111: kurva Ringkasan default All Time. v1.1.112: status batas harian di kartu PNL Hari Ini. v1.1.113: Setelan → Tentang aplikasi (versi + modal Riwayat perubahan bahasa pengguna; versi tak lagi di footer). v1.1.114: tab Kalkulator dihapus dari nav; kalkulator jadi modal dari tab Transaksi (id `calc*`/`mmGridQuick` tetap, logika hitung tidak berubah). v1.1.115: lencana DD saat ini + garis puncak di kurva Ringkasan dan kartu ajakan catatan psikologi (P1 Ringkasan tuntas).
- v1.1.121: Setelan → Tampilan: mode Gelap/Terang/Otomatis + 5 skema (`html[data-scheme]` di `style.css`, `SCHEMES` di `app.js`, kunci `jurnalTheme`/`jurnalScheme`). Skema hanya untuk mode gelap. Sisa todo tema: aksen custom, skema rilis 2, reset, `theme_color` manifest, audit warna hardcoded, uji visual.
- v1.1.120: tombol Tutup di modal jadi ✕ sudut (`.modal-x`, sticky/float; elemen pertama `.modal-box`, id tombol tetap).
- v1.1.119: tombol berikon (`.has-ic`, `.ic-only`, `.bi`, `.btn-sr` di `style.css`; SVG inline di `index.html`). Tombol yang teksnya diubah `app.js` ("Simpan & lanjut") sengaja tanpa ikon; bila tombol baru diberi ikon, jangan timpa isinya dengan `textContent`.
- v1.1.118 (lanjutan): info tanggal/jam sinkron & pemulihan terakhir di Setelan (`jurnalSyncInfo`, localStorage, per browser). Indikator di Ringkasan (todo P3) belum.
- v1.1.116–117: tambah `query-user-supabase.sql` (query admin + buat akun login; dijalankan manual, tidak dimuat aplikasi). Blok buat akun v1.1.117 memakai satu perintah CTE (tanpa `do $$`). Belum diuji ke proyek Supabase asli.
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
**Transaksi — improvement (prioritas, diusulkan 29 Sep; belum dikerjakan)**
Kondisi sekarang: buku transaksi 8 kolom (Tanggal tutup, ID posisi, Arah, Lot, Buka, Tutup, Pips, Laba), filter (cari ID, Arah, Hasil, Catatan, rentang tanggal, lot min/max, chip 7 Hari/30 Hari/Bulan Ini), sortir per kolom, garis merah untuk rugi 10% terbesar, klik baris → modal detail (lihat/edit/hapus), tombol Kalkulator lot, ekspor CSV. Logika di `renderTrades()` (`app.js`, sekitar baris 2872–2955); modal detail di IIFE `openDetail` (sekitar baris 3976).
- **P1 — tinggi, usaha kecil–sedang**
  - [x] (selesai v1.1.122) **Batas 300 baris tanpa cara membuka sisanya:** `filtered.slice(0,300)` dan footer hanya menulis "Menampilkan 300 dari 441"; 141 transaksi tertua tak terjangkau kecuali difilter. Tambah tombol "Tampilkan 100 lagi" (atau render bertahap saat gulir).
  - [x] (selesai v1.1.122) **Filter, sortir, dan posisi gulir hilang setelah Simpan/Hapus/"Simpan & lanjut"** karena `location.reload()`. Paling mengganggu di alur isi catatan psikologi (filter "Belum ada catatan" ter-reset tiap simpan). Simpan state di `sessionStorage` (mis. `jurnalLedgerState`) lalu pulihkan setelah reload; jangka panjang render ulang tanpa reload (`allTrades` sekarang `const` yang dihitung sekali saat halaman dibuka).
  - [x] (selesai v1.1.122) **Status catatan psikologi terlihat di baris tabel:** titik/ikon ✓ vs kosong + emosi singkat, supaya tidak perlu membuka detail satu per satu. Sekarang hanya bisa dicek lewat filter Catatan; cakupan data asli baru ±1%.
  - [x] (selesai v1.1.122) **Ekspor CSV dilengkapi:** tambah Waktu buka (GMT+8), Trigger entry/exit, Emosi, Jenis entry. Sekarang CSV tidak memuat data psikologi sama sekali, jadi tak bisa dianalisis di luar aplikasi; header "Laba (cent)" tetap tegas ¢.
  - [x] (selesai v1.1.122) **Escape HTML di baris tabel:** `t.id` dan `t.arah` masuk `innerHTML` dan `data-id` tanpa `escapeHtml` (fungsi sudah ada, ±baris 518). ID dari impor JSON/input manual yang memuat karakter HTML bisa merusak tabel. Kecil, tapi murah diperbaiki.
- **P2 — sedang**
  - [x] (selesai v1.1.122) **Pindahkan posisi tombol "Kalkulator lot":** sekarang berdiri sendiri di baris `.ledger-toolbar` (rata kanan, di atas chip cepat dan filter), jadi memakan satu baris penuh dan mendorong filter serta tabel ke bawah, terutama di HP. Usulan: (1) taruh di baris judul "Buku transaksi" sejajar catatan jumlah transaksi, berupa ikon saja di layar < 720px dan ikon + label di desktop; hapus `.ledger-toolbar`. (2) Opsional: tambah juga sebagai item di menu FAB (+) ("Kalkulator lot") karena kalkulator dipakai sebelum entri baru dan FAB ada di semua tab; id `openCalcBtn`, `calc*`, dan `mmGridQuick` tidak boleh berubah. Tombol tetap bergaya emas dan tetap `aria-haspopup="dialog"`.
  - [x] (selesai v1.1.124) **Kolom Waktu buka dan Durasi** (sortable; bisa disembunyikan lewat toggle "Kolom"). Sekarang tidak bisa mengurutkan menurut waktu buka.
  - [x] (selesai v1.1.124) **Ringkasan hasil filter di footer:** selain "Jumlah", tampilkan jumlah menang/rugi, Win Rate, rata-rata menang/rugi, Profit Factor (data sudah ada di `filtered`).
  - [x] (selesai v1.1.125) **Filter Emosi / Trigger / Jenis entry dan Sesi pasar** di tab Transaksi (dropdown sama seperti di Laporan); pencarian juga mencakup catatan, bukan hanya ID posisi.
  - [x] (selesai v1.1.124) **Chip cepat tambahan:** Hari Ini, Minggu Ini, Bulan Lalu; pastikan chip aktif lepas saat tanggal diubah manual.
  - [x] (selesai v1.1.125) **Laba aktual manual (opsional) di Tambah/Edit:** laba/pips input manual dihitung rumus (selisih harga × lot), tanpa swap/komisi; mengubah harga di Edit menimpa laba asli broker. Field baru → perbarui `schema.sql` dan `sync.js`.
  - [x] (selesai v1.1.124) **Undo hapus:** hapus sekarang permanen (hanya konfirmasi). Beri "Batalkan" ±8 detik atau simpan cadangan sementara.
  - [ ] **Tampilan kartu di layar sempit (< 720px):** tabel min-width 640px + 8 kolom memaksa gulir horizontal. Ganti jadi kartu ringkas (tanggal + ID, arah/lot, laba besar) yang tetap membuka detail saat diketuk.
- **P3 — rendah**
  - [x] (selesai v1.1.125) Navigasi ‹ › di modal detail (transaksi sebelumnya/berikutnya sesuai daftar terfilter) tanpa menutup modal.
  - [x] (selesai v1.1.126) Aksi massal: pilih beberapa baris → isi emosi/trigger/jenis entry sekaligus (hapus massal sengaja tidak dibuat).
  - [x] (selesai v1.1.126) Ambang garis merah "rugi besar" bisa dipilih (10% / 5%) dan ada legenda di tabel; sekarang hanya persentil 10% seluruh riwayat.
  - [ ] Catatan bebas per transaksi (pelajaran/alasan entry) sebagai field teks; ikut `hasNote`, ekspor, dan sinkron. **Catatan 29 Sep:** butuh kolom Supabase baru `catatan text` (migrasi di `schema.sql`) + perubahan `tradeRow`/pull di `sync.js`; tanpa migrasi push gagal dan Pulihkan dari cloud menghapus catatan lokal. Pertimbangkan tidak memasukkannya ke `hasNote` agar cakupan psikologi (L16) tidak bergeser.
- **Rawan bug (catat saat mengerjakan):** baris kosong memakai `colspan="8"` tetap, jadi tiap kolom baru harus mengubah header, `SORT_GETTERS`, `colspan`, CSV, dan style cetak; field turunan baru harus ikut `recomputeAll()`; `hasNote` dipakai filter Catatan dan antrean "Simpan & lanjut", jadi perubahan definisinya berdampak ke keduanya; ikuti alur rilis biasa (naikkan `APP_VERSION` dan `CACHE`, entri `USER_CHANGELOG` + `CHANGELOG.md`, cek Playwright 390/1280px dengan 441 transaksi sintetis dan data kosong).

**Setelan — tema & skema warna custom (diusulkan 29 Sep; belum dikerjakan)**
Kondisi sekarang: dua tema (gelap bawaan, terang) lewat 11 variabel CSS di `:root` dan override `html[data-theme="light"]` (`--ink`, `--ink-raised`, `--paper`, `--paper-dim`, `--paper-faint`, `--gold`, `--gold-dim`, `--gain`, `--loss`, `--line`, `--line-soft`); tombol ☾ di header mengganti tema, pilihan di localStorage `jurnalTheme` (`light`/`dark`). Grafik memakai `var(--…)`, jadi ikut tema; cetak memakai style cetak terang sendiri.
- **P1 — tinggi, usaha sedang**
  - [x] **(selesai v1.1.121; 5 skema rilis 1 + mode Otomatis, belum diuji di browser)** **Bagian "Tampilan" di Setelan: pemilih skema warna** berupa kartu swatch (pratinjau langsung, tanpa muat ulang) + mode **Gelap / Terang / Otomatis** (ikut sistem, `prefers-color-scheme`). Implementasi: tiap skema = satu blok `html[data-scheme="…"]` yang menimpa 11 variabel yang sama (varian gelap dan terang), pilihan di localStorage `jurnalScheme` (+ `jurnalTheme` untuk mode). Terapkan lewat skrip kecil inline di `<head>` sebelum CSS agar tidak berkedip. Tidak masuk `DATA`/ekspor JSON (seperti `jurnalDayLimits`); tombol **Kembali ke bawaan**.
- **P2 — sedang**
  - [ ] **Warna aksen custom:** `<input type="color">` untuk `--gold`; `--gold-dim` dihitung otomatis (redup ±25%); tolak/peringatkan bila rasio kontras aksen terhadap `--ink` < 4,5:1 (WCAG AA), dan jadikan aksen dipakai juga untuk tombol utama, tab aktif, dan garis kurva.
  - [ ] **Pasangan untung/rugi ramah buta warna:** opsi biru/oranye menggantikan hijau/merah (sekitar 8% pria kesulitan membedakan merah–hijau). Warna gain/loss **tidak boleh** ikut terganti oleh aksen custom; hanya lewat opsi ini.
  - [ ] Ikut skema: `<meta name="theme-color">` dan `theme_color` di `manifest.webmanifest` (PWA), bila memungkinkan diubah lewat JS saat skema berganti.
- **Rawan bug (catat saat mengerjakan):** cari warna hardcoded (hex/rgba) di `app.js`/`style.css`/`index.html` yang tidak lewat variabel (grafik SVG, heatmap, badge, tooltip `ChartHover`) dan ganti ke `var(--…)`; cetak harus tetap memakai tema terang tetap apa pun skemanya; uji tiap skema di 390/1280px dan cetak PDF; pastikan `--loss` tetap terbaca di atas `--ink-raised`.
- **Saran skema awal** (pendapat saya; rasio kontras teks terhadap `--ink` sudah dihitung ≥ 4,5:1 untuk `--paper-dim`, aksen, gain, dan loss; belum dilihat di layar):

| Skema | `--ink` | `--ink-raised` | `--paper` | `--paper-dim` | Aksen (`--gold`) | `--gain` | `--loss` |
|---|---|---|---|---|---|---|---|
| **Emas Klasik** (bawaan, tetap default: identitas XAUUSD) | #1B1712 | #231E17 | #EDE6D6 | #9C907B | #C9A24B | #84AB7C | #C06B54 |
| **Midnight Biru** (abu-biru gelap ala terminal trading; mirip Blue Ocean, jadi kandidat dibuang bila dirasa dobel) | #0F1720 | #16212D | #E4EAF1 | #8FA0B3 | #5AA9E6 | #5FBF8F | #E0705F |
| **Blue Ocean** (biru laut dalam + aksen biru cerah, tenang dan bersih) | #071B33 | #0E2A4A | #E3EEF8 | #8FA9C4 | #4DB8FF | #5FD0A0 | #EE7B66 |
| **Teal Green** (hijau-kebiruan segar, tidak menyilaukan di malam hari) | #0B1B1C | #112628 | #E2F0EF | #8DAEAC | #2EC4B6 | #A6D96A | #F0806A |
| **Grafit Netral** (minim warna, fokus ke angka) | #121212 | #1B1B1B | #ECECEC | #A0A0A0 | #E0B84D | #79B98A | #D9736A |
| **Ungu Senja** (lembut untuk sesi panjang) | #17131F | #1F1A2B | #ECE8F5 | #9D95B0 | #B392F0 | #7BC49A | #E07A8B |
| **Kontras Tinggi / Ramah Buta Warna** (untung biru, rugi oranye) | #0A0A0A | #151515 | #FFFFFF | #B8B8B8 | #FFD166 | #4DA3FF | #FF9F43 |
| **Kertas Putih** (terang, siang hari/cetak layar) | #FAFAF8 | #F0EFEA | #1F1E1B | #5E5C55 | #8A5F12 | #2F7A45 | #A8402B |

  Catatan pilihan: aksen sengaja **bukan merah** dan tidak boleh sama dengan warna untung, supaya tidak tertukar dengan untung/rugi. Karena itu di **Teal Green** aksennya teal kebiruan (#2EC4B6) sedangkan untung digeser ke hijau-kuning (#A6D96A); jangan diubah jadi hijau murni. Urutan saya: rilis 1 = pemilih + Emas Klasik, Blue Ocean, Teal Green, Grafit, Kontras Tinggi + mode Otomatis; rilis 2 = aksen custom dan Midnight Biru/Ungu Senja/Kertas Putih; `--paper-faint`, `--gold-dim`, `--line`, `--line-soft` diturunkan dari skema (campur `--paper`/`--ink`) agar tiap skema cukup mendefinisikan 7 warna di tabel.

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
  - [ ] **Keadaan kosong yang bisa ditindaklanjuti:** tombol "Impor JSON" dan "Masuk & Pulihkan dari cloud" langsung di Ringkasan (sekarang hanya teks petunjuk).
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
