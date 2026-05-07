-- Allow deleting an embaixador that has acted as entrevistador in past
-- entrevistas. Previously the FK was created without ON DELETE, which
-- defaulted to NO ACTION and blocked deletion. Switching to SET NULL
-- preserves interview history while clearing the dangling reference.

ALTER TABLE public.entrevistas
  DROP CONSTRAINT IF EXISTS "entrevistas_entrevistadorId_fkey";

ALTER TABLE public.entrevistas
  ADD CONSTRAINT "entrevistas_entrevistadorId_fkey"
  FOREIGN KEY ("entrevistadorId") REFERENCES public.embaixadores(id)
  ON DELETE SET NULL;
