# Full System Upgrade - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete UI/UX, i18n, code quality, data integrity, and security upgrade for the Embaixadores system.

**Architecture:** Phased approach — each phase is independently deployable and testable. All changes go through dev/staging before production.

**Tech Stack:** React/Vite, Supabase (Edge Functions, Auth, PostgreSQL), Tailwind CSS, Lucide Icons

**IMPORTANT:** No changes to production without explicit approval. All work in feature branches.

---

## Phase 1: i18n Completion (Priority: HIGH)

### Task 1.1: i18n for NotifyDialog

**Files:**
- Modify: `client/src/components/NotifyDialog.tsx`
- Modify: `client/src/lib/i18n.tsx` (add keys to pt/es/en)

- [ ] **Step 1:** Add i18n keys for all hardcoded strings:
  - `notify.title` = Notificar / Notificar / Notify
  - `notify.destinatarios` = Destinatarios / Destinatarios / Recipients
  - `notify.todos` = Todos / Todos / All
  - `notify.selecionar` = Selecionar / Seleccionar / Select
  - `notify.nenhumAtivo` = Nenhum embaixador ativo / Ningun embajador activo / No active ambassadors
  - `notify.incluirCandidato` = Notificar candidato tambem / Notificar candidato tambien / Also notify candidate
  - `notify.enviarVia` = Enviar via / Enviar por / Send via
  - `notify.waBoth` = WhatsApp + Email
  - `notify.waOnly` = Somente WhatsApp / Solo WhatsApp / WhatsApp only
  - `notify.emailOnly` = Somente Email / Solo Email / Email only
  - `notify.cancelar` = Cancelar / Cancelar / Cancel
  - `notify.enviado` = Enviado / Enviado / Sent
  - `notify.falhas` = falha(s) / fallo(s) / failure(s)
  - `notify.nenhumDest` = nenhum destinatario / sin destinatarios / no recipients

- [ ] **Step 2:** Replace all hardcoded strings in NotifyDialog.tsx with `t()` calls

- [ ] **Step 3:** Test switching between pt/es/en and verify all strings change

- [ ] **Step 4:** Commit: `feat: i18n for NotifyDialog (pt/es/en)`

### Task 1.2: i18n for ConfirmDialog

**Files:**
- Modify: `client/src/components/ConfirmDialog.tsx`
- Modify: `client/src/lib/i18n.tsx`

- [ ] **Step 1:** Add i18n keys:
  - `confirm.title` = Confirmar exclusao / Confirmar eliminacion / Confirm deletion
  - `confirm.description` = Tem certeza? Esta acao nao pode ser desfeita. / ...
  - `confirm.excluir` = Excluir / Eliminar / Delete
  - `confirm.cancelar` = Cancelar / Cancelar / Cancel

- [ ] **Step 2:** Use `useI18n()` in ConfirmDialog and replace defaults

- [ ] **Step 3:** Commit: `feat: i18n for ConfirmDialog (pt/es/en)`

### Task 1.3: i18n for ZApiAdmin

**Files:**
- Modify: `client/src/pages/ZApiAdmin.tsx`
- Modify: `client/src/lib/i18n.tsx`

- [ ] **Step 1:** Add ~20 i18n keys for all ZApiAdmin strings (status, buttons, instructions)

- [ ] **Step 2:** Replace all hardcoded strings with `t()` calls

- [ ] **Step 3:** Replace remaining `confirm()` with ConfirmDialog

- [ ] **Step 4:** Commit: `feat: i18n for ZApiAdmin page (pt/es/en)`

### Task 1.4: i18n for Profile and SetPassword

**Files:**
- Modify: `client/src/pages/Profile.tsx`
- Modify: `client/src/pages/SetPassword.tsx`
- Modify: `client/src/lib/i18n.tsx`

- [ ] **Step 1:** Add i18n keys for Profile page strings

- [ ] **Step 2:** Add i18n keys for SetPassword page strings

- [ ] **Step 3:** Replace hardcoded strings with `t()` calls

- [ ] **Step 4:** Commit: `feat: i18n for Profile and SetPassword (pt/es/en)`

---

## Phase 2: UI/UX Improvements (Priority: HIGH)

### Task 2.1: Accessibility - aria-labels and focus states

**Files:**
- Modify: `client/src/components/DashboardLayout.tsx`
- Modify: All pages with icon-only buttons

- [ ] **Step 1:** Add `aria-label` to all icon-only buttons (logout, language toggle, refresh, delete, etc.)

- [ ] **Step 2:** Verify focus rings are visible on all interactive elements

- [ ] **Step 3:** Add `skip-to-content` link at top of DashboardLayout

- [ ] **Step 4:** Verify heading hierarchy (h1 -> h2 -> h3, no skips)

