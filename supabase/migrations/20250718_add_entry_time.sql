-- =====================================================================
-- Add entry_time column to app_settings
-- entry_time is the official start time (Jam Masuk), default 07:00
-- late_time remains the cutoff for lateness (Jam Batas Telat), default 08:00
-- =====================================================================

alter table if exists public.app_settings
  add column if not exists entry_time text not null default '07:00';

comment on column public.app_settings.entry_time is 'Jam masuk resmi PKL (default 07:00)';

-- Update existing row with default entry_time if it's null
update public.app_settings set entry_time = '07:00' where entry_time is null;
