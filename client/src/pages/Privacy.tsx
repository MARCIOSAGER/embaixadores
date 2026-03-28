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
          <h2 className="text-lg font-semibold text-white">3. Compartilhamento</h2>
          <p>Seus dados nao sao compartilhados com terceiros. O sistema utiliza Supabase como infraestrutura de banco de dados e autenticacao, com servidores seguros.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Seguranca</h2>
          <p>Utilizamos criptografia, autenticacao segura e controle de acesso baseado em funcoes (RBAC) para proteger seus dados.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Seus Direitos</h2>
          <p>Voce pode solicitar acesso, correcao ou exclusao dos seus dados pessoais a qualquer momento entrando em contato com o administrador do sistema.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Contato</h2>
          <p>Para questoes sobre privacidade, entre em contato pelo email do administrador do sistema.</p>
        </section>

        <div className="pt-8 border-t border-white/[0.06] text-center text-[#48484a] text-xs">
          Legendarios - Amor, Honra, Unidade
        </div>
      </div>
    </div>
  );
}
