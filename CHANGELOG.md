# Changelog

Perubahan Jurnal XAUUSD, terbaru di atas. Semua rilis 22–28 Sep 2026. v1.1.66–v1.1.102 dicatat per versi; v1.0.0–v1.1.65 diringkas per tema. Status & todo: `SUMMARY.md`.

## Rilis terbaru
### 1.1.105 — 29 Sep
- Kode dipecah jadi folder datar: `index.html`, `style.css`, `app.js` (isi identik dengan v1.1.104), `sync.js`, `config.js`, `schema.sql`.
- Baru: sinkron Supabase (Auth email+password, Kirim ke awan dengan mirror, Ambil dari awan dengan backup otomatis). Tabel `trades`, `deposit_log`, `pengaturan` dengan RLS per pengguna.
- "Download HTML" kini butuh file pendamping di folder yang sama.
- Diuji Playwright dengan Supabase tiruan (kirim, mirror hapus, tarik); belum diuji ke proyek Supabase asli.
### 1.1.102 — 28 Sep
- **Fix:** tooltip kurva drawdown (underwater) di Laporan melebar jauh melewati kartu di layar sempit (mis. 630–680px lebar tooltip di kartu 316px pada viewport 390px) — sejak tooltip disatukan jadi satu baris, klem posisi lama tidak memperhitungkan bahwa tooltip sendiri lebih lebar dari kartu. `ChartHover` (dipakai kurva ekuitas, drawdown, dan Tren Laporan) kini otomatis mengecilkan font tooltip sampai muat lebar kartu sebelum menempatkannya, dan meng-klem posisi memakai lebar/rect kartu yang sebenarnya (px), bukan persentase dari lebar SVG. Kalau lebar minimum masih kurang (kombinasi ekstrem: layar sangat sempit + mode Rp), tooltip melipat ke beberapa baris alih-alih melebihi kartu.
- Tooltip **Tren performa (rolling, L12)** dan **Distribusi hasil (L14)** kini punya hover/ketuk sungguhan lewat `ChartHover` (garis+titik utk rolling: transaksi ke-berapa, tanggal, expectancy, WR; sorot batang utk histogram: rentang PNL, jumlah transaksi, persentase dari total) — sebelumnya histogram cuma punya `<title>` bawaan browser yang tidak ramah sentuhan, dan rolling belum ada tooltip sama sekali.
- Diverifikasi Playwright (320/390/700px, mode USC/USD/Rp) dengan 150 transaksi sintetis: tooltip kelima grafik (ekuitas, drawdown, tren, rolling, distribusi) tidak pernah melewati tepi kartu di posisi kiri/tengah/kanan; font-size ikut mengecil (sampai ~72%) dan melipat baris hanya pada kombinasi terpempit; tanpa error JS. Belum diuji dengan data asli 441 transaksi; sentuhan di perangkat asli belum dicek.
### 1.1.101 — 28 Sep
- Laporan L17 (bandingkan dua periode): bagian baru "Bandingkan dua periode" di atas Analisis lanjutan, independen dari periode utama Laporan (tapi filter Arah, Sesi, Emosi, Trigger, Jenis entry tetap berlaku). Dua dropdown periode (**A**, **B**): Bulan ini, Bulan lalu, 7/30 hari terakhir & sebelumnya, Tahun ini, Paruh pertama/kedua riwayat, atau **Kustom…** (dua input tanggal per sisi).
- Tabel KPI berdampingan (A, B, selisih B−A): Transaksi, Win rate, Laba bersih, Profit factor, Expectancy, rata-rata menang/rugi, rasio menang/rugi, Max DD (PNL). Warna selisih ikut arah "lebih baik" per metrik (Max DD & rata-rata rugi: lebih kecil = hijau). Catatan otomatis: ringkasan menang metrik, peringatan sampel < 10 transaksi, dan peringatan periode berjalan (belum penuh) bila salah satu sisi memakai preset "…ini/terakhir".
- Diverifikasi Playwright (390 & 700px) dengan 250 transaksi sintetis (preset, Paruh 1 vs 2, Kustom, periode kosong di satu sisi), 15 transaksi (satu sisi 0 transaksi), dan data kosong: tanpa error JS.
### 1.1.99 — 28 Sep
- Laporan L14 (distribusi hasil): blok baru "Distribusi hasil per transaksi" di Analisis lanjutan. Histogram PNL per transaksi (12 rentang sama lebar; batang rugi merah dan diarsir saat cetak, batang untung hijau; garis 0 bila rentang melewati nol) dan enam kartu: **median, P10, P90**, porsi **laba kotor dari 10% transaksi menang terbesar**, porsi **rugi kotor dari 10% rugi terbesar**, dan **laba bersih tanpa 10% menang terbesar** (10% = ceil(0,1 × n) transaksi; butuh minimal 10 transaksi, kalau kurang tampil pesan). Mengikuti periode dan semua filter Laporan, termasuk Arah. Digambar ulang lewat `ResizeObserver`.
- "Temuan otomatis" bertambah satu aturan: bila laba bersih positif tetapi menjadi ≤ 0 tanpa 10% transaksi menang terbesar (butuh n ≥ 30). Fakta data, bukan saran.
- Histogram hanya untuk PNL; distribusi pips belum ada.
- Diverifikasi Playwright dengan 120 transaksi sintetis (390 dan 1000px: 12 batang, kartu benar, temuan muncul) dan 8 transaksi (pesan "butuh minimal 10"), tanpa error JS dan tanpa overflow. Belum diuji dengan data asli 441 transaksi; cetak PDF belum dicek.
### 1.1.98 — 28 Sep
- Laporan L15: grafik drawdown (underwater) kini punya **tooltip hover/ketuk** lewat `ChartHover`: garis vertikal + titik di ekuitas, dan kotak berisi tanggal, ekuitas (+ `≈ Rp`), puncak berjalan, serta kedalaman drawdown (% dan nominal, atau "Di puncak"). Titik dipilih yang terdekat menurut waktu. Elemen hover disembunyikan saat cetak.
- Tooltip dijaga tetap di dalam kotak grafik (`onShow` meng-clamp posisi kiri): tanpa ini tooltip di tepi kanan melebar keluar kartu dan halaman jadi bisa digeser (lebar dokumen 492px pada viewport 390px).
- Diverifikasi Playwright (390 dan 1000px) dengan 120 transaksi sintetis: hover di kiri, tengah, dan kanan menampilkan data yang benar, tooltip tertutup saat kursor keluar, lebar dokumen = lebar viewport, tanpa error JS. Belum diuji dengan data asli 441 transaksi; sentuhan di perangkat asli belum dicek.
### 1.1.97 — 28 Sep
- Laporan L13 (Beli vs Jual): blok baru "Beli vs Jual" di Analisis lanjutan. Dua baris berdampingan (jumlah, WR, Expectancy, PNL; lencana "n kecil" dan drill-down seperti kelompok lain) plus kartu **PF** dan **lot rata-rata** per arah. Blok ini **mengabaikan filter Arah** (yang lain tetap berlaku: periode, Sesi, Emosi, Trigger, Jenis entry) lewat `lap2NoArah`, jadi kedua arah selalu terlihat; bila filter Arah aktif, catatan di bawah blok menjelaskannya.
- "Temuan otomatis" bertambah satu aturan: Beli vs Jual (butuh n ≥ 20 per arah; muncul bila tanda expectancy berbeda atau selisihnya ≥ 50%). Fakta data, bukan saran.
- Diverifikasi Playwright (390px) dengan 120 transaksi sintetis (Beli 59, Jual 61; blok, kartu, dan temuan muncul; filter Arah Beli tetap menampilkan kedua arah) dan 20 transaksi (lencana n kecil), tanpa error JS. Belum diuji dengan data asli 441 transaksi.
### 1.1.96 — 28 Sep
- Laporan L12 (tren rolling): blok baru "Tren performa (rolling)" di Analisis lanjutan. Grafik garis expectancy rata-rata per transaksi pada jendela **30 atau 50 transaksi terakhir** (urut waktu tutup) dengan garis acuan 0, plus kartu: expectancy dan WR jendela terakhir, seluruh periode, jendela terbaik dan terburuk. Win rate ditampilkan di kartu, bukan sebagai garis kedua (skalanya beda dengan nominal). Butuh minimal jendela + 1 transaksi; kalau kurang, tampil pesan. Mengikuti periode dan semua filter Laporan (All Time cocok untuk melihat tren seluruh riwayat). Digambar ulang lewat `ResizeObserver`; tombol jendela ikut disembunyikan saat cetak.
- "Temuan otomatis" bertambah satu aturan: 30 transaksi terakhir vs transaksi sebelumnya (butuh n ≥ 60; muncul hanya bila tanda expectancy berbeda atau selisihnya ≥ 50%). Fakta data, bukan saran.
- Diverifikasi Playwright (390px) dengan 120 transaksi sintetis (kartu, grafik, tombol 50, temuan muncul) dan 20 transaksi (pesan "butuh minimal 31"), tanpa error JS dan tanpa overflow. Belum diuji dengan data asli 441 transaksi; hover/tooltip grafik ini belum ada; cetak PDF belum dicek.
### 1.1.95 — 28 Sep
- **Fix:** heatmap jam × hari keluar dari kartu di layar sempit (≤ ~400px; halaman ikut bisa digeser ke samping, lebar dokumen 531px pada viewport 390px). Penyebab: sel `.hc` memakai `aspect-ratio:1` dan meregang mengikuti tinggi baris yang ditentukan kolom Σ (34px), sehingga lebar minimum tiap kolom `1fr` ikut 34px. Kini grid `26px repeat(13, minmax(0,1fr))` dan `.lap-heat > *{min-width:0}`: 13 kolom sama lebar, sel selalu muat di dalam kartu. Style cetak tidak berubah (tinggi sel tetap 5 mm).
- Diverifikasi Playwright dengan 300 transaksi sintetis pada lebar 320, 390, dan 768px untuk keempat metrik (PNL, WR, Expectancy, Jumlah): tepi kanan grid = tepi kartu, lebar dokumen = lebar viewport, tanpa error JS. Cetak PDF belum dicek ulang.
### 1.1.94 — 28 Sep
- Laporan L11 (selesai): filter **Emosi**, **Trigger entry**, dan **Jenis entry** (dropdown kustom di bawah filter Sesi), masing-masing dengan pilihan "Belum dicatat". Semua filter digabung (AND) dan berlaku untuk KPI, Tren, psikologi, Analisis lanjutan, serta periode pembanding (delta ▲/▼); label periode dan header cetak memuat filter aktif (mis. "Sesi: London · Emosi: FOMO"). Blok Drawdown tetap independen dari filter. Dropdown dibangun setelah modul `CS` (di bawah `CS.build('csw_filterCatatan')`), bukan di `lap2SetupControls()`, karena `CS` baru didefinisikan sesudahnya.
- Diverifikasi Playwright dengan 60 transaksi sintetis (390px): jumlah per emosi 26 + 17 + 17 = 60, kombinasi Belum dicatat + Breakout menyaring 11 dari 17, tanpa error JS. Belum diuji dengan data asli 441 transaksi; cakupan catatan psikologi data asli masih rendah, jadi filter ini baru bermakna setelah catatan terisi.
### 1.1.93 — 28 Sep
- Laporan L11 (sebagian): filter **Sesi** (Semua sesi / Asia / London / New York) di bawah filter Arah, memakai `LAP_SESSIONS` dan jam `waktu_buka` (GMT+8). Berlaku untuk KPI, grafik Tren, psikologi, dan Analisis lanjutan, termasuk periode pembanding (delta ▲/▼). Transaksi tanpa `waktu_buka` tidak ikut saat filter aktif. Header cetak dan label periode memuat "Sesi: …". Blok Drawdown tetap independen dari filter (seperti untuk filter Arah). Filter Emosi, Jenis Entry, dan Trigger belum dikerjakan.
- Diverifikasi Playwright dengan 60 transaksi sintetis (390px): jumlah per sesi 15 + 24 + 21 = 60, KPI dan blok Sesi pasar ikut berubah, tanpa error JS. Belum diuji dengan data asli 441 transaksi.
### 1.1.92 — 28 Sep
- Laporan L9 (sesi pasar): blok baru "Sesi pasar (waktu buka, GMT+8)" di Analisis lanjutan, alternatif yang lebih ringkas dari heatmap bin 2 jam. Transaksi dikelompokkan menurut jam buka ke **Asia (06–15)**, **London (15–20)**, **New York (20–06)**; tiap baris menampilkan jumlah, WR, Expectancy, dan PNL, dengan lencana "n kecil" dan bisa diketuk untuk drill-down. Batas jam tetap (GMT+8, tanpa penyesuaian DST) dan tidak tumpang tindih, jadi tiap transaksi masuk tepat satu sesi; catatan di bawah blok menjelaskan batasnya. Batas ada di satu konstanta `LAP_SESSIONS`.
- "Temuan otomatis" bertambah satu aturan: expectancy sesi terbaik vs terburuk (butuh n ≥ 20 per sesi, minimal dua sesi memenuhi). Fakta data, bukan saran.
- Laporan L10 (format): KPI **Max DD** di atas kini menampilkan juga persentase dari kurva ekuitas ("-4,0% dari puncak ekuitas"; angka nominalnya tetap berbasis PNL, jadi kedua angka beda dasar hitung dan tidak dibagi satu sama lain). Persen kosong bila modal tidak tersedia atau tidak ada drawdown. Max DD bernilai 0 tidak lagi tampil "-$0,00".
- L10: tanda minus rupiah kini di depan simbol ("-Rp 1.234", sama seperti "-$1,00" dan "+Rp 1.234"), sebelumnya "Rp -1.234". Nilai yang membulat ke 0 tampil "Rp 0", bukan "-Rp 0". Berlaku di semua tempat lewat `fmtRp`.
- Diverifikasi Playwright dengan 150 transaksi sintetis (jam buka tersebar di tiga sesi): 1280px mode Rp dan 390px mode USD, drill-down baris sesi membuka daftar, temuan sesi muncul, dan data kosong; tanpa error JS. Belum diuji dengan data asli 441 transaksi.
### 1.1.91 — 28 Sep
- Laporan L7 (drawdown / underwater): blok baru "Drawdown (underwater)" di Analisis lanjutan. Grafik kurva ekuitas periode (garis emas) dengan puncak berjalan (garis putus-putus) dan **area arsiran drawdown** di antaranya (arsiran garis + isi transparan, tetap terbaca hitam-putih saat dicetak). Kartu: **DD terdalam** (% dan nominal), **durasi DD terpanjang** (atau "masih berlangsung"), **waktu pulih** DD terdalam (titik terendah → puncak baru, atau "belum pulih"), dan **DD saat ini** (sejak kapan). Daftar 3 drawdown terdalam (rentang tanggal, kedalaman, durasi, waktu pulih).
- Dihitung dari ekuitas akun dengan puncak yang digeser deposit/penarikan (aturan sama dengan Max DD % di blok Return), jadi tidak terpengaruh filter Arah; saldo ≤ 0 dibatasi 100%. Grafik digambar ulang saat lebar berubah (`ResizeObserver`) dan menyesuaikan lebar layar.
- "Temuan otomatis" bertambah satu aturan: drawdown terdalam ≥ 5% beserta status pulih/belum.
- Diverifikasi Playwright: ekuitas turun terus (DD 79,8% masih berlangsung), naik-turun (3 episode, waktu pulih 26 hari, layar 390px), selalu naik ("Di puncak"), dan data kosong; tanpa error JS. Belum diuji dengan data asli 441 transaksi; hover/tooltip grafik ini belum ada.
### 1.1.90 — 28 Sep
- Laporan: filter periode **default sekarang All Time** (sebelumnya Mingguan). Ada tombol baru "All Time" di deretan granularitas (Harian, Mingguan, Bulanan, 3 Bulan, 1 Tahun, All Time): dari hari transaksi pertama sampai hari ini (atau hari transaksi terakhir bila lebih baru), semua KPI, grafik Tren, psikologi, dan Analisis lanjutan ikut.
- Grafik Tren All Time memilih pembagian otomatis: harian bila rentang ≤ 45 hari, mingguan ≤ 200 hari, selain itu bulanan (label bulan memuat tahun bila rentang > 1 tahun, mis. "Okt 24").
- Tombol panah periode (‹ ›) dinonaktifkan di All Time; karena tidak ada periode pembanding, delta ▲/▼ tidak tampil dan catatannya menjelaskan hal itu. Pindah ke granularitas lain lalu kembali ke All Time berjalan normal. Cetak PDF memuat "Periode All Time: <rentang tanggal>".
- Pilihan tidak disimpan: tiap kali halaman dibuka, Laporan kembali ke All Time (filter Arah tetap Semua).
- Diverifikasi Playwright: data 9 bulan, 2 tahun, 3 minggu, dan kosong; tanpa error JS.
### 1.1.89 — 28 Sep
- Laporan L6 (overtrading & batas harian): Setelan punya bagian baru "Batas harian": **Maks rugi harian (¢)** (dengan petunjuk setara $ dan Rp) dan **Maks transaksi per hari**. Kosong = nonaktif. Disimpan di localStorage (`jurnalDayLimits`), tidak ikut ekspor JSON; mengubah nilai langsung me-render ulang Laporan.
- Analisis lanjutan bertambah blok "Transaksi per hari & batas harian": hari trading + rata-rata trx/hari, hari tersibuk, hari terburuk; hasil menurut jumlah transaksi per hari (1–2, 3–5, 6–10, > 10; jumlah hari, rata-rata PNL/hari, WR, Expectancy); hari yang melewati batas (rugi harian, jumlah transaksi, dalam batas) dan baris "Transaksi setelah batas tercapai" (transaksi berikutnya di hari yang sama setelah rugi kumulatif menyentuh batas atau jumlah transaksi melewati batas; urut waktu tutup). Baris bisa diketuk untuk drill-down. Hari = tanggal tutup GMT+8.
- "Temuan otomatis" bertambah dua aturan: rata-rata PNL/hari pada hari ≥ 6 transaksi lebih buruk dari hari 1–2 transaksi (masing-masing ≥ 5 hari), dan ringkasan transaksi setelah batas tercapai (≥ 10 transaksi). Fakta data, bukan saran.
- Diverifikasi Playwright: 60 hari sintetis tanpa batas (pesan petunjuk), dengan batas (500¢ / 5 trx), mengisi batas lewat Setelan (Laporan langsung ter-update, tersimpan di localStorage), dan data kosong; tanpa error JS. Belum diuji dengan data asli 441 transaksi.
### 1.1.88 — 28 Sep
- Laporan L5 (lot & ukuran posisi): blok baru "Lot & ukuran posisi" di Analisis lanjutan. Lot rata-rata, lot setelah menang, dan lot setelah rugi (rasio ke lot setelah menang; merah bila ≥ 1,2×); daftar "Lot naik ≥ 1,25× setelah rugi" vs "Lot sama / turun" (jumlah, WR, Expectancy, PNL — deteksi martingale/revenge sizing); hasil menurut ukuran lot (kecil < 0,75×, normal, besar > 1,5× lot rata-rata); catatan rugi terbesar ÷ rata-rata rugi. Baris bisa diketuk untuk drill-down daftar transaksi.
- "Temuan otomatis" bertambah dua aturan (butuh n ≥ 20 per kelompok): lot setelah rugi ≥ 1,2× lot setelah menang, dan expectancy lebih buruk saat lot dinaikkan setelah rugi. Fakta data, bukan saran.
- `renderPsyGroup()` menerima parameter `emptyMsg` (pesan kosong khusus); transaksi tanpa data lot dilewati.
- Diverifikasi Playwright dengan 300 transaksi sintetis (pola lot naik setelah rugi), 30 transaksi tanpa lot, dan data kosong: tanpa error JS, drill-down membuka 49 transaksi sesuai jumlah baris. Belum diuji dengan data asli 441 transaksi.
### 1.1.87 — 28 Sep
- Laporan L8 (kelengkapan catatan psikologi): tab Transaksi punya filter "Catatan" (Semua / Belum ada catatan psikologi / Sudah ada catatan; ikut Reset dan badge filter) dan petunjuk jumlah transaksi yang belum dicatat. Modal edit punya tombol "Simpan & lanjut (N)": simpan, reload, lalu otomatis membuka edit transaksi berikutnya yang belum dicatat (antrean di `sessionStorage`, dibersihkan saat modal ditutup). Bagian Analisis psikologi memuat petunjuknya.
- Diverifikasi Playwright dengan reload nyata: 6 transaksi belum dicatat → simpan & lanjut membuka P6 dalam mode edit, antrean berkurang, antrean terhapus saat ditutup.
### 1.1.86 — 28 Sep
- Laporan L2: drill-down. Ketuk sel heatmap (termasuk total Σ) → tombol "Lihat transaksi"; ketuk baris kelompok (psikologi, durasi, setelah menang/rugi) → modal daftar transaksi (maks 150, urut waktu; ketuk baris untuk detail). Memakai ulang modal detail hari lewat `openListModal()`; `groupByField()`/`psyRow()` kini menyimpan `list`.
- Laporan L4: kartu "Temuan otomatis" (aturan sederhana, hanya kelompok bersampel cukup): win rate vs titik impas RR, WR/expectancy setelah rugi vs menang, sel jam × hari terburuk/terbaik (n ≥ 5), durasi terbaik/terburuk (n ≥ 20). Fakta data, bukan saran.
- Diverifikasi: 441 transaksi sintetis, modal terbuka dengan jumlah baris sesuai, tanpa error JS.
### 1.1.85 — 28 Sep
- Laporan L1: heatmap jam × hari kini punya toggle metrik (PNL / Win rate / Expectancy / Jumlah), kolom & baris Σ (total per hari dan per jam), dan sel dengan < 5 transaksi ditandai garis putus-putus (sampel kecil). Detail ketukan menampilkan n, WR, PNL, Exp. Render dipisah ke `drawLapHeat()`; cetak menampilkan metrik aktif.
- Laporan L3: lencana "n kecil" (< 10 transaksi) di semua baris kelompok psikologi, durasi, dan setelah menang/rugi.
- Diverifikasi: 4 metrik × 104 sel tanpa error JS; render PDF lebar 700px rapi.
### 1.1.84 — 28 Sep
- **Fix cetak:** angka PNL di heatmap jam × hari tampil satu baris terlalu rendah (padding persen menggeser teks keluar sel) sehingga terbaca milik hari lain. Kini angka dipusatkan di dalam sel (`position:absolute` + flex). Warna sel & data tidak berubah.
- Diverifikasi lewat render PDF lebar 700px: angka sejajar dengan sel masing-masing.
### 1.1.83 — 28 Sep
- **Fix cetak (dari PDF v1.1.82 data asli):** lebar A4 memicu aturan mobile `@media (max-width:720px)`, sehingga item terakhir `.stat` melebar 1 baris penuh (Max DD terlempar ke baris kedua, RR juga). Kini aturan itu dinetralkan saat cetak (`grid-column:auto`, tanpa border-top); KPI 4 kolom, statistik 3 kolom.
- **Fix:** Max DD % bisa >100% (−101,4%) karena saldo sempat negatif sebelum Kompensasi MC. Kini dibatasi 100%, dengan catatan otomatis "saldo sempat nol/negatif" di bawah kartu.
- Diverifikasi: uji saldo −20 setelah puncak 1500 → −100,0% + catatan; render PDF pada lebar 700px (4 halaman A4).
### 1.1.82 — 28 Sep
- **Fix (dari cetak PDF data asli):** Max DD % di "Return terhadap modal" bisa >100% (−100,2%). Kini dihitung dari kurva ekuitas (puncak → titik terendah), deposit/penarikan dinetralkan; nominal Max DD di KPI tetap berbasis PNL.
- **Fix:** Rata-rata bersih/hari pada periode berjalan dibagi 365 hari penuh; kini hanya sampai hari ini.
- **Fix cetak:** tooltip & garis hover tidak ikut tercetak; grid KPI/statistik dipaksa 4/3 kolom (sebelumnya kolaps jadi 2–3 kolom di lebar A4); judul & catatan "Analisis lanjutan" tidak terpisah antar-halaman (kartu itu mulai di halaman baru); padding stat & tinggi sel heatmap dipadatkan.
- Diverifikasi: uji Max DD % (deposit 1000, +500, −1000 → −66,7%; penarikan dana → 0%) dan render PDF 441 transaksi sintetis (4 halaman A4).
### 1.1.81 — 28 Sep
- Style cetak PDF Laporan (P1–P7): header cetak (judul, periode, granularitas, filter Arah, waktu cetak, versi) dan `@page` A4 dengan nomor halaman; masthead, bilah periode, chip filter, dan footer disembunyikan; kartu putih tanpa radius/bayangan.
- Grafik terbaca hitam-putih: bar rugi diarsir, garis rugi putus-putus, garis lebih tebal, legenda ikut. Heatmap: legenda skala + angka PNL di sel (tinggi sel dipadatkan). Tabel angka grafik ikut tercetak untuk Harian/Mingguan.
- Pemenggalan halaman: kartu boleh menyambung antar-halaman, tapi grup/KPI/grafik/heatmap/tabel tidak terpotong dan judul kartu tidak tertinggal sendiri (tanpa paksa halaman baru per kartu, supaya tidak menyisakan halaman kosong).
- Diverifikasi lewat render PDF Chromium (data sintetis): 4 halaman A4, tanpa error JS. Belum dicek: cetak di browser asli & data asli.
### 1.1.80 — 28 Sep
- Laporan: KPI (Laba bersih, WR, PF, Max DD + delta) dipindah ke atas grafik Tren; Ringkasan performa tinggal Expectancy, rata-rata menang/kalah + RR; kartu "Laba bersih" grid ringkasan diganti "Menang / Kalah".
- Cetak PDF: `break-inside: avoid`, `print-color-adjust: exact`; warna grafik & heatmap pakai `var(--gain/--loss)` (heatmap via `color-mix`) agar ikut tema cetak terang; tabel angka disembunyikan saat cetak.
- `parseGmt8()` di-cache per string tanggal (fungsi murni, tanpa invalidasi).
- Grafik Tren: `role="img"` + `aria-label`, tabel angka (`<details>`), sub-baris `≈ Rp` di tooltip.
### 1.1.79 — 28 Sep
- Laporan: kartu "Analisis lanjutan" (`renderLapLanjut()`): streak & WR/PNL setelah menang/rugi + emosi setelah rugi; heatmap jam (bin 2 jam) × hari dari `waktu_buka`; durasi posisi (5 rentang) vs hasil; return % dan Max DD % terhadap modal bersih akhir periode.
- `renderPsyGroup()` menerima `keepOrder` dan cakupan opsional.
### 1.1.78 — 28 Sep
- Laporan: delta vs periode sebelumnya (▲/▼, `deltaTag()`); rata-rata menang/kalah + RR; psikologi diurut PNL + Expectancy + cakupan catatan; grafik Tren bar untuk Harian/Mingguan.
- `computePeriodStats()` menambah `avgWin`, `avgLoss`, `rr`, `winCount`, `lossCount`.
### 1.1.77 — 28 Sep
- Sub-baris `≈ Rp` di kartu Tren & Ringkasan performa (Laporan); hidden di mode Rp.
### 1.1.76 — 28 Sep
- **Fix:** label sumbu X grafik Tren mundur 1 hari (`lap2DayLabel()` geser +8 jam sebelum baca tanggal).
- Grafik Tren: viewBox mengikuti lebar kotak, sumbu Y, render ulang via `ResizeObserver`; ringkasan tidak dobel (`laporanPeriodDetail` dihapus); bilah periode satu baris.
### 1.1.75 — 28 Sep
- Kartu hero: Rupiah jadi sub-baris `≈ Rp` (`heroRpSub()`); tombol mata ikut memburamkan sub-baris.
### 1.1.74 — 28 Sep
- "Setara rupiah" jadi sub-baris `≈ Rp` (`approxRp()`, `.approx-rp`); kartu "Setara Rp" dihapus, stat strip jadi 6 item.
### 1.1.73 — 28 Sep
- Pemilih mata uang berlaku di semua tab (`fmtMoney`/`fmtMoneyNum`/`fmtAxisMoney`); teks tersimpan tetap ¢, dikonversi saat tampil (`convCentText`). Kalkulator & ekspor tetap ¢.
- **Fix:** rekursi tak hingga di `fmtMoney` (ditemukan sebelum rilis).
### 1.1.71–1.1.72 — 28 Sep
- Pemilih mata uang di kartu hero (`jurnalHeroCurrency`, default USD); "USDC" diganti "USC (¢)", nilai lama dipetakan otomatis.
### 1.1.69–1.1.70 — 27 Sep
- **Fix:** saldo Kalkulator, Rekor transaksi, dan catatan Max DD ikut `recomputeAll()`; self-heal (`rebuildEquitySeries()` + `recomputeAll()`) jalan tiap halaman dibuka untuk data lama di localStorage.
### 1.1.67–1.1.68 — 26 Sep
- Keyboard semua dropdown kustom (`CS`, zona waktu, periode) dan grid kalender `DTP` (panah, Home/End, PageUp/PageDown, Enter/Space, Escape) + atribut ARIA.
### 1.1.66 — 26 Sep
- **Fix:** label statistik Analisis PNL saling menimpa di ≥720px. Dicek 375–1440px lewat headless Chromium.

