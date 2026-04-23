import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2, ArrowRight, ArrowLeft, Send, Camera, Upload, Globe, Shield } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import { useI18n, type Locale } from "@/lib/i18n";

const LOGO = "/logo-legendarios.png";

const BG_GRADIENTS = [
  "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 40%, #0d0d0d 100%)",           // Welcome
  "linear-gradient(135deg, #0a0a14 0%, #0c1a2e 50%, #050508 100%)",           // Pessoal (1)
  "linear-gradient(135deg, #0a1210 0%, #0c201c 50%, #060a09 100%)",           // Legendarios (2)
  "linear-gradient(135deg, #12100a 0%, #1e1408 50%, #0a0908 100%)",           // Familia (3)
  "linear-gradient(135deg, #0c0e12 0%, #141820 50%, #080a0c 100%)",           // Endereço (4)
  "linear-gradient(135deg, #100a14 0%, #1a0c2a 50%, #08050a 100%)",           // Programas (5)
  "linear-gradient(135deg, #120c08 0%, #1a1005 50%, #0a0804 100%)",           // Jornada Embaixador (6)
  "linear-gradient(135deg, #0e0a12 0%, #180e24 50%, #08060c 100%)",           // Itens (7)
];

/* ============================================================ */
type FormData = {
  fotoFile: File | null;
  fotoPreview: string;
  nomeCompleto: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  instagram: string;
  cidade: string;
  estado: string;
  numeroLegendario: string;
  numeroEmbaixador: string;
  estadoCivil: string;
  nomeEsposa: string;
  dataNascimentoEsposa: string;
  qtdFilhos: number;
  idadesFilhos: string;
  profissao: string;
  empresa: string;
  // Endereço
  endereco: string;
  bairro: string;
  cep: string;
  pais: string;
  // Programas (multi-select, armazenados como string separada por vírgula)
  programasParticipou: string[];
  aberturasPaises: string[];
  // Jornada Embaixador
  dataEmbaixador: string;
  sedeLegendario: string;
  cargoLideranca: string;
  doacaoPoco: string;
  numeroAnel: string;
  // Itens recebidos
  temJaqueta: string;
  temPin: string;
  temPatch: string;
  temEspada: string;
};

const initial: FormData = {
  fotoFile: null, fotoPreview: "",
  nomeCompleto: "", dataNascimento: "", email: "", telefone: "", instagram: "",
  cidade: "", estado: "", numeroLegendario: "", numeroEmbaixador: "",
  estadoCivil: "", nomeEsposa: "", dataNascimentoEsposa: "", qtdFilhos: 0, idadesFilhos: "",
  profissao: "", empresa: "",
  endereco: "", bairro: "", cep: "", pais: "",
  programasParticipou: [], aberturasPaises: [],
  dataEmbaixador: "", sedeLegendario: "", cargoLideranca: "", doacaoPoco: "", numeroAnel: "",
  temJaqueta: "", temPin: "", temPatch: "", temEspada: "",
};

/* ---------- question definitions ---------- */
type Question = {
  key: keyof FormData;
  question: string;
  subtitle?: string;
  type: "text" | "email" | "tel" | "textarea" | "radio" | "number" | "photo" | "date" | "checkbox" | "yesno";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string; icon?: string }[];
  showIf?: (d: FormData) => boolean;
  section: string;
  sectionIndex: number;
};

