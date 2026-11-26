-- =====================================================================
-- Jurnal XAUUSD — query user untuk Supabase
-- Jalankan di Supabase → SQL Editor. Blok dipisah komentar; jalankan
-- satu blok per kali (blok-blok yang dijalankan sekaligus hanya
-- menampilkan hasil query terakhir).
--
-- Catatan: SQL Editor berjalan sebagai role "postgres" (RLS dilewati),
-- jadi auth.uid() = NULL di sini. Filter user lewat email.
-- Nominal laba/cent di tabel disimpan dalam sen (¢): 100 ¢ = $1.
-- Prasyarat: schema.sql sudah dijalankan.
-- =====================================================================


-- =====================================================================
-- 1. BUAT AKUN LOGIN (jalankan SEKALI)
--    Ganti email & password di bawah. Password minimal 6 karakter.
--    Akun langsung terkonfirmasi (tanpa email verifikasi), lalu login
--    lewat Setelan → Sinkron di aplikasi.
--    Cara lain tanpa SQL: Dashboard → Authentication → Users →
--    Add user → Create new user (centang Auto Confirm User).
-- =====================================================================
-- Tanpa blok DO/dollar-quote: satu perintah biasa, aman disalin di HP.
-- Salin SEMUA sampai titik koma (;) terakhir. Bila email sudah terdaftar,
-- perintah gagal dengan "duplicate key" dan tidak mengubah apa pun.
with baru as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'EMAIL_ANDA@contoh.com',                                   -- << GANTI
    extensions.crypt('GANTI_PASSWORD_ANDA', extensions.gen_salt('bf')),  -- << GANTI
    now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  ) returning id, email
)
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from baru;


-- =====================================================================
-- 2. DAFTAR USER + JUMLAH DATA
-- =====================================================================
select
  u.email,
  u.created_at,
  u.last_sign_in_at,
  (u.email_confirmed_at is not null) as terkonfirmasi,
  (select count(*) from trades      t where t.user_id = u.id) as transaksi,
  (select count(*) from deposit_log d where d.user_id = u.id) as deposit,
  p.kurs
from auth.users u
left join pengaturan p on p.user_id = u.id
order by u.created_at desc;


-- =====================================================================
-- 3. RINGKASAN PERFORMA PER USER
-- =====================================================================
select
  u.email,
  count(*)                                             as transaksi,
  count(*) filter (where t.laba > 0)                   as menang,
  round(100.0 * count(*) filter (where t.laba > 0)
        / nullif(count(*), 0), 1)                      as win_rate_pct,
  sum(t.laba)                                          as total_laba_sen,
  round(sum(t.laba) / 100.0, 2)                        as total_laba_usd,
  round(sum(t.pips), 1)                                as total_pips,
  min(t.tanggal_gmt8)                                  as transaksi_pertama,
  max(t.tanggal_gmt8)                                  as transaksi_terakhir
from trades t
join auth.users u on u.id = t.user_id
group by u.email
order by total_laba_sen desc;


-- =====================================================================
-- 4. DATA SATU USER (ganti email). Tiga hasil: 20 transaksi terakhir,
--    PNL per bulan, saldo deposit/penarikan.
-- =====================================================================
-- 4a. 20 transaksi terakhir
select t.id, t.arah, t.lot, t.buka, t.tutup, t.pips, t.laba,
       t.tanggal_gmt8, t.emosi, t.jenis_entry
from trades t
where t.user_id = (select id from auth.users where email = 'EMAIL_ANDA@contoh.com')
order by t.tanggal_gmt8 desc
limit 20;

-- 4b. PNL per bulan (tanggal_gmt8 diawali YYYY-MM-DD)
select left(t.tanggal_gmt8, 7)             as bulan,
       count(*)                            as transaksi,
       round(sum(t.laba) / 100.0, 2)       as pnl_usd
from trades t
where t.user_id = (select id from auth.users where email = 'EMAIL_ANDA@contoh.com')
group by 1
order by 1 desc;

-- 4c. Total deposit / penarikan / kompensasi MC (dalam ¢)
select d.tipe, count(*) as jumlah, sum(d.cent) as total_sen
from deposit_log d
where d.user_id = (select id from auth.users where email = 'EMAIL_ANDA@contoh.com')
group by d.tipe;


-- =====================================================================
-- 5. CEK ANOMALI DATA
-- =====================================================================
-- Transaksi dengan nilai kosong / tidak wajar
select u.email, t.id, t.arah, t.lot, t.laba, t.tanggal_gmt8
from trades t
join auth.users u on u.id = t.user_id
where t.lot is null or t.lot <= 0
   or t.laba is null
   or t.arah not in ('Beli', 'Jual')
   or t.tanggal_gmt8 !~ '^\d{4}-\d{2}-\d{2}'
order by u.email, t.tanggal_gmt8;

-- Transaksi yatim (user sudah dihapus) — seharusnya 0 baris
select count(*) as yatim
from trades t
left join auth.users u on u.id = t.user_id
where u.id is null;


-- =====================================================================
-- 6. VERIFIKASI KEAMANAN (RLS)
--    Ketiga tabel harus rls_aktif = true dan punya policy "own ...".
-- =====================================================================
select c.relname as tabel, c.relrowsecurity as rls_aktif
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('trades', 'deposit_log', 'pengaturan');

select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('trades', 'deposit_log', 'pengaturan');


-- =====================================================================
-- 7. OPSIONAL: INDEKS (mempercepat tarikan data bila transaksi banyak)
--    Aman dijalankan ulang.
-- =====================================================================
create index if not exists trades_user_tanggal_idx
  on trades (user_id, tanggal_gmt8);


-- =====================================================================
-- 8. RESET PASSWORD USER (ganti email & password baru)
-- =====================================================================
update auth.users
set encrypted_password = extensions.crypt('PASSWORD_BARU', extensions.gen_salt('bf')),
    updated_at = now()
where email = 'EMAIL_ANDA@contoh.com';


-- =====================================================================
-- 9. HAPUS DATA / USER — PERMANEN, TIDAK BISA DIBATALKAN
--    Jalankan hanya setelah backup JSON dari aplikasi. Hapus user
--    lewat Dashboard → Authentication → Users lebih aman; SQL di bawah
--    hanya mengosongkan data cloud satu user.
-- =====================================================================
-- delete from trades      where user_id = (select id from auth.users where email = 'EMAIL_ANDA@contoh.com');
-- delete from deposit_log where user_id = (select id from auth.users where email = 'EMAIL_ANDA@contoh.com');
-- delete from pengaturan  where user_id = (select id from auth.users where email = 'EMAIL_ANDA@contoh.com');
