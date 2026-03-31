import { useState, useMemo } from "react";
import { useInscricoes, useUpdateInscricao, useDeleteInscricao, useConvertInscricaoToEmbaixador } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  Search, ClipboardList, Clock, CheckCircle2, XCircle, ChevronRight, X,
  Mail, Phone, MapPin, Download, FileDown, Loader2, UserCheck, Instagram,
  Briefcase, Building2, Heart, Globe, DollarSign, Calendar
} from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf } from "@/lib/exportGenericPdf";

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  pendente: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)", label: "Pendente" },
  aprovado: { color: "#30D158", bg: "rgba(48,209,88,0.14)", label: "Aprovado" },
  rejeitado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)", label: "Rejeitado" },
};

type Inscricao = NonNullable<ReturnType<typeof useInscricoes>["data"]>[number];

export default function Inscricoes() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Inscricao | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<Inscricao | null>(null);
  const [confirmReject, setConfirmReject] = useState<Inscricao | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const searchTerm = useMemo(() => search || undefined, [search]);
  const { data: inscricoes, isLoading } = useInscricoes(searchTerm);

  const updateMut = useUpdateInscricao();
  const deleteMut = useDeleteInscricao();
  const convertMut = useConvertInscricaoToEmbaixador();

  const stats = useMemo(() => {
    const all = inscricoes || [];
    return {
      total: all.length,
      pendentes: all.filter((i) => i.status === "pendente").length,
      aprovados: all.filter((i) => i.status === "aprovado").length,
      rejeitados: all.filter((i) => i.status === "rejeitado").length,
    };
  }, [inscricoes]);

  const filtered = useMemo(() => {
    if (!inscricoes) return [];
    if (filter === "all") return inscricoes;
    return inscricoes.filter((i) => i.status === filter);
  }, [inscricoes, filter]);

  function handleApprove(insc: Inscricao) {
    convertMut.mutate(insc, {
      onSuccess: () => {
        toast.success(t("insc.mgmt.aprovadoSucesso"));
        setSelected(null);
        setConfirmApprove(null);
      },
      onError: (e: any) => toast.error(e.message),
    });
  }

  function handleReject(insc: Inscricao) {
    updateMut.mutate({ id: insc.id, status: "rejeitado" }, {
      onSuccess: () => {
        toast.success(t("insc.mgmt.rejeitadoSucesso"));
        setSelected(null);
        setConfirmReject(null);
      },
      onError: (e: any) => toast.error(e.message),
    });
  }

  function handleExport() {
    const data = filtered.map((insc) => ({
      "Nome": insc.nomeCompleto || "",
      "Email": insc.email || "",
      "Telefone": insc.telefone || "",
      "Cidade": insc.cidade || "",
      "Estado": insc.estado || "",
      "Status": insc.status || "",
      "Data Inscricao": insc.createdAt ? new Date(insc.createdAt).toLocaleDateString("pt-BR") : "",
      "Indicador": insc.nomeIndicador || "",
      "Num Legendario": insc.numeroLegendario || "",
    }));
    exportToXlsx(data, `inscricoes-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const rows = filtered.map((insc) => [
      insc.nomeCompleto || "",
      insc.email || "",
      insc.telefone || "",
      insc.cidade || "",
      (STATUS_MAP[insc.status] || STATUS_MAP.pendente).label,
    ]);
    exportGenericPdf(
      "Lista de Inscrições",
      "Inscrições dos Embaixadores Legendários",
      ["Nome", "Email", "Telefone", "Cidade", "Status"],
      rows,
      "inscricoes"
    );
  }

  function formatCreatedAt(dateStr: string | null) {
    if (!dateStr) return "\u2014";
    const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
    return new Date(dateStr).toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const filters = [
    { key: "all", label: t("common.todos") },
    { key: "pendente", label: t("insc.mgmt.pendentes") },
    { key: "aprovado", label: t("insc.mgmt.aprovados") },
    { key: "rejeitado", label: t("insc.mgmt.rejeitados") },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("insc.mgmt.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("insc.mgmt.subtitle")}</p>
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
          </div>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {[
            { icon: ClipboardList, val: stats.total, label: t("insc.mgmt.total"), color: "#FF6B00" },
            { icon: Clock, val: stats.pendentes, label: t("insc.mgmt.pendentes"), color: "#FF9F0A" },
            { icon: CheckCircle2, val: stats.aprovados, label: t("insc.mgmt.aprovados"), color: "#30D158" },
            { icon: XCircle, val: stats.rejeitados, label: t("insc.mgmt.rejeitados"), color: "#FF453A" },
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
            <input placeholder={t("insc.mgmt.buscar")} value={search} onChange={e => setSearch(e.target.value)} className="apple-input pl-10" />
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
              <ClipboardList className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#48484a]">{t("insc.mgmt.semInscricoes")}</p>
            <p className="text-[0.75rem] text-[#3a3a3c] mt-1">{t("insc.mgmt.semInscricoesDesc")}</p>
          </div>
        ) : (
          <div className="apple-list animate-fade-up" style={{ animationDelay: "150ms" }}>
            {filtered.map((insc) => {
              const sc = STATUS_MAP[insc.status] || STATUS_MAP.pendente;
              return (
                <div key={insc.id} className="apple-list-item group" onClick={() => setSelected(insc)}>
                  {insc.fotoUrl ? (
                    <img src={insc.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-[0.8125rem] font-bold shrink-0">
                      {insc.nomeCompleto?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.875rem] font-medium text-white truncate">{insc.nomeCompleto}</span>
                      <span className="apple-badge text-[0.6875rem]" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {insc.cidade && <span className="text-[0.6875rem] text-[#6e6e73] truncate">{insc.cidade}</span>}
                      {insc.nomeIndicador && <span className="text-[0.6875rem] text-[#FF9F0A] truncate">{insc.nomeIndicador}</span>}
                      <span className="text-[0.6875rem] text-[#48484a]">{formatCreatedAt(insc.createdAt)}</span>
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
                {/* Header */}
                <div className="flex items-center gap-4">
                  {selected.fotoUrl ? (
                    <img src={selected.fotoUrl} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-xl font-bold">
                      {selected.nomeCompleto?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white tracking-[-0.02em]">{selected.nomeCompleto}</h2>
                    <span className="apple-badge text-[0.625rem] mt-1" style={{ background: (STATUS_MAP[selected.status] || STATUS_MAP.pendente).bg, color: (STATUS_MAP[selected.status] || STATUS_MAP.pendente).color }}>
                      {(STATUS_MAP[selected.status] || STATUS_MAP.pendente).label}
                    </span>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b]" aria-label={t("common.fechar")}>
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Contact */}
                <div className="apple-card-inset p-4 space-y-3">
                  {selected.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.email}</span></div>}
                  {selected.telefone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.telefone}</span></div>}
                  {(selected.cidade || selected.estado) && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{[selected.cidade, selected.estado].filter(Boolean).join(", ")}</span></div>}
                  {selected.instagram && <div className="flex items-center gap-3"><Instagram className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">@{selected.instagram.replace(/^@/, "")}</span></div>}
                  {selected.dataNascimento && <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#48484a]" strokeWidth={1.5} /><span className="text-[0.8125rem] text-[#d2d2d7]">{selected.dataNascimento}</span></div>}
                </div>

                {/* Legendarios */}
                <DetailSection icon={UserCheck} title={t("insc.mgmt.sec.legendarios")} items={[
                  { label: "Numero Legendario", value: selected.numeroLegendario },
                  { label: "TOP Sede", value: selected.topSede },
                  { label: "TOPs Servidos", value: selected.qtdTopsServidos },
                  { label: "Area de Servico", value: selected.areaServico },
                  { label: "Conhecimento Previo", value: selected.conhecimentoPrevio },
                ]} />

                {/* Indicacao */}
                <DetailSection icon={Globe} title={t("insc.mgmt.sec.indicacao")} items={[
                  { label: "Indicado por Embaixador", value: selected.indicadoPorEmb ? "Sim" : "Nao" },
                  { label: "Nome Indicador", value: selected.nomeIndicador },
                  { label: "Sede Internacional", value: selected.sedeInternacional ? "Sim" : "Nao" },
                  { label: "Qual Sede", value: selected.nomeSedeInternacional },
                  { label: "Cargo de Lideranca", value: selected.cargoLideranca },
                ]} />

                {/* Familia */}
                <DetailSection icon={Heart} title={t("insc.mgmt.sec.familia")} items={[
                  { label: "Estado Civil", value: selected.estadoCivil },
                  { label: "Nome Esposa", value: selected.nomeEsposa },
                  { label: "Nasc. Esposa", value: selected.dataNascimentoEsposa },
                  { label: "Filhos", value: selected.qtdFilhos > 0 ? String(selected.qtdFilhos) : "0" },
                  { label: "Idades Filhos", value: selected.idadesFilhos },
                ]} />

                {/* Profissional */}
                <DetailSection icon={Briefcase} title={t("insc.mgmt.sec.profissional")} items={[
                  { label: "Profissao", value: selected.profissao },
                  { label: "Area de Atuacao", value: selected.areaAtuacao },
                  { label: "Possui Empresa", value: selected.possuiEmpresa },
                  { label: "Instagram Empresa", value: selected.instagramEmpresa },
                ]} />

                {/* Mercado */}
                <DetailSection icon={Building2} title={t("insc.mgmt.sec.mercado")} items={[
                  { label: "Segmento", value: selected.segmentoMercado },
                  { label: "Tempo Empreendedorismo", value: selected.tempoEmpreendedorismo },
                  { label: "Estrutura Equipe", value: selected.estruturaEquipe },
                ]} />

                {/* Investimento */}
                <DetailSection icon={DollarSign} title={t("insc.mgmt.sec.investimento")} items={[
                  { label: "Investe Clube Privado", value: selected.investeClubePrivado },
                  { label: "Participa Mentoria", value: selected.participaMentoria },
                  { label: "Valor Investimento", value: selected.valorInvestimento },
                  { label: "Disponibilidade Reuniao", value: selected.disponibilidadeReuniao },
                ]} />

                {/* Inscricao date */}
                <div className="apple-card-inset p-3 text-center">
                  <p className="text-[0.6875rem] text-[#6e6e73] uppercase tracking-wider">Data da Inscricao</p>
                  <p className="text-[0.8125rem] text-white font-medium mt-1">{formatCreatedAt(selected.createdAt)}</p>
                </div>

                {/* Actions */}
                {selected.status === "pendente" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmApprove(selected)}
                      disabled={convertMut.isPending}
                      className="apple-btn flex-1 py-2.5 bg-[#30D158]/10 text-[#30D158] hover:bg-[#30D158]/20 rounded-xl text-[0.8125rem] font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      {convertMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />}
                      {t("insc.mgmt.aprovar")}
                    </button>
                    <button
                      onClick={() => setConfirmReject(selected)}
                      disabled={updateMut.isPending}
                      className="apple-btn apple-btn-destructive flex-1 py-2.5"
                    >
                      <XCircle className="w-4 h-4" strokeWidth={1.5} />
                      {t("insc.mgmt.rejeitar")}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setConfirmDelete(selected.id)}
                  className="apple-btn apple-btn-destructive w-full py-2.5 text-[0.8125rem]"
                >
                  {t("emb.excluir")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Approve Dialog */}
        <ConfirmDialog
          open={confirmApprove !== null}
          onOpenChange={(o) => { if (!o) setConfirmApprove(null); }}
          onConfirm={() => { if (confirmApprove) handleApprove(confirmApprove); }}
          title={t("insc.mgmt.aprovar")}
          description={t("insc.mgmt.confirmarAprovar")}
          confirmLabel={t("insc.mgmt.aprovar")}
          variant="warning"
        />

        {/* Confirm Reject Dialog */}
        <ConfirmDialog
          open={confirmReject !== null}
          onOpenChange={(o) => { if (!o) setConfirmReject(null); }}
          onConfirm={() => { if (confirmReject) handleReject(confirmReject); }}
          title={t("insc.mgmt.rejeitar")}
          description={t("insc.mgmt.confirmarRejeitar")}
          confirmLabel={t("insc.mgmt.rejeitar")}
          variant="destructive"
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
          onConfirm={() => {
            if (confirmDelete) deleteMut.mutate(confirmDelete, {
              onSuccess: () => { toast.success(t("common.sucesso")); setSelected(null); setConfirmDelete(null); },
              onError: (e: any) => toast.error(e.message),
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

/* Detail section component */
function DetailSection({ icon: Icon, title, items }: {
  icon: React.ComponentType<any>;
  title: string;
  items: { label: string; value: string | null | undefined }[];
}) {
  const hasValues = items.some(i => i.value);
  if (!hasValues) return null;

  return (
    <div className="apple-card-inset p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
        <p className="text-[0.75rem] text-[#86868b] uppercase tracking-wider font-semibold">{title}</p>
      </div>
      {items.map((item) => item.value ? (
        <div key={item.label} className="flex justify-between items-start gap-4">
          <span className="text-[0.75rem] text-[#6e6e73] shrink-0">{item.label}</span>
          <span className="text-[0.8125rem] text-[#d2d2d7] text-right">{item.value}</span>
        </div>
      ) : null)}
    </div>
  );
}
