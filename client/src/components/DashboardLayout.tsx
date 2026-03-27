import { useI18n, type Locale } from "@/lib/i18n";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, Users, Church, Gift, Calendar, UserPlus,
  LogOut, Globe, Loader2
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

const LOGO_EMBAIXADOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663385583502/Ed66sXViBkMN3knWB5TRxe/logo-embaixador_dde21016.jpeg";
const LOGO_LEGENDARIOS = "/logo-legendarios.png";

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const user = { name: "Admin", email: "admin@embaixadores.com" };
  const [location] = useLocation();
  const { t, locale, setLocale } = useI18n();
  const [showLang, setShowLang] = useState(false);

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
    { path: "/embaixadores", icon: Users, label: t("nav.embaixadores") },
    { path: "/terca-de-gloria", icon: Church, label: t("nav.tercaGloria") },
    { path: "/welcome-kit", icon: Gift, label: t("nav.welcomeKit") },
    { path: "/eventos", icon: Calendar, label: t("nav.eventos") },
    { path: "/entrevistas", icon: UserPlus, label: t("nav.entrevistas") },
  ];

  useEffect(() => {
    if (showLang) {
      const handler = () => setShowLang(false);
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [showLang]);


  const initial = user?.name?.charAt(0)?.toUpperCase() || "E";

  return (
    <div className="min-h-screen bg-black">
      <div className="apple-mesh" />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col z-40 apple-vibrancy-ultra border-r-[0.5px] border-white/[0.06]">
        {/* Brand */}
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <img src={LOGO_LEGENDARIOS} alt="" className="w-9 h-9 rounded-xl object-cover" />
            <img src={LOGO_EMBAIXADOR} alt="" className="w-9 h-9 rounded-xl object-cover" />
          </div>
          <p className="apple-caption mt-4">Sistema de Gestão</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-[9px] rounded-[10px] transition-all duration-300 group cursor-pointer ${
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-[#86868b] hover:text-[#d2d2d7] hover:bg-white/[0.03]"
                  }`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] transition-colors duration-300 ${
                      active ? "text-[#FF6B00]" : "text-[#48484a] group-hover:text-[#636366]"
                    }`}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  <span className="text-[0.8125rem] font-medium tracking-[-0.01em]">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 space-y-1">
          {/* Language */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowLang(!showLang); }}
              className="flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[#86868b] hover:text-[#d2d2d7] hover:bg-white/[0.03] transition-all duration-200 w-full"
            >
              <Globe className="w-[18px] h-[18px] text-[#48484a]" strokeWidth={1.5} />
              <span className="text-[0.8125rem] font-medium">{LANGS.find(l => l.code === locale)?.flag} {LANGS.find(l => l.code === locale)?.label}</span>
            </button>
            {showLang && (
              <div className="absolute bottom-full left-0 mb-1.5 w-full apple-card p-1.5 space-y-0.5 animate-scale-in" onClick={e => e.stopPropagation()}>
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLocale(l.code); setShowLang(false); }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-all duration-200 ${
                      locale === l.code ? "bg-white/[0.07] text-white" : "text-[#86868b] hover:bg-white/[0.03] hover:text-[#d2d2d7]"
                    }`}
                  >
                    <span className="text-sm">{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="apple-separator mx-3 my-2" />

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D00] flex items-center justify-center text-white text-[0.6875rem] font-bold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] font-medium text-[#f5f5f7] truncate">{user?.name}</p>
              <p className="text-[0.6875rem] text-[#48484a] truncate">{user?.email}</p>
            </div>
            <button onClick={() => logout()} className="text-[#48484a] hover:text-[#FF453A] transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/[0.03]">
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 apple-vibrancy-ultra border-b-[0.5px] border-white/[0.06]">
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_LEGENDARIOS} alt="" className="w-6 h-6 rounded-lg object-cover" />
            <span className="text-[0.9375rem] font-semibold text-white tracking-[-0.02em]">Embaixadores</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowLang(!showLang); }}
              className="text-[#48484a] p-2 rounded-lg hover:bg-white/[0.03]"
            >
              <Globe className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <button onClick={() => logout()} className="text-[#48484a] hover:text-[#FF453A] p-2 rounded-lg hover:bg-white/[0.03]">
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        {showLang && (
          <div className="absolute right-3 top-full mt-1 apple-card p-1.5 min-w-[160px] animate-scale-in z-50" onClick={e => e.stopPropagation()}>
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setShowLang(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-all ${
                  locale === l.code ? "bg-white/[0.07] text-white" : "text-[#86868b] hover:bg-white/[0.03] hover:text-[#d2d2d7]"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Mobile Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 apple-vibrancy-ultra border-t-[0.5px] border-white/[0.06] safe-bottom">
        <div className="flex items-center justify-around px-1 pt-1 pb-0.5">
          {navItems.map((item) => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className="flex flex-col items-center gap-[2px] py-1 px-1.5 min-w-[50px]">
                  <item.icon
                    className={`w-[22px] h-[22px] transition-colors duration-200 ${active ? "text-[#FF6B00]" : "text-[#48484a]"}`}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  <span className={`text-[0.5625rem] font-medium transition-colors duration-200 ${active ? "text-[#FF6B00]" : "text-[#48484a]"}`}>
                    {item.label.length > 9 ? item.label.substring(0, 7) + "…" : item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="lg:ml-[260px] min-h-screen pt-12 pb-20 lg:pt-0 lg:pb-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
