import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import * as db from "./db";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Users (admin)
  users: router({
    invite: adminProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const supabaseAdmin = createClient(
        ENV.supabaseUrl,
        ENV.supabaseServiceRoleKey
      );
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(input.email);
      if (error) throw new Error(error.message);
      return { success: true };
    }),
  }),

  // Dashboard
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // Embaixadores
  embaixador: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.listEmbaixadores(input?.search);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getEmbaixador(input.id);
    }),
    create: protectedProcedure.input(z.object({
      nomeCompleto: z.string().min(1),
      numeroLegendario: z.string().optional().nullable(),
      numeroEmbaixador: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      telefone: z.string().optional().nullable(),
      cidade: z.string().optional().nullable(),
      estado: z.string().optional().nullable(),
      profissao: z.string().optional().nullable(),
      empresa: z.string().optional().nullable(),
      dataNascimento: z.number().optional().nullable(),
      dataIngresso: z.number(),
      dataRenovacao: z.number().optional().nullable(),
      status: z.enum(["ativo", "inativo", "pendente_renovacao"]).optional(),
      observacoes: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const id = await db.createEmbaixador(input);
      // Auto-create welcome kit
      await db.createWelcomeKit({ embaixadorId: id, status: "pendente" });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      nomeCompleto: z.string().min(1).optional(),
      numeroLegendario: z.string().optional().nullable(),
      numeroEmbaixador: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      telefone: z.string().optional().nullable(),
      cidade: z.string().optional().nullable(),
      estado: z.string().optional().nullable(),
      profissao: z.string().optional().nullable(),
      empresa: z.string().optional().nullable(),
      dataNascimento: z.number().optional().nullable(),
      dataIngresso: z.number().optional(),
      dataRenovacao: z.number().optional().nullable(),
      status: z.enum(["ativo", "inativo", "pendente_renovacao"]).optional(),
      observacoes: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateEmbaixador(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteEmbaixador(input.id);
      return { success: true };
    }),
    stats: protectedProcedure.query(async () => {
      return db.getEmbaixadoresStats();
    }),
  }),

  // Pagamentos
  pagamento: router({
    list: protectedProcedure.input(z.object({ embaixadorId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.listPagamentos(input?.embaixadorId);
    }),
    create: protectedProcedure.input(z.object({
      embaixadorId: z.number(),
      valor: z.string(),
      dataVencimento: z.number(),
      dataPagamento: z.number().optional().nullable(),
      status: z.enum(["pendente", "pago", "atrasado"]).optional(),
      observacoes: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const id = await db.createPagamento(input);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      valor: z.string().optional(),
      dataVencimento: z.number().optional(),
      dataPagamento: z.number().optional().nullable(),
      status: z.enum(["pendente", "pago", "atrasado"]).optional(),
      observacoes: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePagamento(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deletePagamento(input.id);
      return { success: true };
    }),
  }),

  // Terça de Glória
  tercaGloria: router({
    list: protectedProcedure.query(async () => {
      return db.listTercaGloria();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getTercaGloria(input.id);
    }),
    create: protectedProcedure.input(z.object({
      data: z.number(),
      tema: z.string().min(1),
      pregador: z.string().optional().nullable(),
      resumo: z.string().optional().nullable(),
      testemunhos: z.string().optional().nullable(),
      linkMeet: z.string().optional().nullable(),
      versiculoBase: z.string().optional().nullable(),
      status: z.enum(["planejada", "realizada", "cancelada"]).optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createTercaGloria(input);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      data: z.number().optional(),
      tema: z.string().min(1).optional(),
      pregador: z.string().optional().nullable(),
      resumo: z.string().optional().nullable(),
      testemunhos: z.string().optional().nullable(),
      linkMeet: z.string().optional().nullable(),
      versiculoBase: z.string().optional().nullable(),
      status: z.enum(["planejada", "realizada", "cancelada"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTercaGloria(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTercaGloria(input.id);
      return { success: true };
    }),
  }),

  // Welcome Kit
  welcomeKit: router({
    list: protectedProcedure.query(async () => {
      return db.listWelcomeKits();
    }),
    get: protectedProcedure.input(z.object({ embaixadorId: z.number() })).query(async ({ input }) => {
      return db.getWelcomeKit(input.embaixadorId);
    }),
    create: protectedProcedure.input(z.object({
      embaixadorId: z.number(),
      observacoes: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const id = await db.createWelcomeKit({ ...input, status: "pendente" });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      patchEntregue: z.boolean().optional(),
      pinBoneEntregue: z.boolean().optional(),
      anelEntregue: z.boolean().optional(),
      espadaEntregue: z.boolean().optional(),
      mochilaBalacEntregue: z.boolean().optional(),
      dataEntrega: z.number().optional().nullable(),
      status: z.enum(["pendente", "parcial", "completo"]).optional(),
      observacoes: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      // Auto-calculate status
      const items = [data.patchEntregue, data.pinBoneEntregue, data.anelEntregue, data.espadaEntregue, data.mochilaBalacEntregue];
      const definedItems = items.filter(i => i !== undefined);
      if (definedItems.length > 0) {
        const allTrue = definedItems.every(i => i === true);
        const someTrue = definedItems.some(i => i === true);
        if (allTrue && definedItems.length === 5) {
          data.status = "completo";
          if (!data.dataEntrega) data.dataEntrega = Date.now();
        } else if (someTrue) {
          data.status = "parcial";
        }
      }
      await db.updateWelcomeKit(id, data);
      return { success: true };
    }),
  }),

  // Eventos
  evento: router({
    list: protectedProcedure.query(async () => {
      return db.listEventos();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getEvento(input.id);
    }),
    create: protectedProcedure.input(z.object({
      titulo: z.string().min(1),
      descricao: z.string().optional().nullable(),
      data: z.number(),
      dataFim: z.number().optional().nullable(),
      local: z.string().optional().nullable(),
      tipo: z.enum(["encontro", "conferencia", "retiro", "treinamento", "outro"]).optional(),
      linkMeet: z.string().optional().nullable(),
      recorrente: z.boolean().optional(),
      status: z.enum(["agendado", "realizado", "cancelado"]).optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createEvento(input);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      titulo: z.string().min(1).optional(),
      descricao: z.string().optional().nullable(),
      data: z.number().optional(),
      dataFim: z.number().optional().nullable(),
      local: z.string().optional().nullable(),
      tipo: z.enum(["encontro", "conferencia", "retiro", "treinamento", "outro"]).optional(),
      linkMeet: z.string().optional().nullable(),
      recorrente: z.boolean().optional(),
      status: z.enum(["agendado", "realizado", "cancelado"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateEvento(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteEvento(input.id);
      return { success: true };
    }),
  }),

  // Entrevistas
  entrevista: router({
    list: protectedProcedure.query(async () => {
      return db.listEntrevistas();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getEntrevista(input.id);
    }),
    create: protectedProcedure.input(z.object({
      nomeCandidato: z.string().min(1),
      emailCandidato: z.string().email().optional().nullable(),
      telefoneCandidato: z.string().optional().nullable(),
      dataEntrevista: z.number(),
      linkMeet: z.string().optional().nullable(),
      status: z.enum(["agendada", "realizada", "aprovada", "reprovada", "cancelada"]).optional(),
      observacoes: z.string().optional().nullable(),
      indicadoPor: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const id = await db.createEntrevista(input);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      nomeCandidato: z.string().min(1).optional(),
      emailCandidato: z.string().email().optional().nullable(),
      telefoneCandidato: z.string().optional().nullable(),
      dataEntrevista: z.number().optional(),
      linkMeet: z.string().optional().nullable(),
      status: z.enum(["agendada", "realizada", "aprovada", "reprovada", "cancelada"]).optional(),
      observacoes: z.string().optional().nullable(),
      indicadoPor: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateEntrevista(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteEntrevista(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
