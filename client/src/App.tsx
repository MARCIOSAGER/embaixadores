import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded page components
const Home = lazy(() => import("./pages/Home"));
const Embaixadores = lazy(() => import("./pages/Embaixadores"));
const TercaDeGloria = lazy(() => import("./pages/TercaDeGloria"));
const WelcomeKit = lazy(() => import("./pages/WelcomeKit"));
const Eventos = lazy(() => import("./pages/Eventos"));
const Entrevistas = lazy(() => import("./pages/Entrevistas"));
const Inscricoes = lazy(() => import("./pages/Inscricoes"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const Admin = lazy(() => import("./pages/Admin"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const ZApiAdmin = lazy(() => import("./pages/ZApiAdmin"));
const Profile = lazy(() => import("./pages/Profile"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Inscricao = lazy(() => import("./pages/Inscricao"));
const EventoInscricao = lazy(() => import("./pages/EventoInscricao"));
const EmbaixadorPerfil = lazy(() => import("./pages/EmbaixadorPerfil"));
const MeusIndicados = lazy(() => import("./pages/MeusIndicados"));
import InstallPrompt from "./components/InstallPrompt";
import { supabase } from "./lib/supabase";

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/embaixadores" component={Embaixadores} />
        <Route path="/terca-de-gloria" component={TercaDeGloria} />
        <Route path="/welcome-kit" component={WelcomeKit} />
        <Route path="/eventos" component={Eventos} />
        <Route path="/entrevistas" component={Entrevistas} />
        <Route path="/inscricoes" component={Inscricoes} />
        <Route path="/pagamentos" component={Pagamentos} />
        <Route path="/meus-indicados" component={MeusIndicados} />
        <Route path="/produtos" component={Produtos} />
        <Route path="/pedidos">{() => <ProtectedRoute requireAdmin><Pedidos /></ProtectedRoute>}</Route>
        <Route path="/admin">{() => <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>}</Route>
        <Route path="/whatsapp">{() => <ProtectedRoute requireAdmin><ZApiAdmin /></ProtectedRoute>}</Route>
        <Route path="/perfil" component={Profile} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [needsPassword, setNeedsPassword] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Listen for auth events to detect invite/recovery flows
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setNeedsPassword(true);
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Clear hash from URL after OAuth callback
        if (window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      setAuthReady(true);
    });

    // Check URL hash for invite token (Supabase redirects with #type=invite)
    const hash = window.location.hash;
    if (hash.includes("type=invite") || hash.includes("type=recovery")) {
      setNeedsPassword(true);
    }

    // Don't set authReady immediately if there's a hash to process
    if (!window.location.hash.includes("access_token")) {
      setAuthReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  if (loading || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  // Show set password page for invited users or password recovery
  if (needsPassword && isAuthenticated) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <SetPassword />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <InstallPrompt />
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/privacidade" component={Privacy} />
              <Route path="/termos" component={Terms} />
              <Route path="/inscricao" component={Inscricao} />
              <Route path="/meu-perfil" component={EmbaixadorPerfil} />
              <Route path="/evento/:id" component={EventoInscricao} />
              <Route>{isAuthenticated ? <Router /> : <Login />}</Route>
            </Switch>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
