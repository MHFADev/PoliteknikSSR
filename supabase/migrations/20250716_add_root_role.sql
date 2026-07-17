-- =====================================================================
-- MIGRATION: Add 'root' role + approved column to profiles
-- =====================================================================

-- 1. Add 'root' to user_role enum (safe — does nothing if exists)
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'root';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add approved column to profiles (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean not null default false;

-- 3. Update all admin RLS policies to include 'root'
-- (Each policy is dropped & recreated to include 'root')

-- profiles
drop policy if exists "profiles: admin kelola semua profil" on public.profiles;
create policy "profiles: admin kelola semua profil"
  on public.profiles for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

drop policy if exists "profiles: admin & pembimbing lihat semua" on public.profiles;
create policy "profiles: admin & pembimbing lihat semua"
  on public.profiles for select
  using (public.current_role() in ('admin', 'pembimbing', 'owner', 'root'));

-- student_mentors
drop policy if exists "student_mentors: pihak terkait & admin bisa lihat" on public.student_mentors;
create policy "student_mentors: pihak terkait & admin bisa lihat"
  on public.student_mentors for select
  using (
    student_id = auth.uid()
    or mentor_id = auth.uid()
    or public.current_role() in ('admin', 'owner', 'root')
  );

drop policy if exists "student_mentors: hanya admin kelola relasi" on public.student_mentors;
create policy "student_mentors: hanya admin kelola relasi"
  on public.student_mentors for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- attendance_sessions
drop policy if exists "sesi: hanya admin generate/kelola QR" on public.attendance_sessions;
create policy "sesi: hanya admin generate/kelola QR"
  on public.attendance_sessions for insert
  with check (public.current_role() in ('admin', 'owner', 'root'));

drop policy if exists "sesi: hanya admin update/hapus" on public.attendance_sessions;
create policy "sesi: hanya admin update/hapus"
  on public.attendance_sessions for update
  using (public.current_role() in ('admin', 'owner', 'root'));

drop policy if exists "sesi: hanya admin hapus" on public.attendance_sessions;
create policy "sesi: hanya admin hapus"
  on public.attendance_sessions for delete
  using (public.current_role() in ('admin', 'owner', 'root'));

-- attendance_records
drop policy if exists "presensi: admin lihat semua" on public.attendance_records;
create policy "presensi: admin lihat semua"
  on public.attendance_records for select
  using (public.current_role() in ('admin', 'owner', 'root'));

-- leave_requests
drop policy if exists "izin: admin full akses" on public.leave_requests;
create policy "izin: admin full akses"
  on public.leave_requests for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- logbook_entries
drop policy if exists "logbook: admin full akses" on public.logbook_entries;
create policy "logbook: admin full akses"
  on public.logbook_entries for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- allowed_locations
drop policy if exists "lokasi: hanya admin kelola" on public.allowed_locations;
create policy "lokasi: hanya admin kelola"
  on public.allowed_locations for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- study_programs
drop policy if exists "study_programs: hanya admin kelola" on public.study_programs;
create policy "study_programs: hanya admin kelola"
  on public.study_programs for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- calendar_events
drop policy if exists "calendar_events: hanya admin kelola" on public.calendar_events;
create policy "calendar_events: hanya admin kelola"
  on public.calendar_events for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- announcements
drop policy if exists "announcements: admin & pembimbing lihat semua" on public.announcements;
create policy "announcements: admin & pembimbing lihat semua"
  on public.announcements for select
  using (public.current_role() in ('admin', 'pembimbing', 'owner', 'root'));

drop policy if exists "announcements: hanya admin insert" on public.announcements;
create policy "announcements: hanya admin insert"
  on public.announcements for insert
  with check (public.current_role() in ('admin', 'owner', 'root'));

drop policy if exists "announcements: hanya admin update" on public.announcements;
create policy "announcements: hanya admin update"
  on public.announcements for update
  using (public.current_role() in ('admin', 'owner', 'root'));

drop policy if exists "announcements: hanya admin delete" on public.announcements;
create policy "announcements: hanya admin delete"
  on public.announcements for delete
  using (public.current_role() in ('admin', 'owner', 'root'));

-- announcement_recipients
drop policy if exists "announcement_recipients: admin full akses" on public.announcement_recipients;
create policy "announcement_recipients: admin full akses"
  on public.announcement_recipients for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- student_documents
drop policy if exists "student_documents: admin full akses" on public.student_documents;
create policy "student_documents: admin full akses"
  on public.student_documents for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));

-- storage: student-documents
drop policy if exists "storage: admin upload student-documents" on storage.objects;
create policy "storage: admin upload student-documents"
  on storage.objects for insert
  with check (
    bucket_id = 'student-documents'
    and public.current_role() in ('admin', 'owner', 'root')
  );

drop policy if exists "storage: admin manage student-documents" on storage.objects;
create policy "storage: admin manage student-documents"
  on storage.objects for all
  using (
    bucket_id = 'student-documents'
    and public.current_role() in ('admin', 'owner', 'root')
  );
