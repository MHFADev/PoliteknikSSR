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
  create type public.user_role as enum ('siswa', 'pembimbing', 'admin', 'owner', 'root');
-- After creation, if 'root' needs to be added later:
-- ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'root';
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
  approved boolean not null default false,
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
  insert into public.profiles (id, full_name, role, approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'siswa'),
    coalesce((new.raw_user_meta_data->>'approved')::boolean, true)
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
drop policy if exists "profiles: user lihat profil sendiri" on public.profiles;
create policy "profiles: user lihat profil sendiri"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles: admin & pembimbing lihat semua" on public.profiles;
create policy "profiles: admin & pembimbing lihat semua"
  on public.profiles for select
  using (public.current_role() in ('admin', 'pembimbing'));

drop policy if exists "profiles: user update profil sendiri" on public.profiles;
create policy "profiles: user update profil sendiri"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: admin kelola semua profil" on public.profiles;
create policy "profiles: admin kelola semua profil"
  on public.profiles for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- student_mentors ---------------------------------------------------
drop policy if exists "student_mentors: pihak terkait & admin bisa lihat" on public.student_mentors;
create policy "student_mentors: pihak terkait & admin bisa lihat"
  on public.student_mentors for select
  using (
    student_id = auth.uid()
    or mentor_id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists "student_mentors: hanya admin kelola relasi" on public.student_mentors;
create policy "student_mentors: hanya admin kelola relasi"
  on public.student_mentors for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- attendance_sessions -------------------------------------------------
drop policy if exists "sesi: semua role login boleh lihat sesi aktif" on public.attendance_sessions;
create policy "sesi: semua role login boleh lihat sesi aktif"
  on public.attendance_sessions for select
  using (auth.uid() is not null);

drop policy if exists "sesi: hanya admin generate/kelola QR" on public.attendance_sessions;
create policy "sesi: hanya admin generate/kelola QR"
  on public.attendance_sessions for insert
  with check (public.current_role() = 'admin');

drop policy if exists "sesi: hanya admin update/hapus" on public.attendance_sessions;
create policy "sesi: hanya admin update/hapus"
  on public.attendance_sessions for update
  using (public.current_role() = 'admin');

drop policy if exists "sesi: hanya admin hapus" on public.attendance_sessions;
create policy "sesi: hanya admin hapus"
  on public.attendance_sessions for delete
  using (public.current_role() = 'admin');

-- --- attendance_records --------------------------------------------------
drop policy if exists "presensi: siswa lihat presensi sendiri" on public.attendance_records;
create policy "presensi: siswa lihat presensi sendiri"
  on public.attendance_records for select
  using (student_id = auth.uid());

drop policy if exists "presensi: pembimbing lihat siswa bimbingannya" on public.attendance_records;
create policy "presensi: pembimbing lihat siswa bimbingannya"
  on public.attendance_records for select
  using (public.is_mentor_of(student_id));

drop policy if exists "presensi: admin lihat semua" on public.attendance_records;
create policy "presensi: admin lihat semua"
  on public.attendance_records for select
  using (public.current_role() = 'admin');

drop policy if exists "presensi: siswa insert presensi sendiri via scan" on public.attendance_records;
create policy "presensi: siswa insert presensi sendiri via scan"
  on public.attendance_records for insert
  with check (student_id = auth.uid());

-- --- leave_requests --------------------------------------------------------
drop policy if exists "izin: siswa CRUD milik sendiri (kecuali status)" on public.leave_requests;
create policy "izin: siswa CRUD milik sendiri (kecuali status)"
  on public.leave_requests for select
  using (student_id = auth.uid());

drop policy if exists "izin: siswa insert pengajuan sendiri" on public.leave_requests;
create policy "izin: siswa insert pengajuan sendiri"
  on public.leave_requests for insert
  with check (student_id = auth.uid());

drop policy if exists "izin: siswa update sebelum direview" on public.leave_requests;
create policy "izin: siswa update sebelum direview"
  on public.leave_requests for update
  using (student_id = auth.uid() and status = 'pending')
  with check (student_id = auth.uid());

drop policy if exists "izin: pembimbing lihat siswa bimbingannya" on public.leave_requests;
create policy "izin: pembimbing lihat siswa bimbingannya"
  on public.leave_requests for select
  using (public.is_mentor_of(student_id));

drop policy if exists "izin: pembimbing approve/reject siswa bimbingannya" on public.leave_requests;
create policy "izin: pembimbing approve/reject siswa bimbingannya"
  on public.leave_requests for update
  using (public.is_mentor_of(student_id));

drop policy if exists "izin: admin full akses" on public.leave_requests;
create policy "izin: admin full akses"
  on public.leave_requests for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- logbook_entries -------------------------------------------------------
drop policy if exists "logbook: siswa CRUD entri sendiri" on public.logbook_entries;
create policy "logbook: siswa CRUD entri sendiri"
  on public.logbook_entries for select
  using (student_id = auth.uid());

drop policy if exists "logbook: siswa insert entri sendiri" on public.logbook_entries;
create policy "logbook: siswa insert entri sendiri"
  on public.logbook_entries for insert
  with check (student_id = auth.uid());

drop policy if exists "logbook: siswa update entri sendiri sebelum dinilai" on public.logbook_entries;
create policy "logbook: siswa update entri sendiri sebelum dinilai"
  on public.logbook_entries for update
  using (student_id = auth.uid() and graded_at is null)
  with check (student_id = auth.uid());

drop policy if exists "logbook: pembimbing lihat & nilai siswa bimbingannya" on public.logbook_entries;
create policy "logbook: pembimbing lihat & nilai siswa bimbingannya"
  on public.logbook_entries for select
  using (public.is_mentor_of(student_id));

drop policy if exists "logbook: pembimbing update nilai siswa bimbingannya" on public.logbook_entries;
create policy "logbook: pembimbing update nilai siswa bimbingannya"
  on public.logbook_entries for update
  using (public.is_mentor_of(student_id));

drop policy if exists "logbook: admin full akses" on public.logbook_entries;
create policy "logbook: admin full akses"
  on public.logbook_entries for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- --- allowed_locations -------------------------------------------------
drop policy if exists "lokasi: semua role login boleh lihat" on public.allowed_locations;
create policy "lokasi: semua role login boleh lihat"
  on public.allowed_locations for select
  using (auth.uid() is not null);

drop policy if exists "lokasi: hanya admin kelola" on public.allowed_locations;
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

-- Bucket untuk upload foto logbook kegiatan harian siswa
insert into storage.buckets (id, name, public)
values ('logbook_photos', 'logbook_photos', true)
on conflict (id) do nothing;

-- Storage policy: siswa upload foto logbook sendiri
drop policy if exists "storage: siswa upload foto logbook sendiri" on storage.objects;
create policy "storage: siswa upload foto logbook sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'logbook_photos'
    and auth.uid() is not null
  );

