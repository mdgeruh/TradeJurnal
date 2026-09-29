# Ringkasan Proyek — Jurnal XAUUSD

Riwayat per rilis/tema: `CHANGELOG.md`. Fitur & cara pakai: `README.md`. File ini hanya memuat status, arsitektur, jebakan bug, dan todo yang **belum selesai** (butir selesai dihapus; jejaknya ada di `CHANGELOG.md`).

## Apa ini
Dashboard trading journal (folder datar, tanpa build tool) untuk akun cent XAUUSD. Tab: Ringkasan, Analisis PNL, Performa, Laporan, Transaksi, Deposit + Setelan (⚙). Kalkulator lot berupa modal dari tombol di tab Transaksi. Navigasi desktop ≥ 1100px berupa sidebar kiri yang bisa diciutkan. File utama: `index.html`, `style.css`, `app.js`, `sync.js`, `config.js`, `pwa.js`, `sw.js`; Supabase: `schema.sql`, `query-user-supabase.sql`, `migrasi-catatan.sql`.

## Status (v1.1.134)
- Semua fitur di README berjalan; tab Transaksi, Laporan (L1–L18, cetak PDF), Setelan → Tampilan (mode + 5 skema + aksen custom + mode buta warna), catatan bebas per transaksi, impor/ekspor CSV, sinkron Supabase manual, dan PWA sudah selesai. Tidak ada bug fungsional terbuka.
- Rilis terakhir (v1.1.134): chip periode 7H·1B·3B·1T·All·Sesuaikan (Ringkasan, Analisis PNL default All; chip All di Transaksi), tombol mata uang tanpa border; belum diuji perangkat asli/mode terang/1280px. Sebelumnya v1.1.133: 10 perbaikan kurva ekuitas Ringkasan (lihat `CHANGELOG.md`; diuji Playwright, belum di perangkat sentuh asli/mode terang/cetak). Sebelumnya v1.1.132: optimalisasi P1 (font non-blocking, supabase-js dikunci `@2.45.4`, service worker cache-dulu, `Permissions-Policy`); belum diuji di browser/perangkat.
- **Perlu tindakan manual:** jalankan `migrasi-catatan.sql` sekali di Supabase SQL Editor (tanpa itu sinkron tetap jalan, tapi catatan tidak ikut ke cloud dan aplikasi menampilkan peringatan).
- Data aktif ada di localStorage (`jurnalXauusdData_v1`), bukan di file. File baru kosong (`kurs` = 0, mode Rp tampil Rp 0) sampai JSON diimpor lewat Setelan.
- Belum diuji ke proyek Supabase asli dan belum dicek di perangkat asli (sentuhan, PWA, sidebar, mode Otomatis, cetak per skema); daftar cek ada di **Verifikasi manual**.

## Arsitektur singkat
- Folder datar; fallback data di `<script id="journal-data">`, data aktif di localStorage. Nominal internal dalam sen (¢); tampilan lewat `fmtMoney`, estimasi rupiah lewat `approxRp()`.
- Sumber daya eksternal: Google Fonts (non-blocking; font cadangan saat offline) dan supabase-js `@2.45.4` dari jsDelivr. Service worker cache-dulu (stale-while-revalidate); respons Supabase tidak di-cache.
- Periode ("Hari Ini", kalender, Laporan) berpatokan GMT+8 tetap; dropdown zona waktu hanya mengubah tampilan jam. `tanggal` = broker GMT+3; `tanggal_gmt8`/`waktu_buka` = GMT+8.
- Ekspor/impor lewat Setelan (HTML & JSON); impor menimpa data aktif dengan konfirmasi. Tabel key penyimpanan ada di `README.md`.
- Kurva ekuitas di-crop sesuai periode; sebelum data ada → seluruh riwayat, setelah transaksi terakhir → garis datar di saldo terakhir.
- Tiap `<section>` jadi kartu; tooltip grafik lewat `ChartHover`; warna grafik memakai `var(--…)` agar ikut tema/cetak.
- `period_ranges`/`periods` (selain "All Time") hanya snapshot fallback; halaman menghitung live dari `DATA.trades`.

