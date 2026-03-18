import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ContentCard from "@/components/ContentCard";

const topConcepts = [
  { name: "vatten", count: 8 },
  { name: "mörker", count: 6 },
  { name: "orm", count: 5 },
  { name: "ljus", count: 5 },
  { name: "eld", count: 4 },
  { name: "hav", count: 4 },
];

const categoryBreakdown = [
  { name: "Dröm", count: 18, pct: 43 },
  { name: "Reflektion", count: 12, pct: 29 },
  { name: "Vision", count: 6, pct: 14 },
  { name: "Tanke", count: 4, pct: 10 },
  { name: "Dikt", count: 2, pct: 5 },
];

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Analys"
        description="Statistik och mönster i ditt reflektionsarkiv."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatCard label="Totalt poster" value={42} />
        <StatCard label="Begrepp" value={39} />
        <StatCard label="Kopplingar" value={87} />
        <StatCard label="Snitt/post" value="2.1" sublabel="begrepp" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Top concepts */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Vanligaste begrepp</h2>
          <ContentCard>
            <div className="space-y-3">
              {topConcepts.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-body w-4 text-right">{i + 1}</span>
                  <span className="text-sm font-body font-medium text-foreground capitalize flex-1">{c.name}</span>
                  <div className="flex-1 max-w-32">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(c.count / topConcepts[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-body w-8 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Poster per kategori</h2>
          <ContentCard>
            <div className="space-y-3">
              {categoryBreakdown.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-sm font-body font-medium text-foreground w-24">{c.name}</span>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full transition-all"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-body w-12 text-right">{c.count} ({c.pct}%)</span>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      </div>
    </AppLayout>
  );
}
