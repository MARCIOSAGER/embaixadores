-- Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE embaixador_status AS ENUM ('ativo', 'inativo', 'pendente_renovacao');
CREATE TYPE pagamento_status AS ENUM ('pendente', 'pago', 'atrasado');
CREATE TYPE terca_gloria_status AS ENUM ('planejada', 'realizada', 'cancelada');
CREATE TYPE welcome_kit_status AS ENUM ('pendente', 'parcial', 'completo');
CREATE TYPE evento_tipo AS ENUM ('encontro', 'conferencia', 'retiro', 'treinamento', 'outro');
CREATE TYPE evento_status AS ENUM ('agendado', 'realizado', 'cancelado');
CREATE TYPE entrevista_status AS ENUM ('agendada', 'realizada', 'aprovada', 'reprovada', 'cancelada');

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role user_role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Embaixadores
CREATE TABLE embaixadores (
  id SERIAL PRIMARY KEY,
  "nomeCompleto" VARCHAR(255) NOT NULL,
  "numeroLegendario" VARCHAR(50),
  "numeroEmbaixador" VARCHAR(50),
  email VARCHAR(320),
  telefone VARCHAR(30),
  cidade VARCHAR(150),
  estado VARCHAR(50),
  profissao VARCHAR(150),
  empresa VARCHAR(200),
  "dataNascimento" BIGINT,
  "dataIngresso" BIGINT NOT NULL,
  "dataRenovacao" BIGINT,
  status embaixador_status NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  "fotoUrl" VARCHAR(500),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pagamentos
CREATE TABLE pagamentos (
  id SERIAL PRIMARY KEY,
  "embaixadorId" INTEGER NOT NULL,
  valor VARCHAR(20) NOT NULL,
  "dataVencimento" BIGINT NOT NULL,
  "dataPagamento" BIGINT,
  status pagamento_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Terça de Glória
CREATE TABLE "tercaGloria" (
  id SERIAL PRIMARY KEY,
  data BIGINT NOT NULL,
  tema VARCHAR(300) NOT NULL,
  pregador VARCHAR(200),
  resumo TEXT,
  testemunhos TEXT,
  "linkMeet" VARCHAR(500),
  "versiculoBase" VARCHAR(300),
  status terca_gloria_status NOT NULL DEFAULT 'planejada',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Welcome Kits
CREATE TABLE "welcomeKits" (
  id SERIAL PRIMARY KEY,
  "embaixadorId" INTEGER NOT NULL,
  "patchEntregue" BOOLEAN NOT NULL DEFAULT FALSE,
  "pinBoneEntregue" BOOLEAN NOT NULL DEFAULT FALSE,
  "anelEntregue" BOOLEAN NOT NULL DEFAULT FALSE,
  "espadaEntregue" BOOLEAN NOT NULL DEFAULT FALSE,
  "mochilaBalacEntregue" BOOLEAN NOT NULL DEFAULT FALSE,
  "dataEntrega" BIGINT,
  status welcome_kit_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Eventos
CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  data BIGINT NOT NULL,
  "dataFim" BIGINT,
  local VARCHAR(300),
  tipo evento_tipo NOT NULL DEFAULT 'encontro',
  "linkMeet" VARCHAR(500),
  recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  status evento_status NOT NULL DEFAULT 'agendado',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Entrevistas
CREATE TABLE entrevistas (
  id SERIAL PRIMARY KEY,
  "nomeCandidato" VARCHAR(255) NOT NULL,
  "emailCandidato" VARCHAR(320),
  "telefoneCandidato" VARCHAR(30),
  "dataEntrevista" BIGINT NOT NULL,
  "linkMeet" VARCHAR(500),
  status entrevista_status NOT NULL DEFAULT 'agendada',
  observacoes TEXT,
  "indicadoPor" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) - Permitir acesso público por enquanto
-- Depois você pode restringir com Supabase Auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE embaixadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tercaGloria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "welcomeKits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total com anon key)
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON embaixadores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON "tercaGloria" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON "welcomeKits" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON eventos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON entrevistas FOR ALL USING (true) WITH CHECK (true);
