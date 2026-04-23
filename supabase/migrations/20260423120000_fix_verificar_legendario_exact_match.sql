-- Fix: verificar_legendario was using ILIKE '%...%' which caused partial matches.
-- E.g. typing "2" matched "072", "91105", "125194", etc.
-- Now uses exact match after normalizing both sides (strip "L#", "#", spaces, uppercase).

CREATE OR REPLACE FUNCTION public.verificar_legendario(num_legendario text)
RETURNS TABLE (
  nome text,
  email text,
  numero_embaixador text,
  numero_legendario text,
  foto_url text,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    "nomeCompleto"::text,
    LEFT(email, 3) || '***' || SUBSTRING(email FROM POSITION('@' IN email))::text,
    "numeroEmbaixador"::text,
    "numeroLegendario"::text,
    "fotoUrl"::text,
    'cadastrado'::text
  FROM embaixadores
  WHERE UPPER(REGEXP_REPLACE(COALESCE("numeroLegendario", ''), '[^0-9A-Za-z]', '', 'g'))
      = UPPER(REGEXP_REPLACE(COALESCE(num_legendario, ''),    '[^0-9A-Za-z]', '', 'g'))
    AND COALESCE(num_legendario, '') <> ''
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_legendario(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verificar_legendario(text) TO authenticated;
