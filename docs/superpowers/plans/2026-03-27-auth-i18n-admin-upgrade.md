# Embaixadores Full Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth (email+password), fix all i18n labels, change color theme from blue to orange, add admin area with user management, and polish the layout.

**Architecture:** Static React/Vite frontend calling Supabase directly. Auth handled by Supabase Auth (email+password). Admin invites users via Supabase admin functions. RLS policies enforce access control at the database level.

**Tech Stack:** React 19, Vite 7, Supabase JS v2, TailwindCSS v4, wouter (routing)

**Color palette (Los Legendarios brand):**
- Primary: `#FF6B00` (orange)
- Primary hover: `#FF8C33` (lighter orange)
- Primary muted: `rgba(255, 107, 0, 0.12)` (orange 12%)
- Secondary: `#E85D00` (darker orange)
- Background: `#000000`, `#0A0A0A`
- Surface: `#111111`, `#1A1A1A`
- Text: `#F5F5F7`, `#86868B`
- Success: `#30D158`
- Error: `#FF453A`

---

## Task 1: Fix i18n — Add all missing translation keys

**Files:**
- Modify: `client/src/lib/i18n.tsx`

**Missing keys to add (in all 3 languages: pt, es, en):**

| Key | PT | ES | EN |
|-----|----|----|------|
| `emb.nome` | Nome Completo | Nombre Completo | Full Name |
| `emb.nascimento` | Data de Nascimento | Fecha de Nacimiento | Date of Birth |
| `emb.ingresso` | Ingresso | Ingreso | Admission |
| `emb.renovacao` | Renovação | Renovación | Renewal |
| `emb.nomeObrigatorio` | Nome é obrigatório | Nombre es obligatorio | Name is required |
| `emb.excluir` | Excluir | Eliminar | Delete |
| `ent.telefoneCandidato` | Telefone | Teléfono | Phone |
| `ent.dataEntrevista` | Data da Entrevista | Fecha de Entrevista | Interview Date |
| `ent.status` | Status | Estado | Status |
| `ent.nomeObrigatorio` | Nome é obrigatório | Nombre es obligatorio | Name is required |
| `ent.linkMeet` | Link Google Meet | Enlace Google Meet | Google Meet Link |
| `ent.observacoes` | Observações | Observaciones | Notes |
| `tg.temaObrigatorio` | Tema é obrigatório | Tema es obligatorio | Topic is required |
| `kit.buscar` | Buscar kit... | Buscar kit... | Search kit... |
| `kit.itensEntregues` | itens entregues | ítems entregados | items delivered |
| `ev.tituloObrigatorio` | Título é obrigatório | Título es obligatorio | Title is required |
| `ev.linkMeet` | Link Google Meet | Enlace Google Meet | Google Meet Link |
| `ev.excluir` | Excluir | Eliminar | Delete |