## Rawan bug
**Umum**
- **Alur rilis:** naikkan `APP_VERSION` (`app.js`, tampil di Setelan → Tentang aplikasi) dan `CACHE` (`sw.js`) bersama; tambah entri berbahasa pengguna di `USER_CHANGELOG` (tanggal ISO; tanggal sama = gabung) dan entri teknis di `CHANGELOG.md`; perbarui `README.md`/`SUMMARY.md`. Cek Playwright + Chromium 390/768/1280px, data kosong dan data sintetis (±445 transaksi); interaksi kompleks hanya bila ada dugaan bug.
- **Urutan skrip:** modul `CS`/`DTP` harus didefinisikan sebelum render awal yang memakainya (blank page v1.1.64).
- **Field turunan:** semua field hasil hitung dari `DATA.trades` harus ikut `recomputeAll()`.
- **Format nominal:** tanda minus di depan simbol (`-$x`, `-Rp x`); pakai `fmtMoney`/`fmtRp`, jangan tulis `'Rp ' + n` sendiri.
- **Setelan lokal:** `jurnalDayLimits`, `jurnalBigLossPct`, tema/skema/aksen, dst. sengaja tidak ikut `DATA`/ekspor JSON; ubah ekspor hati-hati agar impor lama tetap kompatibel. Id elemen Setelan dipakai `app.js` dan `sync.js`.
- **Tombol berikon** (`.has-ic`, `.ic-only`, `.bi`): jangan timpa isinya dengan `textContent`; "Simpan & lanjut" sengaja tanpa ikon.
- **Riwayat perubahan pengguna:** `#aboutSection` (lencana `#appVersionVal`, tombol `#changelogBtn`, modal `#changelogModalOverlay`) dirender dari `USER_CHANGELOG`, diurutkan menurut tanggal ISO saat dibuka. Butir memakai HTML sederhana (`<strong>`), jangan isi dari input pengguna.
- **Zona waktu:** konversi server→GMT+8 memakai selisih tetap +5 jam (broker dianggap GMT+3 sepanjang tahun). Bila broker memakai jam DST AS, jam musim dingin bisa meleset 1 jam; cek dengan membandingkan satu transaksi dengan MT5.
- **Kalender GMT+8:** bucketing bulanan/label hari harus membaca kalender GMT+8, bukan komponen UTC mentah (hang v1.1.46, label mundur v1.1.76). `gmt8DateKeyFromParts()` dinormalkan lewat `Date.UTC`.

**Tampilan, tema, cetak**
- **Cetak vs layar:** lebar A4 (~700px) memicu `@media (max-width:720px)`; grid `.stats` dan `.stat:last-child{grid-column:1/-1}` harus dinetralkan di `@media print`. Uji cetak pakai viewport 700px. Hover/tooltip disembunyikan saat cetak; cetak memakai tema terang tetap (`body.printing-laporan` mendefinisikan ulang variabel).
- **Heatmap:** cetak: teks sel `position:absolute` + flex, jangan padding persen. Layar sempit: kolom grid `minmax(0,1fr)` dengan `min-width:0`; sel ber-`aspect-ratio` yang meregang memaksa lebar minimum kolom (v1.1.95).
- **Tooltip kurva:** `.eq-tooltip` satu baris (`nowrap`); `ChartHover` mengecilkan font & meng-klem posisi berdasarkan rect kartu (v1.1.102). Dipakai ekuitas, drawdown, Tren, rolling (L12), distribusi (L14).
- **Aksen custom & buta warna:** aksen ditulis inline di `<html>` (`--gold`/`--gold-dim`, kunci `jurnalAccent` per mode); buta warna lewat `html[data-cb="1"]` (`jurnalCB`); blok CSS `data-cb` harus tetap setelah blok skema terang. Skrip `<head>` menerapkan keduanya sebelum render. `theme_color` manifest tetap statis (batas teknis).
- **Skema warna:** tiap skema punya blok gelap dan blok `html[data-theme="light"][data-scheme=…]`; tambah skema baru = dua blok + entri `SCHEMES`. Aksen sengaja bukan merah dan tidak boleh sama dengan warna untung. Uji tiap skema di 390/1280px dan cetak; `--loss` harus terbaca di atas `--ink-raised`.

**Tab Transaksi**
- Kolom baru = ubah header, `SORT_GETTERS`, `colspan` baris kosong (kini 10), CSV, kartu HP (`ledger-tx`/`data-meta`), dan style cetak.
- `hasNote()` (catatan psikologi terstruktur) dipakai filter Catatan, antrean "Simpan & lanjut", kartu ajakan Ringkasan, dan L16; catatan bebas (`catatan`) sengaja tidak masuk.
- Impor CSV tanpa tahun (`27 Sep 22:29`) menebak tahun terdekat; satu file harus mencakup ≤ 12 bulan.