-- Storage policy: siswa update foto logbook sendiri
drop policy if exists "storage: siswa update foto logbook sendiri" on storage.objects;
create policy "storage: siswa update foto logbook sendiri"
  on storage.objects for update
  using (
    bucket_id = 'logbook_photos'
    and auth.uid() is not null
  );

-- Storage policy: semua login boleh lihat foto logbook
drop policy if exists "storage: semua login lihat foto logbook" on storage.objects;
create policy "storage: semua login lihat foto logbook"
  on storage.objects for select
  using (bucket_id = 'logbook_photos' and auth.uid() is not null);

-- Policy storage: leave-proofs
drop policy if exists "storage: siswa upload bukti izin sendiri" on storage.objects;
create policy "storage: siswa upload bukti izin sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'leave-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage: siapa saja yang login boleh baca bukti izin" on storage.objects;
create policy "storage: siapa saja yang login boleh baca bukti izin"
  on storage.objects for select
  using (bucket_id = 'leave-proofs' and auth.uid() is not null);

-- =====================================================================
-- 12. TABEL: study_programs
-- Daftar jurusan/program studi di Politeknik SSR.
-- =====================================================================
create table if not exists public.study_programs (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  kode text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.study_programs is 'Daftar jurusan / program studi';

-- Insert program studi default
insert into public.study_programs (nama, kode) values
  ('D4 Animation', 'D4-ANM'),
  ('D4 Tourism Destination', 'D4-TD'),
  ('D3 Visual Communication Design', 'D3-VCD'),
  ('D4 Film & Television', 'D4-FTV'),
  ('D4 Management Hotel', 'D4-MH'),
  ('D4 Robotic & AI', 'D4-RAI')
on conflict (kode) do nothing;

-- Tambah kolom jurusan_id ke profiles
alter table public.profiles add column if not exists jurusan_id uuid references public.study_programs(id) on delete set null;

-- =====================================================================
-- 13. TABEL: calendar_events
-- Event / hari libur PKL yang ditampilkan di kalender.
-- Tipe event:
--   - libur    : hari libur PKL (hijau)
--   - event    : event khusus (biru)
-- Jika student_id diisi, event khusus untuk siswa tsb.
-- Jika student_id NULL, event berlaku untuk semua (libur nasional dll).
-- =====================================================================
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  end_date date, -- nullable, untuk event multi-hari
  tipe text not null default 'event' check (tipe in ('libur', 'event')),
  student_id uuid references public.profiles(id) on delete cascade, -- null = global
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_date on public.calendar_events(event_date);

comment on table public.calendar_events is 'Event dan hari libur PKL yang tampil di kalender';

-- =====================================================================
-- 14. TABEL: announcements
-- Pengumuman yang di-broadcast oleh admin ke siswa.
-- =====================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  broadcast_to_all boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_created on public.announcements(created_at desc);

comment on table public.announcements is 'Broadcast pengumuman dari admin ke siswa';

-- =====================================================================
-- 15. TABEL: announcement_recipients
-- Menentukan jurusan mana saja yang menerima suatu pengumuman.
-- Jika broadcast_to_all = true di announcements, tabel ini bisa kosong.
-- =====================================================================
create table if not exists public.announcement_recipients (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  study_program_id uuid not null references public.study_programs(id) on delete cascade,
  unique (announcement_id, study_program_id)
);

comment on table public.announcement_recipients is 'Target jurusan penerima pengumuman';

-- =====================================================================
-- 12b. RLS: study_programs
-- =====================================================================
alter table public.study_programs enable row level security;

drop policy if exists "study_programs: semua login boleh lihat" on public.study_programs;
create policy "study_programs: semua login boleh lihat"
  on public.study_programs for select
  using (auth.uid() is not null);

drop policy if exists "study_programs: hanya admin kelola" on public.study_programs;
create policy "study_programs: hanya admin kelola"
  on public.study_programs for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- =====================================================================
-- 13b. RLS: calendar_events
-- =====================================================================
alter table public.calendar_events enable row level security;

drop policy if exists "calendar_events: semua role login boleh lihat" on public.calendar_events;
create policy "calendar_events: semua role login boleh lihat"
  on public.calendar_events for select
  using (auth.uid() is not null);

drop policy if exists "calendar_events: hanya admin kelola" on public.calendar_events;
create policy "calendar_events: hanya admin kelola"
  on public.calendar_events for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- =====================================================================
-- 14b. RLS: announcements
-- =====================================================================
alter table public.announcements enable row level security;

drop policy if exists "announcements: admin & pembimbing lihat semua" on public.announcements;
create policy "announcements: admin & pembimbing lihat semua"
  on public.announcements for select
  using (public.current_role() in ('admin', 'pembimbing'));

drop policy if exists "announcements: siswa lihat pengumuman untuk jurusannya" on public.announcements;
create policy "announcements: siswa lihat pengumuman untuk jurusannya"
  on public.announcements for select
  using (
    broadcast_to_all = true
    or exists (
      select 1 from public.announcement_recipients ar
      join public.profiles p on p.jurusan_id = ar.study_program_id
      where ar.announcement_id = announcements.id and p.id = auth.uid()
    )
  );

drop policy if exists "announcements: hanya admin insert" on public.announcements;
create policy "announcements: hanya admin insert"
  on public.announcements for insert
  with check (public.current_role() = 'admin');

drop policy if exists "announcements: hanya admin update" on public.announcements;
create policy "announcements: hanya admin update"
  on public.announcements for update
  using (public.current_role() = 'admin');

drop policy if exists "announcements: hanya admin delete" on public.announcements;
create policy "announcements: hanya admin delete"
  on public.announcements for delete
  using (public.current_role() = 'admin');

-- =====================================================================
-- 15b. RLS: announcement_recipients
-- =====================================================================
alter table public.announcement_recipients enable row level security;

drop policy if exists "announcement_recipients: admin full akses" on public.announcement_recipients;
create policy "announcement_recipients: admin full akses"
  on public.announcement_recipients for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists "announcement_recipients: semua login boleh lihat" on public.announcement_recipients;
create policy "announcement_recipients: semua login boleh lihat"
  on public.announcement_recipients for select
  using (auth.uid() is not null);

-- =====================================================================
-- 16. BUCKET: avatars
-- Bucket untuk upload foto profil pengguna.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policy: user bisa upload/mengupdate avatar sendiri
drop policy if exists "storage: user upload avatar sendiri" on storage.objects;
create policy "storage: user upload avatar sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: user bisa update avatar sendiri (upsert)
drop policy if exists "storage: user update avatar sendiri" on storage.objects;
create policy "storage: user update avatar sendiri"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: semua yang login bisa lihat avatar
drop policy if exists "storage: semua login boleh lihat avatar" on storage.objects;
create policy "storage: semua login boleh lihat avatar"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid() is not null);

