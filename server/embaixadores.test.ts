import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    embaixadores: { total: 5, ativos: 3, inativos: 1, pendentes: 1 },
    proximosAniversarios: [],
    renovacoesPendentes: [],
    proximosEventos: [],
    proximasReunioes: [],
    kitsStats: { pendentes: 2, parciais: 1, completos: 2 },
  }),
  listEmbaixadores: vi.fn().mockResolvedValue([
    { id: 1, nomeCompleto: "Joao Silva", email: "joao@test.com", status: "ativo", dataIngresso: Date.now() },
  ]),
  getEmbaixador: vi.fn().mockResolvedValue({ id: 1, nomeCompleto: "Joao Silva", status: "ativo" }),
  createEmbaixador: vi.fn().mockResolvedValue(1),
  updateEmbaixador: vi.fn().mockResolvedValue(undefined),
  deleteEmbaixador: vi.fn().mockResolvedValue(undefined),
  getEmbaixadoresStats: vi.fn().mockResolvedValue({ total: 5, ativos: 3, inativos: 1, pendentes: 1 }),
  listPagamentos: vi.fn().mockResolvedValue([]),
  createPagamento: vi.fn().mockResolvedValue(1),
  updatePagamento: vi.fn().mockResolvedValue(undefined),
  deletePagamento: vi.fn().mockResolvedValue(undefined),
  listTercaGloria: vi.fn().mockResolvedValue([]),
  getTercaGloria: vi.fn().mockResolvedValue({ id: 1, tema: "Fe", data: Date.now() }),
  createTercaGloria: vi.fn().mockResolvedValue(1),
  updateTercaGloria: vi.fn().mockResolvedValue(undefined),
  deleteTercaGloria: vi.fn().mockResolvedValue(undefined),
  listWelcomeKits: vi.fn().mockResolvedValue([]),
  getWelcomeKit: vi.fn().mockResolvedValue({ id: 1, embaixadorId: 1, status: "pendente" }),
  createWelcomeKit: vi.fn().mockResolvedValue(1),
  updateWelcomeKit: vi.fn().mockResolvedValue(undefined),
  listEventos: vi.fn().mockResolvedValue([]),
  getEvento: vi.fn().mockResolvedValue({ id: 1, titulo: "Encontro", data: Date.now() }),
  createEvento: vi.fn().mockResolvedValue(1),
  updateEvento: vi.fn().mockResolvedValue(undefined),
  deleteEvento: vi.fn().mockResolvedValue(undefined),
  listEntrevistas: vi.fn().mockResolvedValue([]),
  getEntrevista: vi.fn().mockResolvedValue({ id: 1, nomeCandidato: "Carlos", dataEntrevista: Date.now() }),
  createEntrevista: vi.fn().mockResolvedValue(1),
  updateEntrevista: vi.fn().mockResolvedValue(undefined),
  deleteEntrevista: vi.fn().mockResolvedValue(undefined),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "admin@test.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Dashboard", () => {
  it("returns dashboard stats", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const stats = await caller.dashboard.stats();
    expect(stats.embaixadores.total).toBe(5);
    expect(stats.embaixadores.ativos).toBe(3);
    expect(stats.kitsStats.pendentes).toBe(2);
  });
});

describe("Embaixadores CRUD", () => {
  it("lists embaixadores", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const list = await caller.embaixador.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].nomeCompleto).toBe("Joao Silva");
  });

  it("creates an embaixador", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.embaixador.create({
      nomeCompleto: "Pedro Santos",
      dataIngresso: Date.now(),
      email: "pedro@test.com",
    });
    expect(result.id).toBe(1);
  });

  it("creates an embaixador with numeroLegendario and numeroEmbaixador", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.embaixador.create({
      nomeCompleto: "Marcos Lima",
      dataIngresso: Date.now(),
      numeroLegendario: "L-042",
      numeroEmbaixador: "E-015",
    });
    expect(result.id).toBe(1);
  });

  it("updates an embaixador with new number fields", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.embaixador.update({
      id: 1,
      numeroLegendario: "L-100",
      numeroEmbaixador: "E-050",
    });
    expect(result.success).toBe(true);
  });

  it("gets an embaixador by id", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const emb = await caller.embaixador.get({ id: 1 });
    expect(emb?.nomeCompleto).toBe("Joao Silva");
  });

  it("updates an embaixador", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.embaixador.update({ id: 1, nomeCompleto: "Joao Updated" });
    expect(result.success).toBe(true);
  });

  it("deletes an embaixador", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.embaixador.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("returns embaixador stats", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const stats = await caller.embaixador.stats();
    expect(stats.total).toBe(5);
  });
});

describe("Terca de Gloria CRUD", () => {
  it("lists reunioes", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const list = await caller.tercaGloria.list();
    expect(Array.isArray(list)).toBe(true);
  });

  it("creates a reuniao", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.tercaGloria.create({
      data: Date.now(),
      tema: "Fe e Perseveranca",
      pregador: "Pastor Paulo",
    });
    expect(result.id).toBe(1);
  });

  it("updates a reuniao", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.tercaGloria.update({ id: 1, tema: "Updated" });
    expect(result.success).toBe(true);
  });
});

describe("Welcome Kit", () => {
  it("lists kits", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const list = await caller.welcomeKit.list();
    expect(Array.isArray(list)).toBe(true);
  });

  it("updates kit items", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.welcomeKit.update({
      id: 1,
      patchEntregue: true,
      pinBoneEntregue: true,
      anelEntregue: true,
      espadaEntregue: true,
      mochilaBalacEntregue: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("Eventos CRUD", () => {
  it("creates an evento", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.evento.create({
      titulo: "Encontro Mensal",
      data: Date.now(),
      tipo: "encontro",
    });
    expect(result.id).toBe(1);
  });

  it("lists eventos", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const list = await caller.evento.list();
    expect(Array.isArray(list)).toBe(true);
  });
});

describe("Entrevistas CRUD", () => {
  it("creates an entrevista", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.entrevista.create({
      nomeCandidato: "Carlos Mendes",
      dataEntrevista: Date.now(),
      emailCandidato: "carlos@test.com",
    });
    expect(result.id).toBe(1);
  });

  it("lists entrevistas", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const list = await caller.entrevista.list();
    expect(Array.isArray(list)).toBe(true);
  });

  it("updates an entrevista", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.entrevista.update({ id: 1, status: "aprovada" });
    expect(result.success).toBe(true);
  });
});
