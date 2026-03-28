import { useState, useMemo } from "react";
import { useTercaGloria, useCreateTercaGloria, useUpdateTercaGloria, useDeleteTercaGloria } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Church, Video, BookOpen, ExternalLink, ChevronDown, ChevronUp, Loader2, X, Download, MessageCircle, FileDown, Send, Mail } from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf } from "@/lib/exportGenericPdf";

function formatDate(ts: number | null | undefined, locale: string) {
  if (!ts) return "—";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleDateString(loc, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function dateToTs(d: string): number | null { return d ? new Date(d + "T12:00:00").getTime() : null; }
function tsToInput(ts: number | null | undefined): string { return ts ? new Date(ts).toISOString().split("T")[0] : ""; }

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  planejada: { color: "#FF6B00", bg: "rgba(255,107,0,0.14)", label: "Planejada" },
  realizada: { color: "#30D158", bg: "rgba(48,209,88,0.14)", label: "Realizada" },
  cancelada: { color: "#FF453A", bg: "rgba(255,69,58,0.14)", label: "Cancelada" },
};

export default function TercaDeGloria() {
  const { t, locale } = useI18n();
  const { session } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ data: "", tema: "", pregador: "", resumo: "", testemunhos: "", linkMeet: "", versiculoBase: "", status: "planejada" as string, notificar: "both" as "both" | "whatsapp" | "email" | "none" });

  const { data: reunioes, isLoading } = useTercaGloria();
  const createMut = useCreateTercaGloria();
  const updateMut = useUpdateTercaGloria();
  const deleteMut = useDeleteTercaGloria();

  function resetForm() { setForm({ data: "", tema: "", pregador: "", resumo: "", testemunhos: "", linkMeet: "", versiculoBase: "", status: "planejada", notificar: "both" }); setEditingId(null); }
  function openEdit(r: any) {
    setEditingId(r.id);
    setForm({ data: tsToInput(r.data), tema: r.tema || "", pregador: r.pregador || "", resumo: r.resumo || "", testemunhos: r.testemunhos || "", linkMeet: r.linkMeet || "", versiculoBase: r.versiculoBase || "", status: r.status || "planejada" });
    setDialogOpen(true);
  }
  async function sendNotification(eventData: { tema: string; data: string; pregador: string; linkMeet: string }, channel: "whatsapp" | "email" | "both") {
    try {
      const dateStr = eventData.data ? new Date(eventData.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) : "A definir";
      const message = `*Terca de Gloria*\nTema: ${eventData.tema}\nData: ${dateStr}\nPregador: ${eventData.pregador || "A definir"}`;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          channel,
          subject: `Terca de Gloria: ${eventData.tema}`,
          title: `Terca de Gloria - ${eventData.tema}`,
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
    if (!form.tema.trim()) return toast.error(t("tg.temaObrigatorio"));
    const d = { tema: form.tema, data: dateToTs(form.data) || Date.now(), pregador: form.pregador || null, resumo: form.resumo || null, testemunhos: form.testemunhos || null, linkMeet: form.linkMeet || null, versiculoBase: form.versiculoBase || null, status: form.status as any };
    const onSuccess = () => {
      toast.success(t("common.sucesso"));
      if (!editingId && form.notificar !== "none") {
        sendNotification({ tema: form.tema, data: form.data, pregador: form.pregador, linkMeet: form.linkMeet }, form.notificar);
      }
      setDialogOpen(false); resetForm();
    };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...d }, { onSuccess, onError }); else createMut.mutate(d, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!reunioes) return [];
    if (filter === "all") return reunioes;
    return reunioes.filter((r: any) => r.status === filter);
  }, [reunioes, filter]);

  function handleExport() {
    const statusPt: Record<string, string> = { planejada: "Planejada", realizada: "Realizada", cancelada: "Cancelada" };
    const data = filtered.map((r: any) => ({
      "Data": r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "",
      "Tema": r.tema || "",
      "Pregador": r.pregador || "",
      "Status": statusPt[r.status] || r.status || "",
    }));
    exportToXlsx(data, `terca-de-gloria-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const statusPt: Record<string, string> = { planejada: "Planejada", realizada: "Realizada", cancelada: "Cancelada" };
    const rows = filtered.map((r: any) => [
      r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "",
      r.tema || "",
      r.pregador || "",
      statusPt[r.status] || r.status || "",
    ]);
    exportGenericPdf(
      "Terça de Glória - Reuniões",
      "Embaixadores dos Legendários",
      ["Data", "Tema", "Pregador", "Status"],
      rows,
      "terca-de-gloria"
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("tg.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("tg.subtitle")}</p>
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
              <span className="hidden sm:inline">{t("tg.nova")}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { key: "all", label: t("common.todos") },
            { key: "planejada", label: t("tg.planejada") },
            { key: "realizada", label: t("tg.realizada") },
            { key: "cancelada", label: t("tg.cancelada") },
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
              <Church className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("tg.nenhuma")}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {filtered.map((r: any) => {
              const sc = STATUS_MAP[r.status] || STATUS_MAP.planejada;
              const isExpanded = expandedId === r.id;
              return (
                <div key={r.id} className="apple-card overflow-hidden">
                  <div className="p-5 flex items-start gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                    <div className="w-12 h-12 rounded-2xl bg-[#E85D00]/10 flex items-center justify-center shrink-0">
                      <Church className="w-5 h-5 text-[#E85D00]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[0.875rem] font-semibold text-white truncate">{r.tema}</span>
                        <span className="apple-badge text-[0.6875rem]" style={{ background: sc.bg, color: sc.color }}>{t(`tg.${r.status}`)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[0.75rem] text-[#6e6e73]">
                        <span>{formatDate(r.data, locale)}</span>
                        {r.pregador && <span>• {r.pregador}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.linkMeet && (
                        <a href={r.linkMeet} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="w-8 h-8 rounded-xl bg-[#30D158]/10 flex items-center justify-center text-[#30D158] hover:bg-[#30D158]/20 transition-colors">
                          <Video className="w-4 h-4" strokeWidth={1.5} />
                        </a>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#48484a]" /> : <ChevronDown className="w-4 h-4 text-[#48484a]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 animate-fade-up">
                      <div className="apple-separator" />
                      {r.versiculoBase && (
                        <div className="apple-card-inset p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-3.5 h-3.5 text-[#BF5AF2]" strokeWidth={1.5} />
                            <span className="text-[0.625rem] text-[#6e6e73] uppercase tracking-wider">{t("tg.versiculo")}</span>
                          </div>
                          <p className="text-[0.8125rem] text-[#d2d2d7] italic leading-relaxed">{r.versiculoBase}</p>
                        </div>
                      )}
                      {r.resumo && (
                        <div className="apple-card-inset p-4">
                          <p className="text-[0.625rem] text-[#6e6e73] uppercase tracking-wider mb-2">{t("tg.resumo")}</p>
                          <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed">{r.resumo}</p>
                        </div>
                      )}
                      {r.testemunhos && (
                        <div className="apple-card-inset p-4">
                          <p className="text-[0.625rem] text-[#6e6e73] uppercase tracking-wider mb-2">{t("tg.testemunhos")}</p>
                          <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed">{r.testemunhos}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const dateStr = r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "A definir";
                            const msg = `*Terca de Gloria*\nTema: ${r.tema}\nData: ${dateStr}\nPregador: ${r.pregador || 'A definir'}`;
                            toast.loading("Enviando WhatsApp para todos...");
                            try {
                              const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-all`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
                                body: JSON.stringify({ channel: "whatsapp", subject: `Terca de Gloria: ${r.tema}`, title: `Terca de Gloria - ${r.tema}`, message: msg, meetLink: r.linkMeet || undefined }),
                              });
                              const data = await res.json();
                              toast.dismiss();
                              if (data.success) toast.success(`WhatsApp enviado para ${data.results.whatsapp.sent} embaixadores`);
                              else toast.error(data.error || "Erro ao enviar");
                            } catch { toast.dismiss(); toast.error("Erro ao enviar WhatsApp"); }
                          }}
                          className="apple-btn apple-btn-gray py-2 px-3 text-[#25D366] hover:text-[#128C7E]"
                          title="Enviar WhatsApp para todos embaixadores"
                        >
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => openEdit(r)} className="apple-btn apple-btn-tinted flex-1 py-2">
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />{t("emb.editar")}
                        </button>
                        <button onClick={() => { if (confirm(t("common.confirmarExclusao"))) deleteMut.mutate({ id: r.id }, { onSuccess: () => toast.success(t("common.sucesso")), onError: (e: any) => toast.error(e.message) }); }} className="apple-btn apple-btn-destructive flex-1 py-2">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />{t("emb.excluir")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("tg.editar") : t("tg.nova")}</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("tg.data")}</label><input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  <div>
                    <label className="apple-input-label">{t("tg.status")}</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="apple-input">
                      <option value="planejada">{t("tg.planejada")}</option>
                      <option value="realizada">{t("tg.realizada")}</option>
                      <option value="cancelada">{t("tg.cancelada")}</option>
                    </select>
                  </div>
                </div>
                <div><label className="apple-input-label">{t("tg.tema")} *</label><input value={form.tema} onChange={e => setForm({ ...form, tema: e.target.value })} className="apple-input" /></div>
                <div><label className="apple-input-label">{t("tg.pregador")}</label><input value={form.pregador} onChange={e => setForm({ ...form, pregador: e.target.value })} className="apple-input" /></div>
                <div><label className="apple-input-label">{t("tg.versiculo")}</label><input value={form.versiculoBase} onChange={e => setForm({ ...form, versiculoBase: e.target.value })} className="apple-input" /></div>
                <div>
                  <label className="apple-input-label">{t("tg.linkMeet")}</label>
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
                            body: JSON.stringify({ title: `Terça de Glória - ${form.tema || "Reunião"}`, date: form.data, googleToken }),
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
                <div><label className="apple-input-label">{t("tg.resumo")}</label><textarea value={form.resumo} onChange={e => setForm({ ...form, resumo: e.target.value })} rows={3} className="apple-input resize-none" /></div>
                <div><label className="apple-input-label">{t("tg.testemunhos")}</label><textarea value={form.testemunhos} onChange={e => setForm({ ...form, testemunhos: e.target.value })} rows={2} className="apple-input resize-none" /></div>

                {!editingId && (
                  <div className="apple-card p-4 space-y-2 border border-white/[0.06]">
                    <label className="apple-input-label flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Notificar Embaixadores
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { key: "both", label: "WhatsApp + Email", icon: "both" },
                        { key: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
                        { key: "email", label: "Email", icon: "email" },
                        { key: "none", label: "Nao notificar", icon: "none" },
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
      </div>
    </DashboardLayout>
  );
}