- [ ] **Step 5:** Commit: `fix: accessibility improvements (aria-labels, focus, skip-link)`

### Task 2.2: Touch targets and spacing

**Files:**
- Modify: Various pages with small buttons

- [ ] **Step 1:** Audit all interactive elements for minimum 44x44px touch target

- [ ] **Step 2:** Fix any buttons/links below minimum (especially in card action bars)

- [ ] **Step 3:** Ensure minimum 8px gap between adjacent touch targets

- [ ] **Step 4:** Commit: `fix: touch target sizes and spacing`

### Task 2.3: Loading and empty states

**Files:**
- Modify: All data pages

- [ ] **Step 1:** Audit all pages for proper loading skeletons

- [ ] **Step 2:** Audit all pages for helpful empty states (icon + message + action)

- [ ] **Step 3:** Add `prefers-reduced-motion` media query respect for animations

- [ ] **Step 4:** Commit: `fix: loading states, empty states, reduced motion`

### Task 2.4: Form improvements

**Files:**
- Modify: All form dialogs

- [ ] **Step 1:** Add `autocomplete` attributes to login form (email, password)

- [ ] **Step 2:** Add inline validation on blur for email fields

- [ ] **Step 3:** Ensure all form errors appear near the field, not just as toast

- [ ] **Step 4:** Commit: `fix: form autocomplete, inline validation, error placement`

---

## Phase 3: Code Quality (Priority: MEDIUM)

### Task 3.1: Extract shared date utilities

**Files:**
- Create: `client/src/lib/dateUtils.ts`
- Modify: `client/src/pages/Embaixadores.tsx`
- Modify: `client/src/pages/TercaDeGloria.tsx`
- Modify: `client/src/pages/Eventos.tsx`
- Modify: `client/src/pages/Entrevistas.tsx`

- [ ] **Step 1:** Create `dateUtils.ts` with: `formatDate`, `formatDateTime`, `dateToTs`, `tsToDate`, `tsToInputDT`, `dateToTimestamp`

- [ ] **Step 2:** Replace duplicated functions in each page with imports

- [ ] **Step 3:** Verify build passes

- [ ] **Step 4:** Commit: `refactor: extract shared date utilities`

### Task 3.2: Extract LanguageSelector component

**Files:**
- Create: `client/src/components/LanguageSelector.tsx`
- Modify: `client/src/components/DashboardLayout.tsx`
- Modify: `client/src/pages/Login.tsx`

- [ ] **Step 1:** Create reusable LanguageSelector with flag images and styling props

- [ ] **Step 2:** Replace duplicated language selector code in DashboardLayout (sidebar + mobile)

- [ ] **Step 3:** Replace language selector in Login.tsx

- [ ] **Step 4:** Commit: `refactor: extract LanguageSelector component`

### Task 3.3: Clean up sendNotification functions in page forms

**Files:**
- Modify: `client/src/pages/Eventos.tsx`
- Modify: `client/src/pages/TercaDeGloria.tsx`
- Modify: `client/src/pages/Entrevistas.tsx`

- [ ] **Step 1:** The old `sendNotification` functions (that build messages client-side) are still in the code but the NotifyDialog now uses server-side templates. Remove the dead `sendNotification` functions.

- [ ] **Step 2:** Update the form's `notificar` selector in create forms to use the new notify-all API (type+id) instead of the old client-side approach

- [ ] **Step 3:** Verify build passes

- [ ] **Step 4:** Commit: `refactor: remove dead client-side notification code`

### Task 3.4: Consolidate auth state management

**Files:**
- Modify: `client/src/hooks/useAuth.ts`
- Modify: `client/src/App.tsx`

- [ ] **Step 1:** Remove duplicate `onAuthStateChange` listener from App.tsx

- [ ] **Step 2:** Move `authReady` and `needsPassword` logic into useAuth hook

- [ ] **Step 3:** Verify login, OAuth, and password recovery flows still work

- [ ] **Step 4:** Commit: `refactor: consolidate auth state into useAuth hook`

### Task 3.5: Remove Profile page window.location.reload()

**Files:**
- Modify: `client/src/pages/Profile.tsx`

- [ ] **Step 1:** Replace `window.location.reload()` with React Query invalidation

- [ ] **Step 2:** Commit: `fix: replace page reload with query invalidation in Profile`

---

## Phase 4: Data Integrity (Priority: HIGH)

### Task 4.1: Add foreign key constraints

**Run in Supabase SQL Editor:**

