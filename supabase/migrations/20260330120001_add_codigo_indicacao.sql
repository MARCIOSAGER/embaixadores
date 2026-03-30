-- Add unique referral code to embaixadores
alter table public.embaixadores
  add column if not exists "codigoIndicacao" text unique;

-- Add referrer tracking to inscricoes
alter table public.inscricoes
  add column if not exists "embaixadorIndicadorId" bigint references public.embaixadores(id),
  add column if not exists "codigoIndicacao" text;

-- Generate random 6-char codes for existing ambassadors
update public.embaixadores
  set "codigoIndicacao" = lower(substr(md5(random()::text || id::text), 1, 6))
  where "codigoIndicacao" is null;
