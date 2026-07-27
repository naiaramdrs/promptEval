import { type ReactNode, useEffect, useState } from "react";
import { Menu, Database, KeyRound, History, Play } from "lucide-react";
import logoWhite from "@/assets/logo-white.svg";
import { Link, useLocation } from "react-router-dom";

type NavItem = { to: string; label: string; icon: typeof Database };

const NAV: NavItem[] = [
  { to: "/app/datasets", label: "Dataset", icon: Database },
  { to: "/app/credentials", label: "Chaves de API", icon: KeyRound },
  { to: "/app/evaluations", label: "Histórico", icon: History },
  { to: "/app/run", label: "Executar avaliação", icon: Play },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();

  // Open by default on desktop, closed on mobile.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setExpanded(window.matchMedia("(min-width: 768px)").matches);
    }
  }, []);

  // Close mobile drawer when navigating.
  useEffect(() => {
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches) {
      setExpanded(false);
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#242627] text-[#F3F3EE]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-white/10 bg-[#242627] px-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Toggle navigation"
          className="rounded p-2 text-[#F3F3EE] hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={logoWhite} alt="Prompt Eval" className="h-7 w-auto" />
      </header>

      <div className="relative flex flex-1">
        {/* Mobile backdrop */}
        {expanded && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setExpanded(false)}
            className="fixed inset-0 top-12 z-10 bg-black/50 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 top-12 z-20 shrink-0 border-r border-white/10 bg-[#242627] transition-transform duration-200 ease-out md:static md:top-0 md:translate-x-0 md:transition-[width] ${
            expanded
              ? "w-56 translate-x-0"
              : "w-56 -translate-x-full md:w-14"
          }`}
        >
          <nav className="flex flex-col py-2">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-white/5 text-[#FCC626]"
                      : "text-[#F3F3EE]/80 hover:bg-white/5 hover:text-[#F3F3EE]"
                  }`}
                  title={item.label}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-[#FCC626]" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={`truncate ${expanded ? "inline" : "hidden md:hidden"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 bg-[#F3F3EE] text-[#242627]">
          <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}