import { useState, useMemo } from "react";
import { useEventos, useCreateEvento, useUpdateEvento, useDeleteEvento } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, Video, Repeat, ExternalLink, Loader2 } from "lucide-react";

function formatDateTime(ts: number | null | undefined, locale: string) {
  if (!ts) return "—";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleString(loc, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function dateToTimestamp(d: string): number { return new Date(d).getTime(); }
function tsToInputDT(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  agendado: { color: "#FF6B00", bg: "rgba(255,107,0,0.14)" },
  realizado: { color: "#30D158", bg: "rgba(48,209,88,0.14)" },
  cancelado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)" },
};

const TYPE_COLORS: Record<string, string> = {
  encontro: "#E85D00", conferencia: "#BF5AF2", retiro: "#32D74B", treinamento: "#FF9F0A", outro: "#64D2FF",
};

export default function Eventos() {
  const { t, locale } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ titulo: "", descricao: "", data: "", dataFim: "", local: "", tipo: "encontro", linkMeet: "", recorrente: false, status: "agendado" });

  const { data: eventos, isLoading } = useEventos();
  const createMut = useCreateEvento();
  const updateMut = useUpdateEvento();
  const deleteMut = useDeleteEvento();

  function resetForm() { setForm({ titulo: "", descricao: "", data: "", dataFim: "", local: "", tipo: "encontro", linkMeet: "", recorrente: false, status: "agendado" }); setEditingId(null); }
  function openEdit(ev: any) {
    setEditingId(ev.id);
    setForm({ titulo: ev.titulo || "", descricao: ev.descricao || "", data: tsToInputDT(ev.data), dataFim: tsToInputDT(ev.dataFim), local: ev.local || "", tipo: ev.tipo || "encontro", linkMeet: ev.linkMeet || "", recorrente: ev.recorrente || false, status: ev.status || "agendado" });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.titulo.trim() || !form.data) return toast.error(t("ev.tituloObrigatorio"));
    const d = { titulo: form.titulo, descricao: form.descricao || null, data: dateToTimestamp(form.data), dataFim: form.dataFim ? dateToTimestamp(form.dataFim) : null, local: form.local || null, tipo: form.tipo as any, linkMeet: form.linkMeet || null, recorrente: form.recorrente, status: form.status as any };
    const onSuccess = () => { toast.success(t("common.sucesso")); setDialogOpen(false); resetForm(); };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...d }, { onSuccess, onError }); else createMut.mutate(d, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!eventos) return [];
    if (filter === "all") return eventos;
    return eventos.filter((e: any) => e.status === filter);
  }, [eventos, filter]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("ev.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("ev.subtitle")}</p>
          </div>
          <button onClick={() => { resetForm(); setDialogOpen(true); }} className="apple-btn apple-btn-filled text-[0.8125rem] py-2 px-4">
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("ev.novo")}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { key: "all", label: t("common.todos") },
            { key: "agendado", label: t("ev.agendado") },
            { key: "realizado", label: t("ev.realizado") },
            { key: "cancelado", label: t("ev.cancelado") },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 ${filter === f.key ? "apple-btn-filled" : "apple-btn-gray"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="apple-skeleton h-28 rounded-2xl" />)}</div>
        ) : !filtered.length ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("ev.nenhum")}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {filtered.map((ev: any) => {
              const sc = STATUS_MAP[ev.status] || STATUS_MAP.agendado;
              const typeColor = TYPE_COLORS[ev.tipo] || "#64D2FF";
              return (
                <div key={ev.id} className="apple-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${typeColor}14` }}>
                      <Calendar className="w-5 h-5" style={{ color: typeColor }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[0.875rem] font-semibold text-white">{ev.titulo}</span>
                        <span className="apple-badge text-[0.5625rem]" style={{ background: sc.bg, color: sc.color }}>{t(`ev.${ev.status}`)}</span>
                        <span className="apple-badge text-[0.5625rem]" style={{ background: `${typeColor}14`, color: typeColor }}>{t(`ev.${ev.tipo}`)}</span>
                        {ev.recorrente && <span className="apple-badge apple-badge-indigo text-[0.5625rem] flex items-center gap-1"><Repeat className="w-3 h-3" />{t("ev.recorrente")}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-[#6e6e73]">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{formatDateTime(ev.data, locale)}</span>
                        {ev.dataFim && <span>— {formatDateTime(ev.dataFim, locale)}</span>}
                        {ev.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{ev.local}</span>}
                      </div>
                      {ev.descricao && <p className="text-[0.75rem] text-[#48484a] mt-2 line-clamp-2">{ev.descricao}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                    {ev.linkMeet && (
                      <a href={ev.linkMeet} target="_blank" rel="noopener" className="apple-btn apple-btn-gray flex-1 py-2 text-[0.75rem]">
                        <Video className="w-3.5 h-3.5" strokeWidth={1.5} />Google Meet
                      </a>
                    )}
                    <button onClick={() => openEdit(ev)} className="apple-btn apple-btn-tinted flex-1 py-2 text-[0.75rem]">
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />{t("emb.editar")}
                    </button>
                    <button onClick={() => { if (confirm(t("common.confirmarExclusao"))) deleteMut.mutate({ id: ev.id }, { onSuccess: () => toast.success(t("common.sucesso")), onError: (e: any) => toast.error(e.message) }); }} className="apple-btn apple-btn-destructive py-2 px-3 text-[0.75rem]">
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
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("ev.editar") : t("ev.novo")}</h2>
              <div className="space-y-4">
                <div><label className="apple-input-label">{t("ev.titulo")} *</label><input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="apple-input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="apple-input-label">{t("ev.tipo")}</label>
                    <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="apple-input">
                      <option value="encontro">{t("ev.encontro")}</option>
                      <option value="conferencia">{t("ev.conferencia")}</option>
                      <option value="retiro">{t("ev.retiro")}</option>
                      <option value="treinamento">{t("ev.treinamento")}</option>
                      <option value="outro">{t("ev.outro")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="apple-input-label">{t("ev.status")}</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="apple-input">
                      <option value="agendado">{t("ev.agendado")}</option>
                      <option value="realizado">{t("ev.realizado")}</option>
                      <option value="cancelado">{t("ev.cancelado")}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("ev.dataInicio")} *</label><input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  <div><label className="apple-input-label">{t("ev.dataFim")}</label><input type="datetime-local" value={form.dataFim} onChange={e => setForm({ ...form, dataFim: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                </div>
                <div><label className="apple-input-label">{t("ev.local")}</label><input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} className="apple-input" /></div>
                <div><label className="apple-input-label">{t("ev.linkMeet")}</label><input value={form.linkMeet} onChange={e => setForm({ ...form, linkMeet: e.target.value })} className="apple-input" placeholder="https://meet.google.com/..." /></div>
                <div className="flex items-center gap-3 py-1">
                  <Switch checked={form.recorrente} onCheckedChange={v => setForm({ ...form, recorrente: v })} />
                  <label className="text-[0.8125rem] text-[#d2d2d7]">{t("ev.recorrente")}</label>
                </div>
                <div><label className="apple-input-label">{t("ev.descricao")}</label><textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} className="apple-input resize-none" /></div>
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
