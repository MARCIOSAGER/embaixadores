-- Products catalog for ambassadors
create table if not exists public.produtos (
  id bigint generated always as identity primary key,
  nome text not null,
  descricao text,
  categoria text not null default 'acessorios',
  sku text unique,
  preco numeric(10,2) not null default 0,
  estoque integer not null default 0,
  tamanhos text[], -- array of available sizes
  cores text[],    -- array of available colors
  "imagemUrl" text,
  status text not null default 'disponivel',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Product images gallery (multiple images per product)
create table if not exists public.produto_imagens (
  id bigint generated always as identity primary key,
  "produtoId" bigint not null references public.produtos(id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  "createdAt" timestamptz not null default now()
);

-- Orders from ambassadors
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  "embaixadorId" bigint not null references public.embaixadores(id),
  status text not null default 'solicitado',
  observacoes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Order items
create table if not exists public.pedido_itens (
  id bigint generated always as identity primary key,
  "pedidoId" bigint not null references public.pedidos(id) on delete cascade,
  "produtoId" bigint not null references public.produtos(id),
  quantidade integer not null default 1,
  tamanho text,
  cor text,
  "precoUnitario" numeric(10,2) not null default 0
);

-- RLS
alter table public.produtos enable row level security;
alter table public.produto_imagens enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

-- Authenticated users can read products
create policy "Auth read produtos" on public.produtos for select to authenticated using (true);
create policy "Auth manage produtos" on public.produtos for all to authenticated using (true) with check (true);

create policy "Auth read produto_imagens" on public.produto_imagens for select to authenticated using (true);
create policy "Auth manage produto_imagens" on public.produto_imagens for all to authenticated using (true) with check (true);

create policy "Auth read pedidos" on public.pedidos for select to authenticated using (true);
create policy "Auth manage pedidos" on public.pedidos for all to authenticated using (true) with check (true);

create policy "Auth read pedido_itens" on public.pedido_itens for select to authenticated using (true);
create policy "Auth manage pedido_itens" on public.pedido_itens for all to authenticated using (true) with check (true);

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

create policy "Auth upload produto images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos');

create policy "Public read produto images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'produtos');

create policy "Auth delete produto images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'produtos');
