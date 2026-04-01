export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          openId: string;
          name: string | null;
          email: string | null;
          loginMethod: string | null;
          role: "user" | "admin";
          createdAt: string;
          updatedAt: string;
          lastSignedIn: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      embaixadores: {
        Row: {
          id: number;
          nomeCompleto: string;
          numeroLegendario: string | null;
          numeroEmbaixador: string | null;
          email: string | null;
          telefone: string | null;
          cidade: string | null;
          estado: string | null;
          profissao: string | null;
          empresa: string | null;
          dataNascimento: number | null;
          dataIngresso: number;
          dataRenovacao: number | null;
          status: "ativo" | "inativo" | "pendente_renovacao";
          idioma: "pt" | "es" | "en";
          observacoes: string | null;
          fotoUrl: string | null;
          instagram: string | null;
          codigoIndicacao: string | null;
          estadoCivil: string | null;
          nomeEsposa: string | null;
          dataNascimentoEsposa: number | null;
          qtdFilhos: number;
          idadesFilhos: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["embaixadores"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["embaixadores"]["Insert"]>;
      };
      pagamentos: {
        Row: {
          id: number;
          embaixadorId: number;
          valor: string;
          dataVencimento: number;
          dataPagamento: number | null;
          status: "pendente" | "pago" | "atrasado";
          observacoes: string | null;
          createdAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pagamentos"]["Row"], "id" | "createdAt">;
        Update: Partial<Database["public"]["Tables"]["pagamentos"]["Insert"]>;
      };
      tercaGloria: {
        Row: {
          id: number;
          data: number;
          tema: string;
          pregador: string | null;
          resumo: string | null;
          testemunhos: string | null;
          linkMeet: string | null;
          versiculoBase: string | null;
          status: "planejada" | "realizada" | "cancelada";
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tercaGloria"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["tercaGloria"]["Insert"]>;
      };
      welcomeKits: {
        Row: {
          id: number;
          embaixadorId: number;
          tipo: "welcome" | "renovacao" | "aniversario";
          patchEntregue: boolean;
          pinBoneEntregue: boolean;
          anelEntregue: boolean;
          espadaEntregue: boolean;
          mochilaBalacEntregue: boolean;
          dataEntrega: number | null;
          status: "pendente" | "parcial" | "completo";
          observacoes: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["welcomeKits"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["welcomeKits"]["Insert"]>;
      };
      eventos: {
        Row: {
          id: number;
          titulo: string;
          descricao: string | null;
          data: number;
          dataFim: number | null;
          local: string | null;
          tipo: "encontro" | "conferencia" | "retiro" | "treinamento" | "outro";
          linkMeet: string | null;
          recorrente: boolean;
          status: "agendado" | "realizado" | "cancelado";
          capacidade: number | null;
          imagemUrl: string | null;
          inscricaoAberta: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["eventos"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["eventos"]["Insert"]>;
      };
      entrevistas: {
        Row: {
          id: number;
          nomeCandidato: string;
          emailCandidato: string | null;
          telefoneCandidato: string | null;
          dataEntrevista: number;
          linkMeet: string | null;
          status: "agendada" | "realizada" | "aprovada" | "reprovada" | "cancelada";
          observacoes: string | null;
          indicadoPor: string | null;
          entrevistadorId: number | null;
          entrevistadorNome: string | null;
          entrevistadorEmail: string | null;
          entrevistadorTelefone: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["entrevistas"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["entrevistas"]["Insert"]>;
      };
      inscricoes: {
        Row: {
          id: number;
          nomeCompleto: string;
          email: string;
          telefone: string;
          instagram: string | null;
          numeroLegendario: string | null;
          topSede: string | null;
          qtdTopsServidos: string | null;
          areaServico: string | null;
          conhecimentoPrevio: string | null;
          indicadoPorEmb: boolean;
          nomeIndicador: string | null;
          sedeInternacional: boolean;
          nomeSedeInternacional: string | null;
          cargoLideranca: string | null;
          estadoCivil: string | null;
          qtdFilhos: number;
          idadesFilhos: string | null;
          profissao: string | null;
          areaAtuacao: string | null;
          possuiEmpresa: string | null;
          instagramEmpresa: string | null;
          segmentoMercado: string | null;
          tempoEmpreendedorismo: string | null;
          estruturaEquipe: string | null;
          investeClubePrivado: string | null;
          participaMentoria: string | null;
          valorInvestimento: string | null;
          disponibilidadeReuniao: string | null;
          ambienteEsposas: string | null;
          valorCirculoIntimo: string | null;
          motivoParticipacao: string | null;
          fotoUrl: string | null;
          nomeEsposa: string | null;
          dataNascimentoEsposa: string | null;
          dataNascimento: string | null;
          cidade: string | null;
          estado: string | null;
          embaixadorIndicadorId: number | null;
          codigoIndicacao: string | null;
          tipo: string;
          embaixadorId: number | null;
          status: string;
          createdAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["inscricoes"]["Row"], "id" | "createdAt">;
        Update: Partial<Database["public"]["Tables"]["inscricoes"]["Insert"]>;
      };
      produtos: {
        Row: {
          id: number;
          nome: string;
          descricao: string | null;
          categoria: string;
          sku: string | null;
          preco: string;
          estoque: number;
          tamanhos: string[] | null;
          cores: string[] | null;
          imagemUrl: string | null;
          status: "disponivel" | "esgotado" | "pre_venda";
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["produtos"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["produtos"]["Insert"]>;
      };
      pedidos: {
        Row: {
          id: number;
          embaixadorId: number;
          status: string;
          observacoes: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pedidos"]["Row"], "id" | "createdAt" | "updatedAt">;
        Update: Partial<Database["public"]["Tables"]["pedidos"]["Insert"]>;
      };
      pedido_itens: {
        Row: {
          id: number;
          pedidoId: number;
          produtoId: number;
          quantidade: number;
          tamanho: string | null;
          cor: string | null;
          precoUnitario: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pedido_itens"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["pedido_itens"]["Insert"]>;
      };
      evento_participantes: {
        Row: {
          id: number;
          eventoId: number;
          nomeCompleto: string;
          email: string;
          telefone: string;
          status: "confirmado" | "lista_espera" | "cancelado" | "presente";
          observacoes: string | null;
          createdAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["evento_participantes"]["Row"], "id" | "createdAt">;
        Update: Partial<Database["public"]["Tables"]["evento_participantes"]["Insert"]>;
      };
    };
  };
};
