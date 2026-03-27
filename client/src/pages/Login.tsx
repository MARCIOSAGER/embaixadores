import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="apple-mesh" />
      {/* Ambient glow - orange */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6B00]/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#E85D00]/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-[380px] w-full mx-auto px-6 animate-fade-up">
        {/* Logos */}
        <div className="flex items-center gap-5">
          <img src={LOGO_LEGENDARIOS} alt="Legendários" className="w-32 h-32 object-contain drop-shadow-2xl" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-[1.75rem] font-bold tracking-[-0.04em] text-white leading-[1.1]">
            Embaixadores
          </h1>
          <p className="text-[0.875rem] text-[#86868b] leading-relaxed">
            {resetMode ? "Digite seu email para redefinir a senha" : t("auth.subtitle")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {resetSent ? (
            <div className="apple-card p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#30D158]/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#30D158]" />
              </div>
              <p className="text-white font-medium">Email enviado!</p>
              <p className="text-[#86868b] text-sm">Verifique sua caixa de entrada para redefinir a senha.</p>
              <button
                type="button"
                onClick={() => { setResetMode(false); setResetSent(false); }}
                className="text-[#FF6B00] text-sm font-medium hover:underline"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label className="apple-input-label block mb-1.5 text-[#86868b]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="apple-input w-full px-4 py-3 text-[0.9375rem]"
                />
              </div>

              {/* Password (hidden in reset mode) */}
              {!resetMode && (
                <div>
                  <label className="apple-input-label block mb-1.5 text-[#86868b]">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      required
                      className="apple-input w-full pl-4 pr-10 py-3 text-[0.9375rem]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-[#86868b]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl px-4 py-3 text-[#FF453A] text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="apple-btn apple-btn-filled w-full py-3.5 text-[0.9375rem] font-semibold rounded-[14px] flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {resetMode ? "Enviar link de recuperacao" : t("auth.login")}
              </button>

              {/* Forgot password / Back to login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setResetMode(!resetMode); setError(""); }}
                  className="text-[#FF6B00] text-sm font-medium hover:underline"
                >
                  {resetMode ? "Voltar ao login" : "Esqueceu a senha?"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
