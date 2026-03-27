import { useState, useMemo } from "react";
import { useEntrevistas, useCreateEntrevista, useUpdateEntrevista, useDeleteEntrevista } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, UserPlus, Video, Phone, Mail, User, Calendar, ExternalLink, Loader2, X } from "lucide-react";

function formatDateTime(ts: number | null | undefined, locale: string) {
  if (!ts) return "—";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleString(loc, { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
  agendada: { color: "#FF6B00", bg: "rgba(255,107,0,0.14)" },
  realizada: { color: "#30D158", bg: "rgba(48,209,88,0.14)" },
  aprovada: { color: "#FF6B00", bg: "rgba(191,90,242,0.14)" },
  reprovada: { color: "#FF453A", bg: "rgba(255,69,58,0.14)" },
  cancelada: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)" },
};

export default function Entrevistas() {
  const { t, locale } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ nomeCandidato: "", emailCandidato: "", telefoneCandidato: "", dataEntrevista: "", linkMeet: "", status: "agendada", observacoes: "", indicadoPor: "" });

  const { data: entrevistas, isLoading } = useEntrevistas();
  const createMut = useCreateEntrevista();
  const updateMut = useUpdateEntrevista();
  const deleteMut = useDeleteEntrevista();

  function resetForm() { setForm({ nomeCandidato: "", emailCandidato: "", telefoneCandidato: "", dataEntrevista: "", linkMeet: "", status: "agendada", observacoes: "", indicadoPor: "" }); setEditingId(null); }
  function openEdit(ent: any) {
    setEditingId(ent.id);
    setForm({ nomeCandidato: ent.nomeCandidato || "", emailCandidato: ent.emailCandidato || "", telefoneCandidato: ent.telefoneCandidato || "", dataEntrevista: tsToInputDT(ent.dataEntrevista), linkMeet: ent.linkMeet || "", status: ent.status || "agendada", observacoes: ent.observacoes || "", indicadoPor: ent.indicadoPor || "" });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.nomeCandidato.trim() || !form.dataEntrevista) return toast.error(t("ent.nomeObrigatorio"));
    const d = { nomeCandidato: form.nomeCandidato, emailCandidato: form.emailCandidato || null, telefoneCandidato: form.telefoneCandidato || null, dataEntrevista: dateToTimestamp(form.dataEntrevista), linkMeet: form.linkMeet || null, status: form.status as any, observacoes: form.observacoes || null, indicadoPor: form.indicadoPor || null };
    const onSuccess = () => { toast.success(t("common.sucesso")); setDialogOpen(false); resetForm(); };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...d }, { onSuccess, onError }); else createMut.mutate(d, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!entrevistas) return [];
    if (filter === "all") return entrevistas;
    return entrevistas.filter((e: any) => e.status === filter);
  }, [entrevistas, filter]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("ent.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("ent.subtitle")}</p>
          </div>
          <button onClick={() => { resetForm(); setDialogOpen(true); }} className="apple-btn apple-btn-filled text-[0.8125rem] py-2 px-4">
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("ent.nova")}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { key: "all", label: t("common.todos") },
            { key: "agendada", label: t("ent.agendada") },
            { key: "realizada", label: t("ent.realizada") },
            { key: "aprovada", label: t("ent.aprovada") },
            { key: "reprovada", label: t("ent.reprovada") },
            { key: "cancelada", label: t("ent.cancelada") },
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
              <UserPlus className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("ent.nenhuma")}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {filtered.map((ent: any) => {
              const sc = STATUS_MAP[ent.status] || STATUS_MAP.agendada;
              return (
                <div key={ent.id} className="apple-card p-5 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => setSelected(ent)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-[0.875rem] font-bold shrink-0">
                      {ent.nomeCandidato?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[0.875rem] font-semibold text-white truncate">{ent.nomeCandidato}</span>
                        <span className="apple-badge text-[0.5625rem]" style={{ background: sc.bg, color: sc.color }}>{t(`ent.${ent.status}`)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-[#6e6e73]">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={1.5} />{formatDateTime(ent.dataEntrevista, locale)}</span>
                        {ent.indicadoPor && <span className="flex items-center gap-1"><User className="w-3 h-3" strokeWidth={1.5} />{ent.indicadoPor}</span>}
                      </div>
                    </div>
                    {ent.linkMeet && (
                      <a href={ent.linkMeet} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-xl bg-[#30D158]/10 flex items-center justify-center text-[#30D158] hover:bg-[#30D158]/20 transition-colors shrink-0">
                        <Video className="w-5 h-5" strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Sheet */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center apple-sheet-backdrop" onClick={() => setSelected(null)}>
            <div className="apple-sheet-content w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[20px] lg:rounded-[20px] animate-fade-up" onClick={e => e.stopPropagation()}>
              <div className="apple-sheet-handle" />
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-xl font-bold">
                    {selected.nomeCandidato?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white tracking-[-0.02em]">{selected.nomeCandidato}</h2>
                    <span className="apple-badge text-[0.625rem] mt-1" style={{ background: STATUS_MAP[selected.status]?.bg, color: STATUS_MAP[selected.status]?.color }}>{t(`ent.${selected.status}`)}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b]">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="apple-card-inset p-4 space-y-3">
                  <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{formatDateTime(selected.dataEntrevista, locale)}</span></div>
                  {selected.emailCandidato && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.emailCandidato}</span></div>}
                  {selected.telefoneCandidato && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.telefoneCandidato}</span></div>}
                  {selected.indicadoPor && <div className="flex items-center gap-3"><User className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{t("ent.indicadoPor")}: {selected.indicadoPor}</span></div>}
                </div>

                {selected.linkMeet && (
                  <a href={selected.linkMeet} target="_blank" rel="noopener" className="apple-btn apple-btn-gray w-full py-3 justify-center text-[0.8125rem]">
                    <Video className="w-4 h-4" strokeWidth={1.5} />
                    Google Meet
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" strokeWidth={1.5} />
                  </a>
                )}

                {selected.observacoes && (
                  <div className="apple-card-inset p-4">
                    <p className="text-[0.625rem] text-[#6e6e73] uppercase tracking-wider mb-2">{t("ent.observacoes")}</p>
                    <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed">{selected.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { openEdit(selected); setSelected(null); }} className="apple-btn apple-btn-tinted flex-1 py-2.5">
                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />{t("emb.editar")}
                  </button>
                  <button onClick={() => { if (confirm(t("common.confirmarExclusao"))) deleteMut.mutate({ id: selected.id }, { onSuccess: () => { toast.success(t("common.sucesso")); setSelected(null); }, onError: (e: any) => toast.error(e.message) }); }} className="apple-btn apple-btn-destructive flex-1 py-2.5">
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />{t("emb.excluir")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("ent.editar") : t("ent.nova")}</h2>
              <div className="space-y-4">
                <div><label className="apple-input-label">{t("ent.nomeCandidato")} *</label><input value={form.nomeCandidato} onChange={e => setForm({ ...form, nomeCandidato: e.target.value })} className="apple-input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("ent.emailCandidato")}</label><input type="email" value={form.emailCandidato} onChange={e => setForm({ ...form, emailCandidato: e.target.value })} className="apple-input" /></div>
                  <div><label className="apple-input-label">{t("ent.telefoneCandidato")}</label><input value={form.telefoneCandidato} onChange={e => setForm({ ...form, telefoneCandidato: e.target.value })} className="apple-input" /></div>
                </div>
                <div><label className="apple-input-label">{t("ent.dataEntrevista")} *</label><input type="datetime-local" value={form.dataEntrevista} onChange={e => setForm({ ...form, dataEntrevista: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                <div><label className="apple-input-label">{t("ent.linkMeet")}</label><input value={form.linkMeet} onChange={e => setForm({ ...form, linkMeet: e.target.value })} className="apple-input" placeholder="https://meet.google.com/..." /></div>
                <div>
                  <label className="apple-input-label">{t("ent.status")}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="apple-input">
                    <option value="agendada">{t("ent.agendada")}</option>
                    <option value="realizada">{t("ent.realizada")}</option>
                    <option value="aprovada">{t("ent.aprovada")}</option>
                    <option value="reprovada">{t("ent.reprovada")}</option>
                    <option value="cancelada">{t("ent.cancelada")}</option>
                  </select>
                </div>
                <div><label className="apple-input-label">{t("ent.indicadoPor")}</label><input value={form.indicadoPor} onChange={e => setForm({ ...form, indicadoPor: e.target.value })} className="apple-input" /></div>
                <div><label className="apple-input-label">{t("ent.observacoes")}</label><textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} className="apple-input resize-none" /></div>
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
