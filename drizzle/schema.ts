import { serial, pgTable, pgEnum, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const embaixadorStatusEnum = pgEnum("embaixador_status", ["ativo", "inativo", "pendente_renovacao"]);
export const pagamentoStatusEnum = pgEnum("pagamento_status", ["pendente", "pago", "atrasado"]);
export const tercaGloriaStatusEnum = pgEnum("terca_gloria_status", ["planejada", "realizada", "cancelada"]);
export const welcomeKitStatusEnum = pgEnum("welcome_kit_status", ["pendente", "parcial", "completo"]);
export const eventoTipoEnum = pgEnum("evento_tipo", ["encontro", "conferencia", "retiro", "treinamento", "outro"]);
export const eventoStatusEnum = pgEnum("evento_status", ["agendado", "realizado", "cancelado"]);
export const entrevistaStatusEnum = pgEnum("entrevista_status", ["agendada", "realizada", "aprovada", "reprovada", "cancelada"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Embaixadores
export const embaixadores = pgTable("embaixadores", {
  id: serial("id").primaryKey(),
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  numeroLegendario: varchar("numeroLegendario", { length: 50 }),
  numeroEmbaixador: varchar("numeroEmbaixador", { length: 50 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 30 }),
  cidade: varchar("cidade", { length: 150 }),
  estado: varchar("estado", { length: 50 }),
  profissao: varchar("profissao", { length: 150 }),
  empresa: varchar("empresa", { length: 200 }),
  dataNascimento: bigint("dataNascimento", { mode: "number" }),
  dataIngresso: bigint("dataIngresso", { mode: "number" }).notNull(),
  dataRenovacao: bigint("dataRenovacao", { mode: "number" }),
  status: embaixadorStatusEnum("status").default("ativo").notNull(),
  observacoes: text("observacoes"),
  fotoUrl: varchar("fotoUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Embaixador = typeof embaixadores.$inferSelect;
export type InsertEmbaixador = typeof embaixadores.$inferInsert;

// Pagamentos / Renovações
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  embaixadorId: serial("embaixadorId").notNull(),
  valor: varchar("valor", { length: 20 }).notNull(),
  dataVencimento: bigint("dataVencimento", { mode: "number" }).notNull(),
  dataPagamento: bigint("dataPagamento", { mode: "number" }),
  status: pagamentoStatusEnum("status").default("pendente").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = typeof pagamentos.$inferInsert;

// Terça de Glória - Reuniões
export const tercaGloria = pgTable("tercaGloria", {
  id: serial("id").primaryKey(),
  data: bigint("data", { mode: "number" }).notNull(),
  tema: varchar("tema", { length: 300 }).notNull(),
  pregador: varchar("pregador", { length: 200 }),
  resumo: text("resumo"),
  testemunhos: text("testemunhos"),
  linkMeet: varchar("linkMeet", { length: 500 }),
  versiculoBase: varchar("versiculoBase", { length: 300 }),
  status: tercaGloriaStatusEnum("status").default("planejada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TercaGloria = typeof tercaGloria.$inferSelect;
export type InsertTercaGloria = typeof tercaGloria.$inferInsert;

// Welcome Kit
export const welcomeKits = pgTable("welcomeKits", {
  id: serial("id").primaryKey(),
  embaixadorId: serial("embaixadorId").notNull(),
  patchEntregue: boolean("patchEntregue").default(false).notNull(),
  pinBoneEntregue: boolean("pinBoneEntregue").default(false).notNull(),
  anelEntregue: boolean("anelEntregue").default(false).notNull(),
  espadaEntregue: boolean("espadaEntregue").default(false).notNull(),
  mochilaBalacEntregue: boolean("mochilaBalacEntregue").default(false).notNull(),
  dataEntrega: bigint("dataEntrega", { mode: "number" }),
  status: welcomeKitStatusEnum("status").default("pendente").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WelcomeKit = typeof welcomeKits.$inferSelect;
export type InsertWelcomeKit = typeof welcomeKits.$inferInsert;

// Eventos
export const eventos = pgTable("eventos", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  descricao: text("descricao"),
  data: bigint("data", { mode: "number" }).notNull(),
  dataFim: bigint("dataFim", { mode: "number" }),
  local: varchar("local", { length: 300 }),
  tipo: eventoTipoEnum("tipo").default("encontro").notNull(),
  linkMeet: varchar("linkMeet", { length: 500 }),
  recorrente: boolean("recorrente").default(false).notNull(),
  status: eventoStatusEnum("status").default("agendado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Evento = typeof eventos.$inferSelect;
export type InsertEvento = typeof eventos.$inferInsert;

// Entrevistas
export const entrevistas = pgTable("entrevistas", {
  id: serial("id").primaryKey(),
  nomeCandidato: varchar("nomeCandidato", { length: 255 }).notNull(),
  emailCandidato: varchar("emailCandidato", { length: 320 }),
  telefoneCandidato: varchar("telefoneCandidato", { length: 30 }),
  dataEntrevista: bigint("dataEntrevista", { mode: "number" }).notNull(),
  linkMeet: varchar("linkMeet", { length: 500 }),
  status: entrevistaStatusEnum("status").default("agendada").notNull(),
  observacoes: text("observacoes"),
  indicadoPor: varchar("indicadoPor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Entrevista = typeof entrevistas.$inferSelect;
export type InsertEntrevista = typeof entrevistas.$inferInsert;
