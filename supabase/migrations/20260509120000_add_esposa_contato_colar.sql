-- Adds wife contact (phone, email) and Esposa de Embaixador necklace tracking to inscricoes.
ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS "telefoneEsposa" text,
  ADD COLUMN IF NOT EXISTS "emailEsposa" text,
  ADD COLUMN IF NOT EXISTS "esposaRecebeuColar" text,
  ADD COLUMN IF NOT EXISTS "esposaVoltou" text;

COMMENT ON COLUMN public.inscricoes."esposaRecebeuColar" IS 'sim | nao';
COMMENT ON COLUMN public.inscricoes."esposaVoltou" IS 'sim | nao';
