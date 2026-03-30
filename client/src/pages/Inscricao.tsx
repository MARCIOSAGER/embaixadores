import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2, ArrowRight, ArrowLeft, Send, UserCheck, Camera, Upload } from "lucide-react";

const LOGO = "/logo-legendarios.png";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80",
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1920&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80",
  "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1920&q=80",
];

/* ============================================================ */
type FormData = {
  nomeCompleto: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  instagram: string;
  cidade: string;
  estado: string;
  fotoFile: File | null;
  fotoPreview: string;
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
  nomeEsposa: string;
  dataNascimentoEsposa: string;
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
  nomeCompleto: "", dataNascimento: "", email: "", telefone: "", instagram: "",
  cidade: "", estado: "", fotoFile: null, fotoPreview: "",
  numeroLegendario: "", topSede: "", qtdTopsServidos: "", areaServico: "",
  conhecimentoPrevio: "", indicadoPorEmb: false, nomeIndicador: "",
  sedeInternacional: false, nomeSedeInternacional: "", cargoLideranca: "",
  estadoCivil: "", nomeEsposa: "", dataNascimentoEsposa: "", qtdFilhos: 0, idadesFilhos: "",
  profissao: "", areaAtuacao: "", possuiEmpresa: "", instagramEmpresa: "",
  segmentoMercado: "", tempoEmpreendedorismo: "", estruturaEquipe: "",
  investeClubePrivado: "", participaMentoria: "", valorInvestimento: "",
  disponibilidadeReuniao: "",
};

