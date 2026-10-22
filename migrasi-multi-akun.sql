-- Migrasi v1.1.194: sinkron cloud per akun trading (Cent / USD / Rupiah).
-- Jalankan SEKALI di Supabase -> SQL Editor. Aman dijalankan ulang. Data lama TIDAK hilang: semua baris lama
-- otomatis menjadi milik akun 'utama' (Akun utama di aplikasi).
-- Setelah dijalankan, buka aplikasi di tiap akun -> Setelan -> Akun -> Sinkronkan ke cloud.

-- 1. Daftar akun per pengguna
create table if not exists akun (
  user_id uuid not null default auth.uid() references auth.users,
  id text not null,
  nama text,
  tipe text,
  kurs numeric,
  primary key (user_id, id)
);
alter table akun enable row level security;
drop policy if exists "own akun" on akun;
create policy "own akun" on akun for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Kolom account_id (baris lama = 'utama')
alter table trades      add column if not exists account_id text not null default 'utama';
alter table deposit_log add column if not exists account_id text not null default 'utama';
alter table pengaturan  add column if not exists account_id text not null default 'utama';

-- 3. Kunci utama baru yang memuat account_id (hanya bila belum)
do $$
begin
  if not exists (select 1 from information_schema.key_column_usage k
      join information_schema.table_constraints c on c.constraint_name = k.constraint_name and c.table_schema = k.table_schema
      where c.table_schema = 'public' and c.table_name = 'trades' and c.constraint_type = 'PRIMARY KEY' and k.column_name = 'account_id') then
    alter table trades drop constraint trades_pkey;
    alter table trades add primary key (user_id, account_id, id);
  end if;
  if not exists (select 1 from information_schema.key_column_usage k
      join information_schema.table_constraints c on c.constraint_name = k.constraint_name and c.table_schema = k.table_schema
      where c.table_schema = 'public' and c.table_name = 'deposit_log' and c.constraint_type = 'PRIMARY KEY' and k.column_name = 'account_id') then
    alter table deposit_log drop constraint deposit_log_pkey;
    alter table deposit_log add primary key (user_id, account_id, tanggal, tipe, cent);
  end if;
  if not exists (select 1 from information_schema.key_column_usage k
      join information_schema.table_constraints c on c.constraint_name = k.constraint_name and c.table_schema = k.table_schema
      where c.table_schema = 'public' and c.table_name = 'pengaturan' and c.constraint_type = 'PRIMARY KEY' and k.column_name = 'account_id') then
    alter table pengaturan drop constraint pengaturan_pkey;
    alter table pengaturan add primary key (user_id, account_id);
  end if;
end $$;

-- 4. Akun utama untuk pengguna yang sudah punya data
insert into akun (user_id, id, nama, tipe, kurs)
select p.user_id, 'utama', 'Akun utama', 'cent', p.kurs from pengaturan p where p.account_id = 'utama'
on conflict (user_id, id) do nothing;

notify pgrst, 'reload schema';

-- Cek hasil (harus ada account_id di ketiga tabel):
select table_name, column_name from information_schema.columns
where table_schema = 'public' and column_name = 'account_id' order by table_name;
