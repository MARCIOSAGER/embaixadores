import { useState, useMemo } from "react";
import { useEmbaixadores, useEmbaixadoresStats, useCreateEmbaixador, useUpdateEmbaixador, useDeleteEmbaixador } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, Users, UserCheck, Clock, UserX, ChevronRight, X, Mail, Phone, MapPin, Loader2 } from "lucide-react";

function formatDate(ts: number | null | undefined, locale: string) {
  if (!ts) return "—";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleDateString(loc);
}
function dateToTs(s: string): number | null { return s ? new Date(s + "T12:00:00").getTime() : null; }
function tsToDate(ts: number | null | undefined): string { return ts ? new Date(ts).toISOString().split("T")[0] : ""; }

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  ativo: { color: "#30D158", bg: "rgba(48,209,88,0.14)" },
  inativo: { color: "#FF453A", bg: "rgba(255,69,58,0.14)" },
  pendente_renovacao: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)" },
};

export default function Embaixadores() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    nomeCompleto: "", numeroLegendario: "", numeroEmbaixador: "",
    email: "", telefone: "", cidade: "", estado: "",
    profissao: "", empresa: "", dataNascimento: "", dataIngresso: "",
    dataRenovacao: "", status: "ativo" as string, observacoes: "",
  });

  const searchTerm = useMemo(() => search || undefined, [search]);
  const { data: embaixadores, isLoading } = useEmbaixadores(searchTerm);
  const { data: stats } = useEmbaixadoresStats();

  const createMut = useCreateEmbaixador();
  const updateMut = useUpdateEmbaixador();
  const deleteMut = useDeleteEmbaixador();

  function resetForm() {
    setForm({ nomeCompleto: "", numeroLegendario: "", numeroEmbaixador: "", email: "", telefone: "", cidade: "", estado: "", profissao: "", empresa: "", dataNascimento: "", dataIngresso: "", dataRenovacao: "", status: "ativo", observacoes: "" });
    setEditingId(null);
  }

  function openEdit(emb: any) {
    setEditingId(emb.id);
    setForm({
      nomeCompleto: emb.nomeCompleto || "", numeroLegendario: emb.numeroLegendario || "", numeroEmbaixador: emb.numeroEmbaixador || "",
      email: emb.email || "", telefone: emb.telefone || "", cidade: emb.cidade || "", estado: emb.estado || "",
      profissao: emb.profissao || "", empresa: emb.empresa || "",
      dataNascimento: tsToDate(emb.dataNascimento), dataIngresso: tsToDate(emb.dataIngresso),
      dataRenovacao: tsToDate(emb.dataRenovacao), status: emb.status || "ativo", observacoes: emb.observacoes || "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.nomeCompleto.trim()) return toast.error(t("emb.nomeObrigatorio"));
    const data = {
      nomeCompleto: form.nomeCompleto, numeroLegendario: form.numeroLegendario || null, numeroEmbaixador: form.numeroEmbaixador || null,
      email: form.email || null, telefone: form.telefone || null, cidade: form.cidade || null, estado: form.estado || null,
      profissao: form.profissao || null, empresa: form.empresa || null,
      dataNascimento: dateToTs(form.dataNascimento), dataIngresso: dateToTs(form.dataIngresso) || Date.now(),
      dataRenovacao: dateToTs(form.dataRenovacao), status: form.status as "ativo" | "inativo" | "pendente_renovacao",
      observacoes: form.observacoes || null,
    };
    const onSuccess = () => { toast.success(t("common.sucesso")); setDialogOpen(false); resetForm(); };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...data }, { onSuccess, onError });
    else createMut.mutate(data, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!embaixadores) return [];
    if (filter === "all") return embaixadores;
    return embaixadores.filter((e: any) => e.status === filter);
  }, [embaixadores, filter]);

  const filters = [
    { key: "all", label: t("common.todos") },
    { key: "ativo", label: t("emb.ativo") },
    { key: "pendente_renovacao", label: t("emb.pendRenov") },
    { key: "inativo", label: t("emb.inativo") },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("emb.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("emb.subtitle")}</p>
          </div>
          <button onClick={() => { resetForm(); setDialogOpen(true); }} className="apple-btn apple-btn-filled text-[0.8125rem] py-2 px-4">
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("emb.novo")}</span>
          </button>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { icon: Users, val: stats?.total || 0, label: t("emb.total"), color: "#FF6B00" },
            { icon: UserCheck, val: stats?.ativos || 0, label: t("emb.ativo"), color: "#30D158" },
            { icon: Clock, val: stats?.pendentes || 0, label: t("emb.pendRenov"), color: "#FF9F0A" },
            { icon: UserX, val: stats?.inativos || 0, label: t("emb.inativo"), color: "#FF453A" },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="apple-card p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} strokeWidth={1.5} />
              <p className="text-lg font-bold text-white">{val}</p>
              <p className="text-[0.625rem] text-[#6e6e73]">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
            <input placeholder={t("emb.buscar")} value={search} onChange={e => setSearch(e.target.value)} className="apple-input pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(f => (
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
              <Users className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("emb.nenhum")}</p>
          </div>
        ) : (
          <div className="apple-list animate-fade-up" style={{ animationDelay: "150ms" }}>
            {filtered.map((emb: any) => {
              const sc = STATUS_MAP[emb.status] || STATUS_MAP.ativo;
              return (
                <div key={emb.id} className="apple-list-item group" onClick={() => setSelected(emb)}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-[0.8125rem] font-bold shrink-0">
                    {emb.nomeCompleto?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.875rem] font-medium text-white truncate">{emb.nomeCompleto}</span>
                      <span className="apple-badge text-[0.6875rem]" style={{ background: sc.bg, color: sc.color }}>
                        {emb.status === "ativo" ? t("emb.ativo") : emb.status === "inativo" ? t("emb.inativo") : t("emb.pendRenov")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {emb.cidade && <span className="text-[0.6875rem] text-[#6e6e73] truncate">{emb.cidade}</span>}
                      {emb.numeroLegendario && <span className="text-[0.6875rem] text-[#FF9F0A]">L#{emb.numeroLegendario}</span>}
                      {emb.numeroEmbaixador && <span className="text-[0.6875rem] text-[#FF6B00]">E#{emb.numeroEmbaixador}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3a3a3c] group-hover:text-[#636366] shrink-0" strokeWidth={1.5} />
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Sheet */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center apple-sheet-backdrop" onClick={() => setSelected(null)}>
            <div className="apple-sheet-content w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[20px] lg:rounded-[20px] animate-fade-up" onClick={e => e.stopPropagation()}>
              <div className="apple-sheet-handle" />
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-xl font-bold">
                    {selected.nomeCompleto?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white tracking-[-0.02em]">{selected.nomeCompleto}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selected.numeroLegendario && <span className="apple-badge apple-badge-orange text-[0.625rem]">L#{selected.numeroLegendario}</span>}
                      {selected.numeroEmbaixador && <span className="apple-badge apple-badge-blue text-[0.625rem]">E#{selected.numeroEmbaixador}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b]">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="apple-card-inset p-4 space-y-3">
                  {selected.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.email}</span></div>}
                  {selected.telefone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.telefone}</span></div>}
                  {(selected.cidade || selected.estado) && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{[selected.cidade, selected.estado].filter(Boolean).join(", ")}</span></div>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: t("emb.nascimento"), val: formatDate(selected.dataNascimento, locale) },
                    { label: t("emb.ingresso"), val: formatDate(selected.dataIngresso, locale) },
                    { label: t("emb.renovacao"), val: formatDate(selected.dataRenovacao, locale) },
                  ].map(d => (
                    <div key={d.label} className="apple-card-inset p-3 text-center">
                      <p className="text-[0.6875rem] text-[#6e6e73] uppercase tracking-wider">{d.label}</p>
                      <p className="text-[0.8125rem] text-white font-medium mt-1">{d.val}</p>
                    </div>
                  ))}
                </div>

                {selected.observacoes && (
                  <div className="apple-card-inset p-4">
                    <p className="text-[0.6875rem] text-[#6e6e73] uppercase tracking-wider mb-2">{t("emb.observacoes")}</p>
                    <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed">{selected.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { openEdit(selected); setSelected(null); }} className="apple-btn apple-btn-tinted flex-1 py-2.5">
                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />{t("emb.editar")}
                  </button>
                  <button onClick={() => { if (confirm(t("common.confirmarExclusao"))) { deleteMut.mutate({ id: selected.id }, { onSuccess: () => { toast.success(t("common.sucesso")); setSelected(null); }, onError: (e: any) => toast.error(e.message) }); } }} className="apple-btn apple-btn-destructive flex-1 py-2.5">
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />{t("emb.excluir")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("emb.editar") : t("emb.novo")}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="apple-input-label">{t("emb.nome")} *</label>
                  <input value={form.nomeCompleto} onChange={e => setForm({ ...form, nomeCompleto: e.target.value })} className="apple-input" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("emb.numLegendario")}</label><input value={form.numeroLegendario} onChange={e => setForm({ ...form, numeroLegendario: e.target.value })} className="apple-input" placeholder="L#" /></div>
                  <div><label className="apple-input-label">{t("emb.numEmbaixador")}</label><input value={form.numeroEmbaixador} onChange={e => setForm({ ...form, numeroEmbaixador: e.target.value })} className="apple-input" placeholder="E#" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("emb.email")}</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="apple-input" /></div>
                  <div><label className="apple-input-label">{t("emb.telefone")}</label><input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="apple-input" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("emb.cidade")}</label><input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="apple-input" /></div>
                  <div><label className="apple-input-label">{t("emb.estado")}</label><input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="apple-input" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div><label className="apple-input-label">{t("emb.nascimento")}</label><input type="date" value={form.dataNascimento} onChange={e => setForm({ ...form, dataNascimento: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  <div><label className="apple-input-label">{t("emb.ingresso")}</label><input type="date" value={form.dataIngresso} onChange={e => setForm({ ...form, dataIngresso: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  <div><label className="apple-input-label">{t("emb.renovacao")}</label><input type="date" value={form.dataRenovacao} onChange={e => setForm({ ...form, dataRenovacao: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                </div>
                <div>
                  <label className="apple-input-label">{t("emb.status")}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="apple-input">
                    <option value="ativo">{t("emb.ativo")}</option>
                    <option value="inativo">{t("emb.inativo")}</option>
                    <option value="pendente_renovacao">{t("emb.pendRenov")}</option>
                  </select>
                </div>
                <div>
                  <label className="apple-input-label">{t("emb.observacoes")}</label>
                  <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} className="apple-input resize-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <DialogClose asChild>
                  <button className="apple-btn apple-btn-gray flex-1 py-2.5">{t("common.cancelar")}</button>
                </DialogClose>
                <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="apple-btn apple-btn-filled flex-1 py-2.5">
                  {(createMut.isPending || updateMut.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? t("common.salvar") : t("common.criar")}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
