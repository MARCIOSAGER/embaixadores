import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { trpc } from "../lib/trpc";
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
        query = query.or(`nomeCompleto.ilike.%${search}%,email.ilike.%${search}%,cidade.ilike.%${search}%`);
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
    mutationFn: async (data: { embaixadorId: number; observacoes?: string }) => {
      const { data: result, error } = await supabase.from("welcomeKits").insert({
        embaixadorId: data.embaixadorId,
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
      const [embRes, kitsRes, eventosRes, reunioesRes] = await Promise.all([
        supabase.from("embaixadores").select("*"),
        supabase.from("welcomeKits").select("status"),
        supabase.from("eventos").select("*").gte("data", Date.now()).eq("status", "agendado").order("data").limit(5),
        supabase.from("tercaGloria").select("*").gte("data", Date.now()).eq("status", "planejada").order("data").limit(3),
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
  return trpc.users.updateRole.useMutation({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
