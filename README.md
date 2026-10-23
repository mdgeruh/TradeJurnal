# Jurnal Trading XAUUSD

**Live:** https://trade-jurnal-eight.vercel.app/

Dashboard jurnal trading akun **cent XAUUSD**. Satu folder datar tanpa build tool (`index.html`, `style.css`, `app.js`, `kalender.js`, `sync.js`, `config.js`, `pwa.js`, `sw.js`). Data tersimpan di **localStorage** browser; sinkron ke Supabase bersifat opsional. Sumber daya eksternal: Google Fonts (Fraunces, IBM Plex Mono; tidak menahan tampilan, ada font cadangan) dan supabase-js `@2.45.4` dari jsDelivr (dimuat saat dibutuhkan). Service worker menampilkan aplikasi dari cache lebih dulu lalu memperbaruinya di latar.

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

1. **Ringkasan:** indikator sinkron cloud di header (hanya bila sudah masuk), hero (saldo; PNL Hari Ini/7H/30H/Minggu Ini/Bulan Ini; status batas harian; tombol 👁 menyamarkan angka PNL), chip periode 7H · 1B · 3B · 1T · All · Sesuaikan (bawaan All, berdiri sendiri per tab), kurva **Ekuitas / PNL kumulatif** (garis modal dan puncak berjalan, pita drawdown, lencana **DD saat ini**, tooltip, legenda yang bisa diketuk), stat strip 9 kartu (Transaksi, Win Rate, Laba/Rugi, PF, Max DD, Expectancy, Streak, Rata² menang/rugi + RR), kartu ajakan mengisi catatan psikologi, kartu **Transaksi terakhir** (5 transaksi terbaru: hasil, emosi, trigger; ketuk untuk detail), dan kartu **Aturan trading** (checklist pribadi, tambah cepat atau Edit, maks. 12, centang direset tiap hari) di atas kutipan acak.
2. **Analisis PNL:** statistik rentang bergulir dan kalender PNL harian (ketuk tanggal untuk detail).
3a. **Kalender** (`kalender.js`, v1.1.167): jadwal rilis data AS dan keputusan Fed (array `EVENTS`, waktu UTC; tanggal perlu dicek ulang ke BLS/BEA/Fed), hitung mundur ke event dampak tinggi berikutnya, filter dampak/rentang/sudah lewat, zona waktu (WITA/WIB/WIT/broker/UTC/New York; awalnya mengikuti zona waktu Setelan), isian Prakiraan/Sebelumnya/Aktual (bawaan `f`/`p` di `EVENTS`, bisa ditimpa pengguna), event buatan sendiri. Terhubung ke jurnal lewat `window.KAL` (kartu Ringkasan, peringatan jendela berita ±15 mnt di Kalkulator lot dan Transaksi baru, baris Dekat rilis di detail transaksi, Laporan → Lanjutan "Saat rilis berita" ±30 mnt; hanya transaksi dalam rentang jadwal bawaan yang dinilai). Id/kelas berawalan `kal`; kunci localStorage `kal-prefs`, `kal-manual`, `kal-notes` (belum ikut ekspor pengaturan).
3. **Performa** (ambang win rate dan target bulanan diatur di Setelan → Target performa): bulanan (terbaru dulu, penilaian Sangat Baik/Waspada/Perlu Evaluasi) dan mingguan ISO, dihitung dari transaksi (`computePerf()`; per bulan juga PF, rata-rata, drawdown, hari terbaik/terburuk, selisih vs bulan lalu, tag Terbaik/Terburuk; daftar mingguan; ketuk bulan/minggu untuk melihat transaksinya), rekor menang/rugi, donut Split arah Beli vs Jual.
4. **Laporan:** lihat bagian di bawah.
5. **Transaksi:** buku transaksi dengan pencarian (ID posisi, catatan), filter (Arah, Hasil, Catatan psikologi, Emosi, Trigger, Jenis entry, Sesi, tanggal, lot), chip cepat, kolom Waktu buka dan Durasi, ringkasan hasil filter, isi massal lewat tombol **Pilih**, **Batalkan hapus** (30 menit), ekspor dan **impor CSV** (hanya menambah; ID yang ada dilewati; ada konfirmasi). Ketuk baris untuk detail (lihat, edit, hapus, ‹ ›). Di < 720px tampil sebagai kartu dengan menu Urutkan. Tiap transaksi punya **catatan psikologi** (trigger, emosi, jenis entry; antrean "Simpan & lanjut") dan **catatan bebas** (ikon ✎). Tombol **Kalkulator lot** membuka modal risiko %, stop loss, R:R → lot dan target sesuai saldo.
6. **Deposit:** log deposit, penarikan, kompensasi margin call; ringkasan modal bersih.

