import { useState, useMemo } from "react";
import { useWelcomeKits, useUpdateWelcomeKit, useCreateWelcomeKit, useEmbaixadores, useAddKitHistory, useKitHistory } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { exportKitsPdf } from "@/lib/exportPdf";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Gift, Package, PackageCheck, Check, X, Search, ChevronRight, Plus, Loader2, FileDown, Clock, RefreshCw, Cake } from "lucide-react";

type KitItemKey = "patchEntregue" | "pinBoneEntregue" | "anelEntregue" | "espadaEntregue" | "mochilaBalacEntregue";
const KIT_KEYS: KitItemKey[] = ["patchEntregue", "pinBoneEntregue", "anelEntregue", "espadaEntregue", "mochilaBalacEntregue"];

type KitType = "welcome" | "renovacao" | "aniversario";
const KIT_TYPE_COLORS: Record<KitType, string> = { welcome: "#FF6B00", renovacao: "#5E5CE6", aniversario: "#FF375F" };
const KIT_TYPE_ICONS: Record<KitType, typeof Gift> = { welcome: Gift, renovacao: RefreshCw, aniversario: Cake };

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
  const [selectedType, setSelectedType] = useState<KitType>("welcome");
  const [typeFilter, setTypeFilter] = useState<KitType | "all">("all");

  const { userName, user: authUser } = useAuth();
  const currentUserName = userName || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "Sistema";

  const { data: kits, isLoading } = useWelcomeKits();
  const { data: embaixadores } = useEmbaixadores();

  const updateMut = useUpdateWelcomeKit();
  const createMut = useCreateWelcomeKit();
  const addHistoryMut = useAddKitHistory();
  const { data: kitHistory, isLoading: historyLoading } = useKitHistory(selectedKit?.id ?? null);

  // Embaixadores that don't have a kit of the selected type yet
  const availableEmb = useMemo(() => {
    if (!embaixadores || !kits) return [];
    const kitEmbIds = new Set(kits.filter((k: any) => (k.tipo || "welcome") === selectedType).map((k: any) => k.embaixadorId));
    return embaixadores.filter((e: any) => !kitEmbIds.has(e.id));
  }, [embaixadores, kits, selectedType]);

  const handleCreateKit = () => {
    if (!selectedEmbId) return;
    createMut.mutate({ embaixadorId: Number(selectedEmbId), tipo: selectedType }, {
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
    const newValue = !kit[key];
    updateMut.mutate(payload, {
      onSuccess: () => {
        toast.success(t("common.sucesso"));
        // Record history (fire-and-forget, don't block on errors since table may not exist yet)
        addHistoryMut.mutate({
          kitId: kit.id,
          item: kitLabel(key, t),
          action: newValue ? "entregue" : "removido",
          userName: currentUserName,
        });
      },
      onError: (e: any) => toast.error(e.message),
    });
  }

  function getKitProgress(kit: any): number {
    return KIT_KEYS.filter(k => kit[k]).length;
  }

  const filtered = useMemo(() => {
    if (!kits) return [];
    let list = kits;
    if (typeFilter !== "all") list = list.filter((k: any) => (k.tipo || "welcome") === typeFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((k: any) => getEmbName(k.embaixadorId).toLowerCase().includes(s));
    }
    if (filter === "pendente") list = list.filter((k: any) => getKitProgress(k) === 0);
    else if (filter === "parcial") list = list.filter((k: any) => { const p = getKitProgress(k); return p > 0 && p < 5; });
    else if (filter === "completo") list = list.filter((k: any) => getKitProgress(k) === 5);
    return list;
  }, [kits, search, filter, typeFilter, embaixadores]);

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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (filtered && filtered.length > 0) {
                  exportKitsPdf(filtered, getEmbName);
                } else {
                  toast.error("Nenhum kit para exportar");
                }
              }}
              className="apple-btn apple-btn-gray px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="apple-btn apple-btn-filled px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Kit</span>
            </button>
          </div>
        </div>

        {/* Create Kit Form */}
        {showCreate && (
          <div className="apple-card p-5 space-y-4 animate-fade-up">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#FF6B00]" />
              {t("kit.criarKit")}
            </h3>
            {/* Kit type selector */}
            <div className="flex gap-2">
              {(["welcome", "renovacao", "aniversario"] as KitType[]).map(tipo => {
                const Icon = KIT_TYPE_ICONS[tipo];
                return (
                  <button
                    key={tipo}
                    onClick={() => setSelectedType(tipo)}
                    className={`apple-btn text-[0.75rem] py-1.5 px-3.5 flex items-center gap-1.5 ${selectedType === tipo ? "apple-btn-filled" : "apple-btn-gray"}`}
                    style={selectedType === tipo ? { background: KIT_TYPE_COLORS[tipo] } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t(`kit.tipo.${tipo}`)}
                  </button>
                );
              })}
            </div>
            {availableEmb.length === 0 ? (
              <p className="text-sm text-[#86868b]">{t("kit.todosJaTemKit")}</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedEmbId}
                  onChange={(e) => setSelectedEmbId(e.target.value ? Number(e.target.value) : "")}
                  className="apple-input flex-1 px-4 py-2.5 text-sm [&>option]:bg-[#1c1c1e] [&>option]:text-white"
                >
                  <option value="">{t("kit.selecioneEmb")}</option>
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
                  {t("kit.criarKit")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "50ms" }}>
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
          {/* Kit type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setTypeFilter("all")} className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 ${typeFilter === "all" ? "apple-btn-filled" : "apple-btn-gray"}`}>
              {t("common.todos")}
            </button>
            {(["welcome", "renovacao", "aniversario"] as KitType[]).map(tipo => {
              const Icon = KIT_TYPE_ICONS[tipo];
              return (
                <button
                  key={tipo}
                  onClick={() => setTypeFilter(tipo)}
                  className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 flex items-center gap-1.5 ${typeFilter === tipo ? "apple-btn-filled" : "apple-btn-gray"}`}
                  style={typeFilter === tipo ? { background: KIT_TYPE_COLORS[tipo] } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`kit.tipo.${tipo}`)}
                </button>
              );
            })}
          </div>

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
                    <div className="flex items-center gap-2">
                      <p className="text-[0.875rem] font-medium text-white truncate">{name}</p>
                      {(() => { const tipo = (kit.tipo || "welcome") as KitType; return tipo !== "welcome" ? (
                        <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${KIT_TYPE_COLORS[tipo]}20`, color: KIT_TYPE_COLORS[tipo] }}>
                          {t(`kit.tipo.${tipo}`)}
                        </span>
                      ) : null; })()}
                    </div>
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
                      <p className="text-[0.75rem] text-[#6e6e73]">
                        <span style={{ color: KIT_TYPE_COLORS[(selectedKit.tipo || "welcome") as KitType] }}>{t(`kit.tipo.${selectedKit.tipo || "welcome"}`)}</span>
                        {" · "}{getKitProgress(selectedKit)}/5 {t("kit.itensEntregues")}
                      </p>
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

                {/* Historico */}
                <div className="space-y-3">
                  <h3 className="text-[0.8125rem] font-semibold text-[#86868b] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Historico
                  </h3>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-[#48484a]" />
                    </div>
                  ) : !kitHistory || kitHistory.length === 0 ? (
                    <p className="text-[0.75rem] text-[#48484a] py-2">Nenhum historico</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {kitHistory.map((entry: any) => (
                        <div key={entry.id} className="flex items-start gap-2 text-[0.75rem]">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${entry.action === "entregue" ? "bg-[#30D158]" : "bg-[#FF453A]"}`} />
                          <div className="min-w-0">
                            <p className="text-white/80">
                              <span className="font-medium text-white">{entry.userName}</span>
                              {" "}marcou{" "}
                              <span className="font-medium text-white">{entry.item}</span>
                              {" "}como{" "}
                              <span className={entry.action === "entregue" ? "text-[#30D158]" : "text-[#FF453A]"}>
                                {entry.action}
                              </span>
                            </p>
                            <p className="text-[#48484a] text-[0.6875rem]">
                              {new Date(entry.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
