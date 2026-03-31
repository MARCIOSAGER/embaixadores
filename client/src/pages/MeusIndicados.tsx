import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import { UsersRound, Clock, UserCheck, Search as SearchIcon, Copy, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  pendente: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)", label: "Pendente" },
  entrevistando: { color: "#0A84FF", bg: "rgba(10,132,255,0.14)", label: "Entrevistando" },
  aprovado: { color: "#30D158", bg: "rgba(48,209,88,0.14)", label: "Aprovado" },
  rejeitado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)", label: "Rejeitado" },
};

export default function MeusIndicados() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  // Find embaixador linked to this auth user
  const { data: myEmbaixador, isLoading: loadingEmb } = useQuery({
    queryKey: ["my-embaixador", session?.user?.id],
    queryFn: async () => {
      const { data: emb } = await supabase
        .from("embaixadores")
        .select("*")
        .eq("email", session?.user?.email as string)
        .single();
      return emb as any;
    },
    enabled: !!session?.user?.id,
  });

  // Query referrals
  const { data: referrals, isLoading: loadingRefs } = useQuery({
    queryKey: ["my-referrals", myEmbaixador?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("inscricoes")
        .select("*")
        .eq("embaixadorIndicadorId", myEmbaixador!.id as number)
        .order("createdAt", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!myEmbaixador?.id,
  });

  const referralLink = myEmbaixador?.codigoIndicacao
    ? `${window.location.origin}/inscricao?ref=${myEmbaixador.codigoIndicacao}`
    : "";

  const stats = {
    total: referrals?.length || 0,
    pendentes: referrals?.filter((r: any) => r.status === "pendente").length || 0,
    entrevistando: referrals?.filter((r: any) => r.status === "entrevistando").length || 0,
    aprovados: referrals?.filter((r: any) => r.status === "aprovado").length || 0,
  };

  function handleCopy() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(t("mi.copiado"));
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsAppShare() {
    if (!referralLink) return;
    const text = encodeURIComponent(
      `Venha fazer parte dos Embaixadores dos Legendarios! Use meu link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const isLoading = loadingEmb || loadingRefs;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("mi.title")}</h1>
          <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("mi.subtitle")}</p>
        </div>

        {/* Referral Link Card */}
        {referralLink && (
          <div className="apple-card p-5 animate-fade-up" style={{ animationDelay: "50ms" }}>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.02em] text-[#86868b] mb-3">
              {t("mi.seuLink")}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/[0.04] rounded-xl px-4 py-2.5 text-[0.8125rem] text-[#d2d2d7] font-mono truncate border border-white/[0.06]">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className={`apple-btn ${copied ? "apple-btn-filled" : "apple-btn-gray"} px-3 py-2.5 text-sm rounded-xl flex items-center gap-2 shrink-0`}
              >
                <Copy className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{copied ? t("mi.copiado") : t("mi.copiar")}</span>
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="apple-btn apple-btn-gray px-3 py-2.5 text-sm rounded-xl flex items-center gap-2 shrink-0"
                style={{ color: "#25D366" }}
              >
                <Share2 className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{t("mi.compartilhar")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard icon={UsersRound} value={stats.total} label={t("mi.total")} color="#FF6B00" delay={100} />
          <StatsCard icon={Clock} value={stats.pendentes} label={t("mi.pendentes")} color="#FF9F0A" delay={150} />
          <StatsCard icon={SearchIcon} value={stats.entrevistando} label={t("mi.entrevistando")} color="#0A84FF" delay={200} />
          <StatsCard icon={UserCheck} value={stats.aprovados} label={t("mi.aprovados")} color="#30D158" delay={250} />
        </div>

        {/* Referrals List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          </div>
        ) : !referrals?.length ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <UsersRound className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#86868b]">{t("mi.nenhum")}</p>
            <p className="text-[0.75rem] text-[#48484a] mt-1">{t("mi.nenhumDesc")}</p>
          </div>
        ) : (
          <div className="apple-card overflow-hidden animate-fade-up" style={{ animationDelay: "300ms" }}>
            <div className="divide-y divide-white/[0.04]">
              {referrals.map((ref: any) => {
                const sc = STATUS_COLORS[ref.status] || STATUS_COLORS.pendente;
                return (
                  <div key={ref.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-[0.75rem] font-bold shrink-0">
                      {ref.nomeCompleto?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.875rem] font-medium text-white truncate">{ref.nomeCompleto}</p>
                      <p className="text-[0.6875rem] text-[#6e6e73]">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="apple-badge text-[0.6875rem] font-medium px-2.5 py-1 shrink-0"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
