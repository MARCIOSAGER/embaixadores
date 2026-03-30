# Entrevistador Field + Interview Email Templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an entrevistador dropdown (linked to embaixadores) to the entrevistas form and create dedicated email/WhatsApp templates for candidate and interviewer notifications.

**Architecture:** Nullable FK column `entrevistadorId` on `entrevistas` table pointing to `embaixadores.id`. Frontend resolves entrevistador name via client-side lookup against already-loaded embaixadores data. The `notify-all` edge function gets new template builders for candidate-specific and interviewer-specific messages, with deduplication logic.

**Tech Stack:** Supabase (Postgres), Drizzle ORM schema, React + TanStack Query, Deno edge functions, nodemailer, Z-API (WhatsApp)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase-schema.sql:106-118` | Modify | Add `entrevistadorId` column to reference schema |
| `drizzle/schema.ts:125-140` | Modify | Add `entrevistadorId` integer column |
| `client/src/lib/database.types.ts:111-127` | Modify | Add `entrevistadorId` to Entrevista Row/Insert types |
| `client/src/lib/i18n.tsx` | Modify | Add `ent.entrevistador` key in pt/es/en |
| `client/src/hooks/useSupabase.ts:325-376` | Modify | Include `entrevistadorId` in entrevista hooks |
| `client/src/pages/Entrevistas.tsx` | Modify | Add entrevistador dropdown, detail view, exports |
| `client/src/components/NotifyDialog.tsx` | Modify | Pass `entrevistadorId` in notify-all payload |
| `supabase/functions/notify-all/index.ts` | Modify | New templates + entrevistador recipient logic |

---

## Task 1: Database Schema Updates

**Files:**
- Modify: `supabase-schema.sql:106-118`
- Modify: `drizzle/schema.ts:125-140`
- Modify: `client/src/lib/database.types.ts:111-127`

- [ ] **Step 1: Update `supabase-schema.sql`** — Add `"entrevistadorId" INTEGER REFERENCES embaixadores(id)` after `"indicadoPor"` line in the entrevistas CREATE TABLE.

```sql
-- In the entrevistas table definition, add after indicadoPor:
  "entrevistadorId" INTEGER REFERENCES embaixadores(id),
```

- [ ] **Step 2: Update `drizzle/schema.ts`** — Add `entrevistadorId` integer column to the entrevistas table definition.

```typescript
// Add after indicadoPor line (line ~134):
  entrevistadorId: integer("entrevistadorId"),
```

Note: Need to add `integer` to the import from `drizzle-orm/pg-core` (line 1).

- [ ] **Step 3: Update `client/src/lib/database.types.ts`** — Add `entrevistadorId: number | null` to the entrevistas Row type.

```typescript
// Add after indicadoPor in entrevistas Row:
  entrevistadorId: number | null;
