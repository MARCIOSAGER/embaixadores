-- Create storage bucket for inscription photos (public upload)
insert into storage.buckets (id, name, public)
values ('inscricoes', 'inscricoes', true)
on conflict (id) do nothing;

-- Allow anonymous uploads to inscricoes bucket
create policy "Anyone can upload inscricao photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'inscricoes');

-- Allow public read
create policy "Public read inscricao photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'inscricoes');
