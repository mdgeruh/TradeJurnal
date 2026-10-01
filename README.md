# Jurnal Trading XAUUSD

**Live:** https://trade-jurnal-eight.vercel.app/

Dashboard jurnal trading akun **cent XAUUSD**. Satu folder datar tanpa build tool (`index.html`, `style.css`, `app.js`, `sync.js`, `config.js`, `pwa.js`, `sw.js`). Data tersimpan di **localStorage** browser; sinkron ke Supabase bersifat opsional. Sumber daya eksternal: Google Fonts (Fraunces, IBM Plex Mono; tidak menahan tampilan, ada font cadangan) dan supabase-js `@2.45.4` dari jsDelivr (dimuat saat dibutuhkan). Service worker menampilkan aplikasi dari cache lebih dulu lalu memperbaruinya di latar.

Dokumen lain: `release_note.md` (catatan rilis pengguna), `roadmap.md` (rencana dan todo), `SUMMARY.md` (status, arsitektur, jebakan bug), `CHANGELOG.md` (riwayat teknis).

## Cara pakai
1. Buka `index.html` di browser (dobel klik atau `file://`); semua file tetap satu folder.
2. **Masuk atau lanjut lokal.** Tanpa sesi, layar login tampil: Masuk / Daftar / Lupa password, atau **Lanjut tanpa masuk** (jurnal berjalan lokal; pilihan diingat sampai **Keluar** di Setelan → Akun).
3. **Isi data.** File baru kosong: Setelan → Data → **Impor** JSON hasil ekspor, atau Setelan → Akun → **Pulihkan dari cloud**. Lalu isi Setelan → Trading → **Kurs** (selama 0, mode Rp dan "≈ Rp" tampil Rp 0).
4. **Cadangkan** lewat Setelan → Data → Ekspor (HTML/JSON) atau sinkron cloud. Bila belum pernah, lebih dari 7 hari, atau ada perubahan sesudahnya, kartu pengingat muncul di Ringkasan (**Ekspor JSON** / **Nanti**; Nanti berlaku selama sesi).

## Konsep dasar
- **Akun cent:** 1 USD = 100¢. Nominal internal dalam sen; kurs Rupiah di `DATA.kurs`.
- **Mata uang tampilan:** USD / USC (¢) / Rp, berlaku di semua tab (Kalkulator lot dan ekspor tetap ¢). USD/USC menampilkan sub-baris `≈ Rp …`. Mengganti memuat ulang tampilan. Bawaan USD.
- **Zona waktu:** periode (Hari Ini, kalender, Laporan) selalu GMT+8; pilihan zona waktu hanya mengubah tampilan jam.
- **Arah & Pips:** Arah = arah entry sebenarnya; Pips bertanda +/- mengikuti laba/rugi.

## Tab
Navigasi: ≥ 1100px sidebar kiri yang bisa diciutkan; 721–1099px tab horizontal; ≤ 720px bottom nav. Tombol **+** (FAB) menambah transaksi, deposit, atau penarikan manual; semua agregat dihitung ulang dari data mentah.

1. **Ringkasan:** hero (saldo; PNL Hari Ini/7H/30H/Minggu Ini/Bulan Ini; status batas harian; tombol 👁 menyamarkan angka PNL), chip periode 7H · 1B · 3B · 1T · All · Sesuaikan (bawaan All, berdiri sendiri per tab), kurva **Ekuitas / PNL kumulatif** (garis modal dan puncak berjalan, pita drawdown, lencana **DD saat ini**, tooltip, legenda yang bisa diketuk), stat strip 9 kartu (Transaksi, Win Rate, Laba/Rugi, PF, Max DD, Expectancy, Streak, Rata² menang/rugi + RR), kartu ajakan mengisi catatan psikologi, dan kartu **Transaksi terakhir** (5 transaksi terbaru: hasil, emosi, trigger; ketuk untuk detail).
2. **Analisis PNL:** statistik rentang bergulir dan kalender PNL harian (ketuk tanggal untuk detail).
3. **Performa:** bulanan dan mingguan, rekor menang/rugi, donut Split arah Beli vs Jual.
4. **Laporan:** lihat bagian di bawah.
5. **Transaksi:** buku transaksi dengan pencarian (ID posisi, catatan), filter (Arah, Hasil, Catatan psikologi, Emosi, Trigger, Jenis entry, Sesi, tanggal, lot), chip cepat, kolom Waktu buka dan Durasi, ringkasan hasil filter, isi massal lewat tombol **Pilih**, **Batalkan hapus** (30 menit), ekspor dan **impor CSV** (hanya menambah; ID yang ada dilewati; ada konfirmasi). Ketuk baris untuk detail (lihat, edit, hapus, ‹ ›). Di < 720px tampil sebagai kartu dengan menu Urutkan. Tiap transaksi punya **catatan psikologi** (trigger, emosi, jenis entry; antrean "Simpan & lanjut") dan **catatan bebas** (ikon ✎). Tombol **Kalkulator lot** membuka modal risiko %, stop loss, R:R → lot dan target sesuai saldo.
6. **Deposit:** log deposit, penarikan, kompensasi margin call; ringkasan modal bersih.

