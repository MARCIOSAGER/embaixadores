import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEventos, useCreateEvento, useUpdateEvento, useDeleteEvento } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Calendar, CalendarDays, MapPin, Clock, Video, Repeat, ExternalLink, Loader2, Download, MessageCircle, FileDown, Send, Mail, List, ChevronLeft, ChevronRight, Users, Copy, CheckCircle2, XCircle } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf, buildGenericPdfDoc } from "@/lib/exportGenericPdf";
import { sendReportByEmail } from "@/lib/sendReportByEmail";
import SendReportDialog from "@/components/SendReportDialog";
import { supabase } from "@/lib/supabase";
import ConfirmDialog from "@/components/ConfirmDialog";
import NotifyDialog from "@/components/NotifyDialog";
import EventoParticipantes from "@/components/EventoParticipantes";
import BulkMessageDialog from "@/components/BulkMessageDialog";
import { useEmbaixadores } from "@/hooks/useSupabase";
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
  const [participantesEvento, setParticipantesEvento] = useState<any>(null);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [bulkInviteEvento, setBulkInviteEvento] = useState<any>(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", data: "", dataFim: "", local: "", tipo: "encontro", linkMeet: "", recorrente: false, status: "agendado", notificar: "both" as "both" | "whatsapp" | "email" | "none", capacidade: "" as string, inscricaoAberta: false, imagemUrl: "" });

  const { data: eventos, isLoading } = useEventos();
  const { data: allEmbaixadores } = useEmbaixadores();
  const createMut = useCreateEvento();
  const updateMut = useUpdateEvento();
  const deleteMut = useDeleteEvento();

  function resetForm() { setForm({ titulo: "", descricao: "", data: "", dataFim: "", local: "", tipo: "encontro", linkMeet: "", recorrente: false, status: "agendado", notificar: "both", capacidade: "", inscricaoAberta: false, imagemUrl: "" }); setEditingId(null); }
  function openEdit(ev: any) {
    setEditingId(ev.id);
    setForm({ titulo: ev.titulo || "", descricao: ev.descricao || "", data: tsToInputDT(ev.data), dataFim: tsToInputDT(ev.dataFim), local: ev.local || "", tipo: ev.tipo || "encontro", linkMeet: ev.linkMeet || "", recorrente: ev.recorrente || false, status: ev.status || "agendado", notificar: "none", capacidade: ev.capacidade != null ? String(ev.capacidade) : "", inscricaoAberta: ev.inscricaoAberta || false, imagemUrl: ev.imagemUrl || "" });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.titulo.trim() || !form.data) return toast.error(t("ev.tituloObrigatorio"));
    const d = { titulo: form.titulo, descricao: form.descricao || null, data: dateToTimestamp(form.data), dataFim: form.dataFim ? dateToTimestamp(form.dataFim) : null, local: form.local || null, tipo: form.tipo as any, linkMeet: form.linkMeet || null, recorrente: form.recorrente, status: form.status as any, capacidade: form.capacidade ? Number(form.capacidade) : null, inscricaoAberta: form.inscricaoAberta, imagemUrl: form.imagemUrl || null };
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

  const stats = useMemo(() => {
    const all = eventos || [];
    return {
      total: all.length,
      agendados: all.filter((e: any) => e.status === "agendado").length,
      realizados: all.filter((e: any) => e.status === "realizado").length,
      cancelados: all.filter((e: any) => e.status === "cancelado").length,
    };
  }, [eventos]);

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
    const monthStart = new Date(calYear, calMonth, 1).getTime();
    const monthEnd = new Date(calYear, calMonth + 1, 0, 23, 59, 59, 999).getTime();
    filtered.forEach((ev: any) => {
      if (!ev.data) return;
      const evStart = new Date(ev.data).getTime();
      const evEnd = ev.dataFim ? new Date(ev.dataFim).getTime() : evStart;
      // Skip events that don't overlap with this month at all
      if (evEnd < monthStart || evStart > monthEnd) return;
      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      const startDay = evStart < monthStart ? 1 : new Date(evStart).getDate();
      const endDay = evEnd > monthEnd ? daysInMonth : new Date(evEnd).getDate();
      // Only add days within this month
      const startMonth = new Date(evStart);
      const endMonth = new Date(evEnd);
      const effectiveStart = (startMonth.getFullYear() === calYear && startMonth.getMonth() === calMonth) ? startDay : 1;
      const effectiveEnd = (endMonth.getFullYear() === calYear && endMonth.getMonth() === calMonth) ? endDay : daysInMonth;
      for (let d = effectiveStart; d <= effectiveEnd; d++) {
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(ev);
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

  function goToToday() {
    const now = new Date();
    setCalMonth(now.getMonth());
    setCalYear(now.getFullYear());
    setSelectedDay(null);
  }
  function openNewForDay(day: number) {
    resetForm();
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T09:00`;
    setForm(f => ({ ...f, data: dateStr }));
    setDialogOpen(true);
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

  async function handleSendEmail(email: string) {
    const statusPt: Record<string, string> = { agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado" };
    const tipoPt: Record<string, string> = { encontro: "Encontro", conferencia: "Conferencia", retiro: "Retiro", treinamento: "Treinamento", outro: "Outro" };
    const rows = filtered.map((ev: any) => [
      ev.titulo || "",
      ev.data ? new Date(ev.data).toLocaleDateString("pt-BR") : "",
      ev.local || "",
      tipoPt[ev.tipo] || ev.tipo || "",
      statusPt[ev.status] || ev.status || "",
    ]);
    const doc = buildGenericPdfDoc(
      "Lista de Eventos",
      "Embaixadores dos Legendarios",
      ["Titulo", "Data", "Local", "Tipo", "Status"],
      rows,
    );
    const filename = `eventos-${new Date().toISOString().split("T")[0]}.pdf`;
    try {
      await sendReportByEmail(supabase, doc, email, t("report.assunto"), filename);
      toast.success(t("report.enviado"));
    } catch (err: any) {
      toast.error(t("report.erroEnvio") + ": " + (err.message || ""));
      throw err;
    }
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
              onClick={() => setSendEmailOpen(true)}
              className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2 shrink-0"
              title={t("report.enviarEmail")}
            >
              <Mail className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Email</span>
            </button>
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

        {/* Stats (list view only) */}
        {viewMode === "list" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard icon={Calendar} value={stats.total} label={t("ev.totalEventos") || "Total Eventos"} color="#FF6B00" delay={50} />
            <StatsCard icon={Clock} value={stats.agendados} label={t("ev.agendado")} color="#FF6B00" delay={100} />
            <StatsCard icon={CheckCircle2} value={stats.realizados} label={t("ev.realizado")} color="#30D158" delay={150} />
            <StatsCard icon={XCircle} value={stats.cancelados} label={t("ev.cancelado")} color="#FF453A" delay={200} />
          </div>
        )}

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
          <div className="ml-auto flex items-center bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${viewMode === "list" ? "bg-[#FF6B00] text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
            >
              <List className="w-3.5 h-3.5" /> {t("ev.lista")}
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${viewMode === "calendar" ? "bg-[#FF6B00] text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> {t("ev.calendario")}
            </button>
          </div>
        </div>

        {/* Content: List or Calendar */}
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="apple-skeleton h-28 rounded-2xl" />)}</div>
        ) : viewMode === "calendar" ? (
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer" aria-label="Mês anterior">
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer" aria-label="Próximo mês">
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-[-0.02em]">
                  {months[calMonth]} {calYear}
                </h2>
                {!(calMonth === today.getMonth() && calYear === today.getFullYear()) && (
                  <button onClick={goToToday} className="text-[0.75rem] px-3 py-1 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] hover:bg-[#FF6B00]/25 transition-colors font-medium cursor-pointer">
                    {t("ev.hoje")}
                  </button>
                )}
              </div>
              <button
                onClick={() => openNewForDay(today.getDate())}
                className="apple-btn apple-btn-filled text-[0.8125rem] py-2 px-4 cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                {t("ev.novo")}
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekdays.map(d => (
                <div key={d} className="text-center text-[0.6875rem] font-semibold text-[#86868b] py-2 uppercase tracking-widest">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 border border-white/[0.06] rounded-2xl overflow-hidden">
              {calDays.map((cell, i) => {
                const dayEvents = cell.current ? eventsInMonth.get(cell.day) || [] : [];
                const isTodayCell = cell.current && isToday(cell.day);
                const isSelected = cell.current && selectedDay === cell.day;
                const maxVisible = 2;
                const visibleEvents = dayEvents.slice(0, maxVisible);
                const remaining = dayEvents.length - maxVisible;
                const isWeekend = i % 7 === 0 || i % 7 === 6;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!cell.current) return;
                      if (dayEvents.length > 0) setSelectedDay(selectedDay === cell.day ? null : cell.day);
                      else openNewForDay(cell.day);
                    }}
                    className={`
                      relative flex flex-col min-h-[56px] sm:min-h-[90px] p-1.5 sm:p-2 transition-all border-b border-r border-white/[0.04] cursor-pointer
                      ${cell.current ? "hover:bg-white/[0.03]" : "cursor-default"}
                      ${!cell.current ? "bg-white/[0.01]" : isWeekend ? "bg-white/[0.015]" : "bg-transparent"}
                      ${isSelected ? "bg-[#FF6B00]/[0.08] hover:bg-[#FF6B00]/[0.12]" : ""}
                      ${isTodayCell ? "bg-[#FF6B00]/[0.06]" : ""}
                    `}
                  >
                    {/* Day number */}
                    <span className={`text-[0.75rem] sm:text-[0.8125rem] leading-none mb-1.5 ${
                      !cell.current ? "text-white/10"
                        : isTodayCell ? "text-black font-bold bg-[#FF6B00] w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center"
                        : isWeekend ? "text-white/40 font-medium"
                        : "text-white/70 font-medium"
                    }`}>
                      {cell.day}
                    </span>

                    {/* Event pills */}
                    <div className="flex flex-col gap-[3px] flex-1 min-w-0">
                      {visibleEvents.map((ev: any) => {
                        const color = TYPE_COLORS[ev.tipo] || "#8E8E93";
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                            className="hidden sm:block text-[10px] leading-tight px-1.5 py-[3px] rounded-md truncate cursor-pointer hover:brightness-125 transition-all font-medium"
                            style={{ backgroundColor: color + "25", color, borderLeft: `2px solid ${color}` }}
                            title={ev.titulo}
                          >
                            {ev.titulo}
                          </div>
                        );
                      })}
                      {/* Mobile: dots only */}
                      {dayEvents.length > 0 && (
                        <div className="flex sm:hidden gap-0.5 mt-auto">
                          {dayEvents.slice(0, 3).map((ev: any, j: number) => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[ev.tipo] || "#8E8E93" }} />
                          ))}
                        </div>
                      )}
                      {remaining > 0 && (
                        <span className="hidden sm:block text-[9px] text-[#86868b] px-1.5 cursor-pointer hover:text-white transition-colors">
                          {t("ev.mais").replace("{n}", String(remaining))}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected day detail panel */}
            {selectedDay !== null && (
              <div className="mt-4 space-y-3 animate-fade-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B00]/15 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-[#FF6B00]" />
                    </div>
                    <div>
                      <h3 className="text-[0.9375rem] font-semibold text-white">
                        {selectedDay} {months[calMonth]}
                      </h3>
                      {isToday(selectedDay) && <span className="text-[0.6875rem] text-[#FF6B00]">{t("ev.hoje")}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => openNewForDay(selectedDay)}
                    className="apple-btn apple-btn-filled text-[0.75rem] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    {t("ev.novo")}
                  </button>
                </div>
                {selectedDayEvents.length === 0 ? (
                  <div className="apple-card p-6 text-center">
                    <CalendarDays className="w-8 h-8 text-[#48484a] mx-auto mb-2" />
                    <p className="text-[0.8125rem] text-[#48484a]">{t("ev.semEventosDia")}</p>
                    <button onClick={() => openNewForDay(selectedDay)} className="text-[#FF6B00] text-[0.8125rem] font-medium mt-2 hover:underline cursor-pointer">
                      + {t("ev.novo")}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {selectedDayEvents.map((ev: any) => {
                      const sc = STATUS_MAP[ev.status] || STATUS_MAP.agendado;
                      const typeColor = TYPE_COLORS[ev.tipo] || "#8E8E93";
                      return (
                        <div key={ev.id} className="apple-card p-4 cursor-pointer hover:bg-white/[0.04] transition-all group" onClick={() => openEdit(ev)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(ev); } }}>
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[0.875rem] font-semibold text-white">{ev.titulo}</span>
                                <span className="apple-badge text-[0.625rem]" style={{ background: sc.bg, color: sc.color }}>{t(`ev.${ev.status}`)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.6875rem] text-[#6e6e73] mt-1">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{formatDateTime(ev.data, locale)}</span>
                                {ev.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{ev.local}</span>}
                              </div>
                            </div>
                            <Edit2 className="w-4 h-4 text-[#48484a] group-hover:text-[#FF6B00] transition-colors shrink-0" strokeWidth={1.5} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04] flex-wrap">
                    {ev.linkMeet && (
                      <a href={ev.linkMeet} target="_blank" rel="noopener" className="apple-btn apple-btn-gray flex-1 py-2 text-[0.75rem]">
                        <Video className="w-3.5 h-3.5" strokeWidth={1.5} />Google Meet
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setParticipantesEvento(ev); }}
                      className="apple-btn apple-btn-gray py-2 px-3 text-[0.75rem] text-[#0A84FF] hover:text-[#409CFF] min-h-[44px] flex items-center justify-center gap-1.5"
                      title={t("ev.participantes")}
                    >
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="hidden sm:inline">{t("ev.participantes")}</span>
                    </button>
                    {ev.inscricaoAberta && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/evento/${ev.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success(t("ev.linkCopiado"));
                        }}
                        className="apple-btn apple-btn-gray py-2 px-3 text-[0.75rem] text-[#FF6B00] hover:text-[#FF8C33] min-h-[44px] flex items-center justify-center gap-1.5"
                        title={t("ev.copiarLink")}
                      >
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Link</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setNotifyTarget(ev); }}
                      className="apple-btn apple-btn-gray py-2 px-3 text-[0.75rem] text-[#25D366] hover:text-[#128C7E] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Notificar embaixadores"
                      aria-label="Notificar embaixadores via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setBulkInviteEvento(ev); }}
                      className="apple-btn apple-btn-gray py-2 px-3 text-[0.75rem] text-[#FF6B00] hover:text-[#FF8C33] min-h-[44px] flex items-center justify-center gap-1.5"
                      title={t("bulk.convidar")}
                      aria-label={t("bulk.convidar")}
                    >
                      <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="hidden sm:inline">{t("bulk.convidar")}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="apple-input-label">{t("ev.capacidade")}</label>
                    <input type="number" min="0" value={form.capacidade} onChange={e => setForm({ ...form, capacidade: e.target.value })} className="apple-input" placeholder="Ilimitado" />
                  </div>
                  <div className="flex items-center gap-3 py-1">
                    <Switch checked={form.inscricaoAberta} onCheckedChange={v => setForm({ ...form, inscricaoAberta: v })} />
                    <label className="text-[0.8125rem] text-[#d2d2d7]">{t("ev.inscricaoAberta")}</label>
                  </div>
                </div>
                <div><label className="apple-input-label">Imagem / Banner URL</label><input value={form.imagemUrl} onChange={e => setForm({ ...form, imagemUrl: e.target.value })} className="apple-input" placeholder="https://..." /></div>
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

        {/* Send Email Dialog */}
        <SendReportDialog
          open={sendEmailOpen}
          onClose={() => setSendEmailOpen(false)}
          onSend={handleSendEmail}
        />

        {/* Participantes Panel */}
        {participantesEvento && (
          <EventoParticipantes
            eventoId={participantesEvento.id}
            capacidade={participantesEvento.capacidade ?? null}
            onClose={() => setParticipantesEvento(null)}
          />
        )}

        {/* Bulk Invite Dialog */}
        <BulkMessageDialog
          open={bulkInviteEvento !== null}
          onClose={() => setBulkInviteEvento(null)}
          recipients={(allEmbaixadores || [])
            .filter((e: any) => e.status === "ativo")
            .map((e: any) => ({ name: e.nomeCompleto, email: e.email || undefined, phone: e.telefone || undefined }))}
          defaultSubject={bulkInviteEvento ? `${t("bulk.convidar")}: ${bulkInviteEvento.titulo}` : undefined}
          context="event"
        />
      </div>
    </DashboardLayout>
  );
}