## Riwayat per tema (v1.0.0–v1.1.65)
- **1.0.0 (baseline):** tab Ringkasan, Performa, Deposit, Transaksi, Kalkulator, Setelan.
- **1.1.0–1.1.13 (22 Sep), fondasi & tampilan:** fix filter periode bocor ke Transaksi, quick chip tanggal, section jadi kartu, pemilih periode, footer versi, perbaikan kotak dobel/layout sempit; kurva ekuitas di-crop per periode (warna ikut untung/rugi, garis datar setelah transaksi terakhir); sinkron 14 transaksi baru (416 → 430).
- **1.1.14–1.1.18 (22 Sep), penyimpanan:** data aktif ke localStorage, Reset ke Bawaan + auto-backup JSON, modal konfirmasi, data bawaan dikosongkan (~208 → ~99 KB).
- **1.1.19–1.1.27 (22–23 Sep), stat strip & kurva:** stat strip ikut periode, dropdown periode, label ATH/Bottom, sentuh, donut Split arah interaktif.
- **1.1.28–1.1.32, 1.1.36–1.1.39, 1.1.51–1.1.52 (23–25 Sep), input manual:** FAB tambah transaksi/deposit/penarikan, modal detail edit/hapus, field jurnal psikologi (Waktu Buka, Trigger, Emosi, Jenis Entry), dropdown & date-time picker kustom, ID Posisi opsional, nama file ekspor dengan jam.
- **1.1.33–1.1.35, 1.1.40–1.1.41 (25 Sep), header & kalender:** tema tersimpan, zona waktu kustom, modal detail hari.
- **1.1.42–1.1.50 (25 Sep), Laporan:** Trigger Exit; tab Laporan (tren, ringkasan, psikologi, cetak PDF) dengan periode & filter Arah sendiri; smoothing kurva (bezier/Catmull-Rom → monotone cubic Hermite); **fix kritis** tab "1 Tahun" hang (bucketing bulanan salah baca kalender GMT+8, v1.1.46).
- **1.1.53–1.1.65 (26 Sep), Analisis PNL & optimasi:** tab Analisis PNL + kalender PNL Harian, nav baru + Setelan jadi gear, stat strip digabung, `equityAt()` binary search, `Math.min/max(...array)` → loop, modul `ChartHover` bersama, sisa `<select>`/input tanggal jadi kustom (fix blank page: `CS` dipakai sebelum didefinisikan), fix PNL Kumulatif tidak ter-update.
