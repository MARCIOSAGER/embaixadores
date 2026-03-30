import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp, Check, Loader2, Send } from "lucide-react";

const LOGO = "/logo-legendarios.png";

type FormData = {
  nomeCompleto: string;
  email: string;
  telefone: string;
  instagram: string;
  numeroLegendario: string;
  topSede: string;
  qtdTopsServidos: string;
  areaServico: string;
  conhecimentoPrevio: string;
  indicadoPorEmb: boolean;
  nomeIndicador: string;
  sedeInternacional: boolean;
  nomeSedeInternacional: string;
  cargoLideranca: string;
  estadoCivil: string;
  qtdFilhos: number;
  idadesFilhos: string;
  profissao: string;
  areaAtuacao: string;
  possuiEmpresa: string;
  instagramEmpresa: string;
  segmentoMercado: string;
  tempoEmpreendedorismo: string;
  estruturaEquipe: string;
  investeClubePrivado: string;
  participaMentoria: string;
  valorInvestimento: string;
  disponibilidadeReuniao: string;
};

const initial: FormData = {
  nomeCompleto: "",
  email: "",
  telefone: "",
  instagram: "",
  numeroLegendario: "",
  topSede: "",
  qtdTopsServidos: "",
  areaServico: "",
  conhecimentoPrevio: "",
  indicadoPorEmb: false,
  nomeIndicador: "",
  sedeInternacional: false,
  nomeSedeInternacional: "",
  cargoLideranca: "",
  estadoCivil: "",
  qtdFilhos: 0,
  idadesFilhos: "",
  profissao: "",
  areaAtuacao: "",
  possuiEmpresa: "",
  instagramEmpresa: "",
  segmentoMercado: "",
  tempoEmpreendedorismo: "",
  estruturaEquipe: "",
  investeClubePrivado: "",
  participaMentoria: "",
  valorInvestimento: "",
  disponibilidadeReuniao: "",
};

/* ---------- step definitions ---------- */
type Step = {
  id: string;
  title: string;
  subtitle?: string;
  fields: Field[];
};

type Field = {
  key: keyof FormData;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "radio" | "yesno" | "number";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  showIf?: (d: FormData) => boolean;
};

