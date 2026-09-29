# Jurnal Trading XAUUSD

**Live:** https://trade-jurnal-eight.vercel.app/

Dashboard jurnal trading akun **cent XAUUSD**: satu folder datar (`index.html`, `style.css`, `app.js`, `sync.js`, `config.js`), tanpa build tool. Sinkron opsional ke Supabase. Data tersimpan di **localStorage** browser. Sumber daya eksternal: Google Fonts (Fraunces, IBM Plex Mono; dimuat tanpa menahan tampilan, font cadangan saat offline) dan supabase-js `@2.45.4` dari jsDelivr untuk sinkron. Service worker menampilkan aplikasi dari cache lebih dulu lalu memperbaruinya di latar; versi baru terbaca saat aplikasi dibuka lagi.

## Cara pakai
1. Buka `index.html` di browser (dobel klik atau `file://`). Semua file harus tetap satu folder.
2. File baru kosong (data bawaan sengaja kosong sejak v1.1.15, `kurs` = 0 sehingga mode Rp tampil Rp 0): gear (⚙) → **Setelan → Impor data** dengan JSON hasil ekspor.
3. Cadangkan berkala lewat **Setelan → Ekspor data** (HTML atau JSON).

## Konsep dasar
- **Akun cent:** 1 USD = 100¢. Nominal internal dalam sen; kurs rupiah di `DATA.kurs`.
- **Mata uang tampilan:** pemilih USD / USC (¢) / Rp di kartu hero berlaku di semua tab (kecuali Kalkulator lot dan ekspor, tetap ¢). Mode USD/USC menampilkan sub-baris `≈ Rp …`. Ganti pilihan = muat ulang ke tab yang sama. Default USD.
- **Zona waktu:** periode (Hari Ini, kalender, Laporan) selalu GMT+8; dropdown zona waktu hanya mengubah tampilan jam.
- **Arah & Pips:** Arah = arah entry sebenarnya; Pips bertanda +/- mengikuti laba/rugi.

## Tab
Navigasi: layar ≥ 1100px memakai **sidebar kiri** yang bisa diciutkan (tombol bulat melayang di tepi sidebar); 721–1099px tab horizontal di atas; ≤ 720px bottom nav.

1. **Ringkasan:** kartu hero (saldo, PNL Kumulatif/Hari Ini/7H/30H, status batas harian di bawah PNL Hari Ini bila batas diisi di Setelan, tombol 👁 untuk menyembunyikan angka), chip periode 7H · 1B · 3B · 1T · All · Sesuaikan (default All; berdiri sendiri per tab), kurva ekuitas (sumbu Y berkelipatan bulat + satuan + garis nol, isian antara kurva dan modal, pita tipis drawdown terbesar di dasar, tooltip di atas plot yang hilang sendiri di layar sentuh, legenda 2 kolom yang bisa diketuk untuk sembunyikan modal/puncak atau sorot drawdown) dengan lencana **DD saat ini** (dari puncak, basis All Time) dan garis **puncak berjalan** putus-putus, stat strip (Transaksi, Win Rate, Laba/Rugi, PF, Max DD, Expectancy), serta kartu **ajakan catatan psikologi** (jumlah transaksi belum dicatat + tombol "Isi sekarang" yang membuka alur "Simpan & lanjut", tersembunyi bila semua sudah dicatat).
2. **Analisis PNL:** statistik rentang bergulir (7H–1T/Sesuaikan) dan kalender PNL Harian (klik tanggal untuk detail).
3. **Performa:** bulanan & mingguan, rekor menang/rugi terbesar, donut Split arah Beli vs Jual.
4. **Laporan:** lihat bagian berikut.
5. **Transaksi:** buku transaksi (cari ID posisi atau isi catatan bebas; filter Arah/Hasil/Catatan psikologi/Emosi/Trigger/Jenis entry/Sesi/tanggal/lot, chip cepat Hari Ini/Minggu Ini/7 Hari/30 Hari/Bulan Ini/Bulan Lalu, kolom Waktu buka & Durasi, tombol Pilih untuk isi massal emosi/trigger/jenis entry, ringkasan hasil filter, tombol Batalkan hapus (30 menit); ekspor dan **impor CSV** — impor hanya menambah transaksi baru, ID yang sudah ada dilewati, ada konfirmasi dulu). Klik baris untuk detail (lihat, edit, hapus; tombol ‹ › pindah ke transaksi sebelumnya/berikutnya); di layar < 720px daftar tampil sebagai kartu ringkas dengan menu Urutkan sendiri; tiap transaksi bisa diberi **catatan bebas** (ikon ✎ di sel ID, ikut dicari dan diekspor CSV); "Simpan & lanjut" mengisi catatan psikologi berurutan. Tombol **Kalkulator lot** (di baris judul, kanan) membuka modal kalkulator money management: risiko per trade (%), stop loss (pips), R:R → lot & target sesuai saldo terkini (tutup lewat Tutup, ketuk latar, atau Esc).
6. **Deposit:** log deposit, penarikan, kompensasi margin call; ringkasan modal bersih.

