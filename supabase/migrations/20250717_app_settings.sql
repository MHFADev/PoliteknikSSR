-- =====================================================================
-- app_settings — Single-row table for app-wide settings
-- Replaces fetching admin settings via auth.admin.listUsers() which
-- was causing excessive DB load (fetching ALL auth users just to read
-- late_time and qr_expiry_hours).
-- =====================================================================
create table if not exists public.app_settings (
  id integer primary key default 1 constraint single_row check (id = 1),
  late_time text not null default '08:00',
  qr_expiry_hours integer not null default 12,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

comment on table public.app_settings is 'Pengaturan aplikasi (late_time, QR expiry) — single row only';

insert into public.app_settings (id, late_time, qr_expiry_hours)
values (1, '08:00', 12)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings: semua login boleh lihat" on public.app_settings;
create policy "app_settings: semua login boleh lihat"
  on public.app_settings for select
  using (auth.uid() is not null);

drop policy if exists "app_settings: admin/owner/root kelola" on public.app_settings;
create policy "app_settings: admin/owner/root kelola"
  on public.app_settings for all
  using (public.current_role() in ('admin', 'owner', 'root'))
  with check (public.current_role() in ('admin', 'owner', 'root'));