const steps: Step[] = [
  {
    id: "welcome",
    title: "Bem-vindo!",
    subtitle: "Preencha este formulario para se candidatar como Embaixador dos Legendarios. Leva cerca de 5 minutos.",
    fields: [],
  },
  {
    id: "pessoal",
    title: "Dados Pessoais",
    fields: [
      { key: "nomeCompleto", label: "Nome completo", type: "text", required: true, placeholder: "Seu nome completo" },
      { key: "email", label: "Email profissional", type: "email", required: true, placeholder: "seu@email.com" },
      { key: "telefone", label: "WhatsApp", type: "tel", required: true, placeholder: "(11) 99999-9999" },
      { key: "instagram", label: "Instagram pessoal", type: "text", required: true, placeholder: "@seu.perfil" },
    ],
  },
  {
    id: "legendarios",
    title: "Legendarios",
    subtitle: "Conte-nos sobre sua jornada no movimento.",
    fields: [
      { key: "numeroLegendario", label: "Numero de Legendario", type: "text", required: true, placeholder: "Ex: L#91105" },
      { key: "topSede", label: "TOP Sede", type: "text", required: true, placeholder: "Nome do seu TOP Sede" },
      { key: "qtdTopsServidos", label: "Quantos TOPs voce ja serviu?", type: "text", required: true },
      { key: "areaServico", label: "Em qual area voce serve/serviu?", type: "textarea", required: true },
      { key: "conhecimentoPrevio", label: "O que voce sabe sobre os Embaixadores?", type: "textarea", required: true },
    ],
  },
  {
    id: "indicacao",
    title: "Indicacao e Lideranca",
    fields: [
      {
        key: "indicadoPorEmb", label: "Voce foi indicado por algum embaixador?", type: "yesno", required: true,
      },
      {
        key: "nomeIndicador", label: "Nome de quem indicou", type: "text",
        showIf: (d) => d.indicadoPorEmb, placeholder: "Nome do embaixador",
      },
      {
        key: "sedeInternacional", label: "Voce participa de alguma sede internacional?", type: "yesno", required: true,
      },
      {
        key: "nomeSedeInternacional", label: "Qual sede internacional?", type: "text",
        showIf: (d) => d.sedeInternacional, placeholder: "Nome da sede",
      },
      { key: "cargoLideranca", label: "Ocupa algum cargo de lideranca?", type: "text", required: true, placeholder: "Ex: Lider de celula, Diacono..." },
    ],
  },
  {
    id: "familia",
    title: "Familia",
    fields: [
      {
        key: "estadoCivil", label: "Estado civil", type: "select", required: true,
        options: [
          { label: "Solteiro(a)", value: "solteiro" },
          { label: "Casado(a)", value: "casado" },
          { label: "Divorciado(a)", value: "divorciado" },
          { label: "Viuvo(a)", value: "viuvo" },
        ],
      },
      { key: "qtdFilhos", label: "Quantos filhos?", type: "number", required: true },
      { key: "idadesFilhos", label: "Idades dos filhos", type: "text", showIf: (d) => d.qtdFilhos > 0, placeholder: "Ex: 5, 8 e 12 anos" },
    ],
  },
  {
    id: "profissional",
    title: "Profissional",
    subtitle: "Sobre sua vida profissional e empresarial.",
    fields: [
      { key: "profissao", label: "Profissao", type: "text", required: true, placeholder: "Sua profissao" },
      { key: "areaAtuacao", label: "Area de atuacao", type: "text", required: true, placeholder: "Ex: Tecnologia, Saude..." },
      { key: "possuiEmpresa", label: "Possui empresa?", type: "text", required: true, placeholder: "Nome da empresa ou 'Nao'" },
      { key: "instagramEmpresa", label: "Instagram da empresa", type: "text", placeholder: "@empresa" },
    ],
  },
  {
    id: "mercado",
    title: "Mercado e Investimento",
    fields: [
      {
        key: "segmentoMercado", label: "Segmento de mercado", type: "radio", required: true,
        options: [
          { label: "Servicos", value: "servicos" },
          { label: "Varejo e comercio", value: "varejo" },
          { label: "Industria", value: "industria" },
          { label: "Infoprodutos/digitais", value: "digital" },
          { label: "Saude", value: "saude" },
          { label: "Outro", value: "outro" },
        ],
      },
      {
        key: "tempoEmpreendedorismo", label: "Ha quanto tempo empreende?", type: "select", required: true,
        options: [
          { label: "Menos de 1 ano", value: "<1" },
          { label: "1 a 3 anos", value: "1-3" },
          { label: "4 a 7 anos", value: "4-7" },
          { label: "Mais de 7 anos", value: "7+" },
        ],
      },
      {
        key: "estruturaEquipe", label: "Estrutura da equipe", type: "radio", required: true,
        options: [
          { label: "Trabalho sozinho", value: "solo" },
          { label: "Equipe interna", value: "interna" },
          { label: "Terceirizada/parceiros", value: "terceirizada" },
        ],
      },
    ],
  },
  {
    id: "investimento",
    title: "Investimento e Disponibilidade",
    fields: [
      {
        key: "investeClubePrivado", label: "Investiria em um clube privado?", type: "radio", required: true,
        options: [
          { label: "Sim, acredito no valor", value: "sim" },
          { label: "Sim, mas ainda estou avaliando", value: "avaliando" },
          { label: "Nao, prefiro conteudo gratuito", value: "nao" },
        ],
      },
      { key: "participaMentoria", label: "Participa de alguma mentoria atualmente?", type: "text", required: true, placeholder: "Sim/Nao - qual?" },
      {
        key: "valorInvestimento", label: "Quanto ja investiu em desenvolvimento pessoal/profissional?", type: "radio", required: true,
        options: [
          { label: "Ate R$ 10 mil", value: "10k" },
          { label: "R$ 20-30 mil", value: "20-30k" },
          { label: "R$ 40-60 mil", value: "40-60k" },
          { label: "R$ 80-100 mil", value: "80-100k" },
          { label: "Mais de R$ 100 mil", value: "100k+" },
        ],
      },
      { key: "disponibilidadeReuniao", label: "Qual sua disponibilidade para reunioes?", type: "text", required: true, placeholder: "Ex: Quartas a noite, Sabados pela manha..." },
    ],
  },
];

