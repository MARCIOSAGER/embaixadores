import DashboardLayout from "@/components/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useUsers, useUpdateUserRole } from "@/hooks/useSupabase";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, UserPlus, Loader2, Mail, Crown, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-[#FF453A]" />
          <h2 className="text-xl font-bold text-white">{t("admin.acessoNegado")}</h2>
          <p className="text-[#86868b]">{t("admin.acessoNegadoDesc")}</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/auth/v1/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || data.message || "Erro ao enviar convite");
      }
      toast.success(t("admin.inviteSent"));
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar convite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("admin.title")}</h1>
          <p className="text-[#86868b] mt-1">{t("admin.subtitle")}</p>
        </div>

        {/* Invite User */}
        <div className="apple-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#FF6B00]" />
            {t("admin.invite")}
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="apple-input w-full px-4 py-2.5 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="apple-btn apple-btn-filled px-5 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("admin.sendInvite")}
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="apple-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF6B00]" />
              {t("admin.users")}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
            </div>
          ) : !users?.length ? (
            <div className="text-center py-12 text-[#86868b]">{t("admin.noUsers")}</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-xs font-bold">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.name || u.email || "—"}</p>
                      <p className="text-xs text-[#48484a]">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#48484a]">
                      {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "—"}
                    </span>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as "user" | "admin" })}
                      className="apple-input text-xs py-1 px-2 rounded-lg bg-white/[0.05] border-white/[0.1] text-white"
                    >
                      <option value="user">{t("admin.roleUser")}</option>
                      <option value="admin">{t("admin.roleAdmin")}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