```sql
-- Add FK for pagamentos -> embaixadores
ALTER TABLE pagamentos
  ADD CONSTRAINT fk_pagamentos_embaixador
  FOREIGN KEY ("embaixadorId") REFERENCES embaixadores(id) ON DELETE CASCADE;

-- Add FK for welcomeKits -> embaixadores
ALTER TABLE "welcomeKits"
  ADD CONSTRAINT fk_welcomekits_embaixador
  FOREIGN KEY ("embaixadorId") REFERENCES embaixadores(id) ON DELETE CASCADE;

-- Add FK for kit_historico -> embaixadores (if applicable)
ALTER TABLE kit_historico
  ADD CONSTRAINT fk_kithistorico_embaixador
  FOREIGN KEY ("embaixadorId") REFERENCES embaixadores(id) ON DELETE CASCADE;
```

- [ ] **Step 1:** Run SQL in Supabase Dashboard

- [ ] **Step 2:** Verify deleting an embaixador cascades to related records

### Task 4.2: Audit RLS Policies

**Run in Supabase SQL Editor:**

- [ ] **Step 1:** Check current RLS status:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

- [ ] **Step 2:** Enable RLS on all tables that don't have it

- [ ] **Step 3:** Create policies:
  - `SELECT` for authenticated users
  - `INSERT/UPDATE/DELETE` for admin role only
  - Verify Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS

### Task 4.3: Drop unused app_config table

```sql
DROP TABLE IF EXISTS app_config;
```

### Task 4.4: Add idioma column (if not done yet)

```sql
ALTER TABLE embaixadores ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt' CHECK (idioma IN ('pt', 'es', 'en'));
```

---

## Phase 5: Security & LGPD (Priority: CRITICAL)

### Task 5.1: Regenerate Service Role Key

- [ ] **Step 1:** Go to Supabase Dashboard > Settings > API > Service Role Key

- [ ] **Step 2:** Click Regenerate (the old key was exposed in the frontend bundle)

- [ ] **Step 3:** Update the key in Supabase Edge Function Secrets if needed

### Task 5.2: Delete GitHub Actions secret

- [ ] **Step 1:** Go to GitHub > embaixadores > Settings > Secrets and variables > Actions

- [ ] **Step 2:** Delete `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Task 5.3: Add Supabase Auth email templates

- [ ] **Step 1:** Go to Supabase Dashboard > Authentication > Emails

- [ ] **Step 2:** Paste templates from `supabase/email-templates.md` for each type:
  - Confirm sign up
  - Invite user
  - Magic link
  - Change email
  - Reset password
  - Reauthentication

### Task 5.4: LGPD Compliance Review

- [ ] **Step 1:** Verify Privacy page (`/privacidade`) covers:
  - Data collected and purpose
  - Data storage and retention
  - User rights (access, correction, deletion)
  - Contact for data requests

- [ ] **Step 2:** Verify Terms page (`/termos`) covers:
  - Service description
  - User responsibilities
  - Data processing consent

- [ ] **Step 3:** Add data export feature (download embaixador's own data)

- [ ] **Step 4:** Add account deletion request flow

### Task 5.5: Backup Strategy

- [ ] **Step 1:** Enable Supabase Point-in-Time Recovery (PITR) if on Pro plan

- [ ] **Step 2:** If on Free plan, create a scheduled Edge Function or cron that exports critical tables to Storage bucket weekly

---

## Phase 6: ErrorBoundary i18n + Minor Polish

### Task 6.1: ErrorBoundary in Portuguese

**Files:**
- Modify: `client/src/components/ErrorBoundary.tsx`

- [ ] **Step 1:** Change "An unexpected error occurred" to Portuguese (or i18n-aware)

- [ ] **Step 2:** Commit

### Task 6.2: Remove debug action from zapi-proxy (if still present)

Already done in previous session. Verify.

---

## Execution Order

| Order | Phase | Priority | Estimated Tasks |
|-------|-------|----------|-----------------|
| 1 | Phase 5: Security & LGPD | CRITICAL | 5 tasks (mostly manual) |
| 2 | Phase 4: Data Integrity | HIGH | 4 tasks (SQL) |
| 3 | Phase 1: i18n Completion | HIGH | 4 tasks |
| 4 | Phase 2: UI/UX Improvements | HIGH | 4 tasks |
| 5 | Phase 3: Code Quality | MEDIUM | 5 tasks |
| 6 | Phase 6: Polish | LOW | 2 tasks |

---

## Pre-Deployment Checklist

- [ ] All changes tested in feature branch
- [ ] Build passes (`pnpm build`)
- [ ] Edge Functions deployed to staging/test
- [ ] Manual testing of login, CRUD, notifications, WhatsApp, email
- [ ] Mobile responsive check (375px, 768px, 1024px)
- [ ] Accessibility check (keyboard nav, screen reader)
- [ ] Production deployment only after admin approval
