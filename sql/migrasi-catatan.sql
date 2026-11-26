-- Migrasi v1.1.129: catatan bebas per transaksi.
-- Jalankan SEKALI di Supabase -> SQL Editor. Aman dijalankan ulang; data lama tidak berubah.
-- Setelah dijalankan, buka aplikasi -> Setelan -> Sinkron -> Kirim, supaya catatan lokal ikut ke cloud.
alter table trades add column if not exists catatan text;

-- Opsional: PostgREST kadang perlu memuat ulang skema agar kolom baru terlihat oleh API.
notify pgrst, 'reload schema';

-- Cek hasil (harus menampilkan satu baris: catatan | text):
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'trades' and column_name = 'catatan';
