import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";

const LOGO_LEGENDARIOS = "/logo-legendarios.png";

export default function Login() {
  const { t } = useI18n();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (resetMode) {
        await resetPassword(email);
        setResetSent(true);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message === "Invalid login credentials"
        ? "Email ou senha incorretos"
        : err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B00]/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#FF6B00]/[0.05] rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E85D00]/[0.03] rounded-full blur-[150px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[420px] mx-auto px-6">

        {/* Logo - grande e imponente */}
        <div className="mb-6">
          <img
            src={LOGO_LEGENDARIOS}
            alt="Legendários"
            className="w-40 h-40 object-contain drop-shadow-[0_0_30px_rgba(255,107,0,0.3)] invert"
          />
        </div>

        {/* Title block */}
        <div className="text-center mb-10">
          <h1 className="text-[2.5rem] sm:text-[3rem] font-black tracking-[-0.04em] text-white leading-[1] mb-2">
            EMBAIXADORES
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-[#FF6B00] to-[#E85D00] mx-auto mb-4 rounded-full" />
          <p className="text-[0.9375rem] text-[#86868b] tracking-wide uppercase font-medium">
            {resetMode ? "Recuperar acesso" : "Sistema de Gestão"}
          </p>
        </div>

        {/* Form card */}
        <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {resetSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#30D158]/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-[#30D158]" />
                </div>
                <p className="text-white font-semibold text-lg">Email enviado!</p>
                <p className="text-[#86868b] text-sm leading-relaxed">
                  Verifique sua caixa de entrada para redefinir a senha.
                </p>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetSent(false); }}
                  className="text-[#FF6B00] text-sm font-semibold hover:underline mt-2"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <>
                {/* Email */}
                <div>
                  <label className="block mb-2 text-[0.8125rem] font-semibold text-[#a1a1a6] uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white text-[0.9375rem] placeholder:text-white/20 outline-none transition-all duration-300 focus:border-[#FF6B00] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]"
                  />
                </div>

                {/* Password */}
                {!resetMode && (
                  <div>
                    <label className="block mb-2 text-[0.8125rem] font-semibold text-[#a1a1a6] uppercase tracking-wider">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        required
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-4 pr-11 py-3.5 text-white text-[0.9375rem] placeholder:text-white/20 outline-none transition-all duration-300 focus:border-[#FF6B00] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-[#86868b] transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl px-4 py-3 text-[#FF453A] text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-[#E85D00] hover:from-[#FF7A1A] hover:to-[#FF6B00] text-white font-bold text-[1rem] tracking-wide rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,107,0,0.3)]"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {resetMode ? "ENVIAR LINK" : "ENTRAR NO SISTEMA"}
                </button>

                {/* Forgot password */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setResetMode(!resetMode); setError(""); }}
                    className="text-[#86868b] text-sm font-medium hover:text-[#FF6B00] transition-colors"
                  >
                    {resetMode ? "Voltar ao login" : "Esqueceu a senha?"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[#48484a] text-xs tracking-widest uppercase font-medium">
          Amor &middot; Honra &middot; Unidade
        </p>
      </div>
    </div>
  );
}
