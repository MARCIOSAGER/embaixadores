import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileEmbaixador, useUpdateEmbaixador } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Camera, Loader2, Save, Mail, User } from "lucide-react";

export default function Profile() {
  const { user: authUser, userName } = useAuth();
  const { data: embaixador, isLoading } = useProfileEmbaixador(authUser?.email ?? null);
  const updateMut = useUpdateEmbaixador();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nomeCompleto: "",
    telefone: "",
    cidade: "",
    estado: "",
    profissao: "",
    empresa: "",
    numeroLegendario: "",
    numeroEmbaixador: "",
  });
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (embaixador) {
      setForm({
        nomeCompleto: embaixador.nomeCompleto || "",
        telefone: embaixador.telefone || "",
        cidade: embaixador.cidade || "",
        estado: embaixador.estado || "",
        profissao: embaixador.profissao || "",
        empresa: embaixador.empresa || "",
        numeroLegendario: embaixador.numeroLegendario || "",
        numeroEmbaixador: embaixador.numeroEmbaixador || "",
      });
      setAvatarUrl(embaixador.fotoUrl || null);
    }
  }, [embaixador]);

  const email = authUser?.email || "";
  const displayName = form.nomeCompleto || userName || authUser?.user_metadata?.name || email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  function handleSave() {
    if (!embaixador) return toast.error("Perfil de embaixador nao encontrado.");
    if (!form.nomeCompleto.trim()) return toast.error("Nome completo e obrigatorio.");

    updateMut.mutate(
      {
        id: embaixador.id,
        nomeCompleto: form.nomeCompleto,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        profissao: form.profissao || null,
        empresa: form.empresa || null,
        numeroLegendario: form.numeroLegendario || null,
        numeroEmbaixador: form.numeroEmbaixador || null,
        fotoUrl: avatarUrl || null,
      },
      {
        onSuccess: () => toast.success("Perfil atualizado com sucesso!"),
        onError: (e: any) => toast.error(e.message || "Erro ao atualizar perfil."),
      }
    );
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return toast.error("Apenas arquivos JPG e PNG sao permitidos.");
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Tamanho maximo: 2MB.");
    }

    setUploading(true);
    try {
      const userId = authUser?.id;
      if (!userId) throw new Error("Usuario nao autenticado.");

      // NOTE: The "avatars" bucket must be created in Supabase Dashboard > Storage
      // with public access enabled for getPublicUrl to work.
      const filePath = `${userId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);
      toast.success("Foto enviada! Clique em Salvar para confirmar.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">Meu Perfil</h1>
          <p className="text-[0.8125rem] text-[#86868b] mt-0.5">Gerencie suas informacoes pessoais</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          </div>
        ) : !embaixador ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7 text-[#48484a]" strokeWidth={1.5} />
            </div>
            <p className="text-[0.875rem] text-[#86868b]">Nenhum perfil de embaixador vinculado a este e-mail.</p>
            <p className="text-[0.75rem] text-[#48484a] mt-2">Entre em contato com o administrador.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group"
                disabled={uploading}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/[0.06]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-3xl font-bold">
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" strokeWidth={1.5} />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-[0.6875rem] text-[#48484a]">Clique para alterar a foto (JPG/PNG, max 2MB)</p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="apple-input-label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48484a]" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="apple-input pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="apple-input-label">Nome completo *</label>
                <input
                  value={form.nomeCompleto}
                  onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                  className="apple-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="apple-input-label">Telefone</label>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="apple-input-label">Profissao</label>
                  <input
                    value={form.profissao}
                    onChange={(e) => setForm({ ...form, profissao: e.target.value })}
                    className="apple-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="apple-input-label">Cidade</label>
                  <input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="apple-input-label">Estado</label>
                  <input
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="apple-input"
                  />
                </div>
              </div>

              <div>
                <label className="apple-input-label">Empresa</label>
                <input
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  className="apple-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="apple-input-label">Numero do Legendario</label>
                  <input
                    value={form.numeroLegendario}
                    onChange={(e) => setForm({ ...form, numeroLegendario: e.target.value })}
                    className="apple-input"
                    placeholder="L#"
                  />
                </div>
                <div>
                  <label className="apple-input-label">Numero do Embaixador</label>
                  <input
                    value={form.numeroEmbaixador}
                    onChange={(e) => setForm({ ...form, numeroEmbaixador: e.target.value })}
                    className="apple-input"
                    placeholder="E#"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={updateMut.isPending}
                className="apple-btn apple-btn-filled text-[0.8125rem] py-2.5 px-6 w-full sm:w-auto"
              >
                {updateMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" strokeWidth={2} />
                )}
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
