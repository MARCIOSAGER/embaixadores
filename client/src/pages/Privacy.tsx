const LOGO = "/logo-legendarios.png";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-[#d2d2d7] px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <img src={LOGO} alt="Legendarios" className="h-12 invert" />
          <h1 className="text-2xl font-bold text-white">Politica de Privacidade</h1>
        </div>

        <p className="text-sm text-[#86868b]">Ultima atualizacao: 28 de marco de 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. Dados Coletados</h2>
          <p>O sistema Embaixadores dos Legendarios coleta os seguintes dados pessoais para gestao interna do programa de embaixadores:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nome completo, email e telefone</li>
            <li>Cidade, estado, profissao e empresa</li>
            <li>Data de nascimento e datas de ingresso/renovacao</li>
            <li>Foto de perfil (quando fornecida)</li>
            <li>Dados de autenticacao (Google OAuth ou email/senha)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. Uso dos Dados</h2>
          <p>Os dados sao utilizados exclusivamente para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestao do programa de embaixadores dos Legendarios</li>
            <li>Controle de entregas de kits</li>
            <li>Agendamento de eventos e entrevistas</li>
            <li>Comunicacao interna do movimento</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">3. Compartilhamento e Servicos de Terceiros</h2>
          <p>Seus dados nao sao vendidos ou compartilhados para fins comerciais. O sistema utiliza os seguintes servicos para seu funcionamento:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-white">Supabase</strong> — banco de dados e autenticacao</li>
            <li><strong className="text-white">Google OAuth</strong> — login social (quando utilizado)</li>
            <li><strong className="text-white">Cloudflare Turnstile</strong> — verificacao de seguranca (CAPTCHA) na tela de login, que pode coletar dados do dispositivo e endereco IP para deteccao de bots</li>
            <li><strong className="text-white">Z-API</strong> — envio de mensagens via WhatsApp</li>
            <li><strong className="text-white">SMTP (email)</strong> — envio de notificacoes por email</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Seguranca</h2>
          <p>Utilizamos criptografia, autenticacao segura e controle de acesso baseado em funcoes (RBAC) para proteger seus dados.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Retencao de Dados</h2>
          <p>Seus dados pessoais sao mantidos enquanto voce participar ativamente do programa de embaixadores. Apos solicitacao de exclusao, seus dados serao removidos em ate 30 dias uteis.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confirmar a existencia de tratamento dos seus dados</li>
            <li>Acessar e exportar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusao dos seus dados pessoais</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p>Voce pode exercer esses direitos diretamente pelo sistema (na pagina de Perfil) ou entrando em contato com o administrador.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">7. Contato</h2>
          <p>Para questoes sobre privacidade, entre em contato pelo email do administrador do sistema.</p>
        </section>

        <div className="pt-8 border-t border-white/[0.06] text-center text-[#48484a] text-xs">
          Legendarios - Amor, Honra, Unidade
        </div>
      </div>
    </div>
  );
}
