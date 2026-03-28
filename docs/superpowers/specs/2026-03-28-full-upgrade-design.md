# Embaixadores dos Legendarios - Full Upgrade Design Spec

**Data:** 2026-03-28
**Autor:** Claude + Marcio Sager
**Status:** Draft

---

## Visao Geral

Upgrade completo do sistema Embaixadores dos Legendarios cobrindo seguranca, mobile, novas features e UX. Organizado em 5 fases por prioridade.

---

## FASE 1: Seguranca (URGENTE)

### 1.1 Remover service_role key do frontend

**Problema:** `VITE_SUPABASE_SERVICE_ROLE_KEY` esta exposta no browser (Admin.tsx usa direto). Qualquer pessoa pode ver no DevTools e ter acesso total ao banco.

**Solucao:**
- Mover invite de usuario para endpoint tRPC no servidor (`adminProcedure`)
- Remover `VITE_SUPABASE_SERVICE_ROLE_KEY` do frontend
- Admin.tsx chama tRPC em vez de fetch direto ao Supabase
- Servidor usa service_role key internamente (nunca exposta)

**Arquivos afetados:**
- `client/src/pages/Admin.tsx` - remover fetch direto
- `server/routers.ts` - novo endpoint `users.invite`
- `client/src/hooks/useSupabase.ts` - remover useUpdateUserRole direto
- `.env` - remover prefixo VITE_ do service_role key

### 1.2 Proteger role update no servidor

**Problema:** `useUpdateUserRole` atualiza role direto via Supabase client. Qualquer usuario autenticado pode se promover a admin.

**Solucao:**
- Mover update de role para `adminProcedure` no tRPC
- Remover mutacao direta do useSupabase.ts
- Validar no servidor que o usuario atual e admin antes de alterar roles

### 1.3 Proteger todas as operacoes de escrita

**Problema:** Create/update/delete de embaixadores/eventos/etc usam `protectedProcedure` (qualquer usuario autenticado pode modificar).

**Solucao:**
- Mudar operacoes de escrita para `adminProcedure`
- Manter leitura como `protectedProcedure`
- Excecao: perfil proprio (usuario pode editar seus proprios dados)

### 1.4 Rotacionar secrets

**Acao manual no Supabase:**
- Regenerar service_role key
- Regenerar anon key
- Alterar senha do banco
- Atualizar GitHub Secrets
- Garantir .env nao esta no historico git

### 1.5 Headers de seguranca

- Adicionar `helmet.js` no Express
- CORS restrito ao dominio `embaixadores.marciosager.com`
- CSP headers basicos

---

## FASE 2: Mobile & Responsividade

### 2.1 Grids responsivos

**Correcoes:**

| Arquivo | Linha | De | Para |
|---------|-------|----|------|
| Embaixadores.tsx | 108 | `grid-cols-4` | `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` |
| Home.tsx | 119 | `grid-cols-2 lg:grid-cols-4` | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |
| Home.tsx | 127 | `grid-cols-1 sm:grid-cols-3` | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` |
| WelcomeKit.tsx | 141 | `grid-cols-3` | `grid-cols-2 md:grid-cols-3` |
| Formularios (todos) | varios | `grid-cols-2/3` | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` |

### 2.2 Dialogs responsivos

- Todos os dialogs: `max-w-[calc(100vw-2rem)] sm:max-w-lg`
- Formularios dentro de dialogs: grids com breakpoints mobile

### 2.3 Touch targets

- Botoes de icone: minimo `p-2.5` para atingir 44px
- Select de role no Admin: aumentar `py-2 px-3`
- Inputs de data: `text-base` no mobile (evitar zoom iOS)

### 2.4 Fontes miniimas

- Substituir `text-[0.5625rem]` (9px) por minimo `text-[0.6875rem]` (11px)
- Labels de stats: `text-xs` minimo

---

## FASE 3: Novas Features

### 3.1 Upload de foto de perfil dos embaixadores

**Abordagem:** Supabase Storage

**Schema:**
- Tabela `embaixadores` ja tem campo `fotoUrl` (varchar)
- Criar bucket `avatars` no Supabase Storage
- Upload via frontend, salvar URL publica no campo `fotoUrl`

**UI:**
- No formulario de embaixador: area clicavel com preview da foto
- Aceitar JPG/PNG, max 2MB
- Redimensionar client-side antes do upload (max 400x400)
- No card/lista: mostrar foto em vez do avatar com inicial
- Fallback: se sem foto, manter avatar com inicial (comportamento atual)

**Arquivos:**
- `client/src/pages/Embaixadores.tsx` - campo de upload no formulario + exibir foto
- `client/src/hooks/useSupabase.ts` - funcao de upload para Storage
- `server/routers.ts` - endpoint para atualizar fotoUrl

### 3.2 Perfil do usuario (clicar no nome para editar)

**Funcionalidade:** Ao clicar no nome do usuario no sidebar, abrir pagina/modal de perfil.

**Campos editaveis:**
- Nome completo
- Telefone
- Email (somente leitura - vinculado ao auth)
- Numero do Legendario
- Numero do Embaixador
- Cidade, Estado
- Profissao, Empresa
- Foto de perfil

**Abordagem:**
- Criar pagina `/perfil` ou modal fullscreen
- Buscar dados do embaixador vinculado ao usuario logado (via openId)
- Permitir edicao dos campos proprios
- Usar mesma logica de upload de foto

**Arquivos:**
- `client/src/pages/Profile.tsx` - nova pagina de perfil
- `client/src/App.tsx` - adicionar rota `/perfil`
- `client/src/components/DashboardLayout.tsx` - link no nome do usuario para `/perfil`

