# Catatan Rilis — Jurnal XAUUSD

Ringkasan perubahan untuk pengguna, terbaru di atas. Isinya sama dengan **Setelan → Tentang aplikasi → Lihat riwayat** di aplikasi (data `USER_CHANGELOG` di `app.js`). Rincian teknis per versi ada di `CHANGELOG.md`; rencana ke depan di `roadmap.md`.

**Versi saat ini: 1.1.163** (6 Okt 2026)

## Sorotan
- Ringkasan: kurva ekuitas yang jelas (modal, puncak berjalan, drawdown, tooltip), pilihan **Ekuitas / PNL kumulatif**, PNL Minggu/Bulan Ini, lencana DD saat ini.
- **Laporan** lengkap: tren, psikologi trading, heatmap jam × hari, sesi pasar, drawdown, distribusi hasil, bandingkan dua periode, cetak/PDF A4.
- **Transaksi:** catatan psikologi dan catatan bebas, filter lengkap, isi massal, impor/ekspor CSV, batalkan hapus, tampilan kartu di HP.
- **Tampilan:** mode Gelap/Terang/Otomatis, 8 skema warna, aksen sendiri, mode ramah buta warna.
- **Data aman:** sinkron cloud (Supabase), status dan pengingat cadangan, ekspor HTML mandiri/JSON, ekspor-impor pengaturan.
- **Aplikasi terpasang (PWA)** di Android dan iOS, terbuka cepat dan bisa offline.

## 1 Okt 2026 (v1.1.145 – v1.1.163)
**Baru**
- Tab **Performa** selalu dihitung dari transaksi Anda (bulanan dan mingguan), ada penjelasan penilaian, dan bulan terbaru di atas.
- Setelan → Data: **Data mentah per periode (.json)** dengan rentang cepat atau tanggal sendiri.
- Tata letak Ringkasan dan Setelan di layar lebar dirapikan (kartu saldo kiri, kurva kanan; sub-tab Setelan selebar penuh).
- Tombol **Esc** menutup jendela teratas (detail transaksi, tambah transaksi, kalkulator, konfirmasi).
- Setelan → Preferensi: **Ukuran tampilan** (Kecil, Normal, Besar) untuk seluruh aplikasi; langsung berlaku dan ikut ekspor pengaturan.
- **Indikator sinkron cloud** di header (tersinkron, ada perubahan belum dikirim, atau belum disinkronkan) untuk yang sudah masuk; ketuk untuk ke Setelan → Akun.
- Aturan trading: kolom **Tambah aturan baru** di bawah daftar, tanpa perlu membuka Edit; centang yang sudah ada tidak hilang.
- Tampilan lebih seragam: kotak centang bergaya aplikasi (Aturan trading dan mode Pilih) dan tombol **Pilih file** di Setelan → Data tidak lagi memakai tampilan bawaan browser.
- Ringkasan: kartu **Aturan trading** pribadi (satu per baris, maksimal 12) dengan centang harian yang direset otomatis; kutipan acak tetap tampil di bawahnya. Ikut ekspor pengaturan.
- Laporan: **Periode & filter** bisa dilipat/dibuka; saat dilipat, ringkasan periode dan filter aktif tetap terlihat, dan pilihannya diingat.
- **Laporan** kini punya sub-tab (Tren, Ringkasan, Psikologi, Bandingkan, Lanjutan) bergaya sama dengan Setelan; periode dan filter tetap di bawah tab, cetak/PDF tetap memuat semuanya.
- Setelan → Akun lebih ringkas: cukup tombol **Masuk** yang membuka halaman login (form email/password di Setelan dihapus).
- Ringkasan: kartu **Transaksi terakhir** (5 transaksi terbaru dengan hasil, emosi, dan trigger); ketuk baris untuk detail, **Lihat semua** ke tab Transaksi.
- Setelan → **Tentang aplikasi**: **tanggal build**, tombol **Periksa pembaruan** (mengunduh versi baru bila ada, lalu menawarkan Muat ulang), dan status **Aplikasi terpasang** dengan tombol **Instal aplikasi** di browser yang mendukungnya (iPhone/iPad: Bagikan → Tambah ke Layar Utama).
- **Halaman login** saat aplikasi dibuka: Masuk atau Daftar dengan email dan password (ada tombol Lihat), Lupa password lewat email, dan **Lanjut tanpa masuk** bila belum mau sinkron. Pilihan itu diingat sampai Anda menekan Keluar di Setelan → Akun.
- Setelan → Trading → **Kalkulator lot**: atur nilai pip per lot akun serta angka bawaan risiko (%), stop loss, dan rasio risk:reward. Kalkulator di tab Transaksi langsung memakainya, dan tombol reset kembali ke angka ini. Ikut tersimpan di ekspor JSON.
- Setelan → Preferensi → **Angka PNL saat dibuka**: pilih Tersembunyi agar angka PNL di Ringkasan selalu disamarkan saat aplikasi dibuka. Tombol mata tetap bisa menampilkannya sementara.

