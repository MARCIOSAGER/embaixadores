import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { Loader2, MapPin, Calendar, Clock, CheckCircle2, Users, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";

const LOGO = "/logo-legendarios.png";

export default function EventoInscricao() {
  const { t, locale } = useI18n();
  const [, params] = useRoute("/evento/:id");
  const eventoId = params?.id ? Number(params.id) : null;

  const [evento, setEvento] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);
  const [resultStatus, setResultStatus] = useState<"confirmado" | "lista_espera">("confirmado");

  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    telefone: "",
    observacoes: "",
  });

  useEffect(() => {
    if (!eventoId) return;
    (async () => {
      setLoading(true);
      const [evRes, countRes] = await Promise.all([
        supabase.from("eventos").select("*").eq("id", eventoId).single(),
        supabase
          .from("evento_participantes")
          .select("id", { count: "exact", head: true })
          .eq("eventoId", eventoId)
          .in("status", ["confirmado", "presente"]),
      ]);
      if (evRes.data) setEvento(evRes.data);
      setParticipantCount(countRes.count ?? 0);
      setLoading(false);
    })();
  }, [eventoId]);

  const isFull = evento?.capacidade ? participantCount >= evento.capacidade : false;
  const isClosed = evento && !evento.inscricaoAberta;
  const spotsLeft = evento?.capacidade ? evento.capacidade - participantCount : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventoId || !form.nomeCompleto || !form.email || !form.telefone) return;

    // Rate limiting: 30s cooldown
    const now = Date.now();
    if (now - lastSubmit < 30000) {
      alert(t("form.aguarde"));
      return;
    }

    // Duplicate email check per event via localStorage
    const submittedKey = `evento-submitted-${eventoId}-${form.email}`;
    if (localStorage.getItem(submittedKey)) {
      alert(t("form.jaEnviado"));
      return;
    }

    setLastSubmit(now);
    setSubmitting(true);
    try {
      // Re-check capacity at submission time
      const { count } = await supabase
        .from("evento_participantes")
        .select("id", { count: "exact", head: true })
        .eq("eventoId", eventoId)
        .in("status", ["confirmado", "presente"]);

      const currentCount = count ?? 0;
      const capacityReached = evento?.capacidade ? currentCount >= evento.capacidade : false;
      const status = capacityReached ? "lista_espera" : "confirmado";

      const { error } = await supabase.from("evento_participantes").insert({
        eventoId,
        nomeCompleto: form.nomeCompleto,
        email: form.email,
        telefone: form.telefone,
        observacoes: form.observacoes || null,
        status,
      });

      if (error) throw error;
      localStorage.setItem(`evento-submitted-${eventoId}-${form.email}`, "1");
      setResultStatus(status);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Erro ao realizar inscrição");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 40%, #0d0d0d 100%)" }}>
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 40%, #0d0d0d 100%)" }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#48484a] mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Evento não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 40%, #0d0d0d 100%)" }}>
      {/* Hero / Banner */}
      <div className="relative">
        {evento.imagemUrl ? (
          <div className="w-full h-56 sm:h-72 relative overflow-hidden">
            <img
              src={evento.imagemUrl}
              alt={evento.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
        ) : (
          <div
            className="w-full h-56 sm:h-72 relative"
            style={{ background: "linear-gradient(135deg, #1a0f00 0%, #FF6B00 50%, #1a0f00 100%)", opacity: 0.3 }}
          />
        )}

        <div className={`${evento.imagemUrl ? "absolute bottom-0 left-0 right-0" : "relative"} px-4 pb-6`}>
          <div className="max-w-lg mx-auto">
            <div className="flex justify-center mb-4">
              <img src={LOGO} alt="Logo" className="h-10 opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.03em] text-center">
              {evento.titulo}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Event Details */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
          <div className="flex items-center gap-3 text-[0.8125rem] text-[#d2d2d7]">
            <Calendar className="w-4 h-4 text-[#FF6B00] shrink-0" strokeWidth={1.5} />
            <span>
              {formatDateTime(evento.data, locale)}
              {evento.dataFim && <> — {formatDateTime(evento.dataFim, locale)}</>}
            </span>
          </div>
          {evento.local && (
            <div className="flex items-center gap-3 text-[0.8125rem] text-[#d2d2d7]">
              <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0" strokeWidth={1.5} />
              <span>{evento.local}</span>
            </div>
          )}
          {evento.descricao && (
            <p className="text-[0.8125rem] text-[#86868b] pt-2 border-t border-white/[0.06]">
              {evento.descricao}
            </p>
          )}
        </div>

        {/* Capacity Indicator */}
        {evento.capacidade && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#d2d2d7]">
                <Users className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
                <span>{participantCount} de {evento.capacidade} {t("ev.vagasPreenchidas")}</span>
              </div>
              {spotsLeft !== null && spotsLeft > 0 && (
                <span className="text-[0.75rem] text-[#30D158] font-medium">
                  {spotsLeft} {t("ev.vagasDisponiveis")}
                </span>
              )}
              {isFull && (
                <span className="text-[0.75rem] text-[#FF9F0A] font-medium">
                  {t("ev.listaEspera")}
                </span>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((participantCount / evento.capacidade) * 100, 100)}%`,
                  background: isFull
                    ? "linear-gradient(90deg, #FF9F0A, #FF6B00)"
                    : "linear-gradient(90deg, #30D158, #FF6B00)",
                }}
              />
            </div>
          </div>
        )}

        {/* Registration closed message */}
        {isClosed && (
          <div className="rounded-2xl border border-[#FF453A]/20 bg-[#FF453A]/10 p-5 text-center">
            <AlertCircle className="w-8 h-8 text-[#FF453A] mx-auto mb-2" />
            <p className="text-[0.875rem] font-semibold text-[#FF453A]">{t("ev.inscricoesEncerradas")}</p>
          </div>
        )}

        {/* Success Screen */}
        {submitted && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 text-center space-y-4 animate-fade-up">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              resultStatus === "confirmado" ? "bg-[#30D158]/20" : "bg-[#FF9F0A]/20"
            }`}>
              <CheckCircle2
                className={`w-8 h-8 ${resultStatus === "confirmado" ? "text-[#30D158]" : "text-[#FF9F0A]"}`}
                strokeWidth={1.5}
              />
            </div>
            <h2 className="text-xl font-bold text-white">
              {resultStatus === "confirmado" ? t("ev.inscricaoSucesso") : t("ev.inscricaoListaEspera")}
            </h2>
            <p className="text-[0.8125rem] text-[#86868b]">
              {resultStatus === "confirmado"
                ? "Sua presença está confirmada. Até lá!"
                : "Você será notificado caso uma vaga seja liberada."
              }
            </p>
          </div>
        )}

        {/* Registration Form */}
        {!submitted && !isClosed && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white tracking-[-0.02em]">
              {t("ev.inscricaoEvento")}
            </h2>

            {isFull && (
              <div className="flex items-center gap-2 text-[0.75rem] text-[#FF9F0A] bg-[#FF9F0A]/10 rounded-xl p-3 border border-[#FF9F0A]/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Vagas esgotadas. Sua inscrição será adicionada à {t("ev.listaEspera").toLowerCase()}.</span>
              </div>
            )}

            <div>
              <label className="block text-[0.75rem] font-medium text-[#86868b] mb-1.5 uppercase tracking-wider">
                Nome Completo *
              </label>
              <input
                value={form.nomeCompleto}
                onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[0.875rem] text-white placeholder-[#48484a] outline-none focus:border-[#FF6B00]/50 focus:ring-1 focus:ring-[#FF6B00]/30 transition-all"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-[0.75rem] font-medium text-[#86868b] mb-1.5 uppercase tracking-wider">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[0.875rem] text-white placeholder-[#48484a] outline-none focus:border-[#FF6B00]/50 focus:ring-1 focus:ring-[#FF6B00]/30 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-[0.75rem] font-medium text-[#86868b] mb-1.5 uppercase tracking-wider">
                WhatsApp *
              </label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[0.875rem] text-white placeholder-[#48484a] outline-none focus:border-[#FF6B00]/50 focus:ring-1 focus:ring-[#FF6B00]/30 transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-[0.75rem] font-medium text-[#86868b] mb-1.5 uppercase tracking-wider">
                Observações
              </label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[0.875rem] text-white placeholder-[#48484a] outline-none focus:border-[#FF6B00]/50 focus:ring-1 focus:ring-[#FF6B00]/30 transition-all resize-none"
                placeholder="Alguma observação? (opcional)"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !form.nomeCompleto || !form.email || !form.telefone}
              className="w-full py-3.5 rounded-xl font-semibold text-[0.875rem] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #FF6B00, #FF8C33)",
                boxShadow: "0 4px 20px rgba(255, 107, 0, 0.3)",
              }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : isFull ? (
                `Entrar na ${t("ev.listaEspera")}`
              ) : (
                "Confirmar Inscrição"
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-[0.6875rem] text-[#48484a] pb-4">
          Embaixadores dos Legendários
        </p>
      </div>
    </div>
  );
}
