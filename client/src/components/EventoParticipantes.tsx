import { useState, useMemo } from "react";
import { useEventoParticipantes, useUpdateParticipante, useDeleteParticipante } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { X, UserCheck, Users, Clock, CheckCircle2, XCircle, Trash2, Download, FileDown, Loader2, ArrowRight } from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { exportGenericPdf } from "@/lib/exportGenericPdf";
import ConfirmDialog from "@/components/ConfirmDialog";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  confirmado: { color: "#30D158", bg: "rgba(48,209,88,0.14)", label: "Confirmado" },
  lista_espera: { color: "#FF9F0A", bg: "rgba(255,159,10,0.14)", label: "Lista de Espera" },
  cancelado: { color: "#FF453A", bg: "rgba(255,69,58,0.14)", label: "Cancelado" },
  presente: { color: "#0A84FF", bg: "rgba(10,132,255,0.14)", label: "Presente" },
};

interface Props {
  eventoId: number;
  capacidade: number | null;
  onClose: () => void;
}

export default function EventoParticipantes({ eventoId, capacidade, onClose }: Props) {
  const { t } = useI18n();
  const { data: participantes, isLoading } = useEventoParticipantes(eventoId);
  const updateMut = useUpdateParticipante();
  const deleteMut = useDeleteParticipante();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const stats = useMemo(() => {
    if (!participantes) return { confirmados: 0, listaEspera: 0, presentes: 0, cancelados: 0, total: 0 };
    return {
      confirmados: participantes.filter((p) => p.status === "confirmado").length,
      listaEspera: participantes.filter((p) => p.status === "lista_espera").length,
      presentes: participantes.filter((p) => p.status === "presente").length,
      cancelados: participantes.filter((p) => p.status === "cancelado").length,
      total: participantes.length,
    };
  }, [participantes]);

  const filtered = useMemo(() => {
    if (!participantes) return [];
    if (filterStatus === "all") return participantes;
    return participantes.filter((p) => p.status === filterStatus);
  }, [participantes, filterStatus]);

  function handleStatusChange(id: number, newStatus: string) {
    updateMut.mutate(
      { id, eventoId, status: newStatus as any },
      {
        onSuccess: () => toast.success(t("common.sucesso")),
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  function handleDelete(id: number) {
    deleteMut.mutate(
      { id, eventoId },
      {
        onSuccess: () => { toast.success(t("common.sucesso")); setConfirmDelete(null); },
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  function handleExportXlsx() {
    const statusLabels: Record<string, string> = { confirmado: "Confirmado", lista_espera: "Lista de Espera", cancelado: "Cancelado", presente: "Presente" };
    const data = (participantes || []).map((p) => ({
      Nome: p.nomeCompleto,
      Email: p.email,
      Telefone: p.telefone,
      Status: statusLabels[p.status] || p.status,
      "Data Inscrição": new Date(p.createdAt).toLocaleDateString("pt-BR"),
      Observações: p.observacoes || "",
    }));
    exportToXlsx(data, `participantes-evento-${eventoId}`);
  }

  async function handleExportPdf() {
    const statusLabels: Record<string, string> = { confirmado: "Confirmado", lista_espera: "Lista de Espera", cancelado: "Cancelado", presente: "Presente" };
    const rows = (participantes || []).map((p) => [
      p.nomeCompleto,
      p.email,
      p.telefone,
      statusLabels[p.status] || p.status,
      new Date(p.createdAt).toLocaleDateString("pt-BR"),
    ]);
    await exportGenericPdf(
      "Lista de Participantes",
      "Embaixadores dos Legendários",
      ["Nome", "Email", "Telefone", "Status", "Data"],
      rows,
      `participantes-evento-${eventoId}`
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-hidden rounded-t-[20px] sm:rounded-[20px] border border-white/[0.08] bg-[#1c1c1e] flex flex-col animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <h2 className="text-lg font-bold text-white tracking-[-0.02em]">
            {t("ev.participantes")}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPdf} className="apple-btn apple-btn-gray p-2 rounded-xl" title="PDF">
              <FileDown className="w-4 h-4" />
            </button>
            <button onClick={handleExportXlsx} className="apple-btn apple-btn-gray p-2 rounded-xl" title="XLSX">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="apple-btn apple-btn-gray p-2 rounded-xl">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 p-4 border-b border-white/[0.06] shrink-0">
          {[
            { label: t("ev.confirmados"), value: stats.confirmados, color: "#30D158" },
            { label: t("ev.listaEspera"), value: stats.listaEspera, color: "#FF9F0A" },
            { label: t("ev.presentes"), value: stats.presentes, color: "#0A84FF" },
            { label: "Total", value: stats.total, color: "#FF6B00" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[0.625rem] text-[#86868b] mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto shrink-0">
          {[
            { key: "all", label: "Todos" },
            { key: "confirmado", label: t("ev.confirmados") },
            { key: "lista_espera", label: t("ev.listaEspera") },
            { key: "presente", label: t("ev.presentes") },
            { key: "cancelado", label: "Cancelado" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`text-[0.6875rem] py-1 px-3 rounded-lg shrink-0 transition-all ${
                filterStatus === f.key
                  ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30"
                  : "text-[#86868b] border border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Participant List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-[#48484a] mx-auto mb-3" />
              <p className="text-[0.8125rem] text-[#48484a]">Nenhum participante</p>
            </div>
          ) : (
            filtered.map((p) => {
              const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.confirmado;
              return (
                <div key={p.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FF6B00]/10 flex items-center justify-center shrink-0 text-[0.75rem] font-bold text-[#FF6B00]">
                      {p.nomeCompleto.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.8125rem] font-semibold text-white truncate">{p.nomeCompleto}</span>
                        <span
                          className="text-[0.625rem] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="text-[0.6875rem] text-[#6e6e73] mt-0.5 space-x-3">
                        <span>{p.email}</span>
                        <span>{p.telefone}</span>
                      </div>
                      <div className="text-[0.625rem] text-[#48484a] mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")} {new Date(p.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {p.observacoes && (
                        <p className="text-[0.6875rem] text-[#86868b] mt-1 italic">"{p.observacoes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-3 pt-2 border-t border-white/[0.04] flex-wrap">
                    {p.status === "confirmado" && (
                      <button
                        onClick={() => handleStatusChange(p.id, "presente")}
                        className="flex items-center gap-1 text-[0.6875rem] py-1.5 px-2.5 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 hover:bg-[#0A84FF]/20 transition-all"
                      >
                        <UserCheck className="w-3 h-3" /> {t("ev.checkin")}
                      </button>
                    )}
                    {p.status === "lista_espera" && (
                      <button
                        onClick={() => handleStatusChange(p.id, "confirmado")}
                        className="flex items-center gap-1 text-[0.6875rem] py-1.5 px-2.5 rounded-lg bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 hover:bg-[#30D158]/20 transition-all"
                      >
                        <ArrowRight className="w-3 h-3" /> Confirmar
                      </button>
                    )}
                    {p.status !== "cancelado" && (
                      <button
                        onClick={() => handleStatusChange(p.id, "cancelado")}
                        className="flex items-center gap-1 text-[0.6875rem] py-1.5 px-2.5 rounded-lg bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20 hover:bg-[#FF453A]/20 transition-all"
                      >
                        <XCircle className="w-3 h-3" /> Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="flex items-center gap-1 text-[0.6875rem] py-1.5 px-2.5 rounded-lg text-[#48484a] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
          onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        />
      </div>
    </div>
  );
}
