CREATE TABLE `embaixadores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeCompleto` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(30),
	`cidade` varchar(150),
	`estado` varchar(50),
	`profissao` varchar(150),
	`empresa` varchar(200),
	`dataNascimento` bigint,
	`dataIngresso` bigint NOT NULL,
	`dataRenovacao` bigint,
	`status` enum('ativo','inativo','pendente_renovacao') NOT NULL DEFAULT 'ativo',
	`observacoes` text,
	`fotoUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `embaixadores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entrevistas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeCandidato` varchar(255) NOT NULL,
	`emailCandidato` varchar(320),
	`telefoneCandidato` varchar(30),
	`dataEntrevista` bigint NOT NULL,
	`linkMeet` varchar(500),
	`status` enum('agendada','realizada','aprovada','reprovada','cancelada') NOT NULL DEFAULT 'agendada',
	`observacoes` text,
	`indicadoPor` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entrevistas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(300) NOT NULL,
	`descricao` text,
	`data` bigint NOT NULL,
	`dataFim` bigint,
	`local` varchar(300),
	`tipo` enum('encontro','conferencia','retiro','treinamento','outro') NOT NULL DEFAULT 'encontro',
	`linkMeet` varchar(500),
	`recorrente` boolean NOT NULL DEFAULT false,
	`status` enum('agendado','realizado','cancelado') NOT NULL DEFAULT 'agendado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`embaixadorId` int NOT NULL,
	`valor` varchar(20) NOT NULL,
	`dataVencimento` bigint NOT NULL,
	`dataPagamento` bigint,
	`status` enum('pendente','pago','atrasado') NOT NULL DEFAULT 'pendente',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pagamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tercaGloria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` bigint NOT NULL,
	`tema` varchar(300) NOT NULL,
	`pregador` varchar(200),
	`resumo` text,
	`testemunhos` text,
	`linkMeet` varchar(500),
	`versiculoBase` varchar(300),
	`status` enum('planejada','realizada','cancelada') NOT NULL DEFAULT 'planejada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tercaGloria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `welcomeKits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`embaixadorId` int NOT NULL,
	`patchEntregue` boolean NOT NULL DEFAULT false,
	`pinBoneEntregue` boolean NOT NULL DEFAULT false,
	`anelEntregue` boolean NOT NULL DEFAULT false,
	`espadaEntregue` boolean NOT NULL DEFAULT false,
	`mochilaBalacEntregue` boolean NOT NULL DEFAULT false,
	`dataEntrega` bigint,
	`status` enum('pendente','parcial','completo') NOT NULL DEFAULT 'pendente',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `welcomeKits_id` PRIMARY KEY(`id`)
);