function buildQuestions(t: (k: string) => string): Question[] {
  return [
    { key: "fotoFile", question: t("perfil.foto.titulo"), subtitle: t("perfil.foto.desc"), type: "photo", section: t("perfil.sec.foto"), sectionIndex: 1 },
    { key: "nomeCompleto", question: t("perfil.q.nome"), type: "text", required: true, placeholder: "...", section: t("perfil.sec.pessoal"), sectionIndex: 1 },
    { key: "dataNascimento", question: t("perfil.q.nascimento"), type: "date", section: t("perfil.sec.pessoal"), sectionIndex: 1 },
    { key: "email", question: t("perfil.q.email"), type: "email", placeholder: "seu@email.com", section: t("perfil.sec.pessoal"), sectionIndex: 1 },
    { key: "telefone", question: t("perfil.q.whatsapp"), subtitle: t("perfil.q.whatsapp.sub"), type: "tel", placeholder: "(11) 99999-9999", section: t("perfil.sec.pessoal"), sectionIndex: 1 },
    { key: "instagram", question: t("perfil.q.instagram"), type: "text", placeholder: "@seu.perfil", section: t("perfil.sec.pessoal"), sectionIndex: 1 },
    { key: "cidade", question: t("perfil.q.cidade"), type: "text", placeholder: "Ex: São Paulo", section: t("perfil.sec.pessoal"), sectionIndex: 1 },
    { key: "estado", question: t("perfil.q.estado"), type: "text", placeholder: "Ex: SP", section: t("perfil.sec.pessoal"), sectionIndex: 1 },

    // Endereço
    { key: "endereco", question: t("perfil.q.endereco"), subtitle: t("perfil.q.endereco.sub"), type: "text", placeholder: "Rua, número, complemento", section: t("perfil.sec.endereco"), sectionIndex: 4 },
    { key: "bairro", question: t("perfil.q.bairro"), type: "text", section: t("perfil.sec.endereco"), sectionIndex: 4 },
    { key: "cep", question: t("perfil.q.cep"), type: "text", placeholder: "00000-000", section: t("perfil.sec.endereco"), sectionIndex: 4 },
    { key: "pais", question: t("perfil.q.pais"), type: "text", placeholder: "Ex: Brasil", section: t("perfil.sec.endereco"), sectionIndex: 4 },

    // Legendários / Embaixador
    { key: "numeroLegendario", question: t("perfil.q.numLeg"), type: "text", placeholder: "Ex: L#91105", section: t("perfil.sec.legendarios"), sectionIndex: 2 },
    { key: "numeroEmbaixador", question: t("perfil.q.numEmb"), type: "text", placeholder: "Ex: E#001", section: t("perfil.sec.legendarios"), sectionIndex: 2 },

    // Programas participados (multi-seleção)
    {
      key: "programasParticipou", question: t("perfil.q.programas"), subtitle: t("perfil.q.programas.sub"), type: "checkbox", section: t("perfil.sec.programas"), sectionIndex: 5,
      options: [
        { label: "Legendários", value: "Legendarios" },
        { label: "REM", value: "REM" },
        { label: "LEGADO", value: "LEGADO" },
        { label: "MAMUTE", value: "MAMUTE" },
        { label: "Embaixadores Master Experience (MEX)", value: "MEX" },
        { label: "Tour Guatemala", value: "Tour Guatemala" },
        { label: "NEST EUA", value: "NEST EUA" },
        { label: "NEST Brasil", value: "NEST Brasil" },
        { label: "Encontro Augusto Cury", value: "Augusto Cury" },
        { label: "LGND SQUAD", value: "LGND SQUAD" },
        { label: "Aberturas de Países", value: "Aberturas" },
      ],
    },
    {
      key: "aberturasPaises", question: t("perfil.q.aberturas"), subtitle: t("perfil.q.aberturas.sub"), type: "checkbox", section: t("perfil.sec.programas"), sectionIndex: 5,
      showIf: (d) => d.programasParticipou.includes("Aberturas"),
      options: [
        { label: "Portugal", value: "Portugal" },
        { label: "Reino Unido", value: "Reino Unido" },
        { label: "Japão", value: "Japão" },
        { label: "Dubai", value: "Dubai" },
        { label: "Itália", value: "Itália" },
        { label: "Espanha", value: "Espanha" },
        { label: "África", value: "África" },
      ],
    },

    // Jornada Embaixador
    { key: "dataEmbaixador", question: t("perfil.q.dataEmb"), subtitle: t("perfil.q.dataEmb.sub"), type: "date", section: t("perfil.sec.jornada"), sectionIndex: 6 },
    { key: "sedeLegendario", question: t("perfil.q.sedeLeg"), type: "text", section: t("perfil.sec.jornada"), sectionIndex: 6 },
    { key: "cargoLideranca", question: t("perfil.q.cargoLid"), subtitle: t("perfil.q.cargoLid.sub"), type: "text", placeholder: "Ex: Top, Coordenador, não exerço", section: t("perfil.sec.jornada"), sectionIndex: 6 },
    {
      key: "doacaoPoco", question: t("perfil.q.doacaoPoco"), type: "radio", section: t("perfil.sec.jornada"), sectionIndex: 6,
      options: [
        { label: t("insc.sim"), value: "sim", icon: "A" },
        { label: t("insc.nao"), value: "nao", icon: "B" },
      ],
    },
    { key: "numeroAnel", question: t("perfil.q.numAnel"), subtitle: t("perfil.q.numAnel.sub"), type: "text", section: t("perfil.sec.jornada"), sectionIndex: 6 },

    // Família
    {
      key: "estadoCivil", question: t("perfil.q.estadoCivil"), type: "radio", section: t("perfil.sec.familia"), sectionIndex: 3,
      options: [
        { label: t("insc.opt.solteiro"), value: "solteiro", icon: "A" },
        { label: t("insc.opt.casado"), value: "casado", icon: "B" },
        { label: t("insc.opt.divorciado"), value: "divorciado", icon: "C" },
        { label: t("insc.opt.viuvo"), value: "viuvo", icon: "D" },
      ],
    },
    { key: "nomeEsposa", question: t("perfil.q.nomeEsposa"), type: "text", showIf: (d) => d.estadoCivil === "casado", section: t("perfil.sec.familia"), sectionIndex: 3 },
    { key: "dataNascimentoEsposa", question: t("perfil.q.nascEsposa"), type: "date", showIf: (d) => d.estadoCivil === "casado", section: t("perfil.sec.familia"), sectionIndex: 3 },
    { key: "qtdFilhos", question: t("perfil.q.filhos"), type: "number", section: t("perfil.sec.familia"), sectionIndex: 3 },
    { key: "idadesFilhos", question: t("perfil.q.idadesFilhos"), type: "text", showIf: (d) => d.qtdFilhos > 0, section: t("perfil.sec.familia"), sectionIndex: 3 },

    // Itens recebidos (uma pergunta sim/não para cada)
    {
      key: "temJaqueta", question: t("perfil.q.temJaqueta"), type: "radio", section: t("perfil.sec.itens"), sectionIndex: 7,
      options: [{ label: t("insc.sim"), value: "sim", icon: "A" }, { label: t("insc.nao"), value: "nao", icon: "B" }],
    },
    {
      key: "temPin", question: t("perfil.q.temPin"), type: "radio", section: t("perfil.sec.itens"), sectionIndex: 7,
      options: [{ label: t("insc.sim"), value: "sim", icon: "A" }, { label: t("insc.nao"), value: "nao", icon: "B" }],
    },
    {
      key: "temPatch", question: t("perfil.q.temPatch"), type: "radio", section: t("perfil.sec.itens"), sectionIndex: 7,
      options: [{ label: t("insc.sim"), value: "sim", icon: "A" }, { label: t("insc.nao"), value: "nao", icon: "B" }],
    },
    {
      key: "temEspada", question: t("perfil.q.temEspada"), type: "radio", section: t("perfil.sec.itens"), sectionIndex: 7,
      options: [{ label: t("insc.sim"), value: "sim", icon: "A" }, { label: t("insc.nao"), value: "nao", icon: "B" }],
    },
  ];
}

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