## Setelan (⚙)
Dikelompokkan dengan sub-navigasi di atas:
- **Tampilan:** mode Gelap / Terang / Otomatis; 8 skema warna (Emas Klasik, Blue Ocean, Teal Green, Grafit Netral, Kontras Tinggi, Midnight Biru, Ungu Senja, Kertas Putih); warna aksen per mode (ditolak bila kontras rendah atau mirip warna untung/rugi); untung biru / rugi oranye (ramah buta warna); **Atur ulang tampilan**. **Preferensi:** mata uang, zona waktu, format tanggal (tabel transaksi dan deposit), **Angka PNL saat dibuka** (Tampil / Tersembunyi).
- **Trading:** **Kurs** (Rp per USD); **Batas harian** (maks rugi dan maks transaksi); **Buku transaksi** (ambang garis merah "rugi besar", 1–50%); **Kalkulator lot** (nilai pip per lot, bawaan 10¢; risiko 1%, stop loss 150 pips, R:R 1,5).
- **Data:** ekspor HTML mandiri atau JSON (status cadangan di sini), **Data mentah per periode (.json)** (rentang cepat atau tanggal GMT+8; ringkasan dihitung ulang untuk rentang itu, ada `periode_ekspor` dengan saldo awal; bukan cadangan penuh), impor JSON (konfirmasi sebelum menimpa), **Penyimpanan & pengaturan** (ringkasan ruang localStorage, ekspor/impor pengaturan), **Hapus semua data di perangkat ini** (auto-backup JSON dulu).
- **Akun:** Sinkron Supabase (tombol Masuk membuka halaman login; Ganti password, Sinkronkan ke cloud, Pulihkan dari cloud, Keluar).
- **Tentang:** versi aplikasi (satu-satunya tempat versi tampil), tanggal build, **Periksa pembaruan**, status **Aplikasi terpasang** dengan tombol **Instal aplikasi** (browser yang mendukung), dan **Lihat riwayat** (riwayat perubahan berbahasa pengguna, terbaru di atas).

## Multi-akun (v1.1.191–192)
Tombol akun di header membuka daftar akun trading (Cent, USD standar, Rupiah). Tiap akun punya transaksi, deposit, dan kurs sendiri di browser; berganti akun memuat ulang halaman. Akun pertama ("Akun utama") adalah data yang sudah ada. Tambah, ubah nama, dan hapus lewat tombol itu atau Setelan → Akun. Satuan mengikuti jenis akun (v1.1.192): Cent memakai lot ×100 dan laba ¢; USD standar memakai lot apa adanya dan laba $; Rupiah memakai laba Rp (dikonversi dengan kurs akun). Impor riwayat broker memilih simbol sesuai jenis akun (XAUUSDc untuk Cent). **Total gabungan (v1.1.193):** bila ada dua akun atau lebih, menu akun menawarkan "Σ Total gabungan": semua akun dijumlahkan dalam USD di seluruh tab, hanya baca. Sinkron Supabase per akun (v1.1.194): tiap akun dikirim dan dipulihkan sendiri.

