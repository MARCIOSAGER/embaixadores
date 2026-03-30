-- Add missing fields to inscricoes: photo, spouse, birth date, address
alter table public.inscricoes
  add column if not exists "fotoUrl" text,
  add column if not exists "nomeEsposa" text,
  add column if not exists "dataNascimento" text,
  add column if not exists "cidade" text,
  add column if not exists "estado" text;
