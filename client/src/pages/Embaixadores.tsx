import { useState, useMemo } from "react";
import { useEmbaixadores, useEmbaixadoresStats, useCreateEmbaixador, useUpdateEmbaixador, useDeleteEmbaixador } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, Users, UserCheck, Clock, UserX, ChevronRight, X, Mail, Phone, MapPin, Loader2, Download, FileDown, Link2, MessageCircle } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import StatsCard from "@/components/StatsCard";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf, buildGenericPdfDoc } from "@/lib/exportGenericPdf";
import { sendReportByEmail } from "@/lib/sendReportByEmail";
import SendReportDialog from "@/components/SendReportDialog";
import { supabase } from "@/lib/supabase";
import { formatDate, dateToTs, tsToDate } from "@/lib/dateUtils";
import ConfirmDialog from "@/components/ConfirmDialog";
import BulkMessageDialog from "@/components/BulkMessageDialog";

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
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [bulkMsgOpen, setBulkMsgOpen] = useState(false);
  const [form, setForm] = useState({
    nomeCompleto: "", numeroLegendario: "", numeroEmbaixador: "",
    email: "", telefone: "", cidade: "", estado: "",
    profissao: "", empresa: "", dataNascimento: "", dataIngresso: "",
    dataRenovacao: "", status: "ativo" as string, idioma: "pt" as string, observacoes: "",
    estadoCivil: "", nomeEsposa: "", dataNascimentoEsposa: "", qtdFilhos: 0, idadesFilhos: "",
  });

  const searchTerm = useMemo(() => search || undefined, [search]);
  const { data: embaixadores, isLoading } = useEmbaixadores(searchTerm);
  const { data: stats } = useEmbaixadoresStats();

  const createMut = useCreateEmbaixador();
  const updateMut = useUpdateEmbaixador();
  const deleteMut = useDeleteEmbaixador();

  function resetForm() {
    setForm({ nomeCompleto: "", numeroLegendario: "", numeroEmbaixador: "", email: "", telefone: "", cidade: "", estado: "", profissao: "", empresa: "", dataNascimento: "", dataIngresso: "", dataRenovacao: "", status: "ativo", idioma: "pt", observacoes: "", estadoCivil: "", nomeEsposa: "", dataNascimentoEsposa: "", qtdFilhos: 0, idadesFilhos: "" });
    setEditingId(null);
  }

  function openEdit(emb: any) {
    setEditingId(emb.id);
    setForm({
      nomeCompleto: emb.nomeCompleto || "", numeroLegendario: emb.numeroLegendario || "", numeroEmbaixador: emb.numeroEmbaixador || "",
      email: emb.email || "", telefone: emb.telefone || "", cidade: emb.cidade || "", estado: emb.estado || "",
      profissao: emb.profissao || "", empresa: emb.empresa || "",
      dataNascimento: tsToDate(emb.dataNascimento), dataIngresso: tsToDate(emb.dataIngresso),
      dataRenovacao: tsToDate(emb.dataRenovacao), status: emb.status || "ativo", idioma: emb.idioma || "pt", observacoes: emb.observacoes || "",
      estadoCivil: emb.estadoCivil || "", nomeEsposa: emb.nomeEsposa || "", dataNascimentoEsposa: tsToDate(emb.dataNascimentoEsposa), qtdFilhos: emb.qtdFilhos || 0, idadesFilhos: emb.idadesFilhos || "",
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
      idioma: form.idioma as "pt" | "es" | "en", observacoes: form.observacoes || null,
      estadoCivil: form.estadoCivil || null, nomeEsposa: form.nomeEsposa || null,
      dataNascimentoEsposa: dateToTs(form.dataNascimentoEsposa), qtdFilhos: form.qtdFilhos, idadesFilhos: form.idadesFilhos || null,
      ...(!editingId ? { codigoIndicacao: Math.random().toString(36).substring(2, 8) } : {}),
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

  function handleExport() {
    const data = filtered.map((emb: any) => ({
      "Nº Legendário": emb.numeroLegendario || "",
      "Nº Embaixador": emb.numeroEmbaixador || "",
      "Nome": emb.nomeCompleto || "",
      "Email": emb.email || "",
      "Telefone": emb.telefone || "",
      "Cidade": emb.cidade || "",
      "Estado": emb.estado || "",
      "Profissão": emb.profissao || "",
      "Status": emb.status === "ativo" ? "Ativo" : emb.status === "inativo" ? "Inativo" : "Pendente Renovação",
      "Nascimento": emb.dataNascimento ? new Date(emb.dataNascimento).toLocaleDateString("pt-BR") : "",
      "Data Ingresso": emb.dataIngresso ? new Date(emb.dataIngresso).toLocaleDateString("pt-BR") : "",
      "Renovação": emb.dataRenovacao ? new Date(emb.dataRenovacao).toLocaleDateString("pt-BR") : "",
    }));
    exportToXlsx(data, `embaixadores-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const statusPt: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", pendente_renovacao: "Pendente Renovação" };
    const rows = filtered.map((emb: any) => [
      emb.numeroLegendario || "—",
      emb.numeroEmbaixador || "—",
      emb.nomeCompleto || "",
      emb.telefone || "",
      emb.cidade || "",
      statusPt[emb.status] || emb.status || "",
    ]);
    exportGenericPdf(
      "Lista de Embaixadores",
      "Embaixadores dos Legendários",
      ["Nº Leg.", "Nº Emb.", "Nome", "Telefone", "Cidade", "Status"],
      rows,
      "embaixadores"
    );
  }

  async function handleSendEmail(email: string) {
    const statusPt: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", pendente_renovacao: "Pendente Renovacao" };
    const rows = filtered.map((emb: any) => [
      emb.numeroLegendario || "\u2014",
      emb.numeroEmbaixador || "\u2014",
      emb.nomeCompleto || "",
      emb.telefone || "",
      emb.cidade || "",
      statusPt[emb.status] || emb.status || "",
    ]);
    const doc = buildGenericPdfDoc(
      "Lista de Embaixadores",
      "Embaixadores dos Legendarios",
      ["No Leg.", "No Emb.", "Nome", "Telefone", "Cidade", "Status"],
      rows,
    );
    const filename = `embaixadores-${new Date().toISOString().split("T")[0]}.pdf`;
    try {
      await sendReportByEmail(supabase, doc, email, t("report.assunto"), filename);
      toast.success(t("report.enviado"));
    } catch (err: any) {
      toast.error(t("report.erroEnvio") + ": " + (err.message || ""));
      throw err;
    }
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkMsgOpen(true)}
              className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2 shrink-0"
              title={t("bulk.enviarMsg")}
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t("bulk.enviarMsg")}</span>
            </button>
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
              <span className="hidden sm:inline">{t("emb.novo")}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard icon={Users} value={stats?.total || 0} label={t("emb.total")} color="#FF6B00" delay={50} />
          <StatsCard icon={UserCheck} value={stats?.ativos || 0} label={t("emb.ativo")} color="#30D158" delay={100} />
          <StatsCard icon={Clock} value={stats?.pendentes || 0} label={t("emb.pendRenov")} color="#FF9F0A" delay={150} />
          <StatsCard icon={UserX} value={stats?.inativos || 0} label={t("emb.inativo")} color="#FF453A" delay={200} />
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
            <input placeholder={t("emb.buscar")} value={search} onChange={e => setSearch(e.target.value)} className="apple-input" style={{ paddingLeft: "2.5rem" }} aria-label={t("emb.buscar")} />
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
                <div key={emb.id} className="apple-list-item group" onClick={() => setSelected(emb)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(emb); } }}>
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
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center apple-sheet-backdrop" onClick={() => setSelected(null)} onKeyDown={(e) => { if (e.key === "Escape") setSelected(null); }} role="dialog" aria-modal="true" aria-label={selected.nomeCompleto}>
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
                  <button onClick={() => setSelected(null)} className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b]" aria-label="Fechar">
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

                {/* Familia */}
                {(selected.estadoCivil || selected.qtdFilhos > 0) && (
                  <div className="apple-card-inset p-4 space-y-2">
                    <p className="text-[0.6875rem] text-[#6e6e73] uppercase tracking-wider mb-2">{t("emb.familia")}</p>
                    {selected.estadoCivil && <p className="text-[0.8125rem] text-[#d2d2d7]">{t("emb.estadoCivil")}: {t(`emb.${selected.estadoCivil}`)}</p>}
                    {selected.nomeEsposa && <p className="text-[0.8125rem] text-[#d2d2d7]">{t("emb.nomeEsposa")}: {selected.nomeEsposa}</p>}
                    {selected.dataNascimentoEsposa && <p className="text-[0.8125rem] text-[#d2d2d7]">{t("emb.nascEsposa")}: {formatDate(selected.dataNascimentoEsposa, locale)}</p>}
                    {selected.qtdFilhos > 0 && <p className="text-[0.8125rem] text-[#d2d2d7]">{t("emb.qtdFilhos")}: {selected.qtdFilhos}{selected.idadesFilhos ? ` (${selected.idadesFilhos})` : ""}</p>}
                  </div>
                )}

                {selected.observacoes && (
                  <div className="apple-card-inset p-4">
                    <p className="text-[0.6875rem] text-[#6e6e73] uppercase tracking-wider mb-2">{t("emb.observacoes")}</p>
                    <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed">{selected.observacoes}</p>
                  </div>
                )}

                {selected.codigoIndicacao && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/inscricao?ref=${selected.codigoIndicacao}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link de indicação copiado!");
                      }}
                      className="apple-btn apple-btn-filled w-full py-2.5"
                    >
                      <Link2 className="w-4 h-4" strokeWidth={1.5} />Copiar Link de Indicação
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/inscricao?ref=${selected.codigoIndicacao}`;
                        const msg = encodeURIComponent(`Olá! Você foi convidado para se tornar um Embaixador dos Legendários. Preencha sua inscrição aqui: ${url}`);
                        window.open(`https://wa.me/?text=${msg}`, "_blank");
                      }}
                      className="apple-btn apple-btn-tinted w-full py-2.5"
                    >
                      <MessageCircle className="w-4 h-4" strokeWidth={1.5} />Enviar via WhatsApp
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { openEdit(selected); setSelected(null); }} className="apple-btn apple-btn-tinted flex-1 py-2.5">
                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />{t("emb.editar")}
                  </button>
                  <button onClick={() => setConfirmDelete(selected.id)} className="apple-btn apple-btn-destructive flex-1 py-2.5">
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
                  <div><label className="apple-input-label">{t("emb.telefone")}</label><PhoneInput value={form.telefone} onChange={(val) => setForm({ ...form, telefone: val })} /></div>
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
                {/* Familia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="apple-input-label">{t("emb.estadoCivil")}</label>
                    <select value={form.estadoCivil} onChange={e => setForm({ ...form, estadoCivil: e.target.value })} className="apple-input">
                      <option value="">{t("common.selecione")}</option>
                      <option value="solteiro">{t("emb.solteiro")}</option>
                      <option value="casado">{t("emb.casado")}</option>
                      <option value="divorciado">{t("emb.divorciado")}</option>
                      <option value="viuvo">{t("emb.viuvo")}</option>
                    </select>
                  </div>
                  <div><label className="apple-input-label">{t("emb.qtdFilhos")}</label><input type="number" min={0} value={form.qtdFilhos} onChange={e => setForm({ ...form, qtdFilhos: parseInt(e.target.value) || 0 })} className="apple-input" /></div>
                </div>
                {form.estadoCivil === "casado" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="apple-input-label">{t("emb.nomeEsposa")}</label><input value={form.nomeEsposa} onChange={e => setForm({ ...form, nomeEsposa: e.target.value })} className="apple-input" /></div>
                    <div><label className="apple-input-label">{t("emb.nascEsposa")}</label><input type="date" value={form.dataNascimentoEsposa} onChange={e => setForm({ ...form, dataNascimentoEsposa: e.target.value })} className="apple-input text-[0.8125rem]" /></div>
                  </div>
                )}
                {form.qtdFilhos > 0 && (
                  <div><label className="apple-input-label">{t("emb.idadesFilhos")}</label><input value={form.idadesFilhos} onChange={e => setForm({ ...form, idadesFilhos: e.target.value })} className="apple-input" placeholder="Ex: 5, 8, 12" /></div>
                )}
                <div>
                  <label className="apple-input-label">{t("emb.status")}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="apple-input">
                    <option value="ativo">{t("emb.ativo")}</option>
                    <option value="inativo">{t("emb.inativo")}</option>
                    <option value="pendente_renovacao">{t("emb.pendRenov")}</option>
                  </select>
                </div>
                <div>
                  <label className="apple-input-label">Idioma preferido</label>
                  <select value={form.idioma} onChange={e => setForm({ ...form, idioma: e.target.value })} className="apple-input">
                    <option value="pt">Portugues</option>
                    <option value="es">Espanol</option>
                    <option value="en">English</option>
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
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
          onConfirm={() => { if (confirmDelete) deleteMut.mutate(confirmDelete, { onSuccess: () => { toast.success(t("common.sucesso")); setSelected(null); setConfirmDelete(null); }, onError: (e: any) => toast.error(e.message) }); }}
        />

        {/* Send Email Dialog */}
        <SendReportDialog
          open={sendEmailOpen}
          onClose={() => setSendEmailOpen(false)}
          onSend={handleSendEmail}
        />

        {/* Bulk Message Dialog */}
        <BulkMessageDialog
          open={bulkMsgOpen}
          onClose={() => setBulkMsgOpen(false)}
          recipients={(embaixadores || [])
            .filter((e: any) => e.status === "ativo")
            .map((e: any) => ({ name: e.nomeCompleto, email: e.email || undefined, phone: e.telefone || undefined }))}
          context="general"
        />
      </div>
    </DashboardLayout>
  );
}