```

- [ ] **Step 4: Commit**

```bash
git add supabase-schema.sql drizzle/schema.ts client/src/lib/database.types.ts
git commit -m "feat: add entrevistadorId column to entrevistas schema"
```

---

## Task 2: i18n Translation Keys

**Files:**
- Modify: `client/src/lib/i18n.tsx`

- [ ] **Step 1: Add Portuguese key** — After `"ent.indicadoPor"` line (~241), add:

```typescript
"ent.entrevistador": "Entrevistador",
"ent.selecioneEntrevistador": "Selecione o entrevistador",
"ent.entrevistadorObrigatorio": "Entrevistador é obrigatório",
```

- [ ] **Step 2: Add Spanish key** — After the Spanish `"ent.indicadoPor"` line (~637), add:

```typescript
"ent.entrevistador": "Entrevistador",
"ent.selecioneEntrevistador": "Seleccione el entrevistador",
"ent.entrevistadorObrigatorio": "Entrevistador es obligatorio",
```

- [ ] **Step 3: Add English key** — After the English `"ent.indicadoPor"` line (~1033), add:

```typescript
"ent.entrevistador": "Interviewer",
"ent.selecioneEntrevistador": "Select the interviewer",
"ent.entrevistadorObrigatorio": "Interviewer is required",
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/i18n.tsx
git commit -m "feat: add i18n keys for entrevistador field"
```

---

## Task 3: Frontend — Entrevistas Form & Detail View

**Files:**
- Modify: `client/src/pages/Entrevistas.tsx`
- Modify: `client/src/hooks/useSupabase.ts:325-376`

- [ ] **Step 1: Add `useEmbaixadores` import to Entrevistas.tsx** — Line 2, add to imports:

```typescript
import { useEntrevistas, useCreateEntrevista, useUpdateEntrevista, useDeleteEntrevista, useEmbaixadores } from "@/hooks/useSupabase";
```

- [ ] **Step 2: Add embaixadores query and entrevistadorId to form state** — Inside the component:

Add after `const deleteMut` (line ~37):
```typescript
const { data: embaixadores } = useEmbaixadores();
const activeEmbaixadores = (embaixadores || []).filter((e: any) => e.status === "ativo");
```

Update the form `useState` (line ~32) to include `entrevistadorId: ""`:
```typescript
const [form, setForm] = useState({ nomeCandidato: "", emailCandidato: "", telefoneCandidato: "", dataEntrevista: "", linkMeet: "", status: "agendada", observacoes: "", indicadoPor: "", entrevistadorId: "" as string, notificar: "both" as "both" | "whatsapp" | "email" | "none" });
```

Update `resetForm` (line ~39) to include `entrevistadorId: ""`.

Update `openEdit` (line ~40) to include `entrevistadorId: String(ent.entrevistadorId || "")`.

- [ ] **Step 3: Add entrevistadorId to form submission** — In `handleSubmit` (line ~45), add to the `d` object:

```typescript
entrevistadorId: form.entrevistadorId ? Number(form.entrevistadorId) : null
```

Also add validation before submission:
```typescript
if (!form.entrevistadorId && !editingId) return toast.error(t("ent.entrevistadorObrigatorio"));
```

- [ ] **Step 4: Add dropdown to form UI** — After the `indicadoPor` input (line ~306), add the entrevistador select:

```tsx
<div>
  <label className="apple-input-label">{t("ent.entrevistador")} *</label>
  <select
    value={form.entrevistadorId}
    onChange={e => setForm({ ...form, entrevistadorId: e.target.value })}
    className="apple-input"
  >
    <option value="">{t("ent.selecioneEntrevistador")}</option>
    {activeEmbaixadores.map((e: any) => (
      <option key={e.id} value={e.id}>{e.nomeCompleto}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 5: Add entrevistador name to detail view (Sheet)** — In the detail sheet's `apple-card-inset` section (after `indicadoPor` around line ~217), add:

```tsx
{(() => {
  const entrevistador = activeEmbaixadores.find((e: any) => e.id === selected.entrevistadorId);
  return entrevistador ? (
    <div className="flex items-center gap-3"><User className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{t("ent.entrevistador")}: {entrevistador.nomeCompleto}</span></div>
  ) : null;
})()}
```

- [ ] **Step 6: Add entrevistador to list card** — In the card's metadata row (line ~169 area), after `indicadoPor`, show entrevistador name:

```tsx
{(() => {
  const entrevistador = activeEmbaixadores.find((e: any) => e.id === ent.entrevistadorId);
  return entrevistador ? <span className="flex items-center gap-1"><User className="w-3 h-3" strokeWidth={1.5} />{t("ent.entrevistador")}: {entrevistador.nomeCompleto}</span> : null;
})()}
```

- [ ] **Step 7: Add entrevistador to exports** — In `handleExport` (line ~64), add `"Entrevistador"` column:

```typescript
"Entrevistador": (() => { const e = activeEmbaixadores.find((e: any) => e.id === ent.entrevistadorId); return e?.nomeCompleto || ""; })(),
```

In `handleExportPdf` (line ~76), add entrevistador column to headers and rows.

- [ ] **Step 8: Verify the app builds**

Run: `cd client && npx vite build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/Entrevistas.tsx client/src/hooks/useSupabase.ts
git commit -m "feat: add entrevistador dropdown to entrevistas form and detail view"
```

---

## Task 4: NotifyDialog — Pass entrevistadorId

**Files:**
- Modify: `client/src/components/NotifyDialog.tsx`

- [ ] **Step 1: Add `entrevistadorId` to NotifyDialogProps** — Update the interface (line ~12):

```typescript
interface NotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "evento" | "terca" | "entrevista";
  id: number | null;
  title: string;
  entrevistadorId?: number | null;  // NEW
}
```

- [ ] **Step 2: Destructure and pass in handleSend** — Update the component signature and the fetch body:

```typescript
export default function NotifyDialog({ open, onOpenChange, type, id, title, entrevistadorId }: NotifyDialogProps) {
```

In `handleSend`, add `entrevistadorId` to the JSON body:
```typescript
body: JSON.stringify({
  type,
  id,
  channel,
  recipients: recipientMode === "all" ? "all" : selectedIds,
  includeCandidato: type === "entrevista" ? includeCandidato : undefined,
  entrevistadorId: type === "entrevista" ? entrevistadorId : undefined,
  locale,
}),
```

- [ ] **Step 3: Update Entrevistas.tsx to pass entrevistadorId** — In the NotifyDialog usage (line ~348):

```tsx
<NotifyDialog
  open={!!notifyTarget}
  onOpenChange={(o) => { if (!o) setNotifyTarget(null); }}
  type="entrevista"
  id={notifyTarget?.id || null}
  title={`Entrevista: ${notifyTarget?.nomeCandidato || ""}`}
  entrevistadorId={notifyTarget?.entrevistadorId}
/>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/NotifyDialog.tsx client/src/pages/Entrevistas.tsx
git commit -m "feat: pass entrevistadorId from NotifyDialog to notify-all"
```

---

## Task 5: notify-all Edge Function — Templates + Entrevistador Logic

**Files:**
- Modify: `supabase/functions/notify-all/index.ts`

This is the most complex task. Changes needed:
1. New `buildEntrevistaCandidatoMsg` function (inspirational template)
2. New `buildEntrevistaEntrevistadorMsg` function (informational template)
3. Fetch entrevistador record from DB
4. Send entrevistador-specific message
5. Dedup if entrevistador is also in manual recipients

- [ ] **Step 1: Update EntrevistaData interface** — Add `entrevistadorId` and `entrevistadorNome` (line ~103):

```typescript
interface EntrevistaData {
  nomeCandidato: string;
  dataEntrevista: number;
  linkMeet?: string;
  indicadoPor?: string;
  emailCandidato?: string;
  telefoneCandidato?: string;
  entrevistadorId?: number;
}
```

- [ ] **Step 2: Add helper to format date and time separately**

```typescript
function formatDateOnly(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
}

function formatTimeOnly(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
```

- [ ] **Step 3: Add `buildEntrevistaCandidatoMsg` function** — Inspirational template (Portuguese only):

```typescript
function buildEntrevistaCandidatoMsg(ent: EntrevistaData, entrevistadorNome: string) {
  const dataStr = formatDateOnly(ent.dataEntrevista);
  const horaStr = formatTimeOnly(ent.dataEntrevista);
  const title = `Entrevista - ${ent.nomeCandidato}`;
  const calLink = buildCalendarLink(title, ent.dataEntrevista, undefined, undefined, ent.linkMeet);

  const text = `Prezado ${ent.nomeCandidato},

AHU!

Informamos que recebemos e analisamos seu formulário de candidatura ao corpo de Embaixadores dos Legendários.

Temos a satisfação de comunicar que sua candidatura foi aprovada para a próxima fase do processo.

Você se encontra a dois passos de integrar um ambiente de homens de corações ensináveis, um ambiente espiritual de aliança, onde fé, propósito e excelência caminham juntos. Um lugar preparado por Deus que te levará a um novo nível na sua vida Relacional, Emocional e Espiritual.

O próximo passo consiste em uma conversa com o Embaixador ${entrevistadorNome}, responsável por esses homens Enviados ao Mundo para Baixar Dores. Trata-se de um momento de alinhamento de visão e conhecimento mútuo.

A agenda segue abaixo:
Dia ${dataStr} às ${horaStr}${ent.linkMeet ? `\nGoogle Meet: ${ent.linkMeet}` : ""}

Adicione ao seu calendário: ${calLink}

Permanecemos à disposição.

Respeitosamente,
Embaixadores Legendários`;

  const emailBody = text.replace(/\n/g, "<br>");

  return {
    whatsapp: text,
    emailSubject: `Entrevista - Embaixadores dos Legendários`,
    emailTitle: `Entrevista Agendada`,
    emailBody,
  };
}
```

- [ ] **Step 4: Add `buildEntrevistaEntrevistadorMsg` function** — Informational template:

```typescript
function buildEntrevistaEntrevistadorMsg(ent: EntrevistaData) {
  const dataStr = formatDateOnly(ent.dataEntrevista);
  const horaStr = formatTimeOnly(ent.dataEntrevista);
  const title = `Entrevista - ${ent.nomeCandidato}`;
  const calLink = buildCalendarLink(title, ent.dataEntrevista, undefined, undefined, ent.linkMeet);

  const text = `Nova Entrevista Agendada

Candidato: ${ent.nomeCandidato}
Email: ${ent.emailCandidato || "—"}
Telefone: ${ent.telefoneCandidato || "—"}
Indicado por: ${ent.indicadoPor || "—"}
Data: ${dataStr} às ${horaStr}${ent.linkMeet ? `\nGoogle Meet: ${ent.linkMeet}` : ""}

Adicione ao seu calendário: ${calLink}`;

  const emailBody = text.replace(/\n/g, "<br>");

  return {
    whatsapp: text,
    emailSubject: `Nova Entrevista: ${ent.nomeCandidato}`,
    emailTitle: `Nova Entrevista Agendada`,
    emailBody,
  };
}
```

- [ ] **Step 5: Update request parsing** — After parsing the body (line ~172), add `entrevistadorId`:

```typescript
const { type, id, channel, recipients = "all", includeCandidato = true, entrevistadorId, locale: reqLocale = "pt" } = await req.json();
```

- [ ] **Step 6: Fetch entrevistador record** — After fetching the entrevista record (line ~199-204), add:

```typescript
// Fetch entrevistador details
let entrevistadorRecord: { id: number; nomeCompleto: string; email: string | null; telefone: string | null } | null = null;
const entIdToUse = entrevistadorId || eventRecord.entrevistadorId;
if (type === "entrevista" && entIdToUse) {
  const { data: entData } = await supabaseAdmin
    .from("embaixadores")
    .select("id, nomeCompleto, email, telefone")
    .eq("id", entIdToUse)
    .single();
  entrevistadorRecord = entData || null;
}
```

- [ ] **Step 7: Update WhatsApp sending** — After sending to embaixadores and before the candidate block (line ~282), add entrevistador sending:

```typescript
// Send to entrevistador (entrevistas only)
if (type === "entrevista" && entrevistadorRecord?.telefone) {
  const entrevistadorMsg = buildEntrevistaEntrevistadorMsg(eventRecord);
  await sendWa(entrevistadorRecord.telefone, entrevistadorRecord.nomeCompleto, entrevistadorMsg.whatsapp);
}
```

Update the candidate block to use the new candidate template:
```typescript
// Send to candidate (entrevistas only, inspirational template)
if (type === "entrevista" && includeCandidato && candidatePhone && entrevistadorRecord) {
  const candidatoMsg = buildEntrevistaCandidatoMsg(eventRecord, entrevistadorRecord.nomeCompleto);
  await sendWa(candidatePhone, "Candidato", candidatoMsg.whatsapp);
}
```

- [ ] **Step 8: Update email sending** — Same pattern. After sending to embaixadores and before the candidate block (line ~333), add:

```typescript
// Send to entrevistador
if (type === "entrevista" && entrevistadorRecord?.email) {
  const entrevistadorMsg = buildEntrevistaEntrevistadorMsg(eventRecord);
  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: entrevistadorRecord.email,
      subject: entrevistadorMsg.emailSubject,
      text: entrevistadorMsg.whatsapp,
      html: buildEmailHtml(entrevistadorMsg.emailTitle, entrevistadorMsg.emailBody),
    });
    results.email.sent++;
  } catch (err: any) { results.email.failed++; results.email.errors.push(`Entrevistador: ${err.message}`); }
}
```

Update the candidate block to use the candidate template:
```typescript
// Send to candidate (inspirational template)
if (type === "entrevista" && includeCandidato && candidateEmail && entrevistadorRecord) {
  const candidatoMsg = buildEntrevistaCandidatoMsg(eventRecord, entrevistadorRecord.nomeCompleto);
  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: candidateEmail,
      subject: candidatoMsg.emailSubject,
      text: candidatoMsg.whatsapp,
      html: buildEmailHtml(candidatoMsg.emailTitle, candidatoMsg.emailBody),
    });
    results.email.sent++;
  } catch (err: any) { results.email.failed++; results.email.errors.push(`Candidato: ${err.message}`); }
}
```

- [ ] **Step 9: Add deduplication** — When building the embaixadores recipient list, filter out the entrevistador to avoid double-sending:

After fetching embaixadores (line ~226 or ~233), add:
```typescript
// Dedup: remove entrevistador from generic list (they get their own template)
if (type === "entrevista" && entrevistadorRecord) {
  embaixadores = embaixadores.filter(e => e.id !== entrevistadorRecord!.id);
}
```

- [ ] **Step 10: Update total count** — Update the response total (line ~344) to account for entrevistador:

```typescript
total: embaixadores.length
  + (type === "entrevista" && includeCandidato ? 1 : 0)
  + (type === "entrevista" && entrevistadorRecord ? 1 : 0),
```

- [ ] **Step 11: Commit**

```bash
git add supabase/functions/notify-all/index.ts
git commit -m "feat: add candidate/interviewer email templates and entrevistador recipient logic"
```

---

## Task 6: Run SQL Migration on Supabase

- [ ] **Step 1: Run the ALTER TABLE** — Execute directly on Supabase SQL Editor:

```sql
ALTER TABLE entrevistas ADD COLUMN "entrevistadorId" INTEGER REFERENCES embaixadores(id);
```

- [ ] **Step 2: Verify** — Check column exists:

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entrevistas' AND column_name = 'entrevistadorId';
```

---

## Task 7: Final Verification

- [ ] **Step 1: Build the client**

Run: `cd client && npx vite build`
Expected: Build succeeds.

- [ ] **Step 2: Manual smoke test** — Start dev server and verify:
  - Entrevistador dropdown appears in form with active embaixadores
  - Creating an entrevista with entrevistador saves correctly
  - Detail view shows entrevistador name
  - Editing an entrevista preserves entrevistador selection
  - Old entrevistas without entrevistador display gracefully (show "—")
  - Export XLSX/PDF includes entrevistador column

- [ ] **Step 3: Deploy edge function**

Run: `supabase functions deploy notify-all`

- [ ] **Step 4: Test notification flow** — Create a test entrevista, click notify, verify:
  - Candidate receives inspirational email with entrevistador name
  - Entrevistador receives informational email with candidate details
  - Other embaixadores receive generic template
  - No duplicate sends to entrevistador

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: final adjustments for entrevistador feature"
```
