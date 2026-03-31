-- ============================================================
-- Fix RLS: replace overly permissive "Allow all" policies
-- with proper role-based access control
-- ============================================================

-- 1. Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE "openId" = auth.uid()::text
    AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. Drop ALL existing permissive policies
-- ============================================================

-- Original "Allow all" from schema
DROP POLICY IF EXISTS "Allow all" ON public.users;
DROP POLICY IF EXISTS "Allow all" ON public.embaixadores;
DROP POLICY IF EXISTS "Allow all" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow all" ON public."tercaGloria";
DROP POLICY IF EXISTS "Allow all" ON public."welcomeKits";
DROP POLICY IF EXISTS "Allow all" ON public.eventos;
DROP POLICY IF EXISTS "Allow all" ON public.entrevistas;

-- Old rls-update policies (if applied previously)
DROP POLICY IF EXISTS "Users can read" ON public.users;
DROP POLICY IF EXISTS "Admin can modify users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can read" ON public.embaixadores;
DROP POLICY IF EXISTS "Admin can modify" ON public.embaixadores;
DROP POLICY IF EXISTS "Admin can update" ON public.embaixadores;
DROP POLICY IF EXISTS "Admin can delete" ON public.embaixadores;
DROP POLICY IF EXISTS "Authenticated can read" ON public.pagamentos;
DROP POLICY IF EXISTS "Admin can modify" ON public.pagamentos;
DROP POLICY IF EXISTS "Admin can update" ON public.pagamentos;
DROP POLICY IF EXISTS "Admin can delete" ON public.pagamentos;
DROP POLICY IF EXISTS "Authenticated can read" ON public."tercaGloria";
DROP POLICY IF EXISTS "Admin can modify" ON public."tercaGloria";
DROP POLICY IF EXISTS "Admin can update" ON public."tercaGloria";
DROP POLICY IF EXISTS "Admin can delete" ON public."tercaGloria";
DROP POLICY IF EXISTS "Authenticated can read" ON public."welcomeKits";
DROP POLICY IF EXISTS "Admin can modify" ON public."welcomeKits";
DROP POLICY IF EXISTS "Admin can update" ON public."welcomeKits";
DROP POLICY IF EXISTS "Admin can delete" ON public."welcomeKits";
DROP POLICY IF EXISTS "Authenticated can read" ON public.eventos;
DROP POLICY IF EXISTS "Admin can modify" ON public.eventos;
DROP POLICY IF EXISTS "Admin can update" ON public.eventos;
DROP POLICY IF EXISTS "Admin can delete" ON public.eventos;
DROP POLICY IF EXISTS "Authenticated can read" ON public.entrevistas;
DROP POLICY IF EXISTS "Admin can modify" ON public.entrevistas;
DROP POLICY IF EXISTS "Admin can update" ON public.entrevistas;
DROP POLICY IF EXISTS "Admin can delete" ON public.entrevistas;

-- Produtos & pedidos "Auth manage" permissive policies
DROP POLICY IF EXISTS "Auth manage produtos" ON public.produtos;
DROP POLICY IF EXISTS "Auth read produtos" ON public.produtos;
DROP POLICY IF EXISTS "Auth manage produto_imagens" ON public.produto_imagens;
DROP POLICY IF EXISTS "Auth read produto_imagens" ON public.produto_imagens;
DROP POLICY IF EXISTS "Auth manage pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Auth read pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Auth manage pedido_itens" ON public.pedido_itens;
DROP POLICY IF EXISTS "Auth read pedido_itens" ON public.pedido_itens;

-- Evento participantes (keep anon insert, replace auth policies)
DROP POLICY IF EXISTS "Auth read participantes" ON public.evento_participantes;
DROP POLICY IF EXISTS "Auth update participantes" ON public.evento_participantes;
DROP POLICY IF EXISTS "Auth delete participantes" ON public.evento_participantes;
-- Keep: "Anon insert participantes" (public registration)
-- Keep: "Anon read eventos" (public event page)

-- ============================================================
-- 3. Create proper role-based policies
-- ============================================================

