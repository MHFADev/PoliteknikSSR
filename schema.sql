-- =====================================================================
-- POLITEKNIK SSR — Skema Database PKL Management Dashboard
-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query)
-- Urutan penting: tipe -> tabel -> index -> trigger -> RLS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('siswa', 'pembimbing', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('hadir', 'telat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_type as enum ('izin', 'sakit', 'cuti');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_status as enum ('pending', 'disetujui', 'ditolak');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABEL: profiles
-- Perluasan dari auth.users. 1 baris profil = 1 akun.
-- Akun dibuat oleh Admin lewat Supabase Admin API / dashboard, BUKAN sign-up publik.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'siswa',
  identity_number text, -- NIS untuk siswa, NIP/NIDN untuk pembimbing
  instansi text, -- nama perusahaan/instansi tempat PKL (khusus siswa)
  kelas text, -- kelas siswa
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Data identitas & role tiap pengguna, 1:1 dengan auth.users';

-- Trigger: auto-buat baris profile kosong saat Admin membuat user baru di Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'siswa')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. TABEL: student_mentors
-- Relasi siswa <-> pembimbing, dipakai untuk membatasi akses RLS pembimbing
-- hanya ke siswa bimbingannya.
-- ---------------------------------------------------------------------
create table if not exists public.student_mentors (
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (student_id, mentor_id)
);

-- ---------------------------------------------------------------------
-- 4. TABEL: attendance_sessions
-- Satu baris = satu sesi QR harian yang di-generate Admin.
-- ---------------------------------------------------------------------
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null default current_date,
  token text not null unique, -- token terenkripsi/HMAC, lihat lib/qr-token.ts
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (session_date)
);

comment on table public.attendance_sessions is 'Sesi QR presensi harian, 1 sesi aktif per hari';

-- ---------------------------------------------------------------------
-- 5. TABEL: attendance_records
-- Hasil scan siswa. unique(session_id, student_id) mencegah presensi ganda.
-- ---------------------------------------------------------------------
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.attendance_status not null default 'hadir',
  scanned_at timestamptz not null default now(),
  device_info text,
  unique (session_id, student_id)
);

create index if not exists idx_attendance_records_student on public.attendance_records(student_id);
create index if not exists idx_attendance_records_session on public.attendance_records(session_id);

-- ---------------------------------------------------------------------
-- 6. TABEL: leave_requests
-- ---------------------------------------------------------------------
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  type public.leave_type not null,
  reason text not null,
  start_date date not null,
  end_date date not null,
  proof_path text, -- path di Supabase Storage (bucket: leave-proofs)
  proof_url text, -- public URL hasil getPublicUrl()
  status public.leave_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  constraint chk_leave_dates check (end_date >= start_date)
);

create index if not exists idx_leave_requests_student on public.leave_requests(student_id);
create index if not exists idx_leave_requests_status on public.leave_requests(status);

-- ---------------------------------------------------------------------
-- 7. TABEL: logbook_entries
-- 1 entri per siswa per tanggal.
-- ---------------------------------------------------------------------
create table if not exists public.logbook_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default current_date,
  content text not null,
  grade smallint check (grade between 0 and 100),
  feedback text,
  graded_by uuid references public.profiles(id),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, entry_date)
);

create index if not exists idx_logbook_student on public.logbook_entries(student_id);
create index if not exists idx_logbook_date on public.logbook_entries(entry_date);

