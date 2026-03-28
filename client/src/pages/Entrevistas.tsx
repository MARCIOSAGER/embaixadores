import { useState, useMemo } from "react";
import { useEntrevistas, useCreateEntrevista, useUpdateEntrevista, useDeleteEntrevista } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, UserPlus, Video, Phone, Mail, User, Calendar, ExternalLink, Loader2, X, Download, MessageCircle, FileDown, Send } from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf } from "@/lib/exportGenericPdf";

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
  const { session } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [notifyTarget, setNotifyTarget] = useState<any>(null);
  const [form, setForm] = useState({ nomeCandidato: "", emailCandidato: "", telefoneCandidato: "", dataEntrevista: "", linkMeet: "", status: "agendada", observacoes: "", indicadoPor: "", notificar: "both" as "both" | "whatsapp" | "email" | "none" });

  const { data: entrevistas, isLoading } = useEntrevistas();
  const createMut = useCreateEntrevista();
  const updateMut = useUpdateEntrevista();
  const deleteMut = useDeleteEntrevista();

  function resetForm() { setForm({ nomeCandidato: "", emailCandidato: "", telefoneCandidato: "", dataEntrevista: "", linkMeet: "", status: "agendada", observacoes: "", indicadoPor: "", notificar: "both" }); setEditingId(null); }
  function openEdit(ent: any) {
    setEditingId(ent.id);
    setForm({ nomeCandidato: ent.nomeCandidato || "", emailCandidato: ent.emailCandidato || "", telefoneCandidato: ent.telefoneCandidato || "", dataEntrevista: tsToInputDT(ent.dataEntrevista), linkMeet: ent.linkMeet || "", status: ent.status || "agendada", observacoes: ent.observacoes || "", indicadoPor: ent.indicadoPor || "" });
    setDialogOpen(true);
  }
  async function sendNotification(eventData: { nomeCandidato: string; dataEntrevista: string; linkMeet: string; indicadoPor: string }, channel: "whatsapp" | "email" | "both") {
    try {
      const dateStr = eventData.dataEntrevista ? new Date(eventData.dataEntrevista).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "A definir";
      const message = `*Entrevista Agendada*\nCandidato: ${eventData.nomeCandidato}\nData: ${dateStr}\nIndicado por: ${eventData.indicadoPor || "—"}`;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          channel,
          subject: `Entrevista: ${eventData.nomeCandidato}`,
          title: `Entrevista - ${eventData.nomeCandidato}`,
          message,
          meetLink: eventData.linkMeet || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        const parts = [];
        if (result.results.whatsapp.sent > 0) parts.push(`${result.results.whatsapp.sent} WhatsApp`);
        if (result.results.email.sent > 0) parts.push(`${result.results.email.sent} Email`);
        toast.success(`Notificacao enviada: ${parts.join(", ")}`);
      } else {
        toast.error(result.error || "Erro ao notificar");
      }
    } catch {
      toast.error("Erro ao enviar notificacoes");
    }
  }

  function handleSubmit() {
    if (!form.nomeCandidato.trim() || !form.dataEntrevista) return toast.error(t("ent.nomeObrigatorio"));
    const d = { nomeCandidato: form.nomeCandidato, emailCandidato: form.emailCandidato || null, telefoneCandidato: form.telefoneCandidato || null, dataEntrevista: dateToTimestamp(form.dataEntrevista), linkMeet: form.linkMeet || null, status: form.status as any, observacoes: form.observacoes || null, indicadoPor: form.indicadoPor || null };
    const onSuccess = () => {
      toast.success(t("common.sucesso"));
      if (!editingId && form.notificar !== "none") {
        sendNotification({ nomeCandidato: form.nomeCandidato, dataEntrevista: form.dataEntrevista, linkMeet: form.linkMeet, indicadoPor: form.indicadoPor }, form.notificar);
      }
      setDialogOpen(false); resetForm();
    };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...d }, { onSuccess, onError }); else createMut.mutate(d, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!entrevistas) return [];
    if (filter === "all") return entrevistas;
    return entrevistas.filter((e: any) => e.status === filter);
  }, [entrevistas, filter]);

  function handleExport() {
    const statusPt: Record<string, string> = { agendada: "Agendada", realizada: "Realizada", aprovada: "Aprovada", reprovada: "Reprovada", cancelada: "Cancelada" };
    const data = filtered.map((ent: any) => ({
      "Candidato": ent.nomeCandidato || "",
      "Email": ent.emailCandidato || "",
      "Telefone": ent.telefoneCandidato || "",
      "Data Entrevista": ent.dataEntrevista ? new Date(ent.dataEntrevista).toLocaleDateString("pt-BR") : "",
      "Status": statusPt[ent.status] || ent.status || "",
      "Indicado Por": ent.indicadoPor || "",
    }));
    exportToXlsx(data, `entrevistas-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const statusPt: Record<string, string> = { agendada: "Agendada", realizada: "Realizada", aprovada: "Aprovada", reprovada: "Reprovada", cancelada: "Cancelada" };
    const rows = filtered.map((ent: any) => [
      ent.nomeCandidato || "",
      ent.emailCandidato || "",
      ent.dataEntrevista ? new Date(ent.dataEntrevista).toLocaleDateString("pt-BR") : "",
      statusPt[ent.status] || ent.status || "",
      ent.indicadoPor || "",
    ]);
    exportGenericPdf(
      "Lista de Entrevistas",
      "Embaixadores dos Legendários",
      ["Candidato", "Email", "Data", "Status", "Indicado Por"],
      rows,
      "entrevistas"
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("ent.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("ent.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2 shrink-0"
              title="Exportar PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
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
              <span className="hidden sm:inline">{t("ent.nova")}</span>
            </button>
          </div>
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
                        <span className="apple-badge text-[0.6875rem]" style={{ background: sc.bg, color: sc.color }}>{t(`ent.${ent.status}`)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-[#6e6e73]">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={1.5} />{formatDateTime(ent.dataEntrevista, locale)}</span>
                        {ent.indicadoPor && <span className="flex items-center gap-1"><User className="w-3 h-3" strokeWidth={1.5} />{ent.indicadoPor}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setNotifyTarget(ent); }}
                        className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                        title="Notificar sobre entrevista"
                      >
                        <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                      {ent.linkMeet && (
                        <a href={ent.linkMeet} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-xl bg-[#30D158]/10 flex items-center justify-center text-[#30D158] hover:bg-[#30D158]/20 transition-colors">
                          <Video className="w-5 h-5" strokeWidth={1.5} />
                        </a>
                      )}
                    </div>
                  </div>
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
                  <button
                    onClick={() => setNotifyTarget(selected)}
                    className="apple-btn apple-btn-gray py-2.5 px-3 text-[#25D366] hover:text-[#128C7E]"
                    title="Notificar sobre entrevista"
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => { openEdit(selected); setSelected(null); }} className="apple-btn apple-btn-tinted flex-1 py-2.5">
                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />Editar Entrevista
                  </button>
                  <button onClick={() => { if (confirm(t("common.confirmarExclusao"))) deleteMut.mutate(selected.id, { onSuccess: () => { toast.success(t("common.sucesso")); setSelected(null); }, onError: (e: any) => toast.error(e.message) }); }} className="apple-btn apple-btn-destructive flex-1 py-2.5">
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />{t("emb.excluir")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("ent.editar") : t("ent.nova")}</h2>
              <div className="space-y-4">
                <div><label className="apple-input-label">{t("ent.nomeCandidato")} *</label><input value={form.nomeCandidato} onChange={e => setForm({ ...form, nomeCandidato: e.target.value })} className="apple-input" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("ent.emailCandidato")}</label><input type="email" value={form.emailCandidato} onChange={e => setForm({ ...form, emailCandidato: e.target.value })} className="apple-input" /></div>
                  <div><label className="apple-input-label">{t("ent.telefoneCandidato")}</label><input value={form.telefoneCandidato} onChange={e => setForm({ ...form, telefoneCandidato: e.target.value })} className="apple-input" /></div>
                </div>
                <div><label className="apple-input-label">{t("ent.dataEntrevista")} *</label><input type="datetime-local" value={form.dataEntrevista} onChange={e => setForm({ ...form, dataEntrevista: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                <div>
                  <label className="apple-input-label">{t("ent.linkMeet")}</label>
                  <div className="flex gap-2">
                    <input value={form.linkMeet} onChange={e => setForm({ ...form, linkMeet: e.target.value })} className="apple-input flex-1" placeholder="https://meet.google.com/..." />
                    <button
                      type="button"
                      onClick={async () => {
                        const googleToken = localStorage.getItem("google_token");
                        if (!googleToken) { toast.error("Faça login com Google para gerar links do Meet"); return; }
                        toast.loading("Gerando link do Meet...");
                        try {
                          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-meet`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
                            body: JSON.stringify({ title: `Entrevista - ${form.nomeCandidato || "Candidato"}`, date: form.dataEntrevista, googleToken }),
                          });
                          const data = await res.json();
                          if (data.meetLink) { setForm(f => ({ ...f, linkMeet: data.meetLink })); toast.dismiss(); toast.success("Link do Meet gerado!"); }
                          else { toast.dismiss(); toast.error(data.error || "Erro ao gerar link"); }
                        } catch { toast.dismiss(); toast.error("Erro ao gerar link do Meet"); }
                      }}
                      className="apple-btn apple-btn-filled px-3 py-2 text-xs rounded-xl shrink-0 flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gerar Meet</span>
                    </button>
                  </div>
                </div>
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

                {!editingId && (
                  <div className="apple-card p-4 space-y-2 border border-white/[0.06]">
                    <label className="apple-input-label flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Notificar Embaixadores
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { key: "both", label: "WhatsApp + Email" },
                        { key: "whatsapp", label: "WhatsApp" },
                        { key: "email", label: "Email" },
                        { key: "none", label: "Nao notificar" },
                      ] as const).map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, notificar: opt.key }))}
                          className={`text-[0.75rem] py-1.5 px-3 rounded-lg border transition-all flex items-center gap-1.5 ${form.notificar === opt.key ? "border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]" : "border-white/[0.08] text-[#86868b] hover:border-white/[0.15]"}`}
                        >
                          {opt.key === "whatsapp" || opt.key === "both" ? <MessageCircle className="w-3 h-3" /> : null}
                          {opt.key === "email" || opt.key === "both" ? <Mail className="w-3 h-3" /> : null}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Notify Dialog */}
        <Dialog open={!!notifyTarget} onOpenChange={(o) => { if (!o) setNotifyTarget(null); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-sm p-0">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white tracking-[-0.02em] flex items-center gap-2">
                <Send className="w-5 h-5 text-[#FF6B00]" />
                Notificar Embaixadores
              </h2>
              <p className="text-[0.8125rem] text-[#86868b]">Entrevista: {notifyTarget?.nomeCandidato}</p>
              <div className="flex flex-col gap-2">
                {([
                  { key: "both", label: "WhatsApp + Email" },
                  { key: "whatsapp", label: "Somente WhatsApp" },
                  { key: "email", label: "Somente Email" },
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={async () => {
                      const ent = notifyTarget;
                      setNotifyTarget(null);
                      const dateStr = ent.dataEntrevista ? new Date(ent.dataEntrevista).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "A definir";
                      const msg = `*Entrevista Agendada*\nCandidato: ${ent.nomeCandidato}\nData: ${dateStr}\nIndicado por: ${ent.indicadoPor || "—"}`;
                      toast.loading("Enviando notificacoes...");
                      try {
                        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-all`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
                          body: JSON.stringify({ channel: opt.key, subject: `Entrevista: ${ent.nomeCandidato}`, title: `Entrevista - ${ent.nomeCandidato}`, message: msg, meetLink: ent.linkMeet || undefined }),
                        });
                        const data = await res.json();
                        toast.dismiss();
                        if (data.success) {
                          const parts = [];
                          if (data.results.whatsapp?.sent > 0) parts.push(`${data.results.whatsapp.sent} WhatsApp`);
                          if (data.results.email?.sent > 0) parts.push(`${data.results.email.sent} Email`);
                          toast.success(`Enviado: ${parts.join(", ")}`);
                        } else toast.error(data.error || "Erro ao enviar");
                      } catch { toast.dismiss(); toast.error("Erro ao enviar notificacoes"); }
                    }}
                    className="apple-btn apple-btn-gray w-full py-3 text-[0.8125rem] flex items-center gap-2 justify-center"
                  >
                    {opt.key !== "email" && <MessageCircle className="w-4 h-4 text-[#25D366]" />}
                    {opt.key !== "whatsapp" && <Mail className="w-4 h-4 text-[#FF6B00]" />}
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setNotifyTarget(null)} className="apple-btn apple-btn-gray w-full py-2.5 text-[0.8125rem]">Cancelar</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