## Laporan
- **Sub-tab:** Tren · Ringkasan · Psikologi · Bandingkan · Lanjutan (di bawah bar periode, gaya sama dengan Setelan). Periode & filter berlaku untuk semuanya dan bisa dilipat (ringkasannya tetap terlihat; pilihan diingat); cetak/PDF memuat semua bagian.
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
| `jurnalEqMode`, `jurnalHideNum`, `jurnalFontSize`, `jurnalSidebar`, `jurnalLapFilterOpen` | localStorage | Kurva Ringkasan (`equity`/`pnl`), angka PNL tersembunyi (`1`), ukuran tampilan (`kecil`/`besar`; normal = tanpa kunci), filter Laporan dilipat (`0`), sidebar (`collapsed`/`expanded`) |
| `jurnalDayLimits`, `jurnalBigLossPct` | localStorage | Batas harian; ambang garis merah rugi besar (%) |
| `jurnalRules`, `jurnalRulesDone` | localStorage | Aturan trading pribadi (ikut Ekspor pengaturan); centang harian `{d,n,i}` (tidak ikut ekspor) |
| `jurnalGateSkip` | localStorage | `1` = memilih "Lanjut tanpa masuk"; dihapus saat Keluar |
| `jurnalBackupInfo`, `jurnalLastChange`, `jurnalSyncInfo` | localStorage | Cadangan dan sinkron terakhir, perubahan terakhir (untuk pengingat cadangan) |
| `jurnalUndoDelete` | localStorage | Transaksi yang baru dihapus untuk "Batalkan hapus" (30 menit) |
| `jurnalPendingTab`, `jurnalSetelanGroup`, `jurnalLaporanGroup`, `jurnalFillOpen`, `jurnalFillQueue`, `jurnalLedgerState`, `jurnalBackupNudgeHide`, `jurnalNotifyPending` | sessionStorage | Tab tujuan setelah muat ulang, kelompok Setelan, antrean "Simpan & lanjut", filter/urutan/gulir buku transaksi, "Nanti" pengingat cadangan, notifikasi setelah reload |

Hanya `jurnalXauusdData_v1` yang ikut ekspor JSON dan sinkron; kunci pengaturan lain ikut **Ekspor pengaturan** (tema, skema, aksen, mata uang, zona waktu, format tanggal, kurva, angka PNL, ukuran tampilan, batas harian, garis merah, sidebar, aturan trading).

## Sinkron Supabase
> Banyak akun (v1.1.194): proyek yang sudah ada menjalankan `migrasi-multi-akun.sql` sekali (data lama menjadi akun `utama`); instalasi baru cukup `schema.sql`. Tanpa migrasi, hanya Akun utama yang bisa disinkronkan.
1. Jalankan `schema.sql` sekali di Supabase → SQL Editor; aktifkan Auth email (Authentication → Providers). Bila proyek dibuat sebelum v1.1.129, jalankan juga `migrasi-catatan.sql` (kolom `catatan`).
2. `config.js` berisi URL proyek dan kunci publishable. Jangan memakai kunci service_role.
3. Agar tautan reset password kembali ke aplikasi: Authentication → URL Configuration, tambahkan alamat aplikasi ke **Redirect URLs** dan set **Site URL**.
4. Masuk lewat layar login (atau tombol Masuk di Setelan → Akun), lalu **Sinkronkan ke cloud** (cloud disamakan dengan browser) atau **Pulihkan dari cloud** (menimpa browser; cadangan JSON otomatis). Waktu sinkron/pemulihan terakhir tampil di bawah tiap tombol. Password tidak disimpan di browser.
5. Yang disinkron: transaksi, deposit/penarikan, kurs. Pengaturan dan parameter kalkulator tetap lokal.
6. `query-user-supabase.sql`: query admin (buat akun login, daftar user, ringkasan performa, cek anomali, cek RLS, reset password); jalankan per blok.

