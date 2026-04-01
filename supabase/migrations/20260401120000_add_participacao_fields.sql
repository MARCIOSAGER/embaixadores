-- Add missing Typeform questions: Participacao section
alter table public.inscricoes
  add column if not exists "ambienteEsposas" text,
  add column if not exists "valorCirculoIntimo" text,
  add column if not exists "motivoParticipacao" text;