**Ringkasan & Laporan**
- **Max DD %:** dari kurva ekuitas dengan deposit/penarikan menggeser puncak (Kompensasi MC bukan arus modal; saldo negatif dibatasi 100%). Max DD nominal (berbasis PNL) sengaja beda dasar hitung.
- **Lencana DD Ringkasan:** basis All Time agar sama dengan Laporan L7; garis puncak dipotong (`clipPath`), sengaja di luar skala Y; puncak per titik lewat `series[].i` dari `computeLapDD`.
- **Periode Laporan:** default `lap2Gran='all'`; `lap2GetRange('all')` mengabaikan offset dan tanpa periode pembanding (delta dimatikan).
- **Drawdown (L7):** dihitung dari `DATA.equity` + `modal_kumulatif`, independen dari filter Arah. Grafik butuh lebar > 0, digambar ulang lewat `ResizeObserver`.
- **Batas harian:** `jurnalDayLimits` di localStorage; "hari" = tanggal tutup GMT+8, urutan = waktu tutup.
- **Sesi pasar (L9):** batas jam tetap di `LAP_SESSIONS` (GMT+8, tanpa DST); London–New York yang tumpang tindih masuk "New York". Perkiraan kasar.
- **Silang psikologi (L16):** tampil bila ≥ 30% transaksi punya catatan (`LAP_MX_MIN_COVER`); data asli baru ±1%. Sel n < 5 (`HEAT_LOW_N`) ditandai; maks 8 baris/kolom.
- **Bandingkan dua periode (L17):** independen dari periode utama (`lap2Gran`/`lap2Offset`), berbagi filter Arah/Sesi/Emosi/Trigger/Jenis.
- **Ambang lot:** "lot naik" ≥ 1,25× lot sebelumnya; temuan otomatis rasio lot rata-rata muncul di ≥ 1,2×. Sengaja beda.

**Sinkron & PWA**
- Perubahan `sw.js` selalu menaikkan `CACHE` bersama `APP_VERSION`; jangan cache respons Supabase; uji PWA terpasang (Android/iOS) karena cache lama bisa menahan versi (dengan cache-dulu, versi baru terbaca di pembukaan berikutnya).
- `sync.js` bergantung pada `window.supabase`; kolom `catatan` opsional (retry tanpa kolom bila migrasi belum dijalankan).

## Todo (hanya yang belum selesai)
Kelompok berdasarkan area; prioritas P1 tinggi, P2 sedang, P3 rendah. Setiap butir yang mengubah kode mengikuti **Alur rilis**.

### 1. Ringkasan
(Perbaikan kurva ekuitas P1 sudah selesai di v1.1.133 dan dihapus dari daftar.)
**P1 — chip periode (sisa)**
- [ ] Laporan: `#lapGranTabs` (Harian/Mingguan/Bulanan/3 Bulan/1 Tahun/All Time + navigator ‹ ›) sudah bergaya chip dengan All di ujung; keputusan: tetap per kalender (navigator dipakai Bandingkan dua periode, L17). Cek saja visual chip sama dengan Ringkasan di 390px, lalu hapus butir ini.
- [ ] Performa dan Deposit belum punya filter periode: putuskan perlu/tidak; bila perlu, pakai `buildPeriodChips` dengan default All.
- [ ] Cek 1280px, mode terang, dan keyboard (Tab/Enter) untuk chip; "Sesuaikan" di 390px saat date-picker terbuka.
- Catatan: pilihan periode berdiri sendiri per tab (mulai dari All saat dibuka, tidak disimpan); Ringkasan tidak lagi punya pilihan kalender (Minggu/Bulan/Tahun Ini/Lalu), lihat P2 "PNL Bulan Ini".
- Rawan bug: skala Y/area jangan mengubah skala garis puncak; cetak memakai variabel terang sendiri. Struktur kurva: `#chartBox` > `.eq-plot` (svg + tooltip + label) + `.eq-legend`; tooltip berada di strip `padding-top` `#chartBox`, jadi jangan ubah `top`/padding tanpa cek 390px. Chip Transaksi memakai selektor `.ledger-quick-range .quick-chip` (jangan global: `.quick-chip` juga dipakai Setelan → Tampilan).

**P2**
- [ ] Toggle kurva Ekuitas / PNL kumulatif (tanpa deposit): lonjakan deposit/penarikan menyamarkan performa trading.
- [ ] PNL Bulan Ini (opsional Minggu Ini, kalender GMT+8) di samping 7H/30H rolling.
- [ ] Stat strip: streak saat ini, rata-rata menang/rugi dan rasionya; judul kecil "Periode: …" karena strip mengikuti pemilih periode sedangkan kartu hero tidak.
- [ ] Keadaan kosong yang bisa ditindaklanjuti: tombol "Impor JSON" dan "Masuk & Pulihkan dari cloud" langsung di Ringkasan.