-- =====================================================================
-- 8. TABEL: allowed_locations
-- Lokasi yang diizinkan untuk presensi berbasis GPS.
-- Admin bisa menambahkan beberapa titik lokasi (misal: gedung kampus, lab, dll)
-- =====================================================================
create table if not exists public.allowed_locations (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters double precision not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.allowed_locations is 'Titik lokasi yang diizinkan untuk verifikasi GPS saat login/absensi';

-- =====================================================================
-- 9. HELPER FUNCTIONS (dipakai di RLS policy — security definer agar
--    tidak terjadi rekursi saat query ke tabel profiles di dalam policy)
-- =====================================================================
create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_mentor_of(target_student_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.student_mentors
    where mentor_id = auth.uid() and student_id = target_student_id
  );
$$;

-- =====================================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.student_mentors enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.logbook_entries enable row level security;
alter table public.allowed_locations enable row level security;

-- --- profiles ---------------------------------------------------------
create policy "profiles: user lihat profil sendiri"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: admin & pembimbing lihat semua"
  on public.profiles for select
  using (public.current_role() in ('admin', 'pembimbing'));

create policy "profiles: user update profil sendiri"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin kelola semua profil"
  on public.profiles for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- student_mentors ---------------------------------------------------
create policy "student_mentors: pihak terkait & admin bisa lihat"
  on public.student_mentors for select
  using (
    student_id = auth.uid()
    or mentor_id = auth.uid()
    or public.current_role() = 'admin'
  );

create policy "student_mentors: hanya admin kelola relasi"
  on public.student_mentors for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- attendance_sessions -------------------------------------------------
create policy "sesi: semua role login boleh lihat sesi aktif"
  on public.attendance_sessions for select
  using (auth.uid() is not null);

create policy "sesi: hanya admin generate/kelola QR"
  on public.attendance_sessions for insert
  with check (public.current_role() = 'admin');

create policy "sesi: hanya admin update/hapus"
  on public.attendance_sessions for update
  using (public.current_role() = 'admin');

create policy "sesi: hanya admin hapus"
  on public.attendance_sessions for delete
  using (public.current_role() = 'admin');

-- --- attendance_records --------------------------------------------------
create policy "presensi: siswa lihat presensi sendiri"
  on public.attendance_records for select
  using (student_id = auth.uid());

create policy "presensi: pembimbing lihat siswa bimbingannya"
  on public.attendance_records for select
  using (public.is_mentor_of(student_id));

create policy "presensi: admin lihat semua"
  on public.attendance_records for select
  using (public.current_role() = 'admin');

create policy "presensi: siswa insert presensi sendiri via scan"
  on public.attendance_records for insert
  with check (student_id = auth.uid());

-- --- leave_requests --------------------------------------------------------
create policy "izin: siswa CRUD milik sendiri (kecuali status)"
  on public.leave_requests for select
  using (student_id = auth.uid());

create policy "izin: siswa insert pengajuan sendiri"
  on public.leave_requests for insert
  with check (student_id = auth.uid());

create policy "izin: siswa update sebelum direview"
  on public.leave_requests for update
  using (student_id = auth.uid() and status = 'pending')
  with check (student_id = auth.uid());

create policy "izin: pembimbing lihat siswa bimbingannya"
  on public.leave_requests for select
  using (public.is_mentor_of(student_id));

create policy "izin: pembimbing approve/reject siswa bimbingannya"
  on public.leave_requests for update
  using (public.is_mentor_of(student_id));

create policy "izin: admin full akses"
  on public.leave_requests for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- logbook_entries -------------------------------------------------------
create policy "logbook: siswa CRUD entri sendiri"
  on public.logbook_entries for select
  using (student_id = auth.uid());

create policy "logbook: siswa insert entri sendiri"
  on public.logbook_entries for insert
  with check (student_id = auth.uid());

create policy "logbook: siswa update entri sendiri sebelum dinilai"
  on public.logbook_entries for update
  using (student_id = auth.uid() and graded_at is null)
  with check (student_id = auth.uid());

create policy "logbook: pembimbing lihat & nilai siswa bimbingannya"
  on public.logbook_entries for select
  using (public.is_mentor_of(student_id));

create policy "logbook: pembimbing update nilai siswa bimbingannya"
  on public.logbook_entries for update
  using (public.is_mentor_of(student_id));

create policy "logbook: admin full akses"
  on public.logbook_entries for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- allowed_locations -------------------------------------------------
create policy "lokasi: semua role login boleh lihat"
  on public.allowed_locations for select
  using (auth.uid() is not null);

create policy "lokasi: hanya admin kelola"
  on public.allowed_locations for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- =====================================================================
-- 11. STORAGE BUCKET (dijalankan sekali, aman jika diulang)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('leave-proofs', 'leave-proofs', true)
on conflict (id) do nothing;

-- Policy storage: siswa hanya boleh upload ke folder dengan prefix uid miliknya
create policy "storage: siswa upload bukti izin sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'leave-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: siapa saja yang login boleh baca bukti izin"
  on storage.objects for select
  using (bucket_id = 'leave-proofs' and auth.uid() is not null);

-- =====================================================================
-- SELESAI. Langkah selanjutnya:
-- 1. Buat user pertama (role admin) lewat Supabase Dashboard > Authentication > Add user,
--    lalu update kolom role di tabel profiles menjadi 'admin' untuk user tsb.
-- 2. Isi tabel student_mentors untuk memetakan siswa ke pembimbingnya.
-- =====================================================================
