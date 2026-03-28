import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Settings as SettingsIcon, Mail, MessageCircle, Loader2, Save, Eye, EyeOff, Shield, Lock } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ConfigItem {
  id: number;
  key: string;
  value: string;
  description: string;
}

export default function Settings() {
  const { isAdmin, session } = useAuth();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  async function callCrypto(action: string, key?: string, value?: string) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/crypto-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, key, value }),
    });
    return res.json();
  }

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const result = await callCrypto("load");
      if (result.data) {
        setConfigs(result.data);
      } else {
        toast.error(result.error || "Erro ao carregar configurações");
      }
    } catch {
      toast.error("Erro ao carregar configurações");
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sensitiveKeys = ["smtp_password", "zapi_token", "zapi_client_token", "zapi_instance_id"];
      for (const config of configs) {
        if (sensitiveKeys.includes(config.key)) {
          // Encrypt via Edge Function
          const result = await callCrypto("save", config.key, config.value);
          if (result.error) throw new Error(result.error);
        } else {
          // Non-sensitive: save directly
          const res = await fetch(`${SUPABASE_URL}/functions/v1/crypto-config`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ action: "save", key: config.key, value: config.value }),
          });
          const result = await res.json();
          if (result.error) throw new Error(result.error);
        }
      }
      toast.success("Configurações salvas e criptografadas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(key: string, value: string) {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  }

  function getConfig(key: string) {
    return configs.find(c => c.key === key)?.value || "";
  }

  function isPasswordField(key: string) {
    return key.includes("password") || key.includes("token") || key.includes("secret");
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-[#FF453A]" />
          <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
          <p className="text-[#86868b]">Apenas administradores podem acessar as configurações.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-[#FF6B00]" />
            Configurações
          </h1>
          <p className="text-[0.8125rem] text-[#86868b] mt-0.5">Configurações de integrações e notificações</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
            {/* SMTP Section */}
            <div className="apple-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FF6B00]" />
                Email (SMTP)
              </h2>
              <p className="text-xs text-[#86868b]">Configure o servidor de email para envio de notificações.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="apple-input-label">Servidor SMTP</label>
                  <input
                    value={getConfig("smtp_host")}
                    onChange={(e) => updateConfig("smtp_host", e.target.value)}
                    placeholder="smtp.hostinger.com"
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="apple-input-label">Porta</label>
                  <input
                    value={getConfig("smtp_port")}
                    onChange={(e) => updateConfig("smtp_port", e.target.value)}
                    placeholder="465"
                    className="apple-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="apple-input-label">Usuário</label>
                  <input
                    value={getConfig("smtp_user")}
                    onChange={(e) => updateConfig("smtp_user", e.target.value)}
                    placeholder="noreply@marciosager.com"
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="apple-input-label">Senha</label>
                  <div className="relative">
                    <input
                      type={showPasswords["smtp_password"] ? "text" : "password"}
                      value={getConfig("smtp_password")}
                      onChange={(e) => updateConfig("smtp_password", e.target.value)}
                      placeholder="Senha do email"
                      className="apple-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, smtp_password: !p.smtp_password }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-[#86868b]"
                    >
                      {showPasswords["smtp_password"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="apple-input-label">Email Remetente</label>
                <input
                  value={getConfig("smtp_from")}
                  onChange={(e) => updateConfig("smtp_from", e.target.value)}
                  placeholder="noreply@marciosager.com"
                  className="apple-input"
                />
              </div>
            </div>

            {/* Z-API Section */}
            <div className="apple-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                WhatsApp (Z-API)
              </h2>
              <p className="text-xs text-[#86868b]">Configure a integração com Z-API para envio de mensagens via WhatsApp.</p>

              <div>
                <label className="apple-input-label">Instance ID</label>
                <input
                  value={getConfig("zapi_instance_id")}
                  onChange={(e) => updateConfig("zapi_instance_id", e.target.value)}
                  placeholder="ID da instância Z-API"
                  className="apple-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="apple-input-label">Token</label>
                  <div className="relative">
                    <input
                      type={showPasswords["zapi_token"] ? "text" : "password"}
                      value={getConfig("zapi_token")}
                      onChange={(e) => updateConfig("zapi_token", e.target.value)}
                      placeholder="Token de integração"
                      className="apple-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, zapi_token: !p.zapi_token }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-[#86868b]"
                    >
                      {showPasswords["zapi_token"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="apple-input-label">Client Token</label>
                  <div className="relative">
                    <input
                      type={showPasswords["zapi_client_token"] ? "text" : "password"}
                      value={getConfig("zapi_client_token")}
                      onChange={(e) => updateConfig("zapi_client_token", e.target.value)}
                      placeholder="Token de segurança"
                      className="apple-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, zapi_client_token: !p.zapi_client_token }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-[#86868b]"
                    >
                      {showPasswords["zapi_client_token"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="apple-btn apple-btn-filled py-3 px-8 text-sm font-semibold rounded-xl flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </button>
              <p className="text-xs text-[#48484a] flex items-center gap-1.5 mt-3">
                <Lock className="w-3.5 h-3.5" />
                Senhas e tokens são criptografados com AES-256 + salt antes de salvar.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
