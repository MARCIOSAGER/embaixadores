import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Embaixadores from "./pages/Embaixadores";
import TercaDeGloria from "./pages/TercaDeGloria";
import WelcomeKit from "./pages/WelcomeKit";
import Eventos from "./pages/Eventos";
import Entrevistas from "./pages/Entrevistas";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/embaixadores" component={Embaixadores} />
      <Route path="/terca-de-gloria" component={TercaDeGloria} />
      <Route path="/welcome-kit" component={WelcomeKit} />
      <Route path="/eventos" component={Eventos} />
      <Route path="/entrevistas" component={Entrevistas} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
