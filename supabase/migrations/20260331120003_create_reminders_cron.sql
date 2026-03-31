-- Daily reminders cron job (8:00 BRT = 11:00 UTC)
-- Requires pg_cron and pg_net extensions (available on Supabase Pro+)

-- Enable extensions if not already enabled
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Schedule daily reminders at 8:00 AM BRT (11:00 UTC)
select cron.schedule(
  'daily-reminders',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://orgpufgttaloaajodpqf.supabase.co/functions/v1/reminders',
    body := '{"type": "all"}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    )
  );
  $$
);
