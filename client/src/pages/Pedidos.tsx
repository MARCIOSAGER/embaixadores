import { useState, useMemo } from "react";
import { usePedidos, usePedidoItens, useUpdatePedido, useDeletePedido } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, ShoppingCart, Package, Truck, PackageCheck, ClipboardList,
  Loader2, Download, FileDown, Mail, ChevronRight, ChevronDown, Trash2, MessageSquare,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf, buildGenericPdfDoc } from "@/lib/exportGenericPdf";
import { sendReportByEmail } from "@/lib/sendReportByEmail";
import SendReportDialog from "@/components/SendReportDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { supabase } from "@/lib/supabase";

const STATUS_FLOW = ["solicitado", "separado", "enviado", "entregue"] as const;

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  solicitado: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)" },
  separado: { color: "#0A84FF", bg: "rgba(10,132,255,0.14)" },
  enviado: { color: "#AF52DE", bg: "rgba(175,82,222,0.14)" },
  entregue: { color: "#30D158", bg: "rgba(48,209,88,0.14)" },
};

const STATUS_ICONS: Record<string, typeof ShoppingCart> = {
  solicitado: ClipboardList,
  separado: Package,
  enviado: Truck,
  entregue: PackageCheck,
};

function formatBRL(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function OrderDetail({ pedidoId, onClose }: { pedidoId: number; onClose: () => void }) {
  const { t } = useI18n();
  const { data: itens, isLoading } = usePedidoItens(pedidoId);

  const total = useMemo(() => {
    if (!itens) return 0;
    return itens.reduce((acc: number, item: any) => acc + (parseFloat(item.precoUnitario) || 0) * (item.quantidade || 0), 0);
  }, [itens]);

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#86868b]" />
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-2 animate-fade-up">
      <p className="text-[0.75rem] font-semibold text-[#86868b] uppercase tracking-wider">{t("ped.itens")}</p>
      {itens && itens.length > 0 ? (
        <div className="space-y-1.5">
          {itens.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <p className="text-[0.8125rem] text-white font-medium truncate">
                  {item.produtos?.nome || `Produto #${item.produtoId}`}
                </p>
                <div className="flex gap-3 mt-0.5">
                  {item.tamanho && (
                    <span className="text-[0.6875rem] text-[#86868b]">{t("ped.tamanho")}: {item.tamanho}</span>
                  )}
                  {item.cor && (
                    <span className="text-[0.6875rem] text-[#86868b]">{t("ped.cor")}: {item.cor}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-[0.75rem] text-[#86868b]">{item.quantidade}x {formatBRL(item.precoUnitario)}</p>
                <p className="text-[0.8125rem] text-white font-semibold">{formatBRL(parseFloat(item.precoUnitario) * item.quantidade)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[0.8125rem] font-semibold text-white">{t("ped.valorTotal")}</span>
            <span className="text-[0.9375rem] font-bold text-[#FF6B00]">{formatBRL(total)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[0.75rem] text-[#48484a] py-2">Sem itens</p>
      )}
    </div>
  );
}

export default function Pedidos() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [obsDialogId, setObsDialogId] = useState<number | null>(null);
  const [obsText, setObsText] = useState("");

  const { data: pedidos, isLoading } = usePedidos();
  const updateMut = useUpdatePedido();
  const deleteMut = useDeletePedido();

  const stats = useMemo(() => {
    if (!pedidos) return { total: 0, solicitados: 0, separados: 0, enviados: 0, entregues: 0 };
    return {
      total: pedidos.length,
      solicitados: pedidos.filter((p: any) => p.status === "solicitado").length,
      separados: pedidos.filter((p: any) => p.status === "separado").length,
      enviados: pedidos.filter((p: any) => p.status === "enviado").length,
      entregues: pedidos.filter((p: any) => p.status === "entregue").length,
    };
  }, [pedidos]);

  const filtered = useMemo(() => {
    if (!pedidos) return [];
    let list = pedidos;
    if (filter !== "all") {
      list = list.filter((p: any) => p.status === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.embaixadores?.nomeCompleto?.toLowerCase().includes(q));
    }
    return list;
  }, [pedidos, filter, search]);

  function handleAdvanceStatus(pedido: any) {
    const currentIndex = STATUS_FLOW.indexOf(pedido.status);
    if (currentIndex < 0 || currentIndex >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    updateMut.mutate(
      { id: pedido.id, status: nextStatus },
      {
        onSuccess: () => toast.success(t("ped.statusAtualizado")),
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  function handleSaveObs() {
    if (obsDialogId === null) return;
    updateMut.mutate(
      { id: obsDialogId, observacoes: obsText || null },
      {
        onSuccess: () => { toast.success(t("ped.statusAtualizado")); setObsDialogId(null); },
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  function handleExport() {
    const data = filtered.map((p: any) => ({
      ID: p.id,
      Embaixador: p.embaixadores?.nomeCompleto || "",
      Status: p.status,
      Data: formatDate(p.createdAt),
      "Observações": p.observacoes || "",
    }));
    exportToXlsx(data, `pedidos-${new Date().toISOString().split("T")[0]}`);
  }

  function handleExportPdf() {
    const rows = filtered.map((p: any) => [
      String(p.id),
      p.embaixadores?.nomeCompleto || "",
      p.status || "",
      formatDate(p.createdAt),
      p.observacoes || "",
    ]);
    exportGenericPdf(
      "Pedidos",
      "Embaixadores dos Legendários",
      ["ID", "Embaixador", "Status", "Data", "Observações"],
      rows,
      "pedidos"
    );
  }

  async function handleSendEmail(email: string) {
    const rows = filtered.map((p: any) => [
      String(p.id),
      p.embaixadores?.nomeCompleto || "",
      p.status || "",
      formatDate(p.createdAt),
      p.observacoes || "",
    ]);
    const doc = buildGenericPdfDoc(
      "Pedidos",
      "Embaixadores dos Legendarios",
      ["ID", "Embaixador", "Status", "Data", "Observacoes"],
      rows,
    );
    const filename = `pedidos-${new Date().toISOString().split("T")[0]}.pdf`;
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
    { key: "solicitado", label: t("ped.solicitado") },
    { key: "separado", label: t("ped.separado") },
    { key: "enviado", label: t("ped.enviado") },
    { key: "entregue", label: t("ped.entregue") },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{t("ped.title")}</h1>
            <p className="text-[0.8125rem] text-[#86868b] mt-0.5">{t("ped.subtitle")}</p>
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
              <span className="hidden sm:inline">XLSX</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatsCard icon={ShoppingCart} value={stats.total} label={t("ped.total")} color="#FF6B00" delay={50} />
          <StatsCard icon={ClipboardList} value={stats.solicitados} label={t("ped.solicitado")} color="#FF9F0A" delay={100} />
          <StatsCard icon={Package} value={stats.separados} label={t("ped.separado")} color="#0A84FF" delay={150} />
          <StatsCard icon={Truck} value={stats.enviados} label={t("ped.enviado")} color="#AF52DE" delay={200} />
          <StatsCard icon={PackageCheck} value={stats.entregues} label={t("ped.entregue")} color="#30D158" delay={250} />
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
            <input
              placeholder={t("ped.buscar")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="apple-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`apple-btn text-[0.75rem] py-1.5 px-3.5 shrink-0 ${
                  filter === f.key ? "apple-btn-filled" : "apple-btn-gray"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="apple-skeleton h-[100px] rounded-2xl" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#86868b]">{t("ped.nenhum")}</p>
            <p className="text-[0.75rem] text-[#48484a] mt-1">{t("ped.nenhumDesc")}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "150ms" }}>
            {filtered.map((pedido: any) => {
              const sc = STATUS_COLORS[pedido.status] || STATUS_COLORS.solicitado;
              const StatusIcon = STATUS_ICONS[pedido.status] || ClipboardList;
              const isExpanded = expandedId === pedido.id;
              const currentIndex = STATUS_FLOW.indexOf(pedido.status);
              const canAdvance = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1;
              const nextStatus = canAdvance ? STATUS_FLOW[currentIndex + 1] : null;

              return (
                <div
                  key={pedido.id}
                  className="apple-card overflow-hidden transition-all duration-300 hover:border-white/[0.12]"
                >
                  {/* Order header */}
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: sc.bg }}
                    >
                      <StatusIcon className="w-5 h-5" style={{ color: sc.color }} strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[0.875rem] font-semibold text-white truncate">
                          {pedido.embaixadores?.nomeCompleto || "—"}
                        </h3>
                        <span
                          className="apple-badge text-[0.625rem] shrink-0"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {t(`ped.${pedido.status}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[0.6875rem] text-[#6e6e73]">
                          #{pedido.id} - {formatDate(pedido.createdAt)}
                        </span>
                        {pedido.observacoes && (
                          <span className="text-[0.6875rem] text-[#48484a] truncate max-w-[200px]">
                            {pedido.observacoes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Advance status button */}
                      {canAdvance && nextStatus && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(pedido); }}
                          disabled={updateMut.isPending}
                          className="apple-btn text-[0.6875rem] py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                          style={{
                            background: STATUS_COLORS[nextStatus].bg,
                            color: STATUS_COLORS[nextStatus].color,
                            border: `1px solid ${STATUS_COLORS[nextStatus].color}30`,
                          }}
                          title={t("ped.avancar")}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t(`ped.${nextStatus}`)}</span>
                        </button>
                      )}

                      {/* Observations button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setObsText(pedido.observacoes || ""); setObsDialogId(pedido.id); }}
                        className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-[#86868b] hover:bg-white/[0.08] transition-colors"
                        title={t("ped.observacoes")}
                      >
                        <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(pedido.id); }}
                        className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-[#FF453A] hover:bg-white/[0.08] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>

                      {/* Expand indicator */}
                      <ChevronDown
                        className={`w-4 h-4 text-[#48484a] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Status progress bar */}
                  <div className="px-4 pb-3">
                    <div className="flex gap-1">
                      {STATUS_FLOW.map((s, i) => (
                        <div
                          key={s}
                          className="flex-1 h-1 rounded-full transition-colors duration-300"
                          style={{
                            background: i <= currentIndex
                              ? STATUS_COLORS[s].color
                              : "rgba(255,255,255,0.04)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <OrderDetail pedidoId={pedido.id} onClose={() => setExpandedId(null)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Observations Dialog */}
        <Dialog open={obsDialogId !== null} onOpenChange={(open) => { if (!open) setObsDialogId(null); }}>
          <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-md p-0">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-lg font-bold text-white tracking-[-0.02em]">{t("ped.observacoes")}</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4 space-y-4">
              <textarea
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                className="apple-input min-h-[120px] resize-none"
                placeholder={t("ped.observacoes")}
                rows={4}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setObsDialogId(null)}
                  className="apple-btn apple-btn-gray flex-1 py-2.5 text-[0.8125rem]"
                >
                  {t("confirm.cancelar")}
                </button>
                <button
                  onClick={handleSaveObs}
                  disabled={updateMut.isPending}
                  className="apple-btn apple-btn-filled flex-1 py-2.5 text-[0.8125rem]"
                >
                  {updateMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("common.salvar")}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
          onConfirm={() => {
            if (confirmDelete !== null) {
              deleteMut.mutate(confirmDelete, {
                onSuccess: () => toast.success(t("ped.pedidoExcluido")),
                onError: (e: any) => toast.error(e.message),
              });
              setConfirmDelete(null);
            }
          }}
        />

        {/* Send Email Dialog */}
        <SendReportDialog
          open={sendEmailOpen}
          onClose={() => setSendEmailOpen(false)}
          onSend={handleSendEmail}
        />
      </div>
    </DashboardLayout>
  );
}