**P3**
- [ ] Indikator sinkron Supabase di Ringkasan (terakhir dikirim/diambil; ada perubahan lokal belum dikirim).
- [ ] Ganti kutipan acak dengan checklist/aturan trading pribadi yang bisa diedit (atau hapus kartunya).
- [ ] Daftar 5 transaksi terakhir dengan hasil dan emosi.

### 2. Setelan
**P1**
- [ ] **Bug: "Salinan dashboard (.html)" tidak lagi mandiri.** `buildFullHtmlString()` (`app.js` ±baris 3486) mengekspor `outerHTML`, sedangkan CSS/JS ada di berkas terpisah sejak v1.1.105, jadi hasil unduhan tanpa gaya di luar folder proyek. Pilihan: (a) inline `style.css`+`app.js` saat ekspor, atau (b) hapus tombolnya dan sediakan JSON saja. Sampai diputuskan, jangan andalkan HTML sebagai cadangan.
- [ ] Kurs Rp tidak bisa diatur: `DATA.kurs` = 0 sampai JSON diimpor, jadi mode Rp/"≈ Rp" tampil Rp 0. Tambah "Kurs (Rp per USD)" di Setelan (validasi > 0, efek langsung; sudah ikut ekspor/sinkron).
- [ ] Pengingat cadangan: "Terakhir dicadangkan: N hari lalu" (ekspor JSON/sinkron), peringatan bila > 7 hari atau ada perubahan setelah sinkron terakhir (`jurnalSyncInfo`), plus tombol pintas.
- [ ] Kelola akun: "Lupa password" (`resetPasswordForEmail`) dan ganti password (`updateUser`) di kartu Sinkron; pesan bila konfirmasi email diperlukan. Jangan simpan password di localStorage.

**P2**
- [ ] Pindahkan/duplikasi mata uang (`jurnalHeroCurrency`), zona waktu (`jurnalTzOffset`), dan format tanggal ke Setelan ("Preferensi"); kontrol header/hero tetap sebagai pintasan, satu sumber kebenaran.
- [ ] Kelompokkan Setelan dengan sub-navigasi/akordeon (Tampilan · Trading · Data · Akun · Tentang): Data = Ekspor + Impor + Reset; Akun = Sinkron.
- [ ] Ekspor/impor pengaturan (`jurnalDayLimits`, `jurnalBigLossPct`, tema/skema/aksen, mata uang, zona waktu): opsi "Sertakan pengaturan" atau berkas terpisah; sinkron ke tabel `pengaturan` bila diinginkan.
- [ ] Bersihkan penamaan: "Hapus data tersimpan" → "Reset ke bawaan"/"Hapus semua data di perangkat ini" dengan ringkasan yang terhapus; catatan GMT+8 di label Batas harian.
- [ ] Ukuran lot/kontrak & parameter akun (nilai pip, ukuran kontrak) dan default risiko kalkulator (`mm.risk` 1%, `sl` 150 pips) sebagai isian (kini tertanam di `DATA.dashboard.mm`).
- [ ] Data & privasi: ringkasan penyimpanan (jumlah transaksi, ukuran localStorage, batas ±5 MB), "Ekspor lalu hapus riwayat lama", mode sembunyi angka default.

**P3**
- [ ] Tentang: tautan README/panduan, info PWA terpasang (Instal aplikasi), "Periksa pembaruan" (paksa `sw.js` update + muat ulang), tanggal build.
- [ ] Bahasa & format angka (Indonesia/Inggris), ukuran font (kecil/normal/besar).
- [ ] Notifikasi pengingat isi catatan psikologi atau batas harian (izin Notification; PWA saja).

**Tema (sisa)**
- [ ] Skema rilis 2: Midnight Biru, Ungu Senja, Kertas Putih (tiap skema = blok gelap + terang + entri `SCHEMES`; `--paper-faint`, `--gold-dim`, `--line`, `--line-soft` diturunkan, jadi cukup 7 warna):

| Skema | `--ink` | `--ink-raised` | `--paper` | `--paper-dim` | Aksen (`--gold`) | `--gain` | `--loss` |
|---|---|---|---|---|---|---|---|
| **Midnight Biru** (abu-biru gelap ala terminal; mirip Blue Ocean, boleh dibuang bila dobel) | #0F1720 | #16212D | #E4EAF1 | #8FA0B3 | #5AA9E6 | #5FBF8F | #E0705F |
| **Ungu Senja** (lembut untuk sesi panjang) | #17131F | #1F1A2B | #ECE8F5 | #9D95B0 | #B392F0 | #7BC49A | #E07A8B |
| **Kertas Putih** (terang, siang hari/cetak layar) | #FAFAF8 | #F0EFEA | #1F1E1B | #5E5C55 | #8A5F12 | #2F7A45 | #A8402B |

