import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Home from "./pages/Home";
import Embaixadores from "./pages/Embaixadores";
import TercaDeGloria from "./pages/TercaDeGloria";
import WelcomeKit from "./pages/WelcomeKit";
import Eventos from "./pages/Eventos";
import Entrevistas from "./pages/Entrevistas";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/embaixadores" component={Embaixadores} />
      <Route path="/terca-de-gloria" component={TercaDeGloria} />
      <Route path="/welcome-kit" component={WelcomeKit} />
      <Route path="/eventos" component={Eventos} />
      <Route path="/entrevistas" component={Entrevistas} />
      <Route path="/admin" component={Admin} />
      <Route path="/perfil" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
      setAuthReady(true);
    });

    // Check URL hash for invite token (Supabase redirects with #type=invite)
    const hash = window.location.hash;
    if (hash.includes("type=invite") || hash.includes("type=recovery")) {
      setNeedsPassword(true);
    }

    setAuthReady(true);
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
          <Switch>
            <Route path="/privacidade" component={Privacy} />
            <Route path="/termos" component={Terms} />
            <Route>{isAuthenticated ? <Router /> : <Login />}</Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
