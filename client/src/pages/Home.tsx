import DashboardLayout from "@/components/DashboardLayout";
import { useDashboardStats } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Users, UserCheck, Clock, UserX, Gift, Package, PackageCheck, Cake, RefreshCw, Calendar, Church } from "lucide-react";

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

export default function Home() {
  const { user: authUser, userName } = useAuth();
  const user = { name: userName || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "User" };
  const { t } = useI18n();
  const { data, isLoading } = useDashboardStats();

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
        </div>
      )}
    </DashboardLayout>
  );
}
