-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON embaixadores;
DROP POLICY IF EXISTS "Allow all" ON pagamentos;
DROP POLICY IF EXISTS "Allow all" ON "tercaGloria";
DROP POLICY IF EXISTS "Allow all" ON "welcomeKits";
DROP POLICY IF EXISTS "Allow all" ON eventos;
DROP POLICY IF EXISTS "Allow all" ON entrevistas;

-- Users: authenticated can read all, admin can modify
CREATE POLICY "Users can read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);

-- All data tables: authenticated can read, admin can write
CREATE POLICY "Authenticated can read" ON embaixadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify" ON embaixadores FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can update" ON embaixadores FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can delete" ON embaixadores FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Authenticated can read" ON pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify" ON pagamentos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can update" ON pagamentos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can delete" ON pagamentos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Authenticated can read" ON "tercaGloria" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify" ON "tercaGloria" FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can update" ON "tercaGloria" FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can delete" ON "tercaGloria" FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Authenticated can read" ON "welcomeKits" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify" ON "welcomeKits" FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can update" ON "welcomeKits" FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can delete" ON "welcomeKits" FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Authenticated can read" ON eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify" ON eventos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can update" ON eventos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can delete" ON eventos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Authenticated can read" ON entrevistas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify" ON entrevistas FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can update" ON entrevistas FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admin can delete" ON entrevistas FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE "openId" = auth.uid()::text AND role = 'admin')
);
