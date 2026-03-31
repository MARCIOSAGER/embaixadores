import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, MessageCircle, Mail, Loader2, Check, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type Recipient = { name: string; email?: string; phone?: string };

interface BulkMessageDialogProps {
  open: boolean;
  onClose: () => void;
  recipients: Recipient[];
  defaultSubject?: string;
  context?: "event" | "general" | "reminder";
}

export default function BulkMessageDialog({ open, onClose, recipients, defaultSubject, context }: BulkMessageDialogProps) {
  const { session } = useAuth();
  const { t, locale } = useI18n();
  const [channel, setChannel] = useState<"both" | "whatsapp" | "email">("both");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ waSent: number; waFailed: number; emailSent: number; emailFailed: number } | null>(null);

  const recipientsWithPhone = useMemo(() => recipients.filter(r => r.phone), [recipients]);
  const recipientsWithEmail = useMemo(() => recipients.filter(r => r.email), [recipients]);

  const effectiveCount = useMemo(() => {
    if (channel === "whatsapp") return recipientsWithPhone.length;
    if (channel === "email") return recipientsWithEmail.length;
    return new Set([...recipientsWithPhone.map(r => r.name), ...recipientsWithEmail.map(r => r.name)]).size;
  }, [channel, recipientsWithPhone, recipientsWithEmail]);

  useEffect(() => {
    if (open) {
      setChannel("both");
      setSubject(defaultSubject || "");
      setResult(null);
      setSending(false);
      // Pre-fill message based on context
      if (context === "event") {
        setMessage(t("bulk.templateEvento"));
      } else if (context === "reminder") {
        setMessage(t("bulk.templateLembrete"));
      } else {
        setMessage("");
      }
    }
  }, [open, defaultSubject, context]);

  async function handleSend() {
    if (!message.trim()) {
      toast.error(t("bulk.mensagemObrigatoria"));
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Build per-recipient messages with {nome} replacement
      const phones = recipientsWithPhone.map(r => r.phone!);
      const emails = recipientsWithEmail.map(r => r.email!);

      // For WhatsApp, send individual messages with name replacement
      const waResults = { sent: 0, failed: 0 };
      const emailResults = { sent: 0, failed: 0 };

      if (channel === "whatsapp" || channel === "both") {
        // Send in batches via custom notify-all
        for (let i = 0; i < recipientsWithPhone.length; i += 10) {
          const batch = recipientsWithPhone.slice(i, i + 10);
          const batchPhones = batch.map(r => r.phone!);
          const batchMessage = batch.length === 1
            ? message.replace(/\{nome\}/g, batch[0].name)
            : message.replace(/\{nome\}/g, "");

          // For personalized messages, send one by one
          if (message.includes("{nome}")) {
            for (const r of batch) {
              const personalMsg = message.replace(/\{nome\}/g, r.name);
              const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-all`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${session?.access_token}`,
                  "apikey": ANON_KEY,
                },
                body: JSON.stringify({
                  type: "custom",
                  channel: "whatsapp",
                  message: personalMsg,
                  phones: [r.phone!],
                  locale,
                }),
              });
              const data = await res.json();
              if (data.success) {
                waResults.sent += data.results.whatsapp?.sent || 0;
                waResults.failed += data.results.whatsapp?.failed || 0;
              } else {
                waResults.failed++;
              }
            }
          } else {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-all`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`,
                "apikey": ANON_KEY,
              },
              body: JSON.stringify({
                type: "custom",
                channel: "whatsapp",
                message: batchMessage,
                phones: batchPhones,
                locale,
              }),
            });
            const data = await res.json();
            if (data.success) {
              waResults.sent += data.results.whatsapp?.sent || 0;
              waResults.failed += data.results.whatsapp?.failed || 0;
            } else {
              waResults.failed += batchPhones.length;
            }
          }
        }
      }

      if (channel === "email" || channel === "both") {
        // For email, send personalized if {nome} present, else bulk
        if (message.includes("{nome}")) {
          for (let i = 0; i < recipientsWithEmail.length; i += 10) {
            const batch = recipientsWithEmail.slice(i, i + 10);
            for (const r of batch) {
              const personalMsg = message.replace(/\{nome\}/g, r.name);
              const personalSubject = (subject || t("bulk.assuntoPadrao")).replace(/\{nome\}/g, r.name);
              const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-all`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${session?.access_token}`,
                  "apikey": ANON_KEY,
                },
                body: JSON.stringify({
                  type: "custom",
                  channel: "email",
                  subject: personalSubject,
                  message: personalMsg,
                  emails: [r.email!],
                  locale,
                }),
              });
              const data = await res.json();
              if (data.success) {
                emailResults.sent += data.results.email?.sent || 0;
                emailResults.failed += data.results.email?.failed || 0;
              } else {
                emailResults.failed++;
              }
            }
          }
        } else {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-all`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.access_token}`,
              "apikey": ANON_KEY,
            },
            body: JSON.stringify({
              type: "custom",
              channel: "email",
              subject: subject || t("bulk.assuntoPadrao"),
              message,
              emails,
              locale,
            }),
          });
          const data = await res.json();
          if (data.success) {
            emailResults.sent += data.results.email?.sent || 0;
            emailResults.failed += data.results.email?.failed || 0;
          } else {
            emailResults.failed += emails.length;
          }
        }
      }

      setResult({
        waSent: waResults.sent,
        waFailed: waResults.failed,
        emailSent: emailResults.sent,
        emailFailed: emailResults.failed,
      });

      const totalSent = waResults.sent + emailResults.sent;
      const totalFailed = waResults.failed + emailResults.failed;

      if (totalSent > 0 && totalFailed === 0) {
        toast.success(t("bulk.enviado"));
      } else if (totalSent > 0) {
        toast.warning(`${totalSent} ${t("bulk.enviadosParcial")}, ${totalFailed} ${t("notify.falhas")}`);
      } else {
        toast.error(t("bulk.erro"));
      }
    } catch {
      toast.error(t("bulk.erro"));
    } finally {
      setSending(false);
    }
  }

  const channels: { key: "both" | "whatsapp" | "email"; label: string; icon: React.ReactNode }[] = [
    { key: "both", label: t("bulk.ambos"), icon: <><MessageCircle className="w-4 h-4 text-[#25D366]" /><Mail className="w-4 h-4 text-[#FF6B00]" /></> },
    { key: "whatsapp", label: t("bulk.whatsapp"), icon: <MessageCircle className="w-4 h-4 text-[#25D366]" /> },
    { key: "email", label: t("bulk.email"), icon: <Mail className="w-4 h-4 text-[#FF6B00]" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-[-0.02em] flex items-center gap-2">
            <Send className="w-5 h-5 text-[#FF6B00]" />
            {t("bulk.title")}
          </h2>

          {/* Result summary */}
          {result && (
            <div className="apple-card-inset rounded-xl p-4 space-y-1">
              <p className="text-[0.8125rem] font-semibold text-white flex items-center gap-2">
                <Check className="w-4 h-4 text-[#30D158]" />
                {t("bulk.resumo")}
              </p>
              {(result.waSent > 0 || result.waFailed > 0) && (
                <p className="text-[0.75rem] text-[#86868b]">
                  WhatsApp: {result.waSent} {t("bulk.enviadosLabel")}{result.waFailed > 0 ? `, ${result.waFailed} ${t("notify.falhas")}` : ""}
                </p>
              )}
              {(result.emailSent > 0 || result.emailFailed > 0) && (
                <p className="text-[0.75rem] text-[#86868b]">
                  Email: {result.emailSent} {t("bulk.enviadosLabel")}{result.emailFailed > 0 ? `, ${result.emailFailed} ${t("notify.falhas")}` : ""}
                </p>
              )}
            </div>
          )}

          {/* Channel selector */}
          <div className="space-y-2">
            <label className="text-[0.75rem] text-[#6e6e73] uppercase tracking-wider">{t("notify.enviarVia")}</label>
            <div className="flex gap-2">
              {channels.map(ch => (
                <button
                  key={ch.key}
                  onClick={() => setChannel(ch.key)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-[0.8125rem] flex items-center gap-1.5 justify-center transition-all ${channel === ch.key ? "border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]" : "border-white/[0.08] text-[#86868b] hover:border-white/[0.15]"}`}
                >
                  {ch.icon}
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient count */}
          <div className="flex items-center gap-2 text-[0.8125rem] text-[#86868b]">
            <Users className="w-4 h-4" />
            {t("bulk.enviarPara")} <span className="text-white font-semibold">{effectiveCount}</span> {t("bulk.embaixadores")}
            {channel !== "email" && <span className="text-[#48484a]">({recipientsWithPhone.length} tel)</span>}
            {channel !== "whatsapp" && <span className="text-[#48484a]">({recipientsWithEmail.length} email)</span>}
          </div>

          {/* Subject (email only) */}
          {(channel === "email" || channel === "both") && (
            <div>
              <label className="apple-input-label">{t("bulk.assunto")}</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={t("bulk.assuntoPadrao")}
                className="apple-input"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="apple-input-label">{t("bulk.mensagem")}</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              className="apple-input resize-none"
              placeholder={t("bulk.mensagemPlaceholder")}
            />
            <p className="text-[0.6875rem] text-[#48484a] mt-1">
              {t("bulk.variavelNome")}
            </p>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || effectiveCount === 0}
            className="apple-btn apple-btn-filled w-full py-3 text-[0.8125rem] flex items-center gap-2 justify-center disabled:opacity-40"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("bulk.enviando")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t("bulk.enviarPara")} {effectiveCount} {t("bulk.embaixadores")}
              </>
            )}
          </button>

          <button onClick={onClose} className="apple-btn apple-btn-gray w-full py-2.5 text-[0.8125rem]">
            {t("notify.cancelar")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