-- =====================================================================
-- 17. TABEL: student_documents
-- Dokumen yang dikirim admin ke siswa (sertifikat PKL & rekap nilai).
-- File dihapus otomatis setelah expires_at (2 hari sejak dibuat),
-- kecuali is_kept = true (siswa menyimpan manual).
-- =====================================================================
create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  type text not null check (type in ('certificate', 'grade_summary')),
  file_url text,
  file_name text,
  grade_data jsonb, -- { subjects: [{name, score, grade}], notes: string }
  is_kept boolean not null default false,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days')
);

create index if not exists idx_student_documents_student on public.student_documents(student_id);
create index if not exists idx_student_documents_expires on public.student_documents(expires_at);

comment on table public.student_documents is 'Sertifikat PKL & rekap nilai yang dikirim admin ke siswa';

-- =====================================================================
-- 17b. RLS: student_documents
-- =====================================================================
alter table public.student_documents enable row level security;

drop policy if exists "student_documents: admin full akses" on public.student_documents;
create policy "student_documents: admin full akses"
  on public.student_documents for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

drop policy if exists "student_documents: siswa lihat dokumen sendiri" on public.student_documents;
create policy "student_documents: siswa lihat dokumen sendiri"
  on public.student_documents for select
  using (student_id = auth.uid());