### 3. Laporan
- [ ] Distribusi pips (L14 baru untuk PNL).

### 4. Optimalisasi (audit kode v1.1.131)
Ukuran gzip: `app.js` 270 KB → ±79 KB, `style.css` 68 KB → ±14 KB, `index.html` 70 KB → ±13 KB. `app.js` memuat 11 `location.reload()` dan merender semua tab saat dibuka (mis. `renderLap2()` ±baris 1809).

**P1**
- [ ] Muat supabase-js hanya saat perlu (dinamis saat Setelan → Sinkron dibuka atau sesi tersimpan ada); versi sudah dikunci `@2.45.4` tapi masih sinkron di `index.html`. Cek `sync.js` tidak memanggil `supabase` sebelum siap.
- [ ] Banner "Versi baru siap, muat ulang" untuk service worker cache-dulu (memakai `CACHE`).
- [ ] Render tab secara malas: Laporan (heatmap, drawdown, silang psikologi, bandingkan) dihitung saat halaman dibuka walau tersembunyi; render saat tab dibuka (atau `requestIdleCallback`) dan ulang hanya bila data/filter berubah. Awas Drawdown (L7): lebar > 0 dan urutan skrip `CS`/`DTP`.
- [ ] Opsional: host sendiri font (Fraunces, IBM Plex Mono) sebagai `woff2` subset Latin + tambah ke `SHELL` di `sw.js` (offline penuh, tanpa dependensi luar).

**P2**
- [ ] Kurangi `location.reload()` setelah simpan/hapus/impor (11 tempat): render ulang komponen terdampak saja. Prasyarat: `allTrades` (kini `const`) jadi sumber tunggal yang bisa dihitung ulang (`recomputeAll()` + `renderAll()`).
- [ ] Virtualisasi/render bertahap buku transaksi (kini `innerHTML` dibangun ulang tiap `renderTrades()`); tinjau bila data > ±2.000 transaksi.
- [ ] Memo hitung ulang berat (`computeLapDD`, `eqDrawdownAllTime`, agregat Laporan) per kunci (versi `DATA` + filter); ukur dulu dengan `performance.measure` (v1.1.81: muat ±175 ms, `renderLap2` 12 ms, 439 transaksi).
- [ ] Pisah `app.js` per tab (ES module/beberapa berkas) bila `app.js` > ±400 KB; minify hanya build produksi terpisah, sumber tetap terbaca.
- [ ] `Content-Security-Policy` di `vercel.json` (self, jsDelivr, Google Fonts, `*.supabase.co`; perlu `unsafe-inline` selama ada skrip inline di `<head>`/`journal-data`, atau pindahkan ke berkas). Wajib uji browser.

**P3**
- [ ] Ubah `journal-data` (fallback kosong sejak v1.1.15) jadi berkas kecil atau hapus (dipakai `buildFullHtmlString`; lihat Setelan P1).
- [ ] Satu handler global `keydown` Escape yang menutup modal teratas (kini dipasang per modal di banyak IIFE).
- [ ] Lighthouse (mobile, throttling 4G) sebelum/sesudah; catat LCP/TBT di file ini.

### 5. Verifikasi manual
Cek ulang cetak PDF data asli (terakhir v1.1.83; baru diuji di Chromium; cek margin box nomor halaman), cetak per skema, tooltip kurva ekuitas (termasuk "Kustom…") dan grafik Tren (garis & bar), heatmap, blok sesi pasar dan KPI Max DD % dengan data asli, data kosong, mode terang dan Otomatis di perangkat asli, tampilan aksen custom di grafik/heatmap, kartu HP Transaksi (mode terang, mode Pilih), sinkron ke Supabase asli (termasuk kolom `catatan`), pembaruan PWA terpasang (Android/iOS), font tanpa kedip setelah v1.1.132.

### 6. Ide lanjutan (opsional)
- **Impor CSV:** pratinjau baris, pilihan zona waktu, impor deposit, opsi perbarui transaksi ber-ID sama. **Indikator sinkron** di Ringkasan (lihat Ringkasan P3).
- **Ukuran:** total sumber ±535 KB (v1.1.131: `app.js` ±270 KB, `style.css` ±68 KB, `index.html` ±70 KB; `CHANGELOG.md` tidak dimuat aplikasi). Minify hemat ±30–40% tapi menyulitkan edit; bila perlu, buat build minified terpisah. Tinjau ulang bila `app.js` > ~400 KB.