/* ---------- components ---------- */

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current) / (total - 1)) * 100;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
      <div
        className="h-full bg-[#FF6B00] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[
        { label: "Sim", val: true },
        { label: "Nao", val: false },
      ].map((opt) => (
        <button
          key={String(opt.val)}
          type="button"
          onClick={() => onChange(opt.val)}
          className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all ${
            value === opt.val
              ? "bg-[#FF6B00] text-white"
              : "bg-white/5 text-[#e5e5e5] hover:bg-white/10 border border-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full text-left py-3 px-4 rounded-xl text-sm transition-all ${
            value === opt.value
              ? "bg-[#FF6B00] text-white"
              : "bg-white/5 text-[#e5e5e5] hover:bg-white/10 border border-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- main ---------- */

export default function Inscricao() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const f of current.fields) {
      if (f.showIf && !f.showIf(form)) continue;
      if (!f.required) continue;
      const v = form[f.key];
      if (v === "" || v === null || v === undefined) {
        errs[f.key] = "Campo obrigatorio";
      }
      if (f.type === "email" && typeof v === "string" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        errs[f.key] = "Email invalido";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step < steps.length - 1) setStep(step + 1);
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("inscricoes").insert({
        nomeCompleto: form.nomeCompleto,
        email: form.email,
        telefone: form.telefone,
        instagram: form.instagram || null,
        numeroLegendario: form.numeroLegendario || null,
        topSede: form.topSede || null,
        qtdTopsServidos: form.qtdTopsServidos || null,
        areaServico: form.areaServico || null,
        conhecimentoPrevio: form.conhecimentoPrevio || null,
        indicadoPorEmb: form.indicadoPorEmb,
        nomeIndicador: form.nomeIndicador || null,
        sedeInternacional: form.sedeInternacional,
        nomeSedeInternacional: form.nomeSedeInternacional || null,
        cargoLideranca: form.cargoLideranca || null,
        estadoCivil: form.estadoCivil || null,
        qtdFilhos: form.qtdFilhos,
        idadesFilhos: form.idadesFilhos || null,
        profissao: form.profissao || null,
        areaAtuacao: form.areaAtuacao || null,
        possuiEmpresa: form.possuiEmpresa || null,
        instagramEmpresa: form.instagramEmpresa || null,
        segmentoMercado: form.segmentoMercado || null,
        tempoEmpreendedorismo: form.tempoEmpreendedorismo || null,
        estruturaEquipe: form.estruturaEquipe || null,
        investeClubePrivado: form.investeClubePrivado || null,
        participaMentoria: form.participaMentoria || null,
        valorInvestimento: form.valorInvestimento || null,
        disponibilidadeReuniao: form.disponibilidadeReuniao || null,
        status: "pendente",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (e: any) {
      setErrors({ _form: e.message || "Erro ao enviar. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  /* ----- success screen ----- */
  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-[#FF6B00]/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#FF6B00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Inscricao enviada!</h1>
          <p className="text-[#8e8e93] text-sm leading-relaxed">
            Recebemos seus dados com sucesso. Nossa equipe analisara sua candidatura e entrara em contato em breve.
          </p>
        </div>
      </div>
    );
  }

  /* ----- form ----- */
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ProgressBar current={step} total={steps.length} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <img src={LOGO} alt="Legendarios" className="h-10 object-contain" />
        <span className="text-xs text-[#8e8e93]">
          {step + 1} / {steps.length}
        </span>
      </header>

      {/* Content */}
      <div ref={containerRef} className="flex-1 flex items-start justify-center px-6 pb-32 overflow-y-auto">
        <div className="w-full max-w-lg pt-8 animate-fade-in" key={step}>
          {/* Step title */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{current.title}</h1>
          {current.subtitle && (
            <p className="text-[#8e8e93] text-sm mb-8 leading-relaxed">{current.subtitle}</p>
          )}

          {/* Fields */}
          <div className="flex flex-col gap-6 mt-6">
            {current.fields.map((f) => {
              if (f.showIf && !f.showIf(form)) return null;
              const err = errors[f.key];
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                    {f.label}
                    {f.required && <span className="text-[#FF6B00] ml-1">*</span>}
                  </label>

                  {f.type === "text" || f.type === "email" || f.type === "tel" ? (
                    <input
                      type={f.type}
                      value={form[f.key] as string}
                      onChange={(e) => set(f.key, e.target.value as any)}
                      placeholder={f.placeholder}
                      className={`w-full bg-white/5 border ${err ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#6e6e73] focus:outline-none focus:border-[#FF6B00] transition-colors`}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      value={form[f.key] as string}
                      onChange={(e) => set(f.key, e.target.value as any)}
                      placeholder={f.placeholder}
                      rows={3}
                      className={`w-full bg-white/5 border ${err ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#6e6e73] focus:outline-none focus:border-[#FF6B00] transition-colors resize-none`}
                    />
                  ) : f.type === "number" ? (
                    <input
                      type="number"
                      min={0}
                      value={form[f.key] as number}
                      onChange={(e) => set(f.key, Number(e.target.value) as any)}
                      className={`w-full bg-white/5 border ${err ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors`}
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={form[f.key] as string}
                      onChange={(e) => set(f.key, e.target.value as any)}
                      className={`w-full bg-white/5 border ${err ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors appearance-none`}
                    >
                      <option value="" className="bg-[#1c1c1e]">Selecione...</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value} className="bg-[#1c1c1e]">{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === "yesno" ? (
                    <YesNo value={form[f.key] as boolean} onChange={(v) => set(f.key, v as any)} />
                  ) : f.type === "radio" ? (
                    <RadioGroup
                      options={f.options || []}
                      value={form[f.key] as string}
                      onChange={(v) => set(f.key, v as any)}
                    />
                  ) : null}

                  {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
                </div>
              );
            })}
          </div>

          {errors._form && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors._form}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={isFirst}
          className="flex items-center gap-1 text-sm text-[#8e8e93] disabled:opacity-30 hover:text-white transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
          Voltar
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e55f00] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-1 bg-[#FF6B00] hover:bg-[#e55f00] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all"
          >
            {isFirst ? "Comecar" : "Proximo"}
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </button>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
