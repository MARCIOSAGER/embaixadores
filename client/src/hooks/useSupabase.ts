import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type Embaixador = Database["public"]["Tables"]["embaixadores"]["Row"];
type InsertEmbaixador = Database["public"]["Tables"]["embaixadores"]["Insert"];
type TercaGloria = Database["public"]["Tables"]["tercaGloria"]["Row"];
type InsertTercaGloria = Database["public"]["Tables"]["tercaGloria"]["Insert"];
type WelcomeKit = Database["public"]["Tables"]["welcomeKits"]["Row"];
type Evento = Database["public"]["Tables"]["eventos"]["Row"];
type InsertEvento = Database["public"]["Tables"]["eventos"]["Insert"];
type Entrevista = Database["public"]["Tables"]["entrevistas"]["Row"];
type InsertEntrevista = Database["public"]["Tables"]["entrevistas"]["Insert"];
type Pagamento = Database["public"]["Tables"]["pagamentos"]["Row"];
type InsertPagamento = Database["public"]["Tables"]["pagamentos"]["Insert"];

// ========== EMBAIXADORES ==========

export function useEmbaixadores(search?: string) {
  return useQuery({
    queryKey: ["embaixadores", search],
    queryFn: async () => {
      let query = supabase.from("embaixadores").select("*").order("nomeCompleto", { ascending: true });
      if (search) {
        const escaped = search.replace(/[%_\\]/g, '\\$&').replace(/[,().]/g, '');
        query = query.or(`nomeCompleto.ilike.%${escaped}%,email.ilike.%${escaped}%,cidade.ilike.%${escaped}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Embaixador[];
    },
  });
}

export function useEmbaixador(id: number) {
  return useQuery({
    queryKey: ["embaixador", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("embaixadores").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Embaixador;
    },
    enabled: !!id,
  });
}

export function useEmbaixadoresStats() {
  return useQuery({
    queryKey: ["embaixadores", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("embaixadores").select("status");
      if (error) throw error;
      const all = data || [];
      return {
        total: all.length,
        ativos: all.filter((e) => e.status === "ativo").length,
        inativos: all.filter((e) => e.status === "inativo").length,
        pendentes: all.filter((e) => e.status === "pendente_renovacao").length,
      };
    },
  });
}

export function useCreateEmbaixador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEmbaixador) => {
      const { data: result, error } = await supabase.from("embaixadores").insert(data).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["embaixadores"] });
    },
  });
}

export function useUpdateEmbaixador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertEmbaixador>) => {
      const { error } = await supabase.from("embaixadores").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["embaixadores"] });
    },
  });
}

export function useDeleteEmbaixador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("embaixadores").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["embaixadores"] });
    },
  });
}

export function useProfileEmbaixador(email: string | null) {
  return useQuery({
    queryKey: ["embaixador", "profile", email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase
        .from("embaixadores")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      return data as Embaixador | null;
    },
    enabled: !!email,
  });
}

// ========== TERÇA DE GLÓRIA ==========

export function useTercaGloria() {
  return useQuery({
    queryKey: ["tercaGloria"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tercaGloria").select("*").order("data", { ascending: false });
      if (error) throw error;
      return data as TercaGloria[];
    },
  });
}

export function useCreateTercaGloria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTercaGloria) => {
      const { data: result, error } = await supabase.from("tercaGloria").insert(data).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tercaGloria"] });
    },
  });
}

export function useUpdateTercaGloria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertTercaGloria>) => {
      const { error } = await supabase.from("tercaGloria").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tercaGloria"] });
    },
  });
}

export function useDeleteTercaGloria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("tercaGloria").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tercaGloria"] });
    },
  });
}

// ========== WELCOME KIT ==========

export function useWelcomeKits() {
  return useQuery({
    queryKey: ["welcomeKits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("welcomeKits").select("*").order("createdAt", { ascending: false });
      if (error) throw error;
      return data as WelcomeKit[];
    },
  });
}

export function useUpdateWelcomeKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Database["public"]["Tables"]["welcomeKits"]["Update"]>) => {
      // Auto-calculate status
      const items = [data.patchEntregue, data.pinBoneEntregue, data.anelEntregue, data.espadaEntregue, data.mochilaBalacEntregue];
      const delivered = items.filter(Boolean).length;
      if (delivered === 5) {
        data.status = "completo";
        data.dataEntrega = data.dataEntrega ?? Date.now();
      } else if (delivered > 0) {
        data.status = "parcial";
      } else {
        data.status = "pendente";
      }
      const { error } = await supabase.from("welcomeKits").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["welcomeKits"] });
    },
  });
}

export function useCreateWelcomeKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { embaixadorId: number; tipo?: "welcome" | "renovacao" | "aniversario"; observacoes?: string }) => {
      const { data: result, error } = await supabase.from("welcomeKits").insert({
        embaixadorId: data.embaixadorId,
        tipo: data.tipo ?? "welcome",
        patchEntregue: false,
        pinBoneEntregue: false,
        anelEntregue: false,
        espadaEntregue: false,
        mochilaBalacEntregue: false,
        status: "pendente",
        observacoes: data.observacoes ?? null,
      }).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["welcomeKits"] });
    },
  });
}

// ========== KIT HISTORICO ==========
// NOTE: Requires `kit_historico` table in Supabase — see client/src/lib/kitHistory.ts for DDL

export function useAddKitHistory() {
  return useMutation({
    mutationFn: async (data: { kitId: number; item: string; action: "entregue" | "removido"; userName: string }) => {
      const { error } = await supabase.from("kit_historico").insert(data);
      if (error) throw error;
    },
  });
}

export function useKitHistory(kitId: number | null) {
  return useQuery({
    queryKey: ["kitHistory", kitId],
    queryFn: async () => {
      if (!kitId) return [];
      const { data, error } = await supabase
        .from("kit_historico")
        .select("*")
        .eq("kitId", kitId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!kitId,
  });
}

// ========== EVENTOS ==========

export function useEventos() {
  return useQuery({
    queryKey: ["eventos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eventos").select("*").order("data", { ascending: false });
      if (error) throw error;
      return data as Evento[];
    },
  });
}

export function useCreateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEvento) => {
      const { data: result, error } = await supabase.from("eventos").insert(data).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
    },
  });
}

export function useUpdateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertEvento>) => {
      const { error } = await supabase.from("eventos").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
    },
  });
}

export function useDeleteEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("eventos").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
    },
  });
}

// ========== ENTREVISTAS ==========

export function useEntrevistas() {
  return useQuery({
    queryKey: ["entrevistas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entrevistas").select("*").order("dataEntrevista", { ascending: false });
      if (error) throw error;
      return data as Entrevista[];
    },
  });
}

export function useCreateEntrevista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEntrevista) => {
      const { data: result, error } = await supabase.from("entrevistas").insert(data).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entrevistas"] });
    },
  });
}

export function useUpdateEntrevista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertEntrevista>) => {
      const { error } = await supabase.from("entrevistas").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entrevistas"] });
    },
  });
}

export function useDeleteEntrevista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("entrevistas").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entrevistas"] });
    },
  });
}

// ========== PAGAMENTOS ==========

export function usePagamentos(embaixadorId?: number) {
  return useQuery({
    queryKey: ["pagamentos", embaixadorId],
    queryFn: async () => {
      let query = supabase.from("pagamentos").select("*").order("dataVencimento", { ascending: false });
      if (embaixadorId) query = query.eq("embaixadorId", embaixadorId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Pagamento[];
    },
  });
}

export function useCreatePagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPagamento) => {
      const { data: result, error } = await supabase.from("pagamentos").insert(data).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
    },
  });
}

export function useUpdatePagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertPagamento>) => {
      const { error } = await supabase.from("pagamentos").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
    },
  });
}

export function useDeletePagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("pagamentos").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
    },
  });
}

// ========== DASHBOARD ==========

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const [embRes, kitsRes, eventosRes, reunioesRes, inscRes, pagRes, entrevRes] = await Promise.all([
        supabase.from("embaixadores").select("*"),
        supabase.from("welcomeKits").select("status"),
        supabase.from("eventos").select("*").gte("data", Date.now()).eq("status", "agendado").order("data").limit(5),
        supabase.from("tercaGloria").select("*").gte("data", Date.now()).eq("status", "planejada").order("data").limit(3),
        supabase.from("inscricoes").select("createdAt, status, embaixadorIndicadorId, nomeIndicador"),
        supabase.from("pagamentos").select("dataPagamento, valor, status"),
        supabase.from("entrevistas").select("status, indicadoPor"),
      ]);

      const allEmb = embRes.data || [];
      const allKits = kitsRes.data || [];
      const now = Date.now();
      const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

      const proximosAniversarios = allEmb.filter((e) => {
        if (!e.dataNascimento) return false;
        const bday = new Date(e.dataNascimento);
        const thisYear = new Date();
        const nextBday = new Date(thisYear.getFullYear(), bday.getMonth(), bday.getDate());
        if (nextBday.getTime() < now) nextBday.setFullYear(nextBday.getFullYear() + 1);
        return nextBday.getTime() <= thirtyDaysFromNow;
      }).slice(0, 5);

      // Entrevistas data for funnel and top referrers
      const allEntrev = entrevRes.data || [];
      const allInsc = inscRes.data || [];

      const funnel = {
        total: allInsc.length,
        entrevistando: allEntrev.filter((e) => e.status === "agendada" || e.status === "realizada").length,
        aprovados: allEntrev.filter((e) => e.status === "aprovada").length,
        embaixadores: allEmb.filter((e) => e.status === "ativo").length,
      };

      // Top referrers from entrevistas.indicadoPor
      const referrerMap = new Map<string, number>();
      allEntrev.forEach((ent) => {
        if (ent.indicadoPor) {
          referrerMap.set(ent.indicadoPor, (referrerMap.get(ent.indicadoPor) || 0) + 1);
        }
      });
      const topReferrers = Array.from(referrerMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Process pagamentos for revenue trend
      const allPag = pagRes.data || [];
      const monthlyRevenue: { month: string; total: number }[] = [];
      let totalRevenue = 0;
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const label = monthNames[d.getMonth()];
        const monthTotal = allPag
          .filter((p) => {
            if (!p.dataPagamento || p.status !== "pago") return false;
            const pd = new Date(p.dataPagamento);
            return `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}` === key;
          })
          .reduce((sum, p) => sum + parseFloat(p.valor || "0"), 0);
        monthlyRevenue.push({ month: label, total: monthTotal });
        totalRevenue += monthTotal;
      }

      return {
        embaixadores: {
          total: allEmb.length,
          ativos: allEmb.filter((e) => e.status === "ativo").length,
          inativos: allEmb.filter((e) => e.status === "inativo").length,
          pendentes: allEmb.filter((e) => e.status === "pendente_renovacao").length,
        },
        proximosAniversarios,
        renovacoesPendentes: allEmb.filter((e) => e.status === "pendente_renovacao").slice(0, 5),
        proximosEventos: eventosRes.data || [],
        proximasReunioes: reunioesRes.data || [],
        kitsStats: {
          pendentes: allKits.filter((k) => k.status === "pendente").length,
          parciais: allKits.filter((k) => k.status === "parcial").length,
          completos: allKits.filter((k) => k.status === "completo").length,
        },
        funnel,
        topReferrers,
        monthlyRevenue,
        totalRevenue,
      };
    },
  });
}

// ========== AUTH (Supabase Auth) ==========

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

// ========== ADMIN ==========

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("createdAt", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: "user" | "admin" }) => {
      const { error } = await supabase.from("users").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// ========== INSCRICOES ==========

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];

export function useInscricoes(search?: string) {
  return useQuery({
    queryKey: ["inscricoes", search],
    queryFn: async () => {
      let query = supabase.from("inscricoes").select("*").order("createdAt", { ascending: false });
      if (search) {
        const escaped = search.replace(/[%_\\]/g, '\\$&').replace(/[,().]/g, '');
        query = query.or(`nomeCompleto.ilike.%${escaped}%,email.ilike.%${escaped}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Inscricao[];
    },
  });
}

export function useUpdateInscricao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Database["public"]["Tables"]["inscricoes"]["Update"]>) => {
      const { error } = await supabase.from("inscricoes").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscricoes"] });
    },
  });
}

