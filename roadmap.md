# Roadmap — Jurnal XAUUSD

Satu-satunya daftar rencana dan todo proyek (dulu ada di `SUMMARY.md`). Prioritas: **P1** tinggi, **P2** sedang, **P3** rendah. Tidak ada tanggal tetap. Setiap butir yang mengubah kode mengikuti **Alur rilis** di `README.md`; saat selesai, hapus dari sini (centang bila perlu satu rilis), pindahkan tema barunya ke tabel "Sudah selesai", dan catat di `release_note.md` dan `CHANGELOG.md`. Jebakan bug tiap area ada di `SUMMARY.md`.

## Sudah selesai (v1.1.173)
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
- [ ] **Supabase asli:** halaman login (Daftar, Masuk, Keluar, sesi kedaluwarsa), sinkron termasuk kolom `catatan`, email reset password dan Redirect URLs, ganti password.
- [ ] **Perangkat asli (Android/iOS):** sentuhan, PWA terpasang (pembaruan, banner versi baru, Periksa pembaruan, tombol Instal aplikasi), sidebar, mode Otomatis dan terang, tooltip kurva ekuitas (termasuk "Kustom…") dan grafik Tren, kartu HP Transaksi (mode terang, mode Pilih), halaman login dengan keyboard layar.
- [ ] **Cetak PDF** data asli (terakhir v1.1.83; cek margin nomor halaman) dan cetak per skema; heatmap, blok sesi pasar, KPI Max DD % dengan data asli.
- [ ] Salinan HTML mandiri dibuka dari `file://` di perangkat asli; pengingat cadangan (mode terang, 1280px); aksen custom di grafik/heatmap; font tanpa kedip.
- [ ] **Tindakan manual Supabase:** daftarkan alamat aplikasi di **Redirect URLs** dan **Site URL**; jalankan `migrasi-catatan.sql` sekali (tanpa itu catatan tidak ikut ke cloud).

## 2. Berikutnya (P2)
**Data & akun**
- [ ] **Ekspor lalu hapus riwayat lama.** (Ekspor JSON per periode sudah ada sejak v1.1.162; tinggal langkah hapus.) Perlu rancangan: menghapus transaksi mengubah kurva ekuitas, saldo, Max DD, dan Laporan (opsi: diganti satu baris saldo awal).
3b. **Chart XAUUSD** (v1.1.173): kartu di Ringkasan (`#chartCard`) memuat widget TradingView Advanced Chart (`OANDA:XAUUSD`, H4) saat ditekan Tampilkan; tema dan zona waktu mengikuti Setelan; butuh internet; kunci `jurnalChartOpen`. Belum menggambar entri/SL/TP jurnal (opsi: Lightweight Charts + sumber data harga).
- [ ] **Sinkron pengaturan ke Supabase:** parameter kalkulator dan pengaturan lain ke tabel `pengaturan` (kini hanya `kurs`; perlu kolom baru + migrasi).

**Optimalisasi** (audit v1.1.131; gzip: `app.js` ±79 KB, `style.css` ±14 KB, `index.html` ±13 KB; muat ±175 ms dengan 439 transaksi)
- [ ] Kurangi `location.reload()` setelah simpan/hapus/impor (±11 tempat): render ulang komponen terdampak. Prasyarat: `allTrades` (kini `const`) jadi sumber tunggal yang bisa dihitung ulang (`recomputeAll()` + `renderAll()`).
- [ ] Memo hitung ulang berat (`computeLapDD`, `eqDrawdownAllTime`, agregat Laporan) per kunci (versi `DATA` + filter); ukur dulu dengan `performance.measure`.
- [ ] `Content-Security-Policy` di `vercel.json` (self, jsDelivr, Google Fonts, `*.supabase.co`; perlu `unsafe-inline` selama ada skrip inline di `<head>`/`journal-data`, atau pindahkan ke berkas). Wajib uji browser.
- [ ] Render bertahap buku transaksi (kini `innerHTML` dibangun ulang tiap `renderTrades()`); tinjau bila data > ±2.000 transaksi.
- [ ] Pisah `app.js` per tab (ES module/beberapa berkas) bila `app.js` > ±400 KB (kini ±300 KB); minify hanya di build produksi terpisah, sumber tetap terbaca.

