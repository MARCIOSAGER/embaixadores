import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import { useDashboardStats } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Users, UserCheck, Clock, UserX, Gift, Package, PackageCheck, Cake, RefreshCw, Calendar, Church, PieChart as PieChartIcon, BarChart3, DollarSign, Trophy, UsersRound, Copy, Share2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, LineChart, Line } from "recharts";
import { toast } from "sonner";

function ProgressRing({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} className="apple-ring">
      <circle cx={size / 2} cy={size / 2} r={r} className="apple-ring-track" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} className="apple-ring-fill" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} />
    </svg>
  );
}

function MetricCard({ icon: Icon, label, value, subtitle, color, delay }: { icon: any; label: string; value: number; subtitle: string; color: string; delay: number }) {
  return (
    <div className="apple-card p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.02em] text-[#86868b]">{label}</p>
          <p className="text-[2rem] font-bold tracking-[-0.04em] text-white leading-none">{value}</p>
          <p className="text-[0.75rem] text-[#6e6e73]">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}14` }}>
          <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function KitRingCard({ label, value, total, color, delay }: { label: string; value: number; total: number; color: string; delay: number }) {
  return (
    <div className="apple-card p-5 flex items-center gap-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <ProgressRing value={value} max={Math.max(total, 1)} color={color} />
      <div>
        <p className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{value}</p>
        <p className="text-[0.75rem] text-[#86868b] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, delay }: { icon: any; title: string; children: React.ReactNode; delay: number }) {
  return (
    <div className="apple-card overflow-hidden animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.8} />
        </div>
        <h3 className="text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">{title}</h3>
      </div>
      <div className="apple-separator mx-5" />
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[0.8125rem] text-[#48484a]">{text}</p>
    </div>
  );
}

const CHART_COLORS = {
  ativos: "#30D158",
  pendentes: "#FF9F0A",
  inativos: "#FF453A",
  parciais: "#E85D00",
  completos: "#30D158",
};

function CustomTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1c1c1e] border border-white/[0.1] rounded-lg px-3 py-2 text-sm">
        <p className="text-white font-medium">{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="apple-skeleton h-8 w-48" />
        <div className="apple-skeleton h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="apple-skeleton h-32 rounded-[20px]" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="apple-skeleton h-28 rounded-[20px]" />)}
      </div>
    </div>
  );
}

function AmbassadorDashboard() {
  const { user: authUser, userName, session } = useAuth();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const name = userName || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "User";
  const firstName = name.split(" ")[0] || "";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dash.bomDia") : hour < 18 ? t("dash.boaTarde") : t("dash.boaNoite");

  // Find ambassador linked to this auth user
  const { data: myEmbaixador } = useQuery({
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
  const { data: referrals } = useQuery({
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

  // Upcoming events & meetings
  const { data: upcomingEvents } = useQuery({
    queryKey: ["ambassador-upcoming-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("eventos")
        .select("*")
        .gte("data", Date.now())
        .eq("status", "agendado")
        .order("data")
        .limit(3);
      return (data || []) as any[];
    },
  });

  const { data: upcomingMeetings } = useQuery({
    queryKey: ["ambassador-upcoming-meetings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tercaGloria")
        .select("*")
        .gte("data", Date.now())
        .eq("status", "planejada")
        .order("data")
        .limit(3);
      return (data || []) as any[];
    },
  });

  const referralLink = myEmbaixador?.codigoIndicacao
    ? `${window.location.origin}/inscricao?ref=${myEmbaixador.codigoIndicacao}`
    : "";

  const stats = {
    total: referrals?.length || 0,
    pendentes: referrals?.filter((r: any) => r.status === "pendente").length || 0,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Greeting */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-lg font-bold">
              {firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-white">
                {greeting}, {firstName}
              </h1>
              <p className="text-[0.875rem] text-[#86868b] tracking-[-0.01em]">{t("adash.welcome")}</p>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        {referralLink && (
          <div className="apple-card p-5 animate-fade-up" style={{ animationDelay: "50ms" }}>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.02em] text-[#86868b] mb-3">
              {t("adash.seuLink")}
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
        <div className="grid grid-cols-3 gap-3">
          <StatsCard icon={UsersRound} value={stats.total} label={t("mi.total")} color="#FF6B00" delay={100} />
          <StatsCard icon={Clock} value={stats.pendentes} label={t("mi.pendentes")} color="#FF9F0A" delay={150} />
          <StatsCard icon={UserCheck} value={stats.aprovados} label={t("mi.aprovados")} color="#30D158" delay={200} />
        </div>

        {/* Upcoming sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SectionCard icon={Calendar} title={t("adash.proxEventos")} delay={250}>
            {!upcomingEvents?.length ? (
              <EmptyState text={t("adash.nenhumEvento")} />
            ) : (
              <div className="space-y-0">
                {upcomingEvents.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-8 h-8 rounded-xl bg-[#BF5AF2]/10 flex items-center justify-center text-[#BF5AF2] text-[0.6875rem] font-bold">
                      {new Date(e.data).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] font-medium text-white truncate">{e.titulo}</p>
                      <p className="text-[0.6875rem] text-[#6e6e73]">{new Date(e.data).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Church} title={t("adash.proxReunioes")} delay={300}>
            {!upcomingMeetings?.length ? (
              <EmptyState text={t("adash.nenhumReuniao")} />
            ) : (
              <div className="space-y-0">
                {upcomingMeetings.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-8 h-8 rounded-xl bg-[#64D2FF]/10 flex items-center justify-center text-[#64D2FF] text-[0.6875rem] font-bold">
                      {new Date(r.data).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] font-medium text-white truncate">{r.tema}</p>
                      <p className="text-[0.6875rem] text-[#6e6e73]">{new Date(r.data).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function Home() {
  const { user: authUser, userName, role } = useAuth();
  const user = { name: userName || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "User" };
  const { t } = useI18n();
  const { data, isLoading } = useDashboardStats();

  // Non-admin users see the personalized ambassador dashboard
  if (role !== "admin") return <AmbassadorDashboard />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dash.bomDia") : hour < 18 ? t("dash.boaTarde") : t("dash.boaNoite");
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <DashboardLayout>
      {isLoading || !data ? <Skeleton /> : (
        <div className="space-y-6">
          {/* Hero Greeting */}
          <div className="animate-fade-up">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-lg font-bold">
                {firstName.charAt(0)}
              </div>
              <div>
                <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-white">
                  {greeting}, {firstName}
                </h1>
                <p className="text-[0.875rem] text-[#86868b] tracking-[-0.01em]">{t("dash.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard icon={Users} label={t("dash.totalEmb")} value={data.embaixadores.total} subtitle={t("dash.cadastrados")} color="#FF6B00" delay={50} />
            <MetricCard icon={UserCheck} label={t("dash.ativos")} value={data.embaixadores.ativos} subtitle={t("dash.emAtividade")} color="#30D158" delay={100} />
            <MetricCard icon={Clock} label={t("dash.pendentes")} value={data.embaixadores.pendentes} subtitle={t("dash.aguardandoRenov")} color="#FF9F0A" delay={150} />
            <MetricCard icon={UserX} label={t("dash.inativos")} value={data.embaixadores.inativos} subtitle={t("dash.semAtividade")} color="#FF453A" delay={200} />
          </div>

          {/* Kit Rings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <KitRingCard label={t("dash.kitsPendentes")} value={data.kitsStats.pendentes} total={data.embaixadores.total} color="#FF9F0A" delay={250} />
            <KitRingCard label={t("dash.kitsParciais")} value={data.kitsStats.parciais} total={data.embaixadores.total} color="#E85D00" delay={300} />
            <KitRingCard label={t("dash.kitsCompletos")} value={data.kitsStats.completos} total={data.embaixadores.total} color="#30D158" delay={350} />
          </div>

          {/* Row 2: Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Conversion Funnel */}
            <div className="lg:col-span-3 apple-card overflow-hidden animate-fade-up" style={{ animationDelay: "260ms" }}>
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">{t("dash.funil")}</h3>
              </div>
              <div className="apple-separator mx-5" />
              <div className="p-5">
                {data.funnel.total === 0 ? (
                  <EmptyState text={t("dash.semDados")} />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: t("dash.totalInsc"), value: data.funnel.total, fill: "#FF6B00" },
                        { name: t("dash.entrevistando"), value: data.funnel.entrevistando, fill: "#5AC8FA" },
                        { name: t("dash.aprovados"), value: data.funnel.aprovados, fill: "#30D158" },
                        { name: t("dash.embaixadoresAtivos"), value: data.funnel.embaixadores, fill: "#FFD60A" },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fill: "#6e6e73", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#86868b", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} label={{ position: "right", fill: "#fff", fontSize: 12, fontWeight: 600 }}>
                        {["#FF6B00", "#5AC8FA", "#30D158", "#FFD60A"].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Top Referrers + Payment Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Top Referrers */}
            <div className="lg:col-span-2 apple-card overflow-hidden animate-fade-up" style={{ animationDelay: "360ms" }}>
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFD60A]/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-[#FFD60A]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">{t("dash.topIndicadores")}</h3>
              </div>
              <div className="apple-separator mx-5" />
              <div className="p-5">
                {data.topReferrers.length === 0 ? (
                  <EmptyState text={t("dash.semDados")} />
                ) : (
                  <div className="space-y-0">
                    {data.topReferrers.map((ref: any, idx: number) => {
                      const posColors = ["#FFD60A", "#C0C0C0", "#CD7F32", "#6e6e73", "#6e6e73"];
                      return (
                        <div key={ref.name} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold"
                            style={{ background: `${posColors[idx]}20`, color: posColors[idx] }}
                          >
                            {idx + 1}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] text-[0.6875rem] font-bold">
                            {ref.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.8125rem] font-medium text-white truncate">{ref.name}</p>
                            <p className="text-[0.6875rem] text-[#6e6e73]">{ref.count} {t("dash.indicacoes")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Revenue */}
            <div className="lg:col-span-3 apple-card overflow-hidden animate-fade-up" style={{ animationDelay: "410ms" }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#30D158]/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-[#30D158]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">{t("dash.receita")}</h3>
                    <p className="text-[0.6875rem] text-[#6e6e73]">{t("dash.ultimos6")}</p>
                  </div>
                </div>
                <p className="text-[1.25rem] font-bold text-[#30D158] tracking-[-0.02em]">
                  R$ {data.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="apple-separator mx-5" />
              <div className="p-5">
                {data.monthlyRevenue.every((m: any) => m.total === 0) ? (
                  <EmptyState text={t("dash.semDados")} />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.monthlyRevenue}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#30D158" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#6e6e73" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6e6e73" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]}
                      />
                      <Area type="monotone" dataKey="total" stroke="#30D158" fill="url(#colorRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SectionCard icon={Cake} title={t("dash.proxAniversarios")} delay={400}>
              {data.proximosAniversarios.length === 0 ? <EmptyState text={t("dash.nenhumAniv")} /> : (
                <div className="space-y-0">
                  {data.proximosAniversarios.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-8 h-8 rounded-full bg-[#FF9F0A]/10 flex items-center justify-center text-[#FF9F0A] text-[0.6875rem] font-bold">
                        {e.nomeCompleto?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] font-medium text-white truncate">{e.nomeCompleto}</p>
                        <p className="text-[0.6875rem] text-[#6e6e73]">{e.dataNascimento ? new Date(e.dataNascimento).toLocaleDateString() : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={RefreshCw} title={t("dash.renovPendentes")} delay={450}>
              {data.renovacoesPendentes.length === 0 ? <EmptyState text={t("dash.nenhumRenov")} /> : (
                <div className="space-y-0">
                  {data.renovacoesPendentes.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-8 h-8 rounded-full bg-[#FF453A]/10 flex items-center justify-center text-[#FF453A] text-[0.6875rem] font-bold">
                        {e.nomeCompleto?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] font-medium text-white truncate">{e.nomeCompleto}</p>
                        <p className="text-[0.6875rem] text-[#6e6e73]">{e.dataRenovacao ? new Date(e.dataRenovacao).toLocaleDateString() : t("dash.pendente")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Calendar} title={t("dash.proxEventos")} delay={500}>
              {data.proximosEventos.length === 0 ? <EmptyState text={t("dash.nenhumEvento")} /> : (
                <div className="space-y-0">
                  {data.proximosEventos.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-[#BF5AF2]/10 flex items-center justify-center text-[#BF5AF2] text-[0.6875rem] font-bold">
                        {new Date(e.data).getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] font-medium text-white truncate">{e.titulo}</p>
                        <p className="text-[0.6875rem] text-[#6e6e73]">{new Date(e.data).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Church} title={t("dash.proxReunioes")} delay={550}>
              {data.proximasReunioes.length === 0 ? <EmptyState text={t("dash.nenhumReuniao")} /> : (
                <div className="space-y-0">
                  {data.proximasReunioes.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-[#64D2FF]/10 flex items-center justify-center text-[#64D2FF] text-[0.6875rem] font-bold">
                        {new Date(r.data).getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] font-medium text-white truncate">{r.tema}</p>
                        <p className="text-[0.6875rem] text-[#6e6e73]">{new Date(r.data).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Donut Chart - Embaixadores por Status */}
            <div className="apple-card overflow-hidden animate-fade-up" style={{ animationDelay: "600ms" }}>
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">
                  {t("dash.embPorStatus") || "Embaixadores por Status"}
                </h3>
              </div>
              <div className="apple-separator mx-5" />
              <div className="p-5">
                {(data.embaixadores.ativos + data.embaixadores.pendentes + data.embaixadores.inativos) === 0 ? (
                  <EmptyState text={t("dash.semDados") || "Sem dados para exibir"} />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t("dash.ativos") || "Ativos", value: data.embaixadores.ativos },
                          { name: t("dash.pendentes") || "Pendentes", value: data.embaixadores.pendentes },
                          { name: t("dash.inativos") || "Inativos", value: data.embaixadores.inativos },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                      >
                        <Cell fill={CHART_COLORS.ativos} />
                        <Cell fill={CHART_COLORS.pendentes} />
                        <Cell fill={CHART_COLORS.inativos} />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => <span className="text-[0.75rem] text-[#86868b]">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bar Chart - Status dos Kits */}
            <div className="apple-card overflow-hidden animate-fade-up" style={{ animationDelay: "650ms" }}>
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">
                  {t("dash.statusKits") || "Status dos Kits"}
                </h3>
              </div>
              <div className="apple-separator mx-5" />
              <div className="p-5">
                {(data.kitsStats.pendentes + data.kitsStats.parciais + data.kitsStats.completos) === 0 ? (
                  <EmptyState text={t("dash.semDados") || "Sem dados para exibir"} />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[
                        { name: t("dash.pendentes") || "Pendentes", value: data.kitsStats.pendentes, fill: CHART_COLORS.pendentes },
                        { name: t("dash.parciais") || "Parciais", value: data.kitsStats.parciais, fill: CHART_COLORS.parciais },
                        { name: t("dash.completos") || "Completos", value: data.kitsStats.completos, fill: CHART_COLORS.completos },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fill: "#86868b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#86868b", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {[CHART_COLORS.pendentes, CHART_COLORS.parciais, CHART_COLORS.completos].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
