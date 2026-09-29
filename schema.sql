-- Jalankan sekali di Supabase → SQL Editor. Aman dijalankan ulang.
create table if not exists trades (
  user_id uuid not null default auth.uid() references auth.users,
  id text not null,
  arah text, lot numeric, buka numeric, tutup numeric,
  pips numeric, laba numeric,
  tanggal text, tanggal_gmt8 text, waktu_buka text,
  "trigger" text, trigger_exit text, emosi text, jenis_entry text,
  catatan text,
  primary key (user_id, id)
);
-- v1.1.129: untuk tabel trades yang sudah ada sebelum kolom catatan (catatan bebas per transaksi). Aman dijalankan ulang.
alter table trades add column if not exists catatan text;

create table if not exists deposit_log (
  user_id uuid not null default auth.uid() references auth.users,
  tanggal text not null, tipe text not null,
  jenis text, usd numeric, cent numeric not null,
  primary key (user_id, tanggal, tipe, cent)
);
create table if not exists pengaturan (
  user_id uuid primary key default auth.uid() references auth.users,
  kurs numeric
);

alter table trades enable row level security;
alter table deposit_log enable row level security;
alter table pengaturan enable row level security;

drop policy if exists "own trades" on trades;
drop policy if exists "own deposit" on deposit_log;
drop policy if exists "own pengaturan" on pengaturan;
create policy "own trades" on trades for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own deposit" on deposit_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own pengaturan" on pengaturan for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
