-- Migrasi v1.1.204: setup/strategi dan konfirmasi setup per transaksi.
-- Jalankan SEKALI di Supabase -> SQL Editor. Aman dijalankan ulang; data lama tidak berubah.
-- Setelah dijalankan, buka aplikasi -> Setelan -> Sinkron -> Kirim, supaya setup lokal ikut ke cloud.
alter table trades add column if not exists setup text;
alter table trades add column if not exists konfirmasi boolean default false;

-- Opsional: PostgREST kadang perlu memuat ulang skema agar kolom baru terlihat oleh API.
notify pgrst, 'reload schema';

-- Cek hasil (harus menampilkan dua baris: setup | text dan konfirmasi | boolean):
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'trades' and column_name in ('setup','konfirmasi')
order by column_name desc;
