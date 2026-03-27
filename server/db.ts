import { eq, desc, asc, and, gte, lte, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  embaixadores, InsertEmbaixador,
  pagamentos, InsertPagamento,
  tercaGloria, InsertTercaGloria,
  welcomeKits, InsertWelcomeKit,
  eventos, InsertEvento,
  entrevistas, InsertEntrevista,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== EMBAIXADORES ==========
export async function listEmbaixadores(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(embaixadores).where(
      or(
        like(embaixadores.nomeCompleto, `%${search}%`),
        like(embaixadores.email, `%${search}%`),
        like(embaixadores.cidade, `%${search}%`)
      )
    ).orderBy(asc(embaixadores.nomeCompleto));
  }
  return db.select().from(embaixadores).orderBy(asc(embaixadores.nomeCompleto));
}

export async function getEmbaixador(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(embaixadores).where(eq(embaixadores.id, id)).limit(1);
  return result[0];
}

export async function createEmbaixador(data: InsertEmbaixador) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(embaixadores).values(data);
  return result[0].insertId;
}

export async function updateEmbaixador(id: number, data: Partial<InsertEmbaixador>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(embaixadores).set(data).where(eq(embaixadores.id, id));
}

export async function deleteEmbaixador(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(embaixadores).where(eq(embaixadores.id, id));
}

export async function getEmbaixadoresStats() {
  const db = await getDb();
  if (!db) return { total: 0, ativos: 0, inativos: 0, pendentes: 0 };
  const all = await db.select().from(embaixadores);
  return {
    total: all.length,
    ativos: all.filter(e => e.status === "ativo").length,
    inativos: all.filter(e => e.status === "inativo").length,
    pendentes: all.filter(e => e.status === "pendente_renovacao").length,
  };
}

// ========== PAGAMENTOS ==========
export async function listPagamentos(embaixadorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (embaixadorId) {
    return db.select().from(pagamentos).where(eq(pagamentos.embaixadorId, embaixadorId)).orderBy(desc(pagamentos.dataVencimento));
  }
  return db.select().from(pagamentos).orderBy(desc(pagamentos.dataVencimento));
}

export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(pagamentos).values(data);
  return result[0].insertId;
}

export async function updatePagamento(id: number, data: Partial<InsertPagamento>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pagamentos).set(data).where(eq(pagamentos.id, id));
}

export async function deletePagamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(pagamentos).where(eq(pagamentos.id, id));
}

// ========== TERÇA DE GLÓRIA ==========
export async function listTercaGloria() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tercaGloria).orderBy(desc(tercaGloria.data));
}

export async function getTercaGloria(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tercaGloria).where(eq(tercaGloria.id, id)).limit(1);
  return result[0];
}

export async function createTercaGloria(data: InsertTercaGloria) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tercaGloria).values(data);
  return result[0].insertId;
}

export async function updateTercaGloria(id: number, data: Partial<InsertTercaGloria>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tercaGloria).set(data).where(eq(tercaGloria.id, id));
}

export async function deleteTercaGloria(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(tercaGloria).where(eq(tercaGloria.id, id));
}

// ========== WELCOME KIT ==========
export async function listWelcomeKits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(welcomeKits).orderBy(desc(welcomeKits.createdAt));
}

export async function getWelcomeKit(embaixadorId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(welcomeKits).where(eq(welcomeKits.embaixadorId, embaixadorId)).limit(1);
  return result[0];
}

export async function createWelcomeKit(data: InsertWelcomeKit) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(welcomeKits).values(data);
  return result[0].insertId;
}

export async function updateWelcomeKit(id: number, data: Partial<InsertWelcomeKit>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(welcomeKits).set(data).where(eq(welcomeKits.id, id));
}

// ========== EVENTOS ==========
export async function listEventos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventos).orderBy(desc(eventos.data));
}

export async function getEvento(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventos).where(eq(eventos.id, id)).limit(1);
  return result[0];
}

export async function createEvento(data: InsertEvento) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(eventos).values(data);
  return result[0].insertId;
}

export async function updateEvento(id: number, data: Partial<InsertEvento>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(eventos).set(data).where(eq(eventos.id, id));
}

export async function deleteEvento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(eventos).where(eq(eventos.id, id));
}

// ========== ENTREVISTAS ==========
export async function listEntrevistas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(entrevistas).orderBy(desc(entrevistas.dataEntrevista));
}

export async function getEntrevista(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(entrevistas).where(eq(entrevistas.id, id)).limit(1);
  return result[0];
}

export async function createEntrevista(data: InsertEntrevista) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(entrevistas).values(data);
  return result[0].insertId;
}

export async function updateEntrevista(id: number, data: Partial<InsertEntrevista>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(entrevistas).set(data).where(eq(entrevistas.id, id));
}

export async function deleteEntrevista(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(entrevistas).where(eq(entrevistas.id, id));
}

// ========== DASHBOARD STATS ==========
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { embaixadores: { total: 0, ativos: 0, inativos: 0, pendentes: 0 }, proximosAniversarios: [], renovacoesPendentes: [], proximosEventos: [], proximasReunioes: [], kitsStats: { pendentes: 0, parciais: 0, completos: 0 } };

  const allEmb = await db.select().from(embaixadores);
  const allKits = await db.select().from(welcomeKits);
  const now = Date.now();
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

  // Próximos aniversários (próximos 30 dias)
  const proximosAniversarios = allEmb.filter(e => {
    if (!e.dataNascimento) return false;
    const bday = new Date(e.dataNascimento);
    const thisYear = new Date();
    const nextBday = new Date(thisYear.getFullYear(), bday.getMonth(), bday.getDate());
    if (nextBday.getTime() < now) nextBday.setFullYear(nextBday.getFullYear() + 1);
    return nextBday.getTime() <= thirtyDaysFromNow;
  }).slice(0, 5);

  // Renovações pendentes
  const renovacoesPendentes = allEmb.filter(e => e.status === "pendente_renovacao").slice(0, 5);

  // Próximos eventos
  const proximosEventos = await db.select().from(eventos)
    .where(and(gte(eventos.data, now), eq(eventos.status, "agendado")))
    .orderBy(asc(eventos.data)).limit(5);

  // Próximas reuniões
  const proximasReunioes = await db.select().from(tercaGloria)
    .where(and(gte(tercaGloria.data, now), eq(tercaGloria.status, "planejada")))
    .orderBy(asc(tercaGloria.data)).limit(3);

  return {
    embaixadores: {
      total: allEmb.length,
      ativos: allEmb.filter(e => e.status === "ativo").length,
      inativos: allEmb.filter(e => e.status === "inativo").length,
      pendentes: allEmb.filter(e => e.status === "pendente_renovacao").length,
    },
    proximosAniversarios,
    renovacoesPendentes,
    proximosEventos,
    proximasReunioes,
    kitsStats: {
      pendentes: allKits.filter(k => k.status === "pendente").length,
      parciais: allKits.filter(k => k.status === "parcial").length,
      completos: allKits.filter(k => k.status === "completo").length,
    },
  };
}
