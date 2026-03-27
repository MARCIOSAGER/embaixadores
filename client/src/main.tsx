import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./lib/i18n";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <App />
    </I18nProvider>
  </QueryClientProvider>
);
