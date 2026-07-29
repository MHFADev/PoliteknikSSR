-- ============================================================
-- Add work_days column to mentor_settings
-- Hari kerja pembimbing (array of weekday: 0=Sun..6=Sat)
-- Default: Senin-Jumat (1,2,3,4,5)
-- ============================================================

ALTER TABLE public.mentor_settings
ADD COLUMN IF NOT EXISTS work_days jsonb NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb;

COMMENT ON COLUMN public.mentor_settings.work_days IS 'Hari kerja pembimbing (array of weekday: 0=Sun..6=Sat). Default: Senin-Jumat (1,2,3,4,5).';
