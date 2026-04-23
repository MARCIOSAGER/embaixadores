import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useEmbaixador } from "@/hooks/useSupabase";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, FileDown, Mail, MapPin, Calendar, Users, MapPinned, Award, Shield, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { exportEmbaixadorPdf } from "@/lib/exportEmbaixadorPdf";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ativo:               { label: "Ativo",              color: "#30D158", bg: "rgba(48,209,88,0.14)" },
  inativo:             { label: "Inativo",            color: "#FF453A", bg: "rgba(255,69,58,0.14)" },
  pendente_renovacao:  { label: "Pendente Renovação", color: "#FF9F0A", bg: "rgba(255,159,10,0.14)" },
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="emb-section apple-card-inset p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
        <h3 className="text-[0.6875rem] text-[#6e6e73] uppercase tracking-wider font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[0.75rem] text-[#86868b] shrink-0">{label}</span>
      <span className="text-[0.8125rem] text-white font-medium text-right">{value}</span>
    </div>
  );
}

function YesNoBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#6e6e73]">—</span>;
  const yes = value === "sim";
  return (
    <span style={{ color: yes ? "#30D158" : "#FF453A" }} className="font-medium">
      {yes ? "Sim" : "Não"}
    </span>
  );
}

export default function EmbaixadorDetail() {
  const { t, locale } = useI18n();
  const [, params] = useRoute("/embaixador/:id");
  const id = params?.id ? Number(params.id) : 0;
  const { data: emb, isLoading, error } = useEmbaixador(id);
  const [exporting, setExporting] = useState(false);

  async function handleExportPdf() {
    if (!emb) return;
    setExporting(true);
    try {
      await exportEmbaixadorPdf(emb as any, locale);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !emb) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <p className="text-[#86868b] mb-4">Embaixador não encontrado.</p>
          <Link href="/embaixadores" className="apple-btn apple-btn-filled inline-flex">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const sc = STATUS_MAP[emb.status] || STATUS_MAP.ativo;
  const programas = emb.programasParticipou ? emb.programasParticipou.split(",").map(s => s.trim()).filter(Boolean) : [];
  const aberturas = emb.aberturasPaises ? emb.aberturasPaises.split(",").map(s => s.trim()).filter(Boolean) : [];

  return (
    <DashboardLayout>
      <div className="emb-detail-page space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/embaixadores" className="apple-btn apple-btn-gray py-2 px-4 text-[0.8125rem]">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar
          </Link>
          <button onClick={handleExportPdf} disabled={exporting} className="apple-btn apple-btn-filled py-2 px-4 text-[0.8125rem]">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" strokeWidth={1.5} />}
            Baixar ficha em PDF
          </button>
        </div>

        {/* Profile header */}
        <div className="emb-header apple-card-inset p-6">
          <div className="flex items-center gap-5 flex-wrap">
            {emb.fotoUrl ? (
              <img src={emb.fotoUrl} alt={emb.nomeCompleto} className="w-20 h-20 rounded-full object-cover border-2 border-[#FF6B00]" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-3xl font-bold">
                {emb.nomeCompleto?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white tracking-[-0.02em]">{emb.nomeCompleto}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {emb.numeroLegendario && <span className="apple-badge" style={{ background: "rgba(255,159,10,0.14)", color: "#FF9F0A" }}>L#{emb.numeroLegendario}</span>}
                {emb.numeroEmbaixador && <span className="apple-badge" style={{ background: "rgba(255,107,0,0.14)", color: "#FF6B00" }}>E#{emb.numeroEmbaixador}</span>}
                <span className="apple-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Contato */}
          <Section title="Contato" icon={Mail}>
            <Field label="Email" value={emb.email} />
            <Field label="Telefone" value={emb.telefone} />
            <Field label="Instagram" value={emb.instagram} />
            <Field label="Idioma" value={emb.idioma === "pt" ? "Português" : emb.idioma === "es" ? "Español" : "English"} />
          </Section>

          {/* Endereço */}
          <Section title={t("emb.secEndereco")} icon={MapPin}>
            <Field label={t("emb.endereco")} value={emb.endereco} />
            <Field label={t("emb.bairro")} value={emb.bairro} />
            <Field label="Cidade" value={emb.cidade} />
            <Field label="Estado" value={emb.estado} />
            <Field label={t("emb.cep")} value={emb.cep} />
            <Field label={t("emb.pais")} value={emb.pais} />
          </Section>

          {/* Datas */}
          <Section title="Datas" icon={Calendar}>
            <Field label="Nascimento" value={formatDate(emb.dataNascimento, locale)} />
            <Field label="Ingresso" value={formatDate(emb.dataIngresso, locale)} />
            <Field label="Renovação" value={formatDate(emb.dataRenovacao, locale)} />
            <Field label={t("emb.dataEmbaixador")} value={emb.dataEmbaixador} />
          </Section>

          {/* Família */}
          <Section title={t("emb.familia")} icon={Users}>
            <Field label={t("emb.estadoCivil")} value={emb.estadoCivil ? t(`emb.${emb.estadoCivil}`) : null} />
            <Field label={t("emb.nomeEsposa")} value={emb.nomeEsposa} />
            <Field label={t("emb.nascEsposa")} value={formatDate(emb.dataNascimentoEsposa, locale)} />
            <Field label={t("emb.qtdFilhos")} value={emb.qtdFilhos > 0 ? emb.qtdFilhos : null} />
            <Field label={t("emb.idadesFilhos")} value={emb.idadesFilhos} />
          </Section>

          {/* Jornada */}
          <Section title={t("emb.secJornada")} icon={Award}>
            <Field label={t("emb.sedeLegendario")} value={emb.sedeLegendario} />
            <Field label={t("emb.cargoLideranca")} value={emb.cargoLideranca} />
            <Field label={t("emb.doacaoPoco")} value={emb.doacaoPoco ? <YesNoBadge value={emb.doacaoPoco} /> : null} />
            <Field label={t("emb.numeroAnel")} value={emb.numeroAnel} />
          </Section>

          {/* Itens */}
          <Section title={t("emb.secItens")} icon={Shield}>
            <Field label={t("emb.temJaqueta")} value={<YesNoBadge value={emb.temJaqueta} />} />
            <Field label={t("emb.temPin")} value={<YesNoBadge value={emb.temPin} />} />
            <Field label={t("emb.temPatch")} value={<YesNoBadge value={emb.temPatch} />} />
            <Field label={t("emb.temEspada")} value={<YesNoBadge value={emb.temEspada} />} />
          </Section>
        </div>

        {/* Programas — full width */}
        {(programas.length > 0 || aberturas.length > 0) && (
          <Section title={t("emb.secProgramas")} icon={MapPinned}>
            {programas.length > 0 && (
              <div>
                <p className="text-[0.6875rem] text-[#6e6e73] mb-2">{t("emb.programas")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {programas.map(p => (
                    <span key={p} className="apple-badge" style={{ background: "rgba(255,159,10,0.14)", color: "#FF9F0A" }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {aberturas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <p className="text-[0.6875rem] text-[#6e6e73] mb-2">{t("emb.aberturas")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {aberturas.map(p => (
                    <span key={p} className="apple-badge" style={{ background: "rgba(10,132,255,0.14)", color: "#0A84FF" }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Observações */}
        {emb.observacoes && (
          <Section title={t("emb.observacoes")} icon={Users}>
            <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed whitespace-pre-wrap">{emb.observacoes}</p>
          </Section>
        )}

        {/* Profissional */}
        {(emb.profissao || emb.empresa) && (
          <Section title="Profissional" icon={Users}>
            <Field label="Profissão" value={emb.profissao} />
            <Field label="Empresa" value={emb.empresa} />
          </Section>
        )}

        {/* Code */}
        {emb.codigoIndicacao && (
          <Section title="Link de Indicação" icon={Shield}>
            <Field label="Código" value={<code className="text-[#FF6B00]">{emb.codigoIndicacao}</code>} />
            <Field label="URL" value={<span className="text-[0.75rem] break-all">{window.location.origin}/inscricao?ref={emb.codigoIndicacao}</span>} />
          </Section>
        )}
      </div>

    </DashboardLayout>
  );
}
