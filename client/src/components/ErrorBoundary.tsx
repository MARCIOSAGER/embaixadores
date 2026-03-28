import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ErrorBoundary is a class component and cannot use hooks.
// We use a simple map for the 2 strings that need i18n.
const errorStrings: Record<string, { unexpected: string; reload: string }> = {
  pt: { unexpected: "Ocorreu um erro inesperado.", reload: "Recarregar Página" },
  es: { unexpected: "Ocurrió un error inesperado.", reload: "Recargar Página" },
  en: { unexpected: "An unexpected error occurred.", reload: "Reload Page" },
};

function getLocale(): string {
  try {
    const saved = localStorage.getItem("app-locale");
    if (saved && (saved === "pt" || saved === "es" || saved === "en")) return saved;
  } catch {
    // ignore
  }
  return "pt";
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const locale = getLocale();
      const strings = errorStrings[locale] || errorStrings.pt;

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">{strings.unexpected}</h2>

            {import.meta.env.DEV && this.state.error?.stack && (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              {strings.reload}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