export function useDeleteInscricao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("inscricoes").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscricoes"] });
    },
  });
}

// ========== PRODUTOS ==========

type Produto = Database["public"]["Tables"]["produtos"]["Row"];
type InsertProduto = Database["public"]["Tables"]["produtos"]["Insert"];

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*").order("nome", { ascending: true });
      if (error) throw error;
      return data as Produto[];
    },
  });
}

export function useCreateProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProduto) => {
      const { data: result, error } = await supabase.from("produtos").insert(data).select("id").single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}

export function useUpdateProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertProduto>) => {
      const { error } = await supabase.from("produtos").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}

export function useDeleteProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}

// ========== PEDIDOS ==========

type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];
type InsertPedido = Database["public"]["Tables"]["pedidos"]["Insert"];
type PedidoItem = Database["public"]["Tables"]["pedido_itens"]["Row"];
type InsertPedidoItem = Database["public"]["Tables"]["pedido_itens"]["Insert"];

export function usePedidos() {
  return useQuery({
    queryKey: ["pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, embaixadores!inner(nomeCompleto)")
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePedidoItens(pedidoId: number | null) {
  return useQuery({
    queryKey: ["pedidoItens", pedidoId],
    queryFn: async () => {
      if (!pedidoId) return [];
      const { data, error } = await supabase
        .from("pedido_itens")
        .select("*, produtos(nome)")
        .eq("pedidoId", pedidoId);
      if (error) throw error;
      return data;
    },
    enabled: !!pedidoId,
  });
}

export function useCreatePedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pedido: InsertPedido; itens: Omit<InsertPedidoItem, "pedidoId">[] }) => {
      const { data: newPedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert(data.pedido)
        .select("id")
        .single();
      if (pedidoError) throw pedidoError;

      const itensWithPedidoId = data.itens.map((item) => ({
        ...item,
        pedidoId: newPedido.id,
      }));
      const { error: itensError } = await supabase.from("pedido_itens").insert(itensWithPedidoId);
      if (itensError) throw itensError;

      // Decrement stock for each product
      for (const item of itensWithPedidoId) {
        const { data: prod } = await supabase
          .from("produtos")
          .select("estoque")
          .eq("id", item.produtoId)
          .single();
        if (prod) {
          await supabase
            .from("produtos")
            .update({ estoque: Math.max(0, prod.estoque - item.quantidade) })
            .eq("id", item.produtoId);
        }
      }

      return newPedido;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}

export function useUpdatePedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertPedido>) => {
      const { error } = await supabase.from("pedidos").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
    },
  });
}

