-- Migrasi v1.1.206: pengaturan trading ikut tersinkron (aturan trading, batas harian, opsi kustom, target, jendela berita, dll.).
-- Jalankan SEKALI di Supabase -> SQL Editor. Aman dijalankan ulang; data lama tidak berubah.
-- Setelah dijalankan, buka aplikasi -> Setelan -> Sinkron -> Kirim, supaya pengaturan di perangkat ini ikut ke cloud.
alter table pengaturan add column if not exists setelan text;

-- Opsional: PostgREST kadang perlu memuat ulang skema agar kolom baru terlihat oleh API.
notify pgrst, 'reload schema';

-- Cek hasil (harus menampilkan satu baris: setelan | text):
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'pengaturan' and column_name = 'setelan';
