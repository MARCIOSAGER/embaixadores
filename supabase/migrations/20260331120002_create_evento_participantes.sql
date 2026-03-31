-- Event participants / registrations
create table if not exists public.evento_participantes (
  id bigint generated always as identity primary key,
  "eventoId" bigint not null references public.eventos(id) on delete cascade,
  "nomeCompleto" text not null,
  email text,
  telefone text,
  status text not null default 'confirmado',
  observacoes text,
  "createdAt" timestamptz not null default now()
);

-- Add capacity field to eventos
alter table public.eventos
  add column if not exists capacidade integer,
  add column if not exists "imagemUrl" text,
  add column if not exists "inscricaoAberta" boolean not null default false;

-- RLS
alter table public.evento_participantes enable row level security;

-- Public can register (insert)
create policy "Anon insert participantes"
  on public.evento_participantes for insert
  to anon, authenticated
  with check (true);

-- Auth can read/manage
create policy "Auth read participantes"
  on public.evento_participantes for select
  to authenticated
  using (true);

create policy "Auth update participantes"
  on public.evento_participantes for update
  to authenticated
  using (true);

create policy "Auth delete participantes"
  on public.evento_participantes for delete
  to authenticated
  using (true);

-- Anon can read events (for public registration page)
create policy "Anon read eventos"
  on public.eventos for select
  to anon
  using ("inscricaoAberta" = true);