export function useDeletePedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error: itemsError } = await supabase.from("pedido_itens").delete().eq("pedidoId", id);
      if (itemsError) throw itemsError;
      const { error } = await supabase.from("pedidos").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["pedidoItens"] });
    },
  });
}

// ========== EVENTO PARTICIPANTES ==========

type EventoParticipante = Database["public"]["Tables"]["evento_participantes"]["Row"];
type InsertEventoParticipante = Database["public"]["Tables"]["evento_participantes"]["Insert"];

export function useEventoParticipantes(eventoId: number) {
  return useQuery({
    queryKey: ["eventoParticipantes", eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evento_participantes")
        .select("*")
        .eq("eventoId", eventoId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return data as EventoParticipante[];
    },
    enabled: !!eventoId,
  });
}

export function useCreateParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEventoParticipante) => {
      const { data: result, error } = await supabase
        .from("evento_participantes")
        .insert(data)
        .select("id, status")
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["eventoParticipantes", variables.eventoId] });
    },
  });
}

export function useUpdateParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventoId, ...data }: { id: number; eventoId: number } & Partial<InsertEventoParticipante>) => {
      const { error } = await supabase.from("evento_participantes").update(data).eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["eventoParticipantes", variables.eventoId] });
    },
  });
}

export function useDeleteParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventoId }: { id: number; eventoId: number }) => {
      const { error } = await supabase.from("evento_participantes").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["eventoParticipantes", variables.eventoId] });
    },
  });
}

