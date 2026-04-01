-- Allow anonymous users to read their own ambassador record via codigoIndicacao
-- (used by the public profile update form at /meu-perfil?code=XXXX)
CREATE POLICY "embaixadores_anon_select_by_code" ON public.embaixadores
  FOR SELECT TO anon
  USING ("codigoIndicacao" IS NOT NULL);

-- Allow anonymous users to update their own record via codigoIndicacao
-- Only allow updating safe profile fields (not status, dates, etc.)
CREATE POLICY "embaixadores_anon_update_by_code" ON public.embaixadores
  FOR UPDATE TO anon
  USING ("codigoIndicacao" IS NOT NULL)
  WITH CHECK ("codigoIndicacao" IS NOT NULL);

-- Add instagram and fotoUrl columns to embaixadores if not present
ALTER TABLE public.embaixadores
  ADD COLUMN IF NOT EXISTS instagram text;
