import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  BookOpen,
  Compass,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  User,
  X,
} from "lucide-react";
import { useActiveUser } from "@/contexts/ActiveUserContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { activeUser, clearActiveUser } = useActiveUser();
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems = activeUser
    ? [
        { to: "/mitt-rum", label: "Mitt rum", icon: Home },
        { to: "/new-post", label: "Ny post", icon: PlusCircle },
        { to: "/utforska", label: "Utforska", icon: Compass },
        { to: "/posts", label: "Mina poster", icon: FileText },
      ]
    : [
        { to: "/", label: "Start", icon: Home },
        { to: "/utforska", label: "Utforska", icon: Compass },
      ];

  const secondaryNavItems = [
    { to: "/concepts", label: "Begrepp", icon: BookOpen },
    ...(activeUser
      ? [
          { to: "/activity", label: "Aktivitet", icon: Activity },
          { to: "/analytics", label: "Analys", icon: BarChart3 },
          ...(activeUser.ar_admin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
        ]
      : []),
    { to: "/about", label: "Om Tyda", icon: HelpCircle },
  ];

  const handleSwitchUser = () => {
    clearActiveUser();
    setDrawerOpen(false);
    navigate("/?mode=login&session=switch#kom-igang");
  };

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 shrink-0 border-b border-border/70 bg-sidebar/95 text-sidebar-foreground backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/images/tyda-mark.png"
              alt="Tyda"
              className="h-9 w-9 shrink-0 rounded-full border border-sidebar-border/70 bg-sidebar-accent/20 p-0.5 object-contain"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-display font-semibold tracking-tight text-sidebar-foreground">
                Tyda
              </h1>
              <p className="hidden text-xs font-body text-sidebar-muted sm:block">
                Ditt rum för drömmar, tankar och symboler
              </p>
            </div>
          </Link>

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-1.5 md:flex">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/" || item.to === "/mitt-rum"}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-body transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/88 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {activeUser ? (
              <div className="flex items-center gap-2 rounded-full border border-sidebar-border/80 bg-sidebar-accent/70 px-2 py-1.5">
                <div className="min-w-0 px-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-muted">Aktiv profil</p>
                  <p className="max-w-[132px] truncate text-sm font-body text-sidebar-foreground">
                    {activeUser.anvandarnamn}
                    {activeUser.ar_admin ? (
                      <span className="ml-1.5 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:text-amber-100">
                        Admin
                      </span>
                    ) : null}
                  </p>
                </div>
                <Link
                  to="/mitt-rum"
                  className="inline-flex items-center gap-1 rounded-full bg-sidebar-primary px-3 py-1.5 text-xs font-body font-medium text-sidebar-primary-foreground transition-colors hover:opacity-90"
                >
                  <User className="h-3.5 w-3.5" />
                  Konto
                </Link>
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-body text-sidebar-foreground/88 transition-colors hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logga ut
                </button>
              </div>
            ) : (
              <Link
                to="/#kom-igang"
                className="inline-flex items-center rounded-full bg-sidebar-primary px-4 py-2 text-sm font-body font-medium text-sidebar-primary-foreground transition-colors hover:opacity-90"
              >
                Kom igång
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-sidebar-border/80 px-3 py-2 text-sm font-body text-sidebar-foreground transition-colors hover:bg-sidebar-accent md:hidden"
            aria-label="Öppna meny"
            aria-expanded={drawerOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-4 w-4" />
            Meny
          </button>
        </div>

        <div className="hidden border-t border-sidebar-border/70 lg:block">
          <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center gap-1.5">
              {secondaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-body transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                    }`
                  }
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <a
                href="/runbook.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-body text-sidebar-muted transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span>Runbook</span>
              </a>
            </nav>

            {activeUser ? (
              <button
                type="button"
                onClick={handleSwitchUser}
                className="inline-flex items-center gap-2 text-xs font-body text-sidebar-muted transition-colors hover:text-sidebar-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logga ut
              </button>
            ) : (
              <Link
                to="/#kom-igang"
                className="text-xs font-body text-sidebar-muted transition-colors hover:text-sidebar-foreground"
              >
                Öppna onboarding
              </Link>
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-navigation"
            className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(24rem,88vw)] flex-col border-l border-sidebar-border bg-sidebar shadow-xl"
            role="dialog"
            aria-label="Navigering"
            aria-modal="true"
          >
            <div className="border-b border-sidebar-border px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-body font-medium text-sidebar-foreground">Meny</p>
                  <p className="mt-1 text-xs font-body text-sidebar-muted">
                    Navigera i Tyda och byt snabbt profil.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 -mr-2 text-sidebar-muted transition-colors hover:text-sidebar-foreground"
                  aria-label="Stäng meny"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {activeUser ? (
                <div className="mt-4 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-sidebar-muted">Aktiv profil</p>
                  <p className="mt-1 text-base font-body font-medium text-sidebar-foreground">
                    {activeUser.anvandarnamn}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/mitt-rum"
                      onClick={() => setDrawerOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-3.5 py-2 text-xs font-body font-medium text-sidebar-primary-foreground"
                    >
                      <User className="h-3.5 w-3.5" />
                      Mitt konto
                    </Link>
                    <button
                      type="button"
                      onClick={handleSwitchUser}
                      className="inline-flex items-center gap-2 rounded-full border border-sidebar-border/80 px-3.5 py-2 text-xs font-body text-sidebar-foreground"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logga ut
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/60 p-4">
                  <p className="text-sm font-body text-sidebar-foreground">
                    Logga in eller skapa konto för att öppna ditt rum.
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-0.5">
                {mainNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/" || item.to === "/mitt-rum"}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="mt-6 border-t border-sidebar-border pt-4">
                <p className="mb-2 px-3 text-xs font-body uppercase tracking-wider text-sidebar-muted">Mer</p>
                <div className="space-y-0.5">
                  {secondaryNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body font-medium transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                  <a
                    href="/runbook.md"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    Runbook
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-sidebar-border px-4 py-4">
              {activeUser ? (
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  className="inline-flex items-center gap-2 text-xs text-sidebar-muted hover:text-sidebar-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logga ut
                </button>
              ) : (
                <Link
                  to="/#kom-igang"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex items-center rounded-full bg-sidebar-primary px-4 py-2 text-sm font-body font-medium text-sidebar-primary-foreground"
                >
                  Kom igång
                </Link>
              )}
            </div>
          </aside>
        </>
      )}

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
