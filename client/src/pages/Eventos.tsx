import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEventos, useCreateEvento, useUpdateEvento, useDeleteEvento } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Calendar, CalendarDays, MapPin, Clock, Video, Repeat, ExternalLink, Loader2, Download, MessageCircle, FileDown, Send, Mail, List, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf } from "@/lib/exportGenericPdf";
import ConfirmDialog from "@/components/ConfirmDialog";
import NotifyDialog from "@/components/NotifyDialog";
import { formatDateTime, dateToTimestamp, tsToInputDT } from "@/lib/dateUtils";

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  agendado: { color: "#FF6B00", bg: "rgba(255,107,0,0.14)" },
  realizado: { color: "#30D158", bg: "rgba(48,209,88,0.14)" },
  cancelado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)" },
};

const TYPE_COLORS: Record<string, string> = {
  encontro: "#FF6B00", conferencia: "#AF52DE", retiro: "#30D158", treinamento: "#0A84FF", outro: "#8E8E93",
};

export default function Eventos() {
  const { t, locale } = useI18n();
  const { session } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [notifyTarget, setNotifyTarget] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", data: "", dataFim: "", local: "", tipo: "encontro", linkMeet: "", recorrente: false, status: "agendado", notificar: "both" as "both" | "whatsapp" | "email" | "none" });

  const { data: eventos, isLoading } = useEventos();
  const createMut = useCreateEvento();
  const updateMut = useUpdateEvento();
  const deleteMut = useDeleteEvento();

  function resetForm() { setForm({ titulo: "", descricao: "", data: "", dataFim: "", local: "", tipo: "encontro", linkMeet: "", recorrente: false, status: "agendado", notificar: "both" }); setEditingId(null); }
  function openEdit(ev: any) {
    setEditingId(ev.id);
    setForm({ titulo: ev.titulo || "", descricao: ev.descricao || "", data: tsToInputDT(ev.data), dataFim: tsToInputDT(ev.dataFim), local: ev.local || "", tipo: ev.tipo || "encontro", linkMeet: ev.linkMeet || "", recorrente: ev.recorrente || false, status: ev.status || "agendado" });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.titulo.trim() || !form.data) return toast.error(t("ev.tituloObrigatorio"));
    const d = { titulo: form.titulo, descricao: form.descricao || null, data: dateToTimestamp(form.data), dataFim: form.dataFim ? dateToTimestamp(form.dataFim) : null, local: form.local || null, tipo: form.tipo as any, linkMeet: form.linkMeet || null, recorrente: form.recorrente, status: form.status as any };
    const onSuccess = () => {
      toast.success(t("common.sucesso"));
      setDialogOpen(false); resetForm();
    };
    const onError = (e: any) => toast.error(e.message);
    if (editingId) updateMut.mutate({ id: editingId, ...d }, { onSuccess, onError }); else createMut.mutate(d, { onSuccess, onError });
  }

  const filtered = useMemo(() => {
    if (!eventos) return [];
    if (filter === "all") return eventos;
    return eventos.filter((e: any) => e.status === filter);
  }, [eventos, filter]);

  // Calendar helpers
  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const days: { day: number; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: daysInPrev - i, current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true });
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) for (let i = 1; i <= remaining; i++) days.push({ day: i, current: false });
    return days;
  }, [calMonth, calYear]);

  const eventsInMonth = useMemo(() => {
    if (!filtered) return new Map<number, any[]>();
    const map = new Map<number, any[]>();
    filtered.forEach((ev: any) => {
      if (!ev.data) return;
      const d = new Date(ev.data);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(ev);
      }
    });
    return map;
  }, [filtered, calMonth, calYear]);

  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return eventsInMonth.get(selectedDay) || [];
  }, [selectedDay, eventsInMonth]);

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  function prevMonth() {
    setSelectedDay(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  const weekdays = t("ev.dias").split(",");
  const months = t("ev.meses").split(",");

  function handleExport() {
    const statusPt: Record<string, string> = { agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado" };
    const tipoPt: Record<string, string> = { encontro: "Encontro", conferencia: "Conferencia", retiro: "Retiro", treinamento: "Treinamento", outro: "Outro" };
    const data = filtered.map((ev: any) => ({
      "Titulo": ev.titulo || "",
      "Data": ev.data ? new Date(ev.data).toLocaleDateString("pt-BR") : "",
      "Local": ev.local || "",
      "Tipo": tipoPt[ev.tipo] || ev.tipo || "",
      "Status": statusPt[ev.status] || ev.status || "",
    }));
    exportToXlsx(data, `eventos-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const statusPt: Record<string, string> = { agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado" };
    const tipoPt: Record<string, string> = { encontro: "Encontro", conferencia: "Conferencia", retiro: "Retiro", treinamento: "Treinamento", outro: "Outro" };
    const rows = filtered.map((ev: any) => [
      ev.titulo || "",
      ev.data ? new Date(ev.data).toLocaleDateString("pt-BR") : "",
      ev.local || "",
      tipoPt[ev.tipo] || ev.tipo || "",
      statusPt[ev.status] || ev.status || "",
    ]);
    exportGenericPdf(
      "Lista de Eventos",
      "Embaixadores dos Legendários",
      ["Título", "Data", "Local", "Tipo", "Status"],
      rows,
      "eventos"
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("ev.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("ev.subtitle")}</p>
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
              <span className="hidden sm:inline">{t("ev.novo")}</span>
            </button>
          </div>
        </div>

        {/* Filters + View Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: "50ms" }}>
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
          <div className="ml-auto flex shrink-0 rounded-xl border border-white/[0.08] overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#FF6B00]/20 text-[#FF6B00]" : "text-[#86868b] hover:text-white"}`}
              title={t("ev.lista")}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 transition-colors ${viewMode === "calendar" ? "bg-[#FF6B00]/20 text-[#FF6B00]" : "text-[#86868b] hover:text-white"}`}
              title={t("ev.calendario")}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: List or Calendar */}
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="apple-skeleton h-28 rounded-2xl" />)}</div>
        ) : viewMode === "calendar" ? (
          <div className="animate-fade-up space-y-4" style={{ animationDelay: "100ms" }}>
            {/* Calendar View */}
            <div className="apple-card p-4 sm:p-5">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="apple-btn apple-btn-gray p-2 rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[1rem] font-semibold text-white tracking-[-0.02em]">
                  {months[calMonth]} {calYear}
                </h2>
                <button onClick={nextMonth} className="apple-btn apple-btn-gray p-2 rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {weekdays.map(d => (
                  <div key={d} className="text-center text-[0.6875rem] font-medium text-[#86868b] py-1.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px">
                {calDays.map((cell, i) => {
                  const hasEvents = cell.current && eventsInMonth.has(cell.day);
                  const dayEvents = cell.current ? eventsInMonth.get(cell.day) : undefined;
                  const isTodayCell = cell.current && isToday(cell.day);
                  const isSelected = cell.current && selectedDay === cell.day;
                  return (
                    <button
                      key={i}
                      onClick={() => cell.current && setSelectedDay(selectedDay === cell.day ? null : cell.day)}
                      disabled={!cell.current}
                      className={`
                        relative flex flex-col items-center justify-center
                        aspect-square min-h-[40px] sm:min-h-[48px] rounded-xl transition-all
                        ${cell.current ? "hover:bg-white/[0.04] cursor-pointer" : "cursor-default"}
                        ${isSelected ? "bg-[#FF6B00]/20" : ""}
                        ${isTodayCell ? "border-2 border-[#FF6B00]" : "border border-white/[0.05]"}
                      `}
                    >
                      <span className={`text-[0.8125rem] sm:text-[0.875rem] font-medium ${
                        !cell.current ? "text-white/20" : isTodayCell ? "text-[#FF6B00]" : "text-white"
                      }`}>
                        {cell.day}
                      </span>
                      {hasEvents && (
                        <div className="flex gap-0.5 mt-0.5">
                          {(dayEvents || []).slice(0, 3).map((ev: any, j: number) => (
                            <span
                              key={j}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: TYPE_COLORS[ev.tipo] || "#8E8E93" }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day events */}
            {selectedDay !== null && (
              <div className="space-y-3 animate-fade-up">
                <h3 className="text-[0.875rem] font-semibold text-[#86868b]">
                  {selectedDay} {months[calMonth]} {calYear}
                  {isToday(selectedDay) && <span className="ml-2 text-[#FF6B00] text-[0.75rem]">({t("ev.hoje")})</span>}
                </h3>
                {selectedDayEvents.length === 0 ? (
                  <div className="apple-card p-4 text-center">
                    <p className="text-[0.8125rem] text-[#48484a]">{t("ev.semEventosDia")}</p>
                  </div>
                ) : (
                  selectedDayEvents.map((ev: any) => {
                    const sc = STATUS_MAP[ev.status] || STATUS_MAP.agendado;
                    const typeColor = TYPE_COLORS[ev.tipo] || "#8E8E93";
                    return (
                      <div key={ev.id} className="apple-card p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${typeColor}14` }}>
                            <Calendar className="w-4 h-4" style={{ color: typeColor }} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[0.8125rem] font-semibold text-white">{ev.titulo}</span>
                              <span className="apple-badge text-[0.625rem]" style={{ background: sc.bg, color: sc.color }}>{t(`ev.${ev.status}`)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.6875rem] text-[#6e6e73] mt-0.5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{formatDateTime(ev.data, locale)}</span>
                              {ev.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{ev.local}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => openEdit(ev)} className="apple-btn apple-btn-tinted py-1.5 px-2.5 text-[0.6875rem]">
                              <Edit2 className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
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
              const typeColor = TYPE_COLORS[ev.tipo] || "#8E8E93";
              return (
                <div key={ev.id} className="apple-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${typeColor}14` }}>
                      <Calendar className="w-5 h-5" style={{ color: typeColor }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[0.875rem] font-semibold text-white">{ev.titulo}</span>
                        <span className="apple-badge text-[0.6875rem]" style={{ background: sc.bg, color: sc.color }}>{t(`ev.${ev.status}`)}</span>
                        <span className="apple-badge text-[0.6875rem]" style={{ background: `${typeColor}14`, color: typeColor }}>{t(`ev.${ev.tipo}`)}</span>
                        {ev.recorrente && <span className="apple-badge apple-badge-indigo text-[0.6875rem] flex items-center gap-1"><Repeat className="w-3 h-3" />{t("ev.recorrente")}</span>}
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setNotifyTarget(ev); }}
                      className="apple-btn apple-btn-gray py-2 px-3 text-[0.75rem] text-[#25D366] hover:text-[#128C7E] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Notificar embaixadores"
                      aria-label="Notificar embaixadores via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => openEdit(ev)} className="apple-btn apple-btn-tinted flex-1 py-2 text-[0.75rem]">
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />{t("ev.editar") || "Editar Evento"}
                    </button>
                    <button onClick={() => setConfirmDelete(ev.id)} className="apple-btn apple-btn-destructive py-2 px-3 text-[0.75rem] min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Excluir evento">
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
              <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{editingId ? t("ev.editar") : t("ev.novo")}</h2>
              <div className="space-y-4">
                <div><label className="apple-input-label">{t("ev.titulo")} *</label><input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="apple-input" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="apple-input-label">{t("ev.dataInicio")} *</label><input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  <div><label className="apple-input-label">{t("ev.dataFim")}</label><input type="datetime-local" value={form.dataFim} onChange={e => setForm({ ...form, dataFim: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                </div>
                <div><label className="apple-input-label">{t("ev.local")}</label><input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} className="apple-input" /></div>
                <div>
                  <label className="apple-input-label">{t("ev.linkMeet")}</label>
                  <div className="flex gap-2">
                    <input value={form.linkMeet} onChange={e => setForm({ ...form, linkMeet: e.target.value })} className="apple-input flex-1" placeholder="https://meet.google.com/..." />
                    <button
                      type="button"
                      onClick={async () => {
                        const googleToken = sessionStorage.getItem("google_token");
                        if (!googleToken) {
                          toast.error("Faça login com Google para gerar links do Meet");
                          return;
                        }
                        toast.loading("Gerando link do Meet...");
                        try {
                          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-meet`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${session?.access_token}`,
                              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                            },
                            body: JSON.stringify({ title: form.titulo || "Reunião Legendários", date: form.data, googleToken }),
                          });
                          const data = await res.json();
                          if (data.meetLink) {
                            setForm(f => ({ ...f, linkMeet: data.meetLink }));
                            toast.dismiss();
                            toast.success("Link do Meet gerado!");
                          } else {
                            toast.dismiss();
                            toast.error(data.error || "Erro ao gerar link");
                          }
                        } catch {
                          toast.dismiss();
                          toast.error("Erro ao gerar link do Meet");
                        }
                      }}
                      className="apple-btn apple-btn-filled px-3 py-2 text-xs rounded-xl shrink-0 flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gerar Meet</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Switch checked={form.recorrente} onCheckedChange={v => setForm({ ...form, recorrente: v })} />
                  <label className="text-[0.8125rem] text-[#d2d2d7]">{t("ev.recorrente")}</label>
                </div>
                <div><label className="apple-input-label">{t("ev.descricao")}</label><textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} className="apple-input resize-none" /></div>

                {/* Notification selector - only for new events */}
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

        {/* Notify Dialog */}
        <NotifyDialog
          open={!!notifyTarget}
          onOpenChange={(o) => { if (!o) setNotifyTarget(null); }}
          type="evento"
          id={notifyTarget?.id || null}
          title={notifyTarget?.titulo || ""}
        />
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
          onConfirm={() => { if (confirmDelete) deleteMut.mutate(confirmDelete, { onSuccess: () => { toast.success(t("common.sucesso")); setConfirmDelete(null); }, onError: (e: any) => toast.error(e.message) }); }}
        />
      </div>
    </DashboardLayout>
  );
}
