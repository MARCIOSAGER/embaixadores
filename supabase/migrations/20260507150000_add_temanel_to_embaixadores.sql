-- Adds a yes/no flag for "Tem Anel?" alongside the other items (Jaqueta, Pin, Patch, Espada).
-- The existing numeroAnel column keeps the size measurement, used only when temAnel = 'sim'.

ALTER TABLE public.embaixadores
  ADD COLUMN IF NOT EXISTS "temAnel" text;

COMMENT ON COLUMN public.embaixadores."temAnel" IS 'sim | nao';