drop policy if exists "student_documents: siswa update dokumen sendiri" on public.student_documents;
create policy "student_documents: siswa update dokumen sendiri"
  on public.student_documents for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- =====================================================================
-- 18. BUCKET: student-documents
-- Bucket untuk menyimpan file sertifikat & rekap nilai.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('student-documents', 'student-documents', true)
on conflict (id) do nothing;

-- Storage policy: admin bisa upload file
drop policy if exists "storage: admin upload student-documents" on storage.objects;
create policy "storage: admin upload student-documents"
  on storage.objects for insert
  with check (
    bucket_id = 'student-documents'
    and public.current_role() in ('admin', 'owner')
  );

-- Storage policy: admin bisa update/hapus file
drop policy if exists "storage: admin manage student-documents" on storage.objects;
create policy "storage: admin manage student-documents"
  on storage.objects for all
  using (
    bucket_id = 'student-documents'
    and public.current_role() in ('admin', 'owner')
  );

-- Storage policy: semua login boleh lihat file (untuk download siswa)
drop policy if exists "storage: semua login lihat student-documents" on storage.objects;
create policy "storage: semua login lihat student-documents"
  on storage.objects for select
  using (bucket_id = 'student-documents' and auth.uid() is not null);

-- =====================================================================
-- 19. TABEL: classes
-- Daftar kelas yang tersedia (10, 11, 12, dll)
-- =====================================================================
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.classes is 'Daftar kelas yang tersedia';

insert into public.classes (nama) values ('10'), ('11'), ('12')
on conflict (nama) do nothing;

alter table public.classes enable row level security;

drop policy if exists "classes: semua login boleh lihat" on public.classes;
create policy "classes: semua login boleh lihat"
  on public.classes for select
  using (auth.uid() is not null);

drop policy if exists "classes: admin/root/owner kelola" on public.classes;
create policy "classes: admin/root/owner kelola"
  on public.classes for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- =====================================================================
-- SELESAI. Langkah selanjutnya:
-- 1. Buat user pertama (role admin) lewat Supabase Dashboard > Authentication > Add user,
--    lalu update kolom role di tabel profiles menjadi 'admin' untuk user tsb.
-- 2. Isi tabel student_mentors untuk memetakan siswa ke pembimbingnya.
-- =====================================================================
