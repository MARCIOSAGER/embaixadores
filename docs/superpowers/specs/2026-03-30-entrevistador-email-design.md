# Entrevistador Field + Interview Email Templates

**Date:** 2026-03-30
**Status:** Approved

## Summary

Add an `entrevistadorId` field to the `entrevistas` table (FK to `embaixadores`) and create dedicated email/WhatsApp templates for interview notifications — one inspirational template for the candidate, one informational template for the interviewer.

## 1. Database Changes

Add nullable column to `entrevistas` (nullable for backward compatibility with existing rows):

```sql
ALTER TABLE entrevistas ADD COLUMN "entrevistadorId" INTEGER REFERENCES embaixadores(id);
```

- Update `supabase-schema.sql` (reference schema, not a migration)
- Update Drizzle schema (`drizzle/schema.ts`) — add `integer` column, no Drizzle `relations()` (not used in this project)
- Update TypeScript types (`client/src/lib/database.types.ts`)
- **Existing rows** stay with `entrevistadorId = NULL` — no backfill needed
- Run the ALTER TABLE directly on Supabase (no Drizzle migrations in this project)

## 2. Frontend — Entrevistas Form

- New **required** dropdown field "Entrevistador" in the create/edit form (required for new entries; old entries display "—" if null)
- Populated with active embaixadores (`status = 'ativo'`), ordered by `nomeCompleto`
- Uses existing `useEmbaixadores()` hook to fetch data
- Displays in the form between "Indicado por" and "Observacoes"
- Detail view (Sheet) shows the entrevistador name — resolved by matching `entrevistadorId` against the already-loaded embaixadores list on the frontend (no server join needed)

## 3. Email Template — Candidate (Inspirational, Portuguese only)

Fixed template sent to the candidate. This template is Portuguese-only by design — candidates are always Portuguese speakers in this context.

Dynamic fields derived from the single `dataEntrevista` bigint timestamp (formatted separately as date and time):

```
Prezado {nomeCandidato},

AHU!

Informamos que recebemos e analisamos seu formulário de candidatura ao corpo de Embaixadores dos Legendários.

Temos a satisfação de comunicar que sua candidatura foi aprovada para a próxima fase do processo.

Você se encontra a dois passos de integrar um ambiente de homens de corações ensináveis, um ambiente espiritual de aliança, onde fé, propósito e excelência caminham juntos. Um lugar preparado por Deus que te levará a um novo nível na sua vida Relacional, Emocional e Espiritual.

O próximo passo consiste em uma conversa com o Embaixador {nomeEntrevistador}, responsável por esses homens Enviados ao Mundo para Baixar Dores. Trata-se de um momento de alinhamento de visão e conhecimento mútuo.

A agenda segue abaixo:
Dia {dataFormatada} às {horaFormatada}
Google Meet: {linkMeet}

Adicione ao seu calendário: {calendarLink}

Permanecemos à disposição.

Respeitosamente,
Embaixadores Legendários
```

Rendered inside the existing dark HTML email template (orange gradient header + logo).

## 4. Email Template — Interviewer (Informational, Portuguese only)

Concise template sent to the entrevistador with candidate details:

```
Nova Entrevista Agendada

Candidato: {nomeCandidato}
Email: {emailCandidato}
Telefone: {telefoneCandidato}
Indicado por: {indicadoPor}
Data: {dataFormatada} às {horaFormatada}
Google Meet: {linkMeet}

Adicione ao seu calendário: {calendarLink}
```

## 5. WhatsApp Templates

Same content logic as emails but plain text:
- **Candidate:** Inspirational version (same text as email)
- **Interviewer:** Informational version (same text as email)

Note: Z-API is used for sending — these are regular text messages, not WhatsApp Business template messages, so no pre-approval needed.

## 6. Notification Flow Changes (notify-all)

Current flow: sends to selected embaixadores + optionally to candidate.

New flow:
- **Always include the entrevistador** as a recipient (pull email/phone from `embaixadores` table via `entrevistadorId` — secondary query in edge function)
- Use **candidate template** when sending to the candidate
- Use **interviewer template** when sending to the entrevistador
- Use existing generic template for other embaixadores (if any are selected)
- **Deduplication:** If the entrevistador is also manually selected as a recipient, send only the interviewer-specific template (skip the generic one for that person)
- **Missing contact info:** If entrevistador has no email/phone, skip that channel silently (same behavior as existing embaixador notifications)
- **Edit flow:** Changing entrevistador on an existing entrevista does NOT auto-send notifications — admin must manually trigger via the notify button

## 7. Files to Modify

| File | Change |
|------|--------|
| `supabase-schema.sql` | Add `entrevistadorId` column (reference schema) |
| `drizzle/schema.ts` | Add integer column (no relations) |
| `client/src/lib/database.types.ts` | Update Entrevista type |
| `client/src/pages/Entrevistas.tsx` | Dropdown field, detail view, form state |
| `client/src/hooks/useSupabase.ts` | Include entrevistadorId in mutations |
| `client/src/components/NotifyDialog.tsx` | Pass entrevistadorId context to notify-all |
| `supabase/functions/notify-all/index.ts` | New templates, entrevistador recipient logic, dedup |
| `client/src/lib/i18n.tsx` | New translation keys for entrevistador field |
