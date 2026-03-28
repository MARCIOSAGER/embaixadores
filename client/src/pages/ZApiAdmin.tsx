import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  MessageCircle, Wifi, WifiOff, RefreshCw, QrCode, Send,
  Loader2, Shield, Users, CheckCircle, XCircle
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ZApiAdmin() {
  const { isAdmin, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ connected: boolean; smartphoneConnected: boolean; error?: string } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [sendPhone, setSendPhone] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Load Z-API config from app_config
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const { data } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["zapi_instance_id", "zapi_token", "zapi_client_token"]);

    const cfg: Record<string, string> = {};
    data?.forEach((item: any) => { cfg[item.key] = item.value; });
    setConfig(cfg);
    setLoading(false);

    if (cfg.zapi_instance_id && cfg.zapi_token) {
      checkStatus(cfg);
    }
  }

  async function checkStatus(cfg?: Record<string, string>) {
    const c = cfg || config;
    if (!c.zapi_instance_id || !c.zapi_token) return;

    try {
      const res = await fetch(
        `https://api.z-api.io/instances/${c.zapi_instance_id}/token/${c.zapi_token}/status`,
        { headers: c.zapi_client_token ? { "Client-Token": c.zapi_client_token } : {} }
      );
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, smartphoneConnected: false, error: "Erro ao verificar status" });
    }
  }

  async function loadQrCode() {
    if (!config.zapi_instance_id || !config.zapi_token) {
      toast.error("Configure o Instance ID e Token primeiro");
      return;
    }

    setQrLoading(true);
    try {
      const res = await fetch(
        `https://api.z-api.io/instances/${config.zapi_instance_id}/token/${config.zapi_token}/qr-code/image`,
        { headers: config.zapi_client_token ? { "Client-Token": config.zapi_client_token } : {} }
      );
      const data = await res.json();
      if (data.value) {
        setQrCode(data.value);
      } else {
        toast.error("Não foi possível gerar o QR Code. Verifique se já está conectado.");
      }
    } catch {
      toast.error("Erro ao gerar QR Code");
    } finally {
      setQrLoading(false);
    }
  }

  async function disconnect() {
    if (!config.zapi_instance_id || !config.zapi_token) return;
    if (!confirm("Desconectar o WhatsApp?")) return;

    try {
      await fetch(
        `https://api.z-api.io/instances/${config.zapi_instance_id}/token/${config.zapi_token}/disconnect`,
        {
          method: "GET",
          headers: config.zapi_client_token ? { "Client-Token": config.zapi_client_token } : {},
        }
      );
      toast.success("WhatsApp desconectado");
      setStatus({ connected: false, smartphoneConnected: false });
      setQrCode(null);
    } catch {
      toast.error("Erro ao desconectar");
    }
  }

  async function handleSendTest() {
    if (!sendPhone.trim() || !sendMessage.trim()) {
      toast.error("Preencha o telefone e a mensagem");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ phone: sendPhone, message: sendMessage }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Mensagem enviada com sucesso!");
        setSendMessage("");
      } else {
        toast.error(data.error || "Erro ao enviar");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-[#FF453A]" />
          <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
        </div>
      </DashboardLayout>
    );
  }

  const isConnected = status?.connected === true;
  const hasConfig = config.zapi_instance_id && config.zapi_token;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            WhatsApp (Z-API)
          </h1>
          <p className="text-[0.8125rem] text-[#86868b] mt-0.5">Gerencie a integração com WhatsApp</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#25D366] animate-spin" />
          </div>
        ) : !hasConfig ? (
          <div className="apple-card p-8 text-center space-y-4 animate-fade-up">
            <MessageCircle className="w-12 h-12 text-[#48484a] mx-auto" />
            <h2 className="text-lg font-semibold text-white">Z-API não configurado</h2>
            <p className="text-sm text-[#86868b]">
              Configure o Instance ID e Token na página de <a href="/configuracoes" className="text-[#FF6B00] hover:underline">Configurações</a>.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
            {/* Status Card */}
            <div className="apple-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isConnected ? (
                    <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-[#25D366]" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FF453A]/10 flex items-center justify-center">
                      <WifiOff className="w-6 h-6 text-[#FF453A]" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {isConnected ? "Conectado" : "Desconectado"}
                    </h2>
                    <p className="text-xs text-[#86868b]">
                      {isConnected
                        ? `Smartphone: ${status?.smartphoneConnected ? "Online" : "Offline"}`
                        : status?.error || "WhatsApp não conectado"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => checkStatus()}
                    className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {isConnected && (
                    <button
                      onClick={disconnect}
                      className="apple-btn apple-btn-destructive px-3 py-2 text-sm rounded-xl"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            {!isConnected && (
              <div className="apple-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#FF6B00]" />
                  Conectar WhatsApp
                </h2>
                <p className="text-xs text-[#86868b]">
                  Escaneie o QR Code com o WhatsApp para conectar. O código expira a cada 20 segundos.
                </p>

                {qrCode ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-2xl">
                      <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={loadQrCode}
                        disabled={qrLoading}
                        className="apple-btn apple-btn-gray px-4 py-2 text-sm rounded-xl flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${qrLoading ? "animate-spin" : ""}`} />
                        Atualizar QR Code
                      </button>
                      <button
                        onClick={() => checkStatus()}
                        className="apple-btn apple-btn-filled px-4 py-2 text-sm rounded-xl flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verificar Conexão
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={loadQrCode}
                    disabled={qrLoading}
                    className="apple-btn apple-btn-filled px-6 py-3 text-sm rounded-xl flex items-center gap-2 mx-auto"
                  >
                    {qrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    Gerar QR Code
                  </button>
                )}
              </div>
            )}

            {/* Send Test Message */}
            {isConnected && (
              <div className="apple-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#FF6B00]" />
                  Enviar Mensagem de Teste
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="apple-input-label">Telefone (com DDD)</label>
                    <input
                      value={sendPhone}
                      onChange={(e) => setSendPhone(e.target.value)}
                      placeholder="5511999999999"
                      className="apple-input"
                    />
                  </div>
                  <div>
                    <label className="apple-input-label">Mensagem</label>
                    <input
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      placeholder="Olá, teste do sistema!"
                      className="apple-input"
                      onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendTest}
                  disabled={sending || !sendPhone.trim() || !sendMessage.trim()}
                  className="apple-btn apple-btn-filled px-6 py-2.5 text-sm rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar Teste
                </button>
              </div>
            )}

            {/* Info */}
            <div className="apple-card p-6 space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF6B00]" />
                Como funciona
              </h2>
              <div className="space-y-2 text-sm text-[#86868b]">
                <p>1. Gere o QR Code e escaneie com o WhatsApp</p>
                <p>2. Após conectar, voce pode enviar mensagens pelo sistema</p>
                <p>3. Nas paginas de Eventos, Terça de Gloria e Entrevistas, use o botão de WhatsApp para compartilhar</p>
                <p>4. As mensagens são enviadas de forma segura via Edge Function</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
