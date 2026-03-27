import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Embaixadores
export const embaixadores = mysqlTable("embaixadores", {
  id: int("id").autoincrement().primaryKey(),
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
  status: mysqlEnum("status", ["ativo", "inativo", "pendente_renovacao"]).default("ativo").notNull(),
  observacoes: text("observacoes"),
  fotoUrl: varchar("fotoUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Embaixador = typeof embaixadores.$inferSelect;
export type InsertEmbaixador = typeof embaixadores.$inferInsert;

// Pagamentos / Renovações
export const pagamentos = mysqlTable("pagamentos", {
  id: int("id").autoincrement().primaryKey(),
  embaixadorId: int("embaixadorId").notNull(),
  valor: varchar("valor", { length: 20 }).notNull(),
  dataVencimento: bigint("dataVencimento", { mode: "number" }).notNull(),
  dataPagamento: bigint("dataPagamento", { mode: "number" }),
  status: mysqlEnum("status", ["pendente", "pago", "atrasado"]).default("pendente").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = typeof pagamentos.$inferInsert;

// Terça de Glória - Reuniões
export const tercaGloria = mysqlTable("tercaGloria", {
  id: int("id").autoincrement().primaryKey(),
  data: bigint("data", { mode: "number" }).notNull(),
  tema: varchar("tema", { length: 300 }).notNull(),
  pregador: varchar("pregador", { length: 200 }),
  resumo: text("resumo"),
  testemunhos: text("testemunhos"),
  linkMeet: varchar("linkMeet", { length: 500 }),
  versiculoBase: varchar("versiculoBase", { length: 300 }),
  status: mysqlEnum("status", ["planejada", "realizada", "cancelada"]).default("planejada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TercaGloria = typeof tercaGloria.$inferSelect;
export type InsertTercaGloria = typeof tercaGloria.$inferInsert;

// Welcome Kit
export const welcomeKits = mysqlTable("welcomeKits", {
  id: int("id").autoincrement().primaryKey(),
  embaixadorId: int("embaixadorId").notNull(),
  patchEntregue: boolean("patchEntregue").default(false).notNull(),
  pinBoneEntregue: boolean("pinBoneEntregue").default(false).notNull(),
  anelEntregue: boolean("anelEntregue").default(false).notNull(),
  espadaEntregue: boolean("espadaEntregue").default(false).notNull(),
  mochilaBalacEntregue: boolean("mochilaBalacEntregue").default(false).notNull(),
  dataEntrega: bigint("dataEntrega", { mode: "number" }),
  status: mysqlEnum("status", ["pendente", "parcial", "completo"]).default("pendente").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WelcomeKit = typeof welcomeKits.$inferSelect;
export type InsertWelcomeKit = typeof welcomeKits.$inferInsert;

// Eventos
export const eventos = mysqlTable("eventos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  descricao: text("descricao"),
  data: bigint("data", { mode: "number" }).notNull(),
  dataFim: bigint("dataFim", { mode: "number" }),
  local: varchar("local", { length: 300 }),
  tipo: mysqlEnum("tipo", ["encontro", "conferencia", "retiro", "treinamento", "outro"]).default("encontro").notNull(),
  linkMeet: varchar("linkMeet", { length: 500 }),
  recorrente: boolean("recorrente").default(false).notNull(),
  status: mysqlEnum("status", ["agendado", "realizado", "cancelado"]).default("agendado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evento = typeof eventos.$inferSelect;
export type InsertEvento = typeof eventos.$inferInsert;

// Entrevistas
export const entrevistas = mysqlTable("entrevistas", {
  id: int("id").autoincrement().primaryKey(),
  nomeCandidato: varchar("nomeCandidato", { length: 255 }).notNull(),
  emailCandidato: varchar("emailCandidato", { length: 320 }),
  telefoneCandidato: varchar("telefoneCandidato", { length: 30 }),
  dataEntrevista: bigint("dataEntrevista", { mode: "number" }).notNull(),
  linkMeet: varchar("linkMeet", { length: 500 }),
  status: mysqlEnum("status", ["agendada", "realizada", "aprovada", "reprovada", "cancelada"]).default("agendada").notNull(),
  observacoes: text("observacoes"),
  indicadoPor: varchar("indicadoPor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Entrevista = typeof entrevistas.$inferSelect;
export type InsertEntrevista = typeof entrevistas.$inferInsert;
