import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

const LOGO_LEGENDARIOS = "/logo-legendarios.png";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao definir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B00]/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#FF6B00]/[0.05] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[420px] mx-auto px-6">
        <div className="mb-6">
          <img src={LOGO_LEGENDARIOS} alt="Legendários" className="w-32 h-32 object-contain drop-shadow-[0_0_30px_rgba(255,107,0,0.3)] invert" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-[2rem] sm:text-[2.5rem] font-black tracking-[-0.04em] text-white leading-[1] mb-2">
            {success ? "PRONTO!" : "BEM-VINDO"}
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-[#FF6B00] to-[#E85D00] mx-auto mb-4 rounded-full" />
          <p className="text-[0.9375rem] text-[#86868b] tracking-wide uppercase font-medium">
            {success ? "Senha definida com sucesso" : "Defina sua senha de acesso"}
          </p>
        </div>

        <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#30D158]/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#30D158]" />
              </div>
              <p className="text-white font-semibold text-lg">Senha definida com sucesso!</p>
              <p className="text-[#86868b] text-sm">Redirecionando para o sistema...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-[0.8125rem] font-semibold text-[#a1a1a6] uppercase tracking-wider">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
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

              <div>
                <label className="block mb-2 text-[0.8125rem] font-semibold text-[#a1a1a6] uppercase tracking-wider">
                  Confirmar Senha
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente"
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white text-[0.9375rem] placeholder:text-white/20 outline-none transition-all duration-300 focus:border-[#FF6B00] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]"
                />
              </div>

              {error && (
                <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl px-4 py-3 text-[#FF453A] text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-[#E85D00] hover:from-[#FF7A1A] hover:to-[#FF6B00] text-white font-bold text-[1rem] tracking-wide rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,107,0,0.3)]"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                DEFINIR SENHA
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-[#48484a] text-xs tracking-widest uppercase font-medium">
          Amor &middot; Honra &middot; Unidade
        </p>
      </div>
    </div>
  );
}