-- ====================
-- USERS
-- ====================
-- SELECT: own record or admin
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    "openId" = auth.uid()::text
    OR public.is_admin()
  );

-- INSERT: admin only
CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: own record or admin
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (
    "openId" = auth.uid()::text
    OR public.is_admin()
  )
  WITH CHECK (
    "openId" = auth.uid()::text
    OR public.is_admin()
  );

-- DELETE: admin only
CREATE POLICY "users_delete" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- EMBAIXADORES
-- ====================
-- SELECT: own record (matched by email) or admin
CREATE POLICY "embaixadores_select" ON public.embaixadores
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "embaixadores_insert" ON public.embaixadores
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "embaixadores_update" ON public.embaixadores
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "embaixadores_delete" ON public.embaixadores
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- PAGAMENTOS
-- ====================
-- ALL operations: admin only
CREATE POLICY "pagamentos_admin_all" ON public.pagamentos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================
-- TERÇA DE GLÓRIA
-- ====================
-- SELECT: all authenticated users
CREATE POLICY "tercaGloria_select" ON public."tercaGloria"
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "tercaGloria_insert" ON public."tercaGloria"
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "tercaGloria_update" ON public."tercaGloria"
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tercaGloria_delete" ON public."tercaGloria"
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- WELCOME KITS
-- ====================
-- ALL operations: admin only
CREATE POLICY "welcomeKits_admin_all" ON public."welcomeKits"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================
-- EVENTOS
-- ====================
-- SELECT: all authenticated users (anon read already exists for inscricaoAberta)
CREATE POLICY "eventos_select" ON public.eventos
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "eventos_insert" ON public.eventos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "eventos_update" ON public.eventos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "eventos_delete" ON public.eventos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- ENTREVISTAS
-- ====================
-- ALL operations: admin only
CREATE POLICY "entrevistas_admin_all" ON public.entrevistas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================
-- PRODUTOS
-- ====================
-- SELECT: all authenticated users (catalog view)
CREATE POLICY "produtos_select" ON public.produtos
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "produtos_insert" ON public.produtos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "produtos_update" ON public.produtos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "produtos_delete" ON public.produtos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- PRODUTO_IMAGENS
-- ====================
-- SELECT: all authenticated users
CREATE POLICY "produto_imagens_select" ON public.produto_imagens
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "produto_imagens_insert" ON public.produto_imagens
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "produto_imagens_update" ON public.produto_imagens
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "produto_imagens_delete" ON public.produto_imagens
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- PEDIDOS
-- ====================
-- SELECT: admin only
CREATE POLICY "pedidos_select" ON public.pedidos
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- INSERT: all authenticated (ambassador can place orders)
CREATE POLICY "pedidos_insert" ON public.pedidos
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE/DELETE: admin only
CREATE POLICY "pedidos_update" ON public.pedidos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pedidos_delete" ON public.pedidos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- PEDIDO_ITENS
-- ====================
-- SELECT: admin only
CREATE POLICY "pedido_itens_select" ON public.pedido_itens
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- INSERT: all authenticated
CREATE POLICY "pedido_itens_insert" ON public.pedido_itens
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE/DELETE: admin only
CREATE POLICY "pedido_itens_update" ON public.pedido_itens
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pedido_itens_delete" ON public.pedido_itens
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- EVENTO_PARTICIPANTES
-- ====================
-- "Anon insert participantes" already exists (public registration) -- kept
-- Replace auth read/update/delete with admin-only
CREATE POLICY "evento_participantes_select" ON public.evento_participantes
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "evento_participantes_update" ON public.evento_participantes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "evento_participantes_delete" ON public.evento_participantes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ====================
-- INSCRICOES (keep existing public form access)
-- ====================
-- "Anyone can insert inscricoes" already exists -- kept
-- "Authenticated users can read inscricoes" already exists -- kept
-- "Authenticated users can update inscricoes" already exists -- kept
-- "Authenticated users can delete inscricoes" already exists -- kept
-- No changes needed for inscricoes