**Analisis & disiplin** (usulan 3 Okt 2026, urutan prioritas; belum dikerjakan)
- [ ] **Tag setup/strategi per transaksi** (mis. CRT H4, RSI divergence, tanpa setup) dengan centang konfirmasi; Laporan menampilkan win rate, expectancy, dan PNL per setup. Perlu bidang baru pada transaksi, filter, impor/ekspor, dan sinkron (kolom Supabase + migrasi).
- [ ] **Pelanggaran Aturan trading per transaksi:** centang aturan yang dilanggar saat mencatat; Laporan menghitung "biaya melanggar aturan" (PNL melanggar vs patuh). Menyambung kartu Aturan trading; perlu ID aturan yang stabil (kini hanya teks).
- [ ] **Ringkasan mingguan otomatis:** PNL minggu ini vs lalu, emosi dan trigger paling merugikan, kepatuhan batas harian, plus 2-3 pertanyaan refleksi dengan kolom catatan.
- Saran urutan: selesaikan **P1 (Supabase asli)** dulu, lalu paket tag setup + pelanggaran aturan.

## 3. Nanti (P3)
**Rute**
- [ ] **Path bersih** (`/kalender`, `/laporan/lanjutan`) bila hosting tetap Vercel: `rewrites` ke `index.html` + `<base href="/">`, path aset mutlak, dan `sw.js` menyesuaikan; kini cukup rute hash.
- [ ] **Deep link ke transaksi/periode** (mis. `#transaksi-123456`, `#laporan-tren?periode=...`) dan penyimpanan filter di URL.

**Kalender ekonomi** (tab baru v1.1.167; kartu Ringkasan, peringatan jendela berita, Laporan Saat rilis, banner jadwal habis selesai v1.1.169)
- [ ] **Isi `f`/`p` di `EVENTS`** untuk event lain begitu konsensus terbit (kini baru klaim 8 Okt dan CPI); sumber sering beda angka, cek ulang.
- [ ] **Perbarui `EVENTS`** tiap bulan (kini 2 Okt – 6 Nov 2026, hanya USD); cek ulang tanggal ke BLS/BEA/Fed. Berikutnya: event non-USD (ECB, BoE, BoJ), data China/Eropa yang menggerakkan emas.
- [ ] **Kunci `kal-manual`/`kal-notes`/`kal-prefs` ikut ekspor pengaturan** (kini hanya di browser) dan, bila perlu, sinkron cloud.
- [ ] **Hubungkan ke jurnal (lanjutan):** filter Laporan/Transaksi "dekat rilis"; jendela ±30/±15 menit bisa diatur di Setelan; ikut dinilai juga event dampak Sedang.
- [ ] **Impor/ekspor `EVENTS`** (JSON/CSV) supaya jadwal tidak perlu mengedit `kalender.js`.
- [ ] **Tampilan kalender mingguan** (grid Senin–Jumat dengan titik berwarna).
- [ ] **Aktual vs Prakiraan:** tanda panah lebih tinggi/rendah dan catatan arah reaksi emas; catatan reaksi harga per event.
- [ ] **Penanda "Perlu dicek"** untuk event berstatus Perkiraan yang tanggalnya sudah dekat.
- [ ] **Peringatan** (PWA) 15 menit sebelum event dampak tinggi.

**Performa**
- [ ] **Performa lanjutan** (saran 5–9, 6 Okt): (saran 5+6 selesai v1.1.166; sisa: garis target pada batang bulanan) heatmap kalender tahunan; sumbu/nilai/rata-rata pada batang mingguan dan pilihan rentang 12/26 minggu; filter Arah/Sesi di Performa.

**Transaksi**
- [ ] **Lampiran gambar chart per transaksi** (usulan 3 Okt): foto setup disimpan lokal (IndexedDB) dan dikompres; tidak ikut sinkron cloud/ekspor JSON agar data tetap kecil; tampil di detail transaksi.
- [ ] **Impor laporan broker dengan pratinjau** (baru/duplikat/error sebelum disimpan); lihat juga Ide lanjutan: Impor CSV.

**Setelan**
- [ ] Tentang: tautan panduan/README (menunggu alamat dokumentasi publik; tanggal build, Periksa pembaruan, dan Instal aplikasi selesai v1.1.147).
- [ ] Bahasa dan format angka (Indonesia/Inggris). (Ukuran tampilan selesai v1.1.159.)
- [ ] Notifikasi pengingat isi catatan psikologi atau batas harian (izin Notification; PWA saja).

**Ringkasan**

**Optimalisasi**
- [ ] Host sendiri font (Fraunces, IBM Plex Mono) sebagai `woff2` subset Latin + tambah ke `SHELL` di `sw.js` (offline penuh tanpa dependensi luar).
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