export function useConvertInscricaoToEmbaixador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inscricao: Inscricao) => {
      const codigoIndicacao = Math.random().toString(36).substring(2, 8);
      const embData: InsertEmbaixador = {
        nomeCompleto: inscricao.nomeCompleto,
        email: inscricao.email || null,
        telefone: inscricao.telefone || null,
        cidade: inscricao.cidade || null,
        estado: inscricao.estado || null,
        profissao: inscricao.profissao || null,
        empresa: null,
        numeroLegendario: inscricao.numeroLegendario || null,
        numeroEmbaixador: null,
        dataNascimento: inscricao.dataNascimento ? new Date(inscricao.dataNascimento + "T12:00:00").getTime() : null,
        dataIngresso: Date.now(),
        dataRenovacao: null,
        status: "ativo",
        idioma: "pt",
        observacoes: null,
        fotoUrl: inscricao.fotoUrl || null,
        codigoIndicacao,
      };
      const { data: newEmb, error: embError } = await supabase.from("embaixadores").insert(embData).select("id").single();
      if (embError) throw embError;
      const { error: updateError } = await supabase.from("inscricoes").update({ status: "aprovado" }).eq("id", inscricao.id);
      if (updateError) throw updateError;
      return newEmb;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscricoes"] });
      qc.invalidateQueries({ queryKey: ["embaixadores"] });
    },
  });
}
