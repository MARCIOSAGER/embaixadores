-- RLS v2: Improved isolation for LGPD compliance
-- Run this in Supabase SQL Editor after backing up existing policies

-- ============================================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 2. HELPER: reusable admin check
-- ============================================================
-- Used in policies below:
-- EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')

-- ============================================================
-- 3. USERS TABLE
-- Users can read their own row; admins can read all and modify
-- ============================================================
CREATE POLICY "Users can read own row" ON users
  FOR SELECT TO authenticated
  USING ("openId" = auth.uid()::text);

CREATE POLICY "Admin can read all users" ON users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can insert users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can update users" ON users
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

-- Users can delete own row (LGPD account deletion)
CREATE POLICY "Users can delete own row" ON users
  FOR DELETE TO authenticated
  USING ("openId" = auth.uid()::text);

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

-- ============================================================
-- 4. EMBAIXADORES
-- All authenticated can read (needed for dashboard, lists)
-- Users can update/delete own row via email match (Profile/LGPD)
-- Admin can do everything
-- ============================================================
CREATE POLICY "Authenticated can read embaixadores" ON embaixadores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert embaixadores" ON embaixadores
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "User can update own embaixador" ON embaixadores
  FOR UPDATE TO authenticated
  USING (
    email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "User can delete own embaixador" ON embaixadores
  FOR DELETE TO authenticated
  USING (
    email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
  );

-- ============================================================
-- 5. PAGAMENTOS (sensitive - admin + own data only)
-- ============================================================
CREATE POLICY "Admin or own pagamentos read" ON pagamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
    OR "embaixadorId" IN (
      SELECT id FROM embaixadores WHERE email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
    )
  );

CREATE POLICY "Admin can insert pagamentos" ON pagamentos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can update pagamentos" ON pagamentos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

-- Users can delete own pagamentos (LGPD)
CREATE POLICY "Admin or own delete pagamentos" ON pagamentos
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
    OR "embaixadorId" IN (
      SELECT id FROM embaixadores WHERE email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
    )
  );

-- ============================================================
-- 6. WELCOME KITS (admin + own data only)
-- ============================================================
CREATE POLICY "Admin or own welcomeKits read" ON "welcomeKits"
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
    OR "embaixadorId" IN (
      SELECT id FROM embaixadores WHERE email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
    )
  );

CREATE POLICY "Admin can insert welcomeKits" ON "welcomeKits"
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can update welcomeKits" ON "welcomeKits"
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin or own delete welcomeKits" ON "welcomeKits"
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
    OR "embaixadorId" IN (
      SELECT id FROM embaixadores WHERE email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
    )
  );

-- ============================================================
-- 7. TERCA DE GLORIA (public read, admin write)
-- ============================================================
CREATE POLICY "Authenticated can read tercaGloria" ON "tercaGloria"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert tercaGloria" ON "tercaGloria"
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can update tercaGloria" ON "tercaGloria"
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can delete tercaGloria" ON "tercaGloria"
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

-- ============================================================
-- 8. EVENTOS (public read, admin write)
-- ============================================================
CREATE POLICY "Authenticated can read eventos" ON eventos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert eventos" ON eventos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can update eventos" ON eventos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can delete eventos" ON eventos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

-- ============================================================
-- 9. ENTREVISTAS (admin only - candidate data is sensitive)
-- ============================================================
CREATE POLICY "Admin can read entrevistas" ON entrevistas
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can insert entrevistas" ON entrevistas
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can update entrevistas" ON entrevistas
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admin can delete entrevistas" ON entrevistas
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin'));

-- ============================================================
-- 10. KIT_HISTORICO (same as welcomeKits - admin + own)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kit_historico') THEN
    EXECUTE 'ALTER TABLE kit_historico ENABLE ROW LEVEL SECURITY';

    EXECUTE 'CREATE POLICY "Admin or own kit_historico read" ON kit_historico
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = ''admin'')
        OR "kitId" IN (
          SELECT wk.id FROM "welcomeKits" wk
          JOIN embaixadores e ON e.id = wk."embaixadorId"
          WHERE e.email = (SELECT email FROM users WHERE "openId" = auth.uid()::text)
        )
      )';

    EXECUTE 'CREATE POLICY "Authenticated can insert kit_historico" ON kit_historico
      FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;
