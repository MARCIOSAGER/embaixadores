import { useState, useMemo } from "react";
import { usePagamentos, useCreatePagamento, useUpdatePagamento, useDeletePagamento, useEmbaixadores } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, DollarSign, Search, Loader2, Download, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";

function formatDate(ts: number | null | undefined, locale: string) {
  if (!ts) return "\u2014";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleDateString(loc, { day: "2-digit", month: "short", year: "numeric" });
}
function dateToTimestamp(d: string): number { return new Date(d).getTime(); }
function tsToInputDate(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

function formatCurrency(valor: string | number | null | undefined): string {
  const num = typeof valor === "string" ? parseFloat(valor) : (valor ?? 0);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_MAP: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  pendente: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)", icon: Clock },
  pago: { color: "#30D158", bg: "rgba(48,209,88,0.14)", icon: CheckCircle },
  atrasado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)", icon: AlertTriangle },
};

export default function Pagamentos() {
  const { t, locale } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ embaixadorId: "", valor: "", dataVencimento: "", dataPagamento: "", status: "pendente", observacoes: "" });

  const { data: pagamentos, isLoading } = usePagamentos();
  const { data: embaixadores } = useEmbaixadores();
  const createMut = useCreatePagamento();
  const updateMut = useUpdatePagamento();
  const deleteMut = useDeletePagamento();

  const embMap = useMemo(() => {
    const map: Record<number, string> = {};
    (embaixadores || []).forEach((e: any) => { map[e.id] = e.nomeCompleto; });
    return map;
  }, [embaixadores]);

  function resetForm() { setForm({ embaixadorId: "", valor: "", dataVencimento: "", dataPagamento: "", status: "pendente", observacoes: "" }); setEditingId(null); }
  function openEdit(pag: any) {
    setEditingId(pag.id);
    setForm({
      embaixadorId: String(pag.embaixadorId || ""),
      valor: pag.valor || "",
      dataVencimento: tsToInputDate(pag.dataVencimento),
      dataPagamento: tsToInputDate(pag.dataPagamento),
      status: pag.status || "pendente",
      observacoes: pag.observacoes || "",
    });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.embaixadorId || !form.valor || !form.dataVencimento) return toast.error(t("pag.camposObrigatorios"));
    const d = {
      embaixadorId: Number(form.embaixadorId),
      valor: form.valor,
      dataVencimento: dateToTimestamp(form.dataVencimento),
      dataPagamento: form.dataPagamento ? dateToTimestamp(form.dataPagamento) : null,
      status: form.status as any,
      observacoes: form.observacoes || null,
    };
    const onSuccess = () => { toast.success(t("common.sucesso")); setDialogOpen(false); resetForm(); };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...d }, { onSuccess, onError }); else createMut.mutate(d, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!pagamentos) return [];
    let list = pagamentos;
    if (filter !== "all") list = list.filter((p: any) => p.status === filter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p: any) => {
        const nome = embMap[p.embaixadorId] || "";
        return nome.toLowerCase().includes(s);
      });
    }
    return list;
  }, [pagamentos, filter, search, embMap]);

  // Stats
  const stats = useMemo(() => {
    const all = pagamentos || [];
    const sum = (status: string) => all.filter((p: any) => p.status === status).reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);
    return { pendente: sum("pendente"), pago: sum("pago"), atrasado: sum("atrasado") };
  }, [pagamentos]);

  function handleExport() {
    const statusPt: Record<string, string> = { pendente: "Pendente", pago: "Pago", atrasado: "Atrasado" };
    const data = filtered.map((p: any) => ({
      "Embaixador": embMap[p.embaixadorId] || `ID ${p.embaixadorId}`,
      "Valor": formatCurrency(p.valor),
      "Vencimento": p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString("pt-BR") : "",
      "Pagamento": p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "",
      "Status": statusPt[p.status] || p.status || "",
      "Observacoes": p.observacoes || "",
    }));
    exportToXlsx(data, `pagamentos-${new Date().toISOString().split("T")[0]}`);
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("pag.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("pag.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2 shrink-0"
              title="Exportar XLSX"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button onClick={() => { resetForm(); setDialogOpen(true); }} className="apple-btn apple-btn-filled text-[0.8125rem] py-2 px-4">
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">{t("pag.novo")}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { label: t("pag.totalPendente"), value: formatCurrency(String(stats.pendente)), color: "#FF9F0A", bg: "rgba(255,159,10,0.14)", icon: Clock },
            { label: t("pag.totalPago"), value: formatCurrency(String(stats.pago)), color: "#30D158", bg: "rgba(48,209,88,0.14)", icon: CheckCircle },
            { label: t("pag.totalAtrasado"), value: formatCurrency(String(stats.atrasado)), color: "#FF453A", bg: "rgba(255,69,58,0.14)", icon: AlertTriangle },
          ].map((stat) => (
            <div key={stat.label} className="apple-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[0.6875rem] text-[#86868b] uppercase tracking-wide">{stat.label}</p>
                  <p className="text-[1.125rem] font-bold text-white tracking-[-0.02em]">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="animate-fade-up" style={{ animationDelay: "75ms" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pag.buscar")}
              className="apple-input pl-10 w-full"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {[
            { key: "all", label: t("common.todos") },
            { key: "pendente", label: t("pag.pendentes") },
            { key: "pago", label: t("pag.pagos") },
            { key: "atrasado", label: t("pag.atrasados") },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 ${filter === f.key ? "apple-btn-filled" : "apple-btn-gray"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="apple-skeleton h-24 rounded-2xl" />)}</div>
        ) : !filtered.length ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("pag.nenhum")}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "150ms" }}>
            {filtered.map((pag: any) => {
              const sc = STATUS_MAP[pag.status] || STATUS_MAP.pendente;
              const StatusIcon = sc.icon;
              return (
                <div key={pag.id} className="apple-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: sc.bg }}>
                      <DollarSign className="w-5 h-5" style={{ color: sc.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[0.875rem] font-semibold text-white">{embMap[pag.embaixadorId] || `Embaixador #${pag.embaixadorId}`}</span>
                        <span className="apple-badge text-[0.6875rem]" style={{ background: sc.bg, color: sc.color }}>{t(`pag.${pag.status}`)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-[#6e6e73]">
                        <span className="text-white font-semibold text-[0.875rem]">{formatCurrency(pag.valor)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{t("pag.vencimento")}: {formatDate(pag.dataVencimento, locale)}</span>
                        {pag.dataPagamento && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" strokeWidth={1.5} />{t("pag.pagamentoEm")}: {formatDate(pag.dataPagamento, locale)}</span>}
                      </div>
                      {pag.observacoes && <p className="text-[0.75rem] text-[#48484a] mt-2 line-clamp-2">{pag.observacoes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                    <button onClick={() => openEdit(pag)} className="apple-btn apple-btn-tinted flex-1 py-2 text-[0.75rem]">
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />{t("emb.editar")}
                    </button>
                    <button onClick={() => { if (confirm(t("common.confirmarExclusao"))) deleteMut.mutate({ id: pag.id }, { onSuccess: () => toast.success(t("common.sucesso")), onError: (e: any) => toast.error(e.message) }); }} className="apple-btn apple-btn-destructive py-2 px-3 text-[0.75rem]">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("pag.editar") : t("pag.novo")}</h2>
              <div className="space-y-4">
                <div>
                  <label className="apple-input-label">{t("pag.embaixador")} *</label>
                  <select value={form.embaixadorId} onChange={e => setForm({ ...form, embaixadorId: e.target.value })} className="apple-input">
                    <option value="">{t("pag.selecioneEmbaixador")}</option>
                    {(embaixadores || []).map((e: any) => (
                      <option key={e.id} value={e.id}>{e.nomeCompleto}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="apple-input-label">{t("pag.valor")} * (R$)</label>
                    <input type="number" step="0.01" min="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className="apple-input" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="apple-input-label">{t("pag.statusLabel")}</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="apple-input">
                      <option value="pendente">{t("pag.pendente")}</option>
                      <option value="pago">{t("pag.pago")}</option>
                      <option value="atrasado">{t("pag.atrasado")}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("pag.dataVencimento")} *</label><input type="date" value={form.dataVencimento} onChange={e => setForm({ ...form, dataVencimento: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  <div><label className="apple-input-label">{t("pag.dataPagamento")}</label><input type="date" value={form.dataPagamento} onChange={e => setForm({ ...form, dataPagamento: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                </div>
                <div><label className="apple-input-label">{t("pag.observacoes")}</label><textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} className="apple-input resize-none" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><button className="apple-btn apple-btn-gray flex-1 py-2.5">{t("common.cancelar")}</button></DialogClose>
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
