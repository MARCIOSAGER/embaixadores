-- Add tipo column to distinguish candidate inscriptions from ambassador profile updates
ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'candidato',
  ADD COLUMN IF NOT EXISTS "embaixadorId" bigint REFERENCES public.embaixadores(id);

-- Index for quick filtering by tipo
CREATE INDEX IF NOT EXISTS idx_inscricoes_tipo ON public.inscricoes(tipo);
