import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAdmin, isAuthenticated } = useAuth();

  if (requireAdmin && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-[#FF453A]" />
          <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
          <p className="text-[#86868b]">Apenas administradores podem acessar esta pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}
