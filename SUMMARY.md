# Ringkasan Proyek — Jurnal XAUUSD

Status, arsitektur, dan jebakan bug. Rencana dan todo ada di `roadmap.md`; fitur dan cara pakai di `README.md`; riwayat di `CHANGELOG.md` (teknis) dan `release_note.md` (pengguna).

## Apa ini
Dashboard trading journal (folder datar, tanpa build tool) untuk akun cent XAUUSD. Tab: Ringkasan, Analisis PNL, Performa, Laporan, Transaksi, Deposit + Setelan (⚙, 5 kelompok). Kalkulator lot berupa modal dari tombol di tab Transaksi. File: `index.html`, `style.css`, `app.js` (±300 KB), `sync.js`, `config.js`, `pwa.js`, `sw.js`; Supabase: `schema.sql`, `query-user-supabase.sql`, `migrasi-catatan.sql`.

## Status (v1.1.158)
- **Fitur lengkap:** semua yang ada di `README.md` berjalan; tidak ada bug fungsional terbuka. Rilis terakhir: v1.1.158 indikator sinkron cloud, v1.1.157 tambah cepat Aturan trading, v1.1.156 tombol Pilih file dan kotak centang kustom, v1.1.155 kutipan tetap tampil, v1.1.154 kartu Aturan trading di Ringkasan, v1.1.153 Periode & filter Laporan bisa dilipat, v1.1.152 sub-tab Laporan, v1.1.151 perbaikan render awal buku Transaksi, v1.1.150 Setelan → Akun cukup tombol Masuk ke halaman login, v1.1.149 kartu Transaksi terakhir di Ringkasan, v1.1.148 perbaikan Keluar dan tab Setelan bergaya garis bawah+ikon, v1.1.147 Setelan → Tentang (tanggal build, Periksa pembaruan, Instal aplikasi), v1.1.146 halaman login (`#loginGate`), v1.1.145 parameter Kalkulator lot dan angka PNL tersembunyi saat dibuka, v1.1.144 sub-navigasi Setelan, v1.1.143 Penyimpanan & pengaturan.
- **Pengujian:** Playwright/Chromium (390/1280px, data sintetis, Supabase tiruan, service worker asli di localhost) untuk rilis 1.1.133–1.1.158. **Belum diuji:** Supabase asli, perangkat asli (sentuhan, PWA, sidebar, mode Otomatis/terang, cetak per skema). Daftar cek ada di `roadmap.md` → Verifikasi dulu.
- **Perlu tindakan manual:** (a) tambahkan alamat aplikasi ke Supabase → Authentication → URL Configuration → **Redirect URLs** (dan Site URL) agar tautan reset password kembali ke aplikasi; (b) jalankan `migrasi-catatan.sql` sekali di SQL Editor (tanpa itu sinkron tetap jalan, tetapi catatan tidak ikut ke cloud dan aplikasi menampilkan peringatan).
- **Data:** aktif di localStorage (`jurnalXauusdData_v1`), bukan di berkas. File baru kosong (`kurs` = 0, mode Rp tampil Rp 0) sampai JSON diimpor atau kurs diisi di Setelan → Trading → Kurs.

## Arsitektur singkat
- Folder datar; fallback data di `<script id="journal-data">`, data aktif di localStorage. Nominal internal dalam sen (¢); tampilan lewat `fmtMoney`, estimasi rupiah lewat `approxRp()`.
- Sumber daya eksternal: Google Fonts (non-blocking; font cadangan saat offline) dan supabase-js `@2.45.4` dari jsDelivr (dimuat malas oleh `sync.js`: Setelan dibuka, sesi tersimpan, token di URL, atau halaman login tampil). Service worker cache-dulu (stale-while-revalidate); respons Supabase tidak di-cache.
- Periode ("Hari Ini", kalender, Laporan) berpatokan GMT+8 tetap; pilihan zona waktu hanya mengubah tampilan jam. `tanggal` = broker GMT+3; `tanggal_gmt8`/`waktu_buka` = GMT+8.
- Ekspor/impor lewat Setelan → Data (HTML dan JSON); impor menimpa data aktif dengan konfirmasi. Tabel key penyimpanan ada di `README.md`.
- Kurva ekuitas di-crop sesuai periode; sebelum data ada → seluruh riwayat, setelah transaksi terakhir → garis datar di saldo terakhir.
- Tiap `<section>` jadi kartu; tooltip grafik lewat `ChartHover`; warna grafik memakai `var(--…)` agar ikut tema/cetak.
- `period_ranges`/`periods` (selain "All Time") hanya snapshot fallback; halaman menghitung live dari `DATA.trades`.

