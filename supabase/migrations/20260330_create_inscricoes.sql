-- Inscription form submissions (public, no auth required)
create table if not exists public.inscricoes (
  id bigint generated always as identity primary key,

  -- Dados pessoais
  "nomeCompleto"       text not null,
  email                text not null,
  telefone             text not null,
  instagram            text,

  -- Legendarios
  "numeroLegendario"   text,
  "topSede"            text,
  "qtdTopsServidos"    text,
  "areaServico"        text,
  "conhecimentoPrevio" text,
  "indicadoPorEmb"     boolean default false,
  "nomeIndicador"      text,
  "sedeInternacional"  boolean default false,
  "nomeSedeInternacional" text,
  "cargoLideranca"     text,

  -- Familia
  "estadoCivil"        text,
  "qtdFilhos"          integer default 0,
  "idadesFilhos"       text,

  -- Profissional
  profissao            text,
  "areaAtuacao"        text,
  "possuiEmpresa"      text,
  "instagramEmpresa"   text,
  "segmentoMercado"    text,
  "tempoEmpreendedorismo" text,
  "estruturaEquipe"    text,

  -- Investimento
  "investeClubePrivado" text,
  "participaMentoria"  text,
  "valorInvestimento"  text,

  -- Disponibilidade
  "disponibilidadeReuniao" text,

  -- Meta
  status               text not null default 'pendente',
  "createdAt"          timestamptz not null default now()
);

-- Allow anonymous inserts (public form)
alter table public.inscricoes enable row level security;

create policy "Anyone can insert inscricoes"
  on public.inscricoes for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users can read
create policy "Authenticated users can read inscricoes"
  on public.inscricoes for select
  to authenticated
  using (true);

-- Only authenticated users can update/delete
create policy "Authenticated users can update inscricoes"
  on public.inscricoes for update
  to authenticated
  using (true);

create policy "Authenticated users can delete inscricoes"
  on public.inscricoes for delete
  to authenticated
  using (true);