### 3.3 Sistema de Kits expandido

**Tipos de kit:**
1. **Welcome Kit** (existente) - para novos embaixadores
2. **Kit de Renovacao** - para embaixadores que renovam
3. **Kit de Aniversario** - para aniversario do embaixador

**Schema - Nova tabela `kit_tipos`:**
```sql
CREATE TYPE kit_tipo AS ENUM ('welcome', 'renovacao', 'aniversario');

ALTER TABLE "welcomeKits" ADD COLUMN tipo kit_tipo DEFAULT 'welcome';
ALTER TABLE "welcomeKits" ADD COLUMN ano INTEGER;
```

**Itens por tipo de kit:**
- Welcome: patch, pin, bone, anel, espada, mochila (existentes)
- Renovacao: definir com usuario (configuravel)
- Aniversario: definir com usuario (configuravel)

**UI:**
- Tabs no topo da pagina: Welcome | Renovacao | Aniversario
- Mesmo layout de cards/progress para cada tipo
- Botao "Novo Kit" com selecao de tipo

### 3.4 Historico de alteracoes no kit

**Schema - Nova tabela `kit_historico`:**
```sql
CREATE TABLE kit_historico (
  id SERIAL PRIMARY KEY,
  kit_id INTEGER REFERENCES "welcomeKits"(id),
  item TEXT NOT NULL,
  acao TEXT NOT NULL,
  usuario_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Campos:**
- `item`: qual item foi alterado (ex: "patchEntregue")
- `acao`: "entregue" ou "removido"
- `usuario_id`: quem fez a alteracao
- `created_at`: quando

**UI:**
- No detail sheet do kit, adicionar secao "Historico"
- Lista cronologica: "Marcio Sager marcou Patch como entregue em 28/03/2026"
- Icones de check/uncheck com cores

### 3.5 Relatorio de entrega de kits em PDF

**Abordagem:** Gerar PDF client-side com `jspdf` + `jspdf-autotable`

**Conteudo do PDF:**
- Header: Logo Legendarios + titulo "Relatorio de Entrega de Kits"
- Data de geracao
- Tabela: Nome | Patch | Pin | Anel | Espada | Mochila | Status | Data
- Checkmarks para itens entregues
- Totais no rodape (X pendentes, Y parciais, Z completos)
- Campo de assinatura no final

**UI:**
- Botao "Exportar PDF" na pagina Welcome Kit
- Filtro: exportar todos ou apenas filtro atual (pendentes, parciais, etc)

### 3.6 Export XLSX

**Abordagem:** Usar `xlsx` (SheetJS) para gerar planilhas Excel

**Paginas com export:**
- Embaixadores: planilha com todos os campos
- Eventos: lista de eventos
- Entrevistas: lista de candidatos
- Welcome Kit: status de entrega
- Terca de Gloria: historico de reunioes

**UI:**
- Botao de download (icone planilha) no header de cada pagina
- Exporta dados filtrados (respeita busca/filtro ativo)

---

## FASE 4: Pagina de Pagamentos

### 4.1 UI de Pagamentos

**A tabela `pagamentos` ja existe no banco** com campos:
- embaixadorId, valor, dataVencimento, dataPagamento
- status (pendente/pago/atrasado)
- observacoes

**Pagina:**
- Cards de resumo: total pendente, total pago, total atrasado
- Lista de pagamentos com filtro por status
- Criar/editar/excluir pagamentos
- Vincular ao embaixador
- Marcar como pago (atualiza dataPagamento)

**Navegacao:**
- Adicionar "Pagamentos" no menu lateral (icone: DollarSign ou CreditCard)

---

## FASE 5: Analytics & Dashboard Avancado

### 5.1 Graficos no Dashboard

**Usar:** Recharts (ja instalado como dependencia)

**Graficos:**
- Crescimento de embaixadores por mes (line chart)
- Distribuicao por status (donut chart)
- Entrega de kits por mes (bar chart)
- Eventos realizados vs cancelados (bar chart)

### 5.2 Pagina de Relatorios

- Nova pagina `/relatorios`
- Filtros por periodo
- Export XLSX de qualquer relatorio

---

## Dependencias a Instalar

```bash
npm install xlsx jspdf jspdf-autotable browser-image-resizer helmet cors
```

---

## Ordem de Implementacao

| Fase | Descricao | Prioridade | Estimativa |
|------|-----------|------------|------------|
| 1 | Seguranca | URGENTE | Primeiro |
| 2 | Mobile/Responsividade | ALTA | Segundo |
| 3.1 | Upload de foto | ALTA | Terceiro |
| 3.2 | Perfil do usuario | ALTA | Terceiro |
| 3.3 | Sistema de kits expandido | MEDIA | Quarto |
| 3.4 | Historico de kit | MEDIA | Quarto |
| 3.5 | PDF de kits | MEDIA | Quarto |
| 3.6 | Export XLSX | MEDIA | Quarto |
| 4 | Pagamentos | MEDIA | Quinto |
| 5 | Analytics | BAIXA | Sexto |

---

## Decisoes de Design

1. **Upload de fotos**: Supabase Storage (ja integrado, sem custo adicional no free tier)
2. **PDF**: Client-side com jspdf (sem necessidade de servidor para renderizar)
3. **XLSX**: Client-side com SheetJS (sem servidor)
4. **Historico de kit**: Tabela separada com log de acoes
5. **Tipos de kit**: Enum na mesma tabela (adicionar coluna `tipo`)
6. **Perfil**: Pagina dedicada (nao modal) para melhor UX mobile
7. **Seguranca**: Tudo via tRPC server-side, nunca client-side