## Pasang sebagai aplikasi (PWA)
Butuh https (Vercel sudah otomatis). Android: Chrome → ⋮ → **Instal aplikasi**. iOS: Safari → Bagikan → **Tambah ke Layar Utama**. Data aplikasi terpasang terpisah dari browser: masuk lalu **Pulihkan dari cloud**. Versi baru terbaca saat aplikasi dibuka lagi; banner **Versi baru siap** menawarkan Muat ulang.

## Rute halaman
Tiap tab punya tautan hash: `#ringkasan`, `#analisis`, `#performa`, `#laporan`, `#transaksi`, `#deposit`, `#kalender`, `#setelan`; sub-tab Laporan dan Setelan memakai `#laporan-<tren|ringkasan|psikologi|bandingkan|lanjutan>` dan `#setelan-<tampilan|trading|data|akun|tentang>`. Tombol Kembali/Maju browser berpindah antar tab, dan judul tab browser mengikuti halaman. Router ada di akhir `app.js` (bagian "Rute halaman").

## Alur rilis
1. Naikkan `APP_VERSION` dan `APP_BUILD_DATE` (`app.js`), `V` (`sw.js`; `CACHE` mengikuti), dan semua `?v=` di `index.html` (css/js lokal) ke nomor yang sama. Ketiganya harus kembar: `?v=` menjaga halaman dan berkas tidak tercampur versi di cache service worker.
2. Tambah butir di `USER_CHANGELOG` (`app.js`): tanggal ISO, bahasa pengguna tanpa istilah teknis atau nomor versi; tanggal yang sama digabung (tampilan diurutkan otomatis).
3. Tambah entri teknis di `CHANGELOG.md` dan butir yang sama di `release_note.md` (ganti baris **Versi saat ini**).
4. Perbarui `SUMMARY.md` (status, jebakan bug), `roadmap.md` (selesai/todo), dan `README.md` bila fitur berubah. Perubahan dokumen saja tidak menaikkan versi.
5. Uji dengan Playwright + Chromium (390/768/1280px; data kosong dan data sintetis ±445 transaksi); interaksi kompleks hanya bila ada dugaan bug.

## Chart XAUUSD (v1.1.173)
Kartu **Chart XAUUSD** di tab Ringkasan memuat widget gratis TradingView (`OANDA:XAUUSD`, H4) dari `s3.tradingview.com` hanya saat tombol Tampilkan ditekan. Butuh internet; tidak di-cache service worker. Tema dan zona waktu mengikuti Setelan. Tidak tampil di pratinjau artifact karena CSP sandbox.

## Detail dan Edit Transaksi (v1.1.189)
Ketuk baris transaksi: tampilan detail dua kolom (tombol tutup X ada di baris tombol bawah, v1.1.190) (laba menonjol, durasi, catatan psikologi). **Edit** memakai tata letak yang sama dengan modal Tambah, dengan pratinjau hasil langsung; **Enter** pindah isian, **Ctrl+Enter** simpan. Perubahan yang belum disimpan tidak tertutup oleh ketukan di luar; X/Batal meminta konfirmasi. Waktu tutup tidak boleh lebih awal dari waktu buka.

## Modal Tambah Transaksi (v1.1.188)
Tombol **+** → Transaksi. Isian dua kolom dengan **pratinjau langsung** (laba, pips, menang/rugi, durasi) dan peringatan (harga jauh dari transaksi terakhir, waktu tutup lebih awal dari waktu buka, ID sudah ada). Arah, lot, trigger entry dan jenis entry diisi dari transaksi manual terakhir (**Kosongkan** untuk menghapus). **Simpan & tambah lagi** membuka form berikutnya; **Enter** pindah isian, **Ctrl+Enter** simpan. Form yang sudah diisi tidak tertutup oleh ketukan di luar; Batal/Esc meminta konfirmasi.

## Event dampak sedang (v1.1.187)
Setelan → Trading → **Event yang dihitung**: *Dampak tinggi saja* (bawaan) atau *Tinggi + sedang*. Disimpan di `jurnalNewsImp`; berlaku untuk Laporan, filter Berita, dan rincian transaksi.

