import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Embaixadores from "./pages/Embaixadores";
import TercaDeGloria from "./pages/TercaDeGloria";
import WelcomeKit from "./pages/WelcomeKit";
import Eventos from "./pages/Eventos";
import Entrevistas from "./pages/Entrevistas";
import Admin from "./pages/Admin";
import { Loader2 } from "lucide-react";

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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {isAuthenticated ? <Router /> : <Login />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