/* ---------- question definitions ---------- */
type Question = {
  key: keyof FormData;
  question: string;
  subtitle?: string;
  type: "text" | "email" | "tel" | "textarea" | "radio" | "yesno" | "number" | "photo" | "date";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string; icon?: string }[];
  showIf?: (d: FormData) => boolean;
  section: string;
  sectionIndex: number;
};

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const questions: Question[] = [
  // --- Foto ---
  { key: "fotoFile", question: "Envie uma foto sua", subtitle: "Uma foto de rosto, bem iluminada. Pode tirar agora pela câmera ou enviar da galeria.", type: "photo", required: true, section: "Sua Foto", sectionIndex: 1 },

  // --- Dados Pessoais ---
  { key: "nomeCompleto", question: "Qual é o seu nome completo?", type: "text", required: true, placeholder: "Digite seu nome completo", section: "Dados Pessoais", sectionIndex: 1 },
  { key: "dataNascimento", question: "Qual é a sua data de nascimento?", type: "date", required: true, section: "Dados Pessoais", sectionIndex: 1 },
  { key: "email", question: "Qual é o seu email profissional?", type: "email", required: true, placeholder: "seu@email.com", section: "Dados Pessoais", sectionIndex: 1 },
  { key: "telefone", question: "Qual é o seu WhatsApp?", subtitle: "Usaremos para contato direto.", type: "tel", required: true, placeholder: "(11) 99999-9999", section: "Dados Pessoais", sectionIndex: 1 },
  { key: "instagram", question: "Qual é o seu Instagram?", type: "text", required: true, placeholder: "@seu.perfil", section: "Dados Pessoais", sectionIndex: 1 },
  { key: "cidade", question: "Em qual cidade você mora?", type: "text", required: true, placeholder: "Ex: São Paulo", section: "Dados Pessoais", sectionIndex: 1 },
  { key: "estado", question: "Qual o seu estado?", type: "text", required: true, placeholder: "Ex: SP", section: "Dados Pessoais", sectionIndex: 1 },

  // --- Legendarios ---
  { key: "numeroLegendario", question: "Qual é o seu número de Legendário?", type: "text", required: true, placeholder: "Ex: L#91105", section: "Legendários", sectionIndex: 2 },
  { key: "topSede", question: "Qual é o seu TOP Sede?", type: "text", required: true, placeholder: "Nome do seu TOP Sede", section: "Legendários", sectionIndex: 2 },
  { key: "qtdTopsServidos", question: "Quantos TOPs você já serviu?", type: "text", required: true, placeholder: "Ex: 3", section: "Legendários", sectionIndex: 2 },
  { key: "areaServico", question: "Em qual área você serve ou serviu?", type: "textarea", required: true, placeholder: "Descreva sua área de serviço...", section: "Legendários", sectionIndex: 2 },
  { key: "conhecimentoPrevio", question: "O que você sabe sobre os Embaixadores?", type: "textarea", required: true, placeholder: "Conte o que você conhece do programa...", section: "Legendários", sectionIndex: 2 },

  // --- Indicação ---
  { key: "indicadoPorEmb", question: "Você foi indicado por algum embaixador?", type: "yesno", required: true, section: "Indicação", sectionIndex: 3 },
  { key: "nomeIndicador", question: "Quem indicou você?", type: "text", showIf: (d) => d.indicadoPorEmb, placeholder: "Nome do embaixador", section: "Indicação", sectionIndex: 3 },
  { key: "sedeInternacional", question: "Você participa de alguma sede internacional?", type: "yesno", required: true, section: "Indicação", sectionIndex: 3 },
  { key: "nomeSedeInternacional", question: "Qual sede internacional?", type: "text", showIf: (d) => d.sedeInternacional, placeholder: "Nome da sede", section: "Indicação", sectionIndex: 3 },
  { key: "cargoLideranca", question: "Ocupa algum cargo de liderança?", subtitle: "Na igreja, no movimento ou na comunidade.", type: "text", required: true, placeholder: "Ex: Líder de célula, Diácono...", section: "Indicação", sectionIndex: 3 },

  // --- Familia ---
  {
    key: "estadoCivil", question: "Qual é o seu estado civil?", type: "radio", required: true, section: "Família", sectionIndex: 4,
    options: [
      { label: "Solteiro(a)", value: "solteiro", icon: "A" },
      { label: "Casado(a)", value: "casado", icon: "B" },
      { label: "Divorciado(a)", value: "divorciado", icon: "C" },
      { label: "Viúvo(a)", value: "viuvo", icon: "D" },
    ],
  },
  { key: "nomeEsposa", question: "Qual é o nome da sua esposa?", type: "text", showIf: (d) => d.estadoCivil === "casado", placeholder: "Nome completo", section: "Família", sectionIndex: 4 },
  { key: "dataNascimentoEsposa", question: "Qual é a data de nascimento da sua esposa?", type: "date", showIf: (d) => d.estadoCivil === "casado", section: "Família", sectionIndex: 4 },
  { key: "qtdFilhos", question: "Quantos filhos você tem?", type: "number", required: true, section: "Família", sectionIndex: 4 },
  { key: "idadesFilhos", question: "Quais as idades dos seus filhos?", type: "text", showIf: (d) => d.qtdFilhos > 0, placeholder: "Ex: 5, 8 e 12 anos", section: "Família", sectionIndex: 4 },

  // --- Profissional ---
  { key: "profissao", question: "Qual é a sua profissão?", type: "text", required: true, placeholder: "Sua profissão principal", section: "Profissional", sectionIndex: 5 },
  { key: "areaAtuacao", question: "Qual a sua área de atuação?", type: "text", required: true, placeholder: "Ex: Tecnologia, Saúde, Educação...", section: "Profissional", sectionIndex: 5 },
  { key: "possuiEmpresa", question: "Possui empresa?", subtitle: "Se sim, qual o nome?", type: "text", required: true, placeholder: "Nome da empresa ou 'Não'", section: "Profissional", sectionIndex: 5 },
  { key: "instagramEmpresa", question: "Qual o Instagram da empresa?", type: "text", placeholder: "@empresa (opcional)", section: "Profissional", sectionIndex: 5 },

  // --- Mercado ---
  {
    key: "segmentoMercado", question: "Qual o seu segmento de mercado?", type: "radio", required: true, section: "Mercado", sectionIndex: 6,
    options: [
      { label: "Serviços", value: "servicos", icon: "A" },
      { label: "Varejo e comércio", value: "varejo", icon: "B" },
      { label: "Indústria", value: "industria", icon: "C" },
      { label: "Infoprodutos / digitais", value: "digital", icon: "D" },
      { label: "Saúde", value: "saude", icon: "E" },
      { label: "Outro", value: "outro", icon: "F" },
    ],
  },
  {
    key: "tempoEmpreendedorismo", question: "Há quanto tempo você empreende?", type: "radio", required: true, section: "Mercado", sectionIndex: 6,
    options: [
      { label: "Menos de 1 ano", value: "<1", icon: "A" },
      { label: "1 a 3 anos", value: "1-3", icon: "B" },
      { label: "4 a 7 anos", value: "4-7", icon: "C" },
      { label: "Mais de 7 anos", value: "7+", icon: "D" },
    ],
  },
  {
    key: "estruturaEquipe", question: "Como é a estrutura da sua equipe?", type: "radio", required: true, section: "Mercado", sectionIndex: 6,
    options: [
      { label: "Trabalho sozinho(a)", value: "solo", icon: "A" },
      { label: "Equipe interna", value: "interna", icon: "B" },
      { label: "Terceirizada / parceiros", value: "terceirizada", icon: "C" },
    ],
  },

  // --- Investimento ---
  {
    key: "investeClubePrivado", question: "Você investiria em um clube privado de desenvolvimento?", type: "radio", required: true, section: "Investimento", sectionIndex: 7,
    options: [
      { label: "Sim, acredito no valor", value: "sim", icon: "A" },
      { label: "Sim, mas ainda estou avaliando", value: "avaliando", icon: "B" },
      { label: "Não, prefiro conteúdo gratuito", value: "nao", icon: "C" },
    ],
  },
  { key: "participaMentoria", question: "Participa de alguma mentoria atualmente?", type: "text", required: true, placeholder: "Sim/Não - qual?", section: "Investimento", sectionIndex: 7 },
  {
    key: "valorInvestimento", question: "Quanto já investiu em desenvolvimento pessoal e profissional?", type: "radio", required: true, section: "Investimento", sectionIndex: 7,
    options: [
      { label: "Até R$ 10 mil", value: "10k", icon: "A" },
      { label: "R$ 20 a 30 mil", value: "20-30k", icon: "B" },
      { label: "R$ 40 a 60 mil", value: "40-60k", icon: "C" },
      { label: "R$ 80 a 100 mil", value: "80-100k", icon: "D" },
      { label: "Mais de R$ 100 mil", value: "100k+", icon: "E" },
    ],
  },
  { key: "disponibilidadeReuniao", question: "Qual a sua disponibilidade para reuniões?", type: "text", required: true, placeholder: "Ex: Quartas à noite, Sábados pela manhã...", section: "Investimento", sectionIndex: 7 },
];