**Perbaikan**
- Daftar di tab Transaksi langsung muncul saat aplikasi dibuka (sebelumnya kosong sampai filter atau urutan diubah).
- Tombol **Keluar** di Setelan → Akun kini bekerja (tidak tertutup tombol + dan tetap keluar saat jaringan buruk); halaman login muncul lagi sesudahnya.
- Menu Setelan lebih modern: tab dengan ikon dan garis penanda, bisa dengan tombol panah.
- Banner "Versi baru siap" tidak lagi terjepit jadi tiga baris di layar sempit.
- Pada data baru, rasio risk:reward di kalkulator lot mulai dari 1,5, bukan 0.

## 30 Sep 2026 (v1.1.135 – v1.1.144)
**Baru**
- **Setelan dikelompokkan** dengan menu di atas: Tampilan, Trading, Data, Akun, Tentang.
- **Penyimpanan & pengaturan:** ringkasan ruang penyimpanan (batas kira-kira 5 MB) dan Ekspor/Impor pengaturan (tema, skema, aksen, mata uang, zona waktu, format tanggal, batas harian, garis merah) tanpa menyentuh data transaksi.
- **Preferensi:** mata uang, zona waktu, dan format tanggal (30 Sep 2026 atau 30/09/2026). Tiga skema warna baru: Midnight Biru, Ungu Senja, Kertas Putih (versi gelap dan terang).
- **Ringkasan:** PNL Minggu Ini dan Bulan Ini; strip statistik menambah Streak, rata-rata menang/rugi (dengan RR), dan keterangan Periode; kurva bisa dipilih **Ekuitas / PNL kumulatif** (tanpa deposit dan penarikan).
- **Laporan → Distribusi hasil:** pilih satuan PNL atau Pips (median, P10/P90, ketergantungan pada transaksi terbaik).
- **Kurs:** isi kurs Rupiah per USD sendiri, sehingga mode Rp dan "≈ Rp" tidak lagi Rp 0.
- **Status cadangan** di Ekspor data; pengingat di Ringkasan bila lebih dari 7 hari atau ada perubahan sejak cadangan terakhir.
- **Sinkron Supabase:** Lupa password (tautan reset lewat email) dan Ganti password.
- Ringkasan yang masih kosong punya tombol **Impor JSON** dan **Masuk & Pulihkan dari cloud**; opsi reset diberi nama lebih jelas ("Hapus semua data di perangkat ini") dengan konfirmasi yang menyebut jumlah data.

**Peningkatan**
- Aplikasi terbuka lebih cepat (pustaka sinkron dimuat saat Setelan dibuka). Bila ada versi baru, muncul banner **Versi baru siap** dengan tombol Muat ulang (tidak memuat ulang sendiri).
- Chip periode Laporan sama ukurannya dengan Ringkasan dan Analisis PNL; cincin fokus emas untuk navigasi keyboard.

**Perbaikan**
- Salinan dashboard (.html) kini satu berkas mandiri yang bisa dibuka di mana saja.