## Jendela rilis berita (v1.1.186)
Setelan → Trading → **Jendela rilis berita**: pilih ±15, ±30 (bawaan) atau ±60 menit. Berlaku untuk Laporan (Saat rilis), filter Berita dan penanda rilis di rincian transaksi; disimpan di `jurnalNewsWin` dan ikut ekspor/impor setelan.

## Transaksi: filter Berita (v1.1.185)
Filter **Berita** di bar filter Transaksi: *Dekat rilis (±30 mnt)* menampilkan transaksi yang dibuka dalam 30 menit dari event dampak tinggi; *Di luar rilis* sisanya. Hanya transaksi dalam rentang jadwal bawaan Kalender (2 Okt–30 Des 2026) yang dinilai; di luar itu tidak muncul di kedua pilihan.

## Performa: heatmap harian setahun (v1.1.184)
Bagian **Heatmap harian** di tab Performa: satu kotak per hari, kolom per minggu (Senin di atas). Hijau untung, merah rugi, abu-abu terang impas; makin pekat makin besar dibanding hari terbesar tahun itu. Pilih tahun, ketuk kotak untuk daftar transaksi hari itu, arahkan kursor untuk nilai. Mengikuti filter arah dan sesi. Ringkasan di atasnya: hari trading, hari untung, total.

## Performa: garis target pada batang bulanan (v1.1.183)
Bila **Target bulanan** diatur (Setelan → Trading → Target performa), tiap batang bulanan punya garis putih: target % dikali saldo sebelum bulan itu. Batang yang melewati garis berarti target tercapai (sama dengan label "Target tercapai"). Panjang batang tetap relatif terhadap bulan terbesar, jadi pada saldo besar garis berada dekat sisi kanan; arahkan kursor ke garis untuk nilainya. Ringkasan mingguan menyebut minggu terbaik dan terburuk.

## Kalender: tampilan Mingguan (v1.1.182)
Di tab Kalender, pilih **Tampilan: Daftar / Mingguan**. Mingguan menampilkan grid Senin sampai Jumat menurut zona waktu terpilih; garis kiri tiap event berwarna sesuai dampak (merah tinggi, emas sedang, abu rendah). Panah berpindah minggu, **Minggu ini** kembali ke minggu berjalan, ketuk event untuk rincian dan isian Prakiraan/Sebelumnya/Aktual. Event akhir pekan hanya tampil di Daftar. Pilihan tampilan diingat.

## Kalender: impor dan ekspor jadwal (v1.1.181)
Tab Kalender → **Impor dan ekspor jadwal**. Ekspor menyimpan semua event (bawaan dan buatan sendiri) dengan Prakiraan/Sebelumnya/Aktual ke `jurnal-xauusd-kalender-<tanggal>.json`. Impor menerima berkas yang sama formatnya, atau larik event:
```json
{ "app":"jurnal-xauusd", "type":"kalender", "events":[
  { "id":"ecb-2026-10", "t":"2026-10-29T12:15:00Z", "cur":"EUR", "name":"Keputusan Suku Bunga ECB", "impact":3, "status":"ok", "f":"2,00%", "p":"2,00%" } ] }
```
`t` dalam UTC, `impact` 1–3, `status` `ok` atau `est`. ID baru ditambahkan, ID yang sudah ada (impor sebelumnya) diperbarui, ID event bawaan dilewati. Event impor tersimpan di browser (`kal-manual`) dan bisa dihapus dari detail event.

## Performa mingguan: rentang dan rata-rata (v1.1.180)
Di bagian Performa mingguan pilih **12 minggu / 26 minggu / Semua**. Batang menampilkan garis putus-putus rata-rata per minggu, dengan ringkasan rata-rata dan jumlah minggu untung. Daftar mingguan mengikuti rentang, dan semuanya mengikuti filter arah/sesi. Pilihan diingat dan ikut ekspor pengaturan.

