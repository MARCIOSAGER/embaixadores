import { useState, useMemo } from "react";
import { useWelcomeKits, useUpdateWelcomeKit, useCreateWelcomeKit, useEmbaixadores } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Gift, Package, PackageCheck, Check, X, Search, ChevronRight, Plus, Loader2 } from "lucide-react";

type KitItemKey = "patchEntregue" | "pinBoneEntregue" | "anelEntregue" | "espadaEntregue" | "mochilaBalacEntregue";
const KIT_KEYS: KitItemKey[] = ["patchEntregue", "pinBoneEntregue", "anelEntregue", "espadaEntregue", "mochilaBalacEntregue"];

function kitLabel(key: KitItemKey, t: (k: string) => string): string {
  const map: Record<KitItemKey, string> = { patchEntregue: t("kit.patch"), pinBoneEntregue: t("kit.pin"), anelEntregue: t("kit.anel"), espadaEntregue: t("kit.espada"), mochilaBalacEntregue: t("kit.mochila") };
  return map[key];
}

const KIT_ICONS: Record<KitItemKey, string> = {
  patchEntregue: "🏔", pinBoneEntregue: "📌", anelEntregue: "💍", espadaEntregue: "⚔️", mochilaBalacEntregue: "🎒",
};

export default function WelcomeKit() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedKit, setSelectedKit] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEmbId, setSelectedEmbId] = useState<number | "">("");

  const { data: kits, isLoading } = useWelcomeKits();
  const { data: embaixadores } = useEmbaixadores();

  const updateMut = useUpdateWelcomeKit();
  const createMut = useCreateWelcomeKit();

  // Embaixadores that don't have a kit yet
  const availableEmb = useMemo(() => {
    if (!embaixadores || !kits) return [];
    const kitEmbIds = new Set(kits.map((k: any) => k.embaixadorId));
    return embaixadores.filter((e: any) => !kitEmbIds.has(e.id));
  }, [embaixadores, kits]);

  const handleCreateKit = () => {
    if (!selectedEmbId) return;
    createMut.mutate({ embaixadorId: Number(selectedEmbId) }, {
      onSuccess: () => {
        toast.success("Kit criado com sucesso!");
        setShowCreate(false);
        setSelectedEmbId("");
      },
      onError: (e: any) => toast.error(e.message),
    });
  };

  function getEmbName(embId: number) {
    return embaixadores?.find((e: any) => e.id === embId)?.nomeCompleto || `#${embId}`;
  }

  function toggleItem(kit: any, key: KitItemKey) {
    const payload: any = { id: kit.id };
    KIT_KEYS.forEach(k => { payload[k] = k === key ? !kit[k] : kit[k]; });
    updateMut.mutate(payload, { onSuccess: () => toast.success(t("common.sucesso")), onError: (e: any) => toast.error(e.message) });
  }

  function getKitProgress(kit: any): number {
    return KIT_KEYS.filter(k => kit[k]).length;
  }

  const filtered = useMemo(() => {
    if (!kits) return [];
    let list = kits;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((k: any) => getEmbName(k.embaixadorId).toLowerCase().includes(s));
    }
    if (filter === "pendente") list = list.filter((k: any) => getKitProgress(k) === 0);
    else if (filter === "parcial") list = list.filter((k: any) => { const p = getKitProgress(k); return p > 0 && p < 5; });
    else if (filter === "completo") list = list.filter((k: any) => getKitProgress(k) === 5);
    return list;
  }, [kits, search, filter, embaixadores]);

  const stats = useMemo(() => {
    if (!kits) return { total: 0, pendente: 0, parcial: 0, completo: 0 };
    const total = kits.length;
    const completo = kits.filter((k: any) => getKitProgress(k) === 5).length;
    const pendente = kits.filter((k: any) => getKitProgress(k) === 0).length;
    return { total, pendente, parcial: total - completo - pendente, completo };
  }, [kits]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("kit.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("kit.subtitle")}</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="apple-btn apple-btn-filled px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Kit</span>
          </button>
        </div>

        {/* Create Kit Form */}
        {showCreate && (
          <div className="apple-card p-5 space-y-4 animate-fade-up">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#FF6B00]" />
              Criar Kit para Embaixador
            </h3>
            {availableEmb.length === 0 ? (
              <p className="text-sm text-[#86868b]">Todos os embaixadores já possuem kit.</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedEmbId}
                  onChange={(e) => setSelectedEmbId(e.target.value ? Number(e.target.value) : "")}
                  className="apple-input flex-1 px-4 py-2.5 text-sm"
                >
                  <option value="">Selecione o embaixador...</option>
                  {availableEmb.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.nomeCompleto}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreateKit}
                  disabled={!selectedEmbId || createMut.isPending}
                  className="apple-btn apple-btn-filled px-5 py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar Kit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { label: t("kit.pendentes"), val: stats.pendente, color: "#FF9F0A", icon: Package },
            { label: t("kit.parciais"), val: stats.parcial, color: "#E85D00", icon: Gift },
            { label: t("kit.completos"), val: stats.completo, color: "#30D158", icon: PackageCheck },
          ].map(({ label, val, color, icon: Icon }) => (
            <div key={label} className="apple-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}14` }}>
                <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[1.25rem] font-bold text-white">{val}</p>
                <p className="text-[0.6875rem] text-[#6e6e73]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
            <input placeholder={t("kit.buscar")} value={search} onChange={e => setSearch(e.target.value)} className="apple-input pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all", label: t("common.todos") },
              { key: "pendente", label: t("kit.pendentes") },
              { key: "parcial", label: t("kit.parciais") },
              { key: "completo", label: t("kit.completos") },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 ${filter === f.key ? "apple-btn-filled" : "apple-btn-gray"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="apple-skeleton h-[72px] rounded-2xl" />)}</div>
        ) : !filtered.length ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("kit.nenhum")}</p>
          </div>
        ) : (
          <div className="apple-list animate-fade-up" style={{ animationDelay: "150ms" }}>
            {filtered.map((kit: any) => {
              const progress = getKitProgress(kit);
              const pct = (progress / 5) * 100;
              const name = getEmbName(kit.embaixadorId);
              const color = progress === 5 ? "#30D158" : progress === 0 ? "#FF9F0A" : "#FF6B00";
              return (
                <div key={kit.id} className="apple-list-item group" onClick={() => setSelectedKit(kit)}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-[0.8125rem] font-bold shrink-0">
                    {name.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.875rem] font-medium text-white truncate">{name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[0.6875rem] font-medium shrink-0" style={{ color }}>{progress}/5</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3a3a3c] group-hover:text-[#636366] shrink-0" strokeWidth={1.5} />
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Sheet */}
        {selectedKit && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center apple-sheet-backdrop" onClick={() => setSelectedKit(null)}>
            <div className="apple-sheet-content w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[20px] lg:rounded-[20px] animate-fade-up" onClick={e => e.stopPropagation()}>
              <div className="apple-sheet-handle" />
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-lg font-bold">
                      {getEmbName(selectedKit.embaixadorId).charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{getEmbName(selectedKit.embaixadorId)}</h2>
                      <p className="text-[0.75rem] text-[#6e6e73]">{getKitProgress(selectedKit)}/5 {t("kit.itensEntregues")}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedKit(null)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b]">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Progress */}
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${(getKitProgress(selectedKit) / 5) * 100}%`,
                    background: getKitProgress(selectedKit) === 5 ? "#30D158" : "#FF6B00",
                  }} />
                </div>

                {/* Items */}
                <div className="apple-list">
                  {KIT_KEYS.map(key => {
                    const delivered = selectedKit[key];
                    return (
                      <div
                        key={key}
                        className="apple-list-item cursor-pointer"
                        onClick={() => {
                          toggleItem(selectedKit, key);
                          setSelectedKit({ ...selectedKit, [key]: !selectedKit[key] });
                        }}
                      >
                        <span className="text-xl">{KIT_ICONS[key]}</span>
                        <span className="flex-1 text-[0.875rem] font-medium text-white">{kitLabel(key, t)}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          delivered ? "bg-[#30D158]" : "bg-white/[0.06] border border-white/[0.10]"
                        }`}>
                          {delivered && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
