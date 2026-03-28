import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, MessageCircle, Mail, Users, UserCheck, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmbaixadores } from "@/hooks/useSupabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface NotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "evento" | "terca" | "entrevista";
  id: number | null;
  title: string;
}

export default function NotifyDialog({ open, onOpenChange, type, id, title }: NotifyDialogProps) {
  const { session } = useAuth();
  const { data: embaixadores } = useEmbaixadores();
  const [recipientMode, setRecipientMode] = useState<"all" | "select">("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [includeCandidato, setIncludeCandidato] = useState(true);
  const [sending, setSending] = useState(false);

  const activeEmbaixadores = (embaixadores || []).filter((e: any) => e.status === "ativo");

  useEffect(() => {
    if (open) {
      setRecipientMode("all");
      setSelectedIds([]);
      setIncludeCandidato(true);
    }
  }, [open]);

  function toggleId(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSend(channel: "whatsapp" | "email" | "both") {
    if (!id) return;
    setSending(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "apikey": ANON_KEY,
        },
        body: JSON.stringify({
          type,
          id,
          channel,
          recipients: recipientMode === "all" ? "all" : selectedIds,
          includeCandidato: type === "entrevista" ? includeCandidato : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const parts = [];
        if (data.results.whatsapp?.sent > 0) parts.push(`${data.results.whatsapp.sent} WhatsApp`);
        if (data.results.email?.sent > 0) parts.push(`${data.results.email.sent} Email`);
        if (data.results.whatsapp?.failed > 0 || data.results.email?.failed > 0) {
          const fails = (data.results.whatsapp?.failed || 0) + (data.results.email?.failed || 0);
          parts.push(`${fails} falha(s)`);
        }
        toast.success(`Enviado: ${parts.join(", ") || "nenhum destinatario"}`);
      } else {
        toast.error(data.error || "Erro ao enviar");
      }
    } catch {
      toast.error("Erro ao enviar notificacoes");
    } finally {
      setSending(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-[-0.02em] flex items-center gap-2">
            <Send className="w-5 h-5 text-[#FF6B00]" />
            Notificar
          </h2>
          <p className="text-[0.8125rem] text-[#86868b]">{title}</p>

          {/* Recipient mode */}
          <div className="space-y-2">
            <label className="text-[0.75rem] text-[#6e6e73] uppercase tracking-wider">Destinatarios</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientMode("all")}
                className={`flex-1 py-2 px-3 rounded-lg border text-[0.8125rem] flex items-center gap-2 justify-center transition-all ${recipientMode === "all" ? "border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]" : "border-white/[0.08] text-[#86868b] hover:border-white/[0.15]"}`}
              >
                <Users className="w-4 h-4" />
                Todos ({activeEmbaixadores.length})
              </button>
              <button
                onClick={() => setRecipientMode("select")}
                className={`flex-1 py-2 px-3 rounded-lg border text-[0.8125rem] flex items-center gap-2 justify-center transition-all ${recipientMode === "select" ? "border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]" : "border-white/[0.08] text-[#86868b] hover:border-white/[0.15]"}`}
              >
                <UserCheck className="w-4 h-4" />
                Selecionar
              </button>
            </div>
          </div>

          {/* Embaixador list (when selecting) */}
          {recipientMode === "select" && (
            <div className="space-y-1 max-h-48 overflow-y-auto apple-card-inset p-2 rounded-xl">
              {activeEmbaixadores.map((e: any) => (
                <button
                  key={e.id}
                  onClick={() => toggleId(e.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${selectedIds.includes(e.id) ? "bg-[#FF6B00]/10" : "hover:bg-white/[0.04]"}`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${selectedIds.includes(e.id) ? "border-[#FF6B00] bg-[#FF6B00]" : "border-white/[0.15]"}`}>
                    {selectedIds.includes(e.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] text-white truncate">{e.nomeCompleto}</p>
                    <p className="text-[0.6875rem] text-[#48484a] truncate">
                      {e.telefone && `Tel: ${e.telefone}`}
                      {e.telefone && e.email && " · "}
                      {e.email && e.email}
                    </p>
                  </div>
                </button>
              ))}
              {activeEmbaixadores.length === 0 && (
                <p className="text-[0.8125rem] text-[#48484a] text-center py-4">Nenhum embaixador ativo</p>
              )}
            </div>
          )}

          {/* Include candidate (entrevistas only) */}
          {type === "entrevista" && (
            <button
              onClick={() => setIncludeCandidato(!includeCandidato)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${includeCandidato ? "border-[#FF6B00] bg-[#FF6B00]/10" : "border-white/[0.08]"}`}
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${includeCandidato ? "border-[#FF6B00] bg-[#FF6B00]" : "border-white/[0.15]"}`}>
                {includeCandidato && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-[0.8125rem] text-[#d2d2d7]">Notificar candidato tambem</span>
            </button>
          )}

          {/* Channel buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <label className="text-[0.75rem] text-[#6e6e73] uppercase tracking-wider">Enviar via</label>
            {([
              { key: "both" as const, label: "WhatsApp + Email" },
              { key: "whatsapp" as const, label: "Somente WhatsApp" },
              { key: "email" as const, label: "Somente Email" },
            ]).map(opt => (
              <button
                key={opt.key}
                disabled={sending || (recipientMode === "select" && selectedIds.length === 0)}
                onClick={() => handleSend(opt.key)}
                className="apple-btn apple-btn-gray w-full py-3 text-[0.8125rem] flex items-center gap-2 justify-center disabled:opacity-40"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {opt.key !== "email" && <MessageCircle className="w-4 h-4 text-[#25D366]" />}
                    {opt.key !== "whatsapp" && <Mail className="w-4 h-4 text-[#FF6B00]" />}
                  </>
                )}
                {opt.label}
              </button>
            ))}
          </div>

          <button onClick={() => onOpenChange(false)} className="apple-btn apple-btn-gray w-full py-2.5 text-[0.8125rem]">
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