**Setelan** (⚙), berurutan dari atas:
- **Batas harian pribadi:** maks rugi & maks transaksi per hari.
- **Buku transaksi:** ambang garis merah "rugi besar" (1–50%, kosong = nonaktif).
- **Tampilan:** mode Gelap / Terang / Otomatis, 5 skema warna (Emas Klasik, Blue Ocean, Teal Green, Grafit Netral, Kontras Tinggi), warna aksen sendiri per mode (ditolak bila kontras rendah atau mirip warna untung/rugi), opsi untung biru / rugi oranye (ramah buta warna), dan tombol **Atur ulang tampilan**.
- **Sinkron Supabase**, **ekspor HTML/JSON**, **impor JSON** (konfirmasi sebelum menimpa), dan **Reset ke Bawaan** (auto-backup JSON dulu).
- **Tentang aplikasi** (paling bawah): **versi aplikasi** (mis. `v1.1.134`; satu-satunya tempat versi ditampilkan) dan tombol **Lihat riwayat** yang membuka jendela **Riwayat perubahan** berbahasa pengguna akhir (tanpa istilah teknis), dikelompokkan per tanggal dan diurutkan dari yang **terbaru**. Tutup lewat ✕, ketuk latar, atau Esc.

**Input manual:** tombol FAB (+) untuk Tambah Transaksi (arah, lot, harga, waktu, ID Posisi opsional, field psikologi), Deposit, atau Penarikan. Semua agregat dihitung ulang dari data mentah.

## Laporan
- **Periode & filter:** navigator Harian / Mingguan / Bulanan / 3 Bulan / 1 Tahun / **All Time (default)**. Filter: Arah, Sesi (Asia / London / New York menurut jam buka), Emosi, Trigger entry, Jenis entry (tiap filter punya "Belum dicatat"); semua digabung (AND).
- **Bandingkan dua periode:** independen dari periode utama di atas (tapi berbagi filter Arah/Sesi/Emosi/Trigger/Jenis). Dua sisi A/B: preset (Bulan ini/lalu, 7/30 hari terakhir/sebelumnya, Tahun ini, Paruh pertama/kedua riwayat) atau tanggal kustom. Tabel KPI berdampingan + selisih (warna ikut arah "lebih baik"), dengan catatan sampel kecil / periode berjalan.
- **Tren & ringkasan:** KPI (Laba bersih, Win rate, PF, Max DD nominal + %) dengan ▲/▼ vs periode sebelumnya (tidak ada di All Time); grafik Tren (bar untuk Harian/Mingguan, garis untuk lainnya, plus tabel angka); Expectancy, rata-rata menang/kalah, RR.
- **Analisis psikologi:** Trigger Entry/Exit, Emosi, Jenis Entry (urut PNL, dengan Expectancy dan cakupan catatan).
- **Analisis lanjutan:** temuan otomatis (aturan sederhana, fakta data bukan saran), streak, tren rolling (30/50 transaksi, dengan tooltip), Beli vs Jual (mengabaikan filter Arah), distribusi hasil (histogram PNL, median, P10/P90, ketergantungan pada 10% transaksi terbaik), emosi setelah rugi, silang psikologi (Emosi × Trigger atau Jenis entry × Sesi; tampil bila ≥ 30% transaksi punya catatan), heatmap jam × hari (PNL/WR/Expectancy/Jumlah), sesi pasar, durasi posisi, lot & ukuran posisi, transaksi per hari & batas harian, drawdown underwater (tooltip hover/ketuk), return % dan Max DD %.
- **Interaksi:** sel dan baris kelompok bisa diketuk untuk daftar transaksinya; sel n kecil ditandai.
- **Cetak / PDF:** layout A4 khusus (header periode, nomor halaman, grafik & heatmap terbaca hitam-putih).