## Setelan (⚙)
Dikelompokkan dengan sub-navigasi di atas:
- **Tampilan:** mode Gelap / Terang / Otomatis; 8 skema warna (Emas Klasik, Blue Ocean, Teal Green, Grafit Netral, Kontras Tinggi, Midnight Biru, Ungu Senja, Kertas Putih); warna aksen per mode (ditolak bila kontras rendah atau mirip warna untung/rugi); untung biru / rugi oranye (ramah buta warna); **Atur ulang tampilan**. **Preferensi:** mata uang, zona waktu, format tanggal (tabel transaksi dan deposit), **Angka PNL saat dibuka** (Tampil / Tersembunyi).
- **Trading:** **Kurs** (Rp per USD); **Batas harian** (maks rugi dan maks transaksi); **Buku transaksi** (ambang garis merah "rugi besar", 1–50%); **Kalkulator lot** (nilai pip per lot, bawaan 10¢; risiko 1%, stop loss 150 pips, R:R 1,5).
- **Data:** ekspor HTML mandiri atau JSON (status cadangan di sini), impor JSON (konfirmasi sebelum menimpa), **Penyimpanan & pengaturan** (ringkasan ruang localStorage, ekspor/impor pengaturan), **Hapus semua data di perangkat ini** (auto-backup JSON dulu).
- **Akun:** Sinkron Supabase (Masuk/Daftar, Lupa/Ganti password, Sinkronkan ke cloud, Pulihkan dari cloud, Keluar).
- **Tentang:** versi aplikasi (satu-satunya tempat versi tampil), tanggal build, **Periksa pembaruan**, status **Aplikasi terpasang** dengan tombol **Instal aplikasi** (browser yang mendukung), dan **Lihat riwayat** (riwayat perubahan berbahasa pengguna, terbaru di atas).

## Laporan
- **Periode & filter:** navigator Harian / Mingguan / Bulanan / 3 Bulan / 1 Tahun / **All Time (bawaan)**. Filter Arah, Sesi (Asia / London / New York menurut jam buka), Emosi, Trigger entry, Jenis entry (tiap filter punya "Belum dicatat"); digabung (AND).
- **Bandingkan dua periode:** independen dari periode utama (berbagi filter). Sisi A/B dari preset atau tanggal kustom; KPI berdampingan + selisih.
- **Tren & ringkasan:** KPI (Laba bersih, Win rate, PF, Max DD nominal + %) dengan ▲/▼ vs periode sebelumnya (tidak ada di All Time); grafik Tren (bar/garis + tabel); Expectancy, rata-rata menang/kalah, RR.
- **Analisis psikologi:** Trigger Entry/Exit, Emosi, Jenis Entry (urut PNL, Expectancy, cakupan catatan).
- **Analisis lanjutan:** temuan otomatis, streak, tren rolling (30/50 transaksi), Beli vs Jual, distribusi hasil (PNL atau Pips; median, P10/P90, ketergantungan pada 10% transaksi terbaik), emosi setelah rugi, silang psikologi (tampil bila ≥ 30% transaksi punya catatan), heatmap jam × hari, sesi pasar, durasi posisi, lot dan ukuran posisi, transaksi per hari dan batas harian, drawdown underwater, return % dan Max DD %.
- **Interaksi & cetak:** sel dan baris kelompok bisa diketuk untuk daftar transaksinya (sel n kecil ditandai). Cetak/PDF memakai layout A4 khusus.

