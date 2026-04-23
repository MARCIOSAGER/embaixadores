-- Mirror the 15 profile fields from inscricoes into embaixadores so that
-- approved profile updates persist in the ambassador record and become
-- visible/editable in the admin UI.

ALTER TABLE public.embaixadores
  ADD COLUMN IF NOT EXISTS "endereco"            text,
  ADD COLUMN IF NOT EXISTS "bairro"              text,
  ADD COLUMN IF NOT EXISTS "cep"                 text,
  ADD COLUMN IF NOT EXISTS "pais"                text,
  ADD COLUMN IF NOT EXISTS "programasParticipou" text,
  ADD COLUMN IF NOT EXISTS "aberturasPaises"     text,
  ADD COLUMN IF NOT EXISTS "dataEmbaixador"      text,
  ADD COLUMN IF NOT EXISTS "sedeLegendario"      text,
  ADD COLUMN IF NOT EXISTS "cargoLideranca"      text,
  ADD COLUMN IF NOT EXISTS "doacaoPoco"          text,
  ADD COLUMN IF NOT EXISTS "numeroAnel"          text,
  ADD COLUMN IF NOT EXISTS "temJaqueta"          text,
  ADD COLUMN IF NOT EXISTS "temPin"              text,
  ADD COLUMN IF NOT EXISTS "temPatch"            text,
  ADD COLUMN IF NOT EXISTS "temEspada"           text;

COMMENT ON COLUMN public.embaixadores."programasParticipou" IS 'Lista separada por vírgulas: Legendarios,REM,LEGADO,MAMUTE,MEX,Tour Guatemala,NEST EUA,NEST Brasil,Augusto Cury,LGND SQUAD,Aberturas';
COMMENT ON COLUMN public.embaixadores."aberturasPaises"     IS 'Lista separada por vírgulas dos países nas aberturas';
COMMENT ON COLUMN public.embaixadores."doacaoPoco"          IS 'sim | nao';
COMMENT ON COLUMN public.embaixadores."temJaqueta"          IS 'sim | nao';
COMMENT ON COLUMN public.embaixadores."temPin"              IS 'sim | nao';
COMMENT ON COLUMN public.embaixadores."temPatch"            IS 'sim | nao';
COMMENT ON COLUMN public.embaixadores."temEspada"           IS 'sim | nao';