## 29 Sep 2026 (v1.1.112 – v1.1.134)
**Baru**
- **Catatan bebas per transaksi** (alasan entry, pelajaran): tampil di detail, bisa dicari, ikut CSV dan sinkron cloud (jalankan `migrasi-catatan.sql` sekali di Supabase).
- **Transaksi:** impor CSV (termasuk CSV lama tanpa tahun dan bulan berbahasa Indonesia), filter Emosi/Trigger/Jenis entry/Sesi, tombol **Pilih** untuk isi massal, kolom Waktu buka dan Durasi, ringkasan hasil filter, chip cepat, **Batalkan hapus** 30 menit, tombol ‹ › di detail, kolom Laba aktual, dan kartu ringkas di HP.
- **Tampilan:** mode Gelap/Terang/Otomatis, lima skema warna (berlaku di mode terang juga), warna aksen sendiri, opsi untung biru / rugi oranye, tombol Atur ulang tampilan.
- **Kalkulator lot** dibuka dari tombol di tab Transaksi (tidak lagi tab sendiri).
- **Riwayat perubahan** dan versi aplikasi di Setelan → Tentang aplikasi.
- Ringkasan: lencana **DD saat ini**, garis puncak berjalan, dan kartu ajakan mengisi catatan psikologi.
- Kartu PNL Hari Ini menampilkan sisa batas rugi dan batas jumlah transaksi harian.
- Layar lebar memakai sidebar kiri yang bisa diciutkan.
- Sinkron cloud (Supabase) dengan waktu sinkron/pemulihan terakhir, aplikasi bisa dipasang di HP (PWA), dan `query-user-supabase.sql` untuk membuat akun dan memeriksa data.

**Peningkatan**
- Chip periode bulat (7H · 1B · 3B · 1T · All · Sesuaikan), bawaan All.
- Kurva ekuitas lebih jelas: sumbu bulat dengan satuan dan garis nol, pita drawdown tipis, tooltip di atas grafik, legenda yang bisa diketuk.
- Aplikasi terbuka lebih cepat, terutama saat sinyal lemah; huruf tidak lagi menahan tampilan awal.
- Banyak tombol memakai ikon; tombol Tutup jendela jadi ✕.

**Perbaikan**
- Layar tidak berkedip gelap saat memakai tema terang; chip 7/30 Hari tidak salah hitung di awal bulan.

## 28 Sep 2026
- Pilihan mata uang **USD / USC / Rp** di kartu saldo, berlaku di semua tab.
- Tab **Laporan** jauh lebih lengkap: heatmap, sesi pasar, drawdown, tren, sebaran hasil, ukuran lot, temuan otomatis; bandingkan dua periode; filter arah/sesi/emosi/trigger/jenis entry; cetak/PDF A4.
- **Batas harian pribadi** (maks rugi dan maks transaksi) di Setelan.
- Filter catatan psikologi dan tombol **Simpan & lanjut** di Transaksi.
- Perbaikan: tooltip tidak keluar kartu di layar sempit, Max Drawdown tidak lagi melebihi 100%, tampilan cetak dirapikan.

## 26–27 Sep 2026
- Tab baru **Analisis PNL**: statistik rentang waktu dan kalender PNL harian.
- Setelan lewat ikon ⚙; dropdown dan kalender bisa dipakai lewat keyboard.
- Halaman lebih ringan dan cepat. Saldo Kalkulator dan rekor transaksi ikut terhitung ulang setelah data berubah.

## 25 Sep 2026
- Tab **Laporan** pertama: tren laba/rugi, ringkasan periode, analisis psikologi, cetak PDF.
- Kurva lebih halus, jendela detail per hari, tema terang/gelap, pilihan zona waktu.
- Perbaikan: tab "1 Tahun" tidak lagi membuat halaman macet.

## 22–23 Sep 2026
- **Versi awal:** Ringkasan, Performa, Deposit, Transaksi, dan Kalkulator. Data tersimpan otomatis di browser; ada Reset ke Bawaan yang mengunduh cadangan dulu.
- Tombol **+** untuk menambah transaksi, deposit, atau penarikan manual, dengan catatan psikologi (trigger, emosi, jenis entry); transaksi bisa dilihat, diedit, dan dihapus.
