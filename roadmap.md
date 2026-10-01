# Roadmap — Jurnal XAUUSD

Satu-satunya daftar rencana dan todo proyek (dulu ada di `SUMMARY.md`). Prioritas: **P1** tinggi, **P2** sedang, **P3** rendah. Tidak ada tanggal tetap. Setiap butir yang mengubah kode mengikuti **Alur rilis** di `README.md`; saat selesai, hapus dari sini (centang bila perlu satu rilis), pindahkan tema barunya ke tabel "Sudah selesai", dan catat di `release_note.md` dan `CHANGELOG.md`. Jebakan bug tiap area ada di `SUMMARY.md`.

## Sudah selesai (v1.1.148)
| Tema | Isi |
|---|---|
| Fondasi | Ringkasan, Performa, Deposit, Transaksi, input manual (+), data di localStorage, tanpa build tool |
| Analisis | Analisis PNL; Laporan L1–L18 (tren, psikologi, heatmap, sesi pasar, drawdown, distribusi PNL/Pips, bandingkan dua periode); cetak PDF A4 |
| Transaksi | Catatan psikologi dan bebas, filter lengkap, isi massal, impor/ekspor CSV, batalkan hapus, kartu HP |
| Tampilan | Gelap/Terang/Otomatis, 8 skema warna, aksen custom, mode buta warna, mata uang USD/USC/Rp, zona waktu, format tanggal |
| Data & akun | Halaman login (Masuk/Daftar/Lupa password/Lanjut tanpa masuk), sinkron Supabase manual, ganti password, status dan pengingat cadangan, ekspor HTML mandiri/JSON, ekspor-impor pengaturan, ringkasan penyimpanan |
| Setelan | Sub-navigasi 5 tab (ikon + garis bawah, keyboard), Kurs, batas harian, Kalkulator lot, angka PNL tersembunyi, Tentang (tanggal build, Periksa pembaruan, status dan Instal aplikasi) |
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
- [ ] **Ekspor lalu hapus riwayat lama.** Perlu rancangan: menghapus transaksi mengubah kurva ekuitas, saldo, Max DD, dan Laporan (opsi: diganti satu baris saldo awal).
- [ ] **Sinkron pengaturan ke Supabase:** parameter kalkulator dan pengaturan lain ke tabel `pengaturan` (kini hanya `kurs`; perlu kolom baru + migrasi).

**Optimalisasi** (audit v1.1.131; gzip: `app.js` ±79 KB, `style.css` ±14 KB, `index.html` ±13 KB; muat ±175 ms dengan 439 transaksi)
- [ ] Kurangi `location.reload()` setelah simpan/hapus/impor (±11 tempat): render ulang komponen terdampak. Prasyarat: `allTrades` (kini `const`) jadi sumber tunggal yang bisa dihitung ulang (`recomputeAll()` + `renderAll()`).
- [ ] Memo hitung ulang berat (`computeLapDD`, `eqDrawdownAllTime`, agregat Laporan) per kunci (versi `DATA` + filter); ukur dulu dengan `performance.measure`.
- [ ] `Content-Security-Policy` di `vercel.json` (self, jsDelivr, Google Fonts, `*.supabase.co`; perlu `unsafe-inline` selama ada skrip inline di `<head>`/`journal-data`, atau pindahkan ke berkas). Wajib uji browser.
- [ ] Render bertahap buku transaksi (kini `innerHTML` dibangun ulang tiap `renderTrades()`); tinjau bila data > ±2.000 transaksi.
- [ ] Pisah `app.js` per tab (ES module/beberapa berkas) bila `app.js` > ±400 KB (kini ±300 KB); minify hanya di build produksi terpisah, sumber tetap terbaca.

## 3. Nanti (P3)
**Setelan**
- [ ] Tentang: tautan panduan/README (menunggu alamat dokumentasi publik; tanggal build, Periksa pembaruan, dan Instal aplikasi selesai v1.1.147).
- [ ] Bahasa dan format angka (Indonesia/Inggris), ukuran font (kecil/normal/besar).
- [ ] Notifikasi pengingat isi catatan psikologi atau batas harian (izin Notification; PWA saja).

**Ringkasan**
- [ ] Indikator sinkron Supabase (terakhir dikirim/diambil; ada perubahan lokal belum dikirim).
- [ ] Ganti kutipan acak dengan checklist/aturan trading pribadi yang bisa diedit (atau hapus kartunya).
- [ ] Daftar 5 transaksi terakhir dengan hasil dan emosi.

**Optimalisasi**
- [ ] Host sendiri font (Fraunces, IBM Plex Mono) sebagai `woff2` subset Latin + tambah ke `SHELL` di `sw.js` (offline penuh tanpa dependensi luar).
- [ ] Render tab Laporan secara malas: `renderLap2` hanya ±12 ms dari muat ±175 ms, risikonya (lebar 0 saat tersembunyi, urutan `CS`/`DTP`, Drawdown L7) lebih besar dari manfaat; kerjakan bila ukur ulang menunjukkan Laporan dominan atau data > ±2.000 transaksi.
- [ ] Ubah `journal-data` (fallback kosong sejak v1.1.15) jadi berkas kecil atau hapus; kini dipakai `buildFullHtmlString()` untuk menaruh data pada salinan HTML mandiri, jadi ekspor perlu mekanisme lain.
- [ ] Satu handler global `keydown` Escape yang menutup modal teratas (kini per modal di banyak IIFE).
- [ ] Lighthouse (mobile, throttling 4G) sebelum/sesudah; catat LCP/TBT di sini.

## 4. Ide lanjutan (belum dijadwalkan)
- **Impor CSV:** pratinjau baris, pilihan zona waktu, impor deposit, opsi memperbarui transaksi ber-ID sama.
- **Build produksi ter-minify** terpisah (hemat ±30–40%); tinjau ulang bila `app.js` > ±400 KB.

## Keputusan yang sudah diambil
- Pilihan periode berdiri sendiri per tab (mulai dari All, tidak disimpan). Performa dan Deposit **tidak** diberi filter periode: Performa sudah per bulan/minggu, Deposit punya pencarian dan filter tipe.
- Login tidak wajib: aplikasi harus tetap bisa dipakai lokal (offline-first), jadi ada "Lanjut tanpa masuk".
- Ukuran kontrak tidak jadi isian terpisah: sudah tercakup nilai pip per lot di Setelan → Kalkulator lot.
