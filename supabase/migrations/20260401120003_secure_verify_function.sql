-- Remove overly permissive anonymous access to embaixadores
DROP POLICY IF EXISTS "embaixadores_anon_select_by_code" ON public.embaixadores;
DROP POLICY IF EXISTS "embaixadores_anon_update_by_code" ON public.embaixadores;

-- Create a secure RPC function that returns ONLY minimal data for verification
-- Anonymous users can call this but cannot query the table directly
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
  WHERE "numeroLegendario" ILIKE '%' || num_legendario || '%'
  LIMIT 1;
$$;

-- Allow anon to call the function
GRANT EXECUTE ON FUNCTION public.verificar_legendario(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verificar_legendario(text) TO authenticated;