- [ ] **Step 1:** Add all missing keys to PT translations object (after line 90)
- [ ] **Step 2:** Add all missing keys to ES translations object
- [ ] **Step 3:** Add all missing keys to EN translations object
- [ ] **Step 4:** Fix prefix inconsistencies in pages:
  - `Entrevistas.tsx`: Change `t("tg.linkMeet")` → `t("ent.linkMeet")`
  - `Eventos.tsx`: Change `t("tg.linkMeet")` → `t("ev.linkMeet")`
  - `Entrevistas.tsx`: Change `t("emb.observacoes")` → `t("ent.observacoes")`
  - `Entrevistas.tsx`: Change `t("emb.excluir")` → `t("emb.excluir")` (keep, it's shared)
- [ ] **Step 5:** Build to verify no broken keys: `npx vite build`
- [ ] **Step 6:** Commit: `git commit -m "fix: add all missing i18n translation keys"`

---

## Task 2: Change color theme — Blue to Orange

**Files:**
- Modify: `client/src/index.css` (CSS variables and apple-btn classes)
- Modify: `client/src/components/DashboardLayout.tsx`
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/pages/Embaixadores.tsx`
- Modify: `client/src/pages/Entrevistas.tsx`
- Modify: `client/src/pages/Eventos.tsx`
- Modify: `client/src/pages/TercaDeGloria.tsx`
- Modify: `client/src/pages/WelcomeKit.tsx`

**Color replacements:**

| Old | New | Context |
|-----|-----|---------|
| `#0A84FF` | `#FF6B00` | Primary blue → orange |
| `#409CFF` | `#FF8C33` | Light blue hover → light orange |
| `#5E5CE6` | `#E85D00` | Secondary purple → dark orange |
| `rgba(10, 132, 255, ...)` | `rgba(255, 107, 0, ...)` | Blue opacity variants |
| `rgba(94, 92, 230, ...)` | `rgba(232, 93, 0, ...)` | Purple opacity variants |
| `oklch(0.62 0.19 255)` | `oklch(0.65 0.22 45)` | CSS theme primary variable |

- [ ] **Step 1:** Update `index.css` — replace all blue color values with orange equivalents
- [ ] **Step 2:** Update `DashboardLayout.tsx` — replace all `#0A84FF` and `#5E5CE6` references
- [ ] **Step 3:** Update all 6 page files — global find-replace for color values
- [ ] **Step 4:** Build to verify: `npx vite build`
- [ ] **Step 5:** Commit: `git commit -m "style: change color theme from blue to orange (Legendários brand)"`

---

## Task 3: Add favicon and local logos

**Files:**
- Modify: `client/index.html` (add favicon link)
- Already downloaded: `client/public/favicon.ico`, `client/public/logo-legendarios.png`

- [ ] **Step 1:** Add favicon link to `client/index.html`:
  ```html
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  ```
- [ ] **Step 2:** Update logo references in `DashboardLayout.tsx` to use local files:
  ```tsx
  const LOGO_LEGENDARIOS = "/logo-legendarios.png";
  ```
- [ ] **Step 3:** Build and verify favicon shows: `npx vite build`
- [ ] **Step 4:** Commit: `git commit -m "feat: add favicon and local logo assets"`

---

## Task 4: Supabase Auth — Create auth hook and login page

**Files:**
- Create: `client/src/hooks/useAuth.ts` (new Supabase auth hook)
- Create: `client/src/pages/Login.tsx` (login page component)
- Modify: `client/src/lib/supabase.ts` (add auth listener)
- Modify: `client/src/App.tsx` (add login route and auth guard)
- Modify: `client/src/main.tsx` (add auth state provider)

- [ ] **Step 1:** Create `client/src/hooks/useAuth.ts`:
  ```tsx
  // Supabase Auth hook
  // - getSession() on mount
  // - onAuthStateChange listener
  // - signIn(email, password)
  // - signOut()
  // - resetPassword(email)
  // - Returns: { user, session, loading, signIn, signOut, resetPassword }
  ```

- [ ] **Step 2:** Create `client/src/pages/Login.tsx`:
  - Dark background with orange accents
  - Logos (local files)
  - Email + password form
  - "Esqueceu a senha?" link → triggers resetPassword
  - Error messages (wrong password, etc)
  - Loading state on submit

- [ ] **Step 3:** Create `client/src/pages/ResetPassword.tsx`:
  - Form to enter email
  - Success message after sending reset link
  - Link back to login

- [ ] **Step 4:** Update `client/src/App.tsx`:
  - Add auth guard wrapper component
  - If not authenticated → show Login
  - If authenticated → show dashboard routes
  - Add `/reset-password` route

- [ ] **Step 5:** Update `DashboardLayout.tsx`:
  - Replace hardcoded user with real auth user
  - Wire logout button to `signOut()`
  - Show user email/name from session

- [ ] **Step 6:** Build and test: `npx vite build`
- [ ] **Step 7:** Commit: `git commit -m "feat: add Supabase Auth with email+password login"`

---

## Task 5: Admin area — User management and role-based access

**Files:**
- Create: `client/src/pages/Admin.tsx` (admin user management page)
- Create: `client/src/components/AdminGuard.tsx` (role-based access component)
- Modify: `client/src/App.tsx` (add admin route)
- Modify: `client/src/components/DashboardLayout.tsx` (add admin nav item for admins)
- Modify: `client/src/hooks/useAuth.ts` (add role checking)
- Modify: `client/src/hooks/useSupabase.ts` (add admin hooks)

- [ ] **Step 1:** Update `useAuth.ts` to fetch user role from `users` table:
  ```tsx
  // After auth state change, query users table for role
  // Return: { ...authState, role: "admin" | "user", isAdmin: boolean }
  ```

- [ ] **Step 2:** Create `client/src/components/AdminGuard.tsx`:
  ```tsx
  // If user.role === "admin" → render children
  // If user.role === "user" → show "Access Denied" or hide content
  ```

- [ ] **Step 3:** Create admin hooks in `useSupabase.ts`:
  ```tsx
  // useUsers() - list all users (admin only)
  // useInviteUser() - send invite email via Supabase
  // useUpdateUserRole() - change user role
  ```

- [ ] **Step 4:** Create `client/src/pages/Admin.tsx`:
  - List all users (name, email, role, last login)
  - Invite new user form (email input + send invite button)
  - Change role dropdown (user/admin)
  - Orange accent styling consistent with rest of app

- [ ] **Step 5:** Update `App.tsx` — add `/admin` route wrapped in AdminGuard
- [ ] **Step 6:** Update `DashboardLayout.tsx` — add "Admin" nav item (Shield icon), visible only when `isAdmin`

- [ ] **Step 7:** Add i18n keys for admin page (PT/ES/EN):
  ```
  admin.title, admin.subtitle, admin.users, admin.invite,
  admin.email, admin.role, admin.lastLogin, admin.sendInvite,
  admin.roleUser, admin.roleAdmin, admin.inviteSent, admin.noUsers
  ```

- [ ] **Step 8:** Build and test: `npx vite build`
- [ ] **Step 9:** Commit: `git commit -m "feat: add admin area with user management and role-based access"`

---

## Task 6: Update Supabase RLS policies

**Files:**
- Create/Update: `supabase-rls-update.sql`

- [ ] **Step 1:** Create SQL to update RLS policies:
  ```sql
  -- Drop permissive policies
  -- Create authenticated-only policies for all tables
  -- Admin can do everything, regular users can SELECT only
  ```

- [ ] **Step 2:** Run SQL in Supabase SQL Editor (manual step)
- [ ] **Step 3:** Commit SQL file: `git commit -m "feat: add role-based RLS policies"`

---

## Task 7: Customize Supabase email templates

**Manual steps in Supabase Dashboard > Authentication > Email Templates:**

- [ ] **Step 1:** Customize "Confirm signup" template:
  - Dark background (#0A0A0A), orange CTA button (#FF6B00)
  - Logo at top, "Embaixadores dos Legendários" branding
  - Portuguese text with link

- [ ] **Step 2:** Customize "Invite user" template:
  - Same dark/orange branding
  - "Você foi convidado para o sistema Embaixadores"

- [ ] **Step 3:** Customize "Reset password" template:
  - Same branding
  - "Redefinir sua senha"

---

## Task 8: Final build, deploy, and push

- [ ] **Step 1:** Full build: `npx vite build`
- [ ] **Step 2:** Test locally if possible
- [ ] **Step 3:** Git push to trigger GitHub Actions deploy
- [ ] **Step 4:** Verify at https://embaixadores.marciosager.com