## Efek kaca (v1.1.217)
Setelan → Tampilan → Efek kaca: sakelar `jurnalGlass` (`html[data-glass="1"]`) yang bisa dipakai dengan semua skema warna; gradasi latar mengikuti aksen palet. Kaca Senja otomatis berkaca bila belum pernah memilih. Tes: `tglass.js`.

## Skema Kaca Senja (v1.1.216)
Setelan → Tampilan → Kaca Senja: kartu kaca buram (`backdrop-filter`) di atas gradasi hangat, sidebar melayang, varian gelap dan terang; fallback padat bila blur tidak didukung atau `prefers-reduced-transparency`. Tes: `tkaca.js`.

## Notifikasi pengingat (v1.1.215)
Setelan → Pengingat: berita dampak Tinggi 15 menit sebelum rilis, batas harian tercapai, catatan psikologi belum diisi. Mati bawaan, butuh izin notifikasi, berjalan saat aplikasi terbuka (tanpa server push). Tes: `tnotif.js`.

## Format angka (v1.1.214)
Setelan → Preferensi → Format angka: Indonesia (1.234,56) atau Internasional (1,234.56). Kunci `jurnalNumFmt`; teks UI tetap Indonesia. Tes: `tnumfmt.js`.

## Kinerja angka (v1.1.213)
Pemformat angka (`fmtCent`, `fmtPct`, `fmtRp`) memakai `Intl.NumberFormat` ter-cache (`nf`). Membuka 8.000 transaksi ±120 ms lebih cepat. Tes: `tfmt.js`.

## Performa mingguan: sumbu dan nilai (v1.1.212)
Sumbu-Y tetap (+maks, 0, -maks) dengan garis bantu, dan angka ringkas di ujung batang (semua sampai 12 minggu, selebihnya terbaik/terburuk). Tes: `tperf6.js`.

## Kalender: non-USD dan reaksi emas (v1.1.211)
Event ECB, BoE, BoJ (Okt–Des 2026, impak Sedang; jam BoJ perkiraan) serta catatan reaksi emas per event (Naik/Turun/Datar + catatan ≤ 60 huruf, disimpan di `kal-notes`). Tes: `tkal6.js`.

## Arsipkan riwayat lama (v1.1.210)
Setelan → Data → Arsipkan riwayat lama: pilih tanggal, unduh berkas arsip, lalu transaksi sampai tanggal itu dihapus. Baris deposit bertipe `Arsip` (PNL bersih yang diarsipkan) menjaga saldo dan kurva ekuitas; modal bersih tidak berubah. Pulihkan lewat berkas arsip atau Urungkan. Tes: `tarsip.js`.

## Lampiran gambar chart (v1.1.209)
Detail Transaksi → Lampiran chart: tambah gambar atau tempel dengan Ctrl+V (maks 4 per transaksi, dikompres JPEG ≤ 1280 px). Disimpan di IndexedDB perangkat (`jurnalFoto`), tidak ikut sinkron/ekspor JSON/HTML. Tes: `tfoto.js`.

## Pratinjau impor broker (v1.1.208)
Setelan → Data → Cocokkan dengan broker: setelah memilih file MT5, jendela pratinjau menampilkan tab Baru, Berbeda, Sama, dan Bermasalah; tiap posisi baru/koreksi bisa dicentang, lalu Terapkan terpilih (cadangan otomatis, bisa diurungkan). Tes: `tbroker.js`.

## Deep link periode dan filter (v1.1.207)
Hash menerima query, mis. `#laporan-tren?p=bulanan&o=-1&arah=Beli` (p: harian/mingguan/bulanan/3bulan/1tahun/all, o: offset ≤ 0, arah, sesi) dan `#transaksi?hasil=loss&emosi=Takut&dari=2026-10-01&sampai=2026-10-31&q=teks` (juga cat, trig, jenis, setup, lg, sesi, berita, lmin, lmax). URL diperbarui otomatis saat filter diganti. Tes: `tdeeplink2.js`.

