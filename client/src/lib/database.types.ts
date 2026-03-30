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
          codigoIndicacao: string | null;
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
          embaixadorIndicadorId: number | null;
          codigoIndicacao: string | null;
          status: string;
          createdAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["inscricoes"]["Row"], "id" | "createdAt">;
        Update: Partial<Database["public"]["Tables"]["inscricoes"]["Insert"]>;
      };
    };
  };
};
