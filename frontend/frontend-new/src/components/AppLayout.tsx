import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BookOpen,
  BarChart3,
  Activity,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/posts", label: "Poster", icon: FileText },
  { to: "/new-post", label: "Ny post", icon: PlusCircle },
  { to: "/concepts", label: "Begrepp", icon: BookOpen },
  { to: "/analytics", label: "Analys", icon: BarChart3 },
  { to: "/activity", label: "Aktivitet", icon: Activity },
  { to: "/about", label: "Om databasen", icon: HelpCircle },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="px-6 py-7">
            <h1 className="text-xl font-display font-semibold text-sidebar-foreground tracking-tight">
              Reflektionsarkiv
            </h1>
            <p className="text-xs text-sidebar-muted mt-1 font-body">Drömmar, tankar & symboler</p>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-6 py-5 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-muted font-body">Joakim Emilsson — YH24</p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-display font-semibold text-sidebar-foreground">Reflektionsarkiv</h1>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="px-3 pb-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:pl-64">
        <div className="pt-16 lg:pt-0 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