## Sinkron pengaturan (v1.1.206)
Pengaturan trading (aturan, batas harian, opsi kustom, target, jendela berita, dll.) ikut Kirim/Ambil lewat kolom `pengaturan.setelan`. Pengaturan tampilan (tema, warna, huruf, sidebar) tetap per perangkat. Jalankan `migrasi-pengaturan.sql` sekali; sebelum itu sinkron tetap berhasil. Tes: `tsetelan.js`.

## Pelanggaran aturan trading (v1.1.205)
Field `langgar` (array teks aturan dari kartu Aturan trading) dipilih lewat chip di form tambah/edit; tampil di detail, filter Transaksi (Melanggar/Patuh), CSV (kolom 'Aturan dilanggar') dan Laporan (blok Pelanggaran aturan trading + aturan paling sering dilanggar). Cloud: jalankan `migrasi-aturan.sql` sekali (kolom `langgar text`); sebelum itu sinkron tetap berhasil. Tes: `tlangg.js`.

## Setup / strategi per transaksi (v1.1.204)
Field `setup` (CRT H4, CRT H4 + RSI divergence, RSI divergence, Tanpa setup, plus opsi kustom di Setelan → Trading → Opsi trigger, exit, dan setup) dan centang `konfirmasi` pada form tambah/edit; tampil di detail, filter Transaksi, isi massal, CSV, dan Laporan (blok Setup / strategi dan Konfirmasi setup). Cloud: jalankan `migrasi-setup.sql` sekali (menambah kolom `setup`, `konfirmasi`); sebelum itu sinkron tetap berhasil tanpa kolom tersebut. Tes: `tsetup.js`.

## Performa: Ringkasan mingguan (v1.1.202)
Bagian teratas tab Performa: tinjauan satu minggu ISO (panah ◀ ▶) berisi PNL, transaksi, win rate, PF dibanding minggu sebelumnya, emosi dan trigger paling merugikan (≥ 2 transaksi), kepatuhan batas harian, dan tiga pertanyaan refleksi (catatan lokal di `jurnalWeekRefl`). Tes: `tweekrev.js`.

## Performa: kartu Split arah (v1.1.200)
Donut Beli vs Jual kini disertai **tabel perbandingan** (transaksi, laba, win rate, PF, expectancy, rata² menang/rugi, untung/rugi terbesar, lot rata²) dengan sisi yang lebih baik ditandai ▲, **kesimpulan otomatis** (perlu ≥ 20 transaksi per arah), chip rentang **Semua / Tahun ini / 90 hari / 30 hari** (`jurnalSplitRange`), mengikuti filter sesi dan psikologi Performa. Ketuk judul kolom untuk daftar transaksi. Tes: `tsplit2.js`.

## Performa: heatmap jam × hari (v1.1.199)
Bagian **Jam & hari buka** di tab Performa: heatmap 7 hari × 12 bin 2 jam (waktu buka, GMT+8) dengan metrik PNL / Expectancy / Win rate / Jumlah, dari transaksi yang lolos filter Performa. Ketuk sel untuk ringkasan dan daftar transaksi. Memakai penggambar bersama `drawHeatGrid` (sama dengan Laporan). Tes: `tperf5.js`.

## Performa: banding dua periode dan rincian per akun (v1.1.198)
**Bandingkan dua periode** di tab Performa memakai tabel yang sama dengan Laporan (`cmpBuild`), pilihan periode tanpa "Kustom", disaring oleh filter Performa; pilihan tersimpan di `jurnalPerfCmpA/B`. Di tampilan **Total**, bagian **Rincian per akun** menampilkan transaksi, laba, win rate, PF, dan Max DD tiap akun. Tes: `tperf4.js`.

