-- Configurable lookup lists (programas, aberturas paises) so admins can add
-- and remove options without code changes.

CREATE TABLE IF NOT EXISTS public.listas_config (
  id          BIGSERIAL PRIMARY KEY,
  categoria   TEXT        NOT NULL,
  valor       TEXT        NOT NULL,
  rotulo      TEXT        NOT NULL,
  ordem       INTEGER     NOT NULL DEFAULT 0,
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(categoria, valor)
);

CREATE INDEX IF NOT EXISTS idx_listas_config_categoria_ordem
  ON public.listas_config(categoria, ordem);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.listas_config_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listas_config_updated_at ON public.listas_config;
CREATE TRIGGER trg_listas_config_updated_at
  BEFORE UPDATE ON public.listas_config
  FOR EACH ROW EXECUTE FUNCTION public.listas_config_set_updated_at();

-- RLS: any authenticated user can read; only admins can write
ALTER TABLE public.listas_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listas_config_select_authenticated" ON public.listas_config;
CREATE POLICY "listas_config_select_authenticated" ON public.listas_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "listas_config_select_anon" ON public.listas_config;
CREATE POLICY "listas_config_select_anon" ON public.listas_config
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "listas_config_admin_write" ON public.listas_config;
CREATE POLICY "listas_config_admin_write" ON public.listas_config
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed programas (current list + Nest Europa + REM Europa)
INSERT INTO public.listas_config (categoria, valor, rotulo, ordem) VALUES
  ('programa', 'Legendarios',     'Legendários',                       10),
  ('programa', 'REM',             'REM',                                20),
  ('programa', 'REM Europa',      'REM Europa',                         25),
  ('programa', 'LEGADO',          'LEGADO',                             30),
  ('programa', 'MAMUTE',          'MAMUTE',                             40),
  ('programa', 'MEX',             'Embaixadores Master Experience (MEX)', 50),
  ('programa', 'Tour Guatemala',  'Tour Guatemala',                     60),
  ('programa', 'NEST EUA',        'NEST EUA',                           70),
  ('programa', 'NEST Brasil',     'NEST Brasil',                        80),
  ('programa', 'NEST Europa',     'NEST Europa',                        85),
  ('programa', 'Augusto Cury',    'Encontro Augusto Cury',              90),
  ('programa', 'LGND SQUAD',      'LGND SQUAD',                        100),
  ('programa', 'Aberturas',       'Aberturas de Países',               110)
ON CONFLICT (categoria, valor) DO NOTHING;

-- Seed aberturas de países (current list)
INSERT INTO public.listas_config (categoria, valor, rotulo, ordem) VALUES
  ('abertura_pais', 'Portugal',     'Portugal',     10),
  ('abertura_pais', 'Reino Unido',  'Reino Unido',  20),
  ('abertura_pais', 'Japão',        'Japão',        30),
  ('abertura_pais', 'Dubai',        'Dubai',        40),
  ('abertura_pais', 'Itália',       'Itália',       50),
  ('abertura_pais', 'Espanha',      'Espanha',      60),
  ('abertura_pais', 'África',       'África',       70)
ON CONFLICT (categoria, valor) DO NOTHING;

COMMENT ON TABLE public.listas_config IS 'Listas configuráveis (programas, aberturas de países) gerenciadas via tela de Configurações.';
