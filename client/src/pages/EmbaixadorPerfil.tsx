import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2, ArrowRight, ArrowLeft, Send, Camera, Upload, Globe } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import { useI18n, type Locale } from "@/lib/i18n";

const LOGO = "/logo-legendarios.png";

const BG_GRADIENTS = [
  "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 40%, #0d0d0d 100%)",           // Welcome
  "linear-gradient(135deg, #0a0a14 0%, #0c1a2e 50%, #050508 100%)",           // Pessoal (1)
  "linear-gradient(135deg, #0a1210 0%, #0c201c 50%, #060a09 100%)",           // Legendarios (2)
  "linear-gradient(135deg, #12100a 0%, #1e1408 50%, #0a0908 100%)",           // Familia (3)
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
};

const initial: FormData = {
  fotoFile: null, fotoPreview: "",
  nomeCompleto: "", dataNascimento: "", email: "", telefone: "", instagram: "",
  cidade: "", estado: "", numeroLegendario: "", numeroEmbaixador: "",
  estadoCivil: "", nomeEsposa: "", dataNascimentoEsposa: "", qtdFilhos: 0, idadesFilhos: "",
  profissao: "", empresa: "",
};

/* ---------- question definitions ---------- */
type Question = {
  key: keyof FormData;
  question: string;
  subtitle?: string;
  type: "text" | "email" | "tel" | "textarea" | "radio" | "number" | "photo" | "date";
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
    { key: "numeroLegendario", question: t("perfil.q.numLeg"), type: "text", placeholder: "Ex: L#91105", section: t("perfil.sec.legendarios"), sectionIndex: 2 },
    { key: "numeroEmbaixador", question: t("perfil.q.numEmb"), type: "text", placeholder: "Ex: E#001", section: t("perfil.sec.legendarios"), sectionIndex: 2 },
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
        status: "pendente",
      });
      if (err) throw err;

      // Notify admins (fire-and-forget)
      const locale = localStorage.getItem("app-locale") || "pt";
      supabase.functions.invoke("notify-profile-update", {
        body: { nome: form.nomeCompleto, email: null, telefone: null, locale },
      }).catch(() => {});

      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
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

  /* ==================== WELCOME ==================== */
  if (isWelcome) {
    return (
      <div className="min-h-dvh relative overflow-hidden flex items-center justify-center">
        {/* Background layers */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(2px) brightness(0.3)",
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(255,107,0,0.08) 0%, transparent 70%)",
        }} />

        <div className="relative z-10 text-center px-6 max-w-lg">
          <div className="flex justify-center mb-8"><LangSelector /></div>

          {/* Logo with glow */}
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-[#FF6B00] rounded-full scale-150" />
            <img src={LOGO} alt="Legendários" className="relative h-20 mx-auto drop-shadow-2xl" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm mb-6 slide-up">
            <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="text-[0.7rem] font-medium text-white/60 uppercase tracking-widest">{t("perfil.welcome.badge")}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight slide-up" style={{ animationDelay: "100ms" }}>
            {t("perfil.welcome.titulo1")}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#ff9a44] to-[#FF6B00]">{t("perfil.welcome.titulo2")}</span>
          </h1>

          {/* Description */}
          <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-12 max-w-sm mx-auto slide-up" style={{ animationDelay: "200ms" }}>
            {t("perfil.welcome.desc")}
          </p>

          {/* CTA Button */}
          <div className="slide-up" style={{ animationDelay: "300ms" }}>
            <button
              type="button"
              onClick={() => { setDirection("next"); setQIdx(0); }}
              className="group relative inline-flex items-center gap-3 text-white font-bold px-12 py-5 rounded-full text-lg transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] transition-all duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
              }} />
              <span className="relative">{t("perfil.welcome.comecar")}</span>
              <ArrowRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute -inset-1 rounded-full opacity-40 blur-xl bg-[#FF6B00] -z-10" />
            </button>
          </div>

          {/* Time estimate */}
          <p className="text-white/30 text-xs mt-8 slide-up" style={{ animationDelay: "400ms" }}>
            {t("perfil.welcome.tempo")}
          </p>
        </div>

        <style>{`
          @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .slide-up { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
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
        <img src={LOGO} alt="Legendários" className="h-8 opacity-70" />
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