/* ============================================================
   COMPONENTS
   ============================================================ */

function OptionButton({
  label, icon, selected, onClick,
}: { label: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
        ${selected
          ? "border-[#FF6B00] bg-[#FF6B00]/15 shadow-[0_0_30px_rgba(255,107,0,0.15)]"
          : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8"
        }`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors
            ${selected ? "bg-[#FF6B00] text-white" : "bg-white/10 text-white/60 group-hover:bg-white/15"}`}>
            {icon}
          </span>
        )}
        <span className={`text-[15px] font-medium transition-colors ${selected ? "text-white" : "text-white/80"}`}>
          {label}
        </span>
        {selected && (
          <Check className="w-5 h-5 text-[#FF6B00] ml-auto flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

function YesNoButtons({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-4">
      {[{ label: "Sim", val: true }, { label: "Não", val: false }].map((opt) => (
        <button
          key={String(opt.val)}
          type="button"
          onClick={() => onChange(opt.val)}
          className={`flex-1 py-4 rounded-2xl text-base font-semibold border-2 transition-all duration-200 cursor-pointer
            ${value === opt.val
              ? "border-[#FF6B00] bg-[#FF6B00]/15 text-white shadow-[0_0_30px_rgba(255,107,0,0.15)]"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/8"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PhotoUpload({
  preview, onChange,
}: { preview: string; onChange: (file: File, preview: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange(file, url);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Preview circle */}
      <div
        className={`w-40 h-40 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all duration-300
          ${preview
            ? "border-[#FF6B00] shadow-[0_0_40px_rgba(255,107,0,0.25)]"
            : "border-white/20 border-dashed"
          }`}
      >
        {preview ? (
          <img src={preview} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-12 h-12 text-white/30" />
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { if (fileRef.current) { fileRef.current.setAttribute("capture", "user"); fileRef.current.click(); } }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-white/10 bg-white/5 text-white/80 text-sm font-medium hover:border-white/25 hover:bg-white/8 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          Câmera
        </button>
        <button
          type="button"
          onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click(); } }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-[#FF6B00]/50 bg-[#FF6B00]/10 text-white text-sm font-medium hover:bg-[#FF6B00]/20 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Galeria
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function Inscricao() {
  const [qIdx, setQIdx] = useState(-1);
  const [form, setForm] = useState<FormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [referrer, setReferrer] = useState<{ nomeCompleto: string } | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [refEmbId, setRefEmbId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const visibleQuestions = questions.filter((q) => !q.showIf || q.showIf(form));
  const current = qIdx >= 0 ? visibleQuestions[qIdx] : null;
  const totalVisible = visibleQuestions.length;
  const isWelcome = qIdx === -1;
  const isLast = qIdx === totalVisible - 1;
  const bgIdx = current ? current.sectionIndex : 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;
    setRefCode(code);
    supabase
      .from("embaixadores")
      .select("id, nomeCompleto")
      .eq("codigoIndicacao", code)
      .single()
      .then(({ data }) => {
        if (data) {
          setReferrer(data);
          setRefEmbId(data.id);
          setForm((p) => ({ ...p, indicadoPorEmb: true, nomeIndicador: data.nomeCompleto }));
        }
      });
  }, []);

  useEffect(() => {
    if (current && (current.type === "text" || current.type === "email" || current.type === "tel" || current.type === "textarea" || current.type === "number" || current.type === "date")) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [qIdx]);

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setFieldError("");
  }, []);

  function validate(): boolean {
    if (!current) return true;
    if (current.type === "photo") {
      if (current.required && !form.fotoFile) {
        setFieldError("Por favor, envie uma foto");
        return false;
      }
      return true;
    }
    if (!current.required) return true;
    const v = form[current.key];
    if (v === "" || v === null || v === undefined) {
      setFieldError("Por favor, preencha este campo");
      return false;
    }
    if (current.type === "email" && typeof v === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setFieldError("Digite um email válido");
      return false;
    }
    return true;
  }

  function next() {
    if (!validate()) return;
    setFieldError("");
    setDirection("next");
    if (qIdx < totalVisible - 1) setQIdx(qIdx + 1);
  }

  function prev() {
    setFieldError("");
    setDirection("prev");
    if (qIdx > -1) setQIdx(qIdx - 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLast) submit();
      else next();
    }
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!form.fotoFile) return null;
    const ext = form.fotoFile.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("inscricoes")
      .upload(path, form.fotoFile, { upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage.from("inscricoes").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      const fotoUrl = await uploadPhoto();
      const { error: err } = await supabase.from("inscricoes").insert({
        nomeCompleto: form.nomeCompleto,
        dataNascimento: form.dataNascimento || null,
        email: form.email,
        telefone: form.telefone,
        instagram: form.instagram || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        fotoUrl,
        nomeEsposa: form.nomeEsposa || null,
        dataNascimentoEsposa: form.dataNascimentoEsposa || null,
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
        embaixadorIndicadorId: refEmbId,
        codigoIndicacao: refCode,
        status: "pendente",
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ==================== SUCCESS ==================== */
  if (submitted) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0a0a0a] via-[#1a0f00] to-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-md slide-up">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-[#FF6B00]/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#ff8533] flex items-center justify-center shadow-[0_0_60px_rgba(255,107,0,0.4)]">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Inscrição enviada!</h1>
          <p className="text-white/60 text-base leading-relaxed mb-2">
            Recebemos seus dados com sucesso.
          </p>
          <p className="text-white/60 text-base leading-relaxed">
            Nossa equipe analisará sua candidatura e entrará em contato em breve pelo WhatsApp.
          </p>
          {referrer && (
            <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10">
              <UserCheck className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-sm text-white/70">Indicado por <span className="text-white font-medium">{referrer.nomeCompleto}</span></span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ==================== WELCOME ==================== */
  if (isWelcome) {
    return (
      <div className="min-h-dvh relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img src={BG_IMAGES[0]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-lg slide-up">
          <img src={LOGO} alt="Legendários" className="h-16 mx-auto mb-10 drop-shadow-2xl" />

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Embaixadores dos<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#ff9a44]">Legendários</span>
          </h1>

          <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md mx-auto">
            Faça parte deste seleto grupo de líderes que representam o movimento Legendários.
          </p>

          {referrer && (
            <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 mb-8">
              <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-sm font-bold">
                {referrer.nomeCompleto.charAt(0)}
              </div>
              <span className="text-sm text-white/80">
                Você foi convidado por <span className="text-white font-semibold">{referrer.nomeCompleto}</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setDirection("next"); setQIdx(0); }}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] hover:from-[#e55f00] hover:to-[#FF6B00] text-white font-bold px-10 py-4 rounded-full text-lg transition-all duration-300 shadow-[0_8px_40px_rgba(255,107,0,0.35)] hover:shadow-[0_12px_50px_rgba(255,107,0,0.5)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Começar inscrição
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="text-white/40 text-xs mt-6">Leva cerca de 5 minutos</p>
        </div>
      </div>
    );
  }

  /* ==================== QUESTION ==================== */
  if (!current) return null;

  return (
    <div className="min-h-dvh relative overflow-hidden flex flex-col" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 transition-opacity duration-700">
        <img
          src={BG_IMAGES[bgIdx] || BG_IMAGES[0]}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/80 to-black/85 backdrop-blur-sm" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#FF6B00] to-[#ff9a44] transition-all duration-500 ease-out"
          style={{ width: `${((qIdx + 1) / totalVisible) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <img src={LOGO} alt="Legendários" className="h-8 opacity-70" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 font-medium tracking-wider uppercase">
            {current.section}
          </span>
          <span className="text-xs text-white/30">
            {qIdx + 1}/{totalVisible}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-28">
        <div
          className={`w-full max-w-xl ${direction === "next" ? "slide-up" : "slide-down"}`}
          key={`q-${qIdx}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#FF6B00] font-mono text-sm font-bold">{qIdx + 1}</span>
            <ArrowRight className="w-3 h-3 text-[#FF6B00]/60" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
            {current.question}
          </h2>
          {current.subtitle && (
            <p className="text-white/50 text-base mb-6">{current.subtitle}</p>
          )}

          {/* Input area */}
          <div className="mt-8">
            {current.type === "photo" && (
              <PhotoUpload
                preview={form.fotoPreview}
                onChange={(file, preview) => {
                  setForm((p) => ({ ...p, fotoFile: file, fotoPreview: preview }));
                  setFieldError("");
                }}
              />
            )}

            {current.type === "date" && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="date"
                value={form[current.key] as string}
                onChange={(e) => set(current.key, e.target.value as any)}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-xl sm:text-2xl text-white focus:outline-none transition-colors duration-300 caret-[#FF6B00] [color-scheme:dark]"
                autoFocus
              />
            )}

            {(current.type === "text" || current.type === "email" || current.type === "tel") && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={current.type}
                inputMode={current.type === "tel" ? "tel" : current.type === "email" ? "email" : "text"}
                value={form[current.key] as string}
                onChange={(e) => set(current.key, e.target.value as any)}
                placeholder={current.placeholder}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-xl sm:text-2xl text-white placeholder:text-white/25 focus:outline-none transition-colors duration-300 caret-[#FF6B00]"
                autoFocus
              />
            )}

            {current.type === "textarea" && (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={form[current.key] as string}
                onChange={(e) => set(current.key, e.target.value as any)}
                placeholder={current.placeholder}
                rows={3}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-xl text-white placeholder:text-white/25 focus:outline-none transition-colors duration-300 resize-none caret-[#FF6B00]"
                autoFocus
              />
            )}

            {current.type === "number" && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="number"
                min={0}
                value={form[current.key] as number}
                onChange={(e) => set(current.key, Number(e.target.value) as any)}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-3xl text-white focus:outline-none transition-colors duration-300 caret-[#FF6B00]"
                autoFocus
              />
            )}

            {current.type === "radio" && current.options && (
              <div className="flex flex-col gap-3">
                {current.options.map((opt) => (
                  <OptionButton
                    key={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    selected={form[current.key] === opt.value}
                    onClick={() => {
                      set(current.key, opt.value as any);
                      setTimeout(() => {
                        if (!isLast) {
                          setDirection("next");
                          setQIdx((i) => i + 1);
                        }
                      }, 400);
                    }}
                  />
                ))}
              </div>
            )}

            {current.type === "yesno" && (
              <YesNoButtons
                value={form[current.key] as boolean}
                onChange={(v) => {
                  set(current.key, v as any);
                  setTimeout(() => {
                    setDirection("next");
                    setQIdx((i) => i + 1);
                  }, 400);
                }}
              />
            )}
          </div>

          {fieldError && <p className="mt-4 text-red-400 text-sm font-medium">{fieldError}</p>}
          {error && <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>}

          {(current.type === "text" || current.type === "email" || current.type === "tel" || current.type === "textarea" || current.type === "number" || current.type === "date") && (
            <p className="mt-6 text-white/25 text-xs">
              Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono text-[10px]">Enter</kbd> para continuar
            </p>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-t from-black/90 to-transparent h-20 pointer-events-none" />
        <div className="bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] text-white font-bold px-8 py-3 rounded-full text-sm transition-all duration-200 shadow-[0_4px_24px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_32px_rgba(255,107,0,0.45)] hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar inscrição
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] text-white font-bold px-8 py-3 rounded-full text-sm transition-all duration-200 shadow-[0_4px_24px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_32px_rgba(255,107,0,0.45)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              OK
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .slide-down { animation: slide-down 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}
