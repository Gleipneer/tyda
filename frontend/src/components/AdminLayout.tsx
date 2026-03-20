import { NavLink } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { LayoutDashboard, Users, FileText, BookOpen, Database } from "lucide-react";

const links = [
  { to: "/admin", label: "Översikt", icon: LayoutDashboard, end: true },
  { to: "/admin/anvandare", label: "Användare", icon: Users },
  { to: "/admin/poster", label: "Poster", icon: FileText },
  { to: "/admin/begrepp", label: "Begrepp", icon: BookOpen },
  { to: "/admin/databasfragor", label: "Databasfrågor", icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-border/80 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-3">Adminportal</p>
          <nav className="flex flex-wrap gap-2">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}
