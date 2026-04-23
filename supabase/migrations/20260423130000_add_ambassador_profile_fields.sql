-- Adds new optional fields to inscricoes for the ambassador profile form (/meu-perfil).
-- Covers: full address, programs participated, ambassador journey and items owned.

ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS "endereco"            text,
  ADD COLUMN IF NOT EXISTS "bairro"              text,
  ADD COLUMN IF NOT EXISTS "cep"                 text,
  ADD COLUMN IF NOT EXISTS "pais"                text,
  ADD COLUMN IF NOT EXISTS "programasParticipou" text,
  ADD COLUMN IF NOT EXISTS "aberturasPaises"     text,
  ADD COLUMN IF NOT EXISTS "dataEmbaixador"      text,
  ADD COLUMN IF NOT EXISTS "sedeLegendario"      text,
  ADD COLUMN IF NOT EXISTS "doacaoPoco"          text,
  ADD COLUMN IF NOT EXISTS "numeroAnel"          text,
  ADD COLUMN IF NOT EXISTS "temJaqueta"          text,
  ADD COLUMN IF NOT EXISTS "temPin"              text,
  ADD COLUMN IF NOT EXISTS "temPatch"            text,
  ADD COLUMN IF NOT EXISTS "temEspada"           text;

COMMENT ON COLUMN public.inscricoes."programasParticipou" IS 'Lista separada por vírgulas: Legendarios,REM,LEGADO,MAMUTE,MEX,Tour Guatemala,NEST EUA,NEST Brasil,Augusto Cury,LGND SQUAD,Aberturas';
COMMENT ON COLUMN public.inscricoes."aberturasPaises"     IS 'Lista separada por vírgulas dos países nas aberturas';
COMMENT ON COLUMN public.inscricoes."doacaoPoco"          IS 'sim | nao';
COMMENT ON COLUMN public.inscricoes."temJaqueta"          IS 'sim | nao';
COMMENT ON COLUMN public.inscricoes."temPin"              IS 'sim | nao';
COMMENT ON COLUMN public.inscricoes."temPatch"            IS 'sim | nao';
COMMENT ON COLUMN public.inscricoes."temEspada"           IS 'sim | nao';
