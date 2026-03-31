import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed before
      if (!localStorage.getItem("pwa-dismissed")) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 animate-fade-up">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Instalar App</p>
          <p className="text-xs text-[#86868b]">Acesse mais rapido pela tela inicial</p>
        </div>
        <button
          onClick={async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              await deferredPrompt.userChoice;
            }
            setShow(false);
          }}
          className="bg-[#FF6B00] text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer"
        >
          Instalar
        </button>
        <button
          onClick={() => { setShow(false); localStorage.setItem("pwa-dismissed", "1"); }}
          className="text-[#86868b] hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
