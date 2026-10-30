# Roadmap — Jurnal XAUUSD

Satu-satunya daftar rencana dan todo proyek (dulu ada di `SUMMARY.md`). Prioritas: **P1** tinggi, **P2** sedang, **P3** rendah. Tidak ada tanggal tetap. Setiap butir yang mengubah kode mengikuti **Alur rilis** di `README.md`; saat selesai, hapus dari sini (centang bila perlu satu rilis), pindahkan tema barunya ke tabel "Sudah selesai", dan catat di `release_note.md` dan `CHANGELOG.md`. Jebakan bug tiap area ada di `SUMMARY.md`.

## Sudah selesai (v1.1.232)
- Perbaikan & peningkatan kurva ekuitas (10 saran) (v1.1.232).
- Optimalisasi kartu saldo akhir akun (lebih ringkas) (v1.1.231).
- Pembagian peran Performa (hasil per waktu) dan Laporan (analisis pola) (v1.1.230).
- Perbaikan sisa ponsel (Deposit ringkas, area sentuh, filter Kalender lipat, FAB, label Analisis) (v1.1.229).
- Rapikan pengulangan antarhalaman + alat seragamkan label catatan (v1.1.228).
- Tujuh upgrade Ringkasan (target, sesi, wawasan, heatmap, catatan harian, selisih periode, mode fokus) (v1.1.227).
- Kontrol bawaan browser diganti komponen kustom (form Kalender, Urutkan, Zona waktu Setelan) (v1.1.226).
- Pemilih tanggal di ponsel menjadi lembar bawah layar (bottom sheet) (v1.1.225).
- Perbaikan chip periode tertimpa kartu statistik dan -$0,00 pada Max DD (v1.1.224).
- Perbaikan popup tanggal dan daftar pilihan tertutup kartu kaca (v1.1.223).
- Batas rugi harian dalam persen saldo awal hari (v1.1.222).
- Ringkasan: kartu bisa diatur (sembunyikan, urutkan) dan urutan bawaan ponsel (v1.1.221).
- Ringkasan: transaksi terakhir lebih kaya, sparkline dan drawdown saat ini, kepatuhan aturan (v1.1.220).
- Grafik ekuitas: legenda ringkas, Fokus rentang sumbu-Y (v1.1.219).
- Ringkasan: kartu Hari ini, chip periode statistik, banner cadangan ramping, nol netral (v1.1.218).
- Efek kaca sebagai sakelar terpisah untuk semua palet warna (v1.1.217).
- Skema tampilan Kaca Senja (glass) gelap dan terang (v1.1.216).
- Notifikasi pengingat berita dampak tinggi, batas harian, dan catatan psikologi (v1.1.215).
- Format angka Indonesia/Internasional di Setelan (terjemahan teks UI belum) (v1.1.214).
- Kinerja: cache pemformat angka; diukur, memo dan render bertahap tidak diperlukan (v1.1.213).
- Performa mingguan: sumbu-Y tetap dan nilai di ujung batang (v1.1.212).
- Kalender: event ECB/BoE/BoJ dan catatan reaksi emas per event (v1.1.211).
- Arsipkan riwayat lama: ekspor lalu hapus dengan baris saldo awal (tipe Arsip) (v1.1.210).
- Lampiran gambar chart per transaksi (IndexedDB lokal) (v1.1.209).
- Impor laporan broker dengan pratinjau (centang per posisi, baris bermasalah) (v1.1.208).
- Deep link ke periode dan filter Laporan/Transaksi (query di hash) (v1.1.207).
- Sinkron pengaturan trading ke Supabase (jalankan migrasi-pengaturan.sql); roadmap Supabase asli ditandai selesai (v1.1.206).
- Pelanggaran aturan trading per transaksi + biaya melanggar aturan di Laporan (jalankan migrasi-aturan.sql di Supabase) (v1.1.205).
- Tag setup/strategi per transaksi dengan centang konfirmasi (jalankan migrasi-setup.sql di Supabase) (v1.1.204).
- Deep link ke transaksi (#transaksi-ID, tombol Salin tautan) (v1.1.203).
- Ringkasan mingguan otomatis di Performa; kalender Nov-Des (ISM, ritel, PDB, PCE) (v1.1.202).
- Perbaikan teks donut Split arah yang terpotong (v1.1.201).
- Kartu Split arah: tabel perbandingan, rentang, kesimpulan, filter Performa (v1.1.200).
- Performa: heatmap Jam & hari buka (v1.1.199). Semua tahapan perbaikan Performa (v1.1.197–199) selesai.
- Performa: Bandingkan dua periode dan Rincian per akun di Total (v1.1.198).
- Performa: filter Emosi/Trigger/Jenis entry dan blok Metrik risiko (v1.1.197).
- Detail Transaksi: tombol X di baris aksi bawah (v1.1.190).
- Detail dan Edit Transaksi disamakan dengan modal Tambah (v1.1.189): kisi dua kolom, pratinjau, durasi, pelindung isian.
- Optimalisasi modal Tambah Transaksi (v1.1.188): grid dua kolom, pratinjau hasil, peringatan, isian terakhir, simpan & tambah lagi, pelindung isian.
| Tema | Isi |
|---|---|
| Fondasi | Ringkasan (+ 5 transaksi terakhir, aturan trading pribadi, indikator sinkron cloud, Esc global), Performa, Deposit, Transaksi, input manual (+), data di localStorage, tanpa build tool |
| Analisis | Performa (metrik per bulan, daftar mingguan, ketuk untuk transaksi); Analisis PNL; Laporan L1–L18 (tren, psikologi, heatmap, sesi pasar, drawdown, distribusi PNL/Pips, bandingkan dua periode); cetak PDF A4 |
| Transaksi | Catatan psikologi dan bebas, filter lengkap, isi massal, impor/ekspor CSV, batalkan hapus, kartu HP |
| Tampilan | Gelap/Terang/Otomatis, 8 skema warna, aksen custom, mode buta warna, mata uang USD/USC/Rp, zona waktu, format tanggal |
| Data & akun | Ekspor JSON per periode (v1.1.162), halaman login (Masuk/Daftar/Lupa password/Lanjut tanpa masuk), sinkron Supabase manual, ganti password, status dan pengingat cadangan, ekspor HTML mandiri/JSON, ekspor-impor pengaturan, ringkasan penyimpanan |
| Setelan | Ukuran tampilan, sub-navigasi Setelan dan Laporan (5 tab, ikon + garis bawah, keyboard), Kurs, batas harian, Kalkulator lot, angka PNL tersembunyi, Tentang (tanggal build, Periksa pembaruan, status dan Instal aplikasi) |
| Performa & PWA | Service worker cache-dulu, supabase-js dimuat malas, banner versi baru, instal di Android/iOS |

## 1. Verifikasi dulu (P1)
Hampir semua fitur baru hanya diuji di Chromium dengan data sintetis dan Supabase tiruan. Sebelum menambah fitur besar:
- [x] **Supabase asli (dikonfirmasi pengguna, 23 Okt 2026):** halaman login (Daftar, Masuk, Keluar, sesi kedaluwarsa), sinkron termasuk kolom `catatan`, email reset password dan Redirect URLs, ganti password.
- [ ] **Perangkat asli (Android/iOS):** sentuhan, PWA terpasang (pembaruan, banner versi baru, Periksa pembaruan, tombol Instal aplikasi), sidebar, mode Otomatis dan terang, tooltip kurva ekuitas (termasuk "Kustom…") dan grafik Tren, kartu HP Transaksi (mode terang, mode Pilih), halaman login dengan keyboard layar.
- [ ] **Cetak PDF** data asli (terakhir v1.1.83; cek margin nomor halaman) dan cetak per skema; heatmap, blok sesi pasar, KPI Max DD % dengan data asli.
- [ ] Salinan HTML mandiri dibuka dari `file://` di perangkat asli; pengingat cadangan (mode terang, 1280px); aksen custom di grafik/heatmap; font tanpa kedip.
- [x] **Tindakan manual Supabase (dikonfirmasi pengguna, 23 Okt 2026):** daftarkan alamat aplikasi di **Redirect URLs** dan **Site URL**; jalankan `migrasi-catatan.sql` sekali (tanpa itu catatan tidak ikut ke cloud).

## 2a. Tahapan perbaikan Performa (P2, usulan 22 Okt 2026)
- [x] **v1.1.197** Filter emosi/trigger/jenis entry di Performa; blok Metrik risiko (R:R aktual, win rate impas, expectancy, rugi terbesar, lot naik setelah rugi). Kartu bulanan ternyata sudah lengkap (PF, rata² untung/rugi, DD, hari terbaik/terburuk).
- [x] **v1.1.198** Tabel rincian per akun di tampilan Total (laba, win rate, PF, drawdown per akun) + perbandingan dua periode di Performa (seperti Laporan).
- [x] **v1.1.199** Heatmap jam × hari di Performa (data sudah ada di Laporan → Lanjutan).

## 2. Berikutnya (P2)
**Rekonsiliasi dengan broker** (usulan 8 Okt 2026, setelah selisih saldo 23,05¢ karena 4 posisi ditutup bertahap dan beberapa jam meleset 5 jam; urutan prioritas)
- [x] **P1 #1 Impor riwayat broker (XLSX/CSV MT5 "Trading activity")** langsung di Setelan: gabung penutupan bertahap per ID, lewati ID yang sudah ada, jam otomatis broker → GMT+8, pratinjau selisih sebelum disimpan. (v1.1.175)
- [x] **P1 #2 Cek saldo terhadap broker:** isi saldo MT5, aplikasi menampilkan cocok/selisih dan kemungkinan penyebab. (v1.1.175)
- [x] **P1 #3 Penutupan bertahap (partial close) di entri manual:** ID sama digabung (lot dijumlah, harga tutup rata-rata berbobot), ada penanda di detail. (v1.1.175)
- [x] **P2 #4 Pemeriksaan data:** tanda jam tidak wajar (tutup sebelum buka, GMT+8 ≠ broker+5 jam, jam buka kosong), ID dobel, tanda laba tak sesuai arah/harga. (v1.1.175)
- [x] **P2 #5 Cadangan otomatis sebelum Gabungkan/Timpa/impor + tombol Urungkan impor terakhir.** (v1.1.175)
- [x] **P2 #6 Trigger FVG, opsi trigger/exit kustom di Setelan, dan "ABC" disamakan dengan "ABC (Asal Biru Close)" di laporan.** (v1.1.175)
- [x] **P2 #7 Laporan per setup dan emosi:** expectancy per trigger/emosi dan perbandingan (mis. Ragu-ragu vs lainnya). (v1.1.175)
- [ ] **P3 #8 Penanda entri/SL/TP di chart** (Lightweight Charts + sumber data harga sendiri; widget TradingView gratis tidak mendukung).
- [ ] **P3 #9 Kalender lanjutan:** lihat daftar di bagian Kalender ekonomi (ekspor `kal-*`, mingguan, aktual vs prakiraan).
- [x] **P3 #10 Rapikan tablet (±768 px):** angka kartu statistik dan teks "≈ Rp" terpotong; mode rapat baru aktif di bawah 720 px. (v1.1.175)
- [~] **P1 #11 Uji di perangkat dan Supabase sungguhan** (Supabase selesai; sisa perangkat asli) (lihat bagian 1).

**Data & akun**
- [x] **Ekspor lalu hapus riwayat lama (v1.1.210).** (Ekspor JSON per periode sudah ada sejak v1.1.162; tinggal langkah hapus.) Perlu rancangan: menghapus transaksi mengubah kurva ekuitas, saldo, Max DD, dan Laporan (opsi: diganti satu baris saldo awal).
3b. **Chart XAUUSD** (v1.1.173): kartu di Ringkasan (`#chartCard`) memuat widget TradingView Advanced Chart (`OANDA:XAUUSD`, H4) saat ditekan Tampilkan; tema dan zona waktu mengikuti Setelan; butuh internet; kunci `jurnalChartOpen`. Belum menggambar entri/SL/TP jurnal (opsi: Lightweight Charts + sumber data harga).
3c. **Impor JSON Gabungkan/Timpa** (v1.1.174): dialog impor menawarkan Gabungkan (per ID, tanpa menghapus; catatan lokal dipertahankan) atau Timpa semua. Berguna untuk file ekspor per periode.
- [x] **Sinkron pengaturan ke Supabase (v1.1.206):** parameter kalkulator dan pengaturan lain ke tabel `pengaturan` (kini hanya `kurs`; perlu kolom baru + migrasi).

**Optimalisasi** (audit v1.1.131; gzip: `app.js` ±79 KB, `style.css` ±14 KB, `index.html` ±13 KB; muat ±175 ms dengan 439 transaksi)
- [ ] (v1.1.213: sengaja ditunda; semua tab dibangun dari `DATA` saat dibuka, render ulang parsial berisiko tinggi tanpa manfaat terukur) Kurangi `location.reload()` setelah simpan/hapus/impor (±11 tempat): render ulang komponen terdampak. Prasyarat: `allTrades` (kini `const`) jadi sumber tunggal yang bisa dihitung ulang (`recomputeAll()` + `renderAll()`).
- [x] (diukur v1.1.213: tidak perlu, `renderTrades` ±20 ms dan ekuitas ±60 ms pada 8.000 transaksi; yang lambat adalah pemformat angka, sudah di-cache) Memo hitung ulang berat (`computeLapDD`, `eqDrawdownAllTime`, agregat Laporan) per kunci (versi `DATA` + filter); ukur dulu dengan `performance.measure`.
- [ ] `Content-Security-Policy` di `vercel.json` (self, jsDelivr, Google Fonts, `*.supabase.co`; perlu `unsafe-inline` selama ada skrip inline di `<head>`/`journal-data`, atau pindahkan ke berkas). Wajib uji browser.
- [x] (sudah bertahap lewat `ledgerLimit`/`LEDGER_STEP` "Tampilkan lagi"; v1.1.213 memverifikasi) Render bertahap buku transaksi (kini `innerHTML` dibangun ulang tiap `renderTrades()`); tinjau bila data > ±2.000 transaksi.
- [ ] Pisah `app.js` per tab (ES module/beberapa berkas) bila `app.js` > ±400 KB (kini ±300 KB); minify hanya di build produksi terpisah, sumber tetap terbaca.

**Analisis & disiplin** (usulan 3 Okt 2026, urutan prioritas; belum dikerjakan)
- [x] **Tag setup/strategi per transaksi (v1.1.204)** (mis. CRT H4, RSI divergence, tanpa setup) dengan centang konfirmasi; Laporan menampilkan win rate, expectancy, dan PNL per setup. Perlu bidang baru pada transaksi, filter, impor/ekspor, dan sinkron (kolom Supabase + migrasi).
- [x] **Pelanggaran Aturan trading per transaksi (v1.1.205):** centang aturan yang dilanggar saat mencatat; Laporan menghitung "biaya melanggar aturan" (PNL melanggar vs patuh). Menyambung kartu Aturan trading; perlu ID aturan yang stabil (kini hanya teks).
- [x] **Ringkasan mingguan otomatis (v1.1.202):** PNL minggu ini vs lalu, emosi dan trigger paling merugikan, kepatuhan batas harian, plus 2-3 pertanyaan refleksi dengan kolom catatan.
- Saran urutan: selesaikan **P1 (Supabase asli)** dulu, lalu paket tag setup + pelanggaran aturan.

## 3. Nanti (P3)
**Rute**
- [ ] **Path bersih** (`/kalender`, `/laporan/lanjutan`) bila hosting tetap Vercel: `rewrites` ke `index.html` + `<base href="/">`, path aset mutlak, dan `sw.js` menyesuaikan; kini cukup rute hash.
- [x] **Deep link ke periode/filter (v1.1.207)** (deep link ke transaksi selesai v1.1.203; sisa periode dan filter di URL) (mis. `#transaksi-123456`, `#laporan-tren?periode=...`) dan penyimpanan filter di URL.

**Kalender ekonomi** (tab baru v1.1.167; kartu Ringkasan, peringatan jendela berita, Laporan Saat rilis, banner jadwal habis selesai v1.1.169)
- [ ] **Isi `f`/`p` di `EVENTS`** untuk event lain begitu konsensus terbit (kini baru klaim 8 Okt dan CPI); sumber sering beda angka, cek ulang.
- [ ] **Perbarui `EVENTS`** tiap bulan (kini 2 Okt – 30 Des 2026: USD plus ECB/BoE/BoJ sejak v1.1.211); cek ulang tanggal ke BLS/BEA/Fed. Berikutnya: event non-USD (ECB, BoE, BoJ), data China/Eropa yang menggerakkan emas.
- [x] **Kunci `kal-manual`/`kal-notes`/`kal-prefs` ikut ekspor pengaturan** (v1.1.177). Sisa: sinkron cloud bila perlu.
- [ ] **Hubungkan ke jurnal (lanjutan):** filter Transaksi "dekat rilis" (selesai v1.1.185; Laporan sudah punya tampilan "Saat rilis"); jendela rilis bisa diatur 15/30/60 menit di Setelan (selesai v1.1.186); event dampak Sedang bisa ikut dinilai (selesai v1.1.187).
- [x] **Impor/ekspor jadwal** (JSON, v1.1.181). Sisa: format CSV dan memperluas cakupan Laporan "Saat rilis" (`KAL.cover`) ke event impor.
- [x] **Tampilan kalender mingguan** (v1.1.182).
- [x] **Aktual vs Prakiraan (catatan reaksi emas selesai v1.1.211):** panah lebih tinggi/rendah sudah ada (v1.1.177); sisa catatan arah reaksi emas dan catatan reaksi harga per event.
- [x] **Penanda "Perlu dicek"** (v1.1.177) untuk event berstatus Perkiraan yang tanggalnya sudah dekat.
- [ ] **Peringatan** (PWA) 15 menit sebelum event dampak tinggi.

**Performa**
- [ ] **Performa lanjutan** (saran 5–9, 6 Okt): (saran 5+6 selesai v1.1.166; garis target pada batang bulanan selesai v1.1.183) heatmap kalender tahunan selesai v1.1.184; rentang 12/26 minggu dan garis rata-rata batang mingguan sudah ada (v1.1.180), sumbu dan nilai pada batang selesai v1.1.212; filter Arah (v1.1.178) dan Sesi (v1.1.179) di Performa sudah ada.

**Transaksi**
- [x] **Lampiran gambar chart per transaksi (v1.1.209)** (usulan 3 Okt): foto setup disimpan lokal (IndexedDB) dan dikompres; tidak ikut sinkron cloud/ekspor JSON agar data tetap kecil; tampil di detail transaksi.
- [x] **Impor laporan broker dengan pratinjau (v1.1.208)** (baru/duplikat/error sebelum disimpan); lihat juga Ide lanjutan: Impor CSV.

**Setelan**
- [ ] Tentang: tautan panduan/README (menunggu alamat dokumentasi publik; tanggal build, Periksa pembaruan, dan Instal aplikasi selesai v1.1.147).
- [x] Format angka (Indonesia/Internasional) selesai v1.1.214. Terjemahan teks UI ke bahasa Inggris tidak dikerjakan (ribuan teks tetap di `index.html`/`app.js`; butuh pemisahan teks ke kamus). (Ukuran tampilan selesai v1.1.159.)
- [x] Notifikasi pengingat (v1.1.215): berita dampak tinggi, batas harian, catatan psikologi; berjalan saat aplikasi terbuka. Push saat aplikasi tertutup butuh server (belum ada).

**Ringkasan** (saran 24 Okt 2026)
- [x] Kartu Hari ini (transaksi, sisa batas rugi, berita 24 jam, catatan belum diisi) (v1.1.218)
- [x] Chip periode di strip statistik (v1.1.218)
- [x] Banner cadangan ramping, Nanti menunda 3 hari (v1.1.218)
- [x] Angka nol netral (v1.1.218)
- [x] Grafik ekuitas: legenda ringkas, Fokus rentang sumbu-Y (v1.1.219)
- [x] Transaksi terakhir lebih kaya, sparkline dan drawdown saat ini, kepatuhan aturan (v1.1.220)
- [x] Atur kartu sendiri dan urutan di ponsel (v1.1.221)

**Optimalisasi**
- [ ] (Terblokir: jaringan sesi tidak bisa mengunduh font; kerjakan dari mesin dengan akses npm/CDN) Host sendiri font (Fraunces, IBM Plex Mono) sebagai `woff2` subset Latin + tambah ke `SHELL` di `sw.js` (offline penuh tanpa dependensi luar).
- [ ] Render tab Laporan secara malas: `renderLap2` hanya ±12 ms dari muat ±175 ms, risikonya (lebar 0 saat tersembunyi, urutan `CS`/`DTP`, Drawdown L7) lebih besar dari manfaat; kerjakan bila ukur ulang menunjukkan Laporan dominan atau data > ±2.000 transaksi.
- [ ] Ubah `journal-data` (fallback kosong sejak v1.1.15) jadi berkas kecil atau hapus; kini dipakai `buildFullHtmlString()` untuk menaruh data pada salinan HTML mandiri, jadi ekspor perlu mekanisme lain.
- [ ] Lighthouse (mobile, throttling 4G) sebelum/sesudah; catat LCP/TBT di sini.

## 4. Ide lanjutan (belum dijadwalkan)
- **Impor CSV:** pratinjau baris, pilihan zona waktu, impor deposit, opsi memperbarui transaksi ber-ID sama.
- **Build produksi ter-minify** terpisah (hemat ±30–40%); tinjau ulang bila `app.js` > ±400 KB.

## Keputusan yang sudah diambil
- Pilihan periode berdiri sendiri per tab (mulai dari All, tidak disimpan). Performa dan Deposit **tidak** diberi filter periode: Performa sudah per bulan/minggu, Deposit punya pencarian dan filter tipe.
- Login tidak wajib: aplikasi harus tetap bisa dipakai lokal (offline-first), jadi ada "Lanjut tanpa masuk".
- Ukuran kontrak tidak jadi isian terpisah: sudah tercakup nilai pip per lot di Setelan → Kalkulator lot.


## Multi-akun
- [x] v1.1.191 model akun + pemilih + penyimpanan per akun
- [x] v1.1.192 satuan/mata uang per jenis akun
- [x] v1.1.193 tab Total gabungan
- [x] v1.1.194 Supabase per akun (SQL migrasi)

- [x] Uji nyata migrasi-multi-akun.sql di Supabase sungguhan: berjalan baik (dikonfirmasi pengguna, 22 Okt 2026). Sisa: sinkron dua akun dari dua perangkat.

- [x] Kalender: PCE, PDB, penjualan ritel, ISM Nov-Des ditambahkan v1.1.202 (PDB/PCE dari jadwal BEA); kalender bawaan berakhir 30 Des 2026, perpanjang menjelang Desember.
