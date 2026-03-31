const LOGO = "/logo-legendarios.png";

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-[#d2d2d7] px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <img src={LOGO} alt="Embaixadores" className="h-12" />
          <h1 className="text-2xl font-bold text-white">Termos de Servico</h1>
        </div>

        <p className="text-sm text-[#86868b]">Ultima atualizacao: 28 de marco de 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. Aceitacao</h2>
          <p>Ao acessar e utilizar o sistema Embaixadores dos Legendarios, voce concorda com estes termos de servico. O acesso e restrito a membros autorizados do programa de embaixadores.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. Descricao do Servico</h2>
          <p>O sistema e uma plataforma de gestao interna para o programa de embaixadores do movimento Legendarios, oferecendo:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cadastro e gestao de embaixadores</li>
            <li>Controle de entrega de kits</li>
            <li>Agendamento de eventos e reunioes</li>
            <li>Gestao de entrevistas com candidatos</li>
            <li>Relatorios e exportacao de dados</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">3. Responsabilidades do Usuario</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Manter suas credenciais de acesso seguras</li>
            <li>Fornecer informacoes verdadeiras e atualizadas</li>
            <li>Nao compartilhar acesso com terceiros</li>
            <li>Utilizar o sistema apenas para fins do programa de embaixadores</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Propriedade</h2>
          <p>O sistema e de propriedade do movimento Legendarios. Todo o conteudo, dados e funcionalidades sao de uso exclusivo do programa de embaixadores.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Disponibilidade</h2>
          <p>O sistema e oferecido "como esta". Nos nos esforcaremos para manter o servico disponivel, mas nao garantimos disponibilidade ininterrupta.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Alteracoes</h2>
          <p>Estes termos podem ser atualizados a qualquer momento. Usuarios serao notificados sobre mudancas significativas.</p>
        </section>

        <div className="pt-8 border-t border-white/[0.06] text-center text-[#48484a] text-xs">
          Legendarios - Amor, Honra, Unidade
        </div>
      </div>
    </div>
  );
}
