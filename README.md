# Jurnal Trading XAUUSD

**Live:** https://trade-jurnal-eight.vercel.app/

Dashboard jurnal trading akun **cent XAUUSD**: satu folder datar (`index.html`, `style.css`, `app.js`, `sync.js`, `config.js`), tanpa build tool. Sinkron opsional ke Supabase. Data tersimpan di **localStorage** browser. Satu-satunya sumber daya eksternal adalah Google Fonts (Fraunces, IBM Plex Mono); saat offline tampilan memakai font cadangan.

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

1. **Ringkasan:** kartu hero (saldo, PNL Kumulatif/Hari Ini/7H/30H, status batas harian di bawah PNL Hari Ini bila batas diisi di Setelan, tombol 👁 untuk menyembunyikan angka), pemilih periode (default All Time), kurva ekuitas dengan lencana **DD saat ini** (dari puncak, basis All Time) dan garis **puncak berjalan** putus-putus, stat strip (Transaksi, Win Rate, Laba/Rugi, PF, Max DD, Expectancy), serta kartu **ajakan catatan psikologi** (jumlah transaksi belum dicatat + tombol "Isi sekarang" yang membuka alur "Simpan & lanjut", tersembunyi bila semua sudah dicatat).
2. **Analisis PNL:** statistik rentang bergulir (7H–1T/Sesuaikan) dan kalender PNL Harian (klik tanggal untuk detail).
3. **Performa:** bulanan & mingguan, rekor menang/rugi terbesar, donut Split arah Beli vs Jual.
4. **Laporan:** lihat bagian berikut.
5. **Transaksi:** buku transaksi (cari ID posisi; filter Arah/Hasil/Catatan psikologi/tanggal/lot; ekspor CSV). Klik baris untuk detail (lihat, edit, hapus); "Simpan & lanjut" mengisi catatan psikologi berurutan. Tombol **Kalkulator lot** (kanan atas tabel) membuka modal kalkulator money management: risiko per trade (%), stop loss (pips), R:R → lot & target sesuai saldo terkini (tutup lewat Tutup, ketuk latar, atau Esc).
6. **Deposit:** log deposit, penarikan, kompensasi margin call; ringkasan modal bersih.

**Setelan** (⚙): batas harian pribadi (maks rugi & maks transaksi per hari), sinkron Supabase, ekspor HTML/JSON, impor JSON (konfirmasi sebelum menimpa), Reset ke Bawaan (auto-backup JSON dulu), dan **Tentang aplikasi**: versi aplikasi serta tombol **Lihat riwayat** untuk membuka daftar perubahan berbahasa awam, diurutkan dari tanggal terbaru.

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
| `jurnalTheme` | localStorage | Tema terang/gelap |
| `jurnalTzOffset` | localStorage | Zona waktu tampilan |
| `jurnalSidebar` | localStorage | Sidebar desktop: `collapsed` / `expanded` |
| `jurnalPendingTab`, `jurnalFillOpen` | sessionStorage | Tab tujuan setelah muat ulang; antrean "Simpan & lanjut" |

## Arsitektur singkat
- Satu file `.html`, CSS & JS inline. Data bawaan di `<script id="journal-data">`, data aktif di localStorage.
- Kurva SVG digambar manual (monotone cubic Hermite); dropdown, date-time picker, dan filter memakai komponen kustom yang bisa dioperasikan keyboard.

## File terkait
`CHANGELOG.md` (riwayat teknis per rilis), `SUMMARY.md` (status, jebakan bug, todo), `schema.sql` (skema Supabase), `query-user-supabase.sql` (query admin Supabase). Riwayat versi untuk pengguna ada di aplikasi (`USER_CHANGELOG` di `app.js`).

## Sinkron Supabase (v1.1.105)
1. Jalankan `schema.sql` sekali di Supabase → SQL Editor. Aktifkan Auth email (Authentication → Providers).
2. `config.js` berisi URL proyek dan kunci publishable. Jangan pernah memakai kunci service_role.
3. Setelan (⚙) → Sinkron Supabase: Daftar/Masuk, lalu **Sinkronkan ke cloud** (cloud disamakan dengan browser) atau **Pulihkan dari cloud** (menimpa browser, cadangan JSON otomatis). Tanggal & jam sinkron/pemulihan terakhir tampil di bawah tiap tombol (waktu perangkat; disimpan di localStorage `jurnalSyncInfo`, per browser, tidak ikut ekspor JSON).
4. Yang disinkron: transaksi, deposit/penarikan, kurs. `jurnalDayLimits` tetap lokal.
5. `query-user-supabase.sql` (v1.1.116–117): kumpulan query admin untuk Supabase → SQL Editor — buat akun login (ganti email/password di placeholder), daftar user, ringkasan performa, cek anomali, cek RLS, reset password. Jalankan per blok.

## Pasang sebagai aplikasi (PWA, v1.1.106)
Butuh alamat https (Vercel sudah otomatis). Android: Chrome → menu ⋮ → **Instal aplikasi**. iOS: Safari → Bagikan → **Tambah ke Layar Utama**. Data aplikasi terpasang terpisah dari browser; masuk lalu **Ambil dari awan**. Naikkan `CACHE` di `sw.js` bila ingin memaksa cache lama dibuang.

## Alur rilis
Naikkan `APP_VERSION` (`app.js`) dan `CACHE` (`sw.js`), tambah entri `USER_CHANGELOG` (`app.js`, bahasa pengguna) dan `CHANGELOG.md` (teknis), lalu perbarui `README.md`/`SUMMARY.md` bila fitur atau status berubah.