function CheckboxOption({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
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
        <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors border-2
          ${selected ? "bg-[#FF6B00] border-[#FF6B00]" : "bg-white/5 border-white/20"}`}>
          {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </span>
        <span className={`text-[15px] font-medium transition-colors ${selected ? "text-white" : "text-white/80"}`}>
          {label}
        </span>
      </div>
    </button>
  );
}

async function resizeImage(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          resolve(new File([blob!], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.src = objectUrl;
  });
}

function PhotoUpload({
  preview, onChange, t,
}: { preview: string; onChange: (file: File, preview: string) => void; t: (k: string) => string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  async function handleFile(file: File) {
    setUploadError("");
    if (!ALLOWED_TYPES.includes(file.type)) { setUploadError(t("upload.tipoInvalido")); return; }
    if (file.size > MAX_SIZE) { setUploadError(t("upload.muitoGrande")); return; }
    if (file.size > 2 * 1024 * 1024) {
      const resized = await resizeImage(file, 1200);
      onChange(resized, URL.createObjectURL(resized));
    } else {
      onChange(file, URL.createObjectURL(file));
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all duration-500
        ${preview ? "border-[#FF6B00] shadow-[0_0_60px_rgba(255,107,0,0.3)]" : "border-white/15 border-dashed bg-white/[0.02]"}`}>
        {preview ? (
          <img src={preview} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <Camera className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <span className="text-[0.65rem] text-white/20 uppercase tracking-wider">{t("perfil.foto.toque")}</span>
          </div>
        )}
      </div>
      {uploadError && <p className="text-[#FF453A] text-sm font-medium text-center">{uploadError}</p>}
      <div className="flex gap-3 w-full max-w-xs">
        <button type="button" onClick={() => { if (fileRef.current) { fileRef.current.setAttribute("capture", "user"); fileRef.current.click(); } }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-white/10 bg-white/5 text-white/80 text-sm font-medium hover:border-white/25 hover:bg-white/8 transition-all cursor-pointer active:scale-95">
          <Camera className="w-5 h-5" />{t("perfil.foto.camera")}
        </button>
        <button type="button" onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click(); } }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-[#FF6B00]/50 bg-[#FF6B00]/10 text-white text-sm font-medium hover:bg-[#FF6B00]/20 transition-all cursor-pointer active:scale-95">
          <Upload className="w-5 h-5" />{t("perfil.foto.galeria")}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

/* ============================================================
   FLAGS
   ============================================================ */
function FlagBR({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="480" fill="#009b3a"/><polygon points="320,39 600,240 320,441 40,240" fill="#fedf00"/><circle cx="320" cy="240" r="95" fill="#002776"/><path d="M196,248 Q320,180 444,248" fill="none" stroke="#fff" strokeWidth="12"/></svg>);
}
function FlagES({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="480" fill="#c60b1e"/><rect y="120" width="640" height="240" fill="#ffc400"/></svg>);
}
function FlagUS({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="480" fill="#fff"/>{[0,2,4,6,8,10,12].map(i => <rect key={i} y={i*37} width="640" height="37" fill="#b22234"/>)}<rect width="256" height="259" fill="#3c3b6e"/></svg>);
}

const FLAG_COMPONENTS: Record<Locale, typeof FlagBR> = { pt: FlagBR, es: FlagES, en: FlagUS };

function LangSelector() {
  const { locale, setLocale } = useI18n();
  const langs: Locale[] = ["pt", "es", "en"];
  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1">
      {langs.map((l) => {
        const Flag = FLAG_COMPONENTS[l];
        return (
          <button key={l} onClick={() => setLocale(l)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer
              ${locale === l ? "bg-[#FF6B00] text-white shadow-lg" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}>
            <Flag className="w-5 h-3.5 rounded-[2px] overflow-hidden flex-shrink-0" />
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */
function tsToDate(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toISOString().split("T")[0];
}

function dateToTs(s: string): number | null {
  if (!s) return null;
  return new Date(s + "T12:00:00").getTime();
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function EmbaixadorPerfil() {
  const { t, setLocale } = useI18n();
  const [qIdx, setQIdx] = useState(-1);
  const [form, setForm] = useState<FormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState<"pendente" | "aprovado" | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifyNum, setVerifyNum] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"ok" | "cadastrado" | "pendente" | null>(null);
  const [foundEmb, setFoundEmb] = useState<any>(null);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("app-locale");
    if (saved) return;
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === "es") setLocale("es");
    else if (browserLang === "en") setLocale("en");
  }, []);

  // Check if user already submitted
  useEffect(() => {
    const savedEmail = localStorage.getItem("perfil-email");
    if (!savedEmail) { setCheckingStatus(false); return; }
    supabase
      .from("inscricoes")
      .select("status")
      .eq("tipo", "atualizacao_perfil")
      .eq("email", savedEmail)
      .order("createdAt", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const st = data[0].status;
          if (st === "pendente" || st === "aprovado") setAlreadySubmitted(st as any);
        }
        setCheckingStatus(false);
      });
  }, []);

  const questions = buildQuestions(t);
  const visibleQuestions = questions.filter((q) => !q.showIf || q.showIf(form));
  const current = qIdx >= 0 ? visibleQuestions[qIdx] : null;
  const totalVisible = visibleQuestions.length;
  const isWelcome = qIdx === -1;
  const isLast = qIdx === totalVisible - 1;
  const bgIdx = current ? current.sectionIndex : 0;

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
    if (current.type === "photo") return true; // photo is optional for update
    if (!current.required) return true;
    const v = form[current.key];
    if (v === "" || v === null || v === undefined) { setFieldError(t("insc.erro.campo")); return false; }
    if (current.type === "email" && typeof v === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setFieldError(t("insc.erro.email")); return false; }
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

      // Save to inscricoes as pending profile update (admin must approve)
      const { error: err } = await supabase.from("inscricoes").insert({
        tipo: "atualizacao_perfil",
        nomeCompleto: form.nomeCompleto,
        dataNascimento: form.dataNascimento || null,
        email: form.email,
        telefone: form.telefone,
        instagram: form.instagram || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        numeroLegendario: form.numeroLegendario || null,
        fotoUrl,
        estadoCivil: form.estadoCivil || null,
        nomeEsposa: form.nomeEsposa || null,
        dataNascimentoEsposa: form.dataNascimentoEsposa || null,
        qtdFilhos: form.qtdFilhos,
        idadesFilhos: form.idadesFilhos || null,
        // Endereço
        endereco: form.endereco || null,
        bairro: form.bairro || null,
        cep: form.cep || null,
        pais: form.pais || null,
        // Programas (arrays → string separada por vírgula)
        programasParticipou: form.programasParticipou.length ? form.programasParticipou.join(",") : null,
        aberturasPaises: form.aberturasPaises.length ? form.aberturasPaises.join(",") : null,
        // Jornada Embaixador
        dataEmbaixador: form.dataEmbaixador || null,
        sedeLegendario: form.sedeLegendario || null,
        cargoLideranca: form.cargoLideranca || null,
        doacaoPoco: form.doacaoPoco || null,
        numeroAnel: form.numeroAnel || null,
        // Itens recebidos
        temJaqueta: form.temJaqueta || null,
        temPin: form.temPin || null,
        temPatch: form.temPatch || null,
        temEspada: form.temEspada || null,
        status: "pendente",
      } as any);
      if (err) throw err;

      // Notify admins (fire-and-forget)
      const locale = localStorage.getItem("app-locale") || "pt";
      supabase.functions.invoke("notify-profile-update", {
        body: { nome: form.nomeCompleto, email: null, telefone: null, locale },
      }).catch(() => {});

      localStorage.setItem("perfil-email", form.email);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ==================== LOADING CHECK ==================== */
  if (checkingStatus) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  /* ==================== ALREADY SUBMITTED ==================== */
  if (alreadySubmitted) {
    const isPending = alreadySubmitted === "pendente";
    return (
      <div className="min-h-dvh relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 50% 40%, ${isPending ? "rgba(255,159,10,0.08)" : "rgba(48,209,88,0.08)"} 0%, transparent 60%)`,
        }} />
        <div className="relative z-10 text-center max-w-md slide-up">
          <img src={LOGO} alt="Legendários" className="h-14 mx-auto mb-10 opacity-60" />

          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_60px_${isPending ? "rgba(255,159,10,0.3)" : "rgba(48,209,88,0.3)"}]`}
              style={{ background: isPending ? "linear-gradient(135deg, #FF9F0A, #E88B00)" : "linear-gradient(135deg, #30D158, #28a745)" }}>
              {isPending ? (
                <Loader2 className="w-10 h-10 text-white animate-[spin_3s_linear_infinite]" />
              ) : (
                <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            {t(isPending ? "perfil.status.pendente" : "perfil.status.aprovado")}
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm mx-auto">
            {t(isPending ? "perfil.status.pendente.desc" : "perfil.status.aprovado.desc")}
          </p>

          {isPending && (
            <button
              type="button"
              onClick={() => { localStorage.removeItem("perfil-email"); setAlreadySubmitted(null); }}
              className="mt-10 text-sm text-white/30 hover:text-white/50 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {t("perfil.status.reenviar")}
            </button>
          )}
        </div>
        <style>{`
          @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .slide-up { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        `}</style>
      </div>
    );
  }

  /* ==================== SUCCESS ==================== */
  if (submitted) {
    return (
      <div className="min-h-dvh relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(255,107,0,0.1) 0%, transparent 60%)",
        }} />
        <div className="relative z-10 text-center max-w-md slide-up">
          <div className="relative w-28 h-28 mx-auto mb-10">
            <div className="absolute inset-0 rounded-full bg-[#FF6B00]/15 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-2 rounded-full bg-[#FF6B00]/10 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#ff8533] flex items-center justify-center shadow-[0_0_80px_rgba(255,107,0,0.4)]">
              <Check className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">{t("perfil.sucesso.titulo")}</h1>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-sm mx-auto">{t("perfil.sucesso.msg")}</p>
          <div className="mt-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <div className="w-2 h-2 rounded-full bg-[#30D158]" />
            <span className="text-[0.75rem] text-white/40">{t("perfil.sucesso.aguarde")}</span>
          </div>
        </div>
        <style>{`
          @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .slide-up { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        `}</style>
      </div>
    );
  }

  /* ==================== WELCOME / VERIFY ==================== */
  if (isWelcome) {
    const handleVerify = async () => {
      if (!verifyNum.trim()) { setVerifyError(t("perfil.verify.vazio")); return; }
      setVerifying(true);
      setVerifyError("");
      setVerifyStatus(null);

      // Normaliza: remove "L#", "#", espaços e deixa apenas alfanumérico
      const num = verifyNum.trim().replace(/[^0-9A-Za-z]/g, "");
      if (!num) { setVerifyError(t("perfil.verify.vazio")); setVerifying(false); return; }

      // Secure RPC: check if already registered (only returns masked email + minimal data)
      const { data: embData } = await supabase.rpc("verificar_legendario", { num_legendario: num });
      if (embData && embData.length > 0) {
        setFoundEmb({
          nomeCompleto: embData[0].nome,
          email: embData[0].email,
          numeroEmbaixador: embData[0].numero_embaixador,
          numeroLegendario: embData[0].numero_legendario,
          fotoUrl: embData[0].foto_url,
        });
        setVerifyStatus("cadastrado");
        setVerifying(false);
        return;
      }

      // Check if already submitted a pending profile (match exato após normalização)
      const { data: inscData } = await supabase
        .from("inscricoes")
        .select("id, status, numeroLegendario")
        .eq("tipo", "atualizacao_perfil")
        .order("createdAt", { ascending: false })
        .limit(50);
      const normalized = num.toUpperCase();
      const match = (inscData || []).find((r: any) => {
        const stored = String(r.numeroLegendario || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
        return stored && stored === normalized;
      });
      if (match && match.status === "pendente") {
        setVerifyStatus("pendente");
        setVerifying(false);
        return;
      }

      // Not found → can proceed to fill the form
      setForm((p) => ({ ...p, numeroLegendario: num }));
      setVerifyStatus("ok");
      setVerified(true);
      setVerifying(false);
    }

    return (
      <div className="min-h-dvh relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,107,0,0.06) 0%, transparent 100%)",
        }} />

        {/* Content */}
        <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-6 py-12">
          {/* Lang selector */}
          <div className="absolute top-6 right-6"><LangSelector /></div>

          {/* Logo */}
          <div className="relative mb-12 slide-up">
            <div className="absolute -inset-8 blur-[60px] opacity-20 bg-[#FF6B00] rounded-full" />
            <img src={LOGO} alt="Legendários" className="relative h-24 sm:h-28 drop-shadow-2xl" />
          </div>

          {/* Card container */}
          <div className="w-full max-w-md">
            {/* Badge */}
            <div className="flex justify-center mb-8 slide-up" style={{ animationDelay: "80ms" }}>
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                <span className="text-[0.65rem] font-semibold text-white/50 uppercase tracking-[0.2em]">{t("perfil.welcome.badge")}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-center text-[2.5rem] sm:text-5xl font-extrabold text-white mb-5 leading-[1.08] tracking-[-0.03em] slide-up" style={{ animationDelay: "160ms" }}>
              {t("perfil.welcome.titulo1")}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#ffb366] to-[#FF6B00]">{t("perfil.welcome.titulo2")}</span>
            </h1>

            {/* Description */}
            <p className="text-center text-white/40 text-[0.95rem] sm:text-base leading-relaxed mb-12 max-w-sm mx-auto slide-up" style={{ animationDelay: "240ms" }}>
              {t("perfil.welcome.desc")}
            </p>

            {!verified ? (
              /* ---- VERIFY STEP ---- */
              <div className="slide-up" style={{ animationDelay: "320ms" }}>
                {/* Glass card */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2.5 mb-6">
                    <Shield className="w-4 h-4 text-[#FF6B00]" />
                    <span className="text-[0.7rem] font-semibold text-white/50 uppercase tracking-[0.15em]">{t("perfil.verify.titulo")}</span>
                  </div>

                  <input
                    type="text"
                    value={verifyNum}
                    onChange={(e) => { setVerifyNum(e.target.value); setVerifyError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                    placeholder={t("perfil.verify.placeholder")}
                    className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#FF6B00]/60 rounded-2xl px-6 py-4.5 text-center text-[1.1rem] text-white placeholder:text-white/20 focus:outline-none transition-all duration-300 caret-[#FF6B00] focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]"
                    autoFocus
                  />

                  {verifyError && (
                    <p className="mt-4 text-[#FF453A] text-[0.8rem] text-center font-medium">{verifyError}</p>
                  )}

                  {/* Status messages */}
                  {verifyStatus === "cadastrado" && foundEmb && (
                    <div className="mt-5 rounded-2xl bg-[#0A84FF]/6 border border-[#0A84FF]/12 overflow-hidden">
                      <div className="p-5 flex items-center gap-4">
                        {foundEmb.fotoUrl ? (
                          <img src={foundEmb.fotoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[#0A84FF]/30 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#0A84FF]/15 flex items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-[#0A84FF]">{foundEmb.nomeCompleto?.charAt(0)}</span>
                          </div>
                        )}
                        <div className="text-left min-w-0">
                          <p className="text-[0.95rem] text-white font-semibold truncate">{foundEmb.nomeCompleto}</p>
                          {foundEmb.email && <p className="text-[0.75rem] text-white/40 truncate">{foundEmb.email}</p>}
                          <div className="flex gap-2 mt-1">
                            {foundEmb.numeroLegendario && <span className="text-[0.65rem] text-[#FF9F0A] font-medium">L#{foundEmb.numeroLegendario}</span>}
                            {foundEmb.numeroEmbaixador && <span className="text-[0.65rem] text-[#0A84FF] font-medium">E#{foundEmb.numeroEmbaixador}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.04] text-center">
                        <p className="text-[0.8rem] text-[#0A84FF] font-medium">{t("perfil.verify.jaCadastrado")}</p>
                        <p className="text-[0.7rem] text-white/35 mt-0.5">{t("perfil.verify.jaCadastrado.desc")}</p>
                      </div>
                    </div>
                  )}
                  {verifyStatus === "pendente" && (
                    <div className="mt-5 p-4 rounded-2xl bg-[#FF9F0A]/8 border border-[#FF9F0A]/15 text-center">
                      <p className="text-[0.85rem] text-[#FF9F0A] font-medium mb-1">{t("perfil.verify.emAnalise")}</p>
                      <p className="text-[0.75rem] text-white/40">{t("perfil.verify.emAnalise.desc")}</p>
                    </div>
                  )}

                  {!verifyStatus && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={verifying || !verifyNum.trim()}
                      className="mt-5 w-full relative flex items-center justify-center gap-2.5 text-white font-bold py-4.5 rounded-2xl text-[0.95rem] transition-all duration-300 cursor-pointer overflow-hidden disabled:opacity-40 active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00] to-[#E85D00] rounded-2xl" />
                      <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" style={{
                        background: "linear-gradient(to right, #ff8533, #FF6B00)",
                      }} />
                      {verifying ? <Loader2 className="relative w-5 h-5 animate-spin" /> : (
                        <>
                          <span className="relative">{t("perfil.verify.btn")}</span>
                          <ArrowRight className="relative w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ---- VERIFIED → START ---- */
              <div className="text-center slide-up">
                <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#30D158]/8 border border-[#30D158]/15 mb-10">
                  <Check className="w-4 h-4 text-[#30D158]" />
                  <span className="text-[0.85rem] text-[#30D158] font-semibold">{t("perfil.verify.ok")}</span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => { setDirection("next"); setQIdx(0); }}
                    className="group relative inline-flex items-center gap-3 text-white font-bold px-14 py-5 rounded-full text-lg transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.97]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00] to-[#E85D00] transition-all duration-300 group-hover:brightness-110" />
                    <span className="relative">{t("perfil.welcome.comecar")}</span>
                    <ArrowRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
                    <div className="absolute -inset-2 rounded-full opacity-30 blur-2xl bg-[#FF6B00] -z-10" />
                  </button>
                </div>

                <p className="text-white/25 text-xs mt-8">{t("perfil.welcome.tempo")}</p>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
          .slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        `}</style>
      </div>
    );
  }

  /* ==================== QUESTION ==================== */
  if (!current) return null;

  return (
    <div className="min-h-dvh relative overflow-hidden flex flex-col" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 transition-all duration-700" style={{ background: BG_GRADIENTS[bgIdx] || BG_GRADIENTS[0] }} />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
        <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#ff9a44] transition-all duration-500 ease-out"
          style={{ width: `${((qIdx + 1) / totalVisible) * 100}%` }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <img src={LOGO} alt="Legendários" className="h-10 sm:h-14 opacity-70" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 font-medium tracking-wider uppercase">{current.section}</span>
          <span className="text-xs text-white/30">{qIdx + 1}/{totalVisible}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-36">
        <div className={`w-full max-w-xl ${direction === "next" ? "slide-up" : "slide-down"}`} key={`q-${qIdx}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#FF6B00] font-mono text-sm font-bold">{qIdx + 1}</span>
            <ArrowRight className="w-3 h-3 text-[#FF6B00]/60" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3 break-words">
            {current.question}
          </h2>
          {current.subtitle && <p className="text-white/50 text-base mb-6">{current.subtitle}</p>}

          <div className="mt-8">
            {current.type === "photo" && (
              <PhotoUpload preview={form.fotoPreview} t={t}
                onChange={(file, preview) => { setForm((p) => ({ ...p, fotoFile: file, fotoPreview: preview })); setFieldError(""); }} />
            )}

            {current.type === "date" && (
              <input ref={inputRef as React.RefObject<HTMLInputElement>} type="date"
                value={form[current.key] as string} onChange={(e) => set(current.key, e.target.value as any)}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-[16px] sm:text-2xl text-white focus:outline-none transition-colors duration-300 caret-[#FF6B00] [color-scheme:dark]" autoFocus />
            )}

            {current.type === "tel" && (
              <PhoneInput value={form[current.key] as string} onChange={(val) => set(current.key, val as any)}
                placeholder={current.placeholder} variant="underline" />
            )}

            {(current.type === "text" || current.type === "email") && (
              <input ref={inputRef as React.RefObject<HTMLInputElement>} type={current.type}
                inputMode={current.type === "email" ? "email" : "text"}
                value={form[current.key] as string} onChange={(e) => set(current.key, e.target.value as any)}
                placeholder={current.placeholder}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-[16px] sm:text-2xl text-white placeholder:text-white/25 focus:outline-none transition-colors duration-300 caret-[#FF6B00]" autoFocus />
            )}

            {current.type === "number" && (
              <input ref={inputRef as React.RefObject<HTMLInputElement>} type="number" min={0}
                value={form[current.key] as number} onChange={(e) => set(current.key, Number(e.target.value) as any)}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#FF6B00] px-0 py-4 text-2xl sm:text-3xl text-white focus:outline-none transition-colors duration-300 caret-[#FF6B00]" autoFocus />
            )}

            {current.type === "radio" && current.options && (
              <div className="flex flex-col gap-3">
                {current.options.map((opt) => (
                  <OptionButton key={opt.value} label={opt.label} icon={opt.icon}
                    selected={form[current.key] === opt.value}
                    onClick={() => {
                      set(current.key, opt.value as any);
                      setTimeout(() => { if (!isLast) { setDirection("next"); setQIdx((i) => i + 1); } }, 400);
                    }} />
                ))}
              </div>
            )}

            {current.type === "checkbox" && current.options && (
              <div className="flex flex-col gap-3">
                {current.options.map((opt) => {
                  const currentValue = (form[current.key] as string[]) || [];
                  const isSelected = currentValue.includes(opt.value);
                  return (
                    <CheckboxOption
                      key={opt.value}
                      label={opt.label}
                      selected={isSelected}
                      onClick={() => {
                        const next = isSelected
                          ? currentValue.filter((v) => v !== opt.value)
                          : [...currentValue, opt.value];
                        set(current.key, next as any);
                      }}
                    />
                  );
                })}
                <p className="text-white/30 text-xs mt-2">{t("perfil.checkbox.multi")}</p>
              </div>
            )}
          </div>

          {fieldError && <p className="mt-4 text-red-400 text-sm font-medium">{fieldError}</p>}
          {error && <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>}

          {(current.type === "text" || current.type === "email" || current.type === "tel" || current.type === "number" || current.type === "date") && (
            <p className="mt-6 text-white/25 text-xs">
              {t("insc.nav.enter")} <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono text-[10px]">Enter</kbd> {t("insc.nav.continuar")}
            </p>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-t from-black/90 to-transparent h-20 pointer-events-none" />
        <div className="bg-black/60 backdrop-blur-xl px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-between">
          <button type="button" onClick={prev}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />{t("insc.nav.voltar")}
          </button>

          {isLast ? (
            <button type="button" onClick={submit} disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] text-white font-bold px-8 py-3 rounded-full text-sm transition-all duration-200 shadow-[0_4px_24px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_32px_rgba(255,107,0,0.45)] hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 cursor-pointer">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("perfil.nav.salvar")}
            </button>
          ) : (
            <button type="button" onClick={next}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] text-white font-bold px-8 py-3 rounded-full text-sm transition-all duration-200 shadow-[0_4px_24px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_32px_rgba(255,107,0,0.45)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer">
              OK <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .slide-down { animation: slide-down 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}
