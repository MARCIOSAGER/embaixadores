import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { Mail, Loader2 } from "lucide-react";

interface SendReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  title?: string;
}

export default function SendReportDialog({ open, onClose, onSend, title }: SendReportDialogProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const dialogTitle = title || t("report.enviarEmail");

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    try {
      await onSend(email.trim());
      setEmail("");
      onClose();
    } finally {
      setSending(false);
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      setEmail("");
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-md p-0" showCloseButton={false}>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#FF6B00]" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{dialogTitle}</h2>
          </div>

          <div>
            <label className="apple-input-label">{t("report.emailDest")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="apple-input"
              onKeyDown={(e) => { if (e.key === "Enter" && !sending) handleSend(); }}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleOpenChange(false)}
              className="apple-btn apple-btn-gray flex-1 py-2.5"
              disabled={sending}
            >
              {t("common.cancelar")}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !email.trim()}
              className="apple-btn apple-btn-filled flex-1 py-2.5"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("report.enviando")}
                </>
              ) : (
                t("report.enviar")
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