## Penyimpanan
| Key | Tempat | Isi |
|---|---|---|
| `jurnalXauusdData_v1` | localStorage | Data aktif (transaksi, deposit, agregat) |
| `jurnalDayLimits` | localStorage | Batas harian; tidak ikut ekspor JSON |
| `jurnalHeroCurrency` | localStorage | Pilihan USD / USC / Rp |
| `jurnalTheme` | localStorage | Mode tampilan: `dark`/`light`/`auto` |
| `jurnalScheme` | localStorage | Skema warna (`emas`, `ocean`, `teal`, `grafit`, `kontras`) |
| `jurnalAccent` | localStorage | Aksen custom per mode: `{d:[gold,gold-dim], l:[gold,gold-dim]}` (opsional) |
| `jurnalCB` | localStorage | `1` = untung biru / rugi oranye (ramah buta warna) |
| `jurnalTzOffset` | localStorage | Zona waktu tampilan |
| `jurnalSidebar` | localStorage | Sidebar desktop: `collapsed` / `expanded` |
| `jurnalBigLossPct` | localStorage | Ambang garis merah rugi besar di Transaksi (%); tidak ikut ekspor |
| `jurnalUndoDelete` | localStorage | Transaksi yang baru dihapus untuk "Batalkan hapus" (30 menit); tidak ikut sinkron/ekspor |
| `jurnalSyncInfo` | localStorage | Waktu sinkron/pemulihan terakhir per browser |
| `jurnalPendingTab`, `jurnalFillOpen`, `jurnalLedgerState` | sessionStorage | Tab tujuan setelah muat ulang; antrean "Simpan & lanjut"; filter, urutan, dan gulir buku transaksi |

## Arsitektur singkat
- Folder datar tanpa build: `index.html` (markup), `style.css`, `app.js` (seluruh logika, termasuk `APP_VERSION` dan `USER_CHANGELOG`), `sync.js` (Supabase), `config.js`, `pwa.js`, `sw.js`. Data bawaan di `<script id="journal-data">`, data aktif di localStorage.
- Kurva SVG digambar manual (monotone cubic Hermite); dropdown, date-time picker, dan filter memakai komponen kustom yang bisa dioperasikan keyboard.

## File terkait
`CHANGELOG.md` (riwayat teknis per rilis), `SUMMARY.md` (status, jebakan bug, todo), `schema.sql` (skema Supabase), `migrasi-catatan.sql` (tambah kolom `catatan`; jalankan sekali bila proyek Supabase dibuat sebelum v1.1.129), `query-user-supabase.sql` (query admin Supabase). Riwayat versi untuk pengguna ada di aplikasi (Setelan → Tentang aplikasi → Lihat riwayat; datanya `USER_CHANGELOG` di `app.js`).

## Sinkron Supabase (v1.1.105)
1. Jalankan `schema.sql` sekali di Supabase → SQL Editor. Aktifkan Auth email (Authentication → Providers).
2. `config.js` berisi URL proyek dan kunci publishable. Jangan pernah memakai kunci service_role.
3. Setelan (⚙) → Sinkron Supabase: Daftar/Masuk, lalu **Sinkronkan ke cloud** (cloud disamakan dengan browser) atau **Pulihkan dari cloud** (menimpa browser, cadangan JSON otomatis). Tanggal & jam sinkron/pemulihan terakhir tampil di bawah tiap tombol (waktu perangkat; disimpan di localStorage `jurnalSyncInfo`, per browser, tidak ikut ekspor JSON).
4. Yang disinkron: transaksi, deposit/penarikan, kurs. `jurnalDayLimits` tetap lokal.
5. `query-user-supabase.sql` (v1.1.116–117): kumpulan query admin untuk Supabase → SQL Editor — buat akun login (ganti email/password di placeholder), daftar user, ringkasan performa, cek anomali, cek RLS, reset password. Jalankan per blok.

## Pasang sebagai aplikasi (PWA, v1.1.106)
Butuh alamat https (Vercel sudah otomatis). Android: Chrome → menu ⋮ → **Instal aplikasi**. iOS: Safari → Bagikan → **Tambah ke Layar Utama**. Data aplikasi terpasang terpisah dari browser; masuk lalu **Ambil dari awan**. Naikkan `CACHE` di `sw.js` bila ingin memaksa cache lama dibuang.

## Alur rilis
1. Naikkan `APP_VERSION` (`app.js`) dan `CACHE` (`sw.js`) ke nomor yang sama.
2. Tambah butir di `USER_CHANGELOG` (`app.js`): tanggal ISO `YYYY-MM-DD`, bahasa pengguna akhir tanpa istilah teknis atau nomor versi; tanggal yang sama digabung ke entri itu. Urutan array bebas, tampilan diurutkan otomatis dari tanggal terbaru.
3. Tambah entri teknis di `CHANGELOG.md`.
4. Perbarui `README.md`/`SUMMARY.md` bila fitur atau status berubah. Perubahan dokumen saja tidak menaikkan versi.
