-- Enable pg_net extension for HTTP requests from database triggers
create extension if not exists pg_net with schema extensions;

-- Function that fires on INSERT to inscricoes and calls the Edge Function
create or replace function public.notify_inscricao_webhook()
returns trigger
language plpgsql
security definer
as $$
declare
  _service_role_key text;
  _payload jsonb;
  _function_url text := 'https://orgpufgttaloaajodpqf.supabase.co/functions/v1/notify-inscricao';
begin
  -- Read service role key from vault (must be stored there)
  begin
    select decrypted_secret into _service_role_key
      from vault.decrypted_secrets
     where name = 'service_role_key'
     limit 1;
  exception when others then
    _service_role_key := current_setting('supabase.service_role_key', true);
  end;

  -- Build the payload matching the webhook format the Edge Function expects
  _payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'inscricoes',
    'schema', 'public',
    'record', row_to_json(NEW)::jsonb
  );

  -- POST to the Edge Function via pg_net
  perform net.http_post(
    url := _function_url,
    body := _payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(_service_role_key, '')
    )
  );

  return NEW;
end;
$$;

-- Create the trigger on inscricoes INSERT
drop trigger if exists on_inscricao_insert on public.inscricoes;

create trigger on_inscricao_insert
  after insert on public.inscricoes
  for each row
  execute function public.notify_inscricao_webhook();
