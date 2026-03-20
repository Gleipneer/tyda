import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchAdminStats } from "@/services/admin";
import { Users, FileText, BookOpen, ArrowRight } from "lucide-react";

export default function AdminOverviewPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Översikt"
        description="Snabb kontroll över innehåll i Tyda. Alla åtgärder valideras även i backend."
      />

      {error && (
        <ContentCard className="mb-6 border-destructive/40">
          <p className="text-sm text-destructive font-body">Kunde inte ladda statistik. Är du inloggad som admin?</p>
        </ContentCard>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        <StatTile icon={Users} label="Användare" value={isLoading ? "…" : stats?.antal_anvandare ?? "–"} to="/admin/anvandare" />
        <StatTile icon={FileText} label="Poster" value={isLoading ? "…" : stats?.antal_poster ?? "–"} to="/admin/poster" />
        <StatTile icon={BookOpen} label="Begrepp" value={isLoading ? "…" : stats?.antal_begrepp ?? "–"} to="/admin/begrepp" />
      </div>

      <ContentCard>
        <h2 className="text-base font-display font-semibold text-foreground mb-3">Snabbnavigering</h2>
        <ul className="space-y-2 text-sm font-body text-muted-foreground">
          <li>
            <Link className="inline-flex items-center gap-2 text-primary hover:underline" to="/admin/anvandare">
              Hantera användare <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </li>
          <li>
            <Link className="inline-flex items-center gap-2 text-primary hover:underline" to="/admin/poster">
              Alla poster <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </li>
          <li>
            <Link className="inline-flex items-center gap-2 text-primary hover:underline" to="/admin/begrepp">
              Lexikon / begrepp <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </li>
          <li>
            <Link className="inline-flex items-center gap-2 text-primary hover:underline" to="/admin/databasfragor">
              Databasfrågor (VG) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </li>
        </ul>
      </ContentCard>
    </AdminLayout>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  to: string;
}) {
  return (
    <Link to={to}>
      <ContentCard className="h-full transition-colors hover:border-primary/30 hover:bg-accent/20">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">{label}</p>
            <p className="text-2xl font-display font-semibold text-foreground">{value}</p>
          </div>
        </div>
      </ContentCard>
    </Link>
  );
}