## Rawan bug
- **Render awal Transaksi (v1.1.151):** `renderTrades()` harus dipanggil eksplisit di akhir skrip (setelah CS/DTP siap); tanpa itu `#ledgerBody` kosong sampai ada filter/sortir. Setiap tes rilis wajib memeriksa jumlah baris tab Transaksi setelah reload (`ttx.js`).
- **Kontrol bawaan browser (v1.1.156):** input berkas dan kotak centang tidak boleh tampil bawaan; pakai `.file-hidden` + tombol `.ledger-reset-btn` untuk berkas dan `appearance:none` untuk centang. Elemen asli tetap di DOM (dipicu lewat `.click()`).
- **Sub-tab Laporan (v1.1.152):** section baru di `#tabpanel-laporan` harus diberi `data-lgroup`; yang tidak punya akan tampil di semua tab. Grafik di tab tersembunyi lebarnya 0 sampai `ResizeObserver` menggambar ulang; cetak memaksa semua kelompok tampil (`.sg-off[data-lgroup]` di `@media print`).
**Umum**
- **Alur rilis:** lihat `README.md` → Alur rilis (`APP_VERSION` dan `CACHE` selalu naik bersama; `USER_CHANGELOG`, `CHANGELOG.md`, `release_note.md`, lalu dokumen status).
- **Ekspor HTML mandiri (v1.1.135):** `buildFullHtmlString()` mengambil `index.html` asli lewat `fetch` (tidak jalan dari `file://`), meng-inline `style.css`/`config.js`/`app.js`/`sync.js`, dan membuang `pwa.js` + manifest. Berkas baru yang dimuat `index.html` harus ikut dipertimbangkan di sini. Escape `</script` dan `</` (data) wajib dipertahankan.
- **Pengingat cadangan (v1.1.135):** `saveActiveData(data, silent)` menulis `jurnalLastChange` kecuali `silent`; simpan otomatis saat muat (`saveActiveData(DATA, true)`) jangan diubah, kalau tidak pengingat selalu menyala. Penanda cadangan baru harus memanggil `markBackup(kind)` atau menulis `jurnalSyncInfo` + event `jurnalBackupChanged`.
- **Akun Supabase (v1.1.135):** `PASSWORD_RECOVERY` diproses di `sync.js` (`recoveryMode()`); jangan `await` di dalam `onAuthStateChange`. Password tidak boleh masuk localStorage/`DATA`. Alur yang memfokuskan elemen Setelan harus memanggil `showSetelanGroup()` dulu; section Setelan baru wajib ber-`data-sgroup`.
- **Rilis dan Tentang (v1.1.147):** `APP_BUILD_DATE` (app.js) ikut diganti tiap rilis bersama `APP_VERSION` dan `CACHE`. `beforeinstallprompt` harus ditangkap di `pwa.js` (event muncul sebelum Setelan dibuka); ekspor HTML mandiri membuang `pwa.js`, jadi di sana Periksa pembaruan menjawab "tidak tersedia".
- **Halaman login (v1.1.146):** kelas `gate-on` di `<html>` diputuskan di skrip `<head>` (tanpa sesi `sb-*-auth-token`, bukan tautan reset, belum `jurnalGateSkip`); `sync.js` yang mencabutnya (login berhasil, Lanjut tanpa masuk, Supabase tak terpasang/tak terjangkau). Tautan reset password tidak boleh memunculkan halaman login (`recoveryUrl` dibaca sebelum supabase-js membersihkan URL). Aplikasi harus tetap bisa dipakai tanpa login (offline-first). Keluar menghapus `jurnalGateSkip`. Keluar memakai `signOut({scope:'local'})` + cek `getSession()` (signOut global bisa gagal offline); `.fab-wrap` harus `pointer-events:none` agar tidak menutup tombol di pojok kanan bawah. Tombol Masuk/Lupa password nonaktif sampai library siap (`gateBusy(false)`).
- **Urutan skrip:** modul `CS`/`DTP` harus didefinisikan sebelum render awal yang memakainya (blank page v1.1.64).
- **Field turunan:** semua field hasil hitung dari `DATA.trades` harus ikut `recomputeAll()`.
- **Parameter kalkulator (v1.1.145):** `mm.pipval/risk/sl/tp_pips` adalah isian pengguna, bukan field turunan: jangan ditimpa di `recomputeAll()` (hanya `mm.equity`). Baca lewat `calcParams()` (nilai aman bila kosong/0), bukan `mm.*` langsung.
- **Format nominal:** tanda minus di depan simbol (`-$x`, `-Rp x`); pakai `fmtMoney`/`fmtRp`, jangan tulis `'Rp ' + n` sendiri.
- **Setelan lokal:** `jurnalDayLimits`, `jurnalBigLossPct`, tema/skema/aksen, `jurnalHideNum`, dst. sengaja tidak ikut `DATA`/ekspor JSON (kunci baru yang boleh diekspor harus masuk `SETTINGS_VALIDATORS`); ubah ekspor hati-hati agar impor lama tetap kompatibel. Id elemen Setelan dipakai `app.js` dan `sync.js`. Format tanggal (`jurnalDateFmt`) hanya berlaku di `fmtDate`/`fmtDateTime` (tabel transaksi dan deposit), belum kalender/Laporan.
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
- **Kurva ekuitas Ringkasan:** skala Y/area jangan mengubah skala garis puncak; struktur `#chartBox` > `.eq-plot` (svg + tooltip + label) + `.eq-legend`; tooltip berada di strip `padding-top` `#chartBox`, jangan ubah `top`/padding tanpa cek 390px. Mode PNL kumulatif (`eqMode`, `DATA.pnl_kumulatif`) hanya menghitung `laba`, tanpa deposit/penarikan. Chip Transaksi memakai selektor `.ledger-quick-range .quick-chip` (jangan global: `.quick-chip` juga dipakai Setelan → Tampilan).
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