## Penyimpanan
| Key | Tempat | Isi |
|---|---|---|
| `jurnalXauusdData_v1` | localStorage | Data aktif (transaksi, deposit, agregat, kurs, parameter kalkulator) |
| `jurnalTheme`, `jurnalScheme`, `jurnalAccent`, `jurnalCB` | localStorage | Mode (`dark`/`light`/`auto`), skema, aksen per mode `{d:[gold,dim], l:[gold,dim]}`, buta warna (`1`) |
| `jurnalHeroCurrency`, `jurnalTzOffset`, `jurnalDateFmt` | localStorage | Mata uang, zona waktu, format tanggal (`teks`/`angka`) |
| `jurnalEqMode`, `jurnalHideNum`, `jurnalSidebar` | localStorage | Kurva Ringkasan (`equity`/`pnl`), angka PNL tersembunyi (`1`), sidebar (`collapsed`/`expanded`) |
| `jurnalDayLimits`, `jurnalBigLossPct` | localStorage | Batas harian; ambang garis merah rugi besar (%) |
| `jurnalGateSkip` | localStorage | `1` = memilih "Lanjut tanpa masuk"; dihapus saat Keluar |
| `jurnalBackupInfo`, `jurnalLastChange`, `jurnalSyncInfo` | localStorage | Cadangan dan sinkron terakhir, perubahan terakhir (untuk pengingat cadangan) |
| `jurnalUndoDelete` | localStorage | Transaksi yang baru dihapus untuk "Batalkan hapus" (30 menit) |
| `jurnalPendingTab`, `jurnalSetelanGroup`, `jurnalFillOpen`, `jurnalFillQueue`, `jurnalLedgerState`, `jurnalBackupNudgeHide`, `jurnalNotifyPending` | sessionStorage | Tab tujuan setelah muat ulang, kelompok Setelan, antrean "Simpan & lanjut", filter/urutan/gulir buku transaksi, "Nanti" pengingat cadangan, notifikasi setelah reload |

Hanya `jurnalXauusdData_v1` yang ikut ekspor JSON dan sinkron; kunci pengaturan lain ikut **Ekspor pengaturan** (tema, skema, aksen, mata uang, zona waktu, format tanggal, kurva, angka PNL, batas harian, garis merah, sidebar).

## Sinkron Supabase
1. Jalankan `schema.sql` sekali di Supabase → SQL Editor; aktifkan Auth email (Authentication → Providers). Bila proyek dibuat sebelum v1.1.129, jalankan juga `migrasi-catatan.sql` (kolom `catatan`).
2. `config.js` berisi URL proyek dan kunci publishable. Jangan memakai kunci service_role.
3. Agar tautan reset password kembali ke aplikasi: Authentication → URL Configuration, tambahkan alamat aplikasi ke **Redirect URLs** dan set **Site URL**.
4. Masuk lewat layar login atau Setelan → Akun, lalu **Sinkronkan ke cloud** (cloud disamakan dengan browser) atau **Pulihkan dari cloud** (menimpa browser; cadangan JSON otomatis). Waktu sinkron/pemulihan terakhir tampil di bawah tiap tombol. Password tidak disimpan di browser.
5. Yang disinkron: transaksi, deposit/penarikan, kurs. Pengaturan dan parameter kalkulator tetap lokal.
6. `query-user-supabase.sql`: query admin (buat akun login, daftar user, ringkasan performa, cek anomali, cek RLS, reset password); jalankan per blok.

## Pasang sebagai aplikasi (PWA)
Butuh https (Vercel sudah otomatis). Android: Chrome → ⋮ → **Instal aplikasi**. iOS: Safari → Bagikan → **Tambah ke Layar Utama**. Data aplikasi terpasang terpisah dari browser: masuk lalu **Pulihkan dari cloud**. Versi baru terbaca saat aplikasi dibuka lagi; banner **Versi baru siap** menawarkan Muat ulang.

## Alur rilis
1. Naikkan `APP_VERSION` dan `APP_BUILD_DATE` (`app.js`) dan `CACHE` (`sw.js`) ke nomor yang sama.
2. Tambah butir di `USER_CHANGELOG` (`app.js`): tanggal ISO, bahasa pengguna tanpa istilah teknis atau nomor versi; tanggal yang sama digabung (tampilan diurutkan otomatis).
3. Tambah entri teknis di `CHANGELOG.md` dan butir yang sama di `release_note.md` (ganti baris **Versi saat ini**).
4. Perbarui `SUMMARY.md` (status, jebakan bug), `roadmap.md` (selesai/todo), dan `README.md` bila fitur berubah. Perubahan dokumen saja tidak menaikkan versi.
5. Uji dengan Playwright + Chromium (390/768/1280px; data kosong dan data sintetis ±445 transaksi); interaksi kompleks hanya bila ada dugaan bug.
