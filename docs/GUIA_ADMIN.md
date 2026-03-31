# Guia do Administrador — Embaixadores dos Legendários

> Sistema de gestão do programa de embaixadores da igreja.
> Este guia cobre todas as funcionalidades disponíveis para o administrador.

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Dashboard](#2-dashboard)
3. [Gestão de Embaixadores](#3-gestão-de-embaixadores)
4. [Fluxo de Inscrição](#4-fluxo-de-inscrição)
5. [Entrevistas](#5-entrevistas)
6. [Eventos](#6-eventos)
7. [Terça de Glória](#7-terça-de-glória)
8. [Welcome Kit](#8-welcome-kit)
9. [Pagamentos](#9-pagamentos)
10. [Produtos e Pedidos](#10-produtos-e-pedidos)
11. [Relatórios e Exportação](#11-relatórios-e-exportação)
12. [Notificações](#12-notificações)
13. [Configurações](#13-configurações)
14. [Portal do Embaixador](#14-portal-do-embaixador)
15. [Instalação no Celular (PWA)](#15-instalação-no-celular-pwa)

---

## 1. Visão Geral do Sistema

### O que é

O **Embaixadores dos Legendários** é uma plataforma completa para gerenciar o programa de embaixadores da igreja. Ele centraliza cadastro de embaixadores, controle de pagamentos, eventos, reuniões, entrevistas, kits de boas-vindas, pedidos de produtos e comunicação por WhatsApp e email.

### Para quem serve

- **Administradores**: acesso completo a todas as funcionalidades, incluindo cadastros, relatórios, configurações e envio de notificações.
- **Embaixadores**: acesso ao portal pessoal com dashboard próprio, indicados, eventos e catálogo de produtos.

### Como acessar

1. Abra o sistema no navegador (desktop ou celular).
2. Na tela de login, clique em **Entrar** para autenticar via OAuth.
3. Após o login, você será direcionado automaticamente para o Dashboard.

### Diferença entre Admin e Embaixador

| Funcionalidade | Admin | Embaixador |
|---|:---:|:---:|
| Dashboard com métricas globais | Sim | Nao |
| Dashboard pessoal | Nao | Sim |
| Cadastrar/editar embaixadores | Sim | Nao |
| Gerenciar eventos e reuniões | Sim | Nao |
| Agendar entrevistas | Sim | Nao |
| Gerenciar pagamentos | Sim | Nao |
| Cadastrar produtos | Sim | Nao |
| Fazer pedidos | Sim | Nao |
| Enviar notificações | Sim | Nao |
| Ver indicados próprios | Nao | Sim |
| Ver catálogo de produtos | Nao | Sim |
| Participar de eventos | Nao | Sim |

---

## 2. Dashboard

O Dashboard é a tela inicial do sistema e apresenta uma visão geral do programa.

### Cards de Métricas

No topo da tela, quatro cards resumem os números principais:

- **Total de Embaixadores** — quantidade de embaixadores ativos no programa.
- **Novos este mês** — embaixadores cadastrados no mês corrente.
- **Receita do mês** — total de pagamentos recebidos no mês.
- **Eventos ativos** — eventos com inscrições abertas ou em andamento.

### Gráficos

O Dashboard apresenta quatro gráficos interativos:

- **Tendência de Crescimento** — linha do tempo mostrando a evolução do número de embaixadores ao longo dos meses.
- **Funil de Conversão** — visualização das etapas: inscrição, entrevista, aprovação, ativação.
- **Ranking de Embaixadores** — os embaixadores com mais indicações aprovadas.
- **Receita Mensal** — gráfico de barras com o total de pagamentos por mês.

### Seções Informativas

Abaixo dos gráficos, seções com informações que requerem atenção:

- **Aniversariantes** — embaixadores que fazem aniversário nos próximos dias.
- **Renovações Pendentes** — embaixadores com renovação próxima do vencimento.
- **Próximos Eventos** — eventos agendados para os próximos dias.
- **Próximas Reuniões** — reuniões da Terça de Glória programadas.

---

## 3. Gestão de Embaixadores

Acesse pelo menu lateral: **Embaixadores**.

### Cadastrar novo embaixador

1. Clique no botão **Novo Embaixador**.
2. Preencha os dados obrigatórios:
   - Nome completo
   - Email
   - Telefone (WhatsApp)
   - Data de nascimento
   - Endereço
3. Se o embaixador foi indicado por alguém, selecione o **Embaixador Indicador** no campo correspondente.
4. Clique em **Salvar**.

### Editar dados

1. Na lista de embaixadores, clique no nome ou no botão de edição do embaixador desejado.
2. Altere os campos necessários.
3. Clique em **Salvar**.

### Status do embaixador

Cada embaixador possui um dos seguintes status:

- **Ativo** — embaixador em dia com suas obrigações.
- **Inativo** — embaixador desativado manualmente ou por inadimplência.
- **Pendente Renovação** — embaixador com data de renovação próxima ou vencida.

Para alterar o status, edite o embaixador e modifique o campo **Status**.

### Link de indicação

Cada embaixador possui um link único de indicação para compartilhar com candidatos.

- **Copiar link**: clique no botão de copiar ao lado do link. O link será copiado para a área de transferência.
- **Compartilhar via WhatsApp**: clique no botão do WhatsApp para abrir uma mensagem pré-formatada com o link de indicação.

O link segue o formato: `https://seudominio.com/inscricao?ref=CODIGO`

### Exportar relatório

Na tela de Embaixadores, clique no botão **Exportar** e escolha o formato:

- **PDF** — relatório formatado para impressão.
- **XLSX** — planilha Excel para análise de dados.
- **Email** — envia o relatório por email para o endereço configurado.

---

## 4. Fluxo de Inscrição

### Como funciona o formulário público

O sistema possui um formulário público acessível em `/inscricao`. Qualquer pessoa pode se inscrever como candidato a embaixador, sem necessidade de login.

### Link com código de indicação

Quando um embaixador compartilha seu link de indicação, o formulário é acessado com o parâmetro `?ref=CODIGO`. Isso vincula automaticamente a inscrição ao embaixador indicador.

Exemplo: `https://seudominio.com/inscricao?ref=joao123`

O nome do embaixador indicador aparece no formulário para o candidato.

### Visualizar inscrições recebidas

1. Acesse **Inscrições** no menu lateral.
2. A lista mostra todas as inscrições com os seguintes dados:
   - Nome do candidato
   - Email e telefone
   - Data da inscrição
   - Embaixador indicador (se houver)
   - Status (nova, entrevista agendada, aprovada, rejeitada)
3. Use os filtros para buscar por status, data ou nome.

### Agendar entrevista a partir da inscrição

1. Na lista de inscrições, localize o candidato desejado.
2. Clique no botão **Agendar Entrevista**.
3. O sistema abrirá o formulário de agendamento com os dados do candidato pré-preenchidos.
4. Defina data, horário e entrevistador.
5. Clique em **Salvar**.

### Aprovar ou rejeitar

- **Aprovar**: após a entrevista, marque como aprovada. O candidato pode ser convertido em embaixador.
- **Rejeitar**: marque como rejeitada. O candidato recebe uma notificação (se configurado).

---

## 5. Entrevistas

Acesse pelo menu lateral: **Entrevistas**.

### Agendar entrevista

1. Clique em **Nova Entrevista**.
2. Selecione o candidato (ou crie a partir de uma inscrição).
3. Preencha:
   - Data e horário
   - Entrevistador responsável
   - Observações (opcional)
4. Clique em **Salvar**.

### Gerar link Google Meet

1. Ao criar ou editar uma entrevista, clique no botão **Gerar Link Meet**.
2. O sistema cria automaticamente um link do Google Meet.
3. O link fica disponível na entrevista e pode ser compartilhado com o candidato.

### Marcar resultado da entrevista

Após realizar a entrevista, atualize o status:

- **Realizada** — entrevista aconteceu, aguardando decisão.
- **Aprovada** — candidato aprovado para ser embaixador.
- **Reprovada** — candidato não aprovado.

### Converter aprovado em embaixador

1. Na entrevista com status **Aprovada**, clique no botão **Converter em Embaixador**.
2. O sistema cria automaticamente o cadastro de embaixador com os dados do candidato.
3. O novo embaixador aparece na lista de Embaixadores com status **Ativo**.

### Notificar candidato

- Ao agendar, aprovar ou reprovar uma entrevista, o sistema pode enviar notificação automaticamente por WhatsApp ou email.
- Você também pode enviar uma notificação manualmente clicando no botão de notificação na entrevista.

---

## 6. Eventos

Acesse pelo menu lateral: **Eventos**.

### Criar evento

1. Clique em **Novo Evento**.
2. Preencha:
   - Nome do evento
   - Descrição
   - Data e horário de início e término
   - Local
   - Capacidade máxima (número de vagas)
   - Imagem de capa (opcional)
3. Clique em **Salvar**.

### Visualização lista vs calendário

A tela de eventos oferece duas formas de visualização:

- **Lista** — exibe todos os eventos em formato de cards ou tabela, ordenados por data.
- **Calendário** — exibe os eventos em um calendário visual mensal, inspirado no Apple Calendar. Clique em um dia para ver os eventos daquele dia.

Alterne entre as visualizações usando os botões no topo da tela.

### Abrir inscrições

1. Edite o evento e ative a opção **Inscrições Abertas**.
2. Defina a **capacidade máxima** de participantes.
3. O sistema gera automaticamente um **link público** para inscrição: `/evento/:id`.
4. Compartilhe o link com os embaixadores ou publicamente.

### Gestão de participantes

Na página de detalhes do evento:

- **Lista de participantes** — todos os inscritos com nome, email e status.
- **Check-in** — marque a presença de cada participante no dia do evento.
- **Lista de espera** — quando a capacidade máxima é atingida, novos inscritos entram na lista de espera automaticamente.

### Enviar convites para embaixadores

1. Na página do evento, clique em **Enviar Convites**.
2. Selecione os embaixadores (ou envie para todos os ativos).
3. Escolha o canal: WhatsApp, email ou ambos.
4. Clique em **Enviar**.

---

## 7. Terça de Glória

Acesse pelo menu lateral: **Terça de Glória**.

As reuniões da Terça de Glória são encontros semanais dos embaixadores.

### Cadastrar reunião

1. Clique em **Nova Reunião**.
2. Preencha:
   - Data
   - Tema ou pauta
   - Local
   - Observações (opcional)
3. Clique em **Salvar**.

### Status da reunião

Cada reunião possui um dos status:

- **Planejada** — reunião agendada para data futura.
- **Realizada** — reunião que já aconteceu.
- **Cancelada** — reunião cancelada.

Para alterar o status, edite a reunião e modifique o campo correspondente.

### Notificar embaixadores

1. Na reunião, clique no botão **Notificar Embaixadores**.
2. O sistema envia lembrete por WhatsApp e/ou email para todos os embaixadores ativos.
3. A notificação inclui data, horário, local e tema da reunião.

---

## 8. Welcome Kit

Acesse pelo menu lateral: **Welcome Kit**.

O Welcome Kit controla a entrega de materiais para os embaixadores.

### Tipos de kit

O sistema suporta três tipos de kit:

- **Welcome** — kit de boas-vindas para novos embaixadores.
- **Renovação** — kit enviado quando o embaixador renova sua participação.
- **Aniversário** — kit especial de aniversário do embaixador.

### Marcar itens entregues

1. Localize o embaixador na lista de Welcome Kit.
2. Marque individualmente cada item como **Entregue** (checkbox).
3. Quando todos os itens forem marcados, o kit é considerado completo.

### Acompanhar status

A lista de Welcome Kit mostra o status de cada kit:

- **Pendente** — kit aguardando preparação ou envio.
- **Parcialmente Entregue** — alguns itens foram entregues.
- **Entregue** — todos os itens do kit foram entregues.

Use os filtros para visualizar apenas kits pendentes ou de um tipo específico.

---

## 9. Pagamentos

Acesse pelo menu lateral: **Pagamentos**.

### Registrar pagamento

1. Clique em **Novo Pagamento**.
2. Selecione o **Embaixador**.
3. Preencha:
   - Valor
   - Data de vencimento
   - Data de pagamento (se já pago)
   - Forma de pagamento
   - Observações (opcional)
4. Clique em **Salvar**.

### Status do pagamento

- **Pendente** — pagamento registrado mas ainda não recebido.
- **Pago** — pagamento confirmado.
- **Atrasado** — pagamento com data de vencimento ultrapassada sem confirmação.

### Lembretes automáticos

O sistema envia lembretes automáticos diariamente:

- **Pagamentos próximos do vencimento** — lembrete enviado alguns dias antes da data de vencimento.
- **Pagamentos atrasados** — notificação enviada ao embaixador e ao administrador quando um pagamento está vencido.

Os lembretes são enviados por WhatsApp e/ou email, conforme configuração.

---

## 10. Produtos e Pedidos

### Produtos

Acesse pelo menu lateral: **Produtos**.

A gestão de produtos é exclusiva do administrador.

#### Cadastrar produto

1. Clique em **Novo Produto**.
2. Preencha:
   - Nome do produto
   - SKU (código identificador)
   - Preço
   - Estoque (quantidade disponível)
   - Categoria
   - Descrição (opcional)
   - Imagem do produto (upload)
3. Clique em **Salvar**.

#### Categorias disponíveis

Os produtos podem ser organizados por categorias definidas no sistema (ex.: camisetas, acessórios, materiais, livros). As categorias ajudam na organização e filtragem do catálogo.

#### Editar e gerenciar estoque

1. Clique no produto desejado para editá-lo.
2. Atualize preço, estoque ou qualquer outro campo.
3. Clique em **Salvar**.

### Pedidos

Acesse pelo menu lateral: **Pedidos**.

#### Fazer pedido para embaixador

1. Clique em **Novo Pedido**.
2. Selecione o **Embaixador** destinatário.
3. Adicione os produtos e quantidades desejadas.
4. Confirme o pedido clicando em **Salvar**.

#### Fluxo do pedido

Cada pedido passa pelas seguintes etapas:

1. **Solicitado** — pedido criado, aguardando separação.
2. **Separado** — itens do pedido foram separados no estoque.
3. **Enviado** — pedido enviado para o embaixador.
4. **Entregue** — embaixador confirmou o recebimento.

Para avançar o status, abra o pedido e clique no botão correspondente à próxima etapa.

---

## 11. Relatórios e Exportação

O sistema permite exportar dados de diversas telas em três formatos.

### PDF

- Gera um relatório formatado, ideal para impressão ou arquivamento.
- Disponível nas telas: Embaixadores, Pagamentos, Eventos, Entrevistas, Pedidos.
- Clique no botão **Exportar** e selecione **PDF**.

### XLSX / Excel

- Gera uma planilha com todos os dados da tela, ideal para análise e manipulação de dados.
- Disponível nas mesmas telas do PDF.
- Clique no botão **Exportar** e selecione **XLSX**.

### Envio por email

- Envia o relatório (PDF ou XLSX) diretamente para um endereço de email.
- Clique no botão **Exportar**, selecione **Email**, informe o destinatário e clique em **Enviar**.

---

## 12. Notificações

### WhatsApp (Z-API)

O sistema utiliza a Z-API para envio de mensagens via WhatsApp.

- **Mensagens individuais** — envie mensagens para um embaixador específico a partir de qualquer tela (entrevistas, eventos, pagamentos).
- **Envio em massa** — envie mensagens para todos os embaixadores ativos de uma vez (convites para eventos, lembretes, comunicados).

Para configurar a integração Z-API, acesse a tela **Z-API Admin** no menu lateral.

### Email (SMTP)

O sistema envia emails através de servidor SMTP configurado.

- Usado para notificações de entrevistas, confirmações de inscrição, lembretes de pagamento e envio de relatórios.
- Os templates de email seguem o padrão visual do sistema.

### Lembretes automáticos diários

O sistema executa diariamente verificações automáticas e envia lembretes para:

- **Pagamentos** — vencimentos próximos e pagamentos atrasados.
- **Renovações** — embaixadores com renovação próxima do vencimento.
- **Aniversários** — embaixadores aniversariantes do dia.
- **Eventos** — eventos que acontecem nos próximos dias.

Os lembretes são enviados automaticamente sem necessidade de ação manual.

### Envio em massa

1. Selecione a funcionalidade de envio em massa na tela desejada (ex.: Eventos > Enviar Convites).
2. Selecione os destinatários (todos os ativos ou um grupo específico).
3. Escolha o canal: WhatsApp, Email ou ambos.
4. Revise a mensagem e clique em **Enviar**.

---

## 13. Configurações

### Idiomas

O sistema suporta três idiomas:

- **Portugues (Brasil)** — idioma padrão.
- **Espanhol**
- **Ingles**

Para alterar o idioma:
1. Clique no seletor de idioma (geralmente no cabeçalho ou menu lateral).
2. Selecione o idioma desejado.
3. A interface é atualizada imediatamente.

### Perfil do usuário

Acesse seu perfil clicando no seu nome/avatar no canto superior.

- Visualize e edite seus dados pessoais.
- Altere sua senha.
- Configure preferências de notificação.

### LGPD (Proteção de Dados)

O sistema está em conformidade com a LGPD e oferece:

- **Exportar dados** — o embaixador pode solicitar a exportação de todos os seus dados pessoais armazenados no sistema.
- **Excluir conta** — o embaixador pode solicitar a exclusão completa de sua conta e todos os dados associados.
- **Termos de uso** — disponíveis em `/terms`.
- **Política de privacidade** — disponível em `/privacy`.

---

## 14. Portal do Embaixador

Quando um embaixador faz login, ele acessa um portal personalizado com funcionalidades limitadas ao seu contexto.

### Dashboard pessoal

O embaixador vê um dashboard com seus dados pessoais:

- Quantidade de indicados
- Status do pagamento
- Próximos eventos
- Próximas reuniões
- Dados do seu kit de boas-vindas

### Meus Indicados

- Lista de todas as pessoas que se inscreveram usando seu link de indicação.
- Status de cada indicado (inscrito, em entrevista, aprovado, ativo).
- Compartilhar link de indicação diretamente da tela.

### Eventos e Reuniões

- Visualizar eventos disponíveis e se inscrever.
- Ver reuniões da Terça de Glória agendadas.
- Acompanhar confirmação de presença.

### Catálogo de Produtos

- Navegar pelo catálogo de produtos disponíveis.
- Visualizar detalhes, preços e disponibilidade.
- Os pedidos são feitos pelo administrador.

---

## 15. Instalação no Celular (PWA)

O sistema pode ser instalado como um aplicativo no celular, funcionando como um app nativo.

### Como instalar no Android

1. Abra o sistema no navegador **Google Chrome**.
2. Acesse a URL do sistema e faça login.
3. Toque no menu de tres pontos (canto superior direito).
4. Toque em **"Instalar aplicativo"** ou **"Adicionar a tela inicial"**.
5. Confirme tocando em **"Instalar"**.
6. O aplicativo aparecerá na sua tela inicial como qualquer outro app.

### Como instalar no iPhone

1. Abra o sistema no navegador **Safari** (obrigatório no iPhone).
2. Acesse a URL do sistema e faça login.
3. Toque no botao de compartilhamento (quadrado com seta para cima, na barra inferior).
4. Role para baixo e toque em **"Adicionar a Tela de Inicio"**.
5. Personalize o nome se desejar e toque em **"Adicionar"**.
6. O aplicativo aparecerá na sua tela inicial.

### Vantagens do PWA

- Funciona sem precisar baixar da loja de aplicativos.
- Abre em tela cheia, como um app nativo.
- Recebe atualizações automaticamente.
- Ocupa pouco espaço no celular.

---

## Dicas Gerais

- **Busca e filtros**: a maioria das telas possui campo de busca e filtros por status, data ou categoria. Use-os para encontrar informações rapidamente.
- **Atalhos nas tabelas**: clique nos cabeçalhos das colunas para ordenar os dados.
- **Responsividade**: o sistema funciona em qualquer tamanho de tela — desktop, tablet e celular.
- **Suporte a temas**: o sistema suporta modo claro e escuro. A alternância está disponível no cabeçalho.

---

*Guia atualizado em marco de 2026.*
