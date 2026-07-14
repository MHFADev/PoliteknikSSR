-- =====================================================================
-- MIGRATION: Add 'owner' to all admin RLS policies
-- Jalankan di Supabase SQL Editor
-- =====================================================================

-- 1. profiles: admin kelola semua profil
drop policy if exists "profiles: admin kelola semua profil" on public.profiles;
create policy "profiles: admin kelola semua profil"
  on public.profiles for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 2. profiles: admin & pembimbing lihat semua (tambah owner)
drop policy if exists "profiles: admin & pembimbing lihat semua" on public.profiles;
create policy "profiles: admin & pembimbing lihat semua"
  on public.profiles for select
  using (public.current_role() in ('admin', 'pembimbing', 'owner'));

-- 3. student_mentors: pihak terkait & admin bisa lihat
drop policy if exists "student_mentors: pihak terkait & admin bisa lihat" on public.student_mentors;
create policy "student_mentors: pihak terkait & admin bisa lihat"
  on public.student_mentors for select
  using (
    student_id = auth.uid()
    or mentor_id = auth.uid()
    or public.current_role() in ('admin', 'owner')
  );

-- 4. student_mentors: hanya admin kelola relasi
drop policy if exists "student_mentors: hanya admin kelola relasi" on public.student_mentors;
create policy "student_mentors: hanya admin kelola relasi"
  on public.student_mentors for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 5. attendance_sessions: hanya admin generate/kelola QR
drop policy if exists "sesi: hanya admin generate/kelola QR" on public.attendance_sessions;
create policy "sesi: hanya admin generate/kelola QR"
  on public.attendance_sessions for insert
  with check (public.current_role() in ('admin', 'owner'));

-- 6. attendance_sessions: hanya admin update/hapus
drop policy if exists "sesi: hanya admin update/hapus" on public.attendance_sessions;
create policy "sesi: hanya admin update/hapus"
  on public.attendance_sessions for update
  using (public.current_role() in ('admin', 'owner'));

-- 7. attendance_sessions: hanya admin hapus
drop policy if exists "sesi: hanya admin hapus" on public.attendance_sessions;
create policy "sesi: hanya admin hapus"
  on public.attendance_sessions for delete
  using (public.current_role() in ('admin', 'owner'));

-- 8. attendance_records: admin lihat semua
drop policy if exists "presensi: admin lihat semua" on public.attendance_records;
create policy "presensi: admin lihat semua"
  on public.attendance_records for select
  using (public.current_role() in ('admin', 'owner'));

-- 9. leave_requests: admin full akses
drop policy if exists "izin: admin full akses" on public.leave_requests;
create policy "izin: admin full akses"
  on public.leave_requests for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 10. logbook_entries: admin full akses
drop policy if exists "logbook: admin full akses" on public.logbook_entries;
create policy "logbook: admin full akses"
  on public.logbook_entries for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 11. allowed_locations: hanya admin kelola
drop policy if exists "lokasi: hanya admin kelola" on public.allowed_locations;
create policy "lokasi: hanya admin kelola"
  on public.allowed_locations for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 12. study_programs: hanya admin kelola
drop policy if exists "study_programs: hanya admin kelola" on public.study_programs;
create policy "study_programs: hanya admin kelola"
  on public.study_programs for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 13. calendar_events: hanya admin kelola
drop policy if exists "calendar_events: hanya admin kelola" on public.calendar_events;
create policy "calendar_events: hanya admin kelola"
  on public.calendar_events for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));

-- 14. announcements: admin & pembimbing lihat semua (tambah owner)
drop policy if exists "announcements: admin & pembimbing lihat semua" on public.announcements;
create policy "announcements: admin & pembimbing lihat semua"
  on public.announcements for select
  using (public.current_role() in ('admin', 'pembimbing', 'owner'));

-- 15. announcements: hanya admin insert
drop policy if exists "announcements: hanya admin insert" on public.announcements;
create policy "announcements: hanya admin insert"
  on public.announcements for insert
  with check (public.current_role() in ('admin', 'owner'));

-- 16. announcements: hanya admin update
drop policy if exists "announcements: hanya admin update" on public.announcements;
create policy "announcements: hanya admin update"
  on public.announcements for update
  using (public.current_role() in ('admin', 'owner'));

-- 17. announcements: hanya admin delete
drop policy if exists "announcements: hanya admin delete" on public.announcements;
create policy "announcements: hanya admin delete"
  on public.announcements for delete
  using (public.current_role() in ('admin', 'owner'));

-- 18. announcement_recipients: admin full akses
drop policy if exists "announcement_recipients: admin full akses" on public.announcement_recipients;
create policy "announcement_recipients: admin full akses"
  on public.announcement_recipients for all
  using (public.current_role() in ('admin', 'owner'))
  with check (public.current_role() in ('admin', 'owner'));