## Performa: filter psikologi dan metrik risiko (v1.1.197)
Baris ketiga filter Performa: **Emosi / Trigger entry / Jenis entry** (pilihan "Belum dicatat" menyaring transaksi tanpa catatan). Bisa digabung dengan arah dan sesi, tersimpan di `jurnalPerfEmosi`, `jurnalPerfTrigger`, `jurnalPerfJenis`. Blok **Metrik risiko** di bawahnya (`perfRiskData()`): risk:reward aktual, win rate impas = 1/(1+R:R), expectancy per transaksi, rugi terbesar (dan % dari saldo sebelum transaksi itu), serta persentase entri setelah rugi dengan lot ≥ 1,25× lot sebelumnya. Tes: `tperf3.js`.

## Performa: filter sesi (v1.1.179)
Baris kedua filter Performa: **Semua sesi / Asia / London / New York** (menurut waktu buka, GMT+8; batas sesi sama dengan Laporan). Bisa digabung dengan filter arah. Transaksi tanpa waktu buka tidak ikut saat sesi dipilih.

## Performa: filter arah (v1.1.178)
Di atas tab Performa, pilih **Semua arah / Beli / Jual**. Kartu bulanan dan daftar mingguan dihitung ulang untuk arah itu (WR, profit factor, drawdown, penilaian); % thd saldo tetap memakai saldo seluruh akun. Pilihan diingat dan ikut ekspor pengaturan.

## Kalender: Perlu dicek, Aktual vs Prakiraan, ekspor pengaturan (v1.1.177)
Event Perkiraan yang kurang dari 7 hari lagi diberi penanda **Perlu dicek**. Bila Prakiraan dan Aktual berupa angka, muncul panah ▲/▼/= (hanya arah angka). **Ekspor pengaturan** kini memuat event kalender buatan sendiri, isian angka, preferensi kalender, dan opsi trigger/exit kustom.

## Performa: Beli vs Jual (v1.1.176)
Kartu bulanan dan daftar mingguan di tab Performa memuat baris pecahan arah: jumlah transaksi, win rate, dan P/L untuk Beli dan Jual. Kartu "Split arah" untuk seluruh data tetap ada.

## Rekonsiliasi dengan broker (v1.1.175)
Setelan → Data → **Cocokkan dengan broker**.
- **Impor riwayat:** pilih file *Trading activity* MT5 (.xlsx atau .csv, bukan .xls). Hanya XAUUSDc (akun cent). Aplikasi menggabungkan penutupan bertahap per ID, membandingkan dengan jurnal, lalu menampilkan pratinjau: **Terapkan semua** atau **Hanya yang baru**. Trade baru belum punya trigger/emosi.
- **Cek saldo:** isi saldo MT5; hasilnya cocok atau selisih dengan kemungkinan penyebab.
- **Periksa data:** ID dobel, tutup sebelum buka, GMT+8 tak sesuai, tanda laba janggal (ketuk ID untuk detail). Tidak bisa mendeteksi kesalahan jam yang konsisten di semua baris; itu hanya terlihat lewat impor broker.
- **Urungkan impor terakhir:** cadangan otomatis sebelum impor broker/JSON/CSV (`jurnalUndoSnapshot`).
- **Penutupan bertahap manual:** ID sama + arah sama → konfirmasi gabung; detail menampilkan "Bertahap (n bagian)".
- **Opsi kustom:** Setelan → Trading → Opsi trigger dan exit; FVG tersedia; "ABC" disamakan dengan "ABC (Asal Biru Close)".
- **Laporan:** kartu perbandingan emosi (Tenang/Percaya diri vs lainnya).

## Impor JSON: Gabungkan atau Timpa (v1.1.174)
Setelan → Data → Impor menawarkan **Gabungkan** (transaksi baru ditambahkan, ID sama diperbarui, data lain dipertahankan) atau **Timpa semua** (mengganti seluruh data aktif). Untuk file ekspor per periode gunakan Gabungkan.
