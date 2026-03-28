import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  MessageCircle, Wifi, WifiOff, RefreshCw, QrCode, Send,
  Loader2, Shield, Users, CheckCircle
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ZApiAdmin() {
  const { isAdmin, session } = useAuth();
  const [status, setStatus] = useState<{ connected: boolean; smartphoneConnected: boolean; error?: string } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [sendPhone, setSendPhone] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function callZapi(action: string, extra?: Record<string, string>) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/zapi-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, ...extra }),
    });
    return res.json();
  }

  async function checkStatus() {
    setStatusLoading(true);
    try {
      const data = await callZapi("status");
      setStatus(data);
    } catch {
      setStatus({ connected: false, smartphoneConnected: false, error: "Erro ao verificar" });
    } finally {
      setStatusLoading(false);
    }
  }

  async function loadQrCode() {
    setQrLoading(true);
    try {
      const data = await callZapi("qrcode");
      const qrValue = data.value || data.image;
      if (qrValue) {
        setQrCode(qrValue.replace(/^data:image\/\w+;base64,/, ""));
      } else {
        toast.error("Não foi possível gerar o QR Code");
      }
    } catch {
      toast.error("Erro ao gerar QR Code");
    } finally {
      setQrLoading(false);
    }
  }

  async function disconnect() {
    if (!confirm("Desconectar o WhatsApp?")) return;
    try {
      await callZapi("disconnect");
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
      const data = await callZapi("send", { phone: sendPhone, message: sendMessage });
      if (data.success) {
        toast.success("Mensagem enviada!");
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

        {/* Status Card */}
        <div className="apple-card p-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {statusLoading ? (
                <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#86868b] animate-spin" />
                </div>
              ) : isConnected ? (
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
                  {statusLoading ? "Verificando..." : isConnected ? "Conectado" : "Desconectado"}
                </h2>
                <p className="text-xs text-[#86868b]">
                  {isConnected
                    ? `Smartphone: ${status?.smartphoneConnected ? "Online" : "Offline"}`
                    : status?.error || "WhatsApp não conectado"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={checkStatus} className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
              {isConnected && (
                <button onClick={disconnect} className="apple-btn apple-btn-destructive px-3 py-2 text-sm rounded-xl">
                  Desconectar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* QR Code */}
        {!isConnected && !statusLoading && (
          <div className="apple-card p-6 space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
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
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="w-64 h-64" />
                </div>
                <div className="flex gap-2">
                  <button onClick={loadQrCode} disabled={qrLoading} className="apple-btn apple-btn-gray px-4 py-2 text-sm rounded-xl flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${qrLoading ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                  <button onClick={checkStatus} className="apple-btn apple-btn-filled px-4 py-2 text-sm rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verificar Conexão
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={loadQrCode} disabled={qrLoading} className="apple-btn apple-btn-filled px-6 py-3 text-sm rounded-xl flex items-center gap-2 mx-auto">
                {qrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Gerar QR Code
              </button>
            )}
          </div>
        )}

        {/* Send Test */}
        {isConnected && (
          <div className="apple-card p-6 space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-[#FF6B00]" />
              Enviar Mensagem de Teste
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="apple-input-label">Telefone (com DDD)</label>
                <input value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} placeholder="5511999999999" className="apple-input" />
              </div>
              <div>
                <label className="apple-input-label">Mensagem</label>
                <input value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} placeholder="Olá, teste do sistema!" className="apple-input" onKeyDown={(e) => e.key === "Enter" && handleSendTest()} />
              </div>
            </div>
            <button onClick={handleSendTest} disabled={sending || !sendPhone.trim() || !sendMessage.trim()} className="apple-btn apple-btn-filled px-6 py-2.5 text-sm rounded-xl flex items-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Teste
            </button>
          </div>
        )}

        {/* Info */}
        <div className="apple-card p-6 space-y-3 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6B00]" />
            Como funciona
          </h2>
          <div className="space-y-2 text-sm text-[#86868b]">
            <p>1. Gere o QR Code e escaneie com o WhatsApp</p>
            <p>2. Após conectar, voce pode enviar mensagens pelo sistema</p>
            <p>3. Nas páginas de Eventos, Terça de Glória e Entrevistas, use o botão de WhatsApp</p>
            <p>4. Todas as chamadas passam pela Edge Function (tokens seguros)</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
